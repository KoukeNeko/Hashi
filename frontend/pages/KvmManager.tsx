import React, { useState, useEffect, useRef } from 'react';
import { VM, CreateVmRequest, IsoFile } from '../types';
import { VirtService } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { 
    Monitor, Power, RotateCcw, HardDrive, Cpu, MemoryStick, 
    Loader2, RefreshCw, AlertCircle, Play, Square, Terminal, Copy, CheckCircle,
    Plus, Trash2, Upload, Disc, X
} from 'lucide-react';
import { Toast, ActionButton, ConfirmDialog } from '../components/ui';

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
        isoPath: ''
    });
    const [createVmLoading, setCreateVmLoading] = useState(false);

    // ISO Upload
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setCreateVmForm({ name: '', vcpu: 2, memoryMB: 2048, diskGB: 20, osType: 'linux', isoPath: '' });
            loadVms();
        } catch (error) {
            console.error('Failed to create VM:', error);
            setToast({ message: `Failed to create VM "${createVmForm.name}"`, type: 'error' });
        } finally {
            setCreateVmLoading(false);
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
                    <div className="bg-surface border border-border rounded-lg w-full max-w-lg shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-zinc-100">Create Virtual Machine</h2>
                            <button
                                onClick={() => setCreateVmDialogOpen(false)}
                                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            >
                                <X size={18} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
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

                            {/* OS Type */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">OS Type</label>
                                <select
                                    value={createVmForm.osType}
                                    onChange={(e) => setCreateVmForm({ ...createVmForm, osType: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="linux">Linux</option>
                                    <option value="windows">Windows</option>
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

                            {/* CPU & Memory in row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                                        <Cpu size={14} className="inline mr-1" />
                                        CPU Cores
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
                            </div>

                            {/* Disk Size */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">
                                    <HardDrive size={14} className="inline mr-1" />
                                    Disk Size (GB)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={2048}
                                    value={createVmForm.diskGB}
                                    onChange={(e) => setCreateVmForm({ ...createVmForm, diskGB: parseInt(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
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
                                Create
                            </button>
                        </div>
                    </div>
                </div>
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
