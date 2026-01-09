import { useTabStore } from '@store/tabStore';
import { TOOLS } from '@tools/registry';
import { useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';

export const Footer = () => {
    const { tabs, activeTabId } = useTabStore();
    const location = useLocation();

    // Find the active tab
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Find the tool in registry to get the icon (if any)
    const activeTool = activeTab ? TOOLS.find(t => t.id === activeTab.toolId) : null;
    
    // If we're on dashboard but not in a tab
    const isDashboard = location.pathname === '/dashboard';
    
    return (
        <footer className="h-9 px-3 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-30 backdrop-blur-xl">
            {/* Left Section: Status & Active Tool Info */}
            <div className="flex items-center space-x-2 sm:space-x-5">
                {/* Connection/Ready Status */}
                <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                    <span className="font-medium hidden sm:inline">Ready</span>
                    <span className="font-medium sm:hidden">●</span>
                </div>
                
                <div className="w-px h-4 bg-border-glass hidden sm:block" />
                
                {/* Active Tool Info */}
                <div className="flex items-center space-x-3 overflow-hidden">
                    {activeTool ? (
                        <>
                            <div className={`flex items-center space-x-1.5 ${activeTool.color || 'text-foreground'}`}>
                                <activeTool.icon size={12} className="shrink-0" />
                                <span className="font-semibold truncate max-w-[100px] sm:max-w-[150px]">
                                    {activeTool.name}
                                </span>
                            </div>
                            <span className="opacity-40 hidden sm:inline">|</span>
                            <div className="flex items-center space-x-1 opacity-70 hidden sm:flex">
                                <Layers size={10} />
                                <span>{tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}</span>
                            </div>
                        </>
                    ) : isDashboard ? (
                        <span className="opacity-70 italic">Dashboard</span>
                    ) : (
                        <span className="opacity-70 italic">Idle</span>
                    )}
                </div>
                
                <div className="w-px h-4 bg-border-glass hidden md:block" />
                <span className="opacity-70 hidden md:inline uppercase tracking-wider">UTF-8</span>
            </div>

            {/* Right Section: Version & Meta */}
            <div className="flex items-center space-x-2 sm:space-x-5">
                <div className="flex items-center space-x-1.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity group">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:bg-blue-500 transition-colors" />
                    <span className="font-medium">
                        <span className="hidden sm:inline">v0.2.0-beta</span>
                        <span className="sm:hidden">v0.2.0</span>
                    </span>
                </div>
            </div>
        </footer>
    );
};
