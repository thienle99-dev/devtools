import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useToolStore } from '../store/toolStore';
import { ToolPane } from '../components/layout/ToolPane';
import { Card } from '../components/ui/Card';
import { Monitor, Type, WrapText, History, Trash2, Smartphone } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { fontSize, setFontSize, wordWrap, setWordWrap, theme, setTheme } = useSettingsStore();
    const { clearHistory } = useToolStore();

    return (
        <ToolPane
            title="Settings"
            description="Customize your experience and manage application preferences"
        >
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Appearance Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] flex items-center">
                        <Monitor className="w-3.5 h-3.5 mr-2" />
                        Appearance
                    </h3>
                    <Card className="p-1">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div>
                                <p className="text-sm font-semibold text-white/90">Theme</p>
                                <p className="text-xs text-white/40">Choose your preferred interface style</p>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                {(['light', 'dark', 'system'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${theme === t
                                            ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                                            : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold text-white/90">Font Size</p>
                                <p className="text-xs text-white/40">Adjust the editor text size</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-mono text-white/40">{fontSize}px</span>
                                <input
                                    type="range"
                                    min="10"
                                    max="24"
                                    step="1"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-32 accent-indigo-500 bg-white/5 rounded-lg appearance-none cursor-pointer h-1.5"
                                />
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Editor Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] flex items-center">
                        <Type className="w-3.5 h-3.5 mr-2" />
                        Editor
                    </h3>
                    <Card className="p-1">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <WrapText className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/90">Word Wrap</p>
                                    <p className="text-xs text-white/40">Wrap long lines in the editor panes</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setWordWrap(!wordWrap)}
                                className={`w-12 h-6 rounded-full transition-all relative ${wordWrap ? 'bg-indigo-500' : 'bg-white/10'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${wordWrap ? 'left-7' : 'left-1'
                                    } shadow-md`} />
                            </button>
                        </div>
                    </Card>
                </section>

                {/* Data Persistence Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] flex items-center">
                        <History className="w-3.5 h-3.5 mr-2" />
                        Data & Persistence
                    </h3>
                    <Card className="p-1 overflow-hidden border-rose-500/10">
                        <div className="flex items-center justify-between p-4 bg-rose-500/5">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-rose-400">Clear All History</p>
                                    <p className="text-[11px] text-rose-400/40">Remove all tool usage history and stored inputs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                                        clearHistory();
                                    }
                                }}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 transition-all active:scale-95"
                            >
                                Clear Now
                            </button>
                        </div>
                    </Card>
                </section>

                {/* System Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] flex items-center">
                        <Smartphone className="w-3.5 h-3.5 mr-2" />
                        System Information
                    </h3>
                    <Card className="p-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Version</p>
                            <p className="text-sm text-white font-mono">0.1.0-alpha</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Platform</p>
                            <p className="text-sm text-white capitalize font-mono">
                                {(window as any).ipcRenderer?.process?.platform || 'unknown'}
                            </p>
                        </div>
                    </Card>
                </section>
            </div>
        </ToolPane>
    );
};

export default SettingsPage;
