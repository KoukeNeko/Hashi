import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    GitBranch,
} from 'lucide-react';
import { UpdateInfo, UpdateChannel } from '../../../types';
import { UpdateService } from '../../../services/api';

/** Channel display configuration */
const CHANNEL_CONFIG: Record<UpdateChannel, { label: string; color: string; description: string }> =
{
    stable: {
        label: 'Stable',
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
        description: 'Recommended for production use',
    },
    beta: {
        label: 'Beta',
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
        description: 'Preview features before stable release',
    },
    dev: {
        label: 'Development',
        color: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
        description: 'Latest builds, may be unstable',
    },
};

const UpdatePanel: React.FC = () => {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadUpdateInfo = useCallback(async () => {
        try {
            setError(null);
            const info = await UpdateService.getUpdateInfo();
            setUpdateInfo(info);
        } catch (err) {
            console.error('Failed to load update info:', err);
            setError('Failed to load update information');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCheckForUpdates = async () => {
        setChecking(true);
        setError(null);
        try {
            const info = await UpdateService.checkForUpdates();
            setUpdateInfo(info);
        } catch (err) {
            console.error('Failed to check for updates:', err);
            setError('Failed to check for updates');
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        loadUpdateInfo();
    }, [loadUpdateInfo]);

    const formatLastChecked = (timestamp: string): string => {
        if (!timestamp || timestamp === 'never') return 'Never';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch {
            return timestamp;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    const channelInfo = updateInfo?.channel
        ? CHANNEL_CONFIG[updateInfo.channel]
        : CHANNEL_CONFIG.dev;

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                    <AlertCircle className="text-rose-400 shrink-0" size={20} />
                    <span className="text-rose-400">{error}</span>
                </div>
            )}

            {/* Version Info Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        {/* Current Version */}
                        <div>
                            <p className="text-xs uppercase font-medium text-zinc-500 mb-1">
                                Current Version
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-white">
                                    v{updateInfo?.currentVersion || '0.0.0'}
                                </span>
                                <span
                                    className={`text-xs px-2 py-1 rounded border ${channelInfo.color}`}
                                >
                                    {channelInfo.label}
                                </span>
                            </div>
                        </div>

                        {/* Latest Version */}
                        {updateInfo?.latestVersion && updateInfo.latestVersion !== 'unknown' && (
                            <div>
                                <p className="text-xs uppercase font-medium text-zinc-500 mb-1">
                                    Latest Available
                                </p>
                                <span className="text-lg text-zinc-300">
                                    v{updateInfo.latestVersion}
                                </span>
                            </div>
                        )}

                        {/* Last Checked */}
                        <p className="text-xs text-zinc-600">
                            Last checked: {formatLastChecked(updateInfo?.lastChecked || '')}
                        </p>
                    </div>

                    {/* Update Status Badge */}
                    <div className="text-right">
                        {updateInfo?.updateAvailable ? (
                            <div className="flex items-center gap-2 text-amber-400">
                                <Download size={20} />
                                <span className="font-medium">Update Available</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 size={20} />
                                <span className="font-medium">Up to Date</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Check Button */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <button
                        onClick={handleCheckForUpdates}
                        disabled={checking}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-medium rounded-md transition-colors"
                    >
                        {checking ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {checking ? 'Checking...' : 'Check for Updates'}
                    </button>
                </div>
            </div>

            {/* Update Available Actions */}
            {updateInfo?.updateAvailable && updateInfo.downloadUrl && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">
                        New version available: v{updateInfo.latestVersion}
                    </h3>
                    <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-md transition-colors"
                    >
                        <ExternalLink size={16} />
                        View Release on GitHub
                    </a>

                    {/* Release Notes */}
                    {updateInfo.releaseNotes && (
                        <div className="mt-4">
                            <p className="text-xs uppercase font-medium text-zinc-500 mb-2">
                                Release Notes
                            </p>
                            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-sm text-zinc-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {updateInfo.releaseNotes}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Update Channels */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <GitBranch className="text-zinc-500" size={18} />
                    <h3 className="text-base font-semibold text-zinc-300">Update Channels</h3>
                </div>

                <div className="grid gap-3">
                    {Object.entries(CHANNEL_CONFIG).map(([channel, config]) => {
                        const isActive = updateInfo?.channel === channel;
                        return (
                            <div
                                key={channel}
                                className={`flex items-center justify-between p-4 rounded-lg border ${isActive
                                        ? config.color
                                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{config.label}</span>
                                        {isActive && (
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs mt-1 opacity-70">{config.description}</p>
                                </div>

                                {!isActive && (
                                    <div className="text-right text-xs">
                                        <code className="bg-zinc-800 px-2 py-1 rounded font-mono">
                                            apt install hashi{channel === 'stable' ? '' : `-${channel}`}
                                        </code>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-zinc-600 mt-4">
                    To switch channels, install the corresponding package from our APT repository.
                </p>
            </div>
        </div>
    );
};

export default UpdatePanel;
