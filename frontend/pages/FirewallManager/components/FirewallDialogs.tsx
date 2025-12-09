import React from 'react';
import { Shield, Trash2, Loader2 } from 'lucide-react';
import { FirewallRule } from '../../../types';
import { ConfirmDialog, FormDialog } from '../../../components/ui';

// ==================== Protocol Options ====================
export const protocolOptions = [
    { value: 'tcp', label: 'TCP' },
    { value: 'udp', label: 'UDP' },
    { value: '', label: 'Any (TCP/UDP)' }
];

// ==================== Types ====================
export interface AddRuleFormValues {
    port: string;
    protocol: string;
}

// ==================== Add Rule Dialog ====================
export const AddRuleDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (port: string, protocol: string) => Promise<void>;
}> = ({ isOpen, onClose, onSave }) => {
    return (
        <FormDialog<AddRuleFormValues>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={(values) => onSave(values.port.trim(), values.protocol)}
            title="Add Firewall Rule"
            titleIcon={<Shield size={20} className="text-emerald-400" />}
            submitText="Allow Port"
            fields={[
                { name: 'port', label: 'Port', required: true, placeholder: '80, 443, 8080-8090', hint: 'Single port, range (8080-8090), or service name (ssh)', mono: true },
                { name: 'protocol', label: 'Protocol', type: 'select', options: protocolOptions, defaultValue: 'tcp' }
            ]}
        />
    );
};

// ==================== Delete Confirm Dialog ====================
export const DeleteRuleDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    rule: FirewallRule | null;
    deleting: boolean;
}> = ({ isOpen, onClose, onConfirm, rule, deleting }) => {
    if (!rule) return null;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Delete Firewall Rule"
            message="Are you sure you want to delete this rule?"
            confirmText="Delete"
            confirmIcon={deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        >
            <div className="bg-zinc-800/50 rounded p-3 font-mono text-sm">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.action.includes('ALLOW')
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>{rule.action}</span>
                    <span className="text-zinc-200">{rule.to}</span>
                    <span className="text-zinc-500">from</span>
                    <span className="text-zinc-300">{rule.from}</span>
                </div>
            </div>
        </ConfirmDialog>
    );
};
