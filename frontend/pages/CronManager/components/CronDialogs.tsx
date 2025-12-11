import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { CronJob } from '../../../types';
import { ConfirmDialog, FormDialog } from '../../../components/ui';

// ==================== Types ====================
export interface CronFormValues {
    expression: string;
    command: string;
    comment: string;
}

// ==================== Cron Job Dialog ====================
export const CronJobDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: CronJob) => Promise<void>;
    job: CronJob | null;
}> = ({ isOpen, onClose, onSave, job }) => {
    const handleSubmit = async (values: CronFormValues) => {
        await onSave({
            id: job?.id,
            expression: values.expression.trim(),
            command: values.command.trim(),
            comment: values.comment.trim() || undefined,
        });
    };

    return (
        <FormDialog<CronFormValues>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title={job ? 'Edit Cron Job' : 'Add Cron Job'}
            titleIcon={<Clock size={20} className="text-emerald-400" />}
            submitText={job ? 'Update' : 'Create'}
            initialValues={
                job
                    ? {
                          expression: job.expression,
                          command: job.command,
                          comment: job.comment || '',
                      }
                    : undefined
            }
            fields={[
                {
                    name: 'expression',
                    label: 'Cron Expression',
                    required: true,
                    placeholder: '0 3 * * *',
                    hint: 'Format: minute hour day month weekday',
                    mono: true,
                },
                {
                    name: 'command',
                    label: 'Command',
                    required: true,
                    placeholder: '/path/to/script.sh',
                    mono: true,
                },
                { name: 'comment', label: 'Comment (optional)', placeholder: 'Brief description' },
            ]}
        />
    );
};

// ==================== Delete Confirm Dialog ====================
export const DeleteCronDialog: React.FC<{
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
