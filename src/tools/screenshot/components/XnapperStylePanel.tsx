import React, { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useXnapperStore } from '../../../store/xnapperStore';
import { XNAPPER_BG_PRESETS, ASPECT_RATIO_PRESETS, SOCIAL_PRESETS, generateGradientCSS } from '../utils/xnapperPresets';
import { cn } from '../../../utils/cn';

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
    } = useXnapperStore();

    const [selectedBg, setSelectedBg] = useState('desktop');
    const [showShadow, setShowShadow] = useState(true);

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
        <div className="w-[280px] bg-glass-panel border-l border-border-glass p-4 space-y-6 overflow-y-auto">
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

            {/* Shadow Slider (only when enabled) */}
            {showShadow && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground-secondary">Shadow</label>
                        <span className="text-xs text-foreground-muted">{shadowBlur}px</span>
                    </div>
                    <div className="relative">
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                style={{ width: `${(shadowBlur / 100) * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={shadowBlur}
                            onChange={(e) => setShadowBlur(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none"
                            style={{ left: `calc(${(shadowBlur / 100) * 100}% - 8px)` }}
                        />
                    </div>
                </div>
            )}

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
        </div>
    );
};
