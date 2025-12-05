import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ServiceItem } from '../types';
import { SystemdService } from '../services/api';
import { Settings2, Play, Square, RefreshCw, Search, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { Toast } from '../components/ui';

// Toast 通知類型
interface ToastItem {
    id: number;
    type: 'success' | 'error';
    message: string;
}

const ServiceManager: React.FC = () => {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // 載入服務列表
    const loadServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await SystemdService.listServices();
            // 排序：active 在前，failed 次之，inactive 最後
            const sorted = data.sort((a, b) => {
                const order = { active: 0, failed: 1, inactive: 2 };
                const aOrder = order[a.activeState as keyof typeof order] ?? 3;
                const bOrder = order[b.activeState as keyof typeof order] ?? 3;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return a.name.localeCompare(b.name);
            });
            setServices(sorted);
        } catch (err) {
            console.error('Failed to load services:', err);
            setError('Failed to load services. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    // 顯示 Toast 通知
    const showToast = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        // 自動消失
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    // 移除 Toast
    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // 控制服務
    const handleControl = async (name: string, action: 'start' | 'stop' | 'restart') => {
        setActionLoading(`${name}-${action}`);
        try {
            await SystemdService.controlService(name, action);
            showToast('success', `Successfully ${action}ed ${name}`);
            // 等一下再重新載入，讓 systemd 有時間更新狀態
            setTimeout(() => {
                loadServices();
            }, 500);
        } catch (err: any) {
            console.error(`Failed to ${action} service:`, err);
            // 處理錯誤訊息，確保是字串
            let errorMsg = 'Unknown error';
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string' 
                    ? err.response.data 
                    : err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
            } else if (err.message) {
                errorMsg = err.message;
            }
            showToast('error', `Failed to ${action} ${name}: ${errorMsg}`);
        } finally {
            setActionLoading(null);
        }
    };

    // 篩選服務
    const filteredServices = services.filter(svc =>
        svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        svc.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 統計
    const stats = {
        total: services.length,
        active: services.filter(s => s.activeState === 'active').length,
        failed: services.filter(s => s.activeState === 'failed').length,
        inactive: services.filter(s => s.activeState === 'inactive').length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="System Services"
                icon={Settings2}
                iconColor="text-purple-500"
                description="Manage systemd units and init scripts."
                actions={
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Filter services..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-purple-500 w-64 shadow-lg transition-colors"
                            />
                        </div>
                        <button
                            onClick={loadServices}
                            disabled={loading}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 border border-zinc-700 disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            />

            {/* Stats Bar */}
            <div className="flex gap-4 text-sm">
                <div className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 flex items-center gap-2">
                    <span className="text-zinc-500">Total:</span>
                    <span className="text-white font-medium">{stats.total}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-zinc-500">Active:</span>
                    <span className="text-emerald-400 font-medium">{stats.active}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-zinc-500">Failed:</span>
                    <span className="text-rose-400 font-medium">{stats.failed}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                    <span className="text-zinc-500">Inactive:</span>
                    <span className="text-zinc-400 font-medium">{stats.inactive}</span>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button 
                        onClick={() => setError(null)}
                        className="ml-auto text-rose-400 hover:text-rose-300"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium">Unit Name</th>
                                <th className="p-4 font-medium">Description</th>
                                <th className="p-4 font-medium">Load</th>
                                <th className="p-4 font-medium">Active</th>
                                <th className="p-4 font-medium">Sub</th>
                                <th className="p-4 font-medium text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {/* Loading State */}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                        Loading services...
                                    </td>
                                </tr>
                            )}

                            {/* Empty State */}
                            {!loading && filteredServices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                        {searchTerm ? 'No services match your search.' : 'No services found.'}
                                    </td>
                                </tr>
                            )}

                            {/* Service List */}
                            {!loading && filteredServices.map((svc) => (
                                <tr key={svc.name} className="hover:bg-zinc-800/50 transition-colors group">
                                    <td className="p-4 font-bold text-zinc-200 font-mono text-xs">
                                        {svc.name}
                                    </td>
                                    <td className="p-4 text-zinc-400 max-w-xs truncate" title={svc.description}>
                                        {svc.description || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            svc.loadState === 'loaded' 
                                                ? 'text-emerald-400 bg-emerald-400/10' 
                                                : svc.loadState === 'not-found'
                                                ? 'text-rose-400 bg-rose-400/10'
                                                : 'text-zinc-400 bg-zinc-700'
                                        }`}>
                                            {svc.loadState}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-2`}>
                                            <span className={`w-2 h-2 rounded-full ${
                                                svc.activeState === 'active' ? 'bg-emerald-500' :
                                                svc.activeState === 'failed' ? 'bg-rose-500' : 'bg-zinc-500'
                                            }`}></span>
                                            <span className={
                                                svc.activeState === 'active' ? 'text-emerald-400' :
                                                svc.activeState === 'failed' ? 'text-rose-400' : 'text-zinc-500'
                                            }>
                                                {svc.activeState}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-zinc-500 font-mono text-xs">
                                        {svc.subState}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {svc.activeState !== 'active' && (
                                                <button 
                                                    onClick={() => handleControl(svc.name, 'start')}
                                                    disabled={actionLoading !== null}
                                                    className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition-colors disabled:opacity-50" 
                                                    title="Start"
                                                >
                                                    {actionLoading === `${svc.name}-start` ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Play size={16} />
                                                    )}
                                                </button>
                                            )}
                                            {svc.activeState === 'active' && (
                                                <button 
                                                    onClick={() => handleControl(svc.name, 'stop')}
                                                    disabled={actionLoading !== null}
                                                    className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors disabled:opacity-50" 
                                                    title="Stop"
                                                >
                                                    {actionLoading === `${svc.name}-stop` ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Square size={16} />
                                                    )}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleControl(svc.name, 'restart')}
                                                disabled={actionLoading !== null || svc.activeState !== 'active'}
                                                className="p-1.5 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors disabled:opacity-50" 
                                                title="Restart"
                                            >
                                                {actionLoading === `${svc.name}-restart` ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <RefreshCw size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                        autoClose={false}
                        position="relative"
                    />
                ))}
            </div>
        </div>
    );
};

export default ServiceManager;
