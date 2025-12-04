import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { FirewallService } from '../services/api';
import { FirewallRule } from '../types';
import { Shield, ShieldAlert, Plus, Trash2, X, Save, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

// Toast 通知組件
const Toast: React.FC<{
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-fade-in ${
            type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
        }`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
    );
};

// 新增規則彈窗
const AddRuleDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (port: string, protocol: string) => void;
    saving: boolean;
}> = ({ isOpen, onClose, onSave, saving }) => {
    const [port, setPort] = useState('');
    const [protocol, setProtocol] = useState('tcp');

    useEffect(() => {
        if (isOpen) {
            setPort('');
            setProtocol('tcp');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!port.trim()) return;
        onSave(port.trim(), protocol);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-zinc-100">Add Firewall Rule</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Port *</label>
                        <input
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="80, 443, 8080-8090"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-zinc-500">Single port, range (8080-8090), or service name (ssh)</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Protocol</label>
                        <select
                            value={protocol}
                            onChange={(e) => setProtocol(e.target.value)}
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                            <option value="">Any (TCP/UDP)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !port.trim()}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Allow Port
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 刪除確認彈窗
const DeleteConfirmDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    rule: FirewallRule | null;
    deleting: boolean;
}> = ({ isOpen, onClose, onConfirm, rule, deleting }) => {
    if (!isOpen || !rule) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center gap-3 text-rose-400 mb-4">
                    <AlertCircle size={24} />
                    <h2 className="text-lg font-bold">Delete Firewall Rule</h2>
                </div>
                <p className="text-zinc-300 text-sm mb-2">Are you sure you want to delete this rule?</p>
                <div className="bg-zinc-800/50 rounded p-3 mb-4 font-mono text-sm">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            rule.action.includes('ALLOW') 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/20 text-rose-400'
                        }`}>{rule.action}</span>
                        <span className="text-zinc-200">{rule.to}</span>
                        <span className="text-zinc-500">from</span>
                        <span className="text-zinc-300">{rule.from}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const FirewallManager: React.FC = () => {
    const [rules, setRules] = useState<FirewallRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<FirewallRule | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    useEffect(() => {
        loadRules();
    }, []);

    // 新增規則
    const handleAddRule = async (port: string, protocol: string) => {
        try {
            setSaving(true);
            await FirewallService.addRule(port, protocol);
            setAddDialogOpen(false);
            setToast({ message: `Port ${port}/${protocol || 'any'} allowed`, type: 'success' });
            loadRules(); // 重新載入
        } catch (err: any) {
            console.error('Failed to add rule:', err);
            let errorMsg = 'Failed to add rule';
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string' 
                    ? err.response.data 
                    : err.response.data.message || JSON.stringify(err.response.data);
            }
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setSaving(false);
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
                icon={Shield}
                iconColor="text-emerald-500"
                description={`${rules.length} rules configured (${ipv4Rules.length} IPv4, ${ipv6Rules.length} IPv6)`}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadRules}
                            disabled={loading}
                            className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button 
                            onClick={() => setAddDialogOpen(true)}
                            className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Plus size={16} /> Add Rule
                        </button>
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
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            rule.action.includes('ALLOW')
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
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            rule.action.includes('ALLOW')
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

            {/* 資訊提示 */}
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 shadow-lg">
                <ShieldAlert size={20} />
                <p className="text-sm">
                    Note: Rules are managed via <code className="bg-blue-500/20 px-1 rounded">ufw</code>. 
                    Ensure the firewall is enabled with <code className="bg-blue-500/20 px-1 rounded">sudo ufw enable</code>.
                </p>
            </div>

            {/* 新增規則彈窗 */}
            <AddRuleDialog
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={handleAddRule}
                saving={saving}
            />

            {/* 刪除確認彈窗 */}
            <DeleteConfirmDialog
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
