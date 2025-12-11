import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ActionButton, Alert, CommandCard } from '../../../components/ui';

// ==================== UFW Setup Guide Component ====================

interface UfwSetupGuideProps {
    onRetry: () => void;
}

export const UfwSetupGuide: React.FC<UfwSetupGuideProps> = ({ onRetry }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                    <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">UFW Setup Required</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Failed to get firewall status. Make sure{' '}
                        <code className="bg-zinc-800 px-1 rounded">ufw</code> is installed and the
                        backend has proper permissions.
                    </p>
                </div>
            </div>

            {/* Installation Command */}
            <CommandCard title="Install UFW" command="sudo apt install ufw" />

            <Alert variant="info">
                After installing, restart Hashi backend for changes to take effect.
            </Alert>

            {/* Retry Button */}
            <div className="flex justify-start">
                <ActionButton onClick={onRetry} icon={<RefreshCw size={16} />}>
                    Retry Detection
                </ActionButton>
            </div>
        </div>
    );
};

export default UfwSetupGuide;
