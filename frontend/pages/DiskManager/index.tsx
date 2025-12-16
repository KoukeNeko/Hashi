import React, { useState, useEffect } from 'react';
import { HardDrive, RotateCw, Server, Usb, AlertTriangle } from 'lucide-react';
import { SystemDisk } from '../../types';
import { DiskService } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';

const DiskManager: React.FC = () => {
    const [disks, setDisks] = useState<SystemDisk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchDisks();
    }, []);

    const fetchDisks = async () => {
        setIsLoading(true);
        try {
            const data = await DiskService.list();
            setDisks(data);
        } catch (error) {
            console.error('Failed to fetch disks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnmount = async (target: string) => {
        if (!confirm(`Unmount ${target}?`)) return;
        setProcessing(target);
        try {
            await DiskService.unmount(target);
            await fetchDisks();
        } catch (error) {
            console.error('Failed to unmount:', error);
            alert('Failed to unmount');
        } finally {
            setProcessing(null);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Disk Management"
                icon={HardDrive}
                description="Manage physical disks, partitions, and mount points"
                actions={
                    <button
                        onClick={fetchDisks}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

            <div className="space-y-6">
                {isLoading && disks.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">Loading disks...</div>
                ) : (
                    disks.map((disk) => (
                        <div key={disk.name} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                            {/* Disk Header */}
                            <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${disk.removable ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {disk.removable ? <Usb size={20} /> : <Server size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {disk.name}
                                            <span className="text-sm font-normal text-zinc-500 font-mono">({disk.path})</span>
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            {disk.model} {disk.serial ? `(SN: ${disk.serial})` : ''} • {formatBytes(disk.size)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded border ${disk.type === 'disk' ? 'border-zinc-700 text-zinc-400' : 'border-blue-500/30 text-blue-400'
                                        }`}>
                                        {disk.type.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Partitions Table */}
                            {disk.partitions && disk.partitions.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/40 text-zinc-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-2 font-medium">Partition</th>
                                            <th className="px-6 py-2 font-medium">Size</th>
                                            <th className="px-6 py-2 font-medium">Filesystem</th>
                                            <th className="px-6 py-2 font-medium">Mount Point</th>
                                            <th className="px-6 py-2 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {disk.partitions.map((part) => (
                                            <tr key={part.name} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-3 font-medium text-zinc-300 font-mono">{part.name}</td>
                                                <td className="px-6 py-3 text-zinc-400">{formatBytes(part.size)}</td>
                                                <td className="px-6 py-3 text-emerald-400">{part.fstype || '-'}</td>
                                                <td className="px-6 py-3 text-zinc-300">{part.mountpoint || '-'}</td>
                                                <td className="px-6 py-3 text-right">
                                                    {part.mountpoint ? (
                                                        <button
                                                            onClick={() => handleUnmount(part.mountpoint)}
                                                            disabled={!!processing}
                                                            className="text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
                                                        >
                                                            Unmount
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="text-zinc-500 cursor-not-allowed text-xs font-medium px-2 py-1"
                                                            disabled
                                                        >
                                                            Mount (TODO)
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-6 py-8 text-center text-zinc-500 flex flex-col items-center">
                                    <AlertTriangle size={24} className="mb-2 opacity-50" />
                                    No partitions found. Uninitialized disk?
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DiskManager;
