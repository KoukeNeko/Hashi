import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    colorClass?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subValue,
    icon: Icon,
    colorClass = 'text-emerald-500',
    trend,
}) => {
    return (
        <div className="bg-surface border border-border p-6 rounded-lg shadow-lg hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-400 font-medium text-sm uppercase tracking-wider">
                    {title}
                </h3>
                <div className={`p-2 rounded-md bg-zinc-800 ${colorClass}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold text-zinc-100">{value}</span>
                {subValue && <span className="text-zinc-500 text-sm mb-1">{subValue}</span>}
            </div>
            {trend && (
                <div
                    className={`mt-2 text-xs font-mono flex items-center ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-zinc-500'}`}
                >
                    {trend === 'up'
                        ? '↑ Increasing'
                        : trend === 'down'
                          ? '↓ Decreasing'
                          : '→ Stable'}
                </div>
            )}
        </div>
    );
};
