import React, { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import {
    Monitor,
    Cpu,
    Network,
    Battery,
    Globe,
    Layout,
    Activity,
    HardDrive,
    Hash
} from 'lucide-react';
import { cn } from '@utils/cn';

const TOOL_ID = 'device-info';

export const DeviceInfo: React.FC<{ tabId?: string }> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { addToHistory } = useToolState(effectiveId);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [browserInfo, setBrowserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        addToHistory(TOOL_ID);
        fetchInfo();
        const interval = setInterval(fetchInfo, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchInfo = async () => {
        try {
            // Get from Electron IPC
            const info = await (window as any).ipcRenderer.invoke('system:get-info');
            setSystemInfo(info);

            // Get from browser APIs
            const battery = (navigator as any).getBattery ? await (navigator as any).getBattery() : null;

            setBrowserInfo({
                userAgent: navigator.userAgent,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                hardwareConcurrency: navigator.hardwareConcurrency,
                maxTouchPoints: navigator.maxTouchPoints,
                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                    availWidth: window.screen.availWidth,
                    availHeight: window.screen.availHeight,
                    colorDepth: window.screen.colorDepth,
                    pixelRatio: window.devicePixelRatio
                },
                window: {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight
                },
                battery: battery ? {
                    level: Math.round(battery.level * 100),
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                } : null,
                connection: (navigator as any).connection ? {
                    effectiveType: (navigator as any).connection.effectiveType,
                    downlink: (navigator as any).connection.downlink,
                    rtt: (navigator as any).connection.rtt,
                    saveData: (navigator as any).connection.saveData
                } : null,
                memory: (performance as any).memory ? {
                    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize
                } : null
            });
        } catch (e) {
            console.error('Failed to fetch device info:', e);
        } finally {
            setLoading(false);
        }
    };

    const InfoSection = ({ title, icon: Icon, children, color }: { title: string, icon: any, children: React.ReactNode, color: string }) => (
        <div className="glass-panel p-6 rounded-3xl border border-border-glass h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", color)}>
                    <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">{title}</h3>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );

    const KeyValue = ({ label, value, mono = false }: { label: string, value: any, mono?: boolean }) => (
        <div className="flex justify-between items-center group">
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-tight">{label}</span>
            <span className={cn(
                "text-xs font-medium text-foreground text-right truncate max-w-[60%]",
                mono && "font-mono text-primary"
            )}>
                {value !== null && value !== undefined ? String(value) : 'N/A'}
            </span>
        </div>
    );

    const formatBytes = (bytes: number) => {
        if (!bytes) return 'N/A';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    };

    if (loading) return (
        <ToolPane title="Device Information" description="Detailed insights about your system and environment">
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin text-primary"><Activity size={32} /></div>
            </div>
        </ToolPane>
    );

    return (
        <ToolPane
            title="Device Information"
            description="Detailed insights about your hardware, operating system, and browser environment"
            onClear={fetchInfo}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {/* OS & Kernel */}
                <InfoSection title="Operating System" icon={Layout} color="bg-blue-600">
                    <KeyValue label="Platform" value={systemInfo?.os.platform} />
                    <KeyValue label="Distro" value={systemInfo?.os.distro} />
                    <KeyValue label="Release" value={systemInfo?.os.release} />
                    <KeyValue label="Arch" value={systemInfo?.os.arch} mono />
                    <KeyValue label="Hostname" value={systemInfo?.os.hostname} />
                </InfoSection>

                {/* CPU */}
                <InfoSection title="Processor" icon={Cpu} color="bg-indigo-600">
                    <KeyValue label="Manufacturer" value={systemInfo?.cpu.manufacturer} />
                    <KeyValue label="Brand" value={systemInfo?.cpu.brand} />
                    <KeyValue label="Cores" value={systemInfo?.cpu.cores} />
                    <KeyValue label="Physical Cores" value={systemInfo?.cpu.physicalCores} />
                    <KeyValue label="Speed" value={`${systemInfo?.cpu.speed} GHz`} mono />
                </InfoSection>

                {/* Memory */}
                <InfoSection title="Memory (RAM)" icon={HardDrive} color="bg-purple-600">
                    <KeyValue label="Total" value={formatBytes(systemInfo?.memory.total)} mono />
                    <KeyValue label="Used" value={formatBytes(systemInfo?.memory.used)} mono />
                    <KeyValue label="Free" value={formatBytes(systemInfo?.memory.free)} mono />
                    <KeyValue label="Active" value={formatBytes(systemInfo?.memory.active)} mono />
                    <div className="w-full h-1.5 bg-foreground/[0.05] rounded-full overflow-hidden mt-4">
                        <div
                            className="h-full bg-purple-500 transition-all duration-1000"
                            style={{ width: `${(systemInfo?.memory.used / systemInfo?.memory.total) * 100}%` }}
                        />
                    </div>
                </InfoSection>

                {/* Display */}
                <InfoSection title="Display" icon={Monitor} color="bg-emerald-600">
                    <KeyValue label="Resolution" value={`${browserInfo?.screen.width}x${browserInfo?.screen.height}`} mono />
                    <KeyValue label="Available" value={`${browserInfo?.screen.availWidth}x${browserInfo?.screen.availHeight}`} mono />
                    <KeyValue label="Window" value={`${browserInfo?.window.innerWidth}x${browserInfo?.window.innerHeight}`} mono />
                    <KeyValue label="Pixel Ratio" value={browserInfo?.screen.pixelRatio} />
                    <KeyValue label="Color Depth" value={`${browserInfo?.screen.colorDepth}-bit`} />
                </InfoSection>

                {/* Battery */}
                <InfoSection title="Power" icon={Battery} color="bg-amber-600">
                    <KeyValue label="Level" value={`${browserInfo?.battery?.level || 100}%`} />
                    <KeyValue label="Status" value={browserInfo?.battery?.charging ? 'Charging' : 'Discharging'} />
                    {browserInfo?.battery?.chargingTime !== 0 && (
                        <KeyValue label="Time to Full" value={browserInfo?.battery?.chargingTime !== Infinity ? `${Math.round(browserInfo?.battery?.chargingTime / 60)} min` : 'Unknown'} />
                    )}
                </InfoSection>

                {/* Network */}
                <InfoSection title="Network" icon={Network} color="bg-rose-600">
                    <KeyValue label="Type" value={browserInfo?.connection?.effectiveType} mono />
                    <KeyValue label="Downlink" value={`${browserInfo?.connection?.downlink} Mbps`} mono />
                    <KeyValue label="RTT" value={`${browserInfo?.connection?.rtt} ms`} mono />
                    <KeyValue label="Local IP" value={systemInfo?.network[0]?.ip4} mono />
                    <KeyValue label="MAC" value={systemInfo?.network[0]?.mac} mono />
                </InfoSection>

                {/* Browser */}
                <InfoSection title="Browser" icon={Globe} color="bg-cyan-600">
                    <KeyValue label="Language" value={browserInfo?.language} />
                    <KeyValue label="Cookies" value={browserInfo?.cookieEnabled ? 'Enabled' : 'Disabled'} />
                    <KeyValue label="DNT" value={browserInfo?.doNotTrack ? 'Yes' : 'No'} />
                    <KeyValue label="Concurrency" value={browserInfo?.hardwareConcurrency} />
                </InfoSection>

                {/* Graphics */}
                <InfoSection title="Graphics" icon={Activity} color="bg-orange-600">
                    {systemInfo?.graphics?.map((gpu: any, i: number) => (
                        <div key={i} className="space-y-1">
                            <KeyValue label={`GPU ${i + 1}`} value={gpu.model} />
                            <KeyValue label="Vendor" value={gpu.vendor} />
                            <KeyValue label="VRAM" value={gpu.vram ? `${gpu.vram} MB` : 'N/A'} mono />
                        </div>
                    ))}
                </InfoSection>
            </div>

            {/* User Agent Full String */}
            <div className="glass-panel p-6 rounded-3xl border border-border-glass mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Hash size={14} className="text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">User Agent String</h3>
                </div>
                <div className="bg-black/20 p-4 rounded-xl font-mono text-xs break-all leading-relaxed text-primary/80">
                    {browserInfo?.userAgent}
                </div>
            </div>
        </ToolPane>
    );
};
