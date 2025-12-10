import React, { useState, useEffect } from 'react';
import { FtpService } from '../../../services/api';
import { FtpServerType } from '../../../types';
import { RefreshCw, Loader2, ScrollText } from 'lucide-react';

interface FtpLogsPanelProps {
    serverType: FtpServerType;
}

const FtpLogsPanel: React.FC<FtpLogsPanelProps> = ({ serverType }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [lines, setLines] = useState(100);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await FtpService.getLogs(serverType, lines);
            setLogs(data);
        } catch (err) {
            console.error('Failed to load logs:', err);
            setLogs(['Failed to load logs']);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [serverType, lines]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <select
                        value={lines}
                        onChange={(e) => setLines(parseInt(e.target.value))}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 rounded text-sm"
                    >
                        <option value={50}>Last 50 lines</option>
                        <option value={100}>Last 100 lines</option>
                        <option value={200}>Last 200 lines</option>
                        <option value={500}>Last 500 lines</option>
                    </select>
                </div>
                <button
                    onClick={loadLogs}
                    disabled={loading}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Logs */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <ScrollText size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">No logs available</p>
                    </div>
                ) : (
                    <div className="h-[500px] overflow-auto p-4 bg-zinc-900">
                        <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                            {logs.join('\n')}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FtpLogsPanel;
