
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SystemOverview from './pages/SystemOverview';
import DockerManager from './pages/DockerManager';
import KvmManager from './pages/KvmManager';
import FirewallManager from './pages/FirewallManager';
import ServiceManager from './pages/ServiceManager';
import NginxManager from './pages/NginxManager';
import FileManager from './pages/FileManager';
import DatabaseManager from './pages/DatabaseManager';
import CronManager from './pages/CronManager';
import WafManager from './pages/WafManager';
import LogManager from './pages/LogManager';
import Login from './pages/Login';
import { TabView } from './types';
import { TerminalSquare, Menu, Command, Construction } from 'lucide-react';

// Placeholder for items not yet fully implemented
const ConstructionView: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500 space-y-4 animate-fade-in">
    <div className="p-6 bg-zinc-900 rounded-full shadow-inner">
      <Construction size={48} className="text-emerald-500/50" />
    </div>
    <h2 className="text-xl font-bold text-zinc-300">{title}</h2>
    <p className="text-sm">This module is currently under development.</p>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab(TabView.DASHBOARD);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case TabView.DASHBOARD:
        return <SystemOverview />;
      case TabView.WEBSITE:
        return <NginxManager />;
      case TabView.DOCKER:
        return <DockerManager />;
      case TabView.DATABASES:
        return <DatabaseManager />;
      case TabView.FILES:
        return <FileManager />;
      case TabView.SECURITY:
        return <FirewallManager />;
      case TabView.WAF:
        return <WafManager />;
      case TabView.MONITOR:
        return <ConstructionView title="Network Monitor" />;
      case TabView.KVM:
        return <KvmManager />;
      case TabView.SERVICES:
        return <ServiceManager />;
      case TabView.CRON:
        return <CronManager />;
      case TabView.LOGS:
        return <LogManager />;
      case TabView.FTP:
        return <ConstructionView title="FTP Server" />;
      case TabView.MAIL:
        return <ConstructionView title="Mail Server" />;
      case TabView.TERMINAL:
        return (
          <div className="h-full flex flex-col bg-black border border-zinc-800 rounded-lg overflow-hidden font-mono text-sm shadow-2xl">
            <div className="bg-zinc-800 px-4 py-2 flex items-center gap-2 text-zinc-400 border-b border-zinc-700">
              <TerminalSquare size={14} /> root@hashi-node-01:~
            </div>
            <div className="flex-1 p-4 text-emerald-500 overflow-y-auto">
              <p className="mb-2"><span className="text-purple-400">root@hashi-node-01</span>:<span className="text-zinc-400">~</span>$ uptime</p>
              <p className="text-zinc-300 mb-4"> 14:02:44 up 14 days,  3:22,  1 user,  load average: 1.24, 0.98, 0.85</p>

              <p className="mb-2"><span className="text-purple-400">root@hashi-node-01</span>:<span className="text-zinc-400">~</span>$ {'docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}" '}</p>
              <p className="text-zinc-300 whitespace-pre-wrap">
                CONTAINER ID   IMAGE             STATUS
                a1b2c3d4       nginx:latest      Up 4 days
                e5f6g7h8       postgres:15       Up 12 days
                i9j0k1l2       redis:7           Up 12 days
              </p>

              <p className="mt-4 mb-2"><span className="text-purple-400">root@hashi-node-01</span>:<span className="text-zinc-400">~</span>$ <span className="animate-pulse">_</span></p>
            </div>
          </div>
        );
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-zinc-300 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded flex items-center justify-center text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Command size={14} className="text-zinc-900" strokeWidth={3} />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">HASHI</span>
            </div>
          </div>
        </div>

        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
