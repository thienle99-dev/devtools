import { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { useTabStore } from './store/tabStore';
import { Sidebar } from './components/layout/Sidebar';
import { WindowControls } from './components/layout/WindowControls';
import { TrayController } from './components/layout/TrayController';
import { TabBar } from './components/layout/TabBar';
import { TabContent } from './components/layout/TabContent';
import { GlobalClipboardMonitor } from './components/GlobalClipboardMonitor';
import { TOOLS } from './tools/registry';
import { useClipboardStore } from './store/clipboardStore';

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

const MainLayout = () => {
  const openTab = useTabStore(state => state.openTab);
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useClipboardStore(state => state.settings);

  // Sync URL -> Tab
  // This allows bookmarks, tray navigation, and redirects to work
  useEffect(() => {
    // If we are on root, do nothing or open default?
    // If we are on a tool path (including settings), ensure tab is open
    const tool = TOOLS.find(t => t.path === location.pathname);
    if (tool) {
      // Check if tab already exists to avoid unnecessary work
      const existingTab = tabs.find(t => t.toolId === tool.id);
      if (!existingTab) {
        // "openTab" handles switching if exists
        openTab(tool.id, tool.path, tool.name, tool.description);
      }
    }
  }, [location.pathname, openTab, tabs]);

  // Sync Tab -> URL
  // When active tab changes, update URL to match
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && location.pathname !== activeTab.path) {
      navigate(activeTab.path, { replace: true });
    }
  }, [activeTabId, tabs, location.pathname, navigate]);

  // Handle clear clipboard on quit
  useEffect(() => {
    const handleCheckClearClipboard = () => {
      if (settings.clearOnQuit) {
        // Clear system clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
      }
    };

    const removeListener = (window as any).ipcRenderer?.on('check-clear-clipboard-on-quit', handleCheckClearClipboard);
    return () => {
      if (removeListener) removeListener();
    };
  }, [settings.clearOnQuit]);

  return (
    <div className="flex-1 flex flex-col min-w-0 relative h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar />
        <div className="flex-1 min-h-0">
          <TabContent />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <Router>
      <GlobalClipboardMonitor />
      <TrayController />
      <div className="flex flex-col h-screen bg-app-gradient text-foreground overflow-hidden font-sans selection:bg-indigo-500/30">
        <WindowControls />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar with enhanced styling */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 flex flex-col min-w-0 relative">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Everything goes to MainLayout (Multi-Tab including Settings) */}
                <Route path="*" element={<MainLayout />} />
              </Routes>
            </Suspense>
          </main>
        </div>

        {/* Enhanced Footer/Status Bar */}
        <footer className="h-9 px-6 flex items-center justify-between text-[11px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-30 backdrop-blur-xl">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <span className="font-medium">Ready</span>
            </div>
            <div className="w-px h-4 bg-border-glass" />
            <span className="opacity-70">UTF-8</span>
          </div>
          <div className="flex items-center space-x-5">
            <span className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity font-medium">v0.2.0-beta</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
