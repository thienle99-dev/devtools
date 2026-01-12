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
    Cpu,
    Database,
    Zap,
    Clipboard
} from 'lucide-react';
import { useSettingsStore } from '@store/settingsStore';
import { useClipboardStore } from '@store/clipboardStore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ResourcePill = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: number, colorClass: string }) => (
    <div className="flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-foreground/5 transition-colors group cursor-default">
        <Icon size={10} className="text-foreground-muted group-hover:text-foreground transition-colors" />
        <div className="flex flex-col">
            <div className="flex items-center justify-between w-10">
                <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">{label}</span>
                <span className={cn("text-[8px] font-mono font-bold", colorClass)}>{Math.round(value)}%</span>
            </div>
            <div className="h-0.5 w-full bg-foreground/10 rounded-full overflow-hidden mt-0.5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    className={cn("h-full", colorClass.replace('text-', 'bg-'))} 
                />
            </div>
        </div>
    </div>
);

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
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-md shadow-sm"
        >
            <Zap size={10} className="text-sky-400 animate-pulse" />
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-tight">
                {taskCount} {taskCount === 1 ? 'Job' : 'Jobs'}
            </span>
        </motion.div>
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
    const [systemStats, setSystemStats] = useState({ cpu: 0, ram: 0, disk: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const activeTool = useMemo(() => activeTab ? TOOLS.find(t => t.id === activeTab.toolId) : null, [activeTab]);

    useEffect(() => {
        const fetchSystem = async () => {
            try {
                const [cpu, mem, disk] = await Promise.all([
                    (window as any).statsAPI?.getCPUStats(),
                    (window as any).statsAPI?.getMemoryStats(),
                    (window as any).statsAPI?.getDiskStats()
                ]);
                const diskMain = disk?.fsSize?.find((d: any) => d.mount === '/' || d.mount === 'C:') || disk?.fsSize?.[0];
                setSystemStats({
                    cpu: cpu?.load?.currentLoad || 0,
                    ram: mem ? (mem.used / mem.total) * 100 : 0,
                    disk: diskMain ? diskMain.use : 0
                });
            } catch (e) { }
        };
        fetchSystem();
        const interval = setInterval(fetchSystem, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const s = getStatistics();
        setStats({ totalItems: s.totalItems, totalCopies: s.totalCopies });
    }, [items, getStatistics]);

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

    const getStatColor = (val: number) => {
        if (val > 80) return 'text-rose-400';
        if (val > 60) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <footer className={cn(
            "h-9 px-4 flex items-center justify-between border-t border-border-glass bg-bg-glass-panel backdrop-blur-2xl z-50 relative shrink-0",
            theme === 'light' ? "bg-white/80" : "bg-black/40"
        )}>
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent pointer-events-none" />
            
            {/* Left: App Identity & Context */}
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors cursor-default">
                    <StatusDot status="ready" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary/80">System Ready</span>
                </div>

                <div className="h-4 w-px bg-foreground/10 shrink-0" />

                <div className="flex items-center gap-2 overflow-hidden">
                    {activeTool ? (
                        <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <activeTool.icon size={12} className={activeTool.color || 'text-indigo-400'} />
                            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{activeTool.name}</span>
                        </motion.div>
                    ) : (
                        <span className="text-xs font-medium text-foreground-disabled italic">DevTools Dashboard</span>
                    )}
                </div>
            </div>

            {/* Center: Controls & Quick Actions */}
            <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-1 border border-foreground/5 shadow-inner">
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
                <div className="w-px h-3 bg-foreground/10 mx-0.5" />
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

            {/* Right: Monitoring & Info */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4">
                    <ResourcePill icon={Cpu} label="CPU" value={systemStats.cpu} colorClass={getStatColor(systemStats.cpu)} />
                    <ResourcePill icon={Database} label="RAM" value={systemStats.ram} colorClass={getStatColor(systemStats.ram)} />
                </div>

                <div className="h-4 w-px bg-foreground/10 shrink-0" />

                <div className="flex items-center gap-3">
                    <TaskMonitor />
                    
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] font-mono font-bold text-foreground">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <span className="text-[7px] font-black text-foreground-secondary uppercase tracking-widest mt-0.5">Local Time</span>
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
                                                    <HardDrive size={10} />
                                                    <span className="text-[8px] font-bold uppercase tracking-tight text-foreground">Disk</span>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-foreground">{Math.round(systemStats.disk)}%</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-foreground/5 border border-border-glass">
                                                <div className="flex items-center gap-2 mb-1 opacity-50">
                                                    <Clipboard size={10} />
                                                    <span className="text-[8px] font-bold uppercase tracking-tight text-foreground">Stats</span>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-foreground">{stats.totalItems} items</span>
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
            </div>
        </footer>
    );
};
