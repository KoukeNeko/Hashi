
import React from 'react';
import { PageHeader } from './PageHeader';
import { MOCK_CRON_JOBS } from '../constants';
import { Clock, Play, Pause, Trash2, Edit } from 'lucide-react';

const CronManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
        <PageHeader
            title="Cron Jobs"
            icon={Clock}
            description="Manage scheduled tasks and recurring scripts."
            actions={
                <button className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded font-medium text-sm transition-colors shadow-lg">
                    Add Cron Job
                </button>
            }
        />

        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                        <th className="p-4 font-medium">Job Name</th>
                        <th className="p-4 font-medium">Schedule</th>
                        <th className="p-4 font-medium">Command</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Last Run</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                    {MOCK_CRON_JOBS.map(job => (
                        <tr key={job.id} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="p-4 font-bold text-zinc-200">{job.name}</td>
                            <td className="p-4 font-mono text-emerald-400 bg-emerald-500/5 w-fit rounded px-2">{job.schedule}</td>
                            <td className="p-4 font-mono text-zinc-400 text-xs truncate max-w-xs" title={job.command}>{job.command}</td>
                            <td className="p-4">
                                <span className={`flex items-center gap-1.5 text-xs font-bold uppercase ${job.status === 'active' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
                                    {job.status}
                                </span>
                            </td>
                            <td className="p-4 text-zinc-500 text-xs">{job.lastRun}</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2 text-zinc-500">
                                    <button className="hover:text-white transition-colors"><Edit size={16} /></button>
                                    <button className={`transition-colors ${job.status === 'active' ? 'hover:text-amber-400' : 'hover:text-emerald-400'}`}>
                                        {job.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button className="hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
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

export default CronManager;
