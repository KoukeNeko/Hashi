import React from 'react';
import { AlertCircle, Terminal, RefreshCw } from 'lucide-react';
import { ActionButton, Alert, CommandList, CommandStep } from '../../../components/ui';

// ==================== Docker Setup Guide Component ====================

interface DockerSetupGuideProps {
    onRetry: () => void;
}

const DOCKER_COMMANDS: CommandStep[] = [
    {
        title: 'Install prerequisites',
        command: 'sudo apt update && sudo apt install -y ca-certificates curl gnupg',
    },
    {
        title: 'Add Docker GPG key',
        command:
            'sudo install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg && sudo chmod a+r /etc/apt/keyrings/docker.gpg',
    },
    {
        title: 'Add Docker repository',
        command:
            'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
    },
    {
        title: 'Install Docker Engine',
        command:
            'sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin',
    },
    {
        title: 'Add user to docker group',
        command: 'sudo usermod -aG docker $USER',
    },
    {
        title: 'Start & enable Docker',
        command: 'sudo systemctl enable --now docker',
    },
];

export const DockerSetupGuide: React.FC<DockerSetupGuideProps> = ({ onRetry }) => {
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
                        Docker is not installed or not running on this server. Please run the
                        following commands to set it up:
                    </p>
                </div>
            </div>

            {/* Command List */}
            <CommandList commands={DOCKER_COMMANDS} />

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
