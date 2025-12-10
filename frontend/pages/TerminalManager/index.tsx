import React from 'react';
import { PageHeader, WebTerminal } from '../../components';
import { TerminalSquare, Plus } from 'lucide-react';

const TerminalManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <PageHeader
        title="Terminal"
        icon={TerminalSquare}
        description="Server shell access and command execution."
        actions={
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
              <Plus size={16} />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-[500px]">
        <WebTerminal />
      </div>
    </div>
  );
};

export default TerminalManager;
