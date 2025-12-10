import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

// ==================== Base Dialog ====================
interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    titleColor?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    titleIcon,
    titleColor = 'text-zinc-100',
    children,
    maxWidth = 'max-w-md'
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`bg-surface border border-border rounded-lg shadow-2xl w-full ${maxWidth} mx-4`}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${titleColor}`}>
                        {titleIcon}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// ==================== Dialog Body ====================
interface DialogBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const DialogBody: React.FC<DialogBodyProps> = ({ children, className = '' }) => (
    <div className={`p-4 space-y-4 ${className}`}>
        {children}
    </div>
);

// ==================== Dialog Footer ====================
interface DialogFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className = '' }) => (
    <div className={`flex justify-end gap-3 px-4 py-3 border-t border-border ${className}`}>
        {children}
    </div>
);

// ==================== Confirm Dialog ====================
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    confirmColor?: 'red' | 'amber' | 'emerald';
    confirmIcon?: React.ReactNode;
    children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmColor = 'red',
    confirmIcon,
    children
}) => {
    const colorClasses = {
        red: 'bg-rose-600 hover:bg-rose-500',
        amber: 'bg-amber-600 hover:bg-amber-500',
        emerald: 'bg-emerald-600 hover:bg-emerald-500'
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<AlertCircle size={20} />}
            titleColor="text-rose-400"
        >
            <DialogBody>
                <p className="text-sm text-zinc-300">{message}</p>
                {children}
                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex items-center gap-2 ${colorClasses[confirmColor]} text-white px-4 py-2 rounded text-sm font-medium transition-colors`}
                    >
                        {confirmIcon}
                        {confirmText}
                    </button>
                </DialogFooter>
            </DialogBody>
        </Dialog>
    );
};
