
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { CronService } from '../services/api';
import { CronJob } from '../types';
import { Clock, Trash2, Edit, Plus, Save, Loader2 } from 'lucide-react';
import {
    Dialog, DialogBody, DialogFooter,
    ConfirmDialog, FormInput, 
    Toast, ActionButton
} from '../components/ui';

// 新增/編輯彈窗
const CronDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: CronJob) => void;
    job: CronJob | null;
}> = ({ isOpen, onClose, onSave, job }) => {
    const [expression, setExpression] = useState('');
    const [command, setCommand] = useState('');
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (job) {
            setExpression(job.expression);
            setCommand(job.command);
            setComment(job.comment || '');
        } else {
            setExpression('');
            setCommand('');
            setComment('');
        }
    }, [job, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expression.trim() || !command.trim()) return;
        onSave({
            id: job?.id,
            expression: expression.trim(),
            command: command.trim(),
            comment: comment.trim() || undefined,
        });
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={job ? 'Edit Cron Job' : 'Add Cron Job'}
            titleIcon={<Clock size={20} className="text-emerald-400" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    <FormInput
                        label="Cron Expression"
                        value={expression}
                        onChange={setExpression}
                        placeholder="0 3 * * *"
                        required
                        hint="Format: minute hour day month weekday"
                        mono
                    />
                    <FormInput
                        label="Command"
                        value={command}
                        onChange={setCommand}
                        placeholder="/path/to/script.sh"
                        required
                        mono
                    />
                    <FormInput
                        label="Comment (optional)"
                        value={comment}
                        onChange={setComment}
                        placeholder="Brief description"
                    />
                </DialogBody>
                <DialogFooter>
                    <ActionButton variant="ghost" onClick={onClose}>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        type="submit"
                        variant="primary"
                        icon={<Save size={16} />}
                    >
                        {job ? 'Update' : 'Create'}
                    </ActionButton>
                </DialogFooter>
            </form>
        </Dialog>
    );
};

// 刪除確認彈窗
const DeleteConfirmDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    job: CronJob | null;
}> = ({ isOpen, onClose, onConfirm, job }) => {
    if (!job) return null;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Delete Cron Job"
            message="Are you sure you want to delete this cron job?"
            confirmText="Delete"
            confirmIcon={<Trash2 size={16} />}
        >
            <div className="bg-zinc-800/50 rounded p-3">
                <p className="font-mono text-emerald-400 text-sm">{job.expression}</p>
                <p className="font-mono text-zinc-400 text-xs mt-1 truncate">{job.command}</p>
            </div>
        </ConfirmDialog>
    );
};

