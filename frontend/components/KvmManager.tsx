import React from 'react';
import { VmStatus } from '../types';
import { MOCK_VMS } from '../constants';
import { PageHeader } from './PageHeader';
import { Monitor, Power, RotateCcw, HardDrive, Cpu, Network, Terminal } from 'lucide-react';

const KvmManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <PageHeader 
         title="KVM Virtualization" 
         icon={Monitor} 
         description="Manage virtual machines, storage pools, and networks."
         actions={
            <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-lg">
                Create VM
            </button>
         }
       />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_VMS.map((vm) => (
          <div key={vm.id} className="bg-surface border border-border rounded-lg p-5 hover:border-zinc-600 transition-colors relative overflow-hidden group shadow-lg">
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 w-1 h-full ${
                vm.status === VmStatus.RUNNING ? 'bg-emerald-500' :
                vm.status === VmStatus.SHUTOFF ? 'bg-rose-500' :
                'bg-amber-500'
            }`}></div>

            <div className="flex justify-between items-start mb-4 pl-3">
                <div>
                    <h3 className="font-bold text-lg text-zinc-100">{vm.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                             vm.status === VmStatus.RUNNING ? 'bg-emerald-500' :
                             vm.status === VmStatus.SHUTOFF ? 'bg-rose-500' :
                             'bg-amber-500'
                        }`}></span>
                        <span className="text-xs uppercase text-zinc-400 tracking-wide font-mono">{vm.status}</span>
                    </div>
                </div>
                <div className="text-zinc-500 text-xs font-mono border border-border rounded px-2 py-1 bg-zinc-900">
                    {vm.id}
                </div>
            </div>

            <div className="space-y-3 pl-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Cpu size={14} /> <span>vCPU</span>
                    </div>
                    <span className="text-zinc-200 font-mono">{vm.vcpu} Cores</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <HardDrive size={14} /> <span>RAM / Disk</span>
                    </div>
                    <span className="text-zinc-200 font-mono">{vm.memory}GB / {vm.disk}GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                         <Network size={14} /> <span>IP Address</span>
                    </div>
                    <span className="text-zinc-200 font-mono">{vm.ip}</span>
                </div>
            </div>

            <div className="mt-6 pl-3 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs text-zinc-500">{vm.os}</span>
                <div className="flex gap-2">
                    <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors" title="Console">
                        <Terminal size={16} />
                    </button>
                    <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors" title="Reboot">
                        <RotateCcw size={16} />
                    </button>
                    <button className={`p-2 rounded transition-colors text-white ${vm.status === VmStatus.RUNNING ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        <Power size={16} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KvmManager;
