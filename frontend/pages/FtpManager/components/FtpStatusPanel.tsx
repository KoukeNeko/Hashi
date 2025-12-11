import React, { useState, useEffect } from 'react';
import { FtpService } from '../../../services/api';
import { FtpServerInfo, FtpServerType } from '../../../types';
import { ActionButton } from '../../../components';
import { Power, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface FtpStatusPanelProps {
    serverType: FtpServerType;
    onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

const FtpStatusPanel: React.FC<FtpStatusPanelProps> = ({ serverType, onToast }) => {
    const [status, setStatus] = useState<FtpServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await FtpService.getStatus(serverType);
            setStatus(data);
        } catch (err) {
            console.error('Failed to load status:', err);
            onToast({ message: 'Failed to load FTP status', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, [serverType]);

    const handleToggle = async () => {
        if (!status) return;

        try {
            setToggling(true);
            await FtpService.setEnabled(serverType, !status.running);
            onToast({
                message: `FTP server ${!status.running ? 'started' : 'stopped'} successfully`,
                type: 'success',
            });
            loadStatus();
        } catch (err) {
            console.error('Failed to toggle service:', err);
            onToast({ message: 'Failed to toggle FTP service', type: 'error' });
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!status) return null;

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-surface border border-border rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className={`p-4 rounded-full ${status.running ? 'bg-emerald-500/20' : 'bg-zinc-700'}`}
                        >
                            {status.running ? (
                                <CheckCircle size={32} className="text-emerald-400" />
                            ) : (
                                <XCircle size={32} className="text-zinc-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-100">{serverType}</h3>
                            <p
                                className={`text-sm font-medium ${status.running ? 'text-emerald-400' : 'text-zinc-500'}`}
                            >
                                {status.running ? 'Running' : 'Stopped'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadStatus}
                            disabled={loading}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <ActionButton
                            onClick={handleToggle}
                            disabled={toggling}
                            variant={status.running ? 'danger' : 'primary'}
                            loading={toggling}
                            icon={<Power size={16} />}
                            loadingIcon={<Loader2 size={16} className="animate-spin" />}
                        >
                            {status.running ? 'Stop' : 'Start'}
                        </ActionButton>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-lg">
                <div className="px-4 py-3 bg-zinc-900 border-b border-border">
                    <h3 className="text-sm font-medium text-zinc-300">Service Details</h3>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Service Name</span>
                        <span className="text-zinc-200 font-mono">{status.serviceName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Config Path</span>
                        <span className="text-zinc-200 font-mono">{status.configPath}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Auto Start</span>
                        <span className={status.enabled ? 'text-emerald-400' : 'text-zinc-500'}>
                            {status.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FtpStatusPanel;
