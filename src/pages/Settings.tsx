import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useToolStore } from '../store/toolStore';
import { usePermissionsStore } from '../store/permissionsStore';
import { ToolPane } from '../components/layout/ToolPane';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Monitor, WrapText, Sun, Moon, Laptop, Shield, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Bell, Download, Upload, RotateCcw, Info, Github, Zap, Trash2, Settings as SettingsIcon, Database, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

interface SettingsPageProps {
    tabId?: string;
}

type SettingsTab = 'general' | 'permissions' | 'notifications' | 'window' | 'performance' | 'data' | 'about';

const SettingsPage: React.FC<SettingsPageProps> = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const {
        fontSize, setFontSize,
        wordWrap, setWordWrap,
        theme, setTheme,
        notificationsEnabled, setNotificationsEnabled,
        notificationSound, setNotificationSound,
        toastDuration, setToastDuration,
        notifyOnScanComplete, setNotifyOnScanComplete,
        notifyOnCleanupComplete, setNotifyOnCleanupComplete,
        notifyOnErrors, setNotifyOnErrors,
        windowOpacity, setWindowOpacity,
        alwaysOnTop, setAlwaysOnTop,
        rememberWindowPosition, setRememberWindowPosition,
        animationSpeed, setAnimationSpeed,
        reduceMotion, setReduceMotion,
        enableAnimations, setEnableAnimations,
        lazyLoading, setLazyLoading,
        memoryLimit, setMemoryLimit,
        backgroundProcessing, setBackgroundProcessing,
        autoBackup, setAutoBackup,
        backupRetentionDays, setBackupRetentionDays,
        exportSettings, importSettings, resetToDefaults,
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

    const tabs = [
        { id: 'general' as const, label: 'General', icon: SettingsIcon },
        { id: 'permissions' as const, label: 'Permissions', icon: Shield },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'window' as const, label: 'Window', icon: Monitor },
        { id: 'performance' as const, label: 'Performance', icon: Zap },
        { id: 'data' as const, label: 'Data', icon: Database },
        { id: 'about' as const, label: 'About', icon: Info },
    ];

    return (
        <ToolPane
            title="Settings"
            description="Customize your experience and manage application preferences"
        >
            <div className="flex h-full">
                {/* Sidebar Tabs */}
                <div className="w-48 border-r border-border-glass bg-glass-panel/30 p-2 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {activeTab === 'general' && <GeneralTab {...{ fontSize, setFontSize, wordWrap, setWordWrap, theme, setTheme }} />}
                        {activeTab === 'permissions' && <PermissionsTab {...{ permissions, isLoading, checkAllPermissions, checkPermission, testPermission, openSystemPreferences, platform }} />}
                        {activeTab === 'notifications' && <NotificationsTab {...{ notificationsEnabled, setNotificationsEnabled, notificationSound, setNotificationSound, toastDuration, setToastDuration, notifyOnScanComplete, setNotifyOnScanComplete, notifyOnCleanupComplete, setNotifyOnCleanupComplete, notifyOnErrors, setNotifyOnErrors }} />}
                        {activeTab === 'window' && <WindowTab {...{ windowOpacity, setWindowOpacity, alwaysOnTop, setAlwaysOnTop, rememberWindowPosition, setRememberWindowPosition, animationSpeed, setAnimationSpeed, reduceMotion, setReduceMotion }} />}
                        {activeTab === 'performance' && <PerformanceTab {...{ enableAnimations, setEnableAnimations, lazyLoading, setLazyLoading, memoryLimit, setMemoryLimit, backgroundProcessing, setBackgroundProcessing }} />}
                        {activeTab === 'data' && <DataTab {...{ autoBackup, setAutoBackup, backupRetentionDays, setBackupRetentionDays, exportSettings, importSettings, resetToDefaults, clearHistory }} />}
                        {activeTab === 'about' && <AboutTab platform={platform} />}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

// General Tab
const GeneralTab: React.FC<any> = ({ fontSize, setFontSize, wordWrap, setWordWrap, theme, setTheme }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">General Settings</h2>

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
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
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
    </div>
);

// Permissions Tab
const PermissionsTab: React.FC<any> = ({ permissions, isLoading, checkAllPermissions, checkPermission, testPermission, openSystemPreferences, platform }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Permissions</h2>
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
            <PermissionItem
                name="Process Management"
                description="Required for Application Manager to view and kill running processes"
                permissionKey="processManagement"
                permission={permissions.processManagement || { status: 'unknown', message: 'Not checked yet' }}
                onCheck={() => checkPermission('processManagement')}
                onTest={() => {
                    testPermission('processManagement');
                    toast.info('Testing process management permission...');
                }}
                onRequest={() => {
                    openSystemPreferences();
                    toast.info('Opening system settings...');
                }}
            />
            {platform === 'darwin' && (
                <PermissionItem
                    name="Application Uninstall"
                    description="Required for Application Manager to uninstall applications (may require admin password)"
                    permissionKey="appUninstall"
                    permission={permissions.appUninstall || { status: 'unknown', message: 'Not checked yet' }}
                    onCheck={() => checkPermission('appUninstall')}
                    onTest={() => {
                        testPermission('appUninstall');
                        toast.info('Testing app uninstall permission...');
                    }}
                    onRequest={() => {
                        openSystemPreferences();
                        toast.info('Opening system settings...');
                    }}
                />
            )}
        </Card>
    </div>
);

// Notifications Tab
const NotificationsTab: React.FC<any> = ({ notificationsEnabled, setNotificationsEnabled, notificationSound, setNotificationSound, toastDuration, setToastDuration, notifyOnScanComplete, setNotifyOnScanComplete, notifyOnCleanupComplete, setNotifyOnCleanupComplete, notifyOnErrors, setNotifyOnErrors }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Notifications & Alerts</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Enable Notifications</p>
                    <p className="text-xs text-foreground-muted">Show system notifications and toasts</p>
                </div>
                <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notification Sound</p>
                    <p className="text-xs text-foreground-muted">Play sound when notifications appear</p>
                </div>
                <Switch
                    checked={notificationSound}
                    onChange={(e) => setNotificationSound(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Toast Duration</p>
                    <p className="text-xs text-foreground-muted">How long toasts stay visible (ms)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="1000"
                        max="10000"
                        step="500"
                        value={toastDuration}
                        onChange={(e) => setToastDuration(parseInt(e.target.value) || 3000)}
                        className="w-24 font-mono text-center"
                        disabled={!notificationsEnabled}
                    />
                    <span className="text-xs font-mono text-foreground-muted">ms</span>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Scan Complete</p>
                    <p className="text-xs text-foreground-muted">Show notification when scan finishes</p>
                </div>
                <Switch
                    checked={notifyOnScanComplete}
                    onChange={(e) => setNotifyOnScanComplete(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Cleanup Complete</p>
                    <p className="text-xs text-foreground-muted">Show notification when cleanup finishes</p>
                </div>
                <Switch
                    checked={notifyOnCleanupComplete}
                    onChange={(e) => setNotifyOnCleanupComplete(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Errors</p>
                    <p className="text-xs text-foreground-muted">Show notification when errors occur</p>
                </div>
                <Switch
                    checked={notifyOnErrors}
                    onChange={(e) => setNotifyOnErrors(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
        </Card>
    </div>
);

// Window Tab
const WindowTab: React.FC<any> = ({ windowOpacity, setWindowOpacity, alwaysOnTop, setAlwaysOnTop, rememberWindowPosition, setRememberWindowPosition, animationSpeed, setAnimationSpeed, reduceMotion, setReduceMotion }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Window & Behavior</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Window Opacity</p>
                    <p className="text-xs text-foreground-muted">Adjust window transparency (0.5 - 1.0)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="0.5"
                        max="1.0"
                        step="0.1"
                        value={windowOpacity}
                        onChange={(e) => setWindowOpacity(parseFloat(e.target.value) || 1.0)}
                        className="w-24 font-mono text-center"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Always on Top</p>
                    <p className="text-xs text-foreground-muted">Keep window above other applications</p>
                </div>
                <Switch
                    checked={alwaysOnTop}
                    onChange={(e) => setAlwaysOnTop(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Remember Window Position</p>
                    <p className="text-xs text-foreground-muted">Restore window position on startup</p>
                </div>
                <Switch
                    checked={rememberWindowPosition}
                    onChange={(e) => setRememberWindowPosition(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Animation Speed</p>
                    <p className="text-xs text-foreground-muted">Control UI animation speed</p>
                </div>
                <div className="flex bg-[var(--color-glass-input)] p-1 rounded-xl border border-border-glass">
                    {(['fast', 'normal', 'slow'] as const).map((speed) => (
                        <button
                            key={speed}
                            onClick={() => setAnimationSpeed(speed)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${animationSpeed === speed
                                ? 'bg-bg-glass-hover text-foreground shadow-lg shadow-black/5'
                                : 'text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button-hover)]'
                                }`}
                        >
                            {speed}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Reduce Motion</p>
                    <p className="text-xs text-foreground-muted">Disable animations for accessibility</p>
                </div>
                <Switch
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                />
            </div>
        </Card>
    </div>
);

// Performance Tab
const PerformanceTab: React.FC<any> = ({ enableAnimations, setEnableAnimations, lazyLoading, setLazyLoading, memoryLimit, setMemoryLimit, backgroundProcessing, setBackgroundProcessing }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Performance</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Enable Animations</p>
                    <p className="text-xs text-foreground-muted">Enable UI animations and transitions</p>
                </div>
                <Switch
                    checked={enableAnimations}
                    onChange={(e) => setEnableAnimations(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Lazy Loading</p>
                    <p className="text-xs text-foreground-muted">Load components on demand for better performance</p>
                </div>
                <Switch
                    checked={lazyLoading}
                    onChange={(e) => setLazyLoading(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Memory Limit</p>
                    <p className="text-xs text-foreground-muted">Maximum memory usage (MB)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="256"
                        max="2048"
                        step="128"
                        value={memoryLimit}
                        onChange={(e) => setMemoryLimit(parseInt(e.target.value) || 512)}
                        className="w-24 font-mono text-center"
                    />
                    <span className="text-xs font-mono text-foreground-muted">MB</span>
                </div>
            </div>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Background Processing</p>
                    <p className="text-xs text-foreground-muted">Process tasks in background</p>
                </div>
                <Switch
                    checked={backgroundProcessing}
                    onChange={(e) => setBackgroundProcessing(e.target.checked)}
                />
            </div>
        </Card>
    </div>
);

// Data Tab
const DataTab: React.FC<any> = ({ autoBackup, setAutoBackup, backupRetentionDays, setBackupRetentionDays, exportSettings, importSettings, resetToDefaults, clearHistory }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Data Management</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Auto Backup</p>
                    <p className="text-xs text-foreground-muted">Automatically backup settings</p>
                </div>
                <Switch
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Backup Retention</p>
                    <p className="text-xs text-foreground-muted">Days to keep backups</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="1"
                        max="365"
                        value={backupRetentionDays}
                        onChange={(e) => setBackupRetentionDays(parseInt(e.target.value) || 30)}
                        className="w-24 font-mono text-center"
                    />
                    <span className="text-xs font-mono text-foreground-muted">days</span>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Download className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Export Settings</p>
                        <p className="text-xs text-foreground-muted">Download settings as JSON file</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const json = exportSettings();
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Settings exported successfully');
                    }}
                >
                    <Download className="w-3 h-3 mr-1.5" />
                    Export
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Upload className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Import Settings</p>
                        <p className="text-xs text-foreground-muted">Load settings from JSON file</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const json = event.target?.result as string;
                                    if (importSettings(json)) {
                                        toast.success('Settings imported successfully');
                                    } else {
                                        toast.error('Failed to import settings. Invalid file format.');
                                    }
                                };
                                reader.readAsText(file);
                            }
                        };
                        input.click();
                    }}
                >
                    <Upload className="w-3 h-3 mr-1.5" />
                    Import
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass bg-rose-500/5">
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
                            toast.success('History cleared');
                        }
                    }}
                >
                    Clear Now
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 overflow-hidden border-rose-500/10">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-rose-400">Reset to Defaults</p>
                        <p className="text-[11px] text-rose-400/60">Restore all settings to default values</p>
                    </div>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                            resetToDefaults();
                            toast.success('Settings reset to defaults');
                        }
                    }}
                >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Reset
                </Button>
            </div>
        </Card>
    </div>
);

// About Tab
const AboutTab: React.FC<{ platform: string }> = ({ platform }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">About</h2>

        <Card className="p-1">
            <div className="p-4 border-b border-border-glass">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Version</p>
                        <p className="text-xs text-foreground-muted">Current application version</p>
                    </div>
                    <div className="px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <p className="text-sm font-mono font-bold text-indigo-400">0.1.0-alpha</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                        toast.info('Checking for updates...');
                        // TODO: Implement update check
                    }}
                >
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    Check for Updates
                </Button>
            </div>
            <div className="p-4 border-b border-border-glass">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Platform</p>
                    <p className="text-sm text-foreground-muted capitalize font-mono">{platform}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Build</p>
                    <p className="text-sm text-foreground-muted font-mono">Development</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">License</p>
                    <p className="text-sm text-foreground-muted">MIT</p>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Github className="w-4 h-4 text-foreground-muted" />
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        View on GitHub
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-foreground-muted" />
                    <button
                        onClick={() => {
                            toast.info('Release notes coming soon...');
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Release Notes
                    </button>
                </div>
            </div>
        </Card>
    </div>
);

// Permission Item Component
interface PermissionItemProps {
    name: string;
    description: string;
    permissionKey: string;
    permission?: any;
    onCheck: () => void;
    onTest?: () => void;
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
    const status = permission?.status || 'unknown';
    const message = permission?.message;
    const isLoading = permission?.checking;

    const getStatusIcon = () => {
        if (isLoading) return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
        switch (status) {
            case 'authorized': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'denied': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'restricted': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'authorized': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'denied': return 'bg-red-500/10 border-red-500/20';
            case 'restricted': return 'bg-amber-500/10 border-amber-500/20';
            default: return 'bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className={cn(
            "p-3 rounded-lg border flex items-center justify-between transition-all",
            getStatusColor()
        )}>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-white/50 dark:bg-black/20">
                    {getStatusIcon()}
                </div>
                <div>
                    <div className="font-medium flex items-center gap-2">
                        {name}
                        {status === 'authorized' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Granted</span>}
                        {status === 'denied' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Denied</span>}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {message || description}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {onTest && (
                    <Button variant="ghost" size="sm" onClick={onTest} disabled={isLoading}>
                        Test
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={onCheck} disabled={isLoading} className="w-8 h-8 p-0">
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                {status !== 'authorized' && (
                    <Button size="sm" onClick={onRequest} disabled={isLoading}>
                        Request
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
