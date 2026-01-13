import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PluginManifest, PluginStatus } from '@/types/plugin';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { BadgeCheck, Download, Trash2, RotateCw, HardDrive } from 'lucide-react';
import { cn } from '@utils/cn';

interface PluginCardProps {
  plugin: PluginManifest;
  status: PluginStatus;
  isUpdateAvailable: boolean;
  onInstall: (plugin: PluginManifest) => void;
  onUninstall: (plugin: PluginManifest) => void;
  onToggle: (plugin: PluginManifest, active: boolean) => void;
  // If active is not passed we assume it's checking the registry for 'installed' ones
  isActive?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  status,
  isUpdateAvailable,
  onInstall,
  onUninstall,
  onToggle,
  isActive = false
}) => {
  const isInstalled = status === 'installed' || status === 'updating';
  const isInstalling = status === 'installing';
  
  const sizeFormatted = useMemo(() => {
    const mb = plugin.size / (1024 * 1024);
    if (mb < 1) return `${(plugin.size / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  }, [plugin.size]);

  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    // Specific mappings
    if (['media', 'video', 'audio', 'music'].some(k => t.includes(k))) return "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
    if (['document', 'pdf', 'text', 'format'].some(k => t.includes(k))) return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    if (['developer', 'code', 'git', 'debug', 'json'].some(k => t.includes(k))) return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
    if (['security', 'crypto', 'auth', 'hash'].some(k => t.includes(k))) return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    if (['network', 'web', 'http', 'api'].some(k => t.includes(k))) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    if (['ai', 'bot', 'smart', 'model'].some(k => t.includes(k))) return "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-400";
    if (['utility', 'system', 'clean', 'os'].some(k => t.includes(k))) return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
    if (['download', 'upload', 'file'].some(k => t.includes(k))) return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400";

    // Hash-based fallback for others
    const colors = [
      "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
      "bg-lime-500/10 text-lime-600 border-lime-500/20 dark:text-lime-400",
      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
      "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400",
      "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
    ];
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full overflow-hidden group hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner
              bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20
              group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all
            `}>
              {/* Fallback Icon if image fails or isn't provided. In real app might use <img src={plugin.icon} /> */}
              <span role="img" aria-label="icon">🧩</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-sm text-foreground leading-none">{plugin.name}</h3>
                {plugin.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400" aria-label="Verified" />
                )}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                  <span className="truncate max-w-[100px]">{plugin.author}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                  <span>v{plugin.version}</span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          {isInstalled && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                isActive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {isActive ? 'Active' : 'Disabled'}
            </div>
          )}
        </div>

        {/* Description */}
        {/* Description */}
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed h-10">
          {plugin.description}
        </p>

        {/* Tags - Redesigned */}
        <div className="flex flex-wrap gap-1.5 mb-5 h-[22px] overflow-hidden">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize", getTagColor(plugin.category))}>
            {plugin.category}
          </span>
          {plugin.tags.slice(0, 2).map(tag => (
            <span key={tag} className={cn("px-2 py-0.5 rounded-full text-[10px] border", getTagColor(tag))}>
              {tag}
            </span>
          ))}
        </div>

        {/* Info Grid - Visual Refinement */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 bg-secondary/30 px-1.5 py-0.5 rounded">
            <HardDrive className="w-3 h-3" />
            <span>{sizeFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/30 px-1.5 py-0.5 rounded">
            <Download className="w-3 h-3" />
            <span>{plugin.downloads?.toLocaleString() ?? 0}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-2">
           {isInstalled ? (
             <>
               <Button 
                variant={isActive ? "ghost" : "primary"}
                size="sm"
                className="flex-1"
                onClick={() => onToggle(plugin, !isActive)}
               >
                 {isActive ? 'Disable' : 'Enable'}
               </Button>
               
               {isUpdateAvailable && (
                 <Button 
                   variant="glass" 
                   size="sm" 
                   onClick={() => onInstall(plugin)}
                   title="Update Available"
                   className="px-2"
                 >
                   <RotateCw className="w-4 h-4 text-blue-400" />
                 </Button>
               )}
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2"
                 onClick={() => onUninstall(plugin)}
                 title="Uninstall"
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </>
           ) : (
             <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
                loading={isInstalling}
                onClick={() => onInstall(plugin)}
             >
               {isInstalling ? 'Installing...' : 'Install'}
             </Button>
           )}
        </div>
      </div>
      </Card>
    </motion.div>
  );
};
