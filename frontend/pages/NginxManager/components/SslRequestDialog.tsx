import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Globe } from 'lucide-react';
import { NginxApiService } from '../../../services/api';
import { NginxHostDTO } from '../../../types';
import { Dialog, DialogBody, DialogFooter } from '../../../components/ui/Dialog';
import { FormInput, FormError, ActionButton } from '../../../components/ui/Form';

interface SslRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    hosts: NginxHostDTO[];
}

const SslRequestDialog: React.FC<SslRequestDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    hosts,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [domain, setDomain] = useState('');
    const [email, setEmail] = useState('');
    const [provider] = useState<'certbot'>('certbot'); // Future: support acme.sh or custom upload

    const handleClose = () => {
        setDomain('');
        setEmail('');
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await NginxApiService.requestCertbotCert(domain, email);
            handleClose();
            onSuccess();
        } catch (err: unknown) {
            console.error('Failed to request SSL:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to request SSL certificate';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter hosts that don't have SSL enabled? No, users might want to renew or switch.
    // Ideally we should list all domains.

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Request SSL Certificate"
            titleIcon={<ShieldCheck size={20} className="text-emerald-500" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    {error && <FormError message={error} />}

                    <div className="bg-zinc-800/50 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm text-zinc-400">
                        <Lock size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                        <p>
                            Get a free HTTPS certificate from Let's Encrypt using Certbot. The
                            certificate will be automatically installed and renewed.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-400">
                                Domain Name
                            </label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <select
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                                    required
                                >
                                    <option value="" disabled>
                                        Select a domain
                                    </option>
                                    {hosts.map((host) => (
                                        <option key={host.name} value={host.domain}>
                                            {host.domain}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <FormInput
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="admin@example.com"
                            hint="Used for urgent renewal and security notices"
                            icon={<Mail size={16} />}
                            required
                        />
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
                        icon={<Lock size={16} />}
                        disabled={!domain || !email}
                    >
                        Request Certificate
                    </ActionButton>
                </DialogFooter>
            </form>
        </Dialog>
    );
};

export default SslRequestDialog;
