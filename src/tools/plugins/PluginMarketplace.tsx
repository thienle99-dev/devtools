import React, { useEffect, useState, useMemo } from 'react';
import type { PluginManifest, InstalledPlugin } from '@/types/plugin';
import { RotateCw, Search, Sparkles, LayoutGrid, PackageCheck, Zap } from 'lucide-react';
import { PluginCard } from './components/PluginCard';
import { PluginDetailModal } from './components/PluginDetailModal';
import { InstallProgressModal } from './components/InstallProgressModal';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { usePluginStore } from '@/store/pluginStore';
import './MarketplaceStyles.css';

export const PluginMarketplace: React.FC = () => {
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [installingPlugin, setInstallingPlugin] = useState<PluginManifest | null>(null);

  const [activeTab, setActiveTab] = useState<'browse' | 'installed'>('browse');

  const categories = [
    { id: 'all', label: 'Everything' },
    { id: 'media', label: 'Media & Video' },
    { id: 'document', label: 'PDF & Docs' },
    { id: 'developer', label: 'Dev Tools' },
    { id: 'security', label: 'Security' },
    { id: 'network', label: 'Network' },
    { id: 'ai', label: 'AI Studio' },
    { id: 'utility', label: 'Utilities' },
  ];

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      await window.pluginAPI.updateRegistry().catch(err => console.warn('Registry update failed:', err));
      const [available, installed] = await Promise.all([
        window.pluginAPI.getAvailablePlugins(),
        window.pluginAPI.getInstalledPlugins()
      ]);
      setAvailablePlugins(available);
      setInstalledPlugins(installed);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      toast.error('Failed to load plugin database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
    const cleanup = window.pluginAPI.onPluginProgress((progress) => {
        if (progress.stage === 'complete') setTimeout(fetchPlugins, 800); 
    });
    return () => cleanup();
  }, []);

  const handleInstall = async (plugin: PluginManifest) => {
    console.log(`[Marketplace] Starting installation for ${plugin.id}`);
    try {
      setInstallingPlugin(plugin);
      await window.pluginAPI.installPlugin(plugin.id);
      console.log(`[Marketplace] Installation call completed for ${plugin.id}`);
    } catch (error: any) {
      console.error(`[Marketplace] Installation failed for ${plugin.id}:`, error);
      toast.error(error.message || 'Installation failed');
      setInstallingPlugin(null);
    }
  };

  const handleUninstall = async (plugin: PluginManifest) => {
    if (window.confirm(`Uninstall ${plugin.name}? Information and local data will be deleted.`)) {
      try {
        await window.pluginAPI.uninstallPlugin(plugin.id);
        toast.success(`Removed ${plugin.name}`);
        fetchPlugins();
        usePluginStore.getState().fetchActivePlugins();
      } catch (error: any) {
        toast.error(error.message || 'Uninstall failed');
      }
    }
  };

  const handleToggle = async (plugin: PluginManifest, active: boolean) => {
    try {
      await window.pluginAPI.togglePlugin(plugin.id, active);
      fetchPlugins();
      usePluginStore.getState().fetchActivePlugins();
    } catch (error: any) {
      toast.error('Sync failed');
    }
  };

  const filteredPlugins = useMemo(() => {
    let source = activeTab === 'installed' 
        ? availablePlugins.filter(p => installedPlugins.some(ip => ip.manifest.id === p.id))
        : availablePlugins;

    return source.filter(plugin => {
      const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availablePlugins, installedPlugins, searchQuery, selectedCategory, activeTab]);

  return (
    <div className="plugin-marketplace-container flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8F9FC] dark:bg-[#0a0a0a]">
      {/* Header Section */}
      <div className="px-10 pt-8 pb-4 bg-gradient-to-b from-indigo-500/5 to-transparent">
        <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0E7FF] dark:bg-indigo-500/20 text-[#6366F1] dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles size={12} className="fill-current" />
                    Next-Gen Ecosystem
                </div>
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Plugin<span className="font-light opacity-90">Marketplace</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg font-medium">
                        Extend your workflow with powerful specialist tools. Optimized for speed and security.
                    </p>
                </div>
            </div>

            <button 
                onClick={fetchPlugins}
                className="group h-9 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
                <RotateCw className={cn("w-3.5 h-3.5 group-hover:text-indigo-500 transition-colors", isLoading && "animate-spin")} />
                Sync Registry
            </button>
        </div>

        {/* Unified Search & Filter Bar */}
        <div className="space-y-4">
            {/* Main Bar */}
            <div className="h-14 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100/50 dark:border-zinc-800 flex items-center px-2 gap-2">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-100/80 dark:bg-zinc-800 rounded-xl shrink-0">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === 'browse' 
                                ? "bg-[#6366F1] text-white shadow-sm" 
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        )}
                    >
                        Storefront
                    </button>
                    <button
                        onClick={() => setActiveTab('installed')}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative",
                            activeTab === 'installed'
                                ? "bg-[#6366F1] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        )}
                    >
                        Installed
                        {installedPlugins.length > 0 && (
                            <span className={cn(
                                "ml-2 px-1.5 py-0.5 rounded-full text-[9px]",
                                activeTab === 'installed' ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                            )}>
                                {installedPlugins.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2" />

                {/* Search */}
                <div className="flex-1 flex items-center gap-3 px-2 group">
                    <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#6366F1] transition-colors" />
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="Search for tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                            selectedCategory === cat.id
                                ? "bg-[#EEF2FF] dark:bg-indigo-500/20 border-[#6366F1]/20 text-[#6366F1] dark:text-indigo-300"
                                : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 hover:border-gray-300 dark:hover:border-zinc-700"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-6 custom-scrollbar">
        {isLoading && filteredPlugins.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[280px] rounded-2xl bg-gray-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
              <PackageCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tools found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                We couldn't find any plugins matching your search criteria.
            </p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}
              className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredPlugins.map(plugin => {
              const installedPlugin = installedPlugins.find(p => p.manifest.id === plugin.id);
              const isUpdateAvailable = installedPlugin 
                ? installedPlugin.manifest.version !== plugin.version 
                : false;

              return (
                <div 
                  key={plugin.id} 
                  className="contents"
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <PluginCard 
                    plugin={installedPlugin ? installedPlugin.manifest : plugin} 
                    status={installingPlugin?.id === plugin.id ? 'installing' : (installedPlugin ? (isUpdateAvailable ? 'updating' : 'installed') : 'not-installed')}
                    isUpdateAvailable={isUpdateAvailable}
                    isActive={installedPlugin?.active}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onToggle={handleToggle}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PluginDetailModal 
        isOpen={!!selectedPlugin} 
        onClose={() => setSelectedPlugin(null)} 
        plugin={selectedPlugin}
        onInstall={(p) => { 
            handleInstall(p); 
            setSelectedPlugin(null); 
        }}
        isInstalled={!!(selectedPlugin && installedPlugins.find(ip => ip.manifest.id === selectedPlugin.id))}
      />

      <InstallProgressModal 
        isOpen={!!installingPlugin}
        plugin={installingPlugin}
        onClose={() => { setInstallingPlugin(null); fetchPlugins(); }}
      />
    </div>
  );
};

export default PluginMarketplace;
