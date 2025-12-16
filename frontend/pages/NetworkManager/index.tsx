import React, { useState, useEffect } from 'react';
import { Network, Activity, RotateCw, Wifi, Globe, Shield } from 'lucide-react';
import { NetworkInterface } from '../../types';
import { NetworkService } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';

const NetworkManager: React.FC = () => {
    const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchInterfaces();
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

    const getIpAddress = (iface: NetworkInterface, family: 'inet' | 'inet6') => {
        const addr = iface.addrInfo.find(a => a.family === family);
        return addr ? `${addr.local}/${addr.prefixlen}` : '-';
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Network Management"
                icon={Network}
                description="Monitor network interfaces and connectivity"
                actions={
                    <button
                        onClick={fetchInterfaces}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

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
        </div>
    );
};

export default NetworkManager;
