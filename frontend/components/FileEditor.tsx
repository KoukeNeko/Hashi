import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { FileItem } from '../types';
import { FileService } from '../services/api';

interface FileEditorProps {
    file: FileItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (path: string, content: string) => Promise<void>;
}

// 根據檔案副檔名判斷語言
const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
        // Web
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'json': 'json',
        'xml': 'xml',
        'svg': 'xml',
        // Backend
        'java': 'java',
        'py': 'python',
        'rb': 'ruby',
        'php': 'php',
        'go': 'go',
        'rs': 'rust',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp',
        'cs': 'csharp',
        // Config
        'yml': 'yaml',
        'yaml': 'yaml',
        'toml': 'toml',
        'ini': 'ini',
        'conf': 'ini',
        'cfg': 'ini',
        'properties': 'ini',
        // Shell & Scripts
        'sh': 'shell',
        'bash': 'shell',
        'zsh': 'shell',
        'fish': 'shell',
        'ps1': 'powershell',
        // Database
        'sql': 'sql',
        // Docs
        'md': 'markdown',
        'markdown': 'markdown',
        'txt': 'plaintext',
        'log': 'plaintext',
        // Docker & DevOps
        'dockerfile': 'dockerfile',
        'docker': 'dockerfile',
        'nginx': 'nginx',
    };

    // 特殊檔名判斷
    const specialFiles: Record<string, string> = {
        'dockerfile': 'dockerfile',
        'makefile': 'makefile',
        'cmakelists.txt': 'cmake',
        '.gitignore': 'gitignore',
        '.env': 'dotenv',
        '.bashrc': 'shell',
        '.zshrc': 'shell',
    };

    const lowerName = fileName.toLowerCase();
    if (specialFiles[lowerName]) {
        return specialFiles[lowerName];
    }

    return languageMap[ext] || 'plaintext';
};

/**
 * 判斷是否為圖片檔案 (不應嘗試用編輯器開啟)
 * 其他所有檔案都嘗試用編輯器開啟
 */
const isImageFile = (fileName: string): boolean => {
    const imageExtensions = [
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif',
        'heic', 'heif', 'avif', 'raw', 'psd', 'ai', 'eps'
    ];

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext);
};

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

const FileEditor: React.FC<FileEditorProps> = ({ file, isOpen, onClose, onSave }) => {
    const [content, setContent] = useState<string>('');
    const [originalContent, setOriginalContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModified, setIsModified] = useState(false);

    // 載入檔案內容
    useEffect(() => {
        if (isOpen && file && !file.isDirectory) {
            loadFileContent();
        }
    }, [isOpen, file]);

    const loadFileContent = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const text = await FileService.getFileContent(file.path);
            setContent(text);
            setOriginalContent(text);
            setIsModified(false);
        } catch (err: any) {
            console.error('Failed to load file:', err);
            if (err.response?.status === 403) {
                setError('Permission denied. You do not have access to this file.');
            } else if (err.response?.status === 404) {
                setError('File not found.');
            } else {
                setError('Failed to load file content. The file may be too large or not readable.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!file || !onSave) return;

        setSaving(true);
        try {
            await onSave(file.path, content);
            setOriginalContent(content);
            setIsModified(false);
        } catch (err) {
            console.error('Failed to save file:', err);
            setError('Failed to save file.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        const newContent = value || '';
        setContent(newContent);
        setIsModified(newContent !== originalContent);
    };

    const handleClose = () => {
        if (isModified) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleDownload = () => {
        if (!file) return;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ESC 鍵關閉
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
            // Ctrl+S / Cmd+S 儲存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isModified && onSave) {
                    handleSave();
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isModified, content]);

    if (!isOpen || !file) return null;

    const canEdit = !isImageFile(file.name);
    const language = getLanguageFromFileName(file.name);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative w-[90vw] h-[85vh] max-w-6xl bg-zinc-900 rounded-lg border border-zinc-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-zinc-400" />
                        <div>
                            <h2 className="text-white font-medium flex items-center gap-2">
                                {file.name}
                                {isModified && (
                                    <span className="text-xs text-amber-400">• Modified</span>
                                )}
                            </h2>
                            <p className="text-xs text-zinc-500">
                                {file.path} • {formatFileSize(file.size)} • {file.permissions}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canEdit && onSave && (
                            <button
                                onClick={handleSave}
                                disabled={!isModified || saving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-sm font-medium transition-colors"
                            >
                                {saving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Save
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors"
                        >
                            <Download size={16} />
                            Download
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
                                <p className="text-zinc-400">Loading file...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-rose-500" />
                                </div>
                                <p className="text-zinc-300 font-medium mb-1">Failed to Load File</p>
                                <p className="text-zinc-500 text-sm max-w-md">{error}</p>
                                <button
                                    onClick={loadFileContent}
                                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : !canEdit ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FileText size={48} className="text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-300 font-medium mb-1">Cannot Preview This File</p>
                                <p className="text-zinc-500 text-sm">This file type is not supported for preview.</p>
                                <button
                                    onClick={handleDownload}
                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-colors mx-auto"
                                >
                                    <Download size={16} />
                                    Download Instead
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Editor
                            height="100%"
                            language={language}
                            value={content}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{
                                readOnly: !onSave,
                                minimap: { enabled: true },
                                fontSize: 14,
                                fontFamily: '"Fira Code", "Menlo", "Monaco", "Consolas", monospace',
                                fontLigatures: true,
                                lineNumbers: 'on',
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                padding: { top: 16 },
                            }}
                            loading={
                                <div className="flex items-center justify-center h-full bg-zinc-900">
                                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                                </div>
                            }
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500">
                    <div className="flex items-center gap-4">
                        <span>Language: {language}</span>
                        <span>Encoding: UTF-8</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Last Modified: {file.lastModified}</span>
                        {onSave && <span className="text-zinc-600">Press Ctrl+S to save</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileEditor;
