import React, { useState } from 'react';
import { MOCK_FIREWALL_RULES } from '../constants';
import { PageHeader } from './PageHeader';
import { Shield, ShieldAlert, Plus, Trash2, Edit } from 'lucide-react';

const FirewallManager: React.FC = () => {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Firewall (UFW)"
        icon={Shield}
        iconColor={enabled ? "text-emerald-500" : "text-rose-500"}
        description={
            <span>
                Status: <span className={enabled ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{enabled ? 'ACTIVE' : 'INACTIVE'}</span>
            </span>
        }
        actions={
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setEnabled(!enabled)}
                    className={`px-4 py-2 rounded font-medium text-sm transition-colors border shadow-lg ${
                        enabled 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/50 hover:bg-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20'
                    }`}
                >
                    {enabled ? 'Disable Firewall' : 'Enable Firewall'}
                </button>
                <button className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 shadow-lg">
                    <Plus size={16} /> Add Rule
                </button>
            </div>
        }
      />

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
         <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                <th className="p-4 font-medium">To (Port)</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">From (Source)</th>
                <th className="p-4 font-medium">Protocol</th>
                <th className="p-4 font-medium">Comment</th>
                <th className="p-4 font-medium text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
                {MOCK_FIREWALL_RULES.map(rule => (
                    <tr key={rule.id} className={`hover:bg-zinc-800/50 transition-colors ${!enabled ? 'opacity-50' : ''}`}>
                        <td className="p-4 font-mono text-zinc-200">{rule.port}</td>
                        <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                rule.action === 'ALLOW' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                                {rule.action}
                            </span>
                        </td>
                        <td className="p-4 font-mono text-zinc-300">{rule.source}</td>
                        <td className="p-4 text-zinc-400 text-xs">{rule.protocol}</td>
                        <td className="p-4 text-zinc-500 italic">{rule.comment}</td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 text-zinc-500">
                                <button className="hover:text-emerald-400 transition-colors"><Edit size={16} /></button>
                                <button className="hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
         {MOCK_FIREWALL_RULES.length === 0 && (
             <div className="p-8 text-center text-zinc-500">No rules configured.</div>
         )}
      </div>
      
      {!enabled && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 shadow-lg">
            <ShieldAlert size={20} />
            <p className="text-sm">Warning: Firewall is currently inactive. All incoming traffic is allowed.</p>
        </div>
      )}
    </div>
  );
};

export default FirewallManager;
