import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Copy, Search, ChevronRight } from 'lucide-react';
import { useTabStore } from '../../store/tabStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToolById } from '../../tools/registry';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Windows/Linux-style window controls
 * Enhanced with "Pro" header features: Breadcrumbs, Command Palette trigger
 */
export const WindowsWindowControls: React.FC = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const { activeTabId, tabs } = useTabStore();
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Determine header content based on route
    const isDashboard = location.pathname === '/dashboard';
    const activeTool = activeTab ? getToolById(activeTab.toolId) : null;

    useEffect(() => {
        const handleMaximized = (_event: any, state: boolean) => {
            setIsMaximized(state);
        };

        const ipcRenderer = (window as any).ipcRenderer;
        if (ipcRenderer) {
            const removeListener = ipcRenderer.on('window-maximized', handleMaximized);
            return () => {
                if (typeof removeListener === 'function') {
                    removeListener();
                }
            };
        }
    }, []);

    const handleMinimize = () => {
        (window as any).ipcRenderer?.send('window-minimize');
    };

    const handleMaximize = () => {
        (window as any).ipcRenderer?.send('window-maximize');
    };

    const handleClose = () => {
        (window as any).ipcRenderer?.send('window-close');
    };

    const { sidebarCollapsed, setSidebarOpen } = useSettingsStore();

    const handleSearchClick = () => {
        // Ensure sidebar is open to render the search input
        if (sidebarCollapsed) {
            setSidebarOpen(true);
        }

        // Wait for React to render (next tick) or animation frame
        setTimeout(() => {
            const searchInput = document.querySelector('.sidebar-search-input') as HTMLInputElement;
            if (searchInput) {
                 searchInput.focus();
            } else {
                 // Fallback if still not found (shouldn't happen if logic is correct)
                 // But Sidebar layout might delay rendering
                 // We can also retry
                 setTimeout(() => document.querySelector<HTMLInputElement>('.sidebar-search-input')?.focus(), 100);
            }
        }, 50);
    };

    return (
        <div className="flex items-center justify-between px-2 h-10 select-none drag bg-background/40 backdrop-blur-md border-b border-white/5 relative z-50 transition-colors duration-300">
            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity no-drag group">
                     {/* Window Icon / Home */}
                     <button 
                        onClick={() => {
                            const { setActiveTab } = useTabStore.getState();
                            setActiveTab(null);
                            navigate('/dashboard');
                        }}
                        className="p-1 rounded-md hover:bg-white/5 text-foreground-muted hover:text-foreground transition-colors"
                     >
                         <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded flex items-center justify-center shadow-sm shadow-indigo-500/20">
                            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-75" />
                         </div>
                     </button>

                     {/* Divider */}
                     {!isDashboard && <ChevronRight className="w-3.5 h-3.5 text-foreground-muted/40" />}

                     {/* Active Page Title */}
                     {!isDashboard && activeTool ? (
                         <div className="flex items-center gap-2 pointer-events-none">
                            <span className="text-xs font-semibold text-foreground tracking-tight truncate max-w-[200px]">{activeTool.name}</span>
                         </div>
                     ) : (
                         <span className="text-xs font-semibold text-foreground-muted tracking-wide ml-1 hidden sm:inline-block">DevTools</span>
                     )}
                </div>
            </div>

            {/* Center: Command Palette Trigger */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 lg:w-64 max-w-sm hidden md:block no-drag group">
                <button 
                    onClick={handleSearchClick}
                    className="w-full flex items-center justify-between gap-3 px-3 py-1.5 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-white/5 transition-all text-foreground-muted hover:text-foreground cursor-text"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-3 h-3 opacity-50" />
                        <span className="text-[11px] font-medium opacity-70">Search tools...</span>
                    </div>
                    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[9px] font-bold opacity-50 font-mono">
                        <span className="text-[10px]">⌘</span>
                        <span>K</span>
                    </div>
                </button>
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center gap-1 no-drag pl-2">
                <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
                
                <button
                    onClick={handleMinimize}
                    className="w-8 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 rounded-md transition-colors text-foreground-muted hover:text-foreground"
                    title="Minimize"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-8 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 rounded-md transition-colors text-foreground-muted hover:text-foreground"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <Copy className="w-3 h-3 rotate-180" /> 
                    ) : (
                        <Square className="w-3 h-3 p-0.5" />
                    )}
                </button>
                <button
                    onClick={handleClose}
                    className="w-8 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-md transition-colors text-foreground-muted"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
