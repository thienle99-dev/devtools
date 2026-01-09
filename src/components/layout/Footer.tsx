import { useTabStore } from '@store/tabStore';
import { TOOLS } from '@tools/registry';
import { useLocation } from 'react-router-dom';
import { cn } from '@utils/cn';
import { 
    Layers, 
    Settings, 
    Moon, 
    Sun, 
    Bell, 
    BellOff, 
    Maximize, 
    Minimize, 
    Command,
    Terminal,
    Clipboard,
    Clock,
    MoreHorizontal,
    ChevronUp,
    Activity,
    HardDrive,
    Globe,
    Wifi
} from 'lucide-react';
import { useSettingsStore } from '@store/settingsStore';
import { useClipboardStore } from '@store/clipboardStore';
import { useNotificationStore } from '@store/notificationStore';
import { useState, useEffect, useMemo, useRef } from 'react';

const TaskMonitor = () => {
    const [taskCount, setTaskCount] = useState(0);

    useEffect(() => {
        const checkTasks = async () => {
            try {
                const queue = await (window as any).universalAPI?.getQueue();
                const running = queue?.filter((t: any) => t.state === 'downloading').length || 0;
                setTaskCount(running);
            } catch (e) {
                // Ignore
            }
        };

        checkTasks();
        const interval = setInterval(checkTasks, 5000);
        return () => clearInterval(interval);
    }, []);

    if (taskCount === 0) return null;

    return (
        <div className="flex items-center space-x-2 px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full animate-pulse-slow shrink-0 shadow-[0_0_15px_-5px_rgba(14,165,233,0.3)]">
            <div className="relative">
                <Layers size={11} className="text-sky-500" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500 shadow-sm"></span>
                </span>
            </div>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tight">
                {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'} Running
            </span>
        </div>
    );
};

const ResourcesMonitor = ({ forceShow }: { forceShow?: boolean }) => {
    const [stats, setStats] = useState<{ cpu: number; ram: number }>({ cpu: 0, ram: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [cpuData, memData] = await Promise.all([
                    (window as any).statsAPI?.getCPUStats(),
                    (window as any).statsAPI?.getMemoryStats()
                ]);

                if (cpuData && memData) {
                    setStats({
                        cpu: cpuData.load?.currentLoad || 0,
                        ram: (memData.used / memData.total) * 100 || 0
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, []);

    const getBarColor = (val: number) => {
        if (val > 80) return 'bg-rose-500';
        if (val > 60) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getTextColor = (val: number) => {
        if (val > 80) return 'text-rose-400';
        if (val > 60) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className={`${forceShow ? 'flex' : 'hidden lg:flex'} items-center space-x-4 shrink-0 px-1`}>
            {/* CPU */}
            <div className="flex flex-col space-y-0.5 min-w-[50px]">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter opacity-80 font-bold text-foreground-secondary">
                    <span>CPU</span>
                    <span className={getTextColor(stats.cpu)}>{Math.round(stats.cpu)}%</span>
                </div>
                <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${getBarColor(stats.cpu)} shadow-[0_0_8px_inset_rgba(0,0,0,0.1)]`}
                        style={{ width: `${Math.min(100, stats.cpu)}%` }}
                    />
                </div>
            </div>

            {/* RAM */}
            <div className="flex flex-col space-y-0.5 min-w-[50px]">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter opacity-80 font-bold text-foreground-secondary">
                    <span>RAM</span>
                    <span className={getTextColor(stats.ram)}>{Math.round(stats.ram)}%</span>
                </div>
                <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${getBarColor(stats.ram)} shadow-[0_0_8px_inset_rgba(0,0,0,0.1)]`}
                        style={{ width: `${Math.min(100, stats.ram)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const DevInfo = ({ forceShow }: { forceShow?: boolean }) => {
    if (!import.meta.env.DEV && !forceShow) return null;

    const openDevTools = () => {
        (window as any).ipcRenderer?.send('window-open-devtools');
    };

    const versions = (window as any).ipcRenderer?.process?.versions || {};

    return (
        <div className="flex items-center space-x-2 shrink-0">
            <button 
                onClick={openDevTools}
                className="flex items-center space-x-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-bold text-rose-500 hover:bg-rose-500/20 transition-all group shadow-sm"
                title={`Chrome: ${versions.chrome || '?'}\nElectron: ${versions.electron || '?'}\nNode: ${versions.node || '?'}`}
            >
                <Terminal size={11} className="group-hover:rotate-12 transition-transform" />
                <span>DEV</span>
            </button>
            <div className={`${forceShow ? 'flex' : 'hidden 2xl:flex'} items-center space-x-2 text-[9px] text-foreground-muted font-mono tracking-tight`}>
                <span>e:{versions.electron || '?.?'}</span>
                <span>c:{versions.chrome || '?.?'}</span>
            </div>
        </div>
    );
};

const SessionTimer = ({ forceShow }: { forceShow?: boolean }) => {
    const [now, setNow] = useState(new Date());
    const startTime = useMemo(() => new Date(), []); // Mark session start when component mounts

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    const formatDuration = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${sec}s`;
    };

    return (
        <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-foreground/[0.03] dark:bg-white/10 border border-border-glass text-[10px] group transition-all hover:bg-foreground/[0.08] dark:hover:bg-white/15">
                 <Clock size={11} className="text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                 <span className="font-mono text-foreground font-medium">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
            </div>
            {(forceShow || true) && (
                <div className={`${forceShow ? 'flex' : 'hidden xl:flex'} flex items-center space-x-1.5 text-[10px]`}>
                    <span className="italic text-foreground-muted">Session:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">{formatDuration(durationSeconds)}</span>
                </div>
            )}
        </div>
    );
};

const ShortcutHint = ({ activeTool, forceShow }: { activeTool: any, forceShow?: boolean }) => {
    const [hintIndex, setHintIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const globalShortcuts = [
        { key: 'Ctrl + K', label: 'Command Palette' },
        { key: 'Ctrl + B', label: 'Toggle Sidebar' },
        { key: 'Ctrl + W', label: 'Close Tab' },
        { key: 'Ctrl + Tab', label: 'Next Tab' },
        { key: 'Ctrl + 1-9', label: 'Switch Tab' },
    ];

    const currentShortcuts = [...globalShortcuts];
    if (activeTool?.shortcut) {
        currentShortcuts.unshift({ key: activeTool.shortcut, label: `Open ${activeTool.name}` });
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setHintIndex((prev) => (prev + 1) % currentShortcuts.length);
                setIsVisible(true);
            }, 500);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentShortcuts.length]);

    const current = currentShortcuts[hintIndex];

    return (
        <div className={`${forceShow ? 'flex' : 'hidden xl:flex'} items-center space-x-2 px-3 py-1 bg-foreground/[0.03] dark:bg-white/[0.03] rounded-xl border border-border-glass overflow-hidden w-full transition-colors`}>
            <div className={`flex items-center space-x-2 transition-all duration-500 flex-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <span className="text-[9px] font-bold bg-sky-500/15 px-2 py-0.5 rounded-lg text-sky-600 dark:text-sky-400 whitespace-nowrap tracking-tighter border border-sky-500/20">
                    {current.key}
                </span>
                <span className="text-[10px] text-foreground-secondary font-medium truncate">
                    {current.label}
                </span>
            </div>
        </div>
    );
};

const NetworkMonitor = () => {
    const [netStats, setNetStats] = useState({ rx: 0, tx: 0, online: navigator.onLine });

    useEffect(() => {
        const updateOnlineStatus = () => setNetStats(prev => ({ ...prev, online: navigator.onLine }));
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        const fetchNet = async () => {
            try {
                const data = await (window as any).statsAPI?.getNetworkStats();
                if (data?.stats && Array.isArray(data.stats)) {
                    // Aggregate stats for all active interfaces
                    const total = data.stats.reduce((acc: any, curr: any) => ({
                        rx: acc.rx + (curr.rx_sec || 0),
                        tx: acc.tx + (curr.tx_sec || 0)
                    }), { rx: 0, tx: 0 });
                    setNetStats(prev => ({ ...prev, ...total }));
                }
            } catch (e) {}
        };

        const interval = setInterval(fetchNet, 2000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const formatSpeed = (bytes: number) => {
        if (bytes === 0) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex items-center justify-between px-3 py-3 hover:bg-foreground/5 dark:hover:bg-white/10 rounded-2xl transition-all group border border-transparent hover:border-border-glass">
            <div className="flex items-center space-x-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${netStats.online ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'bg-rose-500/10 text-rose-500'}`}>
                    {netStats.online ? <Wifi size={18} /> : <Globe size={18} className="animate-pulse" />}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-foreground/80 group-hover:text-foreground">Network</span>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-foreground-muted">
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400"><ChevronUp size={10} className="rotate-180 mr-0.5" />{formatSpeed(netStats.rx)}</span>
                        <span className="flex items-center text-sky-600 dark:text-sky-400"><ChevronUp size={10} className="mr-0.5" />{formatSpeed(netStats.tx)}</span>
                    </div>
                </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${netStats.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
        </div>
    );
};

const DiskMonitor = () => {
    const [disk, setDisk] = useState<{ used: number; total: number; percentage: number } | null>(null);

    useEffect(() => {
        const fetchDisk = async () => {
            try {
                const data = await (window as any).statsAPI?.getDiskStats();
                if (data?.fsSize && Array.isArray(data.fsSize)) {
                    const main = data.fsSize.find((d: any) => d.mount === '/' || d.mount === 'C:') || data.fsSize[0];
                    if (main) {
                        setDisk({
                            used: main.used,
                            total: main.size,
                            percentage: main.use
                        });
                    }
                }
            } catch (e) {}
        };
        fetchDisk();
        const interval = setInterval(fetchDisk, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
    };

    if (!disk) return null;

    return (
        <div className="flex items-center justify-between px-3 py-3 hover:bg-foreground/5 dark:hover:bg-white/10 rounded-2xl transition-all group border border-transparent hover:border-border-glass">
            <div className="flex items-center space-x-4 w-full">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                    <HardDrive size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-foreground/80 group-hover:text-foreground">Storage</span>
                        <span className="text-[10px] font-black text-foreground-muted">{Math.round(disk.percentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${disk.percentage > 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : disk.percentage > 75 ? 'bg-amber-500' : 'bg-sky-500'} shadow-[0_0_8px_inset_rgba(0,0,0,0.1)]`}
                            style={{ width: `${disk.percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-foreground-muted font-mono">
                        <span>{formatSize(disk.used)} used</span>
                        <span>{formatSize(disk.total)} total</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Footer = () => {
    const { tabs, activeTabId, openTab } = useTabStore();
    const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
    const { getStatistics } = useClipboardStore();
    const { updateAvailable, latestVersion, getUnreadCount } = useNotificationStore();
    const location = useLocation();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stats, setStats] = useState({ totalItems: 0, totalCopies: 0 });
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const unreadCount = getUnreadCount();

    // Find the active tab
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Find the tool in registry to get the icon (if any)
    const activeTool = activeTab ? TOOLS.find(t => t.id === activeTab.toolId) : null;
    
    // If we're on dashboard but not in a tab
    const isDashboard = location.pathname === '/dashboard';

    // Update stats periodically or when items change
    useEffect(() => {
        const s = getStatistics();
        setStats({ totalItems: s.totalItems, totalCopies: s.totalCopies });
    }, [useClipboardStore.getState().items, getStatistics]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const openSettings = () => {
        const settingsTool = TOOLS.find(t => t.id === 'settings');
        if (settingsTool) {
            openTab(settingsTool.id, settingsTool.path, settingsTool.name, settingsTool.description, false, false);
        }
    };

    const openClipboard = () => {
        const clipboardTool = TOOLS.find(t => t.id === 'clipboard-manager');
        if (clipboardTool) {
            openTab(clipboardTool.id, clipboardTool.path, clipboardTool.name, clipboardTool.description, false, false);
        }
    };

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <footer className="h-9 px-3 sm:px-6 grid grid-cols-3 items-center text-[10px] sm:text-[11px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-40 backdrop-blur-xl shrink-0">
            {/* Left Section: Status & Essential Tool Info */}
            <div className="flex items-center space-x-3 min-w-0 h-full">
                <div className="flex items-center space-x-2 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="font-bold hidden sm:inline text-emerald-600 dark:text-emerald-500/80 tracking-wide uppercase text-[9px]">Ready</span>
                </div>
                
                <div className="w-px h-3 bg-border-glass shrink-0" />
                
                <div className="flex items-center space-x-2 overflow-hidden shrink-0">
                    {activeTool ? (
                        <div className={`flex items-center space-x-1.5 ${activeTool.color || 'text-foreground'}`}>
                            <activeTool.icon size={11} className="shrink-0" />
                            <span className="font-semibold truncate max-w-[80px] sm:max-w-[150px]">
                                {activeTool.name}
                            </span>
                        </div>
                    ) : (
                        <span className="opacity-50 italic">Dashboard</span>
                    )}
                </div>
            </div>

            {/* Center Section: Quick Actions Bar (The Core UI) */}
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center bg-foreground/[0.05] dark:bg-white/5 rounded-full px-2 py-1 border border-border-glass shadow-sm dark:shadow-inner scale-90 sm:scale-100 backdrop-blur-md">
                    <button 
                        onClick={toggleTheme}
                        className={`p-1.5 hover:scale-110 transition-all rounded-full ${theme === 'dark' ? 'text-amber-400 hover:bg-amber-500/20' : 'text-indigo-600 hover:bg-indigo-500/10'}`}
                        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    >
                        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                    
                    <div className="w-px h-3 bg-border-glass mx-1" />
                    
                    <button 
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`p-1.5 transition-all rounded-full hover:scale-110 ${notificationsEnabled ? 'text-emerald-500 hover:bg-emerald-500/20' : 'text-rose-500 hover:bg-rose-500/20'}`}
                    >
                        {notificationsEnabled ? <Bell size={13} /> : <BellOff size={13} />}
                    </button>
                    
                    <div className="w-px h-3 bg-border-glass mx-1" />
                    
                    <button 
                        onClick={handleFullscreen}
                        className="p-1.5 text-violet-500 dark:text-violet-400 hover:scale-110 rounded-full hover:bg-violet-500/20 transition-all"
                    >
                        {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                    </button>
                    
                    <div className="w-px h-3 bg-border-glass mx-1" />
                    
                    <button 
                        className="p-1.5 text-sky-500 dark:text-sky-400 hover:scale-110 rounded-full hover:bg-sky-500/20 transition-all flex items-center space-x-1"
                    >
                        <Command size={12} />
                        <span className="text-[10px] font-bold">K</span>
                    </button>

                    <div className="w-px h-3 bg-border-glass mx-1" />

                    <button 
                        onClick={openSettings}
                        className="p-1.5 text-foreground-muted hover:text-foreground hover:scale-110 rounded-full hover:bg-foreground/10 transition-all"
                        title="Settings"
                    >
                        <Settings size={13} />
                    </button>
                </div>
            </div>

            {/* Right Section: Compact Info & More Menu */}
            <div className="flex items-center space-x-4 justify-end h-full">
                {/* Task Activity Indicator */}
                <div className="hidden sm:block">
                    <TaskMonitor />
                </div>

                <div className="flex items-center space-x-1.5 opacity-40">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span className="font-mono text-[9px]">v0.2.0-beta</span>
                </div>

                {/* The "Everything Else" Menu Hub */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(!showMoreMenu);
                        }}
                        className={cn(
                            "p-2 rounded-xl transition-all relative",
                            showMoreMenu 
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                : "hover:bg-foreground/10 text-foreground-muted hover:text-foreground"
                        )}
                    >
                        {showMoreMenu ? <ChevronUp size={16} /> : <MoreHorizontal size={16} />}
                        
                        {(updateAvailable || unreadCount > 0) && !showMoreMenu && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg-glass-panel animate-pulse" />
                        )}
                    </button>

                    {showMoreMenu && (
                        <div className="absolute bottom-full right-0 mb-3 w-72 bg-bg-glass-panel border border-border-glass rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-300 z-50 overflow-hidden">
                            <div className="space-y-5">
                                {/* System Status Header */}
                                <div className="flex items-center justify-between border-b border-foreground/5 pb-2.5 mb-1">
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">System Insight</span>
                                    {updateAvailable && (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black rounded-lg animate-pulse border border-amber-500/20">
                                            UPDATE AVAILABLE
                                        </span>
                                    )}
                                </div>

                                {/* Resource Monitor & Stats */}
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center p-3 bg-foreground/[0.02] dark:bg-white/[0.03] rounded-2xl border border-border-glass shadow-sm">
                                    <ResourcesMonitor forceShow />
                                    <div className="w-px h-8 bg-foreground/5 mx-2" />
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center space-x-2 text-foreground/40 mb-0.5">
                                            <Clipboard size={11} className="text-amber-500 dark:text-amber-400" />
                                            <span className="text-[9px] uppercase font-black tracking-tight">Clipboard</span>
                                        </div>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400 leading-none">{stats.totalItems}</span>
                                            <span className="text-[8px] font-black text-foreground/30">ITEMS</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tools & Actions */}
                                <div className="space-y-1.5">
                                    <button 
                                        onClick={() => { openSettings(); setShowMoreMenu(false); }}
                                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-foreground/5 dark:hover:bg-white/10 rounded-2xl transition-all group border border-transparent hover:border-border-glass shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                                            </div>
                                            <span className="font-bold text-foreground/80 group-hover:text-foreground transition-colors">Preferences</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold opacity-30 group-hover:opacity-1 dark:bg-white/5 bg-foreground/5 px-2 py-1 rounded-lg">⌘ ,</span>
                                    </button>

                                    <div className="pt-2">
                                        <div className="px-3 mb-2 flex items-center space-x-2">
                                            <Activity size={10} className="text-foreground/30" />
                                            <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">Connectivity & Storage</span>
                                        </div>
                                        <div className="space-y-1 bg-foreground/[0.02] dark:bg-white/[0.01] rounded-2xl border border-border-glass/50 overflow-hidden shadow-inner">
                                            <NetworkMonitor />
                                            <div className="mx-4 border-t border-foreground/[0.05]" />
                                            <DiskMonitor />
                                        </div>
                                    </div>
                                </div>

                                {/* Session & Dev Info Footer */}
                                <div className="pt-4 border-t border-foreground/5 space-y-5">
                                    <div className="flex flex-col space-y-4 px-1">
                                        <div className="flex flex-col space-y-2 items-center justify-between">
                                            <SessionTimer forceShow />
                                            <DevInfo forceShow />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-foreground/[0.02] dark:bg-white/[0.02] rounded-2xl p-1.5 border border-border-glass">
                                        <ShortcutHint activeTool={activeTool} forceShow />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};





