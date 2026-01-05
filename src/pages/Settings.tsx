import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useToolStore } from '../store/toolStore';
import { usePermissionsStore } from '../store/permissionsStore';
import { ToolPane } from '../components/layout/ToolPane';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Monitor, Type, WrapText, History, Trash2, Smartphone, Keyboard, Sun, Moon, Laptop, Shield, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { CATEGORIES, getToolsByCategory } from '../tools/registry';
import { toast } from 'sonner';

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
    const {
        permissions,
        isLoading,
        checkAllPermissions,
        checkPermission,
        testPermission,
        openSystemPreferences,
    } = usePermissionsStore();

    const platform = (window as any).ipcRenderer?.process?.platform || 'unknown';

    // Check permissions on mount
    useEffect(() => {
        checkAllPermissions();
    }, [checkAllPermissions]);

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
                                {platform}
                            </p>
                        </div>
                    </Card>
                </section>

                {/* Permissions Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-foreground-muted uppercase tracking-[0.2em] flex items-center">
                            <Shield className="w-3.5 h-3.5 mr-2" />
                            Permissions
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                checkAllPermissions();
                                toast.success('Refreshing permissions...');
                            }}
                            disabled={isLoading}
                            className="text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                    <Card className="p-1">
                        {/* macOS Permissions */}
                        {platform === 'darwin' && (
                            <>
                                <PermissionItem
                                    name="Accessibility"
                                    description="Required for global keyboard shortcuts (Cmd+Shift+D, Cmd+Shift+C)"
                                    permissionKey="accessibility"
                                    permission={permissions.accessibility}
                                    onCheck={() => checkPermission('accessibility')}
                                    onTest={() => {
                                        testPermission('accessibility');
                                        toast.info('Testing accessibility permission...');
                                    }}
                                    onRequest={() => {
                                        openSystemPreferences('accessibility');
                                        toast.info('Opening System Preferences...');
                                    }}
                                />
                                <PermissionItem
                                    name="Full Disk Access"
                                    description="Required for System Cleaner to scan and delete files"
                                    permissionKey="fullDiskAccess"
                                    permission={permissions.fullDiskAccess}
                                    onCheck={() => checkPermission('fullDiskAccess')}
                                    onTest={() => {
                                        testPermission('fullDiskAccess');
                                        toast.info('Testing full disk access...');
                                    }}
                                    onRequest={() => {
                                        openSystemPreferences('full-disk-access');
                                        toast.info('Opening System Preferences...');
                                    }}
                                />
                                <PermissionItem
                                    name="Screen Recording"
                                    description="Required for Screenshot tool to capture screen"
                                    permissionKey="screenRecording"
                                    permission={permissions.screenRecording}
                                    onCheck={() => checkPermission('screenRecording')}
                                    onTest={() => {
                                        testPermission('screenRecording');
                                        toast.info('Testing screen recording permission...');
                                    }}
                                    onRequest={() => {
                                        openSystemPreferences('screen-recording');
                                        toast.info('Opening System Preferences...');
                                    }}
                                />
                            </>
                        )}

                        {/* Windows Permissions */}
                        {platform === 'win32' && (
                            <>
                                <PermissionItem
                                    name="File System Access"
                                    description="Required for System Cleaner to read and write files"
                                    permissionKey="fileAccess"
                                    permission={permissions.fileAccess}
                                    onCheck={() => checkPermission('fileAccess')}
                                    onTest={async () => {
                                        await testPermission('fileAccess');
                                        toast.info('Testing file access...');
                                    }}
                                    onRequest={() => {
                                        openSystemPreferences();
                                        toast.info('Opening Windows Settings...');
                                    }}
                                />
                                <PermissionItem
                                    name="Registry Access"
                                    description="Required for System Cleaner to read registry entries"
                                    permissionKey="registryAccess"
                                    permission={permissions.registryAccess}
                                    onCheck={() => checkPermission('registryAccess')}
                                    onTest={() => {
                                        testPermission('registryAccess');
                                        toast.info('Testing registry access...');
                                    }}
                                    onRequest={() => {
                                        openSystemPreferences();
                                        toast.info('Opening Windows Settings...');
                                    }}
                                />
                            </>
                        )}

                        {/* Common Permissions */}
                        <PermissionItem
                            name="Clipboard Access"
                            description="Required for Clipboard Manager to read and write clipboard content"
                            permissionKey="clipboard"
                            permission={permissions.clipboard}
                            onCheck={() => checkPermission('clipboard')}
                            onTest={async () => {
                                await testPermission('clipboard');
                                toast.info('Testing clipboard access...');
                            }}
                            onRequest={() => {
                                openSystemPreferences();
                                toast.info('Opening system settings...');
                            }}
                        />
                        <PermissionItem
                            name="Launch at Login"
                            description="Required to automatically start app when you log in"
                            permissionKey="launchAtLogin"
                            permission={permissions.launchAtLogin}
                            onCheck={() => checkPermission('launchAtLogin')}
                            onTest={() => {
                                testPermission('launchAtLogin');
                                toast.info('Checking launch at login permission...');
                            }}
                            onRequest={() => {
                                openSystemPreferences();
                                toast.info('Opening system settings...');
                            }}
                        />
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

