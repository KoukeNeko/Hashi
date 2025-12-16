import React, { useState, useEffect } from 'react';
import { Package, Search, RotateCw, Download, Trash2, ArrowUpCircle, List, Search as SearchIcon } from 'lucide-react';
import { PackageInfo } from '../../types';
import { PackageService } from '../../services/api';
import { Tabs } from '../../components/ui/Tabs';

const PackageManager: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [packages, setPackages] = useState<PackageInfo[]>([]);
    const [updates, setUpdates] = useState<PackageInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('updates');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        setIsLoading(true);
        try {
            const data = await PackageService.listUpdates();
            setUpdates(data);
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setPackages([]);
        try {
            const data = await PackageService.search(searchQuery);
            setPackages(data);
            setActiveTab('search');
        } catch (error) {
            console.error('Failed to search packages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInstall = async (name: string) => {
        if (!confirm(`Install package ${name}?`)) return;
        setProcessing(name);
        try {
            await PackageService.install(name);
            alert(`Package ${name} installation started.`);
        } catch (error) {
            console.error('Failed to install package:', error);
            alert('Failed to install package.');
        } finally {
            setProcessing(null);
        }
    };

    const handleRemove = async (name: string) => {
        if (!confirm(`Remove package ${name}?`)) return;
        setProcessing(name);
        try {
            await PackageService.remove(name);
            alert(`Package ${name} removal started.`);
        } catch (error) {
            console.error('Failed to remove package:', error);
            alert('Failed to remove package.');
        } finally {
            setProcessing(null);
        }
    };

    const handleUpgrade = async (name: string) => {
        setProcessing(name);
        try {
            await PackageService.upgrade(name);
            alert(`Package ${name} upgrade started.`);
            // Optimistically remove from updates list
            setUpdates(prev => prev.filter(p => p.name !== name));
        } catch (error) {
            console.error('Failed to upgrade package:', error);
            alert('Failed to upgrade package.');
        } finally {
            setProcessing(null);
        }
    };

    const updateCache = async () => {
        setIsLoading(true);
        try {
            await PackageService.updateCache();
            await fetchUpdates();
        } catch (error) {
            alert('Failed to update package cache.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabItems = [
        { id: 'updates', label: `Updates (${updates.length})`, icon: ArrowUpCircle },
        { id: 'search', label: 'Search & Install', icon: SearchIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Package className="text-emerald-500" />
                        Package Management
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage system software packages</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={updateCache}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Update Cache
                    </button>
                </div>
            </div>

            <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} />

            {/* Search Bar */}
            {activeTab === 'search' && (
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search available packages..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                </form>
            )}

            {/* Results List */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 font-medium">Package</th>
                                <th className="px-6 py-3 font-medium">Architecture</th>
                                <th className="px-6 py-3 font-medium">Version</th>
                                <th className="px-6 py-3 font-medium">Description/Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        <RotateCw className="animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : activeTab === 'updates' ? (
                                updates.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                            System is up to date
                                        </td>
                                    </tr>
                                ) : (
                                    updates.map((pkg) => (
                                        <tr key={pkg.name} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{pkg.name}</td>
                                            <td className="px-6 py-4 text-zinc-400">{pkg.architecture}</td>
                                            <td className="px-6 py-4 text-emerald-400">{pkg.version}</td>
                                            <td className="px-6 py-4 text-zinc-400">{pkg.status}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleUpgrade(pkg.name)}
                                                    disabled={!!processing}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    {processing === pkg.name ? <RotateCw size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
                                                    Upgrade
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                packages.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                            {searchQuery ? 'No packages found' : 'Enter a search term to find packages'}
                                        </td>
                                    </tr>
                                ) : (
                                    packages.map((pkg) => (
                                        <tr key={pkg.name + pkg.description} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{pkg.name}</td>
                                            <td className="px-6 py-4 text-zinc-400">{pkg.architecture || '-'}</td>
                                            <td className="px-6 py-4 text-zinc-400">{pkg.version || '-'}</td>
                                            <td className="px-6 py-4 text-zinc-400 max-w-md truncate" title={pkg.description}>
                                                {pkg.description}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleInstall(pkg.name)}
                                                    disabled={!!processing}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    {processing === pkg.name ? <RotateCw size={14} className="animate-spin" /> : <Download size={14} />}
                                                    Install
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PackageManager;
