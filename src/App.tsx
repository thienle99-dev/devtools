import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { useTabStore } from './store/tabStore';
import { Sidebar } from './components/layout/Sidebar';
import { WindowControls } from './components/layout/WindowControls';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { TrayController } from './components/layout/TrayController';
import { TabBar } from './components/layout/TabBar';
import { TabContent } from './components/layout/TabContent';
import { TOOLS } from './tools/registry';

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

const MainLayout = () => {
  const { openTab, tabs, activeTabId } = useTabStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync URL -> Tab
  // This allows bookmarks, tray navigation, and redirects to work
  useEffect(() => {
    // If we are on root, do nothing or open default?
    // If we are on a tool path (including settings), ensure tab is open
    const tool = TOOLS.find(t => t.path === location.pathname);
    if (tool) {
      // "openTab" handles switching if exists
      openTab(tool.id, tool.path, tool.name, tool.description);
    }
  }, [location.pathname, openTab]);

  // Sync Tab -> URL
  // When active tab changes, update URL to match
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      if (location.pathname !== activeTab.path) {
        navigate(activeTab.path, { replace: true });
        // We use replace to prevent filling history with tab switches? 
        // Or push? Push is probably better for browser "Back" button support.
        // Let's use navigate(path) which defaults to push.
      }
    }
  }, [activeTabId, tabs, location.pathname, navigate]);

  return (
    <div className="flex-1 flex flex-col min-w-0 relative h-full">
      <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
        <DynamicIsland />
      </div>

      <div className="flex-1 flex flex-col pt-8 overflow-hidden">
        <TabBar />
        <TabContent />
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
      <TrayController />
      <div className="flex flex-col h-screen bg-app-gradient text-foreground overflow-hidden font-sans selection:bg-indigo-500/30">
        <WindowControls />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 relative">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Everything goes to MainLayout (Multi-Tab including Settings) */}
                <Route path="*" element={<MainLayout />} />
              </Routes>
            </Suspense>
          </main>
        </div>

        {/* Simple Footer/Status Bar */}
        <footer className="h-8 px-4 flex items-center justify-between text-[10px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            <span>UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">v0.2.0-beta</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
