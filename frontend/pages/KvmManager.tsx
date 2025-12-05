import React, { useState, useEffect } from 'react';
import { VM } from '../types';
import { VirtService } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { 
    Monitor, Power, RotateCcw, HardDrive, Cpu, MemoryStick, 
    Loader2, RefreshCw, AlertCircle, Play, Square
} from 'lucide-react';
import { Toast, ActionButton, ConfirmDialog } from '../components/ui';

// VM 狀態對應
const getVmStatusInfo = (state: string) => {
    switch (state) {
        case 'VIR_DOMAIN_RUNNING':
            return { label: 'Running', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
        case 'VIR_DOMAIN_SHUTOFF':
            return { label: 'Stopped', color: 'bg-zinc-500', textColor: 'text-zinc-400' };
        case 'VIR_DOMAIN_PAUSED':
            return { label: 'Paused', color: 'bg-amber-500', textColor: 'text-amber-400' };
        case 'VIR_DOMAIN_PMSUSPENDED':
            return { label: 'Suspended', color: 'bg-blue-500', textColor: 'text-blue-400' };
        default:
            return { label: state.replace('VIR_DOMAIN_', ''), color: 'bg-zinc-500', textColor: 'text-zinc-400' };
    }
};

// 格式化記憶體 (KiB -> GB/MB)
const formatMemory = (kib: number): string => {
    const gib = kib / 1024 / 1024;
    if (gib >= 1) {
        return `${gib.toFixed(1)} GB`;
    }
    const mib = kib / 1024;
    return `${mib.toFixed(0)} MB`;
};

const KvmManager: React.FC = () => {
    const [vms, setVms] = useState<VM[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        vmName: string;
        action: 'stop' | 'force-stop' | 'reboot';
    } | null>(null);

    const loadVms = async () => {
        try {
            setLoading(true);
            const data = await VirtService.listVms();
            setVms(data);
        } catch (error) {
            console.error('Failed to load VMs:', error);
            setToast({ message: 'Failed to load virtual machines', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVms();
    }, []);

    const handleVmAction = async (vmName: string, action: 'start' | 'stop' | 'force-stop' | 'reboot') => {
        // 危險操作需要確認
        if (action === 'stop' || action === 'force-stop' || action === 'reboot') {
            setConfirmDialog({ isOpen: true, vmName, action });
            return;
        }

        await executeVmAction(vmName, action);
    };

    const executeVmAction = async (vmName: string, action: 'start' | 'stop' | 'force-stop' | 'reboot') => {
        try {
            setActionLoading(vmName);
            await VirtService.controlVm(vmName, action);
            
            const actionLabels = {
                'start': 'started',
                'stop': 'stopped',
                'force-stop': 'force stopped',
                'reboot': 'rebooted'
            };
            setToast({ message: `VM "${vmName}" ${actionLabels[action]} successfully`, type: 'success' });
            
            // 延遲重新載入，讓 libvirt 有時間更新狀態
            setTimeout(loadVms, 1000);
        } catch (error) {
            console.error(`Failed to ${action} VM:`, error);
            setToast({ message: `Failed to ${action} VM "${vmName}"`, type: 'error' });
        } finally {
            setActionLoading(null);
            setConfirmDialog(null);
        }
    };

    const isRunning = (vm: VM) => vm.state === 'VIR_DOMAIN_RUNNING';

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="KVM Virtualization"
                icon={Monitor}
                description="Manage virtual machines powered by libvirt/QEMU-KVM."
                actions={
                    <ActionButton
                        onClick={loadVms}
                        disabled={loading}
                        icon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        variant="secondary"
                    >
                        Refresh
                    </ActionButton>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : vms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <Monitor size={48} className="mb-4 opacity-50" />
                    <p className="text-sm">No virtual machines found</p>
                    <p className="text-xs text-zinc-600 mt-1">Make sure libvirt is running and configured</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vms.map((vm) => {
                        const statusInfo = getVmStatusInfo(vm.state);
                        const vmRunning = isRunning(vm);
                        const isLoading = actionLoading === vm.name;

                        return (
                            <div 
                                key={vm.id} 
                                className="bg-surface border border-border rounded-lg p-5 hover:border-zinc-600 transition-colors relative overflow-hidden group shadow-lg"
                            >
                                {/* Status Strip */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${statusInfo.color}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-zinc-100">{vm.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${statusInfo.color}`}></span>
                                            <span className={`text-xs uppercase tracking-wide font-mono ${statusInfo.textColor}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-zinc-500 text-xs font-mono border border-border rounded px-2 py-1 bg-zinc-900">
                                        ID: {vm.id}
                                    </div>
                                </div>

                                <div className="space-y-3 pl-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Cpu size={14} /> <span>vCPU</span>
                                        </div>
                                        <span className="text-zinc-200 font-mono">{vm.vcpu} Core{vm.vcpu > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <MemoryStick size={14} /> <span>Memory</span>
                                        </div>
                                        <span className="text-zinc-200 font-mono">{formatMemory(vm.memory)}</span>
                                    </div>
                                    {vm.uuid && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <HardDrive size={14} /> <span>UUID</span>
                                            </div>
                                            <span className="text-zinc-400 font-mono text-xs truncate max-w-[150px]" title={vm.uuid}>
                                                {vm.uuid.substring(0, 8)}...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pl-3 pt-4 border-t border-border flex justify-end items-center gap-2">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="text-xs">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {vmRunning && (
                                                <>
                                                    <button
                                                        onClick={() => handleVmAction(vm.name, 'reboot')}
                                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                                                        title="Reboot"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVmAction(vm.name, 'stop')}
                                                        className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors"
                                                        title="Graceful Shutdown"
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVmAction(vm.name, 'force-stop')}
                                                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                                                        title="Force Stop"
                                                    >
                                                        <Square size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {!vmRunning && (
                                                <button
                                                    onClick={() => handleVmAction(vm.name, 'start')}
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                                    title="Start VM"
                                                >
                                                    <Play size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog(null)}
                    onConfirm={() => executeVmAction(confirmDialog.vmName, confirmDialog.action)}
                    title={
                        confirmDialog.action === 'force-stop' ? 'Force Stop VM' :
                        confirmDialog.action === 'stop' ? 'Shutdown VM' : 'Reboot VM'
                    }
                    message={
                        <>
                            Are you sure you want to {confirmDialog.action === 'force-stop' ? 'force stop' : confirmDialog.action} 
                            {' '}<span className="text-white font-bold">{confirmDialog.vmName}</span>?
                            {confirmDialog.action === 'force-stop' && (
                                <p className="text-xs text-rose-400 mt-2">
                                    <AlertCircle size={12} className="inline mr-1" />
                                    This may cause data loss if the VM has unsaved data.
                                </p>
                            )}
                        </>
                    }
                    confirmText={
                        confirmDialog.action === 'force-stop' ? 'Force Stop' :
                        confirmDialog.action === 'stop' ? 'Shutdown' : 'Reboot'
                    }
                    confirmColor={confirmDialog.action === 'force-stop' ? 'red' : 'amber'}
                    confirmIcon={
                        confirmDialog.action === 'reboot' ? <RotateCcw size={16} /> :
                        confirmDialog.action === 'force-stop' ? <Square size={16} /> : <Power size={16} />
                    }
                />
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default KvmManager;
