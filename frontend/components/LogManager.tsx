import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Tabs } from './Tabs';
import { MOCK_LOGS } from '../constants';
import { ScrollText, Download, Trash2, Search } from 'lucide-react';

const LogManager: React.FC = () => {
  const [filter, setFilter] = useState('ALL');

  const filterTabs = [
      { id: 'ALL', label: 'All Logs' },
      { id: 'INFO', label: 'Info' },
      { id: 'WARN', label: 'Warnings' },
      { id: 'ERROR', label: 'Errors' },
      { id: 'DEBUG', label: 'Debug' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <PageHeader
            title="System Logs"
            icon={ScrollText}
            iconColor="text-zinc-400"
            description="View and analyze system, kernel, and service logs."
            actions={
                <div className="flex gap-3">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
                        <Download size={16} /> Export
                    </button>
                     <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-lg">
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
                    className="bg-zinc-950 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                />
            </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden shadow-2xl font-mono text-sm">
            <div className="max-h-[600px] overflow-y-auto p-4 space-y-1">
                {MOCK_LOGS.filter(log => filter === 'ALL' || log.level === filter).map(log => (
                    <div key={log.id} className="flex gap-3 hover:bg-zinc-900/50 p-1 rounded group">
                        <span className="text-zinc-500 whitespace-nowrap text-xs">{log.timestamp}</span>
                        <span className={`w-14 text-center font-bold text-xs ${
                            log.level === 'INFO' ? 'text-emerald-500' :
                            log.level === 'WARN' ? 'text-amber-500' :
                            log.level === 'ERROR' ? 'text-rose-500' : 'text-blue-500'
                        }`}>
                            [{log.level}]
                        </span>
                        <span className="text-purple-400 w-20 truncate" title={log.service}>{log.service}:</span>
                        <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default LogManager;
