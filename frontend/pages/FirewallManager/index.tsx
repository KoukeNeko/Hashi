import React, { useState } from 'react';
import { PageHeader } from '../../components';
import { Shield, Terminal } from 'lucide-react';
import { Tabs, TabItem } from '../../components/ui/Tabs';
import UfwPanel from './components/UfwPanel';
import IptablesPanel from './components/IptablesPanel';

// ==================== Tab Configuration ====================

type FirewallTabId = 'ufw' | 'iptables';

const FIREWALL_TABS: TabItem[] = [
    { id: 'ufw', label: 'UFW', icon: Shield },
    { id: 'iptables', label: 'iptables', icon: Terminal },
];

// ==================== Main Component ====================

const FirewallManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FirewallTabId>('ufw');

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Firewall"
                icon={activeTab === 'ufw' ? Shield : Terminal}
                iconColor={activeTab === 'ufw' ? 'text-emerald-500' : 'text-cyan-500'}
                description={
                    activeTab === 'ufw'
                        ? 'Manage UFW (Uncomplicated Firewall) rules'
                        : 'Advanced iptables rule management'
                }
            />

            {/* Tab Switcher */}
            <Tabs
                items={FIREWALL_TABS}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as FirewallTabId)}
            />

            {/* Panel Content */}
            {activeTab === 'ufw' ? <UfwPanel /> : <IptablesPanel />}
        </div>
    );
};

export default FirewallManager;
