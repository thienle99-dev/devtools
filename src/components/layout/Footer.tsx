import { useTabStore } from '@store/tabStore';
import { TOOLS } from '@tools/registry';
import { cn } from '@utils/cn';
import {
    Settings,
    Moon,
    Sun,
    Bell,
    BellOff,
    Maximize,
    Minimize,
    Command,
    MoreHorizontal,
    ChevronUp,
    HardDrive,
    Wifi,
    Zap,
    Clipboard,
    Puzzle
} from 'lucide-react';
import { useSettingsStore } from '@store/settingsStore';
import { useClipboardStore } from '@store/clipboardStore';
import { usePluginStore } from '@store/pluginStore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryIcon, getCategoryColor } from '@tools/plugins/plugin-utils';
import { useNavigate } from 'react-router-dom';

const StatusDot = ({ status }: { status: 'ready' | 'busy' | 'error' }) => {
    const colors = {
        ready: 'bg-emerald-500',
        busy: 'bg-amber-500',
        error: 'bg-rose-500'
    };
    return (
        <div className="relative flex items-center justify-center w-3 h-3">
            <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", colors[status])} />
            <div className={cn("relative w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]", colors[status])} />
        </div>
    );
};

const TaskMonitor = () => {
    const [taskCount, setTaskCount] = useState(0);

    useEffect(() => {
        const checkTasks = async () => {
            try {
                const queue = await (window as any).universalAPI?.getQueue();
                const running = queue?.filter((t: any) => t.state === 'downloading').length || 0;
                setTaskCount(running);
            } catch (e) { }
        };
        checkTasks();
        const interval = setInterval(checkTasks, 5000);
        return () => clearInterval(interval);
    }, []);

    if (taskCount === 0) return null;

    return (
        <div
            className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-md shadow-sm animate-in fade-in zoom-in duration-300"
        >
            <Zap size={10} className="text-sky-400 animate-pulse" />
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-tight">
                {taskCount} {taskCount === 1 ? 'Job' : 'Jobs'}
            </span>
        </div>
    );
};

