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

    const [mountDialog, setMountDialog] = useState<{ isOpen: boolean; partition: string | null }>({ isOpen: false, partition: null });
    const [mountForm, setMountForm] = useState({ target: '', fstype: '', options: '' });

    const openMountDialog = (partitionName: string) => {
        setMountDialog({ isOpen: true, partition: partitionName });
        setMountForm({ target: '', fstype: '', options: '' });
    };

    const handleMount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mountDialog.partition || !mountForm.target) return;

        setProcessing(mountDialog.partition);
        // Find the full path for the partition name (approximate since we don't have the map handy here easily, 
        // but backend expects 'source' which is usually device path like /dev/sda1)
        // We need to pass the device path. Let's look it up from the disks data.
        let devicePath = '';
        disks.forEach(d => {
            d.partitions?.forEach(p => {
                if (p.name === mountDialog.partition) {
                    // Assuming partition name is like sda1, and path is like /dev/sda1
                    // Actually lsblk output: name="sda1", path="/dev/sda1" (based on LinuxDiskService)
                    // Wait, LinuxDiskService uses "path" from lsblk.
                    // The Frontend "SystemPartition" type might need verification. 
                    // Let's rely on finding it in the disks list.
                    devicePath = p.path || `/dev/${p.name}`;
                }
            });
        });

        try {
            await DiskService.mount(devicePath, mountForm.target, mountForm.fstype, mountForm.options);
            await fetchDisks();
            setMountDialog({ isOpen: false, partition: null });
        } catch (error: any) {
            console.error('Failed to mount:', error);
            alert(`Failed to mount: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
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
                                                            onClick={() => handleUnmount(part.mountpoint!)}
                                                            disabled={!!processing}
                                                            className="text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
                                                        >
                                                            Unmount
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openMountDialog(part.name)}
                                                            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-2 py-1 hover:bg-emerald-500/10 rounded"
                                                            disabled={!!processing}
                                                        >
                                                            Mount
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

            {/* Mount Dialog */}
            {mountDialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4">Mount Partition: {mountDialog.partition}</h3>
                        <form onSubmit={handleMount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Mount Point (Target)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="/mnt/data"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    value={mountForm.target}
                                    onChange={e => setMountForm({ ...mountForm, target: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Filesystem Type <span className="text-zinc-600">(Optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="ext4, ntfs, etc."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    value={mountForm.fstype}
                                    onChange={e => setMountForm({ ...mountForm, fstype: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Mount Options <span className="text-zinc-600">(Optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="defaults, noatime"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    value={mountForm.options}
                                    onChange={e => setMountForm({ ...mountForm, options: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setMountDialog({ isOpen: false, partition: null })}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!processing}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Mounting...' : 'Mount'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiskManager;
