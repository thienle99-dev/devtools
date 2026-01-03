import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { Sidebar } from './components/layout/Sidebar';
import { WindowControls } from './components/layout/WindowControls';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { TOOLS } from './tools/registry';

// Lazy load pages for better initial load performance
const SettingsPage = lazy(() => import('./pages/Settings'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

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
      <div className="flex flex-col h-screen bg-app-gradient text-foreground overflow-hidden font-sans selection:bg-indigo-500/30">
        <WindowControls />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 relative">
            <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
              <DynamicIsland />
            </div>

            <div className="flex-1 overflow-hidden pt-14">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/json-format" replace />} />

                  {/* Dynamic Tool Routes */}
                  {TOOLS.map((tool) => (
                    <Route
                      key={tool.id}
                      path={tool.path}
                      element={<tool.component />}
                    />
                  ))}

                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="*"
                    element={
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-4xl font-black text-foreground-muted uppercase tracking-widest">Under Construction</h2>
                          <p className="text-foreground-secondary mt-2">This tool is coming soon.</p>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>

        {/* Simple Footer/Status Bar */}
        <footer className="h-8 px-4 flex items-center justify-between text-[10px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)]">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            <span>UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">v0.1.0-alpha</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
