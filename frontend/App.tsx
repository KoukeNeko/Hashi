import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SystemOverview from './pages/SystemOverview/index';
import DockerManager from './pages/DockerManager/index';
import KvmManager from './pages/KvmManager/index';
import FirewallManager from './pages/FirewallManager/index';
import ServiceManager from './pages/ServiceManager/index';
import NginxManager from './pages/NginxManager/index';
import FileManager from './pages/FileManager/index';
import DatabaseManager from './pages/DatabaseManager/index';
import CronManager from './pages/CronManager/index';
import WafManager from './pages/WafManager/index';
import LogManager from './pages/LogManager/index';
import TerminalManager from './pages/TerminalManager/index';
import FtpManager from './pages/FtpManager/index';
import UserManager from './pages/UserManager/index';
import DiskManager from './pages/DiskManager/index';
import StorageManager from './pages/StorageManager/index';
import NetworkManager from './pages/NetworkManager/index';
import SettingsPage from './pages/Settings/index';
import Login from './pages/Login/index';
import PackageManager from './pages/PackageManager/index';
import K8sManager from './pages/K8sManager/index';
import { PlatformFeatures, TabView, UserInfo } from './types';
import { AuthService, PlatformService, SessionStorage } from './services/api';
import { Menu, Command, Construction, Loader2 } from 'lucide-react';

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
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState<TabView>(TabView.DASHBOARD);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [platformFeatures, setPlatformFeatures] = useState<PlatformFeatures | null>(null);

    // 頁面載入時檢查 localStorage 中的登入狀態
    useEffect(() => {
        const checkSession = async () => {
            const storedUser = SessionStorage.getUser();
            if (storedUser) {
                try {
                    // 驗證使用者是否仍然有效
                    const response = await AuthService.validateSession(storedUser.username);
                    if (response.success && response.user) {
                        setUser(response.user);
                    } else {
                        // Session 無效，清除 localStorage
                        SessionStorage.clearUser();
                    }
                } catch (error) {
                    console.error('Session validation failed:', error);
                    // 如果後端無法連接，暫時保留登入狀態
                    setUser(storedUser);
                }
            }

            try {
                const features = await PlatformService.getFeatures();
                setPlatformFeatures(features);
            } catch (error) {
                console.error('Failed to load platform features:', error);
                setPlatformFeatures(null);
            }
            setIsLoading(false);
        };

        checkSession();
    }, []);

    const handleLogin = (loggedInUser: UserInfo) => {
        setUser(loggedInUser);
    };

    const handleLogout = async () => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            SessionStorage.clearUser();
            setUser(null);
            setCurrentTab(TabView.DASHBOARD);
        }
    };

    // 載入中畫面
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!user) {
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
            case TabView.K8S:
                return <K8sManager />;
            case TabView.DATABASES:
                return <DatabaseManager />;
            case TabView.DISKS:
                return <DiskManager />;
            case TabView.STORAGE:
                return <StorageManager />;
            case TabView.NETWORK:
                return <NetworkManager />;
            case TabView.FILES:
                return <FileManager />;
            case TabView.SECURITY:
                return <FirewallManager />;
            case TabView.WAF:
                return <WafManager />;
            case TabView.USERS:
                return <UserManager />;
            case TabView.MONITOR:
                return <ConstructionView title="Network Monitor" />;
            case TabView.KVM:
                return <KvmManager />;
            case TabView.SERVICES:
                return <ServiceManager />;
            case TabView.CRON:
                return <CronManager />;
            case TabView.PACKAGES:
                return <PackageManager />;
            case TabView.LOGS:
                return <LogManager />;
            case TabView.FTP:
                return <FtpManager />;
            case TabView.MAIL:
                return <ConstructionView title="Mail Server" />;
            case TabView.TERMINAL:
                return <TerminalManager />;
            case TabView.SETTINGS:
                return <SettingsPage />;
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
                user={user}
                features={platformFeatures}
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
                            <span className="font-bold text-lg tracking-tight text-white">
                                HASHI
                            </span>
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
