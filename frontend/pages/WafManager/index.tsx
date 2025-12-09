
import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { MOCK_WAF_RULES } from '../../constants';
import { Lock, ShieldCheck, AlertTriangle, Shield, Settings } from 'lucide-react';

const WafManager: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="WAF Security"
                icon={Lock}
                iconColor="text-rose-500"
                description="Web Application Firewall rules and threat mitigation."
                actions={
                    <div className="flex gap-3">
                        <button className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded font-medium text-sm transition-colors">
                            View Logs
                        </button>
                        <button className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-lg shadow-rose-900/20">
                            Global Settings
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface border border-border p-6 rounded-lg flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                        <ShieldCheck size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-xs uppercase font-bold">Total Requests</h3>
                        <p className="text-2xl font-bold text-white">1.2M</p>
                    </div>
                </div>
                <div className="bg-surface border border-border p-6 rounded-lg flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-rose-500/10 rounded-lg">
                        <Shield size={32} className="text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-xs uppercase font-bold">Threats Blocked</h3>
                        <p className="text-2xl font-bold text-white">14.3K</p>
                    </div>
                </div>
                <div className="bg-surface border border-border p-6 rounded-lg flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                        <AlertTriangle size={32} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-xs uppercase font-bold">Suspicious Activity</h3>
                        <p className="text-2xl font-bold text-white">420</p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Active Protection Rules</h3>
            <div className="space-y-4">
                {MOCK_WAF_RULES.map(rule => (
                    <div key={rule.id} className="bg-surface border border-border p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md hover:border-zinc-600 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${rule.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-200">{rule.name}</h4>
                                <p className="text-sm text-zinc-500">{rule.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                                <div className="text-xs text-zinc-500 uppercase font-bold">Hits</div>
                                <div className="font-mono text-zinc-300">{rule.hits}</div>
                            </div>
                            <button className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WafManager;
