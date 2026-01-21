import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Layout, Maximize2, Palette, Eye, Type, Share2 } from 'lucide-react';
import { useXnapperStore } from '../store/xnapperStore';
import { XNAPPER_BG_PRESETS, ASPECT_RATIO_PRESETS, SOCIAL_PRESETS, generateGradientCSS } from '../utils/xnapperPresets';
import { cn } from '@utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/Tabs';
import { ExportPanel } from './ExportPanel';
import { AnnotationToolbar } from './AnnotationToolbar';
import type { CanvasPreviewHandle } from './CanvasPreview';
import { Button } from '@components/ui/Button';
import { toast } from 'sonner';

interface XnapperStylePanelProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
    historyState?: {
        canUndo: boolean;
        canRedo: boolean;
        count: number;
    };
    zoom?: number;
}

export const XnapperStylePanel: React.FC<XnapperStylePanelProps> = ({
    canvasRef,
    historyState = { canUndo: false, canRedo: false, count: 0 },
    zoom = 1,
}) => {
    const {
        backgroundPadding,
        setBackgroundPadding,
        borderRadius,
        setBorderRadius,
        shadowBlur,
        setShadowBlur,
        shadowOpacity,
        setShadowOpacity,
        shadowOffsetY,
        setShadowOffsetY,
        inset,
        setInset,
        background,
        setBackground,
        autoBalance,
        setAutoBalance,
        showWindowControls,
        setShowWindowControls,
        watermark,
        setWatermark,
        aspectRatio,
        setAspectRatio,
    } = useXnapperStore();

    const [selectedBg, setSelectedBg] = useState('desktop');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [selectedSocialPreset, setSelectedSocialPreset] = useState<string | null>(null);
    // Sync showShadow with actual shadow values
    const showShadow = shadowBlur > 0 || shadowOpacity > 0;
    const [activeTab, setActiveTab] = useState('annotate');

    // Sync selectedBg with actual background from store
    useEffect(() => {
        if (!background) {
            setSelectedBg('none');
        } else if ('colors' in background && background.colors) {
            // Find matching preset
            const match = XNAPPER_BG_PRESETS.find(preset => 
                preset.gradient && 
                preset.gradient.colors.length === background.colors.length &&
                preset.gradient.colors.every((c, i) => c === background.colors[i])
            );
            if (match) {
                setSelectedBg(match.id);
            } else {
                setSelectedBg('custom');
            }
        }
    }, [background]);

    // Debug: Log current values
    useEffect(() => {
        console.log('📊 Style Panel Values:', {
            borderRadius,
            shadowBlur,
            shadowOpacity,
            shadowOffsetY,
            backgroundPadding,
            inset,
            showWindowControls,
            watermark: {
                text: watermark?.text,
                opacity: watermark?.opacity,
                position: watermark?.position,
                hasText: !!watermark?.text
            },
            background,
            selectedBg
        });
    }, [borderRadius, shadowBlur, shadowOpacity, shadowOffsetY, backgroundPadding, inset, showWindowControls, watermark, background, selectedBg]);

    const handleBgSelect = (preset: typeof XNAPPER_BG_PRESETS[number]) => {
        console.log('🎨 Background selected:', preset.id, preset);
        
        if (preset.id === 'custom') {
            setShowCustomPicker(true);
            return;
        }
        
        setSelectedBg(preset.id);
        if (preset.gradient) {
            setBackground({
                type: preset.gradient.type,
                colors: [...preset.gradient.colors],
                direction: 'to-bottom-right',
            });
        } else if (preset.id === 'none') {
            setBackground(null);
        }
    };

    const handleShadowToggle = () => {
        console.log('🌑 Shadow toggle:', showShadow ? 'OFF' : 'ON');
        if (showShadow) {
            // Turn off shadow
            setShadowBlur(0);
            setShadowOpacity(0);
        } else {
            // Turn on shadow with defaults
            setShadowBlur(40);
            setShadowOpacity(0.3);
        }
    };

    return (
        <div className="w-[400px] bg-glass-panel border-l border-border-glass h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Header Controls - Premium */}
            <div className="p-5 border-b border-border-glass space-y-4 bg-gradient-to-br from-glass-panel to-transparent">
                <div className="flex items-center justify-between">
                    <Button
                        variant={autoBalance ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setAutoBalance(!autoBalance)}
                        className={cn(
                            "flex-1 mr-3 gap-2 text-xs font-bold transition-all duration-200",
                            autoBalance 
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                                : "hover:scale-105"
                        )}
                    >
                        <Sparkles className={cn("w-4 h-4", autoBalance && "animate-pulse")} />
                        Auto-balance
                    </Button>
                    <div className="flex items-center gap-1 border border-border-glass rounded-lg p-0.5 bg-background/20">
                        <button
                            className="p-1.5 rounded transition-colors"
                            style={{
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-glass-button-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                                canvasRef?.current?.zoomOut();
                            }}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                        <span className="text-[10px] w-8 text-center tabular-nums text-foreground-muted">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            className="p-1.5 rounded transition-colors"
                            style={{
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-glass-button-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                                canvasRef?.current?.zoomIn();
                            }}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                        <button
                            className="p-1.5 rounded transition-colors border-l border-border-glass ml-0.5"
                            style={{
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-glass-button-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                                canvasRef?.current?.resetZoom();
                            }}
                            title="Reset Zoom"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full min-h-0">
                <div className="px-5 pb-3 pt-3">
                    <TabsList className="w-full grid grid-cols-3 p-1 bg-background/50 rounded-xl border border-border-glass">
                        <TabsTrigger 
                            value="annotate"
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30"
                        >
                            Annotate
                        </TabsTrigger>
                        <TabsTrigger 
                            value="design"
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30"
                        >
                            Design
                        </TabsTrigger>
                        <TabsTrigger 
                            value="export"
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30"
                        >
                            Export
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="annotate" className="flex-1 overflow-y-auto outline-none">
                    <div className="p-5 pt-2 space-y-5">
                        <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-sm font-bold text-indigo-300">Annotation Mode</h4>
                            </div>
                            <p className="text-xs text-indigo-400/80 leading-relaxed pl-10">
                                Select tools below to draw on your screenshot. Add arrows, text, shapes, and more!
                            </p>
                        </div>
                        <AnnotationToolbar
                            onUndo={() => canvasRef?.current?.undo()}
                            onRedo={() => canvasRef?.current?.redo()}
                            onClear={() => canvasRef?.current?.clear()}
                            onBringForward={() => canvasRef?.current?.bringForward?.()}
                            onSendBackward={() => canvasRef?.current?.sendBackward?.()}
                            canUndo={historyState.canUndo}
                            canRedo={historyState.canRedo}
                            annotationCount={historyState.count}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-5 pt-2 mt-0 border-none outline-none overflow-y-auto px-5 pb-6">
                    {/* Canvas Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <Layout className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Canvas</h3>
                            {aspectRatio && aspectRatio !== 'auto' && (
                                <div className="ml-auto px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 animate-in fade-in zoom-in-95 duration-200">
                                    <span className="text-xs font-bold text-indigo-400">{aspectRatio}</span>
                                </div>
                            )}
                        </div>
                        
                    <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Aspect Ratio</label>
                        <div className="flex flex-wrap gap-2">
                            {ASPECT_RATIO_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                        onClick={() => {
                                            console.log('📐 Canvas aspect ratio:', preset.id);
                                            setAspectRatio(preset.id);
                                            setSelectedSocialPreset(null); // Clear social preset selection
                                            toast.success(`Aspect ratio: ${preset.label}`, {
                                                duration: 2000,
                                            });
                                        }}
                                    className={cn(
                                            "px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all duration-200",
                                        aspectRatio === preset.id
                                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/30 scale-105"
                                                : "bg-glass-panel text-foreground-secondary border-border-glass hover:border-indigo-500/30 hover:bg-indigo-500/5"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Spacing & Style Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-purple-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Spacing & Style</h3>
                        </div>

                        {/* Padding Slider */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Padding</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={200}
                                        value={backgroundPadding}
                                        onChange={(e) => setBackgroundPadding(Number(e.target.value))}
                                        className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-xs text-foreground-tertiary">px</span>
                                </div>
                            </div>
                            <div className="relative h-2">
                                <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150"
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
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                    style={{ left: `calc(${(backgroundPadding / 200) * 100}% - 10px)` }}
                            />
                        </div>
                    </div>

                    {/* Inset Slider */}
                        <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Inset</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={inset}
                                        onChange={(e) => setInset(Number(e.target.value))}
                                        className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-xs text-foreground-tertiary">px</span>
                                </div>
                        </div>
                            <div className="relative h-2">
                                <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150"
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
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                    style={{ left: `calc(${(inset / 100) * 100}% - 10px)` }}
                            />
                        </div>
                    </div>

                    {/* Border Radius Slider */}
                        <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Border Radius</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={40}
                                        value={borderRadius}
                                        onChange={(e) => setBorderRadius(Number(e.target.value))}
                                        className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-xs text-foreground-tertiary">px</span>
                                </div>
                        </div>
                            <div className="relative h-2">
                                <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150"
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
                                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                    style={{ left: `calc(${(borderRadius / 40) * 100}% - 10px)` }}
                            />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Shadow Section */}
                    <div className="space-y-4">
                    <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Eye className="w-4 h-4 text-blue-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Shadow</h3>
                            
                            {/* Premium Toggle Switch */}
                        <button
                            onClick={handleShadowToggle}
                            className={cn(
                                    "ml-auto relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-200 focus:outline-none",
                                showShadow
                                        ? "bg-indigo-600 dark:bg-indigo-500" 
                                        : "bg-gray-300 dark:bg-gray-600"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform duration-200 ease-in-out",
                                        "bg-white dark:bg-gray-100",
                                        showShadow ? "translate-x-8" : "translate-x-1"
                                    )}
                                />
                            {showShadow && (
                                    <div className="absolute inset-0 rounded-full bg-indigo-500 blur-md opacity-30" />
                            )}
                        </button>
                    </div>

                    {/* Shadow Settings (only when enabled) */}
                    {showShadow && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200 pl-10">
                                <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Blur</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={shadowBlur}
                                                onChange={(e) => setShadowBlur(Number(e.target.value))}
                                                className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-blue-500"
                                            />
                                            <span className="text-xs text-foreground-tertiary">px</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2">
                                        <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-150"
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
                                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-blue-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                            style={{ left: `calc(${(shadowBlur / 100) * 100}% - 10px)` }}
                                />
                            </div>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Offset Y</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={-50}
                                                max={50}
                                                value={shadowOffsetY}
                                                onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                                                className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-blue-500"
                                            />
                                            <span className="text-xs text-foreground-tertiary">px</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2">
                                        <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-150"
                                                style={{ width: `${((shadowOffsetY + 50) / 100) * 100}%` }}
                                            />
                                </div>
                                <input
                                    type="range"
                                    min={-50}
                                    max={50}
                                    value={shadowOffsetY}
                                    onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-blue-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                            style={{ left: `calc(${((shadowOffsetY + 50) / 100) * 100}% - 10px)` }}
                                        />
                                    </div>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Window Controls Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/20 to-yellow-500/20 border border-red-500/30 flex items-center justify-center">
                                <div className="flex gap-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Window Controls</h3>
                            
                            {/* Premium Toggle Switch */}
                    <button
                        onClick={() => setShowWindowControls(!showWindowControls)}
                        className={cn(
                                    "ml-auto relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-200 focus:outline-none",
                            showWindowControls
                                        ? "bg-indigo-600 dark:bg-indigo-500" 
                                        : "bg-gray-300 dark:bg-gray-600"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform duration-200 ease-in-out",
                                        "bg-white dark:bg-gray-100",
                                        showWindowControls ? "translate-x-8" : "translate-x-1"
                                    )}
                                />
                                {showWindowControls && (
                                    <div className="absolute inset-0 rounded-full bg-indigo-500 blur-md opacity-30" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-foreground-muted pl-10">Show macOS-style traffic lights on screenshot</p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Watermark Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Type className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Watermark</h3>
                        </div>
                        
                        <div className="space-y-4 pl-10">
                            <input
                                type="text"
                                value={watermark?.text || ''}
                                onChange={(e) => {
                                    const newText = e.target.value;
                                    console.log('💧 Watermark text updated:', newText);
                                    setWatermark({ text: newText });
                                }}
                                placeholder="Enter watermark text..."
                                className="w-full px-4 py-2.5 bg-background/80 border border-border-glass rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />

                            {watermark?.text && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Opacity</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={Math.round((watermark.opacity || 0.3) * 100)}
                                                    onChange={(e) => setWatermark({ opacity: Number(e.target.value) / 100 })}
                                                    className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-amber-500"
                                                />
                                                <span className="text-xs text-foreground-tertiary">%</span>
                                            </div>
                                        </div>
                                        <div className="relative h-2">
                                            <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-150"
                                                    style={{ width: `${(watermark.opacity || 0.3) * 100}%` }}
                                                />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={(watermark.opacity || 0.3) * 100}
                                            onChange={(e) => setWatermark({ opacity: Number(e.target.value) / 100 })}
                                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-amber-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                                style={{ left: `calc(${(watermark.opacity || 0.3) * 100}% - 10px)` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Font Size Slider */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Font Size</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={8}
                                                    max={48}
                                                    value={watermark.fontSize || 16}
                                                    onChange={(e) => setWatermark({ fontSize: Number(e.target.value) })}
                                                    className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-amber-500"
                                                />
                                                <span className="text-xs text-foreground-tertiary">px</span>
                                            </div>
                                        </div>
                                        <div className="relative h-2">
                                            <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-150"
                                                    style={{ width: `${((watermark.fontSize || 16) - 8) / 40 * 100}%` }}
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min={8}
                                                max={48}
                                                value={watermark.fontSize || 16}
                                                onChange={(e) => setWatermark({ fontSize: Number(e.target.value) })}
                                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-amber-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                                                style={{ left: `calc(${((watermark.fontSize || 16) - 8) / 40 * 100}% - 10px)` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Position</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                                            <button
                                                key={pos}
                                                onClick={() => setWatermark({ position: pos as any })}
                                                className={cn(
                                                        "py-2 text-[10px] font-bold rounded-lg border transition-all duration-200",
                                                    watermark.position === pos
                                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/20"
                                                            : "bg-glass-panel border-border-glass text-foreground-secondary hover:border-amber-500/30 hover:bg-amber-500/5"
                                                )}
                                            >
                                                {pos.replace('-', ' ')}
                                            </button>
                                        ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Background Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center">
                                <Palette className="w-4 h-4 text-pink-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Background</h3>
                        </div>
                        
                        {/* 2 rows of 5 columns = 10 presets */}
                        <div className="grid grid-cols-5 gap-2.5 pl-10">
                            {XNAPPER_BG_PRESETS.map((preset) => (
                                <div key={preset.id} className="space-y-1.5">
                                <button
                                    onClick={() => handleBgSelect(preset)}
                                    className={cn(
                                            "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 group w-full",
                                        selectedBg === preset.id
                                                ? "border-indigo-500 ring-4 ring-indigo-500/30 scale-105 shadow-lg shadow-indigo-500/20"
                                                : "border-border-glass hover:border-indigo-500/50"
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
                                            <div className="w-full h-full bg-background/50 dark:bg-background/30 border-2 border-dashed border-foreground-muted/30 flex items-center justify-center">
                                                <div className="text-[8px] text-foreground-muted font-bold uppercase">None</div>
                                            </div>
                                        ) : preset.id === 'custom' ? (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 dark:from-gray-600 dark:via-gray-500 dark:to-gray-400 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.3)_49%,rgba(255,255,255,0.3)_51%,transparent_52%)] bg-[length:8px_8px]"></div>
                                                <Palette className="w-3 h-3 text-white z-10" />
                                            </div>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                    )}
                                    {selectedBg === preset.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                                <div className="w-3 h-3 bg-white rounded-full shadow-lg animate-pulse" />
                                            </div>
                                        )}
                                        {/* Hover effect */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-1">
                                            <span className="text-[8px] text-white font-bold drop-shadow-lg">
                                                {preset.id === 'custom' ? 'Edit' : 'Select'}
                                            </span>
                                        </div>
                                </button>
                                    <div className="text-[9px] text-foreground-muted text-center font-medium truncate">
                                        {preset.name}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Custom Color Picker (TODO: Implement) */}
                        {showCustomPicker && (
                            <div className="pl-10 pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-glass-panel border border-border-glass rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground">Custom Gradient</span>
                                        <button
                                            onClick={() => setShowCustomPicker(false)}
                                            className="text-xs text-foreground-muted hover:text-foreground"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <p className="text-xs text-foreground-muted">
                                        🚧 Custom gradient editor coming soon! For now, choose from the presets above.
                                    </p>
                                </div>
                        </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />

                    {/* Social Media Presets Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                                <Share2 className="w-4 h-4 text-green-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Social Media</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pl-10">
                            {SOCIAL_PRESETS.map((preset) => {
                                // Calculate GCD for simplest ratio form
                                const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                                const divisor = gcd(preset.width, preset.height);
                                const simpleW = preset.width / divisor;
                                const simpleH = preset.height / divisor;
                                const ratioLabel = `${simpleW}:${simpleH}`;
                                
                                const isSelected = selectedSocialPreset === preset.id;
                                
                                return (
                                <button
                                    key={preset.id}
                                        onClick={() => {
                                            console.log(`📱 Social preset: ${preset.label}`, {
                                                dimensions: `${preset.width}×${preset.height}`,
                                                ratio: ratioLabel,
                                                currentAspectRatio: aspectRatio
                                            });
                                            
                                            // Apply the simplified aspect ratio
                                            setAspectRatio(ratioLabel);
                                            setSelectedSocialPreset(preset.id);
                                            
                                            // Force a slight delay to ensure state update
                                            setTimeout(() => {
                                                console.log('✅ Aspect ratio updated to:', ratioLabel);
                                            }, 100);
                                            
                                            toast.success(`Applied ${preset.label}`, {
                                                description: `${ratioLabel} aspect ratio`,
                                                duration: 2500,
                                            });
                                        }}
                                        className={cn(
                                            "group relative px-2 py-3 text-[10px] font-bold rounded-xl border transition-all duration-200",
                                            isSelected
                                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent shadow-lg shadow-green-500/30 scale-105"
                                                : "bg-glass-panel hover:bg-green-500/10 hover:text-green-400 border-border-glass hover:border-green-500/50 text-foreground-secondary"
                                        )}
                                        title={`${preset.width}×${preset.height} (${ratioLabel})`}
                                    >
                                        <div className="mb-1 flex items-center justify-center gap-1">
                                            <span>{preset.label}</span>
                                        </div>
                                        <div className={cn(
                                            "text-[8px]",
                                            isSelected 
                                                ? "text-white/80" 
                                                : "text-foreground-muted group-hover:text-green-400/70"
                                        )}>
                                            {ratioLabel}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                </button>
                                );
                            })}
                        </div>

                        <button 
                            className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-glass-panel hover:bg-green-500/10 hover:text-green-400 border-2 border-dashed border-border-glass hover:border-green-500/50 transition-all duration-200 text-foreground-secondary ml-10"
                            onClick={() => {
                                toast.info('Custom dimensions', {
                                    description: 'Use the Export panel to set custom output dimensions',
                                    duration: 3000,
                                });
                            }}
                        >
                            + Custom Size...
                        </button>
                        
                        <div className="pl-10 pt-2">
                            <p className="text-[10px] text-foreground-muted leading-relaxed">
                                💡 Click a preset to apply aspect ratio. Final dimensions will be applied when exporting.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="export" className="flex-1 overflow-y-auto">
                    <ExportPanel canvasRef={canvasRef} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
