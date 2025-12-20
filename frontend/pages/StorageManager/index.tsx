import React, { useState, useEffect, useMemo } from 'react';
import {
    Database,
    RotateCw,
    Plus,
    Trash2,
    HardDrive,
    Thermometer,
    Activity,
    Loader2,
} from 'lucide-react';
import { StoragePool, SmartInfo, CreatePoolRequest, SystemDisk } from '@/types';
import { StorageService, DiskService } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { Dialog, DialogBody, DialogFooter, ConfirmDialog } from '@/components/ui/Dialog';
import { ActionButton, FormInput } from '@/components/ui/Form';
import { DataTable, DataTableColumn, badgeCell } from '@/components/ui/DataTable';

// ==================== Constants ====================
const RAID_LEVELS = [
    { level: 'raid0', minDisks: 1, label: 'RAID0' },
    { level: 'raid1', minDisks: 2, label: 'RAID1' },
    { level: 'raid5', minDisks: 3, label: 'RAID5' },
    { level: 'raid6', minDisks: 4, label: 'RAID6' },
    { level: 'raid10', minDisks: 4, label: 'RAID10' },
] as const;

const STATUS_COLORS: Record<string, string> = {
    ONLINE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    DEGRADED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    REBUILDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    OFFLINE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const HEALTH_COLORS: Record<string, string> = {
    PASSED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    UNKNOWN: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

// ==================== Helpers ====================
const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const calculateRaidCapacity = (level: string, disks: string[], availableDisks: SystemDisk[]) => {
    const diskCount = disks.length;
    if (diskCount === 0) return { available: 0, percent: 0 };

    const totalSize = disks.reduce((sum, path) => {
        const disk = availableDisks.find(d => d.path === path);
        return sum + (disk?.size || 0);
    }, 0);

    const minDiskSize = Math.min(...disks.map(p => availableDisks.find(d => d.path === p)?.size || 0));

    let availableSize = 0;
    switch (level) {
        case 'raid0': availableSize = totalSize; break;
        case 'raid1': availableSize = minDiskSize; break;
        case 'raid5': availableSize = minDiskSize * (diskCount - 1); break;
        case 'raid6': availableSize = minDiskSize * Math.max(0, diskCount - 2); break;
        case 'raid10': availableSize = totalSize / 2; break;
    }

    return {
        available: availableSize,
        percent: totalSize > 0 ? (availableSize / totalSize) * 100 : 0,
    };
};

// ==================== Main Component ====================
const StorageManager: React.FC = () => {
    const [pools, setPools] = useState<StoragePool[]>([]);
    const [smartInfos, setSmartInfos] = useState<SmartInfo[]>([]);
    const [availableDisks, setAvailableDisks] = useState<SystemDisk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'pools' | 'health'>('pools');

    const [createDialog, setCreateDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; pool: StoragePool | null }>({
        isOpen: false,
        pool: null,
    });

    const [createForm, setCreateForm] = useState<CreatePoolRequest>({
        name: 'md0',
        level: 'raid1',
        disks: [],
        spareDisks: [],
        formatAndMount: false,
        mountPoint: '',
        filesystem: 'ext4',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [poolsData, disksData] = await Promise.all([
                StorageService.listPools(),
                DiskService.list(),
            ]);
            setPools(poolsData);
            // Include both whole disks and partitions (exclude loop devices)
            setAvailableDisks(disksData.filter((d: SystemDisk) =>
                (d.type === 'disk' || d.type === 'part') && !d.name.startsWith('loop')
            ));

            if (activeTab === 'health') {
                const smartData = await StorageService.listDiskHealth();
                setSmartInfos(smartData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePool = async () => {
        if (createForm.disks.length === 0) {
            alert('Please select at least one disk');
            return;
        }

        try {
            await StorageService.createPool(createForm);
            setCreateDialog(false);
            setCreateForm({
                name: 'md0',
                level: 'raid1',
                disks: [],
                spareDisks: [],
                formatAndMount: false,
                mountPoint: '',
                filesystem: 'ext4',
            });
            await fetchData();
        } catch (error: any) {
            alert(`Creation failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleDeletePool = async () => {
        if (!deleteDialog.pool) return;
        try {
            await StorageService.destroyPool(deleteDialog.pool.name);
            setDeleteDialog({ isOpen: false, pool: null });
            await fetchData();
        } catch (error: any) {
            alert(`Deletion failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const toggleDiskSelection = (device: string) => {
        setCreateForm(prev => ({
            ...prev,
            disks: prev.disks.includes(device)
                ? prev.disks.filter(d => d !== device)
                : [...prev.disks, device],
        }));
    };

    const capacity = useMemo(
        () => calculateRaidCapacity(createForm.level, createForm.disks, availableDisks),
        [createForm.level, createForm.disks, availableDisks]
    );

    // ==================== Table Columns ====================
    const poolColumns: DataTableColumn<StoragePool>[] = useMemo(() => [
        {
            key: 'name',
            header: 'Name',
            mono: true,
            render: (pool) => (
                <div>
                    <div className="text-zinc-200">{pool.name}</div>
                    <div className="text-xs text-zinc-500">{pool.device}</div>
                </div>
            ),
        },
        {
            key: 'level',
            header: 'Level',
            width: '100px',
            render: (pool) => (
                <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-medium text-zinc-300">
                    {pool.level.toUpperCase()}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (pool) => (
                <div>
                    {badgeCell(pool.status, STATUS_COLORS)}
                    {pool.rebuildProgress !== undefined && pool.status === 'REBUILDING' && (
                        <div className="text-xs text-blue-400 mt-1">
                            Rebuilding: {pool.rebuildProgress.toFixed(1)}%
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'capacity',
            header: 'Capacity',
            render: (pool) => (
                <div className="text-zinc-300">
                    {formatBytes(pool.totalSize)}
                    <div className="text-xs text-zinc-500">Used: {formatBytes(pool.usedSize)}</div>
                </div>
            ),
        },
        {
            key: 'disks',
            header: 'Disks',
            render: (pool) => (
                <div className="text-xs text-zinc-400">
                    <span className="text-emerald-400">{pool.activeDiskCount}</span> active
                    {pool.spareDiskCount > 0 && (
                        <span className="ml-2 text-blue-400">{pool.spareDiskCount} spare</span>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '80px',
            align: 'right',
            render: (pool) => (
                <ActionButton
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeleteDialog({ isOpen: true, pool })}
                    title="Delete array"
                />
            ),
        },
    ], []);

    const smartColumns: DataTableColumn<SmartInfo>[] = useMemo(() => [
        {
            key: 'device',
            header: 'Device',
            mono: true,
            render: (info) => (
                <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-zinc-500" />
                    <span className="text-zinc-200">{info.device}</span>
                </div>
            ),
        },
        { key: 'model', header: 'Model', render: (info) => info.model || '-' },
        { key: 'health', header: 'Health', width: '120px', render: (info) => badgeCell(info.healthStatus, HEALTH_COLORS) },
        {
            key: 'temperature',
            header: 'Temp',
            width: '80px',
            render: (info) => (
                <div className="flex items-center gap-1">
                    <Thermometer size={14} className="text-amber-500" />
                    <span className={info.temperature && info.temperature > 50 ? 'text-rose-400' : 'text-zinc-300'}>
                        {info.temperature ? `${info.temperature}°C` : '-'}
                    </span>
                </div>
            ),
        },
        {
            key: 'powerOn',
            header: 'Power On',
            render: (info) => (
                <span className="text-zinc-400">
                    {info.powerOnHours ? `${(info.powerOnHours / 24).toFixed(0)} days` : '-'}
                </span>
            ),
        },
        {
            key: 'reallocated',
            header: 'Bad Sectors',
            render: (info) => (
                <span className={info.reallocatedSectorCount && info.reallocatedSectorCount > 0 ? 'text-rose-400' : 'text-zinc-400'}>
                    {info.reallocatedSectorCount ?? '-'}
                </span>
            ),
        },
    ], []);

    // ==================== Render ====================
    return (
        <div className="space-y-6">
            <PageHeader
                title="Storage"
                icon={Database}
                description="Manage RAID arrays and monitor disk health"
                actions={
                    <div className="flex gap-2">
                        <ActionButton
                            variant="outline"
                            icon={<RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                            onClick={fetchData}
                            disabled={isLoading}
                        >
                            Refresh
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            icon={<Plus size={16} />}
                            onClick={() => setCreateDialog(true)}
                        >
                            Create Array
                        </ActionButton>
                    </div>
                }
            />

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('pools')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pools' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    RAID Arrays
                </button>
                <button
                    onClick={() => {
                        setActiveTab('health');
                        if (smartInfos.length === 0) {
                            StorageService.listDiskHealth().then(setSmartInfos).catch(console.error);
                        }
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'health' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    S.M.A.R.T. Health
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : activeTab === 'pools' ? (
                pools.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500">
                        <Database size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No RAID arrays configured</p>
                        <p className="text-sm mt-1">Click "Create Array" to get started</p>
                    </div>
                ) : (
                    <DataTable data={pools} columns={poolColumns} rowKey={(p) => p.name} groupHeader="RAID Arrays" groupCount={pools.length} />
                )
            ) : smartInfos.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Activity size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Unable to retrieve S.M.A.R.T. data</p>
                    <p className="text-sm mt-1">Please ensure smartmontools is installed</p>
                </div>
            ) : (
                <DataTable data={smartInfos} columns={smartColumns} rowKey={(s) => s.device} groupHeader="Disk Health Status" groupCount={smartInfos.length} />
            )}

            {/* Create Pool Dialog */}
            <Dialog
                isOpen={createDialog}
                onClose={() => setCreateDialog(false)}
                title={`Create ${createForm.level.toUpperCase()}`}
                titleIcon={<Database size={20} />}
                maxWidth="max-w-4xl"
            >
                <DialogBody className="space-y-6">
                    <div className="flex gap-6">
                        {/* Left: Disk Slots */}
                        <div className="flex-1 space-y-4">
                            {/* RAID Level Selector */}
                            <div className="flex gap-2">
                                {RAID_LEVELS.map(({ level, minDisks, label }) => {
                                    const isDisabled = createForm.disks.length < minDisks;
                                    const isSelected = createForm.level === level;
                                    return (
                                        <ActionButton
                                            key={level}
                                            variant={isSelected ? 'primary' : 'outline'}
                                            size="sm"
                                            disabled={isDisabled}
                                            onClick={() => setCreateForm({ ...createForm, level })}
                                            title={isDisabled ? `Requires ${minDisks}+ disks` : undefined}
                                            className={isDisabled ? 'opacity-40' : ''}
                                        >
                                            {label}
                                            {isDisabled && <span className="ml-1 text-xs">({minDisks}+)</span>}
                                        </ActionButton>
                                    );
                                })}
                            </div>

                            {/* Selected Disks - Slot Cards */}
                            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 min-h-[200px]">
                                <div className="flex gap-3 flex-wrap">
                                    {createForm.disks.length === 0 ? (
                                        <div className="w-full text-center py-8 text-zinc-500">
                                            <HardDrive size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Select disks from the right panel</p>
                                        </div>
                                    ) : (
                                        createForm.disks.map((diskPath, index) => {
                                            const disk = availableDisks.find(d => d.path === diskPath);
                                            return (
                                                <div
                                                    key={diskPath}
                                                    className="w-20 h-32 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-lg p-2 flex flex-col justify-between shadow-lg relative group cursor-pointer"
                                                    onClick={() => toggleDiskSelection(diskPath)}
                                                >
                                                    <div className="text-center text-white font-bold text-lg">{index + 1}</div>
                                                    <div className="bg-white/20 rounded p-1.5 flex-1 mx-1 my-2" />
                                                    <div className="text-center">
                                                        <div className="text-xs text-emerald-100 font-medium">
                                                            {disk ? formatBytes(disk.size) : ''}
                                                        </div>
                                                        <div className="flex justify-center gap-0.5 mt-1">
                                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                                <div key={i} className="w-1 h-1 bg-white/40 rounded-full" />
                                                            ))}
                                                        </div>
                                                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />
                                                    </div>
                                                    <button
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
                                                        onClick={(e) => { e.stopPropagation(); toggleDiskSelection(diskPath); }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Available Disks & Partitions */}
                        <div className="w-72 space-y-2">
                            <div className="text-sm text-zinc-400">Available Disks & Partitions</div>
                            <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                {availableDisks.map((disk) => {
                                    const isSelected = createForm.disks.includes(disk.path);
                                    const isPartition = disk.type === 'part';
                                    return (
                                        <div
                                            key={disk.path}
                                            onClick={() => toggleDiskSelection(disk.path)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${isSelected
                                                ? 'bg-emerald-600/20 border-emerald-500'
                                                : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{disk.name.replace('/dev/', '')}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPartition ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                                        {isPartition ? 'PART' : 'DISK'}
                                                    </span>
                                                </div>
                                                {disk.model && <div className="text-xs text-zinc-500 truncate">{disk.model}</div>}
                                            </div>
                                            <div className="text-sm text-zinc-400">{formatBytes(disk.size)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            {availableDisks.length === 0 && (
                                <p className="text-sm text-zinc-500 text-center py-4">No available disks or partitions</p>
                            )}
                        </div>
                    </div>

                    {/* Capacity Estimation */}
                    {createForm.disks.length > 0 && (
                        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-2xl font-bold text-white">{formatBytes(capacity.available)}</div>
                                    <div className="text-sm text-zinc-400">Estimated available storage</div>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                                        <span className="text-zinc-400">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-500 rounded" />
                                        <span className="text-zinc-400">Redundancy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-4 rounded-full overflow-hidden bg-zinc-800">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${capacity.percent}%` }} />
                                <div className="bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${100 - capacity.percent}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Array Name */}
                    <FormInput
                        label="Array Name"
                        value={createForm.name}
                        onChange={(v) => setCreateForm({ ...createForm, name: v })}
                        placeholder="md0"
                    />
                </DialogBody>
                <DialogFooter>
                    <ActionButton variant="ghost" onClick={() => setCreateDialog(false)}>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={handleCreatePool}
                        disabled={createForm.disks.length === 0}
                    >
                        Create Array
                    </ActionButton>
                </DialogFooter>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, pool: null })}
                onConfirm={handleDeletePool}
                title={`Delete Array: ${deleteDialog.pool?.name}`}
                message={
                    <span>
                        Are you sure you want to delete the RAID array <strong>{deleteDialog.pool?.name}</strong>?
                        This will clear the RAID superblock from all member disks.
                    </span>
                }
                confirmText="Delete Array"
                confirmColor="red"
            />
        </div>
    );
};

export default StorageManager;
