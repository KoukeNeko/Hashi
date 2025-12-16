import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components';
import { DatabaseService } from '../../services/api';
import { Database } from '../../types';
import { Database as DatabaseIcon, Plus, Archive, Trash2, Settings, Loader2 } from 'lucide-react';
import { useFormDialog, ActionButton } from '../../components/ui/Form';
import { CreateDatabaseDialog } from './components/CreateDatabaseDialog';

const DatabaseManager: React.FC = () => {
    const [databases, setDatabases] = useState<Database[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const createDialog = useFormDialog();

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await DatabaseService.list();
            setDatabases(data);
        } catch (err) {
            console.error('Failed to fetch databases:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRemove = async (db: Database) => {
        if (!confirm(`Are you sure you want to delete database "${db.name}"? This cannot be undone.`)) {
            return;
        }
        setActionLoading(db.name);
        try {
            await DatabaseService.remove(db.name, db.type);
            await fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete database');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Database Management"
                icon={DatabaseIcon}
                description="Manage MySQL and PostgreSQL databases."
                actions={
                    <ActionButton
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={() => createDialog.open()}
                    >
                        Add Database
                    </ActionButton>
                }
            />

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                </div>
            ) : databases.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    No databases found. Make sure MySQL or PostgreSQL is installed and running.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {databases.map((db) => (
                        <div
                            key={db.id || db.name}
                            className="bg-surface border border-border rounded-lg p-6 shadow-lg hover:border-zinc-600 transition-colors group relative"
                        >
                            {actionLoading === db.name && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm">
                                    <Loader2 size={24} className="animate-spin text-white" />
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-3 rounded-lg ${db.type === 'MySQL'
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : db.type === 'PostgreSQL'
                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                    : 'bg-rose-500/10 text-rose-400'
                                            }`}
                                    >
                                        <DatabaseIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-100">{db.name}</h3>
                                        <span className="text-xs text-zinc-500 font-mono">
                                            {db.type}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${db.status === 'online'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-400'
                                        }`}
                                >
                                    {db.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                    <span className="text-zinc-500">User</span>
                                    <span className="text-zinc-300 font-mono">
                                        {db.username || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-border/50 pb-2">
                                    <span className="text-zinc-500">Size</span>
                                    <span className="text-zinc-300 font-mono">
                                        {db.size || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Last Backup</span>
                                    <span className="text-zinc-300 font-mono">
                                        {db.backup || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled>
                                    <Settings size={14} /> Admin
                                </button>
                                <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled>
                                    <Archive size={14} /> Backup
                                </button>
                                <button
                                    onClick={() => handleRemove(db)}
                                    className="p-2 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                                    title="Delete Database"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateDatabaseDialog
                isOpen={createDialog.isOpen}
                onClose={createDialog.close}
                onSuccess={() => {
                    createDialog.close();
                    fetchData();
                }}
            />
        </div>
    );
};

export default DatabaseManager;
