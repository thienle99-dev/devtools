import React, { useEffect, useState, useMemo } from 'react';
import type { PluginManifest, InstalledPlugin } from '@/types/plugin';
import { Button } from '@components/ui/Button';
import { Filter, RotateCw, Search } from 'lucide-react';
import { PluginCard } from './components/PluginCard';
import { PluginDetailModal } from './components/PluginDetailModal';
import { InstallProgressModal } from './components/InstallProgressModal';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const PluginMarketplace: React.FC = () => {
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Professional Header - Fixed */}
      <div className="px-8 pt-6 pb-4 border-b border-border/50 bg-card/30 backdrop-blur-sm shrink-0">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">Plugin Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              Discover and install {filteredPlugins.length} community plugin{filteredPlugins.length !== 1 ? 's' : ''} to extend your DevTools
            </p>
          </div>
          <Button 
            variant="outline" 
            size="md"
            onClick={fetchPlugins} 
            loading={isLoading}
            className="shrink-0"
          >
            <RotateCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh Registry
          </Button>
        </div>

        {/* Professional Search & Filters */}
        <div className="bg-background/50 border border-border rounded-xl p-4 space-y-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="w-full h-11 pl-11 pr-4 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            placeholder="Search plugins by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">Category:</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  selectedCategory === cat.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary hover:shadow-sm"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {/* Plugin Grid - Professional */}
      {isLoading && filteredPlugins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[260px] rounded-xl bg-card/30 border border-border animate-pulse p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-2/3" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted/50 rounded w-full" />
                <div className="h-3 bg-muted/50 rounded w-4/5" />
              </div>
              <div className="h-9 bg-muted/50 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-5">
            <Filter className="w-10 h-10 opacity-40" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">No plugins found</p>
          <p className="text-sm text-center text-muted-foreground mb-6 max-w-md">
            We couldn't find any plugins matching your criteria. Try adjusting your search or filters.
          </p>
          <Button 
            variant="outline" 
            size="md"
            onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
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
              <div 
                key={plugin.id} 
                onClick={() => setSelectedPlugin(plugin)}
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
              </div>
            );
          })}
        </div>
      )}
      </div>

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
          fetchPlugins();
        }}
      />
    </div>
  );
};

export default PluginMarketplace;
