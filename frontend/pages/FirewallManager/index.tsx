import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { FirewallService } from '../../services/api';
import { FirewallRule } from '../../types';
import { Shield, ShieldOff, ShieldAlert, Plus, Trash2, Loader2, RefreshCw, Power, AlertCircle } from 'lucide-react';
import { Toast, ActionButton } from '../../components/ui';
import { AddRuleDialog, DeleteRuleDialog } from './components/FirewallDialogs';


const FirewallManager: React.FC = () => {
    const [rules, setRules] = useState<FirewallRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<FirewallRule | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [enabled, setEnabled] = useState<boolean | null>(null); // null = loading
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [statusError, setStatusError] = useState(false);

    // 載入防火牆狀態
    const loadStatus = async () => {
        try {
            setStatusError(false);
            const status = await FirewallService.getStatus();
            setEnabled(status);
        } catch (err: any) {
            console.error('Failed to load firewall status:', err);
            setStatusError(true);
            setEnabled(false); // 預設為 false，避免卡在 loading
        }
    };

    // 載入防火牆規則
    const loadRules = async () => {
        try {
            setLoading(true);
            const data = await FirewallService.getRules();
            setRules(data);
        } catch (err: any) {
            console.error('Failed to load firewall rules:', err);
            setToast({ message: 'Failed to load firewall rules', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 切換防火牆狀態
    const handleToggleStatus = async () => {
        if (enabled === null) return;

        try {
            setTogglingStatus(true);
            await FirewallService.setStatus(!enabled);
            setEnabled(!enabled);
            setToast({
                message: `Firewall ${!enabled ? 'enabled' : 'disabled'} successfully`,
                type: 'success'
            });
        } catch (err: any) {
            console.error('Failed to toggle firewall:', err);
            let errorMsg = 'Failed to change firewall status';
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string'
                    ? err.response.data
                    : err.response.data.message || JSON.stringify(err.response.data);
            }
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setTogglingStatus(false);
        }
    };

    useEffect(() => {
        loadStatus();
        loadRules();
    }, []);

    // 新增規則
    const handleAddRule = async (port: string, protocol: string) => {
        try {
            await FirewallService.addRule(port, protocol);
            setToast({ message: `Port ${port}/${protocol || 'any'} allowed`, type: 'success' });
            loadRules(); // 重新載入
        } catch (err: unknown) {
            console.error('Failed to add rule:', err);
            let errorMsg = 'Failed to add rule';
            const e = err as { response?: { data?: string | { message?: string } } };
            if (e.response?.data) {
                errorMsg = typeof e.response.data === 'string'
                    ? e.response.data
                    : e.response.data.message || JSON.stringify(e.response.data);
            }
            throw new Error(errorMsg);
        }
    };

    // 刪除規則
    const handleDeleteClick = (rule: FirewallRule) => {
        setRuleToDelete(rule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        try {
            setDeleting(true);
            await FirewallService.deleteRule(ruleToDelete.index);
            setDeleteDialogOpen(false);
            setRuleToDelete(null);
            setToast({ message: 'Rule deleted successfully', type: 'success' });
            loadRules(); // 重新載入
        } catch (err: any) {
            console.error('Failed to delete rule:', err);
            let errorMsg = 'Failed to delete rule';
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string'
                    ? err.response.data
                    : err.response.data.message || JSON.stringify(err.response.data);
            }
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    // 分離 IPv4 和 IPv6 規則
    const ipv4Rules = rules.filter(r => !r.ipv6);
    const ipv6Rules = rules.filter(r => r.ipv6);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Firewall (UFW)"
                icon={enabled === false ? ShieldOff : Shield}
                iconColor={enabled === false ? "text-rose-500" : "text-emerald-500"}
                description={
                    <span className="flex items-center gap-2">
                        Status:{' '}
                        {enabled === null ? (
                            <span className="text-zinc-500 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Loading...
                            </span>
                        ) : statusError ? (
                            <span className="text-amber-400 font-bold">UNKNOWN</span>
                        ) : enabled ? (
                            <span className="text-emerald-400 font-bold">ACTIVE</span>
                        ) : (
                            <span className="text-rose-400 font-bold">INACTIVE</span>
                        )}
                        <span className="text-zinc-600 mx-1">|</span>
                        <span className="text-zinc-400">{rules.length} rules ({ipv4Rules.length} IPv4, {ipv6Rules.length} IPv6)</span>
                    </span>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <ActionButton
                            onClick={handleToggleStatus}
                            disabled={enabled === null || togglingStatus}
                            variant={enabled ? 'danger' : 'primary'}
                            loading={togglingStatus}
                            icon={<Power size={16} />}
                            loadingIcon={<Loader2 size={16} className="animate-spin" />}
                            className="shadow-lg"
                        >
                            {enabled ? 'Disable' : 'Enable'}
                        </ActionButton>
                        <button
                            onClick={() => { loadStatus(); loadRules(); }}
                            disabled={loading}
                            className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <ActionButton
                            onClick={() => setAddDialogOpen(true)}
                            disabled={enabled === false}
                            icon={<Plus size={16} />}
                            className="shadow-lg"
                        >
                            Add Rule
                        </ActionButton>
                    </div>
                }
            />

            {/* IPv4 Rules */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-zinc-900 border-b border-border">
                    <h3 className="text-sm font-medium text-zinc-300">IPv4 Rules</h3>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : ipv4Rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <Shield size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">No IPv4 rules configured</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium w-16">#</th>
                                <th className="p-4 font-medium">To (Port)</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">From (Source)</th>
                                <th className="p-4 font-medium text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {ipv4Rules.map(rule => (
                                <tr key={rule.index} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4 text-zinc-500 font-mono text-xs">{rule.index}</td>
                                    <td className="p-4 font-mono text-zinc-200">{rule.to}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.action.includes('ALLOW')
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : rule.action.includes('DENY')
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {rule.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-zinc-300">{rule.from}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteClick(rule)}
                                            className="text-zinc-500 hover:text-rose-400 transition-colors"
                                            title="Delete rule"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* IPv6 Rules */}
            {ipv6Rules.length > 0 && (
                <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-zinc-900 border-b border-border">
                        <h3 className="text-sm font-medium text-zinc-300">IPv6 Rules</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium w-16">#</th>
                                <th className="p-4 font-medium">To (Port)</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">From (Source)</th>
                                <th className="p-4 font-medium text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {ipv6Rules.map(rule => (
                                <tr key={rule.index} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4 text-zinc-500 font-mono text-xs">{rule.index}</td>
                                    <td className="p-4 font-mono text-zinc-200">{rule.to}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.action.includes('ALLOW')
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : rule.action.includes('DENY')
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {rule.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-zinc-300">{rule.from.replace(' (v6)', '')}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteClick(rule)}
                                            className="text-zinc-500 hover:text-rose-400 transition-colors"
                                            title="Delete rule"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* API 錯誤提示 */}
            {statusError && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-200 shadow-lg">
                    <AlertCircle size={20} />
                    <p className="text-sm">
                        <strong>Error:</strong> Failed to get firewall status. Make sure <code className="bg-rose-500/20 px-1 rounded">ufw</code> is installed
                        and the backend has <code className="bg-rose-500/20 px-1 rounded">sudo</code> permission.
                    </p>
                </div>
            )}

            {/* 防火牆停用警告 */}
            {enabled === false && !statusError && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 shadow-lg">
                    <ShieldAlert size={20} />
                    <p className="text-sm">
                        <strong>Warning:</strong> Firewall is currently <strong>inactive</strong>. All incoming traffic is allowed.
                        Click "Enable" to activate the firewall.
                    </p>
                </div>
            )}

            {/* 資訊提示 */}
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 shadow-lg">
                <ShieldAlert size={20} />
                <p className="text-sm">
                    Note: Rules are managed via <code className="bg-blue-500/20 px-1 rounded">ufw</code>.
                    Changes take effect immediately.
                </p>
            </div>

            {/* 新增規則彈窗 */}
            <AddRuleDialog
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={handleAddRule}
            />

            {/* 刪除確認彈窗 */}
            <DeleteRuleDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setRuleToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                rule={ruleToDelete}
                deleting={deleting}
            />

            {/* Toast 通知 */}
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

export default FirewallManager;
