import React from 'react';
import { createPortal } from 'react-dom';
import type { PluginManifest } from '@/types/plugin';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { X, Download, BadgeCheck, Github, Globe, HardDrive, Box } from 'lucide-react';
import { getTagColor } from '../tag-utils';
import { cn } from '@utils/cn';

interface PluginDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginManifest | null;
  onInstall: (plugin: PluginManifest) => void;
  isInstalled: boolean;
}

export const PluginDetailModal: React.FC<PluginDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  plugin,
  onInstall,
  isInstalled
}) => {
  if (!isOpen || !plugin) return null;

  const sizeMB = (plugin.size / (1024 * 1024)).toFixed(1);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <Card className="w-full max-w-3xl max-h-[85vh] bg-card border-border p-0 overflow-hidden shadow-2xl flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header - Hero Section */}
        <div className="relative bg-muted/30 border-b border-border p-8 flex-shrink-0">
            {/* Close Button */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
                <X className="w-5 h-5" />
            </Button>

            <div className="flex gap-6">
                 {/* Icon */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/10 shrink-0">
                    <span role="img" aria-label="icon">🧩</span>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{plugin.name}</h2>
                        {plugin.verified && (
                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 font-medium flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                         <span className="bg-secondary text-muted-foreground text-xs px-2 py-0.5 rounded-full border border-border">
                            v{plugin.version}
                        </span>
                        <div className="flex gap-2 ml-2">
                             <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize", getTagColor(plugin.category))}>
                                {plugin.category}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed max-w-xl">
                        {plugin.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground/70 font-medium">Author:</span>
                            <span>{plugin.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5" />
                            <span>{plugin.downloads?.toLocaleString() ?? 0} installs</span>
                        </div>
                    </div>
                    
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {plugin.tags.map(tag => (
                            <span key={tag} className={cn("px-2 py-0.5 rounded-full text-[10px] border", getTagColor(tag))}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            
            {/* Screenshots Gallery (Mock) */}
            {plugin.screenshots && plugin.screenshots.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Preview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {plugin.screenshots.map((_, i) => (
                             <div key={i} className="aspect-video rounded-lg bg-muted border border-border overflow-hidden relative group">
                                 {/* In real app: <img src={src} ... /> */}
                                 <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                                     screenshot_{i+1}.jpg
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {/* About / Compatibility / Technical Grid */}
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Capabilities</h3>
                        <div className="space-y-2">
                            {plugin.permissions?.filesystem && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                                    <HardDrive className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Filesystem Access</div>
                                        <div className="text-xs text-muted-foreground">Can read and write files to your computer</div>
                                    </div>
                                </div>
                            )}
                            {plugin.permissions?.network && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                                    <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Network Access</div>
                                        <div className="text-xs text-muted-foreground">Can verify licenses and download external resources</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dependencies Section */}
                    {(plugin.dependencies?.binary || plugin.dependencies?.npm) && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Requirements & Dependencies</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {plugin.dependencies?.binary?.map((bin, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                                                <Box className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{bin.name}</div>
                                                <div className="text-[10px] text-muted-foreground">External Binary · v{bin.version}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                                            {(bin.size / (1024 * 1024)).toFixed(1)} MB
                                        </div>
                                    </div>
                                ))}

                                {plugin.dependencies?.npm && plugin.dependencies.npm.length > 0 && (
                                    <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Bundled Libraries</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {plugin.dependencies.npm.map((pkg, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-background/50 border border-border rounded text-[10px] font-mono text-muted-foreground">
                                                    {pkg}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                   
                   {/* Description / Readme Content could go here */}

                </div>

                <div className="col-span-1 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Information</h3>
                        <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Version</span>
                                <span className="text-foreground">{plugin.version}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Size</span>
                                <span className="text-foreground">{sizeMB} MB</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">License</span>
                                <span className="text-foreground">{plugin.license}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Platform</span>
                                <span className="text-foreground">{plugin.platforms?.join(', ')}</span>
                             </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Links</h3>
                        <div className="space-y-2">
                            {plugin.homepage && (
                                <a 
                                    href={plugin.homepage} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline p-1"
                                >
                                    <Globe className="w-4 h-4" />
                                    Website
                                </a>
                            )}
                            {plugin.category === 'developer' && (
                                <a 
                                    href="#" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline p-1"
                                >
                                    <Github className="w-4 h-4" />
                                    Source Code
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3 flex-shrink-0">
            <Button variant="ghost" onClick={onClose}>
                Close
            </Button>
            {isInstalled ? (
                <Button variant="ghost" disabled className="opacity-50 cursor-not-allowed border border-border">
                    Already Installed
                </Button>
            ) : (
                <Button variant="primary" onClick={() => onInstall(plugin)} className="px-8 shadow-xl shadow-blue-500/10">
                    Install Plugin
                </Button>
            )}
        </div>

      </Card>
    </div>,
    document.body
  );
};
