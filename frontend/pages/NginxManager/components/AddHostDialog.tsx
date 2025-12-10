import React, { useState } from 'react';
import { X, Globe, Server, ArrowUpDown, Code, Loader2 } from 'lucide-react';
import { NginxApiService, CreateNginxHostRequest } from '../../../services/api';

interface AddHostDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type HostType = 'static' | 'proxy' | 'php';

const AddHostDialog: React.FC<AddHostDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 表單狀態
    const [domain, setDomain] = useState('');
    const [type, setType] = useState<HostType>('static');
    const [port, setPort] = useState(80);
    const [root, setRoot] = useState('/var/www/html');
    const [proxyPass, setProxyPass] = useState('http://localhost:3000');
    const [gzip, setGzip] = useState(true);
    const [rateLimit, setRateLimit] = useState(false);
    const [rateLimitRate, setRateLimitRate] = useState(10);

    // 重置表單
    const resetForm = () => {
        setDomain('');
        setType('static');
        setPort(80);
        setRoot('/var/www/html');
        setProxyPass('http://localhost:3000');
        setGzip(true);
        setRateLimit(false);
        setRateLimitRate(10);
        setError(null);
    };

    // 關閉 Dialog
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // 提交表單
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const request: CreateNginxHostRequest = {
            domain,
            port,
            type,
            root: type !== 'proxy' ? root : undefined,
            proxyPass: type === 'proxy' ? proxyPass : undefined,
            gzip,
            rateLimit,
            rateLimitRate: rateLimit ? rateLimitRate : undefined,
        };

        try {
            await NginxApiService.createHost(request);
            handleClose();
            onSuccess();
        } catch (err: any) {
            console.error('Failed to create host:', err);
            setError(err.response?.data?.message || 'Failed to create virtual host');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-zinc-900 rounded-lg border border-zinc-700 shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
                    <div className="flex items-center gap-3">
                        <Globe size={20} className="text-emerald-500" />
                        <h2 className="text-lg font-bold text-white">Add Virtual Host</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Host Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'static', label: 'Static', icon: Server, desc: 'HTML/CSS/JS files' },
                                { value: 'proxy', label: 'Proxy', icon: ArrowUpDown, desc: 'Reverse proxy' },
                                { value: 'php', label: 'PHP', icon: Code, desc: 'PHP application' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setType(option.value as HostType)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${type === option.value
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <option.icon size={20} className="mb-2" />
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs opacity-70">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Domain */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Domain Name</label>
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="example.com"
                            required
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Port */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Listen Port</label>
                        <input
                            type="number"
                            value={port}
                            onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                            min={1}
                            max={65535}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Conditional: Root or Proxy Pass */}
                    {type === 'proxy' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Proxy Pass URL</label>
                            <input
                                type="url"
                                value={proxyPass}
                                onChange={(e) => setProxyPass(e.target.value)}
                                placeholder="http://localhost:3000"
                                required
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <p className="text-xs text-zinc-500">
                                The backend URL to proxy requests to
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Document Root</label>
                            <input
                                type="text"
                                value={root}
                                onChange={(e) => setRoot(e.target.value)}
                                placeholder="/var/www/html"
                                required
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <p className="text-xs text-zinc-500">
                                Path to the website files on the server
                            </p>
                        </div>
                    )}

                    {/* Advanced Settings */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-medium text-zinc-400">Advanced Settings</h3>

                        {/* Gzip */}
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm text-zinc-300">Enable Gzip</div>
                                <div className="text-xs text-zinc-500">Compress responses for faster loading</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setGzip(!gzip)}
                                className={`w-11 h-6 rounded-full transition-colors ${gzip ? 'bg-emerald-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${gzip ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </label>

                        {/* Rate Limiting */}
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm text-zinc-300">Rate Limiting</div>
                                <div className="text-xs text-zinc-500">Limit requests per second</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRateLimit(!rateLimit)}
                                className={`w-11 h-6 rounded-full transition-colors ${rateLimit ? 'bg-emerald-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${rateLimit ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </label>

                        {rateLimit && (
                            <div className="ml-4 space-y-2">
                                <label className="text-xs text-zinc-400">Requests per second</label>
                                <input
                                    type="number"
                                    value={rateLimitRate}
                                    onChange={(e) => setRateLimitRate(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={1000}
                                    className="w-24 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !domain}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded font-medium text-sm transition-colors"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Create Host
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHostDialog;
