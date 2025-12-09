import React, { useState, useEffect } from 'react';
import { ContainerDTO } from '../../types';
import { MOCK_IMAGES, MOCK_NETWORKS, MOCK_VOLUMES } from '../../constants';
import { PageHeader } from '../../components/PageHeader';
import { Tabs } from '../../components/Tabs';
import { DockerService } from '../../services/api';
import { Box, Play, Square, RefreshCw, Activity, Layers, Network, Database, Search, Plus, Trash2 } from 'lucide-react';

type DockerTab = 'containers' | 'images' | 'networks' | 'volumes';

const DockerManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DockerTab>('containers');
  const [containers, setContainers] = useState<ContainerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch containers from API
  const fetchContainers = async () => {
    try {
      const data = await DockerService.getContainers();
      setContainers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch containers:', err);
      setError('Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  // Container actions
  const handleStartContainer = async (id: string) => {
    setActionLoading(id);
    try {
      await DockerService.startContainer(id);
      await fetchContainers();
    } catch (err) {
      console.error('Failed to start container:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopContainer = async (id: string) => {
    setActionLoading(id);
    try {
      await DockerService.stopContainer(id);
      await fetchContainers();
    } catch (err) {
      console.error('Failed to stop container:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestartContainer = async (id: string) => {
    setActionLoading(id);
    try {
      await DockerService.restartContainer(id);
      await fetchContainers();
    } catch (err) {
      console.error('Failed to restart container:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchContainers();
    
    const interval = setInterval(() => {
      fetchContainers();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'exited': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'paused': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'restarting': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const tabs = [
    { id: 'containers', label: 'Containers', icon: Box },
    { id: 'images', label: 'Images', icon: Layers },
    { id: 'networks', label: 'Networks', icon: Network },
    { id: 'volumes', label: 'Volumes', icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Docker Management"
        icon={Box}
        description="Container orchestration and resource management."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search resources..."
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-64 transition-colors shadow-lg"
              />
            </div>
            <button 
              onClick={fetchContainers}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 whitespace-nowrap">
              <Plus size={16} />
              <span className="hidden sm:inline">
                {activeTab === 'containers' ? 'Add Container' :
                  activeTab === 'images' ? 'Pull Image' :
                    activeTab === 'networks' ? 'Add Network' : 'Add Volume'}
              </span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        }
      />

      <Tabs
        items={tabs}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as DockerTab)}
      />

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
        {activeTab === 'containers' && (
          <div>
            {/* Error message */}
            {error && (
              <div className="px-4 py-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500 font-medium">
              <div className="col-span-1">State</div>
              <div className="col-span-3">Name / ID</div>
              <div className="col-span-3">Image</div>
              <div className="col-span-2">Ports</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Loading state */}
            {loading && containers.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                Loading containers...
              </div>
            )}

            {/* Empty state */}
            {!loading && containers.length === 0 && !error && (
              <div className="p-8 text-center text-zinc-500">
                No containers found
              </div>
            )}

            <div className="divide-y divide-border">
              {containers.map((container) => (
                <div key={container.id} className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 p-4 hover:bg-zinc-800/50 transition-colors items-center group">

                  {/* Mobile Row 1: State & Actions */}
                  <div className="col-span-1 lg:col-span-1 order-1 flex items-center">
                    <span className={`px-2 py-1 rounded border text-xs font-mono font-bold ${getStateColor(container.state)}`}>
                      {container.state}
                    </span>
                  </div>

                  <div className="col-span-1 lg:col-span-1 lg:order-6 order-2 flex justify-end">
                    <div className="flex gap-1 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                      {actionLoading === container.id ? (
                        <RefreshCw className="animate-spin text-zinc-400" size={16} />
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartContainer(container.id)}
                            className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition-colors disabled:opacity-50" 
                            title="Start"
                            disabled={container.state === 'running'}
                          >
                            <Play size={16} />
                          </button>
                          <button 
                            onClick={() => handleRestartContainer(container.id)}
                            className="p-1.5 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors" 
                            title="Restart"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button 
                            onClick={() => handleStopContainer(container.id)}
                            className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors disabled:opacity-50" 
                            title="Stop"
                            disabled={container.state !== 'running'}
                          >
                            <Square size={16} />
                          </button>
                          <button className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors" title="Logs">
                            <Activity size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile Row 2: Name & Image */}
                  <div className="col-span-2 lg:col-span-3 lg:order-2 order-3">
                    <div className="font-bold text-zinc-200">{container.name}</div>
                    <div className="text-zinc-500 text-xs font-mono">{container.id}</div>
                  </div>

                  <div className="col-span-2 lg:col-span-3 lg:order-3 order-4">
                    <span className="lg:hidden text-zinc-500 text-[10px] uppercase mr-2">Image:</span>
                    <span className="text-zinc-300 font-mono text-xs break-all">{container.image}</span>
                  </div>

                  {/* Mobile Row 3: Ports & Status */}
                  <div className="col-span-1 lg:col-span-2 lg:order-4 order-5">
                    <div className="text-zinc-500 text-[10px] uppercase lg:hidden mb-1">Ports</div>
                    <div className="text-zinc-400 text-xs font-mono">{container.portMapping || '-'}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 lg:order-5 order-6">
                    <div className="text-zinc-500 text-[10px] uppercase lg:hidden mb-1">Status</div>
                    <div className="text-zinc-400 text-xs">{container.status}</div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div>
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500 font-medium">
              <div className="col-span-2">ID</div>
              <div className="col-span-4">Repository</div>
              <div className="col-span-2">Tag</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border">
              {MOCK_IMAGES.map((img) => (
                <div key={img.id} className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 p-4 hover:bg-zinc-800/50 transition-colors items-center">

                  <div className="col-span-2 lg:col-span-2 lg:order-1 order-3">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase mb-0.5">ID</div>
                    <div className="font-mono text-xs text-zinc-500 truncate" title={img.id}>{img.id}</div>
                  </div>

                  <div className="col-span-2 lg:col-span-4 lg:order-2 order-1">
                    <div className="text-zinc-200 font-bold">{img.repository}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 lg:order-3 order-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700">{img.tag}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-1 lg:order-4 order-5 text-right lg:text-left">
                    <div className="text-zinc-400 text-sm">{img.size}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 lg:order-5 order-6">
                    <div className="text-zinc-500 text-xs">{img.created}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-1 lg:order-6 order-2 text-right">
                    <button className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors" title="Delete Image">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'networks' && (
          <div>
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500 font-medium">
              <div className="col-span-3">Network Name</div>
              <div className="col-span-2">Driver</div>
              <div className="col-span-3">Subnet</div>
              <div className="col-span-3">Gateway</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border">
              {MOCK_NETWORKS.map((net) => (
                <div key={net.id} className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 p-4 hover:bg-zinc-800/50 transition-colors items-center">
                  <div className="col-span-2 lg:col-span-3">
                    <div className="text-zinc-200 font-bold">{net.name}</div>
                    <div className="lg:hidden text-zinc-500 text-xs font-mono">{net.id}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Driver</div>
                    <div className="text-zinc-400 font-mono text-xs">{net.driver}</div>
                  </div>

                  <div className="col-span-2 lg:col-span-3">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Subnet</div>
                    <div className="text-zinc-400 font-mono text-xs">{net.subnet}</div>
                  </div>

                  <div className="col-span-2 lg:col-span-3">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Gateway</div>
                    <div className="text-zinc-400 font-mono text-xs">{net.gateway}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-1 text-right absolute top-4 right-4 lg:static">
                    <button className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors" title="Remove Network">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'volumes' && (
          <div>
            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500 font-medium">
              <div className="col-span-3">Volume Name</div>
              <div className="col-span-2">Driver</div>
              <div className="col-span-4">Mount Point</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border">
              {MOCK_VOLUMES.map((vol) => (
                <div key={vol.name} className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4 p-4 hover:bg-zinc-800/50 transition-colors items-center relative">
                  <div className="col-span-2 lg:col-span-3">
                    <div className="text-zinc-200 font-bold">{vol.name}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Driver</div>
                    <div className="text-zinc-400 font-mono text-xs">{vol.driver}</div>
                  </div>

                  <div className="col-span-2 lg:col-span-4">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Mount Point</div>
                    <div className="text-zinc-400 font-mono text-xs truncate" title={vol.mountpoint}>{vol.mountpoint}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-2">
                    <div className="lg:hidden text-zinc-500 text-[10px] uppercase">Created</div>
                    <div className="text-zinc-400 text-sm">{vol.created}</div>
                  </div>

                  <div className="col-span-1 lg:col-span-1 text-right absolute top-4 right-4 lg:static">
                    <button className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors" title="Remove Volume">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DockerManager;
