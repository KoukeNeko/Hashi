import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const AUTO_CLOSE_DELAY_MS = 4000;

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    autoClose?: boolean;
    position?: 'fixed' | 'relative';
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type,
    onClose,
    autoClose = true,
    position = 'fixed',
}) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, AUTO_CLOSE_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [onClose, autoClose]);

    const positionClasses = position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : '';

    const typeClasses =
        type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-500/20 border-rose-500/50 text-rose-300';

    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
        <div
            className={`${positionClasses} flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-fade-in ${typeClasses}`}
        >
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <X size={16} />
            </button>
        </div>
    );
};
