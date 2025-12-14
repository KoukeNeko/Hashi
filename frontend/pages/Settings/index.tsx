import React, { useState } from 'react';
import { PageHeader } from '../../components';
import { Tabs } from '../../components/ui';
import { Settings, RefreshCw, Info } from 'lucide-react';
import UpdatePanel from './components/UpdatePanel';

/** Settings tab identifiers */
type SettingsTab = 'general' | 'updates' | 'about';

/** Tab configuration */
const SETTINGS_TABS = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'updates' as const, label: 'Updates', icon: RefreshCw },
    { id: 'about' as const, label: 'About', icon: Info },
];

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('updates');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <p className="text-zinc-500 text-center py-8">
                            General settings coming soon...
                        </p>
                    </div>
                );

            case 'updates':
                return <UpdatePanel />;

            case 'about':
                return (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Hashi Dashboard</h3>
                            <p className="text-zinc-400 text-sm">
                                A high-performance, dark-themed Linux server management dashboard
                                featuring real-time system monitoring, Docker container
                                orchestration, KVM virtualization management, and more.
                            </p>
                        </div>
                        <div className="pt-4 border-t border-zinc-800">
                            <p className="text-xs text-zinc-600">
                                © 2024 KoukeNeko. Licensed under MIT.
                            </p>
                            <a
                                href="https://github.com/KoukeNeko/Hashi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                View on GitHub →
                            </a>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Settings"
                icon={Settings}
                iconColor="text-zinc-400"
                description="Configure application preferences and check for updates."
            />

            {/* Tabs */}
            <Tabs
                items={SETTINGS_TABS}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as SettingsTab)}
            />

            {/* Tab Content */}
            {renderTabContent()}
        </div>
    );
};

export default SettingsPage;
