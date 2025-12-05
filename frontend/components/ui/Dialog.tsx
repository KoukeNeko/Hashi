import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

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
    // ESC 鍵關閉
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
    <div className={`flex justify-end gap-3 pt-2 ${className}`}>
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
    children?: React.ReactNode; // 額外內容（如 checkbox）
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

// ==================== Form Input ====================
interface FormInputProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    hint,
    error,
    disabled,
    className = ''
}) => (
    <div className={className}>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
            {label} {required && '*'}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
);

// ==================== Form Select ====================
interface FormSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    value,
    onChange,
    options,
    required,
    disabled,
    className = ''
}) => (
    <div className={className}>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
            {label} {required && '*'}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// ==================== Form Checkbox ====================
interface FormCheckboxProps {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    color?: 'emerald' | 'rose' | 'amber';
    className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
    id,
    label,
    checked,
    onChange,
    disabled,
    color = 'emerald',
    className = ''
}) => {
    const colorClasses = {
        emerald: 'text-emerald-600 focus:ring-emerald-500',
        rose: 'text-rose-600 focus:ring-rose-500',
        amber: 'text-amber-600 focus:ring-amber-500'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className={`w-4 h-4 rounded border-zinc-700 bg-zinc-800 ${colorClasses[color]}`}
            />
            <label htmlFor={id} className="text-sm text-zinc-400 cursor-pointer select-none">
                {label}
            </label>
        </div>
    );
};

// ==================== Form Error ====================
interface FormErrorProps {
    message: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message }) => (
    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded flex items-center gap-2">
        <AlertCircle size={16} />
        {message}
    </div>
);

// ==================== Toast ====================
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
    position = 'fixed'
}) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [onClose, autoClose]);

    const positionClasses = position === 'fixed' 
        ? 'fixed bottom-4 right-4 z-50' 
        : '';

    return (
        <div className={`${positionClasses} flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-fade-in ${
            type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
        }`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
    );
};

// ==================== Action Button ====================
interface ActionButtonProps {
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
    size?: 'sm' | 'md';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    loadingIcon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled,
    loading,
    icon,
    loadingIcon,
    children,
    className = ''
}) => {
    const variantClasses = {
        primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white',
        warning: 'bg-amber-600 hover:bg-amber-500 text-white',
        ghost: 'text-zinc-400 hover:text-white'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center gap-2 rounded font-medium transition-colors disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {loading ? loadingIcon : icon}
            {children}
        </button>
    );
};