const PluginBar = () => {
    const activePlugins = usePluginStore(state => state.activePlugins);
    const fetchActivePlugins = usePluginStore(state => state.fetchActivePlugins);
    const openTab = useTabStore(state => state.openTab);
    const navigate = useNavigate();

    useEffect(() => {
        fetchActivePlugins();

        const cleanup = window.pluginAPI?.onPluginProgress?.((progress) => {
            if (progress.stage === 'complete') {
                fetchActivePlugins();
            }
        });

        return () => cleanup?.();
    }, [fetchActivePlugins]);

    if (activePlugins.length === 0) return null;

    const handlePluginClick = (plugin: any) => {
        const path = `/plugin/${plugin.manifest.id}`;
        openTab(
            plugin.manifest.id,
            path,
            plugin.manifest.name,
            plugin.manifest.description,
            false,
            false
        );
        navigate(path);
    };

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-foreground/5 border border-foreground/10 rounded-lg shadow-sm">
            <Puzzle size={10} className="text-violet-400" />
            <div className="flex items-center gap-1">
                {activePlugins.slice(0, 5).map((plugin) => {
                    const Icon = getCategoryIcon(plugin.manifest.category);
                    const color = getCategoryColor(plugin.manifest.category);

                    return (
                        <button
                            key={plugin.manifest.id}
                            onClick={() => handlePluginClick(plugin)}
                            className={cn(
                                "p-1.5 rounded-md transition-all hover:scale-110 group relative",
                                "hover:bg-foreground/10"
                            )}
                            title={plugin.manifest.name}
                        >
                            <Icon size={12} className={color} />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border-glass rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                <span className="text-[10px] font-semibold text-foreground">{plugin.manifest.name}</span>
                            </div>
                        </button>
                    );
                })}
                {activePlugins.length > 5 && (
                    <div className="px-1.5 py-0.5 bg-foreground/10 rounded text-[8px] font-black text-foreground-muted">
                        +{activePlugins.length - 5}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Footer = () => {
    const tabs = useTabStore(state => state.tabs);
    const activeTabId = useTabStore(state => state.activeTabId);
    const openTab = useTabStore(state => state.openTab);

    const theme = useSettingsStore(state => state.theme);
    const setTheme = useSettingsStore(state => state.setTheme);
    const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
    const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);

    const getStatistics = useClipboardStore(state => state.getStatistics);
    const items = useClipboardStore(state => state.items);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stats, setStats] = useState({ totalItems: 0, totalCopies: 0 });
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const menuRef = useRef<HTMLDivElement>(null);
    const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const activeTool = useMemo(() => activeTab ? TOOLS.find(t => t.id === activeTab.toolId) : null, [activeTab]);

    useEffect(() => {
        const s = getStatistics();
        setStats({ totalItems: s.totalItems, totalCopies: s.totalCopies });
    }, [items, getStatistics]);

    useEffect(() => {
        const updateClock = () => setCurrentTime(new Date());
        updateClock();
        const interval = setInterval(() => {
            if (!document.hidden) {
                updateClock();
            }
        }, 30000);
        const handleVisibility = () => {
            if (!document.hidden) {
                updateClock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const openSettings = () => {
        const settingsTool = TOOLS.find(t => t.id === 'settings');
        if (settingsTool) {
            openTab(settingsTool.id, settingsTool.path, settingsTool.name, settingsTool.description, false, false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formattedTime = useMemo(() => currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: undefined, hour12: false }), [currentTime]);
    const formattedDate = useMemo(() => currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }), [currentTime]);

    return (
        <footer className={cn(
            "px-4 py-1.5 flex flex-wrap items-center gap-3 border-t border-border-glass bg-bg-glass-panel backdrop-blur-2xl z-50 relative shrink-0",
            theme === 'light' ? "bg-white/85" : "bg-black/40"
        )}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 min-w-0 flex-1 order-1">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-foreground/5 border border-foreground/10 shadow-sm">
                    <StatusDot status="ready" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground-secondary/80">Ready</span>
                        <span className="text-[8px] text-foreground-muted font-mono">v0.2 alpha</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                    {activeTool ? (
                        <>
                            <div className="flex items-center gap-2 max-w-[180px]">
                                <activeTool.icon size={14} className={activeTool.color || 'text-indigo-400'} />
                                <span className="text-xs font-semibold text-foreground truncate">{activeTool.name}</span>
                            </div>
                            <span className="text-[8px] uppercase tracking-[0.3em] text-foreground-muted hidden sm:block">
                                {activeTool.category}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs font-medium text-foreground-disabled italic">DevTools Dashboard</span>
                    )}
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-foreground-muted px-2 py-1 rounded-lg bg-foreground/5 border border-foreground/5">
                        <Clipboard size={10} />
                        <span>{stats.totalItems} items</span>
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.3em] text-foreground-muted">
                        {tabs.length} Tabs
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-1 bg-foreground/5 rounded-full px-2 py-1 border border-foreground/5 shadow-inner order-3 w-full md:w-auto md:order-2">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={cn("p-1.5 rounded-full transition-all hover:scale-110", theme === 'dark' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-indigo-500 hover:bg-indigo-500/10')}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                </button>
                <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={cn("p-1.5 rounded-full transition-all hover:scale-110", notificationsEnabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10')}
                    title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
                >
                    {notificationsEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                </button>
                <button
                    onClick={handleFullscreen}
                    className="p-1.5 text-violet-400 rounded-full hover:bg-violet-400/10 hover:scale-110 transition-all"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                    {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
                </button>
                <div className="flex items-center gap-1 px-2 py-1 text-sky-400 rounded-full hover:bg-sky-400/10 transition-all group cursor-default">
                    <Command size={10} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase">K</span>
                </div>
                <button
                    onClick={openSettings}
                    className="p-1.5 text-foreground-muted hover:text-foreground rounded-full hover:bg-foreground/10 transition-all"
                    title="Settings"
                >
                    <Settings size={12} />
                </button>
            </div>

            <div className="flex items-center gap-3 order-2 md:order-3 flex-1 justify-end min-w-0">
                <TaskMonitor />
                <PluginBar />
                <div className="flex flex-col text-right leading-tight">
                    <span className="text-xs font-mono font-semibold text-foreground">{formattedTime}</span>
                    <span className="text-[9px] text-foreground-muted uppercase tracking-widest">{formattedDate}</span>
                    <span className="text-[7px] text-foreground-muted uppercase tracking-widest">{timeZone}</span>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            showMoreMenu ? "bg-indigo-500 text-white" : "hover:bg-foreground/10 text-foreground-muted"
                        )}
                        title="System Status & Telemetry"
                    >
                        <MoreHorizontal size={14} />
                    </button>

                    <AnimatePresence>
                        {showMoreMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-4 w-64 bg-bg-glass-panel backdrop-blur-3xl border border-border-glass rounded-xl shadow-2xl p-4 overflow-hidden z-[60]"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black text-foreground/30 tracking-widest uppercase border-b border-border-glass pb-2">
                                        <span>Telemetry</span>
                                        <span className="text-[8px] opacity-100 bg-foreground/5 px-1.5 py-0.5 rounded">v0.2.0-stable</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 rounded-lg bg-foreground/5 border border-border-glass">
                                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                                <Clipboard size={10} />
                                                <span className="text-[8px] font-bold uppercase tracking-tight text-foreground">Clipboard</span>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-foreground">{stats.totalItems} saved</span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-foreground/5 border border-border-glass">
                                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                                <HardDrive size={10} />
                                                <span className="text-[8px] font-bold uppercase tracking-tight text-foreground">Workspace</span>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-foreground">{tabs.length} tabs</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Wifi size={12} className="text-indigo-400" />
                                                <span className="text-[10px] font-bold text-foreground">Connectivity</span>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                        <div className="text-[10px] text-foreground-secondary italic">
                                            System communicating via optimized local protocols.
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            openSettings();
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-500/10 text-foreground transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings size={14} className="group-hover:rotate-45 transition-transform text-indigo-400" />
                                            <span className="text-xs font-bold">Preferences</span>
                                        </div>
                                        <ChevronUp size={10} className="rotate-90 opacity-30" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </footer>
    );
};
