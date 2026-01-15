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
    { id: 'all', label: 'Everything', icon: LayoutGrid },
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
    <div className="plugin-marketplace-container flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Immersive Header */}
      <div className="px-8 pt-6 pb-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest">
                <Sparkles size={10} fill="currentColor" />
                Next-Gen Ecosystem
            </div>
            <h1 className="text-3xl font-black tracking-tighter">
                Plugin <span className="shimmer-text">Marketplace</span>
            </h1>
            <p className="text-[13px] opacity-60 max-w-xl font-medium leading-relaxed">
                Extend your workflow with powerful specialist tools. Optimized for speed and security.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={fetchPlugins}
                className="group h-10 px-4 rounded-xl bg-white/[0.03] dark:bg-white/[0.03] bg-black/[0.02] border border-black/5 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2.5 font-bold text-[11px]"
             >
                <RotateCw className={cn("w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity", isLoading && "animate-spin")} />
                Sync Registry
             </button>
          </div>
        </div>

        {/* High-Performance Controls */}
        <div className="relative z-20 flex flex-col gap-4 p-1 rounded-3xl bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-xl backdrop-blur-3xl">
            <div className="flex flex-col lg:flex-row items-center gap-3">
                {/* Tab Switcher - Premium */}
                <div className="flex p-1 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl w-full lg:w-fit">
                    {(['browse', 'installed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative",
                                activeTab === tab ? "bg-indigo-500 text-white shadow-lg" : "opacity-40 hover:opacity-100"
                            )}
                        >
                            {tab === 'browse' ? 'Storefront' : 'Installed'}
                            {tab === 'installed' && installedPlugins.length > 0 && (
                                <span className={cn(
                                    "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border-2",
                                    activeTab === tab ? "bg-white text-indigo-600 border-indigo-500" : "bg-black/10 dark:bg-white/10 border-black/40 dark:border-white/40"
                                )}>
                                    {installedPlugins.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar - Advanced */}
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-400 transition-all" />
                    <input
                        type="text"
                        className="w-full h-11 pl-12 pr-5 bg-black/[0.02] dark:bg-white/[0.02] border border-transparent rounded-2xl text-xs font-medium focus:outline-none focus:bg-black/[0.04] dark:focus:bg-white/[0.05] focus:border-indigo-500/30 transition-all placeholder:opacity-20"
                        placeholder={activeTab === 'browse' ? "Search for tools..." : "Search locally..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Filter - Pill System */}
            <div className="flex items-center gap-3 px-3 pb-1">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "filter-pill group px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.12em] transition-all flex items-center gap-2 border whitespace-nowrap",
                                    selectedCategory === cat.id ? "active" : ""
                                )}
                            >
                                {Icon && <Icon size={10} className={selectedCategory === cat.id ? "text-indigo-400" : "opacity-20"} />}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* Grid Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-4 custom-scrollbar">
        <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="opacity-20" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                    {activeTab === 'browse' ? 'Curated Collection' : 'My Local Library'}
                </h2>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[9px] font-bold opacity-40 uppercase tracking-widest">
                <Zap size={9} className="text-indigo-500" />
                {filteredPlugins.length} result{filteredPlugins.length !== 1 ? 's' : ''}
            </div>
        </div>

        {isLoading && filteredPlugins.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[300px] rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-indigo-500/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-500/10">
              <PackageCheck className="w-10 h-10 text-indigo-500/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No tools found</h3>
            <p className="text-sm opacity-30 mb-10 max-w-sm font-medium">
                Try a different keyword or browse all categories.
            </p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}
              className="h-12 px-8 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {filteredPlugins.map(plugin => {
              const installedPlugin = installedPlugins.find(p => p.manifest.id === plugin.id);
              const isUpdateAvailable = installedPlugin 
                ? installedPlugin.manifest.version !== plugin.version 
                : false;

              return (
                <div 
                  key={plugin.id} 
                  className="contents"
                  onClick={() => {
                    console.log('[Marketplace] Card clicked for plugin:', plugin.id);
                    setSelectedPlugin(plugin);
                  }}
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
