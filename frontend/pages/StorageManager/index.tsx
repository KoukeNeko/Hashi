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
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DataTable, DataTableColumn, badgeCell } from '@/components/ui/DataTable';

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const statusColors: Record<string, string> = {
    ONLINE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    DEGRADED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    REBUILDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    OFFLINE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const healthColors: Record<string, string> = {
    PASSED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    UNKNOWN: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

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
            setAvailableDisks(disksData.filter((d: SystemDisk) => d.type === 'disk' && !d.name.startsWith('loop')));

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
                    {badgeCell(pool.status, statusColors)}
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
                    <div className="text-xs text-zinc-500">
                        Used: {formatBytes(pool.usedSize)}
                    </div>
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
                <button
                    onClick={() => setDeleteDialog({ isOpen: true, pool })}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete array"
                >
                    <Trash2 size={16} />
                </button>
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
        {
            key: 'model',
            header: 'Model',
            render: (info) => info.model || '-',
        },
        {
            key: 'health',
            header: 'Health',
            width: '120px',
            render: (info) => badgeCell(info.healthStatus, healthColors),
        },
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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Storage"
                icon={Database}
                description="Manage RAID arrays and monitor disk health"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setCreateDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Create Array
                        </button>
                    </div>
                }
            />

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('pools')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pools'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'health'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
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
                    <DataTable
                        data={pools}
                        columns={poolColumns}
                        rowKey={(p) => p.name}
                        groupHeader="RAID Arrays"
                        groupCount={pools.length}
                    />
                )
            ) : (
                smartInfos.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500">
                        <Activity size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Unable to retrieve S.M.A.R.T. data</p>
                        <p className="text-sm mt-1">Please ensure smartmontools is installed</p>
                    </div>
                ) : (
                    <DataTable
                        data={smartInfos}
                        columns={smartColumns}
                        rowKey={(s) => s.device}
                        groupHeader="Disk Health Status"
                        groupCount={smartInfos.length}
                    />
                )
            )}

            {/* Create Pool Dialog */}
            {createDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-4xl mx-4 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            Create {createForm.level.toUpperCase()}
                        </h3>

                        <div className="flex gap-6">
                            {/* Left: Disk Slots Visualization */}
                            <div className="flex-1">
                                {/* RAID Level Selector */}
                                <div className="flex gap-2 mb-4">
                                    {(['raid0', 'raid1', 'raid5', 'raid6', 'raid10'] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setCreateForm({ ...createForm, level })}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${createForm.level === level
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {level.toUpperCase()}
                                        </button>
                                    ))}
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
                                                        <div className="text-center">
                                                            <div className="text-white font-bold text-lg">{index + 1}</div>
                                                        </div>
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

                            {/* Right: Available Disks List */}
                            <div className="w-64">
                                <div className="text-sm text-zinc-400 mb-2">Available Disks</div>
                                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                    {availableDisks.map((disk) => {
                                        const isSelected = createForm.disks.includes(disk.path);
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
                                                <div className="font-medium text-white">{disk.name.replace('/dev/', '')}</div>
                                                <div className="ml-auto text-sm text-zinc-400">{formatBytes(disk.size)}</div>
                                                <div className="grid grid-cols-3 gap-0.5">
                                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                                        <div key={i} className="w-1 h-1 bg-zinc-500 rounded-sm" />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {availableDisks.length === 0 && (
                                    <p className="text-sm text-zinc-500 text-center py-4">No available disks</p>
                                )}
                            </div>
                        </div>

                        {/* Capacity Estimation Bar */}
                        {createForm.disks.length > 0 && (() => {
                            const totalSize = createForm.disks.reduce((sum, path) => {
                                const disk = availableDisks.find(d => d.path === path);
                                return sum + (disk?.size || 0);
                            }, 0);

                            let availableSize = 0;
                            const diskCount = createForm.disks.length;
                            const minDiskSize = Math.min(...createForm.disks.map(p => availableDisks.find(d => d.path === p)?.size || 0));

                            switch (createForm.level) {
                                case 'raid0':
                                    availableSize = totalSize;
                                    break;
                                case 'raid1':
                                    availableSize = minDiskSize;
                                    break;
                                case 'raid5':
                                    availableSize = minDiskSize * (diskCount - 1);
                                    break;
                                case 'raid6':
                                    availableSize = minDiskSize * (diskCount - 2);
                                    break;
                                case 'raid10':
                                    availableSize = totalSize / 2;
                                    break;
                            }

                            const availablePercent = totalSize > 0 ? (availableSize / totalSize) * 100 : 0;

                            return (
                                <div className="mt-6 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-2xl font-bold text-white">{formatBytes(availableSize)}</div>
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
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                            style={{ width: `${availablePercent}%` }}
                                        />
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-amber-400"
                                            style={{ width: `${100 - availablePercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Array Name Input */}
                        <div className="mt-4 flex items-center gap-4">
                            <label className="text-sm text-zinc-400">Array Name:</label>
                            <input
                                type="text"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="md0"
                                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none w-32"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setCreateDialog(false)}
                                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePool}
                                disabled={createForm.disks.length === 0}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                            >
                                Create Array
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
