import React, { useState, useEffect } from 'react';
import { FtpService } from '../../../services/api';
import { FtpServerType } from '../../../types';
import { ActionButton } from '../../../components';
import CodeEditor, { getLanguageFromFileName } from '../../../components/CodeEditor';
import { Alert } from '../../../components/ui';
import { Save, Loader2, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

interface FtpConfigPanelProps {
    serverType: FtpServerType;
    configPath: string;
    onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

const FtpConfigPanel: React.FC<FtpConfigPanelProps> = ({ serverType, configPath, onToast }) => {
    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await FtpService.getConfig(serverType);
            setContent(data);
            setOriginalContent(data);
        } catch (err) {
            console.error('Failed to load config:', err);
            onToast({ message: 'Failed to load configuration', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, [serverType]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await FtpService.updateConfig(serverType, content);
            setOriginalContent(content);
            onToast({ message: 'Configuration saved successfully', type: 'success' });
        } catch (err) {
            console.error('Failed to save config:', err);
            onToast({ message: 'Failed to save configuration', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = content !== originalContent;
    const language = getLanguageFromFileName(configPath);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <FileText size={16} />
                    <span className="font-mono">{configPath}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadConfig}
                        disabled={loading}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        title="Reload"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <ActionButton
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        loading={saving}
                        icon={<Save size={16} />}
                        loadingIcon={<Loader2 size={16} className="animate-spin" />}
                    >
                        Save Changes
                    </ActionButton>
                </div>
            </div>

            {/* Warning */}
            {hasChanges && (
                <Alert variant="warning" icon={AlertTriangle}>
                    You have unsaved changes. Click "Save Changes" to apply.
                </Alert>
            )}

            {/* Config Editor */}
            {loading ? (
                <div className="flex items-center justify-center h-[500px] w-full border border-border rounded-lg bg-zinc-900">
                    <Loader2 size={32} className="animate-spin text-zinc-500" />
                </div>
            ) : (
                <CodeEditor
                    value={content}
                    onChange={setContent}
                    language={language}
                    height="500px"
                    showMinimap={true}
                />
            )}

            {/* Info */}
            <Alert variant="info">
                After saving, you may need to restart the FTP service for changes to take effect.
            </Alert>
        </div>
    );
};

export default FtpConfigPanel;
