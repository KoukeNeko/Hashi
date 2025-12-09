import React from 'react';
import { ResponsiveContainer, PieChart, Pie } from 'recharts';
import { ChevronRight, LucideIcon } from 'lucide-react';

// ==================== Circular Gauge ====================
export const CircularGauge = ({ value, label, subLabel, color = "#10b981" }: { value: number, label: string, subLabel: string, color?: string }) => {
    // Two layers: Track (gray) and Progress (colored)
    // We use a simple calculation for endAngle to represent percentage
    const startAngle = 90;
    const endAngle = 90 - (360 * value) / 100;

    const data = [
        { name: 'Value', value: value },
    ];

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-[140px] h-[140px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        {/* Track Circle */}
                        <Pie
                            data={[{ value: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={66}
                            startAngle={90}
                            endAngle={-270}
                            fill="#27272a"
                            stroke="none"
                            dataKey="value"
                            isAnimationActive={false}
                        />
                        {/* Progress Circle */}
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={66}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={color}
                            stroke="none"
                            dataKey="value"
                            cornerRadius={10}
                            paddingAngle={0}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-white tracking-tight">{Math.round(value)}%</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <h3 className="text-zinc-200 font-bold text-sm">{label}</h3>
                <p className="text-zinc-500 text-xs mt-1 font-medium uppercase tracking-wide">{subLabel}</p>
            </div>
        </div>
    );
};

// ==================== Quick Stat ====================
export const QuickStat = ({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: LucideIcon, colorClass: string }) => (
    <div className="flex-1 bg-surface border border-border p-5 rounded-lg flex justify-between items-center group hover:border-zinc-600 transition-colors cursor-pointer">
        <div>
            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
            <Icon size={24} strokeWidth={2} />
        </div>
        <ChevronRight className="text-zinc-700 group-hover:text-zinc-400 transition-colors absolute top-5 right-5" size={16} />
    </div>
);

// ==================== Software Card ====================
export const SoftwareCard = ({ name, version, status, icon: Icon, colorClass }: { name: string, version: string, status: boolean, icon: LucideIcon, colorClass: string }) => (
    <div className="bg-zinc-900 border border-border p-4 rounded-lg flex flex-col items-center justify-center gap-3 relative group hover:border-zinc-700 transition-all">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 mb-1`}>
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <div className="text-center">
            <h4 className="text-zinc-200 font-bold text-sm">{name}</h4>
            <span className="text-zinc-500 text-xs font-mono">{version}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 bg-zinc-950 px-2 py-1 rounded-full border border-zinc-800">
            <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${status ? 'text-emerald-500' : 'text-rose-500'}`}>{status ? 'Running' : 'Stopped'}</span>
        </div>
    </div>
);
