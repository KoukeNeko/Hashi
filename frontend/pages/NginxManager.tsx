import React, { useState } from 'react';
import { MOCK_NGINX_HOSTS, MOCK_SSL_CERTIFICATES } from '../constants';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Globe, ShieldCheck, Server, Plus, Power, RefreshCw, Trash2, Edit, Calendar } from 'lucide-react';

const NginxManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hosts' | 'ssl'>('hosts');

    const tabs = [
        { id: 'hosts', label: 'Virtual Hosts', icon: Server },
        { id: 'ssl', label: 'SSL Certificates', icon: ShieldCheck },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Nginx Web Server"
                icon={Globe}
                description="Manage virtual hosts, reverse proxies, and SSL certificates."
                actions={
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors border border-emerald-500/50 flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                        <Plus size={16} /> <span className="hidden sm:inline">Add Host</span>
                    </button>
                }
            />

            <Tabs
                items={tabs}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'hosts' | 'ssl')}
            />

            {activeTab === 'hosts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_NGINX_HOSTS.map(host => (
                        <div key={host.id} className="bg-surface border border-border rounded-lg p-5 shadow-lg group hover:border-emerald-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${host.status === 'enabled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Server size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-200">{host.domain}</h3>
                                        <span className="text-xs font-mono text-zinc-500">:{host.port}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${host.status === 'enabled'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    {host.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Root</span>
                                    <span className="font-mono text-zinc-300 text-xs truncate max-w-[150px]" title={host.root}>{host.root}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">SSL</span>
                                    <span className={`font-mono text-xs ${host.sslEnabled ? 'text-emerald-400' : 'text-amber-500'}`}>
                                        {host.sslEnabled ? 'Encrypted' : 'Off'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-border">
                                <button className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                                    <Edit size={12} /> Config
                                </button>
                                <div className="flex gap-2">
                                    <button className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors" title="Reload">
                                        <RefreshCw size={14} />
                                    </button>
                                    <button className={`p-1.5 rounded transition-colors ${host.status === 'enabled' ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-emerald-500/20 text-emerald-400'}`} title="Toggle">
                                        <Power size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'ssl' && (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                    <th className="p-4 font-medium">Domain</th>
                                    <th className="p-4 font-medium">Issuer</th>
                                    <th className="p-4 font-medium">Expires</th>
                                    <th className="p-4 font-medium">Auto Renew</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border">
                                {MOCK_SSL_CERTIFICATES.map(cert => (
                                    <tr key={cert.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 font-bold text-zinc-200 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-emerald-500" />
                                            {cert.domain}
                                        </td>
                                        <td className="p-4 text-zinc-400">{cert.issuer}</td>
                                        <td className="p-4 font-mono text-zinc-300">{cert.expiryDate}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${cert.autoRenew
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {cert.autoRenew ? 'ON' : 'MANUAL'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 text-zinc-500">
                                                <button className="hover:text-emerald-400 transition-colors p-1" title="Renew Now"><RefreshCw size={16} /></button>
                                                <button className="hover:text-rose-400 transition-colors p-1" title="Revoke"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
                        {MOCK_SSL_CERTIFICATES.map(cert => (
                            <div key={cert.id} className="bg-surface border border-border rounded-lg p-5 shadow-lg group hover:border-emerald-500/30 transition-colors">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-200 break-all">{cert.domain}</h3>
                                            <span className="text-xs text-zinc-500">{cert.issuer}</span>
                                        </div>
                                    </div>
                                    {/* Auto Renew Badge */}
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide shrink-0 ml-2 ${cert.autoRenew
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {cert.autoRenew ? 'Auto' : 'Man'}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                        <span className="text-zinc-500 flex items-center gap-2"><Calendar size={14} /> Expires</span>
                                        <span className="font-mono text-zinc-300 text-xs">{cert.expiryDate}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Status</span>
                                        <span className="text-emerald-500 text-xs font-medium">Valid</span>
                                    </div>
                                </div>

                                {/* Card Footer / Actions */}
                                <div className="flex justify-between items-center pt-4 border-t border-border">
                                    <div className="text-xs text-zinc-600 font-mono">ID: {cert.id}</div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 rounded text-xs font-medium transition-colors" title="Renew">
                                            <RefreshCw size={14} /> Renew
                                        </button>
                                        <button className="p-1.5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded transition-colors" title="Revoke">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default NginxManager;