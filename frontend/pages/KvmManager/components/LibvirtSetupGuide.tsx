import React from 'react';
import { AlertCircle, Terminal, RefreshCw } from 'lucide-react';
import { ActionButton, Alert, CommandList, CommandStep } from '../../../components/ui';

// ==================== Libvirt Setup Commands ====================

const LIBVIRT_COMMANDS: CommandStep[] = [
    {
        title: 'Install KVM & Libvirt',
        command:
            'sudo apt update && sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils',
    },
    {
        title: 'Install development libraries (required for Java)',
        command: 'sudo apt install -y libvirt-dev',
    },
    {
        title: 'Add user to libvirt group',
        command: 'sudo usermod -aG libvirt $USER',
    },
    {
        title: 'Start & enable libvirtd',
        command: 'sudo systemctl enable --now libvirtd',
    },
    {
        title: 'Set images directory permissions (for VM disk creation)',
        command:
            'sudo chown root:libvirt /var/lib/libvirt/images && sudo chmod 775 /var/lib/libvirt/images',
    },
];

// ==================== Setup Guide Component ====================

export const LibvirtSetupGuide: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                    <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">Libvirt Setup Required</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        KVM/Libvirt is not configured on this server. Please run the following
                        commands to set it up:
                    </p>
                </div>
            </div>

            {/* Command List */}
            <CommandList commands={LIBVIRT_COMMANDS} />

            {/* Info Alert */}
            <Alert variant="info" icon={Terminal}>
                <p className="font-medium">After running the commands:</p>
                <ul className="mt-2 space-y-1 text-blue-300/80">
                    <li>• Log out and log back in (for group changes to take effect)</li>
                    <li>• Restart the Hashi backend service</li>
                    <li>
                        • Place ISO files in{' '}
                        <code className="bg-zinc-800 px-1 rounded">/var/lib/libvirt/images/</code>
                    </li>
                    <li>• Click the button below to retry</li>
                </ul>
            </Alert>

            {/* Retry Button */}
            <div className="flex justify-start">
                <ActionButton onClick={onRetry} icon={<RefreshCw size={16} />}>
                    Retry Connection
                </ActionButton>
            </div>
        </div>
    );
};
