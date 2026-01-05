import React, { useState, useEffect } from 'react';
import { ToolPane } from '../../../components/layout/ToolPane';
import { 
    Trash2, 
    Shield, 
    Zap, 
    ShieldCheck,
    Wrench,
    Activity,
    Power,
    AppWindow,
    LayoutGrid,
    FileText,
    Copy,
    Activity as ActivityIcon,
    Database,
    Settings
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useSystemCleanerStore } from './store/systemCleanerStore';
import { useSettingsStore } from './store/settingsStore';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

// Import views
import { SmartScan } from './views/SmartScan';
import { useSmartScan } from './hooks/useSmartScan';
import { PerformanceView } from './views/PerformanceView';
import { StartupView } from './views/StartupView';
import { UninstallerView } from './views/UninstallerView';
import { SpaceLensView } from './views/SpaceLensView';
import { JunkCleanupView } from './views/JunkCleanupView';
import { LargeFilesView } from './views/LargeFilesView';
import { DuplicatesView } from './views/DuplicatesView';
import { MaintenanceView } from './views/MaintenanceView';
import { HealthMonitorView } from './views/HealthMonitorView';
import { ProtectionView } from './views/ProtectionView';
import { BackupManagementView } from './views/BackupManagementView';
import { SettingsView } from './views/SettingsView';
import { WelcomeScreen } from './components/WelcomeScreen';

// --- Main Component ---

export const SystemCleaner: React.FC = () => {
    const [activeTab, setActiveTab] = useState('smart-scan');
    const [showWelcome, setShowWelcome] = useState(false);
    const { platformInfo, setPlatformInfo } = useSystemCleanerStore();
    const { settings, hasCompletedOnboarding } = useSettingsStore();
    const { runSmartScan } = useSmartScan();
    
    // Load platform info on mount
    useEffect(() => {
        const loadPlatform = async () => {
            if (!platformInfo) {
                try {
                    const info = await (window as any).cleanerAPI.getPlatform();
                    setPlatformInfo(info);
                } catch (error) {
                    toast.error('Failed to detect platform');
                }
            }
        };
        loadPlatform();
    }, [platformInfo, setPlatformInfo]);

    // Check if welcome screen should be shown
    useEffect(() => {
        if (!hasCompletedOnboarding && platformInfo) {
            setShowWelcome(true);
        }
    }, [hasCompletedOnboarding, platformInfo]);

    // Auto scan on launch if enabled
    useEffect(() => {
        if (hasCompletedOnboarding && settings.autoScanOnLaunch && !platformInfo) {
            // Wait for platform to load
            const timer = setTimeout(() => {
                if (platformInfo) {
                    runSmartScan();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [hasCompletedOnboarding, settings.autoScanOnLaunch, platformInfo]);
    
    // Start health monitoring for tray widget
    useEffect(() => {
        const startMonitoring = async () => {
            try {
                await (window as any).cleanerAPI.startHealthMonitoring();
            } catch (error) {
                console.warn('Failed to start health monitoring:', error);
            }
        };
        
        startMonitoring();
        
        return () => {
            // Stop monitoring on unmount
            (window as any).cleanerAPI.stopHealthMonitoring().catch(() => {});
        };
    }, []);
    
    // Update tray with health data when health status changes
    const { privacyData } = useSystemCleanerStore();
    useEffect(() => {
        const updateTray = async () => {
            try {
                const healthStatus = await (window as any).cleanerAPI.getHealthStatus();
                if (healthStatus && (window as any).cleanerAPI.updateHealthTray) {
                    (window as any).cleanerAPI.updateHealthTray(healthStatus);
                }
            } catch (error) {
                // Silently fail - tray updates are optional
            }
        };
        
        // Update tray periodically
        const interval = setInterval(updateTray, 5000);
        updateTray(); // Initial update
        
        return () => clearInterval(interval);
    }, [privacyData]);
    
    // Platform-specific UI adaptations
    const platform = platformInfo?.platform;
    const isWindows = platform === 'windows';
    const isMacOS = platform === 'macos';
    
    const tabs = [
        { id: 'smart-scan', name: 'Smart Care', icon: Shield },
        { id: 'space-lens', name: 'Space Lens', icon: LayoutGrid },
        { id: 'cleanup', name: 'System Junk', icon: Trash2 },
        { id: 'large-files', name: 'Large Files', icon: FileText },
        { id: 'duplicates', name: 'Duplicates', icon: Copy },
        { id: 'performance', name: 'Performance', icon: Activity },
        { id: 'startup', name: 'Startup', icon: Power },
        { id: 'uninstaller', name: 'Uninstaller', icon: AppWindow },
        { id: 'protection', name: 'Protection', icon: ShieldCheck },
        { id: 'maintenance', name: 'Maintenance', icon: Wrench },
        { id: 'backups', name: 'Backups', icon: Database },
        { id: 'health', name: 'Health', icon: ActivityIcon },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    return (
        <ToolPane
            title="System Cleaner"
            description={`Premium system maintenance and optimization suite${platform ? ` for ${isWindows ? 'Windows' : isMacOS ? 'macOS' : platform}` : ''}`}
        >
            {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}
            <div className="flex h-full gap-8 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-56 flex flex-col space-y-1 shrink-0">
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mb-3 opacity-50">Intelligence</div>
                    {tabs.slice(0, 2).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                    
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Cleaning</div>
                    {tabs.slice(2, 5).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Optimization</div>
                    {tabs.slice(5, 8).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Protection</div>
                    {tabs.slice(8, 11).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Monitoring</div>
                    {tabs.slice(11, 12).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                    
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">System</div>
                    {tabs.slice(12).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white/[0.03] rounded-[32px] border border-border-glass overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 p-10 overflow-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                {activeTab === 'smart-scan' && <SmartScan />}
                                {activeTab === 'space-lens' && <SpaceLensView />}
                                {activeTab === 'cleanup' && <JunkCleanupView />}
                                {activeTab === 'large-files' && <LargeFilesView />}
                                {activeTab === 'duplicates' && <DuplicatesView />}
                                {activeTab === 'performance' && <PerformanceView />}
                                {activeTab === 'startup' && <StartupView />}
                                {activeTab === 'uninstaller' && <UninstallerView />}
                                {activeTab === 'protection' && <ProtectionView />}
                                {activeTab === 'maintenance' && <MaintenanceView />}
                                {activeTab === 'backups' && <BackupManagementView />}
                                {activeTab === 'health' && <HealthMonitorView />}
                                {activeTab === 'settings' && <SettingsView />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
