import React, { useState } from 'react';
import { AlertCircle, Terminal, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { ActionButton, Alert } from '../../../components/ui';

// ==================== Docker Setup Guide Component ====================

interface DockerSetupGuideProps {
    onRetry: () => void;
}

export const DockerSetupGuide: React.FC<DockerSetupGuideProps> = ({ onRetry }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const commands = [
        {
            title: 'Install prerequisites',
            cmd: 'sudo apt update && sudo apt install -y ca-certificates curl gnupg'
        },
        {
            title: 'Add Docker GPG key',
            cmd: 'sudo install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg && sudo chmod a+r /etc/apt/keyrings/docker.gpg'
        },
        {
            title: 'Add Docker repository',
            cmd: 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null'
        },
        {
            title: 'Install Docker Engine',
            cmd: 'sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin'
        },
        {
            title: 'Add user to docker group',
            cmd: 'sudo usermod -aG docker $USER'
        },
        {
            title: 'Start & enable Docker',
            cmd: 'sudo systemctl enable --now docker'
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                    <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">Docker Setup Required</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Docker is not installed or not running on this server. Please run the following commands to set it up:
                    </p>
                </div>
            </div>

            {/* Command List */}
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

            {/* Info Alert */}
            <Alert variant="info" icon={Terminal}>
                <p className="font-medium">After running the commands:</p>
                <ul className="mt-2 space-y-1 text-blue-300/80">
                    <li>• Log out and log back in (for group changes to take effect)</li>
                    <li>• Restart the Hashi backend service</li>
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
