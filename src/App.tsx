import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { WindowControls } from './components/layout/WindowControls';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { ToolPane } from './components/layout/ToolPane';
import { ToolPlaceholder } from './components/layout/ToolPlaceholder';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-app-gradient text-white overflow-hidden font-sans selection:bg-indigo-500/30">
        <WindowControls />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
            <DynamicIsland />

            <div className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/json-format" replace />} />
                <Route
                  path="/json-format"
                  element={
                    <ToolPane
                      title="JSON Formatter"
                      description="Prettify, minify and validate JSON data"
                    >
                      <ToolPlaceholder name="JSON Formatter" />
                    </ToolPane>
                  }
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
                  path="*"
                  element={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <h2 className="text-4xl font-black text-white/10 uppercase tracking-widest">Under Construction</h2>
                        <p className="text-white/40 mt-2">This tool is coming soon.</p>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>

        {/* Simple Footer/Status Bar */}
        <footer className="h-8 px-4 flex items-center justify-between text-[10px] text-white/20 border-t border-white/5 bg-black/40">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            <span>UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-white/40 cursor-pointer transition-colors">v0.1.0-alpha</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
