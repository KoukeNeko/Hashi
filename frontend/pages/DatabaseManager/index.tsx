
import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { MOCK_DATABASES } from '../../constants';
import { Database, Plus, RefreshCw, Archive, Trash2, Settings } from 'lucide-react';

const DatabaseManager: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Database Management"
                icon={Database}
                description="Manage MySQL, PostgreSQL and Redis databases."
                actions={
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 shadow-lg">
                        <Plus size={16} /> Add Database
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_DATABASES.map(db => (
                    <div key={db.id} className="bg-surface border border-border rounded-lg p-6 shadow-lg hover:border-zinc-600 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${db.type === 'MySQL' ? 'bg-blue-500/10 text-blue-400' :
                                        db.type === 'PostgreSQL' ? 'bg-indigo-500/10 text-indigo-400' :
                                            'bg-rose-500/10 text-rose-400'
                                    }`}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-100">{db.name}</h3>
                                    <span className="text-xs text-zinc-500 font-mono">{db.type}</span>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${db.status === 'online'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                {db.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                <span className="text-zinc-500">User</span>
                                <span className="text-zinc-300 font-mono">{db.username}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                <span className="text-zinc-500">Size</span>
                                <span className="text-zinc-300 font-mono">{db.size}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Last Backup</span>
                                <span className="text-zinc-300 font-mono">{db.backup}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2">
                                <Settings size={14} /> Admin
                            </button>
                            <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2">
                                <Archive size={14} /> Backup
                            </button>
                            <button className="p-2 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DatabaseManager;
