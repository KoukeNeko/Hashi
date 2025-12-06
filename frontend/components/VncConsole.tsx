import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Maximize2, Minimize2, Loader2, AlertCircle, Copy, Check, Monitor, ExternalLink } from 'lucide-react';
import { VirtService } from '../services/api';
import { VncInfo } from '../types';

interface VncConsoleProps {
    vmName: string;
    onClose: () => void;
}



type ViewMode = 'embedded' | 'info';

export const VncConsole: React.FC<VncConsoleProps> = ({ vmName, onClose }) => {
    const [vncInfo, setVncInfo] = useState<VncInfo | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('embedded');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchVncInfo = async () => {
            try {
                const info = await VirtService.getVncInfo(vmName);
                setVncInfo(info);
                setStatus('ready');
            } catch (error) {
                console.error('Failed to get VNC info:', error);
                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : 'Failed to get VNC info');
            }
        };

        fetchVncInfo();
    }, [vmName]);

    const copyCommand = useCallback(async () => {
        if (!vncInfo) return;
        const command = `vncviewer ${vncInfo.host}:${vncInfo.port}`;
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [vncInfo]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // 建構內嵌 noVNC 的 URL（使用後端部署的 noVNC）
    const getEmbeddedNoVncUrl = useCallback(() => {
        if (!vncInfo) return null;
        const baseUrl = window.location.origin;
        const path = vncInfo.websocketUrl.replace(/^\//, '');
        // 使用 vnc_lite.html 更適合內嵌
        return `${baseUrl}/novnc/vnc_lite.html?autoconnect=true&resize=scale&path=${encodeURIComponent(path)}&host=${window.location.hostname}&port=${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`;
    }, [vncInfo]);

    // 開新視窗的 URL
    const getPopoutNoVncUrl = useCallback(() => {
        if (!vncInfo) return null;
        const baseUrl = window.location.origin;
        const path = vncInfo.websocketUrl.replace(/^\//, '');
        return `${baseUrl}/novnc/vnc.html?autoconnect=true&resize=scale&path=${encodeURIComponent(path)}&host=${window.location.hostname}&port=${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`;
    }, [vncInfo]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div 
                ref={containerRef}
                className={`bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden flex flex-col ${
                    isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] h-[90vh] max-w-6xl'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
                    <div className="flex items-center gap-3">
                        <Monitor size={18} className="text-blue-400" />
                        <span className="text-sm text-zinc-300">
                            Console: <span className="text-white font-medium">{vmName}</span>
                        </span>
                        {status === 'ready' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                VNC Ready
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        {status === 'ready' && (
                            <div className="flex items-center bg-zinc-700 rounded p-0.5 mr-2">
                                <button
                                    onClick={() => setViewMode('embedded')}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${
                                        viewMode === 'embedded' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    Console
                                </button>
                                <button
                                    onClick={() => setViewMode('info')}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${
                                        viewMode === 'info' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    Info
                                </button>
                            </div>
                        )}
                        {/* Open in new tab */}
                        {status === 'ready' && getPopoutNoVncUrl() && (
                            <a
                                href={getPopoutNoVncUrl()!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-zinc-700 rounded transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink size={16} className="text-zinc-400" />
                            </a>
                        )}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-zinc-700 rounded transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? 
                                <Minimize2 size={16} className="text-zinc-400" /> : 
                                <Maximize2 size={16} className="text-zinc-400" />
                            }
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-700 rounded transition-colors"
                            title="Close"
                        >
                            <X size={16} className="text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-blue-400" />
                                <span className="text-zinc-400">Getting VNC connection info...</span>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <AlertCircle size={32} className="text-rose-400" />
                                <span className="text-rose-400 font-medium">Failed to get VNC info</span>
                                <span className="text-zinc-500 text-sm">{errorMessage}</span>
                            </div>
                        </div>
                    )}

                    {status === 'ready' && vncInfo && viewMode === 'embedded' && (
                        <iframe
                            src={getEmbeddedNoVncUrl() || ''}
                            className="w-full h-full border-0"
                            allow="fullscreen"
                            title={`VNC Console - ${vmName}`}
                        />
                    )}

                    {status === 'ready' && vncInfo && viewMode === 'info' && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 overflow-auto">
                            <div className="w-full max-w-lg space-y-6">
                                {/* VNC Connection Info */}
                                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">VNC Connection Details</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Host</label>
                                                <p className="text-white font-mono">{vncInfo.host}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Port</label>
                                                <p className="text-white font-mono">{vncInfo.port}</p>
                                            </div>
                                        </div>

                                        {vncInfo.password && (
                                            <div>
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Password</label>
                                                <p className="text-white font-mono">••••••••</p>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-zinc-700">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                                                Connect with VNC client
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-zinc-900 text-emerald-400 px-3 py-2 rounded font-mono text-sm">
                                                    vncviewer {vncInfo.host}:{vncInfo.port}
                                                </code>
                                                <button
                                                    onClick={copyCommand}
                                                    className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                                                    title="Copy command"
                                                >
                                                    {copied ? 
                                                        <Check size={16} className="text-emerald-400" /> : 
                                                        <Copy size={16} className="text-zinc-400" />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                    <h4 className="text-amber-400 font-medium text-sm mb-2">Recommended VNC Clients</h4>
                                    <ul className="text-zinc-400 text-sm space-y-1">
                                        <li>• <span className="text-white">TigerVNC</span> - <code className="text-xs bg-zinc-800 px-1 rounded">apt install tigervnc-viewer</code></li>
                                        <li>• <span className="text-white">Remmina</span> - <code className="text-xs bg-zinc-800 px-1 rounded">apt install remmina</code></li>
                                        <li>• <span className="text-white">GNOME Connections</span> - <code className="text-xs bg-zinc-800 px-1 rounded">apt install gnome-connections</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {status === 'ready' && viewMode === 'embedded' && (
                    <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-xs text-zinc-500">
                        <span>Tip: Click inside the console to capture input. Use the </span>
                        <button 
                            onClick={() => setViewMode('info')}
                            className="text-blue-400 hover:underline"
                        >
                            Info tab
                        </button>
                        <span> for native VNC client connection details.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
