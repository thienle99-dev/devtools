import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './store/settingsStore';
import { Sidebar } from './components/layout/Sidebar';
import { WindowControls } from './components/layout/WindowControls';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { ToolPane } from './components/layout/ToolPane';
import { ToolPlaceholder } from './components/layout/ToolPlaceholder';
import { JsonFormatter } from './tools/json/JsonFormatter';

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

  // ... (keep useEffects same as before, I'm just showing the top part change)
  // Wait, I need to match the replacement block size. I'll replace the whole file head or just the imports and App definition start.
  // Let's replace the whole App function to safely wrap Routes in Suspense.

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
                  <Route
                    path="/json-format"
                    element={<JsonFormatter />}
                  />
                  <Route
                    path="/json-yaml"
                    element={
                      <ToolPane
                        title="JSON to YAML"
                        description="Convert between JSON and YAML formats"
                      >
                        <ToolPlaceholder name="JSON to YAML" />
                      </ToolPane>
                    }
                  />
                  <Route
                    path="/base64"
                    element={
                      <ToolPane
                        title="Base64 Converter"
                        description="Encode and decode Base64 strings"
                      >
                        <ToolPlaceholder name="Base64 Converter" />
                      </ToolPane>
                    }
                  />
                  <Route
                    path="/hash"
                    element={
                      <ToolPane
                        title="Hash Generator"
                        description="Generate various cryptographic hashes"
                      >
                        <ToolPlaceholder name="Hash Generator" />
                      </ToolPane>
                    }
                  />
                  <Route
                    path="/uuid"
                    element={
                      <ToolPane
                        title="UUID Generator"
                        description="Generate unique identifiers (UUIDs)"
                      >
                        <ToolPlaceholder name="UUID Generator" />
                      </ToolPane>
                    }
                  />

                  {/* Formatters */}
                  <Route
                    path="/sql-format"
                    element={
                      <ToolPane
                        title="SQL Formatter"
                        description="Prettify and format SQL queries"
                      >
                        <ToolPlaceholder name="SQL Formatter" />
                      </ToolPane>
                    }
                  />

                  {/* Web */}
                  <Route
                    path="/url"
                    element={
                      <ToolPane
                        title="URL Encoder/Decoder"
                        description="Encode and decode URLs"
                      >
                        <ToolPlaceholder name="URL Encoder/Decoder" />
                      </ToolPane>
                    }
                  />
                  <Route
                    path="/jwt"
                    element={
                      <ToolPane
                        title="JWT Decoder"
                        description="Parse and inspect JSON Web Tokens"
                      >
                        <ToolPlaceholder name="JWT Decoder" />
                      </ToolPane>
                    }
                  />

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
