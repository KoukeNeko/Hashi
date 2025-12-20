import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Box,
    Monitor,
    TerminalSquare,
    Settings,
    LogOut,
    Command,
    Shield,
    Settings2,
    Globe,
    X,
    Database,
    FileText,
    Clock,
    ScrollText,
    Lock,
    Server,
    Network,
    User,
    Users,
    Package,
    HardDrive,
} from 'lucide-react';
import { TabView, UserInfo } from '../types';
import { UpdateService } from '../services/api';

interface SidebarProps {
    currentTab: TabView;
    onTabChange: (tab: TabView) => void;
    isOpen: boolean;
    onClose: () => void;
    onLogout?: () => void;
    user?: UserInfo | null;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentTab,
    onTabChange,
    isOpen,
    onClose,
    onLogout,
    user,
}) => {
    const [version, setVersion] = useState<string>('...');

    useEffect(() => {
        UpdateService.getUpdateInfo()
            .then((info) => setVersion(`v${info.currentVersion}`))
            .catch(() => setVersion('dev'));
    }, []);

    const navGroups = [
        {
            label: 'General',
            items: [{ id: TabView.DASHBOARD, label: 'Overview', icon: LayoutDashboard }],
        },
        {
            label: 'Application',
            items: [
                { id: TabView.WEBSITE, label: 'Website', icon: Globe },
                { id: TabView.DOCKER, label: 'Docker', icon: Box },
            ],
        },
        {
            label: 'Data',
            items: [
                { id: TabView.DATABASES, label: 'Databases', icon: Database },
                { id: TabView.FILES, label: 'Files', icon: FileText },
                { id: TabView.FTP, label: 'FTP', icon: Server },
            ],
        },
        {
            label: 'Security',
            items: [
                { id: TabView.SECURITY, label: 'Firewall', icon: Shield },
                { id: TabView.WAF, label: 'WAF', icon: Lock },
                { id: TabView.USERS, label: 'Users', icon: Users },
            ],
        },
        {
            label: 'System',
            items: [
                { id: TabView.MONITOR, label: 'Monitor', icon: Network },
                { id: TabView.NETWORK, label: 'Network', icon: Network },
                { id: TabView.DISKS, label: 'Disks', icon: HardDrive },
                { id: TabView.STORAGE, label: 'Storage', icon: Database },
                { id: TabView.KVM, label: 'Virt Manager', icon: Monitor },
                { id: TabView.SERVICES, label: 'Services', icon: Settings2 },
                { id: TabView.CRON, label: 'Cron', icon: Clock },
                { id: TabView.PACKAGES, label: 'Packages', icon: Package },
                { id: TabView.LOGS, label: 'Logs', icon: ScrollText },
                { id: TabView.TERMINAL, label: 'Terminal', icon: TerminalSquare },
            ],
        },
    ];

    const handleNavClick = (id: TabView) => {
        onTabChange(id);
        onClose(); // Close sidebar on mobile when clicked
    };

    return (
        <>
            <aside
                className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col h-full 
            transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
            >
                <div className="p-6 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <Command size={20} className="text-zinc-900" strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">HASHI</span>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="mb-6 last:mb-0">
                            <h3 className="px-4 text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">
                                {group.label}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                                                }`}
                                        >
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-border/50 space-y-2">
                    {/* 使用者資訊 */}
                    {user && (
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 rounded-lg mb-2">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <User size={16} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-200 truncate">
                                    {user.username}
                                </p>
                                <p className="text-xs text-zinc-500">UID: {user.uid}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => handleNavClick(TabView.SETTINGS)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentTab === TabView.SETTINGS
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                            }`}
                    >
                        <Settings size={18} /> Settings
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-900/70 hover:text-rose-500 hover:bg-rose-900/10 transition-colors"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                <div className="p-4 text-xs text-center text-zinc-600 font-mono">{version}</div>
            </aside>
        </>
    );
};

export default Sidebar;
