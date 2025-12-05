import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { ScrollText, Download, Trash2, Search, Pause, Play, ArrowDown, Loader2, Wifi, WifiOff } from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'NOTICE' | 'CRIT' | 'UNKNOWN';
    service: string;
    message: string;
    raw: string;
}

// 解析 journalctl 輸出
const parseLogLine = (line: string, id: number): LogEntry | null => {
    if (!line.trim()) return null;
    
    // journalctl 格式範例: 
    // Dec 05 12:34:56 hostname service[pid]: message
    // 或: Dec 05 12:34:56 hostname kernel: message
    const match = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[\d+\])?:\s*(.*)$/);
    
    if (match) {
        const [, timestamp, , service, message] = match;
        
        // 偵測 log level
        let level: LogEntry['level'] = 'INFO';
        const lowerMsg = message.toLowerCase();
        const lowerService = service.toLowerCase();
        
        if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('fatal')) {
            level = 'ERROR';
        } else if (lowerMsg.includes('warn') || lowerMsg.includes('warning')) {
            level = 'WARN';
        } else if (lowerMsg.includes('debug')) {
            level = 'DEBUG';
        } else if (lowerMsg.includes('notice')) {
            level = 'NOTICE';
        } else if (lowerMsg.includes('crit') || lowerMsg.includes('critical')) {
            level = 'CRIT';
        } else if (lowerService.includes('kernel')) {
            level = 'DEBUG';
        }
        
        return { id, timestamp, level, service: service.replace(/\[\d+\]$/, ''), message, raw: line };
    }
    
    // 無法解析，直接當作 raw log
    return { id, timestamp: '', level: 'UNKNOWN', service: '', message: line, raw: line };
};

