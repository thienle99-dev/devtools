import { useTabStore } from '@store/tabStore';
import { TOOLS } from '@tools/registry';
import { useLocation, useNavigate } from 'react-router-dom';
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
    Clock
} from 'lucide-react';
import { useSettingsStore } from '@store/settingsStore';
import { useClipboardStore } from '@store/clipboardStore';
import { useState, useEffect, useMemo } from 'react';

export const Footer = () => {
    const { tabs, activeTabId, openTab } = useTabStore();
    const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
    const { getStatistics } = useClipboardStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stats, setStats] = useState({ totalItems: 0, totalCopies: 0 });

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
    
    return (
        <footer className="h-9 px-3 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-30 backdrop-blur-xl shrink-0">
            {/* Left Section: Status & Active Tool Info */}
            <div className="flex items-center space-x-2 sm:space-x-5 flex-1 min-w-0">
                {/* Connection/Ready Status */}
                <div className="flex items-center space-x-2 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                    <span className="font-medium hidden sm:inline text-emerald-500/80">Ready</span>
                    <span className="font-medium sm:hidden">●</span>
                </div>
                
                <div className="w-px h-4 bg-border-glass hidden sm:block shrink-0" />
                
                {/* Active Tool Info */}
                <div className="flex items-center space-x-3 overflow-hidden shrink-0">
                    {activeTool ? (
                        <>
                            <div className={`flex items-center space-x-1.5 ${activeTool.color || 'text-foreground'}`}>
                                <activeTool.icon size={12} className="shrink-0" />
                                <span className="font-semibold truncate max-w-[80px] sm:max-w-[150px]">
                                    {activeTool.name}
                                </span>
                            </div>
                            <span className="opacity-40 hidden sm:inline shrink-0">|</span>
                            <div className="flex items-center space-x-1 opacity-70 hidden sm:flex shrink-0">
                                <Layers size={10} />
                                <span>{tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}</span>
                            </div>
                        </>
                    ) : isDashboard ? (
                        <span className="opacity-70 italic truncate">Dashboard</span>
                    ) : (
                        <span className="opacity-70 italic truncate">Idle</span>
                    )}
                </div>

                <div className="w-px h-4 bg-border-glass hidden md:block shrink-0" />

                {/* Clipboard Stats */}
                <button 
                    onClick={openClipboard}
                    className="flex items-center space-x-3 hover:text-amber-400 transition-colors shrink-0 group"
                >
                    <div className="flex items-center space-x-1.5">
                        <Clipboard size={12} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{stats.totalItems} items</span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-60 text-[9px] uppercase tracking-tighter">
                        <span>{stats.totalCopies} copies</span>
                    </div>
                </button>
            </div>

            {/* Center Section: Quick Actions Bar (Mobile hidden usually, but let's make it compact) */}
            <div className="flex items-center bg-white/5 rounded-full px-2 py-0.5 border border-border-glass mx-4 hidden md:flex shadow-inner">
                <button 
                    onClick={openSettings}
                    className="p-1 px-1.5 hover:text-white transition-all rounded-full hover:bg-blue-500/20 text-blue-400" 
                    title="Settings"
                >
                    <Settings size={12} />
                </button>
                <div className="w-px h-3 bg-border-glass mx-0.5" />
                <button 
                    onClick={toggleTheme}
                    className={`p-1 px-1.5 hover:text-white transition-all rounded-full ${theme === 'dark' ? 'text-amber-400 hover:bg-amber-500/20' : 'text-indigo-400 hover:bg-indigo-500/20'}`}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                </button>
                <div className="w-px h-3 bg-border-glass mx-0.5" />
                <button 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`p-1 px-1.5 transition-all rounded-full ${notificationsEnabled ? 'text-emerald-400 hover:bg-emerald-500/20 hover:text-white' : 'text-rose-400 hover:bg-rose-500/20 hover:text-white'}`}
                    title={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
                >
                    {notificationsEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                </button>
                <div className="w-px h-3 bg-border-glass mx-0.5" />
                <button 
                    onClick={handleFullscreen}
                    className="p-1 px-1.5 text-violet-400 hover:text-white transition-all rounded-full hover:bg-violet-500/20"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                    {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
                </button>
                <div className="w-px h-3 bg-border-glass mx-0.5" />
                <button 
                    className="p-1 px-1.5 text-sky-400 hover:text-white transition-all rounded-full hover:bg-sky-500/20 flex items-center space-x-1"
                    title="Command Palette (Ctrl+K)"
                >
                    <Command size={11} />
                    <span className="text-[9px] font-bold">K</span>
                </button>
            </div>

            {/* Right Section: Shortcuts Hint, Session Info, Version & Meta */}
            <div className="flex items-center space-x-2 sm:space-x-4 justify-end flex-1 min-w-0">
                {/* Session & Time Info */}
                <SessionTimer />

                <div className="w-px h-4 bg-border-glass hidden md:block shrink-0" />

                {/* Rotating Shortcuts Hint */}
                <ShortcutHint activeTool={activeTool} />

                <div className="hidden lg:flex items-center space-x-1.5 opacity-50 px-2 py-0.5 rounded border border-transparent hover:border-border-glass transition-all cursor-default shrink-0">
                    <Terminal size={10} />
                    <span className="uppercase tracking-widest font-mono">UTF-8</span>
                </div>

                <div className="flex items-center space-x-1.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity group shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 group-hover:bg-indigo-500 transition-colors" />
                    <span className="font-medium whitespace-nowrap">
                        <span className="hidden sm:inline text-foreground-extra-muted">v0.2.0-beta</span>
                        <span className="sm:hidden">v0.2.0</span>
                    </span>
                </div>
            </div>
        </footer>
    );
};

const SessionTimer = () => {
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
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white/5 border border-border-glass text-[10px] group transition-all hover:border-emerald-500/30">
                 <Clock size={10} className="text-emerald-400 group-hover:animate-pulse" />
                 <span className="font-mono opacity-80">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
            </div>
            <div className="hidden xl:flex items-center space-x-1 text-[10px] opacity-50">
                 <span className="italic">Session:</span>
                 <span className="font-medium text-sky-400 whitespace-nowrap">{formatDuration(durationSeconds)}</span>
            </div>
        </div>
    );
};

const ShortcutHint = ({ activeTool }: { activeTool: any }) => {
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
        <div className="hidden xl:flex items-center space-x-2 px-3 py-0.5 bg-white/5 rounded-md border border-border-glass overflow-hidden min-w-[160px] max-w-[220px]">
            <div className={`flex items-center space-x-2 transition-all duration-500 flex-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <span className="text-[9px] font-bold bg-foreground/10 px-1.5 py-0.5 rounded text-sky-400 whitespace-nowrap tracking-tighter">
                    {current.key}
                </span>
                <span className="text-[10px] opacity-60 truncate font-medium">
                    {current.label}
                </span>
            </div>
        </div>
    );
};
