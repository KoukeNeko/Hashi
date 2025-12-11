import React, { useState, useEffect, useMemo } from 'react';
import { Toast, ActionButton } from '../../../components';
import { IptablesService } from '../../../services/api';
import { IptablesRule, AddIptablesRuleRequest, IptablesTable } from '../../../types';
import {
    Tabs,
    TabItem,
    Alert,
    DataTable,
    DataTableColumn,
    badgeCell,
} from '../../../components/ui';
import { Terminal, Plus, Trash2, Loader2, RefreshCw, Save } from 'lucide-react';
import { AddIptablesRuleDialog, DeleteIptablesRuleDialog } from './IptablesDialogs';

// ==================== Constants ====================

const TABLE_TABS: TabItem[] = [
    { id: 'filter', label: 'filter' },
    { id: 'nat', label: 'nat' },
    { id: 'mangle', label: 'mangle' },
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
    const columns: DataTableColumn<IptablesRule>[] = [
        {
            key: 'lineNumber',
            header: '#',
            width: '50px',
            mono: true,
            render: (rule) => <span className="text-zinc-500">{rule.lineNumber}</span>,
        },
        {
            key: 'target',
            header: 'Target',
            width: '180px',
            render: (rule) => badgeCell(rule.target),
        },
        {
            key: 'protocol',
            header: 'Protocol',
            width: '80px',
            mono: true,
            accessor: 'protocol',
        },
        {
            key: 'source',
            header: 'Source',
            width: '140px',
            render: (rule) => (
                <span className="font-mono text-xs">
                    {rule.source}
                    {rule.sourcePort && <span className="text-zinc-500">:{rule.sourcePort}</span>}
                </span>
            ),
        },
        {
            key: 'destination',
            header: 'Destination',
            width: '140px',
            render: (rule) => (
                <span className="font-mono text-xs">
                    {rule.destination}
                    {rule.destPort && <span className="text-zinc-500">:{rule.destPort}</span>}
                </span>
            ),
        },
        {
            key: 'packets',
            header: 'Packets',
            width: '100px',
            mono: true,
            render: (rule) => (
                <span className="text-zinc-400">{rule.packetCount.toLocaleString()}</span>
            ),
        },
        {
            key: 'bytes',
            header: 'Bytes',
            width: '100px',
            mono: true,
            render: (rule) => <span className="text-zinc-400">{formatBytes(rule.byteCount)}</span>,
        },
        {
            key: 'actions',
            header: 'Action',
            width: '60px',
            align: 'right',
            render: (rule) => (
                <button
                    onClick={() => onDelete(rule)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete rule"
                >
                    <Trash2 size={16} />
                </button>
            ),
        },
    ];

    return (
        <DataTable
            data={rules}
            columns={columns}
            rowKey={(rule) => rule.lineNumber}
            groupHeader={chain}
            groupCount={rules.length}
            emptyMessage="No rules in this chain"
        />
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
                ? typeof e.response.data === 'string'
                    ? e.response.data
                    : e.response.data.message || 'Failed to load rules'
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
        rules.forEach((rule) => {
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
                ? typeof e.response.data === 'string'
                    ? e.response.data
                    : e.response.data.message || 'Failed to add rule'
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
            await IptablesService.deleteRule(
                ruleToDelete.table,
                ruleToDelete.chain,
                ruleToDelete.lineNumber
            );
            setDeleteDialogOpen(false);
            setRuleToDelete(null);
            setToast({ message: 'Rule deleted successfully', type: 'success' });
            loadRules();
        } catch (err: unknown) {
            console.error('Failed to delete rule:', err);
            const e = err as { response?: { data?: string | { message?: string } } };
            const errorMsg = e.response?.data
                ? typeof e.response.data === 'string'
                    ? e.response.data
                    : e.response.data.message || 'Failed to delete rule'
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
                ? typeof e.response.data === 'string'
                    ? e.response.data
                    : e.response.data.message || 'Failed to save rules'
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
                    <ActionButton onClick={() => setAddDialogOpen(true)} icon={<Plus size={16} />}>
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
                    {chainOrder
                        .filter((chain) => rulesByChain[chain] || true)
                        .map((chain) => (
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
                iptables rules are low-level firewall rules. Click "Save Rules" to persist changes
                across reboots.
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
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
};

export default IptablesPanel;
