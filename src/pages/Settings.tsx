import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useToolStore } from '../store/toolStore';
import { ToolPane } from '../components/layout/ToolPane';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Radio } from '../components/ui/Radio';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Monitor, Type, WrapText, History, Trash2, Smartphone, Keyboard, Sun, Moon, Laptop } from 'lucide-react';
import { CATEGORIES, getToolsByCategory } from '../tools/registry';

interface SettingsPageProps {
    tabId?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
    const {
        fontSize, setFontSize,
        wordWrap, setWordWrap,
        theme, setTheme,
        minimizeToTray, setMinimizeToTray,
        startMinimized, setStartMinimized
    } = useSettingsStore();
    const { clearHistory } = useToolStore();

    return (
        <ToolPane
            title="Settings"
            description="Customize your experience and manage application preferences"
        >
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Appearance Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
                        <Monitor className="w-3.5 h-3.5 mr-2" />
                        Appearance
                    </h3>
                    <Card className="p-1">
                        <div className="flex items-center justify-between p-4 border-b border-border-glass">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Theme</p>
                                <p className="text-xs text-foreground-muted">Choose your preferred interface style</p>
                            </div>
                            <div className="flex bg-[var(--color-glass-input)] p-1 rounded-xl border border-border-glass">
                                {[
                                    { id: 'light', icon: Sun, label: 'Light' },
                                    { id: 'dark', icon: Moon, label: 'Dark' },
                                    { id: 'system', icon: Laptop, label: 'System' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id as any)}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${theme === t.id
                                            ? 'bg-bg-glass-hover text-foreground shadow-lg shadow-black/5'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button-hover)]'
                                            }`}
                                    >
                                        <t.icon className="w-3.5 h-3.5" />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Font Size</p>
                                <p className="text-xs text-foreground-muted">Adjust the editor text size</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Input
                                    type="number"
                                    min="10"
                                    max="24"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                                    className="w-24 font-mono text-center"
                                />
                                <span className="text-xs font-mono text-foreground-muted">px</span>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Editor Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
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
                                    <p className="text-sm font-semibold text-foreground">Word Wrap</p>
                                    <p className="text-xs text-foreground-muted">Wrap long lines in the editor panes</p>
                                </div>
                            </div>
                            <Switch
                                checked={wordWrap}
                                onChange={(e) => setWordWrap(e.target.checked)}
                            />
                        </div>
                    </Card>
                </section>

                {/* Data Persistence Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
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
                                    <p className="text-[11px] text-rose-400/60">Remove all tool usage history and stored inputs</p>
                                </div>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                                        clearHistory();
                                    }
                                }}
                            >
                                Clear Now
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* System Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
                        <Smartphone className="w-3.5 h-3.5 mr-2" />
                        System Information
                    </h3>
                    <Card className="p-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-foreground-muted uppercase font-black tracking-widest mb-1">Version</p>
                            <p className="text-sm text-foreground font-mono">0.1.0-alpha</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-foreground-muted uppercase font-black tracking-widest mb-1">Platform</p>
                            <p className="text-sm text-foreground capitalize font-mono">
                                {(window as any).ipcRenderer?.process?.platform || 'unknown'}
                            </p>
                        </div>
                    </Card>
                </section>

                {/* Tool Shortcuts Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
                        <Keyboard className="w-3.5 h-3.5 mr-2" />
                        Tool Shortcuts
                    </h3>
                    <Card className="p-1">
                        <div className="flex flex-col">
                            {CATEGORIES.map(category => {
                                const categoryTools = getToolsByCategory(category.id);
                                if (categoryTools.length === 0) return null;

                                return (
                                    <div key={category.id} className="border-b border-border-glass last:border-0">
                                        <div className="px-4 py-2 bg-[var(--color-glass-input)]/50 text-xs font-bold text-foreground-muted uppercase tracking-wider">
                                            {category.name}
                                        </div>
                                        <div>
                                            {categoryTools.map(tool => {
                                                const currentShortcut = useSettingsStore.getState().toolShortcuts[tool.id] || tool.shortcut || '';

                                                return (
                                                    <div key={tool.id} className="flex items-center justify-between p-3 hover:bg-[var(--color-glass-button)] transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-[var(--color-glass-button)] rounded-md">
                                                                <tool.icon className="w-4 h-4 text-foreground-secondary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">{tool.name}</p>
                                                                <p className="text-[10px] text-foreground-muted truncate max-w-[200px]">{tool.description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="text"
                                                                value={currentShortcut}
                                                                placeholder="None"
                                                                className="w-32 text-right font-mono"
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    useSettingsStore.getState().setToolShortcut(tool.id, val || null);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </section>

                {/* System Tray Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
                        <Monitor className="w-3.5 h-3.5 mr-2" />
                        System Tray
                    </h3>
                    <Card className="p-1">
                        <div className="flex items-center justify-between p-4 border-b border-border-glass">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Minimize to Tray</p>
                                <p className="text-xs text-foreground-muted">Keep app running in tray when closed</p>
                            </div>
                            <Switch
                                checked={minimizeToTray}
                                onChange={(e) => setMinimizeToTray(e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Start Minimized</p>
                                <p className="text-xs text-foreground-muted">Launch app silently to tray</p>
                            </div>
                            <Switch
                                checked={startMinimized}
                                onChange={(e) => setStartMinimized(e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-border-glass">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Launch at Login</p>
                                <p className="text-xs text-foreground-muted">Automatically open app when you log in</p>
                            </div>
                            <Switch
                                checked={useSettingsStore.getState().launchAtLogin}
                                onChange={(e) => useSettingsStore.getState().setLaunchAtLogin(e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-border-glass">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Global Shortcut</p>
                                <p className="text-xs text-foreground-muted">Toggle window visibility</p>
                            </div>
                            <div className="flex bg-[var(--color-glass-input)] px-3 py-1.5 rounded-lg border border-border-glass">
                                <kbd className="text-xs font-mono font-bold text-foreground">
                                    {(window as any).ipcRenderer?.process?.platform === 'darwin' ? 'Cmd' : 'Ctrl'} + Shift + D
                                </kbd>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </ToolPane>
    );
};

export default SettingsPage;
