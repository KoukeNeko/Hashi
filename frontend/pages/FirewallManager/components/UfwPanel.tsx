import React, { useState, useEffect, useMemo } from 'react';
import { Toast, ActionButton } from '../../../components';
import { FirewallService } from '../../../services/api';
import { FirewallRule } from '../../../types';
import { Alert } from '../../../components/ui';
import { DataTable, DataTableColumn, badgeCell } from '../../../components/ui/DataTable';
import {
    Shield,
    ShieldOff,
    ShieldAlert,
    Plus,
    Trash2,
    Loader2,
    RefreshCw,
    Power,
    AlertCircle,
} from 'lucide-react';
import { AddRuleDialog, DeleteRuleDialog } from './FirewallDialogs';
import { UfwSetupGuide } from './UfwSetupGuide';

// Hashi 面板使用的 Port，未來可改為動態取得
const HASHI_PANEL_PORT = '3847';

/**
 * UFW 防火牆管理面板
 * 從 FirewallManager 抽取的 UFW 專用元件
 */
const UfwPanel: React.FC = () => {
    const [rules, setRules] = useState<FirewallRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<FirewallRule | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [statusError, setStatusError] = useState(false);

    const loadStatus = async () => {
        try {
            setStatusError(false);
            const status = await FirewallService.getStatus();
            setEnabled(status);
        } catch (err: unknown) {
            console.error('Failed to load firewall status:', err);
            setStatusError(true);
            setEnabled(false);
        }
    };

    const loadRules = async () => {
        try {
            setLoading(true);
            const data = await FirewallService.getRules();
            setRules(data);
        } catch (err: unknown) {
            console.error('Failed to load firewall rules:', err);
            setToast({ message: 'Failed to load firewall rules', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (enabled === null) return;

        try {
            setTogglingStatus(true);

            // 啟用防火牆前，先確保面板 Port 在例外清單中，避免使用者被鎖在外面
            if (!enabled) {
                const panelPortAlreadyAllowed = rules.some(
                    rule => rule.to.includes(HASHI_PANEL_PORT) && rule.action.includes('ALLOW')
                );

                if (!panelPortAlreadyAllowed) {
                    await FirewallService.addRule(HASHI_PANEL_PORT, 'tcp');
                    await loadRules();
                }
            }

            await FirewallService.setStatus(!enabled);
            setEnabled(!enabled);

            const panelPortMessage = !enabled
                ? ` (Port ${HASHI_PANEL_PORT} auto-allowed)`
                : '';

            setToast({
                message: `Firewall ${!enabled ? 'enabled' : 'disabled'} successfully`,
                type: 'success'
            });
        } catch (err: unknown) {
            console.error('Failed to toggle firewall:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            let errorMsg = 'Failed to change firewall status';
            if (e.response?.data) {
                errorMsg =
                    typeof e.response.data === 'string'
                        ? e.response.data
                        : e.response.data.message || JSON.stringify(e.response.data);
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

    const handleAddRule = async (port: string, protocol: string) => {
        try {
            await FirewallService.addRule(port, protocol);
            setToast({ message: `Port ${port}/${protocol || 'any'} allowed`, type: 'success' });
            loadRules();
        } catch (err: unknown) {
            console.error('Failed to add rule:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            let errorMsg = 'Failed to add rule';
            if (e.response?.data) {
                errorMsg =
                    typeof e.response.data === 'string'
                        ? e.response.data
                        : e.response.data.message || JSON.stringify(e.response.data);
            }
            throw new Error(errorMsg);
        }
    };

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
            loadRules();
        } catch (err: unknown) {
            console.error('Failed to delete rule:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            let errorMsg = 'Failed to delete rule';
            if (e.response?.data) {
                errorMsg =
                    typeof e.response.data === 'string'
                        ? e.response.data
                        : e.response.data.message || JSON.stringify(e.response.data);
            }
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const ipv4Rules = rules.filter((r) => !r.ipv6);
    const ipv6Rules = rules.filter((r) => r.ipv6);

    // Action badge 顏色映射
    const actionColors: Record<string, string> = {
        ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        DENY: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        REJECT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        LIMIT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };

    // 共用表格欄位定義
    const columns: DataTableColumn<FirewallRule>[] = useMemo(() => [
        {
            key: 'index',
            header: '#',
            width: '64px',
            mono: true,
            render: (rule) => <span className="text-zinc-500">{rule.index}</span>,
        },
        {
            key: 'to',
            header: 'To (Port)',
            mono: true,
            render: (rule) => <span className="text-zinc-200">{rule.to}</span>,
        },
        {
            key: 'action',
            header: 'Action',
            render: (rule) => badgeCell(rule.action, actionColors),
        },
        {
            key: 'from',
            header: 'From (Source)',
            mono: true,
            render: (rule) => rule.from.replace(' (v6)', ''),
        },
        {
            key: 'manage',
            header: 'Manage',
            width: '80px',
            align: 'right',
            render: (rule) => (
                <button
                    onClick={() => handleDeleteClick(rule)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete rule"
                >
                    <Trash2 size={16} />
                </button>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {enabled === false ? (
                        <ShieldOff size={24} className="text-rose-500" />
                    ) : (
                        <Shield size={24} className="text-emerald-500" />
                    )}
                    <div>
                        <p className="text-sm text-zinc-400">
                            Status:{' '}
                            {enabled === null ? (
                                <span className="text-zinc-500">
                                    <Loader2 size={12} className="animate-spin inline" /> Loading...
                                </span>
                            ) : statusError ? (
                                <span className="text-amber-400 font-bold">UNKNOWN</span>
                            ) : enabled ? (
                                <span className="text-emerald-400 font-bold">ACTIVE</span>
                            ) : (
                                <span className="text-rose-400 font-bold">INACTIVE</span>
                            )}
                            <span className="text-zinc-600 mx-2">|</span>
                            <span className="text-zinc-400">
                                {rules.length} rules ({ipv4Rules.length} IPv4, {ipv6Rules.length}{' '}
                                IPv6)
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ActionButton
                        onClick={handleToggleStatus}
                        disabled={enabled === null || togglingStatus}
                        variant={enabled ? 'danger' : 'primary'}
                        loading={togglingStatus}
                        icon={<Power size={16} />}
                        loadingIcon={<Loader2 size={16} className="animate-spin" />}
                    >
                        {enabled ? 'Disable' : 'Enable'}
                    </ActionButton>
                    <button
                        onClick={() => {
                            loadStatus();
                            loadRules();
                        }}
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
                    >
                        Add Rule
                    </ActionButton>
                </div>
            </div>

            {/* IPv4 Rules */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : (
                <DataTable
                    data={ipv4Rules}
                    columns={columns}
                    rowKey={(rule) => rule.index}
                    groupHeader="IPv4 Rules"
                    groupCount={ipv4Rules.length}
                    emptyMessage="No IPv4 rules configured"
                />
            )}

            {/* IPv6 Rules */}
            {ipv6Rules.length > 0 && (
                <DataTable
                    data={ipv6Rules}
                    columns={columns}
                    rowKey={(rule) => rule.index}
                    groupHeader="IPv6 Rules"
                    groupCount={ipv6Rules.length}
                    emptyMessage="No IPv6 rules configured"
                />
            )}

            {/* UFW Not Installed Guide */}
            {statusError && (
                <UfwSetupGuide
                    onRetry={() => {
                        loadStatus();
                        loadRules();
                    }}
                />
            )}

            {/* Disabled Warning */}
            {enabled === false && !statusError && (
                <Alert variant="warning" icon={ShieldAlert} title="Warning:">
                    Firewall is currently <strong>inactive</strong>. All incoming traffic is
                    allowed. Click "Enable" to activate the firewall.
                </Alert>
            )}

            {/* Info Note */}
            <Alert variant="info" icon={ShieldAlert}>
                Note: Rules are managed via <code className="bg-blue-500/20 px-1 rounded">ufw</code>
                . Changes take effect immediately.
            </Alert>

            {/* Dialogs */}
            <AddRuleDialog
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={handleAddRule}
            />

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

            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
};

export default UfwPanel;
