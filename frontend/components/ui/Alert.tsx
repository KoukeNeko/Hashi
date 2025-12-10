import React from 'react';
import { LucideIcon, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

// ==================== Alert Types ====================

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
    /** Alert 類型 */
    variant: AlertVariant;
    /** 自訂 icon (可選，會根據 variant 自動選擇) */
    icon?: LucideIcon;
    /** 標題 (可選) */
    title?: string;
    /** 內容 */
    children: React.ReactNode;
    /** 額外 className */
    className?: string;
}

// ==================== Variant Styles ====================

const VARIANT_STYLES: Record<AlertVariant, { bg: string; border: string; text: string; icon: LucideIcon }> = {
    error: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-200',
        icon: AlertCircle
    },
    warning: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-200',
        icon: AlertTriangle
    },
    info: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-200',
        icon: Info
    },
    success: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-200',
        icon: CheckCircle
    }
};

// ==================== Alert Component ====================

export const Alert: React.FC<AlertProps> = ({
    variant,
    icon,
    title,
    children,
    className = ''
}) => {
    const styles = VARIANT_STYLES[variant];
    const IconComponent = icon || styles.icon;

    return (
        <div className={`flex items-start gap-3 p-4 ${styles.bg} border ${styles.border} rounded-lg ${styles.text} ${className}`}>
            <IconComponent size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">
                {title && <strong>{title}</strong>}
                {title && ' '}
                {children}
            </div>
        </div>
    );
};
