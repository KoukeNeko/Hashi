import React from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
    value: string;
    onChange?: (value: string) => void;
    language?: string;
    readOnly?: boolean;
    height?: string;
    fontSize?: number;
    showMinimap?: boolean;
}

/**
 * 根據檔案副檔名判斷語言
 */
export const getLanguageFromFileName = (fileName: string): string => {
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
 * 可重用的 Monaco 程式碼編輯器元件
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = 'plaintext',
    readOnly = false,
    height = '500px',
    fontSize = 14,
    showMinimap = false,
}) => {
    const handleChange = (newValue: string | undefined) => {
        if (onChange) {
            onChange(newValue || '');
        }
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden" style={{ height }}>
            <Editor
                height="100%"
                language={language}
                value={value}
                onChange={handleChange}
                theme="vs-dark"
                options={{
                    readOnly,
                    minimap: { enabled: showMinimap },
                    fontSize,
                    fontFamily: '"Fira Code", "Menlo", "Monaco", "Consolas", monospace',
                    fontLigatures: true,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 12, bottom: 12 },
                }}
                loading={
                    <div className="flex items-center justify-center w-full h-full bg-zinc-900">
                        <Loader2 size={32} className="animate-spin text-emerald-500" />
                    </div>
                }
            />
        </div>
    );
};

export default CodeEditor;
