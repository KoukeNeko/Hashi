import React, { useState, useEffect } from 'react';
import { PageHeader, Tabs, Alert } from '../../components';
import { NginxApiService } from '../../services/api';
import { NginxHostDTO, NginxStatusDTO, SslCertDTO } from '../../types';
import { AddHostDialog } from './components';
import {
    Globe, ShieldCheck, Server, Plus, Power, RefreshCw, Trash2, Edit,
    Calendar, Loader2, AlertCircle, CheckCircle, XCircle, ArrowUpDown
} from 'lucide-react';

const NginxManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hosts' | 'ssl'>('hosts');

    // 資料狀態
    const [hosts, setHosts] = useState<NginxHostDTO[]>([]);
    const [certificates, setCertificates] = useState<SslCertDTO[]>([]);
    const [status, setStatus] = useState<NginxStatusDTO | null>(null);

    // UI 狀態
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloading, setReloading] = useState(false);
    const [togglingHost, setTogglingHost] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const tabs = [
        { id: 'hosts', label: 'Virtual Hosts', icon: Server },
        { id: 'ssl', label: 'SSL Certificates', icon: ShieldCheck },
    ];

    // 載入資料
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statusData, hostsData, certsData] = await Promise.all([
                NginxApiService.getStatus(),
                NginxApiService.listHosts(),
                NginxApiService.listCertificates()
            ]);
            setStatus(statusData);
            setHosts(hostsData);
            setCertificates(certsData);
        } catch (err: any) {
            console.error('Failed to load nginx data:', err);
            setError('Failed to load Nginx data. Is Nginx installed?');
        } finally {
            setLoading(false);
        }
    };

    // 重載 Nginx
    const handleReload = async () => {
        setReloading(true);
        try {
            await NginxApiService.reload();
            await loadData();
        } catch (err) {
            console.error('Failed to reload nginx:', err);
        } finally {
            setReloading(false);
        }
    };

    // 切換 Host 狀態
    const handleToggleHost = async (host: NginxHostDTO) => {
        setTogglingHost(host.name);
        try {
            if (host.enabled) {
                await NginxApiService.disableHost(host.name);
            } else {
                await NginxApiService.enableHost(host.name);
            }
            await loadData();
        } catch (err) {
            console.error('Failed to toggle host:', err);
        } finally {
            setTogglingHost(null);
        }
    };

    // 刪除 Host
    const handleDeleteHost = async (name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await NginxApiService.deleteHost(name);
            await loadData();
        } catch (err) {
            console.error('Failed to delete host:', err);
        }
    };

    // 取得 Host 類型標籤
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'proxy': return 'Reverse Proxy';
            case 'php': return 'PHP';
            default: return 'Static';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'proxy': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'php': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-zinc-700 text-zinc-300 border-zinc-600';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Nginx Web Server"
                    icon={Globe}
                    description="Manage virtual hosts, reverse proxies, and SSL certificates."
                />
                <Alert variant="warning">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={loadData}
                            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Nginx Web Server"
                icon={Globe}
                description="Manage virtual hosts, reverse proxies, and SSL certificates."
                actions={
                    <div className="flex items-center gap-3">
                        {/* 狀態指示器 */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
                            {status?.running ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                            ) : (
                                <XCircle size={14} className="text-rose-400" />
                            )}
                            <span className="text-sm text-zinc-300">
                                {status?.running ? 'Running' : 'Stopped'}
                            </span>
                            {status?.version && (
                                <span className="text-xs text-zinc-500">v{status.version}</span>
                            )}
                        </div>

                        {/* 重載按鈕 */}
                        <button
                            onClick={handleReload}
                            disabled={reloading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
                        >
                            <RefreshCw size={14} className={reloading ? 'animate-spin' : ''} />
                            Reload
                        </button>

                        {/* 新增按鈕 */}
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors border border-emerald-500/50 flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">Add Host</span>
                        </button>
                    </div>
                }
            />

            {/* 設定警告 */}
            {status && !status.configValid && (
                <Alert variant="error">
                    <strong>Configuration Error:</strong> {status.configMessage}
                </Alert>
            )}

            <Tabs
                items={tabs}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'hosts' | 'ssl')}
            />

            {activeTab === 'hosts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hosts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-zinc-500">
                            <Server size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No virtual hosts configured yet.</p>
                            <p className="text-sm mt-1">Click "Add Host" to create one.</p>
                        </div>
                    ) : (
                        hosts.map(host => (
                            <div key={host.name} className="bg-surface border border-border rounded-lg p-5 shadow-lg group hover:border-emerald-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${host.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {host.type === 'proxy' ? <ArrowUpDown size={20} /> : <Server size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-200">{host.domain}</h3>
                                            <span className="text-xs font-mono text-zinc-500">:{host.port}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${host.enabled
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                            {host.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${getTypeColor(host.type)}`}>
                                            {getTypeLabel(host.type)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    {host.type === 'proxy' ? (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Proxy To</span>
                                            <span className="font-mono text-zinc-300 text-xs truncate max-w-[150px]" title={host.proxyPass}>
                                                {host.proxyPass}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">Root</span>
                                            <span className="font-mono text-zinc-300 text-xs truncate max-w-[150px]" title={host.root}>
                                                {host.root}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">SSL</span>
                                        <span className={`font-mono text-xs ${host.sslEnabled ? 'text-emerald-400' : 'text-amber-500'}`}>
                                            {host.sslEnabled ? 'Encrypted' : 'Off'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Features</span>
                                        <div className="flex gap-1">
                                            {host.gzip && <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">GZIP</span>}
                                            {host.rateLimit && <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">RATE</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-border">
                                    <button className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                                        <Edit size={12} /> Config
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDeleteHost(host.name)}
                                            className="p-1.5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleHost(host)}
                                            disabled={togglingHost === host.name}
                                            className={`p-1.5 rounded transition-colors ${host.enabled
                                                ? 'hover:bg-rose-500/20 text-rose-400'
                                                : 'hover:bg-emerald-500/20 text-emerald-400'
                                                }`}
                                            title={host.enabled ? 'Disable' : 'Enable'}
                                        >
                                            {togglingHost === host.name ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Power size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'ssl' && (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                    <th className="p-4 font-medium">Domain</th>
                                    <th className="p-4 font-medium">Issuer</th>
                                    <th className="p-4 font-medium">Expires</th>
                                    <th className="p-4 font-medium">Days Left</th>
                                    <th className="p-4 font-medium">Auto Renew</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border">
                                {certificates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                                            No SSL certificates found.
                                        </td>
                                    </tr>
                                ) : (
                                    certificates.map(cert => (
                                        <tr key={cert.domain} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4 font-bold text-zinc-200 flex items-center gap-2">
                                                <ShieldCheck size={16} className="text-emerald-500" />
                                                {cert.domain}
                                            </td>
                                            <td className="p-4 text-zinc-400">{cert.issuer}</td>
                                            <td className="p-4 font-mono text-zinc-300">{cert.expireDate}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${cert.daysRemaining <= 7
                                                    ? 'bg-rose-500/10 text-rose-400'
                                                    : cert.daysRemaining <= 30
                                                        ? 'bg-amber-500/10 text-amber-400'
                                                        : 'bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                    {cert.daysRemaining} days
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${cert.autoRenew
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {cert.autoRenew ? 'ON' : 'MANUAL'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 text-zinc-500">
                                                    <button className="hover:text-emerald-400 transition-colors p-1" title="Renew Now">
                                                        <RefreshCw size={16} />
                                                    </button>
                                                    <button className="hover:text-rose-400 transition-colors p-1" title="Revoke">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
                        {certificates.map(cert => (
                            <div key={cert.domain} className="bg-surface border border-border rounded-lg p-5 shadow-lg group hover:border-emerald-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-200 break-all">{cert.domain}</h3>
                                            <span className="text-xs text-zinc-500">{cert.issuer}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide shrink-0 ml-2 ${cert.autoRenew
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {cert.autoRenew ? 'Auto' : 'Man'}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                        <span className="text-zinc-500 flex items-center gap-2"><Calendar size={14} /> Expires</span>
                                        <span className="font-mono text-zinc-300 text-xs">{cert.expireDate}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Days Left</span>
                                        <span className={`text-xs font-medium ${cert.daysRemaining <= 7 ? 'text-rose-400' :
                                            cert.daysRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400'
                                            }`}>
                                            {cert.daysRemaining} days
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-border">
                                    <div className="text-xs text-zinc-600">{cert.source}</div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded text-xs font-medium transition-colors" title="Renew">
                                            <RefreshCw size={14} /> Renew
                                        </button>
                                        <button className="p-1.5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded transition-colors" title="Revoke">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Add Host Dialog */}
            <AddHostDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

export default NginxManager;