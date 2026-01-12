import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Search, 
    Command, 
    ArrowRight, 
    Moon, 
    Sun, 
    LayoutGrid, 
    PanelLeftClose,
    PanelLeftOpen,
    Trash2
} from 'lucide-react';
import { cn } from '@utils/cn';
import { TOOLS } from '@tools/registry';
import { useTabStore } from '@store/tabStore';
import { useToolStore } from '@store/toolStore';
import { useUIStore } from '@store/uiStore';
import { useSettingsStore } from '@store/settingsStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ActionItem {
    id: string;
    name: string;
    description?: string;
    icon: React.ElementType;
    category: 'tool' | 'action' | 'recent';
    shortcut?: string;
    perform: () => void;
    color?: string;
}

export const CommandPalette: React.FC = () => {
    const isOpen = useUIStore(state => state.commandPaletteOpen);
    const setOpen = useUIStore(state => state.setCommandPaletteOpen);
    const toggleSidebar = useSettingsStore(state => state.toggleSidebar);
    const sidebarCollapsed = useSettingsStore(state => state.sidebarCollapsed);
    const { setTheme } = useSettingsStore();
    const { openTab, closeAllTabs, tabs } = useTabStore();
    const history = useToolStore(state => state.history);
    const favorites = useToolStore(state => state.favorites);
    
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Close on escape or outside click
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) setOpen(false);
            
            // Cmd+P or Cmd+K to toggle
            if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'k')) {
                e.preventDefault();
                setOpen(!isOpen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, setOpen]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            // Small delay to focus input
            setTimeout(() => {
                document.getElementById('command-palette-search')?.focus();
            }, 50);
        }
    }, [isOpen]);

    const allActions = useMemo(() => {
        const actions: ActionItem[] = [];

        // 1. Tool Actions
        const tools = TOOLS.filter(t => t.id !== 'dashboard' && t.id !== 'settings');
        tools.forEach(tool => {
            actions.push({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                icon: tool.icon || Command,
                category: 'tool',
                color: tool.color,
                perform: () => {
                    openTab(tool.id, tool.path, tool.name, tool.description);
                    setOpen(false);
                }
            });
        });

        // 2. Global Actions
        actions.push({
            id: 'toggle-sidebar',
            name: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
            description: 'Change sidebar visibility',
            icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
            category: 'action',
            shortcut: 'B',
            perform: () => {
                toggleSidebar();
                setOpen(false);
            }
        });

        actions.push({
            id: 'theme-dark',
            name: 'Switch to Dark Theme',
            icon: Moon,
            category: 'action',
            perform: () => {
                setTheme('dark');
                setOpen(false);
            }
        });

        actions.push({
            id: 'theme-light',
            name: 'Switch to Light Theme',
            icon: Sun,
            category: 'action',
            perform: () => {
                setTheme('light');
                setOpen(false);
            }
        });

        actions.push({
             id: 'close-all-tabs',
             name: 'Close All Tabs',
             description: `Close all ${tabs.length} open tabs`,
             icon: Trash2,
             category: 'action',
             perform: () => {
                 closeAllTabs();
                 setOpen(false);
             }
        });

        actions.push({
            id: 'go-dashboard',
            name: 'Go to Dashboard',
            icon: LayoutGrid,
            category: 'action',
            perform: () => {
                navigate('/dashboard');
                useTabStore.getState().setActiveTab(null);
                setOpen(false);
            }
        });

        return actions;
    }, [isOpen, sidebarCollapsed, tabs.length, history, favorites, navigate, openTab, setOpen, setTheme, toggleSidebar, closeAllTabs]);

    const filteredActions = useMemo(() => {
        const q = query.toLowerCase().trim();
        
        if (!q) {
            // Show recent tools if no query
            const recentIds = Array.from(new Set(history.map(h => h.id))).slice(0, 5);
            const recentActions = recentIds.map(id => allActions.find(a => a.id === id)).filter(Boolean) as ActionItem[];
            
            // Add some default actions
            const defaultActions = allActions.filter(a => a.category === 'action').slice(0, 3);
            
            return [...recentActions, ...defaultActions];
        }

        return allActions.filter((a: ActionItem) => 
            a.name.toLowerCase().includes(q) || 
            a.description?.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [query, allActions, history]);

    // Handle Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev: number) => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev: number) => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredActions[selectedIndex]) {
                filteredActions[selectedIndex].perform();
            }
        }
    };

    // Keep selected item in view
    useEffect(() => {
        const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setOpen(false)}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="relative w-full max-w-2xl bg-[#1a1b26]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-white/5 space-x-3">
                    <Search className="w-5 h-5 text-foreground-muted" />
                    <input
                        id="command-palette-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tools, actions, and settings..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder-white/20"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                        <span className="text-[10px] text-foreground-muted">ESC</span>
                    </div>
                </div>

                {/* Results List */}
                <div 
                    ref={listRef}
                    className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar"
                >
                    {filteredActions.length > 0 ? (
                        <div className="space-y-1">
                             {!query && (
                                <div className="px-3 py-2">
                                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
                                        Relevant for you
                                    </span>
                                </div>
                            )}

                            {filteredActions.map((action: ActionItem, idx: number) => {
                                const Icon = action.icon;
                                const isSelected = idx === selectedIndex;

                                return (
                                    <button
                                        key={action.id}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        onClick={action.perform}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left",
                                            isSelected ? "bg-indigo-500/20 text-white" : "text-foreground-secondary hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm transition-all",
                                            isSelected ? "bg-indigo-500 border-indigo-400/50" : "bg-white/5",
                                            action.color && !isSelected ? action.color : ""
                                        )}>
                                            <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-foreground-muted")} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold truncate">{action.name}</span>
                                                {action.shortcut && (
                                                    <span className="text-[10px] text-foreground-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                                                        {action.shortcut}
                                                    </span>
                                                )}
                                            </div>
                                            {action.description && (
                                                <p className="text-[11px] text-foreground-muted truncate mt-0.5">
                                                    {action.description}
                                                </p>
                                            )}
                                        </div>

                                        <ArrowRight className={cn(
                                            "w-4 h-4 transition-all",
                                            isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                                        )} />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
                            <Command className="w-12 h-12 mb-4 opacity-10" />
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="px-4 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-foreground-muted font-mono bg-white/5 px-1 rounded border border-white/10">↓↑</span>
                            <span className="text-[10px] text-foreground-muted">Navigate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                             <span className="text-[10px] text-foreground-muted font-mono bg-white/5 px-1 rounded border border-white/10">↵</span>
                             <span className="text-[10px] text-foreground-muted">Select</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
