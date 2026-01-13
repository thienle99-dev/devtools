import React, { useMemo } from 'react';
import type { PluginManifest, PluginStatus } from '@/types/plugin';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { 
  BadgeCheck, Download, Trash2, RotateCw, HardDrive, Tag,
  Video, Music, FileText, Code, Shield, Wrench, 
  Globe, Sparkles, Package, Zap, Image as ImageIcon,
  Database, Webhook, Cpu, Box, Layers
} from 'lucide-react';
import { cn } from '@utils/cn';
import { getTagColor } from '../tag-utils';

// Icon mapping based on category
const getCategoryIcon = (category: string, tags: string[]) => {
  const cat = category.toLowerCase();
  const allTags = [...tags.map(t => t.toLowerCase()), cat];
  
  // Media
  if (allTags.some(t => ['video', 'youtube', 'tiktok', 'stream'].includes(t))) return Video;
  if (allTags.some(t => ['audio', 'music', 'sound', 'mp3'].includes(t))) return Music;
  if (allTags.some(t => ['image', 'photo', 'picture', 'png', 'jpg'].includes(t))) return ImageIcon;
  
  // Document
  if (allTags.some(t => ['pdf', 'document', 'text', 'doc', 'word'].includes(t))) return FileText;
  
  // Developer
  if (allTags.some(t => ['code', 'developer', 'git', 'json', 'xml'].includes(t))) return Code;
  if (allTags.some(t => ['api', 'webhook', 'rest'].includes(t))) return Webhook;
  if (allTags.some(t => ['database', 'sql', 'db'].includes(t))) return Database;
  
  // Security
  if (allTags.some(t => ['security', 'crypto', 'hash', 'auth', 'password'].includes(t))) return Shield;
  
  // Network
  if (allTags.some(t => ['network', 'web', 'http', 'download', 'url'].includes(t))) return Globe;
  
  // AI
  if (allTags.some(t => ['ai', 'smart', 'bot', 'gen', 'ml'].includes(t))) return Sparkles;
  
  // Utility
  if (allTags.some(t => ['utility', 'tool', 'clean', 'system', 'os'].includes(t))) return Wrench;
  if (allTags.some(t => ['converter', 'convert', 'transform'].includes(t))) return Layers;
  
  // Performance/Speed
  if (allTags.some(t => ['fast', 'speed', 'boost', 'optimize', 'performance'].includes(t))) return Zap;
  if (allTags.some(t => ['cpu', 'ram', 'memory', 'process'].includes(t))) return Cpu;
  
  // Package/Extension
  if (allTags.some(t => ['extension', 'addon', 'module'].includes(t))) return Box;
  
  // Default
  return Package;
};

// Get icon styles based on category
const getIconStyles = (category: string) => {
  const cat = category.toLowerCase();
  
  if (cat.includes('media')) {
    return {
      color: 'text-purple-500',
      bg: 'from-purple-500/10 to-purple-500/5',
      border: 'border-purple-500/20',
      hoverBg: 'group-hover:from-purple-500/15 group-hover:to-purple-500/10'
    };
  }
  if (cat.includes('document')) {
    return {
      color: 'text-amber-500',
      bg: 'from-amber-500/10 to-amber-500/5',
      border: 'border-amber-500/20',
      hoverBg: 'group-hover:from-amber-500/15 group-hover:to-amber-500/10'
    };
  }
  if (cat.includes('developer')) {
    return {
      color: 'text-blue-500',
      bg: 'from-blue-500/10 to-blue-500/5',
      border: 'border-blue-500/20',
      hoverBg: 'group-hover:from-blue-500/15 group-hover:to-blue-500/10'
    };
  }
  if (cat.includes('security')) {
    return {
      color: 'text-rose-500',
      bg: 'from-rose-500/10 to-rose-500/5',
      border: 'border-rose-500/20',
      hoverBg: 'group-hover:from-rose-500/15 group-hover:to-rose-500/10'
    };
  }
  if (cat.includes('network')) {
    return {
      color: 'text-emerald-500',
      bg: 'from-emerald-500/10 to-emerald-500/5',
      border: 'border-emerald-500/20',
      hoverBg: 'group-hover:from-emerald-500/15 group-hover:to-emerald-500/10'
    };
  }
  if (cat.includes('utility')) {
    return {
      color: 'text-slate-500',
      bg: 'from-slate-500/10 to-slate-500/5',
      border: 'border-slate-500/20',
      hoverBg: 'group-hover:from-slate-500/15 group-hover:to-slate-500/10'
    };
  }
  
  return {
    color: 'text-primary',
    bg: 'from-primary/10 to-primary/5',
    border: 'border-primary/20',
    hoverBg: 'group-hover:from-primary/15 group-hover:to-primary/10'
  };
};

// Get card background based on category
const getCardBackground = (category: string) => {
  const cat = category.toLowerCase();
  
  if (cat.includes('media')) {
    return 'bg-gradient-to-br from-purple-500/5 via-card/50 to-card/50 hover:from-purple-500/10';
  }
  if (cat.includes('document')) {
    return 'bg-gradient-to-br from-amber-500/5 via-card/50 to-card/50 hover:from-amber-500/10';
  }
  if (cat.includes('developer')) {
    return 'bg-gradient-to-br from-blue-500/5 via-card/50 to-card/50 hover:from-blue-500/10';
  }
  if (cat.includes('security')) {
    return 'bg-gradient-to-br from-rose-500/5 via-card/50 to-card/50 hover:from-rose-500/10';
  }
  if (cat.includes('network')) {
    return 'bg-gradient-to-br from-emerald-500/5 via-card/50 to-card/50 hover:from-emerald-500/10';
  }
  if (cat.includes('utility')) {
    return 'bg-gradient-to-br from-slate-500/5 via-card/50 to-card/50 hover:from-slate-500/10';
  }
  
  return 'bg-gradient-to-br from-primary/5 via-card/50 to-card/50 hover:from-primary/10';
};