// Permission Item Component
interface PermissionItemProps {
    name: string;
    description: string;
    permissionKey: string;
    permission?: { status: string; message?: string };
    onCheck: () => void;
    onTest: () => void;
    onRequest: () => void;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
    name,
    description,
    permission,
    onCheck,
    onTest,
    onRequest,
}) => {
    const status = permission?.status || 'not-determined';
    const isLoading = status === 'loading';

    const getStatusIcon = () => {
        if (isLoading) {
            return <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />;
        }
        switch (status) {
            case 'granted':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'denied':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'not-determined':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case 'not-applicable':
                return <AlertCircle className="w-4 h-4 text-foreground-muted" />;
            default:
                return <AlertCircle className="w-4 h-4 text-foreground-muted" />;
        }
    };

    const getStatusText = () => {
        if (isLoading) return 'Checking...';
        switch (status) {
            case 'granted':
                return 'Granted';
            case 'denied':
                return 'Denied';
            case 'not-determined':
                return 'Not Determined';
            case 'not-applicable':
                return 'N/A';
            case 'error':
                return 'Error';
            default:
                return 'Unknown';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'granted':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'denied':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'not-determined':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default:
                return 'bg-foreground-muted/10 text-foreground-muted border-border-glass';
        }
    };

    // Determine request button state and text based on permission status
    const getRequestButtonConfig = () => {
        switch (status) {
            case 'granted':
                return {
                    text: 'Granted',
                    variant: 'ghost' as const,
                    disabled: true,
                    className: 'text-xs text-green-500 cursor-not-allowed',
                    showIcon: false,
                };
            case 'denied':
                return {
                    text: 'Request Permission',
                    variant: 'primary' as const,
                    disabled: isLoading,
                    className: 'text-xs',
                    showIcon: true,
                };
            case 'not-determined':
                return {
                    text: 'Request Permission',
                    variant: 'primary' as const,
                    disabled: isLoading,
                    className: 'text-xs',
                    showIcon: true,
                };
            case 'not-applicable':
                return {
                    text: 'N/A',
                    variant: 'ghost' as const,
                    disabled: true,
                    className: 'text-xs text-foreground-muted cursor-not-allowed',
                    showIcon: false,
                };
            default:
                return {
                    text: 'Request Permission',
                    variant: 'primary' as const,
                    disabled: isLoading,
                    className: 'text-xs',
                    showIcon: true,
                };
        }
    };

    const requestButtonConfig = getRequestButtonConfig();

    return (
        <div className="flex items-start justify-between p-4 border-b border-border-glass last:border-0 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 bg-indigo-500/10 rounded-lg mt-0.5 shrink-0">
                    <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getStatusColor()}`}>
                            {getStatusIcon()}
                            <span>{getStatusText()}</span>
                        </div>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">{description}</p>
                    {permission?.message && (
                        <p className="text-[10px] text-foreground-muted mt-1.5 italic">{permission.message}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCheck}
                    disabled={isLoading || status === 'loading'}
                    className="text-xs h-8 px-3"
                >
                    Check
                </Button>
                {status !== 'granted' && status !== 'not-applicable' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onTest}
                        disabled={isLoading || status === 'loading'}
                        className="text-xs h-8 px-3"
                    >
                        Test
                    </Button>
                )}
                <Button
                    variant={requestButtonConfig.variant}
                    size="sm"
                    onClick={onRequest}
                    disabled={requestButtonConfig.disabled}
                    className={`h-8 px-3 ${requestButtonConfig.className}`}
                >
                    {requestButtonConfig.showIcon && status !== 'granted' && (
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                    )}
                    {requestButtonConfig.text}
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;
