import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { INITIAL_CPU_DATA, MOCK_NGINX_HOSTS, MOCK_CONTAINERS, MOCK_FIREWALL_RULES } from '../constants';
import { Server, Database, ChevronRight, Terminal, Power, Globe, Shield, Activity } from 'lucide-react';
import { connectWebSocket } from '../services/api';
import { SystemStatus } from '../types';

const CircularGauge = ({ value, label, subLabel, color = "#10b981" }: { value: number, label: string, subLabel: string, color?: string }) => {
    // Two layers: Track (gray) and Progress (colored)
    // We use a simple calculation for endAngle to represent percentage
    const startAngle = 90;
    const endAngle = 90 - (360 * value) / 100;

    const data = [
        { name: 'Value', value: value },
    ];

    return (
        <div className="flex flex-col items-center justify-center p-4">
             <div className="relative w-[140px] h-[140px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        {/* Track Circle */}
                        <Pie
                            data={[{ value: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={66}
                            startAngle={90}
                            endAngle={-270}
                            fill="#27272a"
                            stroke="none"
                            dataKey="value"
                            isAnimationActive={false}
                        />
                        {/* Progress Circle */}
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={66}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={color}
                            stroke="none"
                            dataKey="value"
                            cornerRadius={10}
                            paddingAngle={0}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-white tracking-tight">{Math.round(value)}%</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                 <h3 className="text-zinc-200 font-bold text-sm">{label}</h3>
                 <p className="text-zinc-500 text-xs mt-1 font-medium uppercase tracking-wide">{subLabel}</p>
            </div>
        </div>
    );
};

const QuickStat = ({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) => (
    <div className="flex-1 bg-surface border border-border p-5 rounded-lg flex justify-between items-center group hover:border-zinc-600 transition-colors cursor-pointer">
        <div>
            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
            <Icon size={24} strokeWidth={2} />
        </div>
        <ChevronRight className="text-zinc-700 group-hover:text-zinc-400 transition-colors absolute top-5 right-5" size={16} />
    </div>
);

const SoftwareCard = ({ name, version, status, icon: Icon, colorClass }: { name: string, version: string, status: boolean, icon: any, colorClass: string }) => (
    <div className="bg-zinc-900 border border-border p-4 rounded-lg flex flex-col items-center justify-center gap-3 relative group hover:border-zinc-700 transition-all">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 mb-1`}>
             <Icon size={28} strokeWidth={1.5} />
        </div>
        <div className="text-center">
            <h4 className="text-zinc-200 font-bold text-sm">{name}</h4>
            <span className="text-zinc-500 text-xs font-mono">{version}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 bg-zinc-950 px-2 py-1 rounded-full border border-zinc-800">
             <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
             <span className={`text-[10px] font-bold uppercase tracking-wide ${status ? 'text-emerald-500' : 'text-rose-500'}`}>{status ? 'Running' : 'Stopped'}</span>
        </div>
    </div>
);

const SystemOverview: React.FC = () => {
  const [cpuData, setCpuData] = useState(INITIAL_CPU_DATA);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket
  useEffect(() => {
    const client = connectWebSocket((status) => {
      setSystemStatus(status);
      setLoading(false);
      setConnected(true);
      setError(null);
    });

    // Handle connection error after timeout
    const timeout = setTimeout(() => {
      if (!connected && loading) {
        setError('Failed to connect to server');
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      client.deactivate();
    };
  }, []);

  // Update network chart when systemStatus changes
  useEffect(() => {
    if (systemStatus?.network) {
      setCpuData(prev => {
        const newDown = systemStatus.network.downloadRate / 1024; // Convert to KB
        const newUp = systemStatus.network.uploadRate / 1024; // Convert to KB
        return [...prev.slice(1), { name: '', uv: 0, down: newDown, up: newUp }];
      });
    }
  }, [systemStatus]);

  // Helper function to format bytes to human readable
  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(0)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // Helper function to format bytes for disk (GB)
  const formatDiskSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(2)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  // Helper function to format network rate
  const formatNetworkRate = (bytesPerSec: number): string => {
    if (bytesPerSec >= 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    if (bytesPerSec >= 1024) {
      return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
    }
    return `${bytesPerSec} B/s`;
  };

  // Helper function to format total network traffic
  const formatNetworkTotal = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(2)} TB`;
    }
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get disk usage percentage
  const getDiskPercent = (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  // Get color based on percentage
  const getDiskColor = (percent: number): string => {
    if (percent >= 90) return '#ef4444'; // red
    if (percent >= 70) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  // Calculate load percentage (assuming max load = number of cores)
  const getLoadPercentage = (): number => {
    if (!systemStatus) return 0;
    return Math.min(100, (systemStatus.systemLoad / systemStatus.coreCount) * 100);
  };

  const dbCount = MOCK_CONTAINERS.filter(c => c.name.includes('db') || c.name.includes('redis') || c.name.includes('sql')).length;
  
  return (
    <div className="space-y-6 animate-fade-in pb-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4  pb-6">
             <div className="flex items-center gap-4">
                 <div className="p-3 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700 shadow-lg">
                    <Server size={32} className="text-emerald-500" />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-white">hashi-node-01</h2>
                     <p className="text-zinc-400 text-sm flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Activity size={14} className="text-emerald-500" /> 
                          {loading ? 'Loading...' : (systemStatus?.osName || 'Unknown')}
                        </span>
                        <span className="text-zinc-700">|</span>
                        <span>{systemStatus?.coreCount || '--'} Core(s)</span>
                     </p>
                 </div>
             </div>
             <div className="flex gap-3 w-full lg:w-auto">
                 <div className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium border border-zinc-700 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span className="hidden sm:inline">{connected ? 'Live' : 'Connecting...'}</span>
                 </div>
                 <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-all border border-zinc-700 hover:border-zinc-600 shadow-sm">
                    <Terminal size={16} /> <span className="hidden sm:inline">Fix</span>
                 </button>
                 <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:border-rose-500/30 rounded-lg text-sm font-medium transition-all shadow-sm">
                    <Power size={16} /> <span className="hidden sm:inline">Restart</span>
                 </button>
             </div>
        </div>
        
        {/* Top Section: Status Gauges & Disk */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* System Status Gauges */}
            <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white">Sys Status</h3>
                    {error && <span className="text-rose-500 text-xs">{error}</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-800/50 mt-4">
                    <CircularGauge 
                        value={getLoadPercentage()} 
                        label={systemStatus ? (getLoadPercentage() < 50 ? 'Smooth operation' : getLoadPercentage() < 80 ? 'Moderate load' : 'High load') : '--'}
                        subLabel="Load Status" 
                        color={getLoadPercentage() < 50 ? '#10b981' : getLoadPercentage() < 80 ? '#f59e0b' : '#ef4444'} 
                    />
                    <CircularGauge 
                        value={systemStatus?.cpuUsage || 0} 
                        label={`${systemStatus?.coreCount || '--'} Core(s)`}
                        subLabel="CPU Usage" 
                        color={systemStatus && systemStatus.cpuUsage > 80 ? '#ef4444' : systemStatus && systemStatus.cpuUsage > 50 ? '#f59e0b' : '#10b981'} 
                    />
                    <CircularGauge 
                        value={systemStatus?.memoryUsage || 0} 
                        label={systemStatus ? `${formatBytes(systemStatus.usedMemory)} / ${formatBytes(systemStatus.totalMemory)}` : '-- / --'}
                        subLabel="RAM Usage" 
                        color={systemStatus && systemStatus.memoryUsage > 80 ? '#ef4444' : systemStatus && systemStatus.memoryUsage > 50 ? '#f59e0b' : '#10b981'} 
                    />
                </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-lg flex flex-col justify-start relative overflow-hidden">
                 <h3 className="text-lg font-bold text-white mb-6 relative z-10">Disk</h3>
                 <div className="space-y-6 relative z-10">
                    {systemStatus?.disks?.map((disk) => {
                        const percent = getDiskPercent(disk.usedSpace, disk.totalSpace);
                        const color = getDiskColor(percent);
                        return (
                            <div key={disk.mount}>
                                <div className="flex justify-between mb-2 items-end">
                                    <span className="text-xs font-mono font-bold bg-zinc-800 px-2 py-1 rounded text-zinc-400">{disk.mount}</span>
                                    <div className="text-right">
                                        <span className="text-sm font-bold mr-1.5" style={{ color }}>{percent}%</span>
                                        <span className="text-[10px] text-zinc-500">{formatDiskSize(disk.usedSpace)} / {formatDiskSize(disk.totalSpace)}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800/50">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out relative" 
                                        style={{ width: `${percent}%`, backgroundColor: color }}
                                    >
                                        <div className="absolute inset-0 bg-white/20"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) || (
                        <div className="text-zinc-500 text-sm">Loading disk info...</div>
                    )}
                 </div>
                 {/* Decorative background element */}
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>
        </div>

        {/* Middle Section: Quick Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Websites" value={MOCK_NGINX_HOSTS.length} icon={Globe} colorClass="bg-blue-500 text-blue-400" />
            <QuickStat label="Databases" value={dbCount} icon={Database} colorClass="bg-purple-500 text-purple-400" />
            <QuickStat label="FTP" value={1} icon={Server} colorClass="bg-amber-500 text-amber-400" />
            <QuickStat label="Security" value={MOCK_FIREWALL_RULES.length} icon={Shield} colorClass="bg-rose-500 text-rose-400" />
        </div>

        {/* Bottom Section: Software Grid & Traffic Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Software Grid */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6">Software</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <SoftwareCard name="Nginx" version="1.22.1" status={true} icon={Globe} colorClass="text-emerald-500 bg-emerald-500" />
                     <SoftwareCard name="MySQL" version="5.7.43" status={true} icon={Database} colorClass="text-blue-500 bg-blue-500" />
                     <SoftwareCard name="PHP" version="8.2.0" status={true} icon={Terminal} colorClass="text-purple-500 bg-purple-500" />
                     <SoftwareCard name="Docker" version="24.0.6" status={true} icon={Server} colorClass="text-sky-500 bg-sky-500" />
                     <SoftwareCard name="UFW" version="0.36.1" status={false} icon={Shield} colorClass="text-orange-500 bg-orange-500" />
                     <SoftwareCard name="Redis" version="7.0.12" status={true} icon={Database} colorClass="text-red-500 bg-red-500" />
                </div>
            </div>

            {/* Network Traffic */}
            <div className="xl:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-lg flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                     <h3 className="text-lg font-bold text-white">Network Traffic</h3>
                     <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                         <div className="flex flex-col min-w-[80px]">
                             <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span> Upload</span>
                             <span className="font-mono text-zinc-200 font-bold text-lg">{systemStatus?.network ? formatNetworkRate(systemStatus.network.uploadRate) : '--'}</span>
                         </div>
                         <div className="flex flex-col min-w-[80px]">
                             <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span> Download</span>
                             <span className="font-mono text-zinc-200 font-bold text-lg">{systemStatus?.network ? formatNetworkRate(systemStatus.network.downloadRate) : '--'}</span>
                         </div>
                          <div className="flex flex-col min-w-[80px] border-l border-zinc-800 pl-4">
                             <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wide mb-1">Total Sent</span>
                             <span className="font-mono text-zinc-200 font-bold">{systemStatus?.network ? formatNetworkTotal(systemStatus.network.totalSent) : '--'}</span>
                         </div>
                         <div className="flex flex-col min-w-[80px]">
                             <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wide mb-1">Total Recv</span>
                             <span className="font-mono text-zinc-200 font-bold">{systemStatus?.network ? formatNetworkTotal(systemStatus.network.totalRecv) : '--'}</span>
                         </div>
                     </div>
                </div>

                <div className="flex-1 w-full h-64 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuData}>
                            <defs>
                                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis 
                                stroke="#52525b" 
                                fontSize={10} 
                                tickFormatter={(value) => `${value}KB`}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                labelStyle={{ display: 'none' }}
                                cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="down" 
                                name="Downstream" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorDown)" 
                                animationDuration={1000}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="up" 
                                name="Upstream" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorUp)" 
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SystemOverview;