import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  actions?: ReactNode;
  iconColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  icon: Icon, 
  description, 
  actions,
  iconColor = "text-emerald-500"
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
          {Icon && <Icon className={`${iconColor}`} size={32} strokeWidth={2.5} />}
          {title}
        </h2>
        {description && (
          <div className="text-zinc-400 text-sm mt-2 font-medium pl-1">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
