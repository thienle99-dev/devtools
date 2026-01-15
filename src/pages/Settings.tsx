import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useToolStore } from '../store/toolStore';
import { usePermissionsStore } from '../store/permissionsStore';
import { ToolPane } from '../components/layout/ToolPane';
import { Settings as SettingsIcon, Monitor, Shield, Bell, Zap, Database, Info, Palette } from 'lucide-react';
import { cn } from '@utils/cn';

// Import optimized tabs
import { GeneralTab } from '../components/settings/GeneralTab';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { PermissionsTab } from '../components/settings/PermissionsTab';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { WindowTab } from '../components/settings/WindowTab';
import { PerformanceTab } from '../components/settings/PerformanceTab';
import { DataTab } from '../components/settings/DataTab';
import { AboutTab } from '../components/settings/AboutTab';

interface SettingsPageProps {
    tabId?: string;
}

type SettingsTab = 'general' | 'appearance' | 'permissions' | 'notifications' | 'window' | 'performance' | 'data' | 'about';

const SettingsPage: React.FC<SettingsPageProps> = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const {
        fontSize, setFontSize,
        wordWrap, setWordWrap,
        theme, setTheme,
        layoutMode, setLayoutMode,
        accentColor, setAccentColor,
        glassIntensity, setGlassIntensity,
        blurEnabled, setBlurEnabled,
        categoryOrder, setCategoryOrder,
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
        maxBackgroundTabs, setMaxBackgroundTabs,
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
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
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
                        {activeTab === 'general' && <GeneralTab {...{ fontSize, setFontSize, wordWrap, setWordWrap }} />}
                        {activeTab === 'appearance' && <AppearanceTab {...{ theme, setTheme, layoutMode, setLayoutMode, accentColor, setAccentColor, glassIntensity, setGlassIntensity, blurEnabled, setBlurEnabled, categoryOrder, setCategoryOrder }} />}
                        {activeTab === 'permissions' && <PermissionsTab {...{ permissions, isLoading, checkAllPermissions, checkPermission, testPermission, openSystemPreferences, platform }} />}
                        {activeTab === 'notifications' && <NotificationsTab {...{ notificationsEnabled, setNotificationsEnabled, notificationSound, setNotificationSound, toastDuration, setToastDuration, notifyOnScanComplete, setNotifyOnScanComplete, notifyOnCleanupComplete, setNotifyOnCleanupComplete, notifyOnErrors, setNotifyOnErrors }} />}
                        {activeTab === 'window' && <WindowTab {...{ windowOpacity, setWindowOpacity, alwaysOnTop, setAlwaysOnTop, rememberWindowPosition, setRememberWindowPosition, animationSpeed, setAnimationSpeed, reduceMotion, setReduceMotion }} />}
                        {activeTab === 'performance' && <PerformanceTab {...{ enableAnimations, setEnableAnimations, lazyLoading, setLazyLoading, memoryLimit, setMemoryLimit, backgroundProcessing, setBackgroundProcessing, maxBackgroundTabs, setMaxBackgroundTabs }} />}
                        {activeTab === 'data' && <DataTab {...{ autoBackup, setAutoBackup, backupRetentionDays, setBackupRetentionDays, exportSettings, importSettings, resetToDefaults, clearHistory }} />}
                        {activeTab === 'about' && <AboutTab platform={platform} />}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

export default SettingsPage;
