import React, { useState, useEffect } from 'react';
import { PageHeader, Toast, ActionButton } from '../../components';
import { Tabs, TabItem, Alert } from '../../components/ui';
import { FtpService } from '../../services/api';
import { FtpServerInfo, FtpServerType } from '../../types';
import { Server, Users, FileText, ScrollText, RefreshCw, Loader2, Download, AlertCircle } from 'lucide-react';
import FtpStatusPanel from './components/FtpStatusPanel';
import FtpUsersPanel from './components/FtpUsersPanel';
import FtpConfigPanel from './components/FtpConfigPanel';
import FtpLogsPanel from './components/FtpLogsPanel';

// ==================== Tab Configuration ====================

type FtpTabId = 'status' | 'users' | 'config' | 'logs';

const FTP_TABS: TabItem[] = [
    { id: 'status', label: 'Status', icon: Server },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'config', label: 'Config', icon: FileText },
    { id: 'logs', label: 'Logs', icon: ScrollText }
];

// ==================== Setup Guide Component ====================

const FtpSetupGuide: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="space-y-6">
        <Alert variant="warning" icon={AlertCircle} title="No FTP Server Detected">
            Install one of the following FTP servers to continue:
        </Alert>

        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-border">
                <div>
                    <span className="text-sm font-medium text-zinc-200">vsftpd</span>
                    <span className="ml-2 text-xs text-emerald-400">(Recommended)</span>
                </div>
                <code className="text-sm font-mono text-zinc-400">sudo apt install vsftpd</code>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-border">
                <span className="text-sm font-medium text-zinc-200">proftpd</span>
                <code className="text-sm font-mono text-zinc-400">sudo apt install proftpd</code>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded border border-border">
                <span className="text-sm font-medium text-zinc-200">pure-ftpd</span>
                <code className="text-sm font-mono text-zinc-400">sudo apt install pure-ftpd</code>
            </div>
        </div>

        <Alert variant="info">
            After installing, restart Hashi backend for changes to take effect.
        </Alert>

        <div className="flex">
            <ActionButton onClick={onRetry} icon={<RefreshCw size={16} />}>
                Retry Detection
            </ActionButton>
        </div>
    </div>
);

// ==================== Main Component ====================

const FtpManager: React.FC = () => {
    const [servers, setServers] = useState<FtpServerInfo[]>([]);
    const [selectedServer, setSelectedServer] = useState<FtpServerType | null>(null);
    const [activeTab, setActiveTab] = useState<FtpTabId>('status');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const loadServers = async () => {
        try {
            setLoading(true);
            const data = await FtpService.detectServers();
            setServers(data);

            // 自動選擇第一個
            if (data.length > 0 && !selectedServer) {
                setSelectedServer(data[0].type);
            }
        } catch (err) {
            console.error('Failed to detect FTP servers:', err);
            setToast({ message: 'Failed to detect FTP servers', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServers();
    }, []);

    const currentServer = servers.find(s => s.type === selectedServer);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="FTP Server"
                icon={Server}
                iconColor="text-orange-500"
                description="Manage FTP server configuration and users"
                actions={
                    <div className="flex items-center gap-3">
                        {/* Server Selector (only if multiple) */}
                        {servers.length > 1 && (
                            <select
                                value={selectedServer || ''}
                                onChange={(e) => setSelectedServer(e.target.value as FtpServerType)}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                {servers.map(server => (
                                    <option key={server.type} value={server.type}>
                                        {server.type} {server.running ? '(running)' : '(stopped)'}
                                    </option>
                                ))}
                            </select>
                        )}
                        <button
                            onClick={loadServers}
                            disabled={loading}
                            className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : servers.length === 0 ? (
                <FtpSetupGuide onRetry={loadServers} />
            ) : selectedServer && currentServer ? (
                <>
                    {/* Single server info */}
                    {servers.length === 1 && (
                        <Alert variant="info" icon={Server}>
                            Using <strong>{currentServer.type}</strong> |
                            Config: <code className="bg-blue-500/20 px-1 rounded">{currentServer.configPath}</code>
                        </Alert>
                    )}

                    {/* Tabs */}
                    <Tabs
                        items={FTP_TABS}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as FtpTabId)}
                    />

                    {/* Tab Content */}
                    {activeTab === 'status' && (
                        <FtpStatusPanel
                            serverType={selectedServer}
                            onToast={setToast}
                        />
                    )}
                    {activeTab === 'users' && (
                        <FtpUsersPanel
                            serverType={selectedServer}
                            onToast={setToast}
                        />
                    )}
                    {activeTab === 'config' && (
                        <FtpConfigPanel
                            serverType={selectedServer}
                            configPath={currentServer.configPath}
                            onToast={setToast}
                        />
                    )}
                    {activeTab === 'logs' && (
                        <FtpLogsPanel
                            serverType={selectedServer}
                        />
                    )}
                </>
            ) : null}

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

export default FtpManager;