const LogManager: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [paused, setPaused] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(true);
    
    const wsRef = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const logIdRef = useRef(0);
    const pausedLogsRef = useRef<LogEntry[]>([]);

    // 滾動到底部
    const scrollToBottom = () => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
        setAutoScroll(true);
    };

    // 建立 WebSocket 連線
    const connectWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setConnecting(true);
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProtocol}//${window.location.host}/logs`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Log WebSocket connected');
            setConnected(true);
            setConnecting(false);
        };

        ws.onmessage = (event) => {
            const data = event.data as string;
            const lines = data.split('\n');
            
            const newLogs: LogEntry[] = [];
            for (const line of lines) {
                const parsed = parseLogLine(line, logIdRef.current++);
                if (parsed) newLogs.push(parsed);
            }
            
            if (newLogs.length === 0) return;

            setLogs(prev => {
                const combined = [...prev, ...newLogs];
                return combined.slice(-2000);
            });
        };

        ws.onclose = () => {
            console.log('Log WebSocket disconnected');
            setConnected(false);
            setConnecting(false);
            wsRef.current = null;
            
            // 5 秒後自動重連
            setTimeout(() => {
                connectWebSocket();
            }, 5000);
        };

        ws.onerror = (err) => {
            console.error('Log WebSocket error:', err);
            setConnecting(false);
        };
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    // 自動滾動到底部 - 當 logs 更新時
    useEffect(() => {
        if (autoScroll && !paused && logs.length > 0) {
            scrollToBottom();
        }
    }, [logs, autoScroll, paused]);

    // 過濾和搜尋
    const filteredLogs = logs.filter(log => {
        if (paused) return true; // 暫停時不過濾，保持原狀
        const matchFilter = filter === 'ALL' || log.level === filter;
        const matchSearch = !searchQuery || 
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.service.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    }).filter(log => {
        // 再次過濾（非暫停時）
        if (!paused) return true;
        const matchFilter = filter === 'ALL' || log.level === filter;
        const matchSearch = !searchQuery || 
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.service.toLowerCase().includes(searchQuery.toLowerCase());
        return matchFilter && matchSearch;
    });

    // 清除 logs
    const handleClear = () => {
        setLogs([]);
        pausedLogsRef.current = [];
    };

    // 匯出 logs
    const handleExport = () => {
        const content = filteredLogs.map(l => l.raw).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 偵測手動滾動
    const handleScroll = () => {
        if (!logContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
        // 如果距離底部超過 50px，關閉自動滾動
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isAtBottom);
    };

    const filterTabs = [
        { id: 'ALL', label: 'All' },
        { id: 'INFO', label: 'Info' },
        { id: 'WARN', label: 'Warn' },
        { id: 'ERROR', label: 'Error' },
        { id: 'DEBUG', label: 'Debug' },
    ];

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'INFO': return 'text-emerald-500';
            case 'WARN': return 'text-amber-500';
            case 'ERROR': case 'CRIT': return 'text-rose-500';
            case 'DEBUG': return 'text-blue-500';
            case 'NOTICE': return 'text-cyan-500';
            default: return 'text-zinc-500';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="System Logs"
                icon={ScrollText}
                iconColor="text-zinc-400"
                description={
                    <span className="flex items-center gap-2">
                        {connecting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Connecting...
                            </>
                        ) : connected ? (
                            <>
                                <Wifi size={14} className="text-emerald-400" />
                                <span className="text-emerald-400">Live</span>
                                <span className="text-zinc-500">|</span>
                                <span>{logs.length} entries</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={14} className="text-rose-400" />
                                <span className="text-rose-400">Disconnected</span>
                            </>
                        )}
                    </span>
                }
                actions={
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPaused(!paused)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-lg border ${
                                paused 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20'
                            }`}
                        >
                            {paused ? <Play size={16} /> : <Pause size={16} />}
                            {paused ? 'Resume' : 'Pause'}
                            {paused && pausedLogsRef.current.length > 0 && (
                                <span className="bg-amber-500 text-black text-xs px-1.5 rounded-full">
                                    +{pausedLogsRef.current.length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={handleExport}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Download size={16} /> Export
                        </button>
                        <button 
                            onClick={handleClear}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-lg border border-border">
                <Tabs
                    items={filterTabs}
                    activeId={filter}
                    onChange={setFilter}
                    className="w-full sm:w-auto"
                />

                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Log Container */}
            <div className="relative">
                <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden shadow-2xl font-mono text-xs">
                    <div 
                        ref={logContainerRef}
                        onScroll={handleScroll}
                        className="h-[600px] overflow-y-auto p-4 space-y-0.5"
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                <ScrollText size={48} className="mb-4 opacity-50" />
                                <p>{connecting ? 'Connecting to log stream...' : 'No logs yet'}</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="flex gap-2 hover:bg-zinc-900/50 py-0.5 px-1 rounded group">
                                    <span className="text-zinc-600 whitespace-nowrap shrink-0">{log.timestamp}</span>
                                    {log.level !== 'UNKNOWN' && (
                                        <span className={`w-12 text-center font-bold shrink-0 ${getLevelColor(log.level)}`}>
                                            [{log.level}]
                                        </span>
                                    )}
                                    {log.service && (
                                        <span className="text-purple-400 shrink-0 max-w-[120px] truncate" title={log.service}>
                                            {log.service}:
                                        </span>
                                    )}
                                    <span className="text-zinc-300 break-all">{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 滾動到底部按鈕 */}
                {!autoScroll && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-full shadow-lg border border-zinc-700 transition-colors"
                        title="Scroll to bottom"
                    >
                        <ArrowDown size={18} />
                    </button>
                )}
            </div>

            {/* 狀態欄 */}
            <div className="flex items-center justify-between text-xs text-zinc-500 px-2">
                <span>
                    Showing {filteredLogs.length} of {logs.length} entries
                    {paused && <span className="ml-2 text-amber-400">(Paused)</span>}
                </span>
                <span className="flex items-center gap-2">
                    Auto-scroll: 
                    <span className={autoScroll ? 'text-emerald-400' : 'text-zinc-500'}>
                        {autoScroll ? 'ON' : 'OFF'}
                    </span>
                </span>
            </div>
        </div>
    );
};

export default LogManager;
