import React from 'react';
import { createPortal } from 'react-dom';
import type { PluginManifest } from '@/types/plugin';
import { X, Download, BadgeCheck, Globe, HardDrive, Shield, Cpu, ExternalLink, User, Star } from 'lucide-react';
import { cn } from '@utils/cn';
import { getTagColor } from '../tag-utils';

interface PluginDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginManifest | null;
  onInstall: (plugin: PluginManifest) => void;
  isInstalled: boolean;
}

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('media')) return 'text-purple-400 border-purple-500/30 bg-purple-500/5';
  if (cat.includes('document')) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
  if (cat.includes('developer')) return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
  if (cat.includes('security')) return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  if (cat.includes('network')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
  return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5';
};

export const PluginDetailModal: React.FC<PluginDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  plugin,
  onInstall,
  isInstalled
}) => {
  if (!isOpen || !plugin) return null;

  const sizeMB = (plugin.size / (1024 * 1024)).toFixed(1);
  const themeStyles = getCategoryColor(plugin.category);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div 
        className="w-full max-w-3xl max-h-[85vh] bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col scale-100 animate-in zoom-in-95 duration-300 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 shadow-xl font-bold"
        >
            <X size={18} />
        </button>

        {/* Hero Header */}
        <div className="relative shrink-0 p-8 pb-5 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-black/[0.01] dark:from-white/[0.03] to-transparent overflow-hidden">
            {/* Background Glow */}
            <div className={cn("absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-[80px]", themeStyles.accent)} />
            
            <div className="relative z-10 flex items-start gap-6">
                <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/10 shrink-0", themeStyles.bg)}>
                    <Package size={36} className={themeStyles.text} />
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border", themeStyles.badge)}>
                            {plugin.category}
                        </span>
                        {plugin.verified && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                <BadgeCheck size={10} />
                                VERIFIED
                            </div>
                        )}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-none mb-2">
                        {plugin.name}
                    </h2>
                    <div className="flex items-center gap-4 text-xs font-bold opacity-30">
                        <div className="flex items-center gap-1.5">
                            <User size={12} />
                            {plugin.author}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Globe size={12} />
                            v{plugin.version}
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            {plugin.rating || '4.5'}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-20 mb-3">Description</h3>
                        <p className="text-[13px] leading-relaxed opacity-60 font-medium">
                            {plugin.description}
                        </p>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 group hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                            <Cpu size={18} className="opacity-20 mb-3 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Architecture</h4>
                            <p className="text-xs font-bold truncate">x64 / ARM64 Compatible</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 group hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                            <Shield size={18} className="opacity-20 mb-3 group-hover:opacity-100 group-hover:text-emerald-400 transition-all" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Security</h4>
                            <p className="text-xs font-bold truncate">Sandboxed Execution</p>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-20 mb-4">Required Permissions</h3>
                        <div className="space-y-2">
                            {Object.entries(plugin.permissions || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">{key}</span>
                                    </div>
                                    <BadgeCheck size={14} className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="p-5 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-30">
                                <HardDrive size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Install Size</span>
                            </div>
                            <span className="text-xs font-black">{sizeMB} MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-30">
                                <Download size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Downloads</span>
                            </div>
                            <span className="text-xs font-black">{plugin.downloads?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="pt-4 border-t border-black/5 dark:border-white/5">
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all">
                                <ExternalLink size={14} />
                                Documentation
                            </button>
                        </div>
                    </div>

                    {/* Metadata Tags */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-20">Architecture Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {plugin.tags.map(tag => (
                                <div key={tag} className={cn("px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all hover:scale-105", getTagColor(tag))}>
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                                <span className="text-sm font-bold opacity-80">{sizeMB} MB</span>
                             </div>
                             <div className="flex justify-between items-center group">
                                <span className="text-[11px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">Legal Protocol</span>
                                <span className="text-xs font-bold opacity-60">{plugin.license}</span>
                             </div>
                             <div className="flex justify-between items-center group">
                                <span className="text-[11px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">Deployment</span>
                                <div className="flex gap-2">
                                    {plugin.platforms?.map(p => (
                                        <span key={p} className="text-[10px] font-black text-indigo-500 dark:text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{p}</span>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-20">Quick Navigation</h3>
                        <div className="space-y-3">
                            {plugin.homepage && (
                                <a 
                                    href={plugin.homepage} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-sm font-bold opacity-60 hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 hover:border-black/10 dark:hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ExternalLink size={16} className="opacity-20 group-hover:text-indigo-500 transition-colors" />
                                        Documentation
                                    </div>
                                    <Shield size={14} className="opacity-10" />
                                </a>
                            )}
                            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-sm font-bold opacity-60 hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 hover:border-black/10 dark:hover:border-white/20 transition-all group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Cpu size={16} className="opacity-20 group-hover:text-amber-500 transition-colors" />
                                    Source Integrity
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-6 shrink-0 backdrop-blur-3xl">
            <div className="flex-1 hidden md:block">
                <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                    By installing, you authorize this plugin to operate within your workspace environment.
                </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <button 
                    onClick={onClose}
                    className="flex-1 md:flex-none h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all border border-transparent hover:border-black/10 dark:hover:border-white/10"
                >
                    Cancel
                </button>
                {isInstalled ? (
                    <button 
                        disabled 
                        className="flex-1 md:flex-none h-14 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-black/5 dark:bg-white/5 opacity-20 border border-black/5 dark:border-white/5 cursor-not-allowed"
                    >
                        Active in Library
                    </button>
                ) : (
                    <button 
                        onClick={() => onInstall(plugin)} 
                        className="flex-1 md:flex-none h-14 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/0 hover:ring-indigo-500/10"
                    >
                        Initiate Install
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
