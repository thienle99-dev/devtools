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
    Terminal
} from 'lucide-react';
import { useSettingsStore } from '@store/settingsStore';
import { useState, useEffect } from 'react';

export const Footer = () => {
    const { tabs, activeTabId, openTab } = useTabStore();
    const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Find the active tab
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    // Find the tool in registry to get the icon (if any)
    const activeTool = activeTab ? TOOLS.find(t => t.id === activeTab.toolId) : null;
    
    // If we're on dashboard but not in a tab
    const isDashboard = location.pathname === '/dashboard';

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
                <div className="flex items-center space-x-3 overflow-hidden">
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

            {/* Right Section: Version & Meta */}
            <div className="flex items-center space-x-2 sm:space-x-5 justify-end">
                <div className="hidden lg:flex items-center space-x-1.5 opacity-50 px-2 py-0.5 rounded border border-transparent hover:border-border-glass transition-all cursor-default">
                    <Terminal size={10} />
                    <span className="uppercase tracking-widest font-mono">UTF-8</span>
                </div>

                <div className="flex items-center space-x-1.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity group">
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
