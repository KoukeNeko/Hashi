import React, { useState, useEffect } from 'react';
import { Network, Activity, RotateCw, Globe, Server } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { NetworkInterface, SystemStatus } from '../../types';
import { NetworkService, connectWebSocket } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { FormDialog, useFormDialog } from '../../components/ui/Form';

const NetworkManager: React.FC = () => {
    const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
    const [trafficHistory, setTrafficHistory] = useState<Record<string, { time: number; rx: number; tx: number }[]>>({});
    const [dnsConfig, setDnsConfig] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDnsLoading, setIsDnsLoading] = useState(false);
    const usesFormDialog = useFormDialog<{ nameservers: string }>();

    useEffect(() => {
        fetchInterfaces();
        fetchDns();

        const client = connectWebSocket((status: SystemStatus) => {
            if (status.network?.details) {
                setTrafficHistory(prev => {
                    const next = { ...prev };
                    const now = Date.now();
                    status.network.details.forEach(stat => {
                        // Immutable update pattern
                        if (!next[stat.name]) {
                            next[stat.name] = [];
                        } else {
                            next[stat.name] = [...next[stat.name]];
                        }

                        // Add new data point
                        next[stat.name].push({
                            time: now,
                            rx: Math.max(0, stat.downloadRate), // Clean data
                            tx: Math.max(0, stat.uploadRate)
                        });

                        // Keep last 60 points
                        if (next[stat.name].length > 60) {
                            next[stat.name].shift();
                        }
                    });
                    return next;
                });
            }
        });

        return () => {
            client.deactivate();
        };
    }, []);

    const fetchInterfaces = async () => {
        setIsLoading(true);
        try {
            const data = await NetworkService.listInterfaces();
            setInterfaces(data);
        } catch (error) {
            console.error('Failed to fetch network interfaces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDns = async () => {
        setIsDnsLoading(true);
        try {
            const data = await NetworkService.getDns();
            setDnsConfig(data);
        } catch (error) {
            console.error('Failed to fetch DNS config:', error);
        } finally {
            setIsDnsLoading(false);
        }
    };

    const handleUpdateDns = async (values: { nameservers: string }) => {
        const servers = values.nameservers.split(/[,\s]+/).filter(Boolean);
        try {
            await NetworkService.updateDns(servers);
            await fetchDns();
        } catch (error: any) {
            console.error('Failed to update DNS:', error);
            throw new Error(`Failed to update DNS: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    const getIpAddress = (iface: NetworkInterface, family: 'inet' | 'inet6') => {
        const addr = iface.addrInfo.find(a => a.family === family);
        return addr ? `${addr.local}/${addr.prefixlen}` : '-';
    };

    const formatSpeed = (bytes: number) => {
        if (!bytes || bytes < 0) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const index = Math.min(i, sizes.length - 1);
        return parseFloat((bytes / Math.pow(k, index)).toFixed(1)) + ' ' + sizes[index];
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Network Management"
                icon={Network}
                description="Monitor network interfaces and connectivity"
                actions={
                    <button
                        onClick={() => { fetchInterfaces(); fetchDns(); }}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

            {/* DNS Configuration Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Server size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">DNS Configuration</h3>
                            <p className="text-sm text-zinc-500">System Nameservers ({dnsConfig.length})</p>
                        </div>
                    </div>
                    <button
                        onClick={() => usesFormDialog.open({ nameservers: dnsConfig.join(', ') })}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors"
                    >
                        Edit Configuration
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isDnsLoading ? (
                        <span className="text-zinc-500 text-sm animate-pulse">Loading DNS...</span>
                    ) : dnsConfig.length > 0 ? (
                        dnsConfig.map((ns, i) => (
                            <span key={i} className="px-3 py-1 bg-zinc-800 rounded-full text-sm font-mono text-zinc-300 border border-zinc-700">
                                {ns}
                            </span>
                        ))
                    ) : (
                        <span className="text-zinc-500 text-sm italic">No nameservers configured</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading && interfaces.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-zinc-500">Loading interfaces...</div>
                ) : (
                    interfaces.map((iface) => (
                        <div key={iface.ifindex} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${iface.operstate === 'UP' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">{iface.ifname}</h3>
                                        <p className="text-xs font-mono text-zinc-500">{iface.address || '00:00:00:00:00:00'}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${iface.operstate === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {iface.operstate}
                                </span>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Globe size={16} />
                                        <span className="text-sm">IPv4 Address</span>
                                    </div>
                                    <span className="text-sm font-mono text-white">{getIpAddress(iface, 'inet')}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Globe size={16} />
                                        <span className="text-sm">IPv6 Address</span>
                                    </div>
                                    <span className="text-sm font-mono text-white w-32 truncate text-right" title={getIpAddress(iface, 'inet6')}>
                                        {getIpAddress(iface, 'inet6')}
                                    </span>
                                </div>

                                {/* Traffic Chart */}
                                <div className="h-32 mt-4 bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/50">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trafficHistory[iface.ifname] || []}>
                                            <defs>
                                                <linearGradient id={`colorRx-${iface.ifname}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id={`colorTx-${iface.ifname}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
                                                itemStyle={{ fontSize: '12px', padding: 0 }}
                                                formatter={(value: number) => formatSpeed(value)}
                                                labelFormatter={() => ''}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="rx"
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill={`url(#colorRx-${iface.ifname})`}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="tx"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill={`url(#colorTx-${iface.ifname})`}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-emerald-500">RX: {formatSpeed(trafficHistory[iface.ifname]?.slice(-1)[0]?.rx || 0)}</span>
                                    <span className="text-blue-500">TX: {formatSpeed(trafficHistory[iface.ifname]?.slice(-1)[0]?.tx || 0)}</span>
                                </div>

                                <div className="border-t border-zinc-800 pt-4 mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-1">MTU</span>
                                        <span className="text-sm text-zinc-300 font-mono">{iface.mtu}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block mb-1">QDisc</span>
                                        <span className="text-sm text-zinc-300 font-mono">{iface.qdisc}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <FormDialog
                isOpen={usesFormDialog.isOpen}
                onClose={usesFormDialog.close}
                onSubmit={handleUpdateDns}
                title="Configure DNS"
                initialValues={usesFormDialog.data || {}}
                fields={[
                    { name: 'nameservers', label: 'Nameservers', placeholder: '8.8.8.8, 1.1.1.1', hint: 'Comma or space separated IP addresses', required: true }
                ]}
            />
        </div>
    );
};

export default NetworkManager;
