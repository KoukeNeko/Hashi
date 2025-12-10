import React, { useState } from 'react';
import { Globe, Server, ArrowUpDown, Code, Plus } from 'lucide-react';
import { NginxApiService } from '../../../services/api';
import { CreateNginxHostRequest, NginxHostType } from '../../../types';
import { Dialog, DialogBody, DialogFooter } from '../../../components/ui/Dialog';
import { FormInput, FormError, ActionButton } from '../../../components/ui/Form';

interface AddHostDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface HostTypeOption {
    value: NginxHostType;
    label: string;
    icon: React.ElementType;
    description: string;
}

const HOST_TYPE_OPTIONS: HostTypeOption[] = [
    { value: 'static', label: 'Static', icon: Server, description: 'HTML/CSS/JS files' },
    { value: 'proxy', label: 'Proxy', icon: ArrowUpDown, description: 'Reverse proxy' },
    { value: 'php', label: 'PHP', icon: Code, description: 'PHP application' },
];

const DEFAULT_PORT = 80;
const DEFAULT_ROOT = '/var/www/html';
const DEFAULT_PROXY_PASS = 'http://localhost:3000';
const DEFAULT_RATE_LIMIT = 10;

const AddHostDialog: React.FC<AddHostDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [domain, setDomain] = useState('');
    const [type, setType] = useState<NginxHostType>('static');
    const [port, setPort] = useState(DEFAULT_PORT);
    const [root, setRoot] = useState(DEFAULT_ROOT);
    const [proxyPass, setProxyPass] = useState(DEFAULT_PROXY_PASS);
    const [gzip, setGzip] = useState(true);
    const [rateLimit, setRateLimit] = useState(false);
    const [rateLimitRate, setRateLimitRate] = useState(DEFAULT_RATE_LIMIT);

    const resetForm = () => {
        setDomain('');
        setType('static');
        setPort(DEFAULT_PORT);
        setRoot(DEFAULT_ROOT);
        setProxyPass(DEFAULT_PROXY_PASS);
        setGzip(true);
        setRateLimit(false);
        setRateLimitRate(DEFAULT_RATE_LIMIT);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

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
        } catch (err: unknown) {
            console.error('Failed to create host:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create virtual host';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Virtual Host"
            titleIcon={<Globe size={20} className="text-emerald-500" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    {error && <FormError message={error} />}

                    {/* Host Type Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-400">Host Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {HOST_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setType(option.value)}
                                    className={`p-3 rounded-lg border text-left transition-colors ${type === option.value
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <option.icon size={20} className="mb-2" />
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs opacity-70">{option.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Domain */}
                    <FormInput
                        label="Domain Name"
                        value={domain}
                        onChange={setDomain}
                        placeholder="example.com"
                        required
                    />

                    {/* Port */}
                    <FormInput
                        label="Listen Port"
                        type="number"
                        value={String(port)}
                        onChange={(v) => setPort(parseInt(v) || DEFAULT_PORT)}
                    />

                    {/* Conditional: Root or Proxy Pass */}
                    {type === 'proxy' ? (
                        <FormInput
                            label="Proxy Pass URL"
                            type="url"
                            value={proxyPass}
                            onChange={setProxyPass}
                            placeholder="http://localhost:3000"
                            hint="The backend URL to proxy requests to"
                            required
                        />
                    ) : (
                        <FormInput
                            label="Document Root"
                            value={root}
                            onChange={setRoot}
                            placeholder="/var/www/html"
                            hint="Path to the website files on the server"
                            required
                        />
                    )}

                    {/* Advanced Settings */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-medium text-zinc-400">Advanced Settings</h3>

                        {/* Gzip Toggle */}
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm text-zinc-300">Enable Gzip</div>
                                <div className="text-xs text-zinc-500">Compress responses for faster loading</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setGzip(!gzip)}
                                className={`w-11 h-6 rounded-full transition-colors ${gzip ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${gzip ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </label>

                        {/* Rate Limiting Toggle */}
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm text-zinc-300">Rate Limiting</div>
                                <div className="text-xs text-zinc-500">Limit requests per second</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRateLimit(!rateLimit)}
                                className={`w-11 h-6 rounded-full transition-colors ${rateLimit ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${rateLimit ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </label>

                        {rateLimit && (
                            <div className="ml-4">
                                <FormInput
                                    label="Requests per second"
                                    type="number"
                                    value={String(rateLimitRate)}
                                    onChange={(v) => setRateLimitRate(parseInt(v) || DEFAULT_RATE_LIMIT)}
                                    className="w-32"
                                />
                            </div>
                        )}
                    </div>
                </DialogBody>

                <DialogFooter>
                    <ActionButton variant="ghost" onClick={handleClose} disabled={loading}>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        icon={<Plus size={16} />}
                        disabled={!domain}
                    >
                        Create Host
                    </ActionButton>
                </DialogFooter>
            </form>
        </Dialog>
    );
};

export default AddHostDialog;
