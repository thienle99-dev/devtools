import React from 'react';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Info } from 'lucide-react';

export interface PerformanceTabProps {
    enableAnimations: boolean;
    setEnableAnimations: (enabled: boolean) => void;
    lazyLoading: boolean;
    setLazyLoading: (enabled: boolean) => void;
    memoryLimit: number;
    setMemoryLimit: (limit: number) => void;
    backgroundProcessing: boolean;
    setBackgroundProcessing: (enabled: boolean) => void;
    maxBackgroundTabs: number;
    setMaxBackgroundTabs: (max: number) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ enableAnimations, setEnableAnimations, lazyLoading, setLazyLoading, memoryLimit, setMemoryLimit, backgroundProcessing, setBackgroundProcessing, maxBackgroundTabs, setMaxBackgroundTabs }) => (
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
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Background Processing</p>
                    <p className="text-xs text-foreground-muted">Process tasks in background</p>
                </div>
                <Switch
                    checked={backgroundProcessing}
                    onChange={(e) => setBackgroundProcessing(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Maximum Background Tabs</p>
                    <p className="text-xs text-foreground-muted">Limit number of tabs running in background (1-50)</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-glass-panel rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                                style={{ width: `${(maxBackgroundTabs / 50) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono text-foreground-secondary min-w-[3ch] text-right">{maxBackgroundTabs}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 ml-4">
                    <Input
                        type="number"
                        min="1"
                        max="50"
                        step="1"
                        value={maxBackgroundTabs}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setMaxBackgroundTabs(Math.max(1, Math.min(50, value)));
                        }}
                        className="w-16 font-mono text-center"
                    />
                    <span className="text-xs text-foreground-muted">tabs</span>
                </div>
            </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">About Background Tabs</p>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                        When you have more tabs open than this limit, the oldest inactive tabs will be automatically closed to maintain performance.
                        Active downloads, conversions, and other background processes will continue uninterrupted.
                    </p>
                    <p className="text-xs text-cyan-400 font-medium">
                        💡 Recommended: 5-10 tabs for optimal performance
                    </p>
                </div>
            </div>
        </Card>
    </div>
);
