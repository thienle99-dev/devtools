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
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Global Tool Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused (unless it's a special global shortcut?)
      // Actually usually "Quick Open" shortcuts should work even if focused, or maybe check modifiers.
      // E.g. Ctrl/Cmd+Shift... is unlikely to conflict with text input except specific editor commands.
      // Let's rely on modifiers being present.

      const { toolShortcuts } = useSettingsStore.getState();
      const { openTab, tabs, activeTabId, setActiveTab, closeTab } = useTabStore.getState();

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const eventHasPrimary = isMac ? e.metaKey : e.ctrlKey;

      // --- Navigation Shortcuts ---

      // Close Tab: Ctrl+W (Win) or Cmd+W (Mac)
      if (eventHasPrimary && e.key.toLowerCase() === 'w' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (activeTabId && tabs.length > 0) {
            closeTab(activeTabId);
        }
        return;
      }

      // Cycle Tabs: Ctrl+Tab (Next) or Ctrl+Shift+Tab (Prev)
      // Note: Browsers might trap Ctrl+Tab. In Electron renderer it usually bubbles if not handled by menu.
      if (e.ctrlKey && e.key === 'Tab') { // Standard is Ctrl+Tab even on Mac often, or Cmd+Option+Right? Let's stick to Control+Tab for now like VSCode
         // Actually on Mac VSCode uses Ctrl+Tab too.
         e.preventDefault();
         const currentIndex = tabs.findIndex(t => t.id === activeTabId);
         if (currentIndex === -1) return;

         if (e.shiftKey) {
            // Previous
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[prevIndex].id);
         } else {
            // Next
            const nextIndex = (currentIndex + 1) % tabs.length;
            setActiveTab(tabs[nextIndex].id);
         }
         return;
      }

      // Switch by Number: Ctrl+1..9
      if (eventHasPrimary && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '9') {
         e.preventDefault();
         const index = parseInt(e.key) - 1;
         if (index < tabs.length) {
             setActiveTab(tabs[index].id);
         } else if (e.key === '9' && tabs.length > 0) {
             // Ctrl+9 often goes to last tab
             setActiveTab(tabs[tabs.length - 1].id);
         }
         return;
      }

      // --- Tool Shortcuts ---

      for (const tool of TOOLS) {
        const shortcut = toolShortcuts[tool.id] || tool.shortcut;
        if (!shortcut) continue;

        const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
        const key = parts[parts.length - 1];
        const modifiers = parts.slice(0, parts.length - 1);

        const eventKey = e.key.toLowerCase();
        
        // Check key match
        if (eventKey !== key) continue;

        // Check modifiers
        // We'll treat "Ctrl" in the config as "Primary Modifier" (Cmd on Mac, Ctrl on Win)
        const configHasCtrl = modifiers.some(m => ['ctrl', 'cmd', 'command', 'control'].includes(m));
        const configHasShift = modifiers.includes('shift');
        const configHasAlt = modifiers.includes('alt') || modifiers.includes('option');
        // We generally ignore specific Meta unless it's the primary modifier on Mac

        // const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0; // Moved up
        // const eventHasPrimary = isMac ? e.metaKey : e.ctrlKey; // Moved up
        
        if (configHasCtrl !== eventHasPrimary) continue;
        if (configHasShift !== e.shiftKey) continue;
        if (configHasAlt !== e.altKey) continue;

        // If matched
        e.preventDefault();
        openTab(tool.id, tool.path, tool.name, tool.description);
        return; // Handle only one
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
