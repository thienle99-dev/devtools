import React, { useMemo } from 'react';
import type { PluginManifest, PluginStatus } from '@/types/plugin';
import { 
  BadgeCheck, Download, Trash2, RotateCw, HardDrive,
  Video, Music, FileText, Code, Shield, Wrench,
  Globe, Sparkles, Package, Zap, Image as ImageIcon,
  User, Star
} from 'lucide-react';
import { cn } from '@utils/cn';
import { getTagColor } from '../tag-utils';

const getCategoryIcon = (category: string, tags: string[]) => {
  const cat = category.toLowerCase();
  const allTags = [...tags.map(t => t.toLowerCase()), cat];
  if (allTags.some(t => ['video', 'youtube'].includes(t))) return Video;
  if (allTags.some(t => ['audio', 'music'].includes(t))) return Music;
  if (allTags.some(t => ['image', 'photo'].includes(t))) return ImageIcon;
  if (allTags.some(t => ['pdf', 'document'].includes(t))) return FileText;
  if (allTags.some(t => ['code', 'developer'].includes(t))) return Code;
  if (allTags.some(t => ['security', 'crypto'].includes(t))) return Shield;
  if (allTags.some(t => ['network', 'web'].includes(t))) return Globe;
  if (allTags.some(t => ['ai', 'smart'].includes(t))) return Sparkles;
  if (allTags.some(t => ['utility', 'tool'].includes(t))) return Wrench;
  return Package;
};

const getCategoryTheme = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('media')) return { color: 'text-purple-400', accent: 'bg-purple-500', glow: 'shadow-purple-500/20' };
  if (cat.includes('document')) return { color: 'text-amber-400', accent: 'bg-amber-500', glow: 'shadow-amber-500/20' };
  if (cat.includes('developer')) return { color: 'text-blue-400', accent: 'bg-blue-500', glow: 'shadow-blue-500/20' };
  if (cat.includes('security')) return { color: 'text-rose-400', accent: 'bg-rose-500', glow: 'shadow-rose-500/20' };
  if (cat.includes('network')) return { color: 'text-emerald-400', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };
  return { color: 'text-indigo-400', accent: 'bg-indigo-500', glow: 'shadow-indigo-500/20' };
};

interface PluginCardProps {
  plugin: PluginManifest;
  status: PluginStatus;
  isUpdateAvailable: boolean;
  onInstall: (plugin: PluginManifest) => void;
  onUninstall: (plugin: PluginManifest) => void;
  onToggle: (plugin: PluginManifest, active: boolean) => void;
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
    return mb < 1 ? `${(plugin.size / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  }, [plugin.size]);

  const IconComponent = useMemo(() => getCategoryIcon(plugin.category, plugin.tags), [plugin.category, plugin.tags]);
  const theme = useMemo(() => getCategoryTheme(plugin.category), [plugin.category]);

  return (
    <div className={cn(
      "plugin-card-hover group flex flex-col h-full rounded-3xl overflow-hidden relative backdrop-blur-md",
      theme.glow
    )}>
      {/* Accent Glow Strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 z-20", theme.accent)} />
      <div className={cn("absolute top-0 left-0 right-0 h-12 opacity-10 blur-xl z-10", theme.accent)} />

      <div className="p-5 flex-1 flex flex-col relative z-20">
        {/* Header Section */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="plugin-icon-box w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl">
            <IconComponent className={cn("w-6 h-6", theme.color)} />
          </div>
          
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-base leading-tight truncate opacity-90 group-hover:opacity-100 transition-opacity">
                {plugin.name}
              </h3>
              {plugin.verified && <BadgeCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-[10px] opacity-40 font-medium tracking-tight">
              <span className="flex items-center gap-1"><User size={9} /> {plugin.author}</span>
              <span>·</span>
              <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">{plugin.version}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
             {isInstalled && (
                <div className={cn(
                    "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                    isActive 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                        : "bg-black/5 dark:bg-white/5 opacity-30 border-black/10 dark:border-white/10"
                )}>
                    {isActive ? "Live" : "Idle"}
                </div>
             )}
             <div className="flex items-center gap-1 text-[9px] text-amber-500/80 font-bold">
                <Star size={9} fill="currentColor" /> {plugin.rating || '4.5'}
             </div>
          </div>
        </div>

        {/* Content Section */}
        <p className="text-xs opacity-60 mb-4 line-clamp-2 leading-relaxed font-medium">
          {plugin.description}
        </p>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
            {plugin.tags.slice(0, 3).map(tag => (
                <span key={tag} className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", getTagColor(tag))}>
                    {tag}
                </span>
            ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
                    <HardDrive size={10} className="opacity-40" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">Storage</span>
                    <span className="text-[10px] font-bold opacity-70">{sizeFormatted}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
                    <Download size={10} className="opacity-40" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">Reach</span>
                    <span className="text-[10px] font-bold opacity-70">{(plugin.downloads || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* Action Section */}
        <div className="mt-auto pt-1">
          {isInstalled ? (
            <div className="flex gap-1.5">
              <button 
                className={cn(
                    "flex-1 h-9 rounded-xl text-[11px] font-bold transition-all duration-300 border",
                    isActive 
                        ? "bg-black/5 dark:bg-white/5 opacity-70 border-black/10 dark:border-white/10 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10" 
                        : "bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25"
                )}
                onClick={(e) => { e.stopPropagation(); onToggle(plugin, !isActive); }}
              >
                {isActive ? 'Disable' : 'Activate'}
              </button>
              
              {isUpdateAvailable && (
                <button 
                  className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                  onClick={(e) => { e.stopPropagation(); onInstall(plugin); }}
                  title="Update Available"
                >
                  <RotateCw size={14} />
                </button>
              )}
              
              <button 
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center opacity-30 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/20 hover:opacity-100 transition-all font-bold"
                onClick={(e) => { e.stopPropagation(); onUninstall(plugin); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button 
              disabled={isInstalling}
              className={cn(
                "w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2",
                isInstalling 
                    ? "bg-black/10 dark:bg-white/10 opacity-30 border border-black/10 dark:border-white/10 cursor-not-allowed" 
                    : "bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl"
              )}
              onClick={(e) => { e.stopPropagation(); onInstall(plugin); }}
            >
              {isInstalling ? (
                <>
                    <RotateCw size={12} className="animate-spin" />
                    Installing...
                </>
              ) : (
                <>
                    <Zap size={12} fill="currentColor" />
                    Install Now
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
