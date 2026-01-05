import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, Database, Eye, EyeOff, RefreshCw, Loader2, Trash, Search as SearchIcon, Wifi } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import type { PrivacyItem } from '../store/systemCleanerStore';
import { formatSize } from '../utils/formatUtils';
import { cn } from '../../../../utils/cn';
import { toast } from 'sonner';

export const ProtectionView: React.FC = () => {
    const { privacyData, setPrivacyData, platformInfo } = useSystemCleanerStore();
    const [activeTab, setActiveTab] = useState<'privacy' | 'browser' | 'wifi'>('privacy');
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState<{
        registry?: boolean;
        activityHistory?: boolean;
        spotlightHistory?: boolean;
        quickLookCache?: boolean;
    }>({});
    
    // Browser Data state
    const [browserData, setBrowserData] = useState<any>(null);
    const [isScanningBrowser, setIsScanningBrowser] = useState(false);
    const [isCleaningBrowser, setIsCleaningBrowser] = useState(false);
    const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
    const [selectedBrowserTypes, setSelectedBrowserTypes] = useState<string[]>(['history', 'cookies', 'cache', 'downloads']);
    
    // Wi-Fi Networks state
    const [wifiNetworks, setWifiNetworks] = useState<any[]>([]);
    const [isLoadingWifi, setIsLoadingWifi] = useState(false);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);

    const scanPrivacy = async () => {
        setIsScanning(true);
        setProgress(0);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const res = await (window as any).cleanerAPI.scanPrivacy();
            if (res.success) {
                setPrivacyData(res.results);
                setProgress(100);
                setSelectedCategories({
                    registry: res.results.registryEntries.length > 0,
                    activityHistory: res.results.activityHistory.length > 0,
                    spotlightHistory: res.results.spotlightHistory.length > 0,
                    quickLookCache: res.results.quickLookCache.length > 0,
                });
            } else {
                toast.error(`Failed to scan privacy data: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to scan privacy data');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    const cleanPrivacy = async () => {
        if (Object.values(selectedCategories).every(v => !v)) {
            toast.error('Please select at least one category to clean');
            return;
        }
        setIsCleaning(true);
        try {
            const res = await (window as any).cleanerAPI.cleanPrivacy(selectedCategories);
            if (res.success) {
                toast.success(`Cleaned ${res.cleanedItems} items (${res.freedSizeFormatted})`);
                setPrivacyData(null);
                setSelectedCategories({});
            } else {
                toast.error(`Failed to clean: ${res.errors?.join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to clean privacy data');
        } finally {
            setIsCleaning(false);
        }
    };

    const renderPrivacySection = (title: string, items: PrivacyItem[], IconComponent: React.ComponentType<{ className?: string }>, categoryKey: keyof typeof selectedCategories) => {
        if (items.length === 0) return null;
        
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const totalCount = items.reduce((sum, item) => sum + item.count, 0);
        const isSelected = selectedCategories[categoryKey] ?? false;

        return (
            <Card className="p-6 space-y-4 border-border-glass bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{title}</h3>
                            <p className="text-xs text-foreground-muted">{totalCount} items • {formatSize(totalSize)}</p>
                        </div>
                    </div>
                    <Checkbox
                        checked={isSelected}
                        onChange={(checked) => setSelectedCategories({ ...selectedCategories, [categoryKey]: checked })}
                    />
                </div>
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border-glass/50">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {item.type === 'registry' ? (
                                        <Database className="w-4 h-4 text-indigo-400" />
                                    ) : (
                                        <History className="w-4 h-4 text-indigo-400" />
                                    )}
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <p className="text-xs text-foreground-muted mt-1">{item.description}</p>
                                <p className="text-xs text-foreground-muted/70 font-mono mt-1 truncate">{item.path}</p>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-sm font-bold text-indigo-400">{item.count} items</div>
                                {item.sizeFormatted && (
                                    <div className="text-xs text-foreground-muted">{item.sizeFormatted}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    // Browser Data functions
    const scanBrowserData = async () => {
        setIsScanningBrowser(true);
        setProgress(0);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const res = await (window as any).cleanerAPI.scanBrowserData();
            if (res.success) {
                setBrowserData(res.results);
                setProgress(100);
                setSelectedBrowsers(res.results.browsers.map((b: any) => b.name));
            } else {
                toast.error(`Failed to scan browser data: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to scan browser data');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanningBrowser(false), 500);
        }
    };

    const cleanBrowserData = async () => {
        if (selectedBrowsers.length === 0 || selectedBrowserTypes.length === 0) {
            toast.error('Please select at least one browser and data type to clean');
            return;
        }
        setIsCleaningBrowser(true);
        try {
            const res = await (window as any).cleanerAPI.cleanBrowserData({
                browsers: selectedBrowsers,
                types: selectedBrowserTypes
            });
            if (res.success) {
                toast.success(`Cleaned ${res.cleanedItems} items (${res.freedSizeFormatted})`);
                setBrowserData(null);
                setSelectedBrowsers([]);
            } else {
                toast.error(`Failed to clean: ${res.errors?.join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to clean browser data');
        } finally {
            setIsCleaningBrowser(false);
        }
    };

    // Wi-Fi Networks functions
    const loadWifiNetworks = async () => {
        setIsLoadingWifi(true);
        try {
            const res = await (window as any).cleanerAPI.getWifiNetworks();
            if (res.success) {
                setWifiNetworks(res.networks);
            } else {
                toast.error(`Failed to load Wi-Fi networks: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to load Wi-Fi networks');
        } finally {
            setIsLoadingWifi(false);
        }
    };

    const removeWifiNetwork = async (networkName: string) => {
        try {
            const res = await (window as any).cleanerAPI.removeWifiNetwork(networkName);
            if (res.success) {
                toast.success(`Removed Wi-Fi network: ${networkName}`);
                setWifiNetworks(wifiNetworks.filter(n => n.name !== networkName));
                setSelectedNetworks(selectedNetworks.filter(n => n !== networkName));
            } else {
                toast.error(`Failed to remove network: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to remove Wi-Fi network');
        }
    };

    const removeSelectedNetworks = async () => {
        if (selectedNetworks.length === 0) {
            toast.error('Please select at least one network to remove');
            return;
        }
        for (const networkName of selectedNetworks) {
            await removeWifiNetwork(networkName);
        }
    };

    // Load Wi-Fi networks on mount if on Wi-Fi tab
    useEffect(() => {
        if (activeTab === 'wifi' && wifiNetworks.length === 0 && !isLoadingWifi) {
            loadWifiNetworks();
        }
    }, [activeTab]);

    const platform = platformInfo?.platform;

    // Render Privacy Tab
    const renderPrivacyTab = () => {
        if (!privacyData && !isScanning) {
            return (
                <ScanPlaceholder
                    title="Privacy Protection"
                    icon={ShieldCheck}
                    description="Clean up privacy-sensitive data including registry entries, activity history, and search history."
                    onScan={scanPrivacy}
                    isScanning={isScanning}
                    progress={progress}
                />
            );
        }

        return (
            <div className="space-y-6 h-full flex flex-col relative">
                {(isScanning || isCleaning) && (
                    <LoadingOverlay 
                        progress={progress} 
                        title="Privacy Protection" 
                        status={isCleaning ? "Cleaning privacy data..." : "Scanning privacy data..."} 
                    />
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Privacy Protection</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove privacy-sensitive data from your system
                        </p>
                    </div>
                <div className="flex gap-2">
                    {privacyData && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={cleanPrivacy}
                            disabled={isCleaning || Object.values(selectedCategories).every(v => !v)}
                        >
                            {isCleaning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cleaning...
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Clean Selected
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={scanPrivacy} disabled={isScanning}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                        {privacyData ? 'Rescan' : 'Scan'}
                    </Button>
                </div>
            </div>

            {privacyData && (
                <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                    {platform === 'windows' && (
                        <>
                            {renderPrivacySection(
                                'Registry Entries',
                                privacyData.registryEntries,
                                Database,
                                'registry'
                            )}
                            {renderPrivacySection(
                                'Activity History',
                                privacyData.activityHistory,
                                History,
                                'activityHistory'
                            )}
                        </>
                    )}
                    {platform === 'macos' && (
                        <>
                            {renderPrivacySection(
                                'Spotlight History',
                                privacyData.spotlightHistory,
                                SearchIcon as React.ComponentType<{ className?: string }>,
                                'spotlightHistory'
                            )}
                            {renderPrivacySection(
                                'Quick Look Cache',
                                privacyData.quickLookCache,
                                Eye,
                                'quickLookCache'
                            )}
                        </>
                    )}
                    
                    {privacyData.totalItems > 0 && (
                        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Total Privacy Data Found</h3>
                                    <p className="text-sm text-foreground-muted">
                                        {privacyData.totalItems} items • {formatSize(privacyData.totalSize)}
                                    </p>
                                </div>
                                <ShieldCheck className="w-12 h-12 text-indigo-400" />
                            </div>
                        </Card>
                    )}
                </div>
            )}
            </div>
        );
    };

    // Render Browser Data Tab
    const renderBrowserTab = () => {
        if (!browserData && !isScanningBrowser) {
            return (
                <ScanPlaceholder
                    title="Browser Data Cleanup"
                    icon={SearchIcon}
                    description="Clean up browser history, cookies, cache, and download history from Chrome, Firefox, Edge, and Safari."
                    onScan={scanBrowserData}
                    isScanning={isScanningBrowser}
                    progress={progress}
                />
            );
        }

        return (
            <div className="space-y-6 h-full flex flex-col relative">
                {(isScanningBrowser || isCleaningBrowser) && (
                    <LoadingOverlay 
                        progress={progress} 
                        title="Browser Data Cleanup" 
                        status={isCleaningBrowser ? "Cleaning browser data..." : "Scanning browser data..."} 
                    />
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Browser Data Cleanup</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove browser history, cookies, cache, and download history
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {browserData && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={cleanBrowserData}
                                disabled={isCleaningBrowser || selectedBrowsers.length === 0 || selectedBrowserTypes.length === 0}
                            >
                                {isCleaningBrowser ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cleaning...
                                    </>
                                ) : (
                                    <>
                                        <Trash className="w-4 h-4 mr-2" />
                                        Clean Selected
                                    </>
                                )}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={scanBrowserData} disabled={isScanningBrowser}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", isScanningBrowser && "animate-spin")} />
                            {browserData ? 'Rescan' : 'Scan'}
                        </Button>
                    </div>
                </div>

                {browserData && (
                    <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Data Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {['history', 'cookies', 'cache', 'downloads'].map(type => (
                                        <Checkbox
                                            key={type}
                                            checked={selectedBrowserTypes.includes(type)}
                                            onChange={(checked) => {
                                                if (checked) {
                                                    setSelectedBrowserTypes([...selectedBrowserTypes, type]);
                                                } else {
                                                    setSelectedBrowserTypes(selectedBrowserTypes.filter(t => t !== type));
                                                }
                                            }}
                                            label={type.charAt(0).toUpperCase() + type.slice(1)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {browserData.browsers.map((browser: any) => (
                            <Card key={browser.name} className="p-6 space-y-4 border-border-glass bg-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <SearchIcon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{browser.name}</h3>
                                            <p className="text-xs text-foreground-muted">{browser.totalSizeFormatted}</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={selectedBrowsers.includes(browser.name)}
                                        onChange={(checked) => {
                                            if (checked) {
                                                setSelectedBrowsers([...selectedBrowsers, browser.name]);
                                            } else {
                                                setSelectedBrowsers(selectedBrowsers.filter(b => b !== browser.name));
                                            }
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['history', 'cookies', 'cache', 'downloads'].map(type => {
                                        const data = browser[type];
                                        if (!data || data.size === 0) return null;
                                        return (
                                            <div key={type} className="p-3 bg-white/5 rounded-lg border border-border-glass/50">
                                                <div className="text-xs text-foreground-muted mb-1 capitalize">{type}</div>
                                                <div className="text-sm font-bold text-indigo-400">{formatSize(data.size)}</div>
                                                <div className="text-xs text-foreground-muted">{data.count} items</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ))}

                        {browserData.totalSize > 0 && (
                            <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">Total Browser Data Found</h3>
                                        <p className="text-sm text-foreground-muted">
                                            {browserData.totalItems} items • {formatSize(browserData.totalSize)}
                                        </p>
                                    </div>
                                    <SearchIcon className="w-12 h-12 text-indigo-400" />
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render Wi-Fi Networks Tab
    const renderWifiTab = () => {
        return (
            <div className="space-y-6 h-full flex flex-col relative">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Wi-Fi Network Cleanup</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove old or forgotten Wi-Fi networks from your system
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedNetworks.length > 0 && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={removeSelectedNetworks}
                                disabled={isLoadingWifi}
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Remove Selected ({selectedNetworks.length})
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={loadWifiNetworks} disabled={isLoadingWifi}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingWifi && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                    {isLoadingWifi ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        </div>
                    ) : wifiNetworks.length === 0 ? (
                        <Card className="p-12 text-center border-border-glass bg-white/5">
                            <Wifi className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">No Wi-Fi Networks Found</h3>
                            <p className="text-sm text-foreground-muted mb-4">
                                Click Refresh to scan for saved Wi-Fi networks
                            </p>
                            <Button variant="outline" onClick={loadWifiNetworks}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Scan Networks
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-foreground-muted">
                                    {wifiNetworks.length} network{wifiNetworks.length !== 1 ? 's' : ''} found
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedNetworks.length === wifiNetworks.length) {
                                            setSelectedNetworks([]);
                                        } else {
                                            setSelectedNetworks(wifiNetworks.map(n => n.name));
                                        }
                                    }}
                                >
                                    {selectedNetworks.length === wifiNetworks.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            {wifiNetworks.map((network) => (
                                <Card key={network.name} className="p-4 border-border-glass bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Checkbox
                                                checked={selectedNetworks.includes(network.name)}
                                                onChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedNetworks([...selectedNetworks, network.name]);
                                                    } else {
                                                        setSelectedNetworks(selectedNetworks.filter(n => n !== network.name));
                                                    }
                                                }}
                                            />
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <Wifi className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold">{network.name}</div>
                                                <div className="text-xs text-foreground-muted">
                                                    {network.hasPassword ? 'Password protected' : 'Open network'}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeWifiNetwork(network.name)}
                                            disabled={isLoadingWifi}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border-glass">
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'privacy'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    Privacy
                </button>
                <button
                    onClick={() => setActiveTab('browser')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'browser'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <SearchIcon className="w-4 h-4 inline mr-2" />
                    Browser Data
                </button>
                <button
                    onClick={() => setActiveTab('wifi')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'wifi'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <Wifi className="w-4 h-4 inline mr-2" />
                    Wi-Fi Networks
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'privacy' && renderPrivacyTab()}
                {activeTab === 'browser' && renderBrowserTab()}
                {activeTab === 'wifi' && renderWifiTab()}
            </div>
        </div>
    );
};

