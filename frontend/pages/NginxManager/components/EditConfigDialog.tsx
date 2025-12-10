import React, { useState, useEffect } from 'react';
import { Edit, Save, AlertTriangle } from 'lucide-react';
import { NginxApiService } from '../../../services/api';
import { Dialog, DialogBody, DialogFooter } from '../../../components/ui/Dialog';
import { ActionButton, FormError } from '../../../components/ui/Form';
import CodeEditor from '../../../components/CodeEditor'; // Adjust path if needed

interface EditConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    hostName: string | null;
    onSuccess: () => void;
}

const EditConfigDialog: React.FC<EditConfigDialogProps> = ({ isOpen, onClose, hostName, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen && hostName) {
            loadConfig(hostName);
        } else {
            setContent('');
            setError(null);
        }
    }, [isOpen, hostName]);

    const loadConfig = async (name: string) => {
        setLoading(true);
        setError(null);
        try {
            const configContent = await NginxApiService.getHostConfig(name);
            setContent(configContent);
        } catch (err: any) {
            console.error('Failed to load config:', err);
            setError('Failed to load configuration file.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!hostName) return;
        setSaving(true);
        setError(null);
        try {
            // Optional: Test config before saving? Or maybe separate "Test" button?
            // For now just save. The backend should ideally test before applying.
            await NginxApiService.updateHostConfig(hostName, content);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save config:', err);
            setError('Failed to save configuration: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Configuration: ${hostName}`}
            titleIcon={<Edit size={20} className="text-emerald-500" />}
            maxWidth="4xl"
        >
            <DialogBody className="flex flex-col h-[70vh]">
                {error && <FormError message={error} />}

                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mb-4 flex gap-3 text-sm text-amber-200">
                    <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                    <p>
                        Editing the Nginx configuration manually can break your website.
                        Ensure the configuration is valid before saving.
                    </p>
                </div>

                <div className="flex-1 min-h-0 border border-zinc-700 rounded overflow-hidden">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-zinc-500">
                            Loading configuration...
                        </div>
                    ) : (
                        <CodeEditor
                            value={content}
                            onChange={setContent}
                            language="nginx" // Assuming CodeEditor supports or falls back gracefully
                            height="100%"
                        />
                    )}
                </div>
            </DialogBody>

            <DialogFooter>
                <ActionButton variant="ghost" onClick={onClose} disabled={saving}>
                    Cancel
                </ActionButton>
                <ActionButton
                    onClick={handleSave}
                    variant="primary"
                    loading={saving}
                    icon={<Save size={16} />}
                    disabled={loading}
                >
                    Save Changes
                </ActionButton>
            </DialogFooter>
        </Dialog>
    );
};

export default EditConfigDialog;
