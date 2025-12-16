import React, { useState, useEffect } from 'react';
import { HardDrive, RotateCw, Server, Usb, AlertTriangle, AlertCircle } from 'lucide-react';
import { SystemDisk } from '../../types';
import { DiskService } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { FormDialog, FormDialogField } from '../../components/ui/Form';

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

    // Dialog States
    const [mountDialog, setMountDialog] = useState<{ isOpen: boolean; partition: string | null }>({ isOpen: false, partition: null });
    const [formatDialog, setFormatDialog] = useState<{ isOpen: boolean; partition: string | null }>({ isOpen: false, partition: null });
    const [createDialog, setCreateDialog] = useState<{ isOpen: boolean; disk: SystemDisk | null }>({ isOpen: false, disk: null });
    const [resizeDialog, setResizeDialog] = useState<{ isOpen: boolean; disk: SystemDisk | null; partitionName: string; partitionNumber: number }>({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 });
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; disk: SystemDisk | null; partitionName: string; partitionNumber: number }>({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 });

    const getPartitionNumber = (name: string): number => {
        const match = name.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    };

    // Handlers
    const handleMountSubmit = async (values: any) => {
        if (!mountDialog.partition) return;
        setProcessing(mountDialog.partition);

        let devicePath = '';
        disks.forEach(d => {
            d.partitions?.forEach(p => {
                if (p.name === mountDialog.partition) {
                    devicePath = p.path || `/dev/${p.name}`;
                }
            });
        });

        try {
            await DiskService.mount(devicePath, values.target, values.fstype, values.options);
            await fetchDisks();
            setMountDialog({ isOpen: false, partition: null });
        } catch (error: any) {
            console.error('Failed to mount:', error);
            throw new Error(`Failed to mount: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleFormatSubmit = async (values: any) => {
        if (!formatDialog.partition) return;
        setProcessing(formatDialog.partition);

        let devicePath = '';
        disks.forEach(d => {
            d.partitions?.forEach(p => {
                if (p.name === formatDialog.partition) {
                    devicePath = p.path || `/dev/${p.name}`;
                }
            });
            if (d.name === formatDialog.partition) {
                devicePath = d.path || `/dev/${d.name}`;
            }
        });

        try {
            await DiskService.format(devicePath, values.fstype, values.label);
            alert(`Format started for ${devicePath}. This may take a while.`);
            setFormatDialog({ isOpen: false, partition: null });
            setTimeout(fetchDisks, 2000);
        } catch (error: any) {
            console.error('Failed to format:', error);
            throw new Error(`Failed to format: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleCreateSubmit = async (values: any) => {
        if (!createDialog.disk) return;
        setProcessing(`create-${createDialog.disk.name}`);
        try {
            await DiskService.createPartition(createDialog.disk.path, values.fstype, values.start, values.end);
            await fetchDisks();
            setCreateDialog({ isOpen: false, disk: null });
        } catch (error: any) {
            console.error('Failed to create partition:', error);
            throw new Error(`Failed to create partition: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleResizeSubmit = async (values: any) => {
        if (!resizeDialog.disk) return;
        setProcessing(`resize-${resizeDialog.partitionName}`);
        try {
            await DiskService.resizePartition(resizeDialog.disk.path, resizeDialog.partitionNumber, values.end);
            alert('Resize completed. Check filesystem status.');
            await fetchDisks();
            setResizeDialog({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 });
        } catch (error: any) {
            console.error('Failed to resize partition:', error);
            throw new Error(`Failed to resize partition: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.disk) return;
        setProcessing(`delete-${deleteDialog.partitionName}`);
        try {
            await DiskService.deletePartition(deleteDialog.disk.path, deleteDialog.partitionNumber);
            await fetchDisks();
            setDeleteDialog({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 });
        } catch (error: any) {
            console.error('Failed to delete partition:', error);
            alert(`Failed to delete partition: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    // Field Definitions
    const mountFields: FormDialogField[] = [
        { name: 'target', label: 'Mount Point (Target)', placeholder: '/mnt/data', required: true },
        { name: 'fstype', label: 'Filesystem Type', placeholder: 'ext4, ntfs, etc.', hint: 'Optional' },
        { name: 'options', label: 'Mount Options', placeholder: 'defaults, noatime', hint: 'Optional' },
    ];

    const formatFields: FormDialogField[] = [
        {
            name: 'fstype', label: 'Filesystem Type', type: 'select', options: [
                { value: 'ext4', label: 'ext4 (Linux Default)' },
                { value: 'xfs', label: 'xfs' },
                { value: 'vfat', label: 'vfat (Universal)' },
                { value: 'ntfs', label: 'ntfs (Windows)' },
            ], required: true, defaultValue: 'ext4'
        },
        { name: 'label', label: 'Label', placeholder: 'DATA_DISK', hint: 'Optional' },
        { name: 'confirmation', label: 'Confirmation', placeholder: 'Type FORMAT to confirm', required: true },
    ];

    const createFields: FormDialogField[] = [
        {
            name: 'fstype', label: 'Filesystem Type', type: 'select', options: [
                { value: 'ext4', label: 'ext4' },
                { value: 'xfs', label: 'xfs' },
                { value: 'btrfs', label: 'btrfs' },
            ], required: true, defaultValue: 'ext4'
        },
        { name: 'start', label: 'Start Position', placeholder: '0%, 10GB', required: true, defaultValue: '0%' },
        { name: 'end', label: 'End Position', placeholder: '100%, 50GB', required: true, defaultValue: '100%' },
    ];

    const resizeFields: FormDialogField[] = [
        { name: 'end', label: 'New End Position', placeholder: '100%, 50GB', required: true, defaultValue: '100%' },
    ];

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
                                <div className="text-right flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded border ${disk.type === 'disk' ? 'border-zinc-700 text-zinc-400' : 'border-blue-500/30 text-blue-400'
                                        }`}>
                                        {disk.type.toUpperCase()}
                                    </span>
                                    <button
                                        onClick={() => setCreateDialog({ isOpen: true, disk })}
                                        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-2 py-1 hover:bg-emerald-500/10 rounded"
                                    >
                                        + Partition
                                    </button>
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
                                                <td className="px-6 py-3 text-right flex justify-end gap-2">
                                                    {part.mountpoint ? (
                                                        <button
                                                            onClick={() => handleUnmount(part.mountpoint!)}
                                                            disabled={!!processing}
                                                            className="text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
                                                        >
                                                            Unmount
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setMountDialog({ isOpen: true, partition: part.name })}
                                                                className="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-2 py-1 hover:bg-emerald-500/10 rounded"
                                                                disabled={!!processing}
                                                            >
                                                                Mount
                                                            </button>
                                                            <button
                                                                onClick={() => setResizeDialog({
                                                                    isOpen: true,
                                                                    disk,
                                                                    partitionName: part.name,
                                                                    partitionNumber: getPartitionNumber(part.name)
                                                                })}
                                                                className="text-blue-400 hover:text-blue-300 text-xs font-medium px-2 py-1 hover:bg-blue-500/10 rounded"
                                                                disabled={!!processing}
                                                            >
                                                                Resize
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteDialog({
                                                                    isOpen: true,
                                                                    disk,
                                                                    partitionName: part.name,
                                                                    partitionNumber: getPartitionNumber(part.name)
                                                                })}
                                                                className="text-rose-400 hover:text-rose-300 text-xs font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
                                                                disabled={!!processing}
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => setFormatDialog({ isOpen: true, partition: part.name })}
                                                                className="text-amber-400 hover:text-amber-300 text-xs font-medium px-2 py-1 hover:bg-amber-500/10 rounded"
                                                                disabled={!!processing}
                                                            >
                                                                Format
                                                            </button>
                                                        </>
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
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setCreateDialog({ isOpen: true, disk })}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                                        >
                                            Create First Partition
                                        </button>
                                        <button
                                            onClick={() => setFormatDialog({ isOpen: true, partition: disk.name })}
                                            className="ml-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium"
                                        >
                                            Format Disk
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Mount Dialog */}
            <FormDialog
                isOpen={mountDialog.isOpen}
                onClose={() => setMountDialog({ isOpen: false, partition: null })}
                onSubmit={handleMountSubmit}
                title={`Mount Partition: ${mountDialog.partition}`}
                submitText="Mount"
                fields={mountFields}
            />

            {/* Format Dialog */}
            <FormDialog
                isOpen={formatDialog.isOpen}
                onClose={() => setFormatDialog({ isOpen: false, partition: null })}
                onSubmit={handleFormatSubmit}
                title={`Format: ${formatDialog.partition}`}
                titleIcon={<AlertTriangle size={20} />}
                submitText="Format Drive"
                submitVariant="danger"
                fields={formatFields}
                validate={(values: any) => values.confirmation !== 'FORMAT' ? 'Please type FORMAT to confirm.' : null}
                header={
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-200">
                            <strong>WARNING:</strong> This will erase ALL data on <code>{formatDialog.partition}</code>.
                            This action cannot be undone.
                        </p>
                    </div>
                }
            />

            {/* Create Partition Dialog */}
            <FormDialog
                isOpen={createDialog.isOpen}
                onClose={() => setCreateDialog({ isOpen: false, disk: null })}
                onSubmit={handleCreateSubmit}
                title={`Create Partition on ${createDialog.disk?.name}`}
                submitText="Create"
                fields={createFields}
            />

            {/* Resize Partition Dialog */}
            <FormDialog
                isOpen={resizeDialog.isOpen}
                onClose={() => setResizeDialog({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 })}
                onSubmit={handleResizeSubmit}
                title={`Resize: ${resizeDialog.partitionName}`}
                submitText="Resize"
                fields={resizeFields}
                header={
                    <p className="text-sm text-zinc-400 mb-4">
                        Adjust partition size by setting a new end position (e.g., 100%, 50GB). Growing is generally safe. Shrinking requires unmounting and has risks!
                    </p>
                }
            />

            {/* Delete Partition Confirmation */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, disk: null, partitionName: '', partitionNumber: 0 })}
                onConfirm={handleDeleteConfirm}
                title={`Delete Partition: ${deleteDialog.partitionName}`}
                message={
                    <span>
                        Are you sure you want to delete partition <strong>{deleteDialog.partitionName}</strong>?
                        This will destroy the partition table entry and all data will be lost.
                    </span>
                }
                confirmText="Delete Partition"
                confirmColor="red"
            />
        </div>
    );
};

export default DiskManager;
