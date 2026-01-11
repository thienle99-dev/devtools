import React, { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useXnapperStore } from '../../../store/xnapperStore';
import { XNAPPER_BG_PRESETS, ASPECT_RATIO_PRESETS, SOCIAL_PRESETS, generateGradientCSS } from '../utils/xnapperPresets';
import { cn } from '../../../utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { ExportPanel } from './ExportPanel';

export const XnapperStylePanel: React.FC = () => {
    const {
        backgroundPadding,
        setBackgroundPadding,
        borderRadius,
        setBorderRadius,
        shadowBlur,
        setShadowBlur,
        setShadowOpacity,
        inset,
        setInset,
        setBackground,
        autoBalance,
        setAutoBalance,
        showWindowControls,
        setShowWindowControls,
        watermark,
        setWatermark,
        shadowOffsetY,
        setShadowOffsetY,
        aspectRatio,
        setAspectRatio,
    } = useXnapperStore();

    const [selectedBg, setSelectedBg] = useState('desktop');
    const [showShadow, setShowShadow] = useState(true);
    const [activeTab, setActiveTab] = useState('design');

    const handleBgSelect = (preset: typeof XNAPPER_BG_PRESETS[number]) => {
        setSelectedBg(preset.id);
        if (preset.gradient) {
            setBackground({
                type: preset.gradient.type,
                colors: [...preset.gradient.colors],
                direction: 'to-bottom-right', // Use GradientDirection type
            });
        } else if (preset.id === 'none') {
            setBackground(null);
        }
    };

    const handleShadowToggle = () => {
        const newValue = !showShadow;
        setShowShadow(newValue);
        if (!newValue) {
            setShadowBlur(0);
            setShadowOpacity(0);
        } else {
            setShadowBlur(30);
            setShadowOpacity(0.3);
        }
    };

    return (
        <div className="w-[320px] bg-glass-panel border-l border-border-glass h-full flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full min-h-0">
                <div className="px-4 pt-4 pb-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="design">Design</TabsTrigger>
                        <TabsTrigger value="export">Export</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="design" className="space-y-6 pt-4 mt-0 border-none outline-none">
                    {/* Aspect Ratio Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">Canvas Ratio</label>
                        <div className="flex flex-wrap gap-2">
                            {ASPECT_RATIO_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => setAspectRatio(preset.id)}
                                    className={cn(
                                        "px-2.5 py-1.5 text-[10px] font-bold rounded border transition-all",
                                        aspectRatio === preset.id
                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                            : "bg-glass-panel text-foreground-muted border-border-glass hover:text-foreground hover:border-foreground-muted"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Your Preset</h3>
                        <div className="flex gap-1">
                            <button className="p-1.5 hover:bg-glass-panel rounded transition-colors">
                                <Settings className="w-4 h-4 text-indigo-400" />
                            </button>
                            <button className="p-1.5 hover:bg-glass-panel rounded transition-colors">
                                <Trash2 className="w-4 h-4 text-foreground-secondary" />
                            </button>
                        </div>
                    </div>

                    {/* Padding Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground-secondary">Padding</label>
                            <span className="text-xs text-foreground-muted">{backgroundPadding}px</span>
                        </div>
                        <div className="relative">
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    style={{ width: `${(backgroundPadding / 200) * 100}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={200}
                                value={backgroundPadding}
                                onChange={(e) => setBackgroundPadding(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none"
                                style={{ left: `calc(${(backgroundPadding / 200) * 100}% - 8px)` }}
                            />
                        </div>
                    </div>

                    {/* Inset Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground-secondary">Inset</label>
                            <span className="text-xs text-foreground-muted">{inset}px</span>
                        </div>
                        <div className="relative">
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    style={{ width: `${(inset / 100) * 100}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={inset}
                                onChange={(e) => setInset(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none"
                                style={{ left: `calc(${(inset / 100) * 100}% - 8px)` }}
                            />
                        </div>
                    </div>

                    {/* Border Radius Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground-secondary">Border Radius</label>
                            <span className="text-xs text-foreground-muted">{borderRadius}px</span>
                        </div>
                        <div className="relative">
                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    style={{ width: `${(borderRadius / 40) * 100}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={40}
                                value={borderRadius}
                                onChange={(e) => setBorderRadius(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none"
                                style={{ left: `calc(${(borderRadius / 40) * 100}% - 8px)` }}
                            />
                        </div>
                    </div>

                    {/* Balance & Shadow Toggles */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoBalance(!autoBalance)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                autoBalance
                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                    : "bg-glass-panel text-foreground-secondary border border-border-glass"
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={autoBalance}
                                onChange={() => setAutoBalance(!autoBalance)}
                                className="w-3 h-3 rounded accent-indigo-500"
                            />
                            Balance
                        </button>

                        <button
                            onClick={handleShadowToggle}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1",
                                showShadow
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-glass-panel text-foreground-secondary border border-border-glass"
                            )}
                        >
                            Shadow
                            {showShadow && (
                                <div className="ml-auto w-8 h-3 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Shadow Settings (only when enabled) */}
                    {showShadow && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-foreground-secondary">Blur</label>
                                    <span className="text-xs text-foreground-muted">{shadowBlur}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={shadowBlur}
                                    onChange={(e) => setShadowBlur(Number(e.target.value))}
                                    className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-foreground-secondary">Offset Y</label>
                                    <span className="text-xs text-foreground-muted">{shadowOffsetY}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={-50}
                                    max={50}
                                    value={shadowOffsetY}
                                    onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                                    className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Window Controls Toggle */}
                    <button
                        onClick={() => setShowWindowControls(!showWindowControls)}
                        className={cn(
                            "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                            showWindowControls
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                : "bg-glass-panel text-foreground-secondary border-border-glass hover:bg-white/5"
                        )}
                    >
                        <span>Window Controls (Traffic Lights)</span>
                        <div className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                            showWindowControls ? "bg-indigo-500" : "bg-zinc-600"
                        )}>
                            <div className={cn(
                                "w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                                showWindowControls ? "translate-x-4" : "translate-x-0"
                            )} />
                        </div>
                    </button>

                    {/* Watermark Section */}
                    <div className="space-y-3 pt-4 border-t border-border-glass">
                        <label className="text-xs font-semibold text-foreground">Watermark</label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={watermark?.text || ''}
                                onChange={(e) => setWatermark({ text: e.target.value })}
                                placeholder="Enter watermark text..."
                                className="w-full px-3 py-2 bg-background/50 border border-border-glass rounded-lg text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-indigo-500/50"
                            />

                            {watermark?.text && (
                                <div className="space-y-3 animate-in fade-in">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-foreground-secondary">Opacity</label>
                                            <span className="text-xs text-foreground-muted">{Math.round((watermark.opacity || 0.3) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={(watermark.opacity || 0.3) * 100}
                                            onChange={(e) => setWatermark({ opacity: Number(e.target.value) / 100 })}
                                            className="w-full h-1.5 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                                            <button
                                                key={pos}
                                                onClick={() => setWatermark({ position: pos as any })}
                                                className={cn(
                                                    "p-1.5 text-[10px] rounded border transition-all",
                                                    watermark.position === pos
                                                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                                        : "bg-glass-panel border-border-glass text-foreground-secondary hover:bg-white/5"
                                                )}
                                            >
                                                {pos.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Background Presets */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">Background</label>
                        <div className="grid grid-cols-5 gap-2">
                            {XNAPPER_BG_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleBgSelect(preset)}
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                        selectedBg === preset.id
                                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                                            : "border-border-glass"
                                    )}
                                    title={preset.name}
                                >
                                    {preset.gradient ? (
                                        <div
                                            className="w-full h-full"
                                            style={{
                                                background: generateGradientCSS({
                                                    ...preset.gradient,
                                                    colors: [...preset.gradient.colors]
                                                })
                                            }}
                                        />
                                    ) : preset.id === 'none' ? (
                                        <div className="w-full h-full bg-transparent border-2 border-dashed border-foreground-muted/30" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                    )}
                                    {selectedBg === preset.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-[9px] text-foreground-muted text-center">
                            {XNAPPER_BG_PRESETS.map((preset) => (
                                <div key={`label-${preset.id}`}>{preset.name}</div>
                            ))}
                        </div>
                    </div>

                    {/* Ratio / Size Presets */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">Ratio / Size</label>

                        {/* Aspect Ratios */}
                        <div className="grid grid-cols-5 gap-1.5">
                            {ASPECT_RATIO_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    className="px-2 py-1 text-[10px] font-medium rounded bg-glass-panel hover:bg-indigo-500/10 hover:text-indigo-400 border border-border-glass transition-all"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Social Media Presets */}
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {SOCIAL_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    className="px-2 py-1 text-[9px] font-medium rounded bg-glass-panel hover:bg-indigo-500/10 hover:text-indigo-400 border border-border-glass transition-all"
                                    title={`${preset.width}×${preset.height}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <button className="w-full px-2 py-1.5 text-xs font-medium rounded bg-glass-panel hover:bg-indigo-500/10 hover:text-indigo-400 border border-border-glass transition-all mt-2">
                            Custom...
                        </button>
                    </div>
                </TabsContent>

                <TabsContent value="export" className="flex-1 overflow-y-auto">
                    <ExportPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
};
