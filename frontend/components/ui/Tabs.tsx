import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: any) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <div className={`flex space-x-1 p-1 bg-zinc-900/50 w-full sm:w-fit rounded-lg border border-zinc-800/50 overflow-x-auto ${className}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap
              ${isActive
                ? 'bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }
            `}
          >
            {Icon && <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