// 解析 Cron 表達式為人類可讀的描述
const parseCronExpression = (expression: string): string => {
    const parts = expression.split(' ');
    if (parts.length !== 5) return expression;

    const [min, hour, day, month, weekday] = parts;
    
    // 簡單的解析邏輯
    if (min === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        return 'Every minute';
    }
    if (min === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        return 'Every hour';
    }
    if (min === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
        return 'Daily at midnight';
    }
    if (day === '*' && month === '*' && weekday === '*') {
        return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    if (weekday !== '*' && day === '*' && month === '*') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[parseInt(weekday)] || weekday;
        return `Every ${dayName} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    if (day !== '*' && month === '*' && weekday === '*') {
        return `Monthly on day ${day} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    
    return expression;
};

const CronManager: React.FC = () => {
    const [jobs, setJobs] = useState<CronJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<CronJob | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<CronJob | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // 載入 Cron Jobs
    const loadJobs = async () => {
        try {
            setLoading(true);
            const data = await CronService.listJobs();
            setJobs(data);
        } catch (err: any) {
            console.error('Failed to load cron jobs:', err);
            setToast({ message: 'Failed to load cron jobs', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    // 儲存所有 Jobs (新增或更新後都要重新儲存)
    const saveAllJobs = async (newJobs: CronJob[]) => {
        try {
            setSaving(true);
            await CronService.saveJobs(newJobs);
            setJobs(newJobs);
            return true;
        } catch (err: any) {
            console.error('Failed to save cron jobs:', err);
            let errorMsg = 'Failed to save cron jobs';
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string' 
                    ? err.response.data 
                    : err.response.data.message || JSON.stringify(err.response.data);
            }
            setToast({ message: errorMsg, type: 'error' });
            return false;
        } finally {
            setSaving(false);
        }
    };

    // 新增 Job
    const handleAddJob = () => {
        setEditingJob(null);
        setDialogOpen(true);
    };

    // 編輯 Job
    const handleEditJob = (job: CronJob) => {
        setEditingJob(job);
        setDialogOpen(true);
    };

    // 儲存 Job (新增或更新)
    const handleSaveJob = async (job: CronJob) => {
        let newJobs: CronJob[];
        
        if (job.id) {
            // 更新現有
            newJobs = jobs.map(j => j.id === job.id ? job : j);
        } else {
            // 新增 (給一個臨時 ID，後端會重新分配)
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            newJobs = [...jobs, { ...job, id: tempId }];
        }

        const success = await saveAllJobs(newJobs);
        if (success) {
            setDialogOpen(false);
            setToast({ message: job.id ? 'Cron job updated' : 'Cron job created', type: 'success' });
            // 重新載入以取得後端分配的 ID
            loadJobs();
        }
    };

    // 確認刪除
    const handleDeleteClick = (job: CronJob) => {
        setJobToDelete(job);
        setDeleteDialogOpen(true);
    };

    // 執行刪除
    const handleDeleteConfirm = async () => {
        if (!jobToDelete) return;
        
        const newJobs = jobs.filter(j => j.id !== jobToDelete.id);
        const success = await saveAllJobs(newJobs);
        if (success) {
            setDeleteDialogOpen(false);
            setJobToDelete(null);
            setToast({ message: 'Cron job deleted', type: 'success' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Cron Jobs"
                icon={Clock}
                description="Manage scheduled tasks and recurring scripts."
                actions={
                    <ActionButton
                        onClick={handleAddJob}
                        disabled={saving}
                        icon={<Plus size={16} />}
                        className="shadow-lg"
                    >
                        Add Cron Job
                    </ActionButton>
                }
            />

            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                        <Clock size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">No cron jobs configured</p>
                        <button 
                            onClick={handleAddJob}
                            className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            Create your first cron job
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium">Expression</th>
                                <th className="p-4 font-medium">Schedule</th>
                                <th className="p-4 font-medium">Command</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4 font-mono text-emerald-400 bg-emerald-500/5">{job.expression}</td>
                                    <td className="p-4 text-zinc-400 text-xs">{parseCronExpression(job.expression)}</td>
                                    <td className="p-4 font-mono text-zinc-300 text-xs truncate max-w-xs" title={job.command}>
                                        {job.command}
                                        {job.comment && (
                                            <span className="ml-2 text-zinc-500">#{job.comment}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 text-zinc-500">
                                            <button 
                                                onClick={() => handleEditJob(job)}
                                                disabled={saving}
                                                className="hover:text-white transition-colors disabled:opacity-50"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(job)}
                                                disabled={saving}
                                                className="hover:text-rose-400 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 儲存中的遮罩 */}
            {saving && (
                <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
                    <div className="bg-surface border border-border rounded-lg px-6 py-4 flex items-center gap-3">
                        <Loader2 size={20} className="animate-spin text-emerald-400" />
                        <span className="text-zinc-300">Saving...</span>
                    </div>
                </div>
            )}

            {/* 新增/編輯彈窗 */}
            <CronDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveJob}
                job={editingJob}
            />

            {/* 刪除確認彈窗 */}
            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setJobToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                job={jobToDelete}
            />

            {/* Toast 通知 */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default CronManager;
