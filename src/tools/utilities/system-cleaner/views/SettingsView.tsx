import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Bell, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { useSettingsStore, defaultSettings } from '../store/settingsStore';
import { toast } from 'sonner';

export const SettingsView: React.FC = () => {
    const { settings, updateSettings, resetToDefaults } = useSettingsStore();
    const [hasChanges, setHasChanges] = useState(false);
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = <K extends keyof typeof localSettings>(
        key: K,
        value: typeof localSettings[K]
    ) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setHasChanges(false);
        toast.success('Settings saved successfully');
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
            resetToDefaults();
            setLocalSettings(defaultSettings);
            setHasChanges(false);
            toast.success('Settings reset to defaults');
        }
    };

    const SettingSection = ({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
        <Card className="p-6 border-border-glass bg-white/5">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <div className="space-y-4">{children}</div>
        </Card>
    );

    const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-border-glass/50 last:border-0">
            <div className="flex-1">
                <div className="font-medium text-sm mb-1">{label}</div>
                {description && <div className="text-xs text-foreground-muted">{description}</div>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Settings & Preferences</h2>
                    <p className="text-sm text-foreground-muted">Customize your System Cleaner experience</p>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button variant="outline" size="sm" onClick={() => { setLocalSettings(settings); setHasChanges(false); }}>
                            Cancel
                        </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={!hasChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-6 pr-2 custom-scrollbar">
                {/* General Settings */}
                <SettingSection title="General" icon={Settings}>
                    <SettingRow
                        label="Auto Backup"
                        description="Automatically create backups before cleanup operations"
                    >
                        <Checkbox
                            checked={localSettings.autoBackup}
                            onChange={(e) => handleChange('autoBackup', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Auto Scan on Launch"
                        description="Automatically run Smart Scan when opening the app"
                    >
                        <Checkbox
                            checked={localSettings.autoScanOnLaunch}
                            onChange={(e) => handleChange('autoScanOnLaunch', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Show Platform Badge"
                        description="Display platform indicator in the UI"
                    >
                        <Checkbox
                            checked={localSettings.showPlatformBadge}
                            onChange={(e) => handleChange('showPlatformBadge', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Theme"
                        description="Choose your preferred theme"
                    >
                        <select
                            value={localSettings.theme}
                            onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                        >
                            <option value="auto">Auto</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </SettingRow>
                </SettingSection>

                {/* Scan Settings */}
                <SettingSection title="Scan Settings" icon={Zap}>
                    <SettingRow
                        label="Minimum File Size"
                        description="Only show files larger than this size (MB)"
                    >
                        <input
                            type="number"
                            value={localSettings.minFileSize}
                            onChange={(e) => handleChange('minFileSize', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="1"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Scan Depth"
                        description="Maximum directory depth to scan"
                    >
                        <input
                            type="number"
                            value={localSettings.scanDepth}
                            onChange={(e) => handleChange('scanDepth', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="1"
                            max="20"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Include Hidden Files"
                        description="Scan hidden files and folders"
                    >
                        <Checkbox
                            checked={localSettings.includeHiddenFiles}
                            onChange={(e) => handleChange('includeHiddenFiles', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Default View Mode"
                        description="Default view mode for Space Lens"
                    >
                        <select
                            value={localSettings.defaultViewMode}
                            onChange={(e) => handleChange('defaultViewMode', e.target.value as any)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                        >
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                            <option value="tree">Tree</option>
                            <option value="detail">Detail</option>
                            <option value="compact">Compact</option>
                        </select>
                    </SettingRow>
                </SettingSection>

                {/* Safety Settings */}
                <SettingSection title="Safety & Security" icon={Shield}>
                    <SettingRow
                        label="Safety Check Enabled"
                        description="Check files against safety database before deletion"
                    >
                        <Checkbox
                            checked={localSettings.safetyCheckEnabled}
                            onChange={(e) => handleChange('safetyCheckEnabled', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Require Confirmation"
                        description="Ask for confirmation before deleting files"
                    >
                        <Checkbox
                            checked={localSettings.requireConfirmation}
                            onChange={(e) => handleChange('requireConfirmation', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Max Backups"
                        description="Maximum number of backups to keep"
                    >
                        <input
                            type="number"
                            value={localSettings.maxBackups}
                            onChange={(e) => handleChange('maxBackups', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="1"
                            max="50"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Backup Retention (Days)"
                        description="Keep backups for this many days"
                    >
                        <input
                            type="number"
                            value={localSettings.backupRetentionDays}
                            onChange={(e) => handleChange('backupRetentionDays', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="1"
                            max="365"
                        />
                    </SettingRow>
                </SettingSection>

                {/* Performance Settings */}
                <SettingSection title="Performance" icon={Zap}>
                    <SettingRow
                        label="Enable Caching"
                        description="Cache scan results for faster subsequent scans"
                    >
                        <Checkbox
                            checked={localSettings.cacheEnabled}
                            onChange={(e) => handleChange('cacheEnabled', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Cache TTL (Minutes)"
                        description="How long to keep cached results"
                    >
                        <input
                            type="number"
                            value={localSettings.cacheTTL}
                            onChange={(e) => handleChange('cacheTTL', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="1"
                            max="1440"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Max Cache Size (MB)"
                        description="Maximum cache size in megabytes"
                    >
                        <input
                            type="number"
                            value={localSettings.maxCacheSize}
                            onChange={(e) => handleChange('maxCacheSize', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="10"
                            max="1000"
                        />
                    </SettingRow>
                    <SettingRow
                        label="Chunk Size"
                        description="Number of files to process per batch"
                    >
                        <input
                            type="number"
                            value={localSettings.chunkSize}
                            onChange={(e) => handleChange('chunkSize', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                            min="5"
                            max="100"
                        />
                    </SettingRow>
                </SettingSection>

                {/* Notification Settings */}
                <SettingSection title="Notifications" icon={Bell}>
                    <SettingRow
                        label="Show Notifications"
                        description="Enable system notifications"
                    >
                        <Checkbox
                            checked={localSettings.showNotifications}
                            onChange={(e) => handleChange('showNotifications', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Notify on Scan Complete"
                        description="Show notification when scan finishes"
                    >
                        <Checkbox
                            checked={localSettings.notifyOnScanComplete}
                            onChange={(e) => handleChange('notifyOnScanComplete', e.target.checked)}
                            disabled={!localSettings.showNotifications}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Notify on Cleanup Complete"
                        description="Show notification when cleanup finishes"
                    >
                        <Checkbox
                            checked={localSettings.notifyOnCleanupComplete}
                            onChange={(e) => handleChange('notifyOnCleanupComplete', e.target.checked)}
                            disabled={!localSettings.showNotifications}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Notify on Errors"
                        description="Show notification when errors occur"
                    >
                        <Checkbox
                            checked={localSettings.notifyOnErrors}
                            onChange={(e) => handleChange('notifyOnErrors', e.target.checked)}
                            disabled={!localSettings.showNotifications}
                        />
                    </SettingRow>
                </SettingSection>

                {/* Advanced Settings */}
                <SettingSection title="Advanced" icon={AlertTriangle}>
                    <SettingRow
                        label="Debug Mode"
                        description="Enable debug logging and detailed error messages"
                    >
                        <Checkbox
                            checked={localSettings.enableDebugMode}
                            onChange={(e) => handleChange('enableDebugMode', e.target.checked)}
                        />
                    </SettingRow>
                    <SettingRow
                        label="Log Level"
                        description="Minimum log level to display"
                    >
                        <select
                            value={localSettings.logLevel}
                            onChange={(e) => handleChange('logLevel', e.target.value as any)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass text-sm"
                        >
                            <option value="error">Error</option>
                            <option value="warn">Warning</option>
                            <option value="info">Info</option>
                            <option value="debug">Debug</option>
                        </select>
                    </SettingRow>
                    <SettingRow
                        label="Enable Telemetry"
                        description="Send anonymous usage data to help improve the app"
                    >
                        <Checkbox
                            checked={localSettings.enableTelemetry}
                            onChange={(e) => handleChange('enableTelemetry', e.target.checked)}
                        />
                    </SettingRow>
                </SettingSection>
            </div>
        </div>
    );
};

