import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useTabStore } from '@store/tabStore';
import { Sidebar } from '@components/layout/Sidebar';
import { WindowControls } from '@components/layout/WindowControls';
import { TrayController } from '@components/layout/TrayController';
import { TabBar } from '@components/layout/TabBar';
import { TabContent } from '@components/layout/TabContent';
import { GlobalClipboardMonitor } from '@components/GlobalClipboardMonitor';
import { AppErrorBoundary } from '@components/layout/AppErrorBoundary';
import { CommandPalette } from '@components/CommandPalette';
import { TOOLS } from '@tools/registry';
import { useClipboardStore } from '@store/clipboardStore';
import { useResponsive } from '@hooks/useResponsive';
import { Footer } from '@components/layout/Footer';
import { preloadHeavyModules } from '@utils/lazyLoad';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@store/onboardingStore';
import { WelcomeTour } from '@components/onboarding/WelcomeTour';
import { TaskQueue } from '@components/layout/TaskQueue';

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center bg-background/30 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-xl bg-indigo-500/20 border border-indigo-500/30 animate-pulse" />
        <div className="absolute inset-2 rounded-lg bg-indigo-500 animate-[spin_2s_linear_infinite]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">Initializing...</span>
    </motion.div>
  </div>
);

const MainLayout = React.memo(() => {
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useClipboardStore(state => state.settings);

  // Sync URL -> Tab
  useEffect(() => {
    const { tabs, activeTabId, openTab, setActiveTab } = useTabStore.getState();

    const tool = TOOLS.find(t => t.path === location.pathname);

    if (tool) {
      if (tool.id === 'dashboard') {
          if (activeTabId) {
              setActiveTab(null);
          }
          return;
      }

      const existingTab = tabs.find(t => t.toolId === tool.id);
      if (!existingTab) {
        openTab(tool.id, tool.path, tool.name, tool.description, false, false);
      } else {
        if (existingTab.id !== activeTabId) {
             setActiveTab(existingTab.id);
        }
      }
    } else if (location.pathname === '/' || location.pathname === '/dashboard') {
         if (activeTabId) setActiveTab(null);
    }
  }, [location.pathname]);

  // When all tabs are closed, redirect to dashboard
  useEffect(() => {
    if (tabs.length === 0 && location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  }, [tabs.length, location.pathname, navigate]);

  // Sync Tab -> URL
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
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => { });
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar />
        <div className="flex-1 min-h-0">
          <TabContent />
        </div>
      </div>
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

function App() {
  const { theme, layoutMode, accentColor, glassIntensity, blurEnabled } = useSettingsStore();
  const responsive = useResponsive();

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-layout', layoutMode);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--glass-intensity', glassIntensity.toString());
    root.classList.toggle('blur-disabled', !blurEnabled);
  }, [layoutMode, accentColor, glassIntensity, blurEnabled]);

  // Auto-collapse sidebar on mobile/tablet
  useEffect(() => {
    if (responsive.isMobile) {
      useSettingsStore.getState().setSidebarOpen(false);
    }
  }, [responsive.isMobile]);

  // Phase 2: Preload heavy modules on idle for better UX
  useEffect(() => {
    preloadHeavyModules();
  }, []);

  const { hasCompletedOnboarding, startTour } = useOnboardingStore();

  useEffect(() => {
     if (!hasCompletedOnboarding) {
        startTour();
     }
  }, [hasCompletedOnboarding, startTour]);

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

  // Global Sidebar Toggle Shortcut (Cmd+B / Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Cmd+B (Mac) or Ctrl+B (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        useSettingsStore.getState().toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

        // If matched - keyboard shortcuts should activate immediately (not preview)
        e.preventDefault();
        openTab(tool.id, tool.path, tool.name, tool.description, false, false);
        return; // Handle only one
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // const { isMac } = usePlatform();

  return (
    <Router>
      <GlobalClipboardMonitor />
      <TrayController />
      <CommandPalette />
      <WelcomeTour />
      <TaskQueue />
      <AppErrorBoundary>
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

          {/* Enhanced Footer/Status Bar - Responsive */}
          <Footer />
        </div>
      </AppErrorBoundary>
    </Router>
  );
}

export default App;

