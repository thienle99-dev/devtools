import React, { useEffect, useState, useMemo } from 'react';
import type { PluginManifest, InstalledPlugin } from '@/types/plugin';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@components/ui/Button';
import { Filter, RotateCw } from 'lucide-react';
import { PluginCard } from './components/PluginCard';
import { PluginDetailModal } from './components/PluginDetailModal';
import { InstallProgressModal } from './components/InstallProgressModal';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Package, Command } from 'lucide-react';

export const PluginMarketplace: React.FC = () => {
  useScrollToTop();
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [installingPlugin, setInstallingPlugin] = useState<PluginManifest | null>(null);

  const categories = [
    { id: 'all', label: 'All Plugins' },
    { id: 'media', label: 'Media Tools' },
    { id: 'document', label: 'PDF & Docs' },
    { id: 'developer', label: 'Developer' },
    { id: 'security', label: 'Security' },
    { id: 'utility', label: 'Utilities' },
  ];

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      
      // Update registry first (optional, but good for fresh data)
      await window.pluginAPI.updateRegistry().catch(err => console.warn('Failed to update registry:', err));

      const [available, installed] = await Promise.all([
        window.pluginAPI.getAvailablePlugins(),
        window.pluginAPI.getInstalledPlugins()
      ]);

      setAvailablePlugins(available);
      setInstalledPlugins(installed);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      toast.error('Failed to load plugins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
    
    // Listen for progress to know when to refresh
    const cleanup = window.pluginAPI.onPluginProgress((progress) => {
        if (progress.stage === 'complete') {
             // Refresh list when installation is done
             setTimeout(fetchPlugins, 1000); 
        }
    });

    return () => cleanup();
  }, []);

  const handleInstall = async (plugin: PluginManifest) => {
    try {
      setInstallingPlugin(plugin);
      await window.pluginAPI.installPlugin(plugin.id);
    } catch (error: any) {
      toast.error(error.message || 'Installation failed');
      setInstallingPlugin(null);
    }
  };

  const handleUninstall = async (plugin: PluginManifest) => {
    if (confirm(`Are you sure you want to uninstall ${plugin.name}?`)) {
      try {
        await window.pluginAPI.uninstallPlugin(plugin.id);
        toast.success(`Uninstalled ${plugin.name}`);
        fetchPlugins();
      } catch (error: any) {
        toast.error(error.message || 'Uninstall failed');
      }
    }
  };

  const handleToggle = async (plugin: PluginManifest, active: boolean) => {
    try {
      await window.pluginAPI.togglePlugin(plugin.id, active);
      fetchPlugins();
      toast.success(active ? `Enabled ${plugin.name}` : `Disabled ${plugin.name}`);
    } catch (error: any) {
      toast.error('Failed to toggle plugin');
    }
  };

  const filteredPlugins = useMemo(() => {
    return availablePlugins.filter(plugin => {
      const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availablePlugins, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* Hero Section - Pro Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-muted/30 border border-border/50 p-8 md:p-10 shadow-sm shrink-0"
      >
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-current text-muted-foreground/80 text-xs font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plugin Ecosystem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-tight">
            Supercharge your workflow
          </h1>
          <p className="text-lg text-muted-foreground/90 mb-8 leading-relaxed max-w-2xl">
            Discover and install community-built plugins to extend the capabilities of DevTools. 
            Find the tools you need, from media downloaders to security audits.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
                variant="primary" 
                size="lg"
                onClick={() => {
                  const el = document.getElementById('browse-plugins');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shadow-lg shadow-primary/20"
            >
                <Package className="w-4 h-4 mr-2" />
                Browse Plugins
            </Button>
            <Button 
                variant="outline" 
                size="lg"
                onClick={fetchPlugins} 
                loading={isLoading}
                className="bg-background/50 backdrop-blur-sm border-border hover:bg-background/80"
            >
                <RotateCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Check Updates
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Modern Search Bar */}
      <div id="browse-plugins" className="sticky top-4 z-20">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/5 p-2 flex flex-col md:flex-row gap-2"
        >
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Command className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 pl-11 h-12 text-sm focus:outline-none"
                    placeholder="Search for plugins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            selectedCategory === cat.id 
                                ? "bg-background text-foreground shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </motion.div>
      </div>

      {/* Plugin Grid */}
      <AnimatePresence mode="wait">
        {isLoading && filteredPlugins.length === 0 ? (
            <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            >
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[280px] rounded-3xl bg-secondary/30 border border-border animate-pulse overflow-hidden p-6 flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-muted" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/2" />
                                <div className="h-3 bg-muted rounded w-1/4" />
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="h-3 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-5/6" />
                        </div>
                        <div className="h-8 bg-muted rounded mt-4" />
                    </div>
                ))}
            </motion.div>
        ) : filteredPlugins.length === 0 ? (
            <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground"
            >
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                    <Filter className="w-10 h-10 opacity-40" />
                </div>
                <p className="text-xl font-medium text-foreground mb-2">No plugins found</p>
                <p className="text-sm max-w-md text-center">We couldn't find any plugins matching your current filters. Try searching for something else.</p>
                <Button variant="ghost" className="mt-8" onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}>
                    Clear Filters
                </Button>
            </motion.div>
        ) : (
            <motion.div 
                key="grid"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.05
                        }
                    }
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20"
            >
                {filteredPlugins.map(plugin => {
                    const installedPlugin = installedPlugins.find(p => p.manifest.id === plugin.id);
                    const isUpdateAvailable = installedPlugin 
                        ? installedPlugin.manifest.version !== plugin.version 
                        : false;

                    const status = installedPlugin 
                        ? (isUpdateAvailable ? 'updating' : 'installed') 
                        : 'not-installed';

                    const isInstalling = installingPlugin?.id === plugin.id;

                    return (
                        <motion.div 
                            key={plugin.id} 
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                            onClick={() => setSelectedPlugin(plugin)} 
                            className="h-full"
                        >
                            <PluginCard 
                                plugin={installedPlugin ? installedPlugin.manifest : plugin} 
                                status={isInstalling ? 'installing' : status}
                                isUpdateAvailable={isUpdateAvailable}
                                isActive={installedPlugin?.active}
                                onInstall={(p) => {
                                    handleInstall(p);
                                }}
                                onUninstall={(p) => {
                                    handleUninstall(p);
                                }}
                                onToggle={(p, active) => {
                                    handleToggle(p, active);
                                }}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <PluginDetailModal 
        isOpen={!!selectedPlugin} 
        onClose={() => setSelectedPlugin(null)} 
        plugin={selectedPlugin}
        onInstall={(p) => {
            setSelectedPlugin(null);
            handleInstall(p);
        }}
        isInstalled={!!(selectedPlugin && installedPlugins.find(ip => ip.manifest.id === selectedPlugin.id))}
      />

      <InstallProgressModal 
        isOpen={!!installingPlugin}
        plugin={installingPlugin}
        onClose={() => {
            setInstallingPlugin(null);
            fetchPlugins(); // Refresh list to show installed state
        }}
      />
    </div>
  );
};

export default PluginMarketplace;
