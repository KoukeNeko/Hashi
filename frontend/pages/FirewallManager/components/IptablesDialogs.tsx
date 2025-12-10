import React from 'react';
import { Terminal, Trash2, Loader2 } from 'lucide-react';
import { IptablesRule, AddIptablesRuleRequest, IptablesChain } from '../../../types';
import { ConfirmDialog, FormDialog } from '../../../components/ui';

// ==================== Constants ====================

export const TABLE_OPTIONS = [
    { value: 'filter', label: 'filter' },
    { value: 'nat', label: 'nat' },
    { value: 'mangle', label: 'mangle' }
];

export const TARGET_OPTIONS = [
    { value: 'ACCEPT', label: 'ACCEPT' },
    { value: 'DROP', label: 'DROP' },
    { value: 'REJECT', label: 'REJECT' }
];

export const PROTOCOL_OPTIONS = [
    { value: 'all', label: 'all' },
    { value: 'tcp', label: 'tcp' },
    { value: 'udp', label: 'udp' },
    { value: 'icmp', label: 'icmp' }
];

export const CHAIN_OPTIONS_BY_TABLE: Record<string, { value: string; label: string }[]> = {
    filter: [
        { value: 'INPUT', label: 'INPUT' },
        { value: 'OUTPUT', label: 'OUTPUT' },
        { value: 'FORWARD', label: 'FORWARD' }
    ],
    nat: [
        { value: 'PREROUTING', label: 'PREROUTING' },
        { value: 'POSTROUTING', label: 'POSTROUTING' },
        { value: 'OUTPUT', label: 'OUTPUT' }
    ],
    mangle: [
        { value: 'PREROUTING', label: 'PREROUTING' },
        { value: 'OUTPUT', label: 'OUTPUT' },
        { value: 'INPUT', label: 'INPUT' },
        { value: 'FORWARD', label: 'FORWARD' },
        { value: 'POSTROUTING', label: 'POSTROUTING' }
    ]
};

// ==================== Types ====================

export interface AddIptablesFormValues {
    table: string;
    chain: string;
    target: string;
    protocol: string;
    source: string;
    destination: string;
    sourcePort: string;
    destPort: string;
    inInterface: string;
    outInterface: string;
}

// ==================== Add Rule Dialog ====================

export const AddIptablesRuleDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: AddIptablesRuleRequest) => Promise<void>;
    defaultTable?: string;
}> = ({ isOpen, onClose, onSave, defaultTable = 'filter' }) => {
    const handleSubmit = async (values: AddIptablesFormValues) => {
        const rule: AddIptablesRuleRequest = {
            table: values.table || 'filter',
            chain: values.chain as IptablesChain,
            target: values.target,
            protocol: values.protocol || undefined,
            source: values.source?.trim() || undefined,
            destination: values.destination?.trim() || undefined,
            sourcePort: values.sourcePort ? parseInt(values.sourcePort, 10) : undefined,
            destPort: values.destPort ? parseInt(values.destPort, 10) : undefined,
            inInterface: values.inInterface?.trim() || undefined,
            outInterface: values.outInterface?.trim() || undefined,
            append: true
        };
        await onSave(rule);
    };

    return (
        <FormDialog<AddIptablesFormValues>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Add iptables Rule"
            titleIcon={<Terminal size={20} className="text-cyan-400" />}
            submitText="Add Rule"
            fields={[
                { name: 'table', label: 'Table', type: 'select', options: TABLE_OPTIONS, defaultValue: defaultTable },
                { name: 'chain', label: 'Chain', type: 'select', options: CHAIN_OPTIONS_BY_TABLE[defaultTable] || CHAIN_OPTIONS_BY_TABLE.filter, required: true },
                { name: 'target', label: 'Target', type: 'select', options: TARGET_OPTIONS, required: true, defaultValue: 'ACCEPT' },
                { name: 'protocol', label: 'Protocol', type: 'select', options: PROTOCOL_OPTIONS, defaultValue: 'all' },
                { name: 'source', label: 'Source IP/CIDR', placeholder: '0.0.0.0/0', hint: 'Leave empty for any' },
                { name: 'destination', label: 'Destination IP/CIDR', placeholder: '0.0.0.0/0', hint: 'Leave empty for any' },
                { name: 'sourcePort', label: 'Source Port', placeholder: 'Any', hint: 'Requires tcp/udp protocol' },
                { name: 'destPort', label: 'Destination Port', placeholder: 'Any', hint: 'Requires tcp/udp protocol' },
                { name: 'inInterface', label: 'In Interface', placeholder: 'e.g. eth0', hint: 'Optional' },
                { name: 'outInterface', label: 'Out Interface', placeholder: 'e.g. eth0', hint: 'Optional' }
            ]}
        />
    );
};

// ==================== Delete Confirm Dialog ====================

export const DeleteIptablesRuleDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    rule: IptablesRule | null;
    deleting: boolean;
}> = ({ isOpen, onClose, onConfirm, rule, deleting }) => {
    if (!rule) return null;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Delete iptables Rule"
            message="Are you sure you want to delete this rule?"
            confirmText="Delete"
            confirmIcon={deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        >
            <div className="bg-zinc-800/50 rounded p-3 font-mono text-sm space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Chain:</span>
                    <span className="text-zinc-200">{rule.chain}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Target:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.target === 'ACCEPT' ? 'bg-emerald-500/20 text-emerald-400' :
                            rule.target === 'DROP' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-amber-500/20 text-amber-400'
                        }`}>{rule.target}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Protocol:</span>
                    <span className="text-zinc-300">{rule.protocol}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Source:</span>
                    <span className="text-zinc-300">{rule.source}</span>
                    {rule.sourcePort && <span className="text-zinc-400">:{rule.sourcePort}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Destination:</span>
                    <span className="text-zinc-300">{rule.destination}</span>
                    {rule.destPort && <span className="text-zinc-400">:{rule.destPort}</span>}
                </div>
            </div>
        </ConfirmDialog>
    );
};
