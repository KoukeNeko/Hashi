import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ActionButton, CommandCard } from '../../../components/ui';

// ==================== Nginx Setup Guide Component ====================

interface NginxSetupGuideProps {
    onRetry: () => void;
}

export const NginxSetupGuide: React.FC<NginxSetupGuideProps> = ({ onRetry }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                    <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">Nginx Not Installed</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        The Nginx web server is not detected on this system. To use this feature, please install Nginx and Certbot:
                    </p>
                </div>
            </div>

            {/* Installation Command */}
            <CommandCard
                title="Install Nginx, Certbot & dependencies"
                command="sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx socat"
            />

            {/* Retry Button */}
            <div className="flex justify-start">
                <ActionButton onClick={onRetry} icon={<RefreshCw size={16} />}>
                    Retry Detection
                </ActionButton>
            </div>
        </div>
    );
};

export default NginxSetupGuide;
