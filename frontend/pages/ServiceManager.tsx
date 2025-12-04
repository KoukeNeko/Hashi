import React from 'react';
import { MOCK_SERVICES } from '../constants';
import { PageHeader } from '../components/PageHeader';
import { Settings2, Play, Square, RefreshCw, Power } from 'lucide-react';

const ServiceManager: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="System Services"
                icon={Settings2}
                iconColor="text-purple-500"
                description="Manage systemd units and init scripts."
                actions={
                    <input
                        type="text"
                        placeholder="Filter services..."
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 rounded text-sm focus:outline-none focus:border-purple-500 w-64 shadow-lg transition-colors"
                    />
                }
            />

            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                            <th className="p-4 font-medium">Unit Name</th>
                            <th className="p-4 font-medium">Description</th>
                            <th className="p-4 font-medium">State</th>
                            <th className="p-4 font-medium">Sub</th>
                            <th className="p-4 font-medium">Boot</th>
                            <th className="p-4 font-medium text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                        {MOCK_SERVICES.map((svc) => (
                            <tr key={svc.name} className="hover:bg-zinc-800/50 transition-colors group">
                                <td className="p-4 font-bold text-zinc-200">{svc.name}</td>
                                <td className="p-4 text-zinc-400">{svc.description}</td>
                                <td className="p-4">
                                    <span className={`w-2 h-2 inline-block rounded-full mr-2 ${svc.status === 'active' ? 'bg-emerald-500' :
                                            svc.status === 'failed' ? 'bg-rose-500' : 'bg-zinc-500'
                                        }`}></span>
                                    <span className={
                                        svc.status === 'active' ? 'text-emerald-400' :
                                            svc.status === 'failed' ? 'text-rose-400' : 'text-zinc-500'
                                    }>{svc.status}</span>
                                </td>
                                <td className="p-4 text-zinc-500 font-mono text-xs">{svc.subState}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded border ${svc.autoStart
                                            ? 'text-purple-400 border-purple-400/30 bg-purple-400/10'
                                            : 'text-zinc-500 border-zinc-700 bg-zinc-800'
                                        }`}>
                                        {svc.autoStart ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {svc.status !== 'active' && (
                                            <button className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition-colors" title="Start">
                                                <Play size={16} />
                                            </button>
                                        )}
                                        {svc.status === 'active' && (
                                            <button className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors" title="Stop">
                                                <Square size={16} />
                                            </button>
                                        )}
                                        <button className="p-1.5 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors" title="Restart">
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceManager;