// Get border color based on category
const getBorderColor = (category: string) => {
  const cat = category.toLowerCase();
  
  if (cat.includes('media')) return 'border-purple-500/20 hover:border-purple-500/40';
  if (cat.includes('document')) return 'border-amber-500/20 hover:border-amber-500/40';
  if (cat.includes('developer')) return 'border-blue-500/20 hover:border-blue-500/40';
  if (cat.includes('security')) return 'border-rose-500/20 hover:border-rose-500/40';
  if (cat.includes('network')) return 'border-emerald-500/20 hover:border-emerald-500/40';
  if (cat.includes('utility')) return 'border-slate-500/20 hover:border-slate-500/40';
  
  return 'border-primary/20 hover:border-primary/40';
};

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

  const IconComponent = useMemo(() => getCategoryIcon(plugin.category, plugin.tags), [plugin.category, plugin.tags]);
  const iconStyles = useMemo(() => getIconStyles(plugin.category), [plugin.category]);
  const cardBackground = useMemo(() => getCardBackground(plugin.category), [plugin.category]);
  const borderColor = useMemo(() => getBorderColor(plugin.category), [plugin.category]);
  
  // Get shadow color based on category
  const getShadowClass = () => {
    const cat = plugin.category.toLowerCase();
    if (cat.includes('media')) return 'hover:shadow-purple-500/20';
    if (cat.includes('document')) return 'hover:shadow-amber-500/20';
    if (cat.includes('developer')) return 'hover:shadow-blue-500/20';
    if (cat.includes('security')) return 'hover:shadow-rose-500/20';
    if (cat.includes('network')) return 'hover:shadow-emerald-500/20';
    return 'hover:shadow-primary/20';
  };

  // Get accent color for top border
  const getAccentColor = () => {
    const cat = plugin.category.toLowerCase();
    if (cat.includes('media')) return 'bg-purple-500';
    if (cat.includes('document')) return 'bg-amber-500';
    if (cat.includes('developer')) return 'bg-blue-500';
    if (cat.includes('security')) return 'bg-rose-500';
    if (cat.includes('network')) return 'bg-emerald-500';
    if (cat.includes('utility')) return 'bg-slate-500';
    return 'bg-primary';
  };

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden group transition-all duration-300 cursor-pointer",
      "backdrop-blur-sm border-2 shadow-md relative",
      "hover:shadow-xl hover:-translate-y-1",
      cardBackground,
      borderColor,
      getShadowClass()
    )}>
      {/* Accent Top Border with glow effect */}
      <div className={cn(
        "h-1 w-full transition-all duration-300",
        "group-hover:h-1.5 group-hover:shadow-lg",
        getAccentColor()
      )} />
      
      {/* Subtle corner decoration */}
      <div className="absolute top-2 right-2 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <div className={cn("w-full h-full rounded-full blur-2xl", getAccentColor())} />
      </div>
      
      <div className="p-5 flex-1 flex flex-col relative z-10">
        {/* Header - Professional with Dynamic Icon */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br border shrink-0 group-hover:scale-110 transition-all shadow-md",
            iconStyles.bg,
            iconStyles.border,
            iconStyles.hoverBg
          )}>
            <IconComponent className={cn("w-6 h-6", iconStyles.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base text-foreground leading-tight truncate">{plugin.name}</h3>
              {plugin.verified && (
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="truncate inline-block max-w-[140px] align-bottom">{plugin.author}</span>
              {' · v'}{plugin.version}
            </div>
          </div>
          {isInstalled && (
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 border",
              isActive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-muted/50 text-muted-foreground border-border"
            )}>
              {isActive ? 'Active' : 'Inactive'}
            </div>
          )}
        </div>

        {/* Description - Professional */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {plugin.description}
        </p>

        {/* Tags - Professional with Labels */}
        <div className="space-y-2 mb-4">
          {/* Category Tag */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">Category:</span>
            <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium capitalize border", getTagColor(plugin.category))}>
              {plugin.category}
            </span>
          </div>
          
          {/* Additional Tags */}
          {plugin.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {plugin.tags.slice(0, 3).map(tag => (
                  <span key={tag} className={cn("px-2 py-0.5 rounded text-[10px] border capitalize", getTagColor(tag))}>
                    {tag}
                  </span>
                ))}
                {plugin.tags.length > 3 && (
                  <span className="px-2 py-0.5 rounded text-[10px] text-muted-foreground border border-border bg-secondary/20">
                    +{plugin.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info - Professional with Labels */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-md">
            <HardDrive className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{sizeFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-md">
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{plugin.downloads?.toLocaleString() ?? 0} downloads</span>
          </div>
        </div>

        {/* Actions - Professional */}
        <div className="mt-auto flex gap-2">
          {isInstalled ? (
            <>
              <Button 
                variant={isActive ? "ghost" : "primary"}
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(plugin, !isActive);
                }}
              >
                {isActive ? 'Disable' : 'Enable'}
              </Button>
              
              {isUpdateAvailable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInstall(plugin);
                  }}
                  title="Update Available"
                >
                  <RotateCw className="w-4 h-4 text-primary" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onUninstall(plugin);
                }}
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
              onClick={(e) => {
                e.stopPropagation();
                onInstall(plugin);
              }}
            >
              {isInstalling ? 'Installing...' : 'Install Plugin'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
