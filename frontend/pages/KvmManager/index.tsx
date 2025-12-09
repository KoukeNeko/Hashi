import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VM, CreateVmRequest, UpdateVmRequest, IsoFile, VM_DEFAULTS, VM_OPTIONS, Disk } from '../../types';
import { VirtService } from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { VncConsole } from '../../components/VncConsole';
import { Tabs, TabItem } from '../../components/Tabs';
import { 
    Monitor, Power, RotateCcw, HardDrive, Cpu, MemoryStick, 
    Loader2, RefreshCw, AlertCircle, Play, Square, Terminal, Copy, CheckCircle,
    Plus, Trash2, Upload, Disc, X, MonitorPlay, Settings, Network, Tv, Zap, ChevronDown, ChevronUp, Info, Edit
} from 'lucide-react';
import { Toast, ActionButton, ConfirmDialog } from '../../components/ui';

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
};

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

// ==================== Setup Guide Component ====================
const LibvirtSetupGuide: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const commands = [
        {
            title: 'Install KVM & Libvirt',
            cmd: 'sudo apt update && sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils'
        },
        {
            title: 'Install development libraries (required for Java)',
            cmd: 'sudo apt install -y libvirt-dev'
        },
        {
            title: 'Add user to libvirt group',
            cmd: 'sudo usermod -aG libvirt $USER'
        },
        {
            title: 'Start & enable libvirtd',
            cmd: 'sudo systemctl enable --now libvirtd'
        },
        {
            title: 'Set images directory permissions (for VM disk creation)',
            cmd: 'sudo chown root:libvirt /var/lib/libvirt/images && sudo chmod 775 /var/lib/libvirt/images'
        }
    ];

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                    <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">Libvirt Setup Required</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        KVM/Libvirt is not configured on this server. Please run the following commands to set it up:
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {commands.map((item, index) => (
                    <div key={index} className="bg-zinc-900 rounded-lg overflow-hidden border border-border">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-zinc-800/50">
                            <span className="text-xs text-zinc-400 font-medium">
                                {index + 1}. {item.title}
                            </span>
                            <button
                                onClick={() => copyToClipboard(item.cmd, index)}
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {copiedIndex === index ? (
                                    <>
                                        <CheckCircle size={12} className="text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="p-4">
                            <code className="text-sm font-mono text-emerald-400 break-all">
                                {item.cmd}
                            </code>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                    <Terminal size={18} className="text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-200">
                        <p className="font-medium">After running the commands:</p>
                        <ul className="mt-2 space-y-1 text-blue-300/80">
                            <li>• Log out and log back in (for group changes to take effect)</li>
                            <li>• Restart the Hashi backend service</li>
                            <li>• Place ISO files in <code className="bg-zinc-800 px-1 rounded">/var/lib/libvirt/images/</code></li>
                            <li>• Click the button below to retry</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <ActionButton onClick={onRetry} icon={<RefreshCw size={16} />}>
                    Retry Connection
                </ActionButton>
            </div>
        </div>
    );
};

// ==================== Main Component ====================
const KvmManager: React.FC = () => {
    const [vms, setVms] = useState<VM[]>([]);
    const [isoFiles, setIsoFiles] = useState<IsoFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        vmName: string;
        action: 'stop' | 'force-stop' | 'reboot' | 'delete';
    } | null>(null);

    // Create VM Dialog
    const [createVmDialogOpen, setCreateVmDialogOpen] = useState(false);
    const [createVmForm, setCreateVmForm] = useState<CreateVmRequest>({
        name: '',
        vcpu: 2,
        memoryMB: 2048,
        diskGB: 20,
        osType: 'linux',
        isoPath: '',
        // 使用預設值
        ...VM_DEFAULTS,
    });
    const [createVmLoading, setCreateVmLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [createVmTab, setCreateVmTab] = useState<'basic' | 'hardware' | 'network' | 'display' | 'advanced'>('basic');

    // Edit VM Dialog
    const [editVmDialogOpen, setEditVmDialogOpen] = useState(false);
    const [editVmName, setEditVmName] = useState<string | null>(null);
    const [editVmForm, setEditVmForm] = useState<UpdateVmRequest>({});
    const [editVmLoading, setEditVmLoading] = useState(false);
    const [editVmTab, setEditVmTab] = useState<'basic' | 'hardware' | 'network' | 'display' | 'advanced'>('basic');
    const [editVmOriginal, setEditVmOriginal] = useState<VM | null>(null);

    // ISO Upload
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // VNC Console
    const [consoleVm, setConsoleVm] = useState<string | null>(null);

    // VM Tab Items (shared between Create and Edit dialogs)
    const vmTabItems: TabItem[] = useMemo(() => [
        { id: 'basic', label: 'Basic', icon: Settings },
        { id: 'hardware', label: 'Hardware', icon: Cpu },
        { id: 'network', label: 'Network', icon: Network },
        { id: 'display', label: 'Display', icon: Tv },
        { id: 'advanced', label: 'Advanced', icon: Zap },
    ], []);

    const loadVms = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await VirtService.listVms();
            setVms(data);
        } catch (err: unknown) {
            console.error('Failed to load VMs:', err);
            const axiosError = err as { response?: { status?: number; data?: string } };
            if (axiosError.response?.status === 404 || axiosError.response?.status === 500) {
                setError('libvirt_not_configured');
            } else {
                setToast({ message: 'Failed to load virtual machines', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadIsoFiles = async () => {
        try {
            const data = await VirtService.listIsoFiles();
            setIsoFiles(data);
        } catch (err) {
            console.error('Failed to load ISO files:', err);
        }
    };

    useEffect(() => {
        loadVms();
        loadIsoFiles();
    }, []);

    const handleVmAction = async (vmName: string, action: 'start' | 'stop' | 'force-stop' | 'reboot' | 'delete') => {
        // 危險操作需要確認
        if (action === 'stop' || action === 'force-stop' || action === 'reboot' || action === 'delete') {
            setConfirmDialog({ isOpen: true, vmName, action });
            return;
        }

        await executeVmAction(vmName, action);
    };

    const executeVmAction = async (vmName: string, action: 'start' | 'stop' | 'force-stop' | 'reboot' | 'delete') => {
        try {
            setActionLoading(vmName);
            
            if (action === 'delete') {
                await VirtService.deleteVm(vmName);
                setToast({ message: `VM "${vmName}" deleted successfully`, type: 'success' });
                loadVms();
            } else {
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
            }
        } catch (error) {
            console.error(`Failed to ${action} VM:`, error);
            setToast({ message: `Failed to ${action} VM "${vmName}"`, type: 'error' });
        } finally {
            setActionLoading(null);
            setConfirmDialog(null);
        }
    };

    const handleCreateVm = async () => {
        if (!createVmForm.name.trim()) {
            setToast({ message: 'Please enter a VM name', type: 'error' });
            return;
        }
        
        try {
            setCreateVmLoading(true);
            await VirtService.createVm(createVmForm);
            setToast({ message: `VM "${createVmForm.name}" created successfully`, type: 'success' });
            setCreateVmDialogOpen(false);
            setCreateVmForm({ 
                name: '', vcpu: 2, memoryMB: 2048, diskGB: 20, osType: 'linux', isoPath: '',
                ...VM_DEFAULTS,
            });
            setCreateVmTab('basic');
            setShowAdvanced(false);
            loadVms();
        } catch (error) {
            console.error('Failed to create VM:', error);
            setToast({ message: `Failed to create VM "${createVmForm.name}"`, type: 'error' });
        } finally {
            setCreateVmLoading(false);
        }
    };

    // 打開編輯 VM 對話框
    const handleOpenEditVm = async (vmName: string) => {
        try {
            setEditVmLoading(true);
            setEditVmDialogOpen(true);
            setEditVmName(vmName);
            setEditVmTab('basic');
            
            // 取得 VM 詳細資訊
            const vmDetails = await VirtService.getVmDetails(vmName);
            setEditVmOriginal(vmDetails);
            
            // 初始化編輯表單
            setEditVmForm({
                description: vmDetails.description || '',
                vcpu: vmDetails.vcpu,
                cpuMode: vmDetails.cpuMode,
                cpuSockets: vmDetails.cpuSockets,
                cpuCores: vmDetails.cpuCores,
                cpuThreads: vmDetails.cpuThreads,
                memoryMB: vmDetails.memory ? Math.round(vmDetails.memory / 1024 / 1024) : undefined,
                maxMemoryMB: vmDetails.maxMemory ? Math.round(vmDetails.maxMemory / 1024 / 1024) : undefined,
                hugepages: vmDetails.hugepages,
                networkType: vmDetails.networkType,
                networkSource: vmDetails.networkSource,
                networkModel: vmDetails.networkModel,
                macAddress: vmDetails.macAddress,
                graphicsType: vmDetails.graphicsType,
                graphicsPort: vmDetails.graphicsPort,
                graphicsListen: vmDetails.graphicsListen,
                videoModel: vmDetails.videoModel,
                videoVram: vmDetails.videoVram,
                bootOrder: vmDetails.bootOrder,
                bootMenu: vmDetails.bootMenu,
                onPoweroff: vmDetails.onPoweroff,
                onReboot: vmDetails.onReboot,
                onCrash: vmDetails.onCrash,
                acpi: vmDetails.acpi,
                apic: vmDetails.apic,
                autostart: vmDetails.autostart,
                clockOffset: vmDetails.clockOffset,
                isoPath: vmDetails.isoPath,
                usb: vmDetails.usb,
                tablet: vmDetails.tablet,
                serial: vmDetails.serial,
                tpm: vmDetails.tpm,
            });
        } catch (error) {
            console.error('Failed to load VM details:', error);
            setToast({ message: `Failed to load VM "${vmName}" details`, type: 'error' });
            setEditVmDialogOpen(false);
        } finally {
            setEditVmLoading(false);
        }
    };

    // 更新 VM
    const handleUpdateVm = async () => {
        if (!editVmName) return;
        
        try {
            setEditVmLoading(true);
            await VirtService.updateVm(editVmName, editVmForm);
            setToast({ message: `VM "${editVmName}" updated successfully`, type: 'success' });
            setEditVmDialogOpen(false);
            setEditVmName(null);
            setEditVmForm({});
            setEditVmOriginal(null);
            loadVms();
        } catch (error) {
            console.error('Failed to update VM:', error);
            setToast({ message: `Failed to update VM "${editVmName}"`, type: 'error' });
        } finally {
            setEditVmLoading(false);
        }
    };

    const handleIsoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.iso')) {
            setToast({ message: 'Only ISO files are allowed', type: 'error' });
            return;
        }

        try {
            setUploadProgress(0);
            await VirtService.uploadIso(file, setUploadProgress);
            setToast({ message: `ISO "${file.name}" uploaded successfully`, type: 'success' });
            loadIsoFiles();
        } catch (error) {
            console.error('Failed to upload ISO:', error);
            setToast({ message: `Failed to upload ISO "${file.name}"`, type: 'error' });
        } finally {
            setUploadProgress(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const isRunning = (vm: VM) => vm.state === 'VIR_DOMAIN_RUNNING';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleIsoUpload}
                accept=".iso"
                className="hidden"
            />

            <PageHeader
                title="KVM Virtualization"
                icon={Monitor}
                description="Manage virtual machines powered by libvirt/QEMU-KVM."
                actions={
                    <div className="flex gap-2">
                        <ActionButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadProgress !== null}
                            icon={uploadProgress !== null 
                                ? <Loader2 size={16} className="animate-spin" /> 
                                : <Upload size={16} />
                            }
                            variant="secondary"
                        >
                            {uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Upload ISO'}
                        </ActionButton>
                        <ActionButton
                            onClick={() => setCreateVmDialogOpen(true)}
                            icon={<Plus size={16} />}
                        >
                            Create VM
                        </ActionButton>
                        <ActionButton
                            onClick={() => { loadVms(); loadIsoFiles(); }}
                            disabled={loading}
                            icon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            variant="secondary"
                        >
                            Refresh
                        </ActionButton>
                    </div>
                }
            />

            {error === 'libvirt_not_configured' ? (
                <LibvirtSetupGuide onRetry={loadVms} />
            ) : loading ? (
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
                                            {/* Edit button - always visible */}
                                            <button
                                                onClick={() => handleOpenEditVm(vm.name)}
                                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                                                title="Edit VM Settings"
                                            >
                                                <Edit size={16} />
                                            </button>
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
                                                    <button
                                                        onClick={() => setConsoleVm(vm.name)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                                                        title="Open Console"
                                                    >
                                                        <MonitorPlay size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {!vmRunning && (
                                                <>
                                                    <button
                                                        onClick={() => handleVmAction(vm.name, 'start')}
                                                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                                        title="Start VM"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVmAction(vm.name, 'delete')}
                                                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                                                        title="Delete VM"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
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
                        confirmDialog.action === 'delete' ? 'Delete VM' :
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
                            {confirmDialog.action === 'delete' && (
                                <p className="text-xs text-rose-400 mt-2">
                                    <AlertCircle size={12} className="inline mr-1" />
                                    This will permanently delete the VM and its disk. This action cannot be undone.
                                </p>
                            )}
                        </>
                    }
                    confirmText={
                        confirmDialog.action === 'delete' ? 'Delete' :
                        confirmDialog.action === 'force-stop' ? 'Force Stop' :
                        confirmDialog.action === 'stop' ? 'Shutdown' : 'Reboot'
                    }
                    confirmColor={confirmDialog.action === 'delete' || confirmDialog.action === 'force-stop' ? 'red' : 'amber'}
                    confirmIcon={
                        confirmDialog.action === 'delete' ? <Trash2 size={16} /> :
                        confirmDialog.action === 'reboot' ? <RotateCcw size={16} /> :
                        confirmDialog.action === 'force-stop' ? <Square size={16} /> : <Power size={16} />
                    }
                />
            )}

            {/* Create VM Dialog */}
            {createVmDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                            <h2 className="text-lg font-bold text-zinc-100">Create Virtual Machine</h2>
                            <button
                                onClick={() => setCreateVmDialogOpen(false)}
                                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            >
                                <X size={18} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-5 pt-3 shrink-0">
                            <Tabs
                                items={vmTabItems}
                                activeId={createVmTab}
                                onChange={setCreateVmTab}
                            />
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Basic Tab */}
                            {createVmTab === 'basic' && (
                                <div className="space-y-4">
                                    {/* VM Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                                            VM Name <span className="text-rose-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createVmForm.name}
                                            onChange={(e) => setCreateVmForm({ ...createVmForm, name: e.target.value })}
                                            placeholder="my-ubuntu-server"
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={createVmForm.description || ''}
                                            onChange={(e) => setCreateVmForm({ ...createVmForm, description: e.target.value })}
                                            placeholder="Web server for production"
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* OS Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">OS Type</label>
                                        <select
                                            value={createVmForm.osType}
                                            onChange={(e) => {
                                                const osType = e.target.value;
                                                setCreateVmForm({ 
                                                    ...createVmForm, 
                                                    osType,
                                                    clockOffset: osType === 'windows' ? 'localtime' : 'utc',
                                                    machine: osType === 'windows' ? 'q35' : createVmForm.machine,
                                                });
                                            }}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {VM_OPTIONS.osTypes.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ISO Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                                            <Disc size={14} className="inline mr-1" />
                                            Installation ISO
                                        </label>
                                        <select
                                            value={createVmForm.isoPath || ''}
                                            onChange={(e) => setCreateVmForm({ ...createVmForm, isoPath: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">No ISO (empty disk)</option>
                                            {isoFiles.map((iso) => (
                                                <option key={iso.path} value={iso.path}>
                                                    {iso.name} ({formatFileSize(iso.size)})
                                                </option>
                                            ))}
                                        </select>
                                        {isoFiles.length === 0 && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                No ISO files found. Click "Upload ISO" to add one.
                                            </p>
                                        )}
                                    </div>

                                    {/* Boot Order */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Boot Order</label>
                                        <div className="flex flex-wrap gap-2">
                                            {VM_OPTIONS.bootDevices.map(device => (
                                                <label key={device.value} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded border border-zinc-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={createVmForm.bootOrder?.includes(device.value) ?? false}
                                                        onChange={(e) => {
                                                            const current = createVmForm.bootOrder || [];
                                                            if (e.target.checked) {
                                                                setCreateVmForm({ ...createVmForm, bootOrder: [...current, device.value] });
                                                            } else {
                                                                setCreateVmForm({ ...createVmForm, bootOrder: current.filter(d => d !== device.value) });
                                                            }
                                                        }}
                                                        className="rounded border-zinc-600"
                                                    />
                                                    <span className="text-sm text-zinc-300">{device.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hardware Tab */}
                            {createVmTab === 'hardware' && (
                                <div className="space-y-4">
                                    {/* CPU Cores */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                <Cpu size={14} className="inline mr-1" />
                                                vCPU Cores
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={64}
                                                value={createVmForm.vcpu}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, vcpu: parseInt(e.target.value) || 1 })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">CPU Mode</label>
                                            <select
                                                value={createVmForm.cpuMode || VM_DEFAULTS.cpuMode}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, cpuMode: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.cpuModes.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Memory */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                <MemoryStick size={14} className="inline mr-1" />
                                                Memory (MB)
                                            </label>
                                            <input
                                                type="number"
                                                min={512}
                                                max={262144}
                                                step={512}
                                                value={createVmForm.memoryMB}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, memoryMB: parseInt(e.target.value) || 512 })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Max Memory (MB)</label>
                                            <input
                                                type="number"
                                                min={512}
                                                max={262144}
                                                step={512}
                                                value={createVmForm.maxMemoryMB || createVmForm.memoryMB}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, maxMemoryMB: parseInt(e.target.value) || undefined })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Primary Disk */}
                                    <div className="border border-zinc-700 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                                            <HardDrive size={14} />
                                            Primary Disk (System)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                    Size (GB)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={2048}
                                                    value={createVmForm.diskGB ?? 20}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskGB: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Format</label>
                                                <select
                                                    value={createVmForm.diskFormat || VM_DEFAULTS.diskFormat}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskFormat: e.target.value })}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {VM_OPTIONS.diskFormats.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Bus</label>
                                                <select
                                                    value={createVmForm.diskBus || VM_DEFAULTS.diskBus}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskBus: e.target.value })}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {VM_OPTIONS.diskBuses.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Cache</label>
                                                <select
                                                    value={createVmForm.diskCache || VM_DEFAULTS.diskCache}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskCache: e.target.value })}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {VM_OPTIONS.diskCaches.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">I/O</label>
                                                <select
                                                    value={createVmForm.diskIo || VM_DEFAULTS.diskIo}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskIo: e.target.value })}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {VM_OPTIONS.diskIos.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Disks */}
                                    <div className="border border-zinc-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                                <HardDrive size={14} />
                                                Additional Disks
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDisk: Disk = {
                                                        name: `data${(createVmForm.disks?.length || 0) + 1}`,
                                                        sizeGB: 20,
                                                        format: 'qcow2',
                                                        bus: 'virtio',
                                                        cache: 'none',
                                                        io: 'native',
                                                    };
                                                    setCreateVmForm({
                                                        ...createVmForm,
                                                        disks: [...(createVmForm.disks || []), newDisk],
                                                    });
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                                            >
                                                <Plus size={12} />
                                                Add Disk
                                            </button>
                                        </div>

                                        {(!createVmForm.disks || createVmForm.disks.length === 0) ? (
                                            <p className="text-sm text-zinc-500 text-center py-4">
                                                No additional disks. Click "Add Disk" to add more storage.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {createVmForm.disks.map((disk, idx) => (
                                                    <div key={idx} className="bg-zinc-800 rounded p-3 relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newDisks = [...createVmForm.disks!];
                                                                newDisks.splice(idx, 1);
                                                                setCreateVmForm({ ...createVmForm, disks: newDisks });
                                                            }}
                                                            className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={disk.name || ''}
                                                                    onChange={(e) => {
                                                                        const newDisks = [...createVmForm.disks!];
                                                                        newDisks[idx] = { ...disk, name: e.target.value };
                                                                        setCreateVmForm({ ...createVmForm, disks: newDisks });
                                                                    }}
                                                                    placeholder="data1"
                                                                    className="w-full px-2 py-1 text-sm bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Size (GB)</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={2048}
                                                                    value={disk.sizeGB || 20}
                                                                    onChange={(e) => {
                                                                        const newDisks = [...createVmForm.disks!];
                                                                        newDisks[idx] = { ...disk, sizeGB: parseInt(e.target.value) || 1 };
                                                                        setCreateVmForm({ ...createVmForm, disks: newDisks });
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Format</label>
                                                                <select
                                                                    value={disk.format || 'qcow2'}
                                                                    onChange={(e) => {
                                                                        const newDisks = [...createVmForm.disks!];
                                                                        newDisks[idx] = { ...disk, format: e.target.value };
                                                                        setCreateVmForm({ ...createVmForm, disks: newDisks });
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                >
                                                                    {VM_OPTIONS.diskFormats.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Bus</label>
                                                                <select
                                                                    value={disk.bus || 'virtio'}
                                                                    onChange={(e) => {
                                                                        const newDisks = [...createVmForm.disks!];
                                                                        newDisks[idx] = { ...disk, bus: e.target.value };
                                                                        setCreateVmForm({ ...createVmForm, disks: newDisks });
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                >
                                                                    {VM_OPTIONS.diskBuses.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Toggles */}
                                    <div className="flex items-center gap-6 pt-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={createVmForm.hugepages ?? false}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, hugepages: e.target.checked })}
                                                className="rounded border-zinc-600"
                                            />
                                            <span className="text-sm text-zinc-300">Enable Hugepages</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Network Tab */}
                            {createVmTab === 'network' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Network Type</label>
                                            <select
                                                value={createVmForm.networkType || VM_DEFAULTS.networkType}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, networkType: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.networkTypes.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                {createVmForm.networkType === 'bridge' ? 'Bridge Interface' : 'Network Name'}
                                            </label>
                                            <input
                                                type="text"
                                                value={createVmForm.networkSource || VM_DEFAULTS.networkSource}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, networkSource: e.target.value })}
                                                placeholder={createVmForm.networkType === 'bridge' ? 'br0' : 'default'}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Network Model</label>
                                            <select
                                                value={createVmForm.networkModel || VM_DEFAULTS.networkModel}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, networkModel: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.networkModels.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">MAC Address (optional)</label>
                                            <input
                                                type="text"
                                                value={createVmForm.macAddress || ''}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, macAddress: e.target.value })}
                                                placeholder="52:54:00:xx:xx:xx (auto-generate if empty)"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Display Tab */}
                            {createVmTab === 'display' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Graphics Type</label>
                                            <select
                                                value={createVmForm.graphicsType || VM_DEFAULTS.graphicsType}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, graphicsType: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.graphicsTypes.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Listen Address</label>
                                            <input
                                                type="text"
                                                value={createVmForm.graphicsListen || VM_DEFAULTS.graphicsListen}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, graphicsListen: e.target.value })}
                                                placeholder="0.0.0.0"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">VNC/SPICE Password (optional)</label>
                                            <input
                                                type="password"
                                                value={createVmForm.graphicsPassword || ''}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, graphicsPassword: e.target.value })}
                                                placeholder="Leave empty for no password"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Port (-1 = auto)</label>
                                            <input
                                                type="number"
                                                value={createVmForm.graphicsPort ?? -1}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, graphicsPort: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Video Model</label>
                                            <select
                                                value={createVmForm.videoModel || VM_DEFAULTS.videoModel}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, videoModel: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.videoModels.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Video RAM (KB)</label>
                                            <input
                                                type="number"
                                                min={1024}
                                                max={262144}
                                                step={1024}
                                                value={createVmForm.videoVram || VM_DEFAULTS.videoVram}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, videoVram: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Advanced Tab */}
                            {createVmTab === 'advanced' && (
                                <div className="space-y-4">
                                    {/* Machine & Architecture */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Machine Type</label>
                                            <select
                                                value={createVmForm.machine || VM_DEFAULTS.machine}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, machine: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.machines.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">Clock Offset</label>
                                            <select
                                                value={createVmForm.clockOffset || VM_DEFAULTS.clockOffset}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, clockOffset: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.clockOffsets.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Power Actions */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">On Poweroff</label>
                                            <select
                                                value={createVmForm.onPoweroff || VM_DEFAULTS.onPoweroff}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, onPoweroff: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.powerActions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">On Reboot</label>
                                            <select
                                                value={createVmForm.onReboot || VM_DEFAULTS.onReboot}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, onReboot: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.powerActions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-1">On Crash</label>
                                            <select
                                                value={createVmForm.onCrash || VM_DEFAULTS.onCrash}
                                                onChange={(e) => setCreateVmForm({ ...createVmForm, onCrash: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {VM_OPTIONS.powerActions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Feature Toggles */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-zinc-400">System Features</h4>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.acpi ?? VM_DEFAULTS.acpi}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, acpi: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">ACPI</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.apic ?? VM_DEFAULTS.apic}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, apic: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">APIC</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.uefi ?? false}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, uefi: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">UEFI Boot</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.secureBoot ?? false}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, secureBoot: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                    disabled={!createVmForm.uefi}
                                                />
                                                <span className={`text-sm ${!createVmForm.uefi ? 'text-zinc-500' : 'text-zinc-300'}`}>Secure Boot (requires UEFI)</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.bootMenu ?? false}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, bootMenu: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">Boot Menu</span>
                                            </label>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-zinc-400">Devices</h4>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.usb ?? VM_DEFAULTS.usb}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, usb: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">USB Controller</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.tablet ?? VM_DEFAULTS.tablet}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, tablet: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                    disabled={!createVmForm.usb}
                                                />
                                                <span className={`text-sm ${!createVmForm.usb ? 'text-zinc-500' : 'text-zinc-300'}`}>USB Tablet (better mouse)</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.serial ?? VM_DEFAULTS.serial}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, serial: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">Serial Console</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.tpm ?? false}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, tpm: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">TPM 2.0 (Windows 11)</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={createVmForm.autostart ?? false}
                                                    onChange={(e) => setCreateVmForm({ ...createVmForm, autostart: e.target.checked })}
                                                    className="rounded border-zinc-600"
                                                />
                                                <span className="text-sm text-zinc-300">Autostart with host</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
                            <button
                                onClick={() => setCreateVmDialogOpen(false)}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVm}
                                disabled={createVmLoading || !createVmForm.name.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
                            >
                                {createVmLoading && <Loader2 size={16} className="animate-spin" />}
                                Create VM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit VM Dialog */}
            {editVmDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                            <h2 className="text-lg font-bold text-zinc-100">Edit VM: {editVmName}</h2>
                            <button
                                onClick={() => {
                                    setEditVmDialogOpen(false);
                                    setEditVmName(null);
                                    setEditVmForm({});
                                    setEditVmOriginal(null);
                                }}
                                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            >
                                <X size={18} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-5 pt-3 shrink-0">
                            <Tabs
                                items={vmTabItems}
                                activeId={editVmTab}
                                onChange={setEditVmTab}
                            />
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {editVmLoading && !editVmOriginal ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Basic Tab */}
                                    {editVmTab === 'basic' && (
                                        <div className="space-y-4">
                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    value={editVmForm.description || ''}
                                                    onChange={(e) => setEditVmForm({ ...editVmForm, description: e.target.value })}
                                                    placeholder="Web server for production"
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* ISO Selection */}
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                    <Disc size={14} className="inline mr-1" />
                                                    CD-ROM ISO
                                                </label>
                                                <select
                                                    value={editVmForm.isoPath === '' ? '__eject__' : (editVmForm.isoPath || editVmOriginal?.isoPath || '')}
                                                    onChange={(e) => {
                                                        if (e.target.value === '__eject__') {
                                                            setEditVmForm({ ...editVmForm, isoPath: '' });
                                                        } else if (e.target.value === '') {
                                                            // 不變
                                                            const { isoPath, ...rest } = editVmForm;
                                                            setEditVmForm(rest);
                                                        } else {
                                                            setEditVmForm({ ...editVmForm, isoPath: e.target.value });
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No change (Current: {editVmOriginal?.isoPath ? editVmOriginal.isoPath.split('/').pop() : 'None'})</option>
                                                    <option value="__eject__">Eject CD-ROM</option>
                                                    {isoFiles.map((iso) => (
                                                        <option key={iso.path} value={iso.path}>
                                                            {iso.name} ({formatFileSize(iso.size)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Boot Order */}
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                    Boot Order
                                                    {editVmOriginal?.state === 'VIR_DOMAIN_RUNNING' && (
                                                        <span className="text-xs text-amber-400 ml-2">(requires restart)</span>
                                                    )}
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {VM_OPTIONS.bootDevices.map(device => (
                                                        <label key={device.value} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded border border-zinc-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={(editVmForm.bootOrder || editVmOriginal?.bootOrder || []).includes(device.value)}
                                                                onChange={(e) => {
                                                                    const current = editVmForm.bootOrder || editVmOriginal?.bootOrder || [];
                                                                    if (e.target.checked) {
                                                                        setEditVmForm({ ...editVmForm, bootOrder: [...current, device.value] });
                                                                    } else {
                                                                        setEditVmForm({ ...editVmForm, bootOrder: current.filter(d => d !== device.value) });
                                                                    }
                                                                }}
                                                                className="rounded border-zinc-600"
                                                            />
                                                            <span className="text-sm text-zinc-300">{device.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Autostart */}
                                            <div className="flex items-center gap-6 pt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editVmForm.autostart ?? editVmOriginal?.autostart ?? false}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, autostart: e.target.checked })}
                                                        className="rounded border-zinc-600"
                                                    />
                                                    <span className="text-sm text-zinc-300">Autostart with host</span>
                                                </label>
                                            </div>

                                            {/* VM Info (Read Only) */}
                                            {editVmOriginal && (
                                                <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <h4 className="text-sm font-medium text-zinc-400 mb-2">VM Information</h4>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div className="text-zinc-500">UUID:</div>
                                                        <div className="text-zinc-300 font-mono text-xs">{editVmOriginal.uuid}</div>
                                                        <div className="text-zinc-500">OS Type:</div>
                                                        <div className="text-zinc-300">{editVmOriginal.osType || 'Unknown'}</div>
                                                        <div className="text-zinc-500">Machine:</div>
                                                        <div className="text-zinc-300">{editVmOriginal.machine || 'Unknown'}</div>
                                                        <div className="text-zinc-500">Disk:</div>
                                                        <div className="text-zinc-300 text-xs font-mono truncate" title={editVmOriginal.diskPath || ''}>
                                                            {editVmOriginal.diskPath?.split('/').pop() || 'Unknown'}
                                                            {editVmOriginal.diskSizeBytes && ` (${formatFileSize(editVmOriginal.diskSizeBytes)})`}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Hardware Tab */}
                                    {editVmTab === 'hardware' && (
                                        <div className="space-y-4">
                                            {/* CPU Cores */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                        <Cpu size={14} className="inline mr-1" />
                                                        vCPU Cores
                                                        {editVmOriginal?.state === 'VIR_DOMAIN_RUNNING' && (
                                                            <span className="text-xs text-amber-400 ml-2">(requires restart)</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={64}
                                                        value={editVmForm.vcpu ?? editVmOriginal?.vcpu ?? 1}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, vcpu: parseInt(e.target.value) || 1 })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                        CPU Mode
                                                        {editVmOriginal?.state === 'VIR_DOMAIN_RUNNING' && (
                                                            <span className="text-xs text-amber-400 ml-2">(requires restart)</span>
                                                        )}
                                                    </label>
                                                    <select
                                                        value={editVmForm.cpuMode ?? editVmOriginal?.cpuMode ?? 'host-passthrough'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, cpuMode: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.cpuModes.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Memory */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                        <MemoryStick size={14} className="inline mr-1" />
                                                        Memory (MB)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={512}
                                                        max={262144}
                                                        step={512}
                                                        value={editVmForm.memoryMB ?? (editVmOriginal?.memory ? Math.round(editVmOriginal.memory / 1024 / 1024) : 2048)}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, memoryMB: parseInt(e.target.value) || 512 })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Max Memory (MB)</label>
                                                    <input
                                                        type="number"
                                                        min={512}
                                                        max={262144}
                                                        step={512}
                                                        value={editVmForm.maxMemoryMB ?? (editVmOriginal?.maxMemory ? Math.round(editVmOriginal.maxMemory / 1024 / 1024) : undefined)}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, maxMemoryMB: parseInt(e.target.value) || undefined })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Toggles */}
                                            <div className="flex items-center gap-6 pt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editVmForm.hugepages ?? editVmOriginal?.hugepages ?? false}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, hugepages: e.target.checked })}
                                                        className="rounded border-zinc-600"
                                                    />
                                                    <span className="text-sm text-zinc-300">Enable Hugepages</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Network Tab */}
                                    {editVmTab === 'network' && (
                                        <div className="space-y-4">
                                            {editVmOriginal?.state === 'VIR_DOMAIN_RUNNING' && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                    <p className="text-sm text-amber-400">
                                                        <AlertCircle size={14} className="inline mr-1" />
                                                        Network changes require VM restart to take effect
                                                    </p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Network Type</label>
                                                    <select
                                                        value={editVmForm.networkType ?? editVmOriginal?.networkType ?? 'network'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, networkType: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.networkTypes.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                        {(editVmForm.networkType ?? editVmOriginal?.networkType) === 'bridge' ? 'Bridge Interface' : 'Network Name'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editVmForm.networkSource ?? editVmOriginal?.networkSource ?? 'default'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, networkSource: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Network Model</label>
                                                    <select
                                                        value={editVmForm.networkModel ?? editVmOriginal?.networkModel ?? 'virtio'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, networkModel: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.networkModels.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">MAC Address</label>
                                                    <input
                                                        type="text"
                                                        value={editVmForm.macAddress ?? editVmOriginal?.macAddress ?? ''}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, macAddress: e.target.value })}
                                                        placeholder="52:54:00:xx:xx:xx"
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Display Tab */}
                                    {editVmTab === 'display' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Graphics Type</label>
                                                    <select
                                                        value={editVmForm.graphicsType ?? editVmOriginal?.graphicsType ?? 'vnc'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, graphicsType: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.graphicsTypes.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Listen Address</label>
                                                    <input
                                                        type="text"
                                                        value={editVmForm.graphicsListen ?? editVmOriginal?.graphicsListen ?? '0.0.0.0'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, graphicsListen: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">VNC/SPICE Password</label>
                                                    <input
                                                        type="password"
                                                        value={editVmForm.graphicsPassword ?? ''}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, graphicsPassword: e.target.value })}
                                                        placeholder="Leave empty to keep current"
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Port</label>
                                                    <input
                                                        type="number"
                                                        value={editVmForm.graphicsPort ?? editVmOriginal?.graphicsPort ?? -1}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, graphicsPort: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Video Model</label>
                                                    <select
                                                        value={editVmForm.videoModel ?? editVmOriginal?.videoModel ?? 'qxl'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, videoModel: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.videoModels.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Video RAM (KB)</label>
                                                    <input
                                                        type="number"
                                                        min={1024}
                                                        max={262144}
                                                        step={1024}
                                                        value={editVmForm.videoVram ?? editVmOriginal?.videoVram ?? 65536}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, videoVram: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Advanced Tab */}
                                    {editVmTab === 'advanced' && (
                                        <div className="space-y-4">
                                            {/* Clock Offset */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                                        Clock Offset
                                                        {editVmOriginal?.state === 'VIR_DOMAIN_RUNNING' && (
                                                            <span className="text-xs text-amber-400 ml-2">(requires restart)</span>
                                                        )}
                                                    </label>
                                                    <select
                                                        value={editVmForm.clockOffset ?? editVmOriginal?.clockOffset ?? 'utc'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, clockOffset: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.clockOffsets.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Power Actions */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">On Poweroff</label>
                                                    <select
                                                        value={editVmForm.onPoweroff ?? editVmOriginal?.onPoweroff ?? 'destroy'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, onPoweroff: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.powerActions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">On Reboot</label>
                                                    <select
                                                        value={editVmForm.onReboot ?? editVmOriginal?.onReboot ?? 'restart'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, onReboot: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.powerActions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-1">On Crash</label>
                                                    <select
                                                        value={editVmForm.onCrash ?? editVmOriginal?.onCrash ?? 'destroy'}
                                                        onChange={(e) => setEditVmForm({ ...editVmForm, onCrash: e.target.value })}
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {VM_OPTIONS.powerActions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Feature Toggles */}
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium text-zinc-400">System Features</h4>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.acpi ?? editVmOriginal?.acpi ?? true}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, acpi: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">ACPI</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.apic ?? editVmOriginal?.apic ?? true}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, apic: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">APIC</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.bootMenu ?? editVmOriginal?.bootMenu ?? false}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, bootMenu: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">Boot Menu</span>
                                                    </label>
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium text-zinc-400">Devices</h4>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.usb ?? editVmOriginal?.usb ?? true}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, usb: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">USB Controller</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.tablet ?? editVmOriginal?.tablet ?? true}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, tablet: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">USB Tablet (better mouse)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.serial ?? editVmOriginal?.serial ?? true}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, serial: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">Serial Console</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editVmForm.tpm ?? editVmOriginal?.tpm ?? false}
                                                            onChange={(e) => setEditVmForm({ ...editVmForm, tpm: e.target.checked })}
                                                            className="rounded border-zinc-600"
                                                        />
                                                        <span className="text-sm text-zinc-300">TPM 2.0 (Windows 11)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
                            {editVmOriginal && editVmOriginal.state === 'VIR_DOMAIN_RUNNING' ? (
                                <p className="text-xs text-amber-400">
                                    <AlertCircle size={12} className="inline mr-1" />
                                    Some settings require VM restart to take effect
                                </p>
                            ) : <div />}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditVmDialogOpen(false);
                                        setEditVmName(null);
                                        setEditVmForm({});
                                        setEditVmOriginal(null);
                                    }}
                                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateVm}
                                    disabled={editVmLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
                                >
                                    {editVmLoading && <Loader2 size={16} className="animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VNC Console */}
            {consoleVm && (
                <VncConsole vmName={consoleVm} onClose={() => setConsoleVm(null)} />
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
