import React, { useState, useEffect, useMemo } from 'react';
import { Toast, ActionButton } from '../../../components';
import { IptablesService } from '../../../services/api';
import { IptablesRule, AddIptablesRuleRequest, IptablesTable } from '../../../types';
import { Tabs, TabItem, Alert } from '../../../components/ui';
import { Terminal, Plus, Trash2, Loader2, RefreshCw, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { AddIptablesRuleDialog, DeleteIptablesRuleDialog } from './IptablesDialogs';

// ==================== Constants ====================

const TABLE_TABS: TabItem[] = [
    { id: 'filter', label: 'filter' },
    { id: 'nat', label: 'nat' },
    { id: 'mangle', label: 'mangle' }
];

// ==================== Helper: Format Byte Count ====================

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// ==================== Chain Section Component ====================

interface ChainSectionProps {
    chain: string;
    rules: IptablesRule[];
    onDelete: (rule: IptablesRule) => void;
}

const ChainSection: React.FC<ChainSectionProps> = ({ chain, rules, onDelete }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {/* Chain Header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {collapsed ? <ChevronRight size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                    <span className="font-medium text-zinc-200">{chain}</span>
                    <span className="text-zinc-500 text-sm">({rules.length} rules)</span>
                </div>
            </button>

            {/* Rules Table */}
            {!collapsed && (
                <div className="overflow-x-auto">
                    {rules.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-sm">
                            No rules in this chain
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-zinc-900/50 border-t border-border text-xs uppercase text-zinc-500">
                                    <th className="p-3 font-medium w-12">#</th>
                                    <th className="p-3 font-medium whitespace-nowrap">Target</th>
                                    <th className="p-3 font-medium w-20">Protocol</th>
                                    <th className="p-3 font-medium">Source</th>
                                    <th className="p-3 font-medium">Destination</th>
                                    <th className="p-3 font-medium w-28">Packets</th>
                                    <th className="p-3 font-medium w-28">Bytes</th>
                                    <th className="p-3 font-medium text-right w-16">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border">
                                {rules.map(rule => (
                                    <tr key={rule.lineNumber} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-3 text-zinc-500 font-mono text-xs">{rule.lineNumber}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.target === 'ACCEPT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                rule.target === 'DROP' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                                    rule.target === 'REJECT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                }`}>
                                                {rule.target}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-zinc-300">{rule.protocol}</td>
                                        <td className="p-3 font-mono text-zinc-300">
                                            {rule.source}
                                            {rule.sourcePort && <span className="text-zinc-500">:{rule.sourcePort}</span>}
                                        </td>
                                        <td className="p-3 font-mono text-zinc-300">
                                            {rule.destination}
                                            {rule.destPort && <span className="text-zinc-500">:{rule.destPort}</span>}
                                        </td>
                                        <td className="p-3 text-zinc-400 font-mono text-xs">{rule.packetCount.toLocaleString()}</td>
                                        <td className="p-3 text-zinc-400 font-mono text-xs">{formatBytes(rule.byteCount)}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => onDelete(rule)}
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
            )}
        </div>
    );
};

// ==================== Main Panel Component ====================

const IptablesPanel: React.FC = () => {
    const [activeTable, setActiveTable] = useState<IptablesTable>('filter');
    const [rules, setRules] = useState<IptablesRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<IptablesRule | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load rules for current table
    const loadRules = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await IptablesService.getRules(activeTable);
            setRules(data);
        } catch (err: unknown) {
            console.error('Failed to load iptables rules:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            const errorMsg = e.response?.data
                ? (typeof e.response.data === 'string' ? e.response.data : e.response.data.message || 'Failed to load rules')
                : 'Failed to load iptables rules';
            setError(errorMsg);
            setRules([]);
        } finally {
            setLoading(false);
        }
    };

    // Reload when table changes
    useEffect(() => {
        loadRules();
    }, [activeTable]);

    // Group rules by chain
    const rulesByChain = useMemo(() => {
        const grouped: Record<string, IptablesRule[]> = {};
        rules.forEach(rule => {
            if (!grouped[rule.chain]) {
                grouped[rule.chain] = [];
            }
            grouped[rule.chain].push(rule);
        });
        return grouped;
    }, [rules]);

    // Get chain order based on table
    const chainOrder = useMemo(() => {
        switch (activeTable) {
            case 'filter':
                return ['INPUT', 'FORWARD', 'OUTPUT'];
            case 'nat':
                return ['PREROUTING', 'INPUT', 'OUTPUT', 'POSTROUTING'];
            case 'mangle':
                return ['PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING'];
            default:
                return Object.keys(rulesByChain);
        }
    }, [activeTable, rulesByChain]);

    // Add rule handler
    const handleAddRule = async (rule: AddIptablesRuleRequest) => {
        try {
            await IptablesService.addRule(rule);
            setToast({ message: 'Rule added successfully', type: 'success' });
            loadRules();
        } catch (err: unknown) {
            console.error('Failed to add rule:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            const errorMsg = e.response?.data
                ? (typeof e.response.data === 'string' ? e.response.data : e.response.data.message || 'Failed to add rule')
                : 'Failed to add rule';
            throw new Error(errorMsg);
        }
    };

    // Delete rule handlers
    const handleDeleteClick = (rule: IptablesRule) => {
        setRuleToDelete(rule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        try {
            setDeleting(true);
            await IptablesService.deleteRule(ruleToDelete.table, ruleToDelete.chain, ruleToDelete.lineNumber);
            setDeleteDialogOpen(false);
            setRuleToDelete(null);
            setToast({ message: 'Rule deleted successfully', type: 'success' });
            loadRules();
        } catch (err: unknown) {
            console.error('Failed to delete rule:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            const errorMsg = e.response?.data
                ? (typeof e.response.data === 'string' ? e.response.data : e.response.data.message || 'Failed to delete rule')
                : 'Failed to delete rule';
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    // Save rules handler
    const handleSaveRules = async () => {
        try {
            setSaving(true);
            await IptablesService.saveRules();
            setToast({ message: 'Rules saved (persisted) successfully', type: 'success' });
        } catch (err: unknown) {
            console.error('Failed to save rules:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            const errorMsg = e.response?.data
                ? (typeof e.response.data === 'string' ? e.response.data : e.response.data.message || 'Failed to save rules')
                : 'Failed to save rules';
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Terminal size={24} className="text-cyan-500" />
                    <div>
                        <p className="text-sm text-zinc-400">
                            Table: <span className="text-cyan-400 font-bold">{activeTable}</span>
                            <span className="text-zinc-600 mx-2">|</span>
                            <span className="text-zinc-400">{rules.length} rules</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ActionButton
                        onClick={handleSaveRules}
                        disabled={saving}
                        variant="secondary"
                        loading={saving}
                        icon={<Save size={16} />}
                        loadingIcon={<Loader2 size={16} className="animate-spin" />}
                    >
                        Save Rules
                    </ActionButton>
                    <button
                        onClick={loadRules}
                        disabled={loading}
                        className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <ActionButton
                        onClick={() => setAddDialogOpen(true)}
                        icon={<Plus size={16} />}
                    >
                        Add Rule
                    </ActionButton>
                </div>
            </div>

            {/* Table Selector */}
            <Tabs
                items={TABLE_TABS}
                activeId={activeTable}
                onChange={(id) => setActiveTable(id as IptablesTable)}
            />

            {/* Error State */}
            {error && (
                <Alert variant="error" title="Error:">
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : (
                /* Chain Sections */
                <div className="space-y-4">
                    {chainOrder.filter(chain => rulesByChain[chain] || true).map(chain => (
                        <ChainSection
                            key={chain}
                            chain={chain}
                            rules={rulesByChain[chain] || []}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            {/* Info Note */}
            <Alert variant="info" icon={Terminal} title="Advanced:">
                iptables rules are low-level firewall rules. Click "Save Rules" to persist changes across reboots.
            </Alert>

            {/* Dialogs */}
            <AddIptablesRuleDialog
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={handleAddRule}
                defaultTable={activeTable}
            />

            <DeleteIptablesRuleDialog
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
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default IptablesPanel;
