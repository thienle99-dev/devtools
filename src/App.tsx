import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@components/layout/Sidebar';
import { WindowControls } from '@components/layout/WindowControls';
import { TrayController } from '@components/layout/TrayController';
import { TabBar } from '@components/layout/TabBar';
import { TabContent } from '@components/layout/TabContent';
import { GlobalClipboardMonitor } from '@components/GlobalClipboardMonitor';
import { AppErrorBoundary } from '@components/layout/AppErrorBoundary';
import { CommandPalette } from '@components/CommandPalette';
import { useClipboardStore } from '@store/clipboardStore';
import { Footer } from '@components/layout/Footer';
import { WelcomeTour } from '@components/onboarding/WelcomeTour';
import { TaskQueue } from '@components/layout/TaskQueue';

// New specialized hooks
import { useThemeSync } from '@hooks/useThemeSync';
import { useToolNavigation } from '@hooks/useToolNavigation';
import { useGlobalShortcuts } from '@hooks/useGlobalShortcuts';
import { useAppInitialization } from '@hooks/useAppInitialization';

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center bg-background/30 backdrop-blur-sm">
    <div 
      className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-xl bg-indigo-500/20 border border-indigo-500/30 animate-pulse" />
        <div className="absolute inset-2 rounded-lg bg-indigo-500 animate-[spin_2s_linear_infinite]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">Initializing...</span>
    </div>
  </div>
);

const MainLayout = React.memo(() => {
  useToolNavigation();
  
  const settings = useClipboardStore(state => state.settings);

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
  useThemeSync();
  useGlobalShortcuts();
  useAppInitialization();

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
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 relative">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="*" element={<MainLayout />} />
                </Routes>
              </Suspense>
            </main>
          </div>

          <Footer />
        </div>
      </AppErrorBoundary>
    </Router>
  );
}

export default App;

