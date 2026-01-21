import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Layout, Maximize2, Palette, Eye, Type, Share2, ChevronDown, Settings2, Layers, Wand2 } from 'lucide-react';
import { useXnapperStore } from '../store/xnapperStore';
import { XNAPPER_BG_PRESETS, ASPECT_RATIO_PRESETS, SOCIAL_PRESETS, generateGradientCSS } from '../utils/xnapperPresets';
import { cn } from '@utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/Tabs';
import { ExportPanel } from './ExportPanel';
import { AnnotationToolbar } from './AnnotationToolbar';
import type { CanvasPreviewHandle } from '../konva/KonvaCanvas';

interface XnapperStylePanelProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
    historyState?: {
        canUndo: boolean;
        canRedo: boolean;
        count: number;
    };
    zoom?: number;
}

// Collapsible Section Component
const CollapsibleSection: React.FC<{
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    iconBg?: string;
}> = ({ icon, title, children, defaultOpen = true, badge, iconBg = 'from-indigo-500/20 to-purple-500/20' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border-glass/50 rounded-xl overflow-hidden bg-glass-subtle/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    iconBg
                )}>
                    {icon}
                </div>
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
                {badge}
                <ChevronDown className={cn(
                    "w-4 h-4 text-foreground-muted transition-transform duration-200",
                    !isOpen && "-rotate-90"
                )} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-3 pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Compact Slider Component
const CompactSlider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    unit?: string;
    color?: string;
}> = ({ label, value, onChange, min, max, unit = 'px', color = 'indigo' }) => {
    const colorClasses: Record<string, string> = {
        indigo: 'from-indigo-500 to-purple-500 border-indigo-500',
        blue: 'from-blue-500 to-cyan-500 border-blue-500',
        amber: 'from-amber-500 to-orange-500 border-amber-500',
        pink: 'from-pink-500 to-rose-500 border-pink-500',
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground-muted">{label}</label>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-12 px-1.5 py-0.5 text-xs text-center bg-background/60 border border-border-glass rounded text-foreground-primary focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-foreground-tertiary w-4">{unit}</span>
                </div>
            </div>
            <div className="relative h-1.5 group">
                <div className="absolute inset-0 bg-background/60 rounded-full overflow-hidden border border-border-glass/50">
                    <div
                        className={cn("h-full bg-gradient-to-r transition-all duration-100", colorClasses[color]?.split(' ').slice(0, 2).join(' '))}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-sm pointer-events-none transition-all duration-100 group-hover:scale-110",
                        colorClasses[color]?.split(' ').slice(2).join(' ')
                    )}
                    style={{ left: `calc(${percentage}% - 6px)` }}
                />
            </div>
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: 'sm' | 'md';
}> = ({ checked, onChange, size = 'md' }) => {
    const sizes = {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
    };
    const thumbSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
    };
    const translateSizes = {
        sm: 'translate-x-4',
        md: 'translate-x-5',
    };

    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none",
                sizes[size],
                checked ? "bg-indigo-500" : "bg-gray-600"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200",
                    thumbSizes[size],
                    checked ? translateSizes[size] : "translate-x-1"
                )}
            />
        </button>
    );
};

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
    const showShadow = shadowBlur > 0 || shadowOpacity > 0;
    const [activeTab, setActiveTab] = useState('annotate');

    useEffect(() => {
        if (!background) {
            setSelectedBg('none');
        } else if ('colors' in background && background.colors) {
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

    const handleBgSelect = (preset: typeof XNAPPER_BG_PRESETS[number]) => {
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
        if (showShadow) {
            setShadowBlur(0);
            setShadowOpacity(0);
        } else {
            setShadowBlur(40);
            setShadowOpacity(0.3);
        }
    };

    return (
        <div className="w-[400px] bg-gradient-to-b from-glass-panel to-background/95 border-l border-border-glass/50 h-full flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="px-4 py-3 border-b border-border-glass/50 bg-glass-panel/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    {/* Auto-balance Toggle */}
                    <button
                        onClick={() => setAutoBalance(!autoBalance)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                            autoBalance 
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                : "bg-glass-panel border border-border-glass text-foreground-secondary hover:border-indigo-500/50"
                        )}
                    >
                        <Wand2 className={cn("w-3.5 h-3.5", autoBalance && "animate-pulse")} />
                        Auto
                    </button>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-background/40 rounded-lg p-0.5 border border-border-glass/50">
                        <button
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            onClick={() => canvasRef?.current?.zoomOut()}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                        <span className="text-[10px] w-9 text-center tabular-nums text-foreground-muted font-medium">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            onClick={() => canvasRef?.current?.zoomIn()}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                        <div className="w-px h-4 bg-border-glass/50 mx-0.5" />
                        <button
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                            onClick={() => canvasRef?.current?.resetZoom()}
                            title="Reset"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-foreground-secondary" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full min-h-0">
                <div className="px-3 py-2 border-b border-border-glass/30">
                    <TabsList className="w-full grid grid-cols-3 p-0.5 bg-background/40 rounded-lg border border-border-glass/50">
                        <TabsTrigger 
                            value="annotate"
                            className="rounded-md font-semibold text-xs py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                        >
                            <Layers className="w-3.5 h-3.5 mr-1.5" />
                            Annotate
                        </TabsTrigger>
                        <TabsTrigger 
                            value="design"
                            className="rounded-md font-semibold text-xs py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                        >
                            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                            Design
                        </TabsTrigger>
                        <TabsTrigger 
                            value="export"
                            className="rounded-md font-semibold text-xs py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                        >
                            <Share2 className="w-3.5 h-3.5 mr-1.5" />
                            Export
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Annotate Tab */}
                <TabsContent value="annotate" className="flex-1 overflow-y-auto custom-scrollbar outline-none">
                    <div className="p-3 space-y-3">
                        {/* Quick Tip */}
                        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-indigo-300">Annotation Mode</p>
                                    <p className="text-[11px] text-indigo-400/70 mt-0.5">Select tools to draw on your screenshot</p>
                                </div>
                            </div>
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

                {/* Design Tab */}
                <TabsContent value="design" className="flex-1 overflow-y-auto custom-scrollbar outline-none">
                    <div className="p-3 space-y-3">
                        {/* Canvas / Aspect Ratio */}
                        <CollapsibleSection
                            icon={<Layout className="w-4 h-4 text-indigo-400" />}
                            title="Canvas"
                            iconBg="from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                            badge={aspectRatio && aspectRatio !== 'auto' && (
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                                    {aspectRatio}
                                </span>
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {ASPECT_RATIO_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => {
                                                setAspectRatio(preset.id);
                                                setSelectedSocialPreset(null);
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all duration-200",
                                                aspectRatio === preset.id
                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-sm"
                                                    : "bg-background/40 text-foreground-secondary border-border-glass/50 hover:border-indigo-500/50"
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Social Presets */}
                                <div className="pt-2 border-t border-border-glass/30">
                                    <p className="text-[10px] font-medium text-foreground-muted mb-2">Social Media</p>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SOCIAL_PRESETS.map((preset) => {
                                            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                                            const divisor = gcd(preset.width, preset.height);
                                            const ratioLabel = `${preset.width / divisor}:${preset.height / divisor}`;
                                            const isSelected = selectedSocialPreset === preset.id;
                                            
                                            return (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => {
                                                        setAspectRatio(ratioLabel);
                                                        setSelectedSocialPreset(preset.id);
                                                    }}
                                                    className={cn(
                                                        "px-1.5 py-1.5 text-[9px] font-semibold rounded-lg border transition-all duration-200",
                                                        isSelected
                                                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent"
                                                            : "bg-background/40 text-foreground-secondary border-border-glass/50 hover:border-green-500/50"
                                                    )}
                                                    title={`${preset.width}×${preset.height}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Spacing & Style */}
                        <CollapsibleSection
                            icon={<Maximize2 className="w-4 h-4 text-purple-400" />}
                            title="Spacing"
                            iconBg="from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                        >
                            <div className="space-y-3">
                                <CompactSlider
                                    label="Padding"
                                    value={backgroundPadding}
                                    onChange={setBackgroundPadding}
                                    min={0}
                                    max={200}
                                    color="indigo"
                                />
                                <CompactSlider
                                    label="Inset"
                                    value={inset}
                                    onChange={setInset}
                                    min={0}
                                    max={100}
                                    color="indigo"
                                />
                                <CompactSlider
                                    label="Border Radius"
                                    value={borderRadius}
                                    onChange={setBorderRadius}
                                    min={0}
                                    max={40}
                                    color="indigo"
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Shadow */}
                        <CollapsibleSection
                            icon={<Eye className="w-4 h-4 text-blue-400" />}
                            title="Shadow"
                            iconBg="from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                            badge={
                                <ToggleSwitch
                                    checked={showShadow}
                                    onChange={handleShadowToggle}
                                    size="sm"
                                />
                            }
                        >
                            {showShadow && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    <CompactSlider
                                        label="Blur"
                                        value={shadowBlur}
                                        onChange={setShadowBlur}
                                        min={0}
                                        max={100}
                                        color="blue"
                                    />
                                    <CompactSlider
                                        label="Offset Y"
                                        value={shadowOffsetY}
                                        onChange={setShadowOffsetY}
                                        min={-50}
                                        max={50}
                                        color="blue"
                                    />
                                </div>
                            )}
                        </CollapsibleSection>

                        {/* Window Controls */}
                        <div className="flex items-center justify-between p-3 bg-glass-subtle/30 border border-border-glass/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-yellow-500/20 border border-red-500/30 flex items-center justify-center">
                                    <div className="flex gap-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-foreground">Window Controls</span>
                            </div>
                            <ToggleSwitch
                                checked={showWindowControls}
                                onChange={setShowWindowControls}
                                size="sm"
                            />
                        </div>

                        {/* Watermark */}
                        <CollapsibleSection
                            icon={<Type className="w-4 h-4 text-amber-400" />}
                            title="Watermark"
                            iconBg="from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                            defaultOpen={!!watermark?.text}
                        >
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={watermark?.text || ''}
                                    onChange={(e) => setWatermark({ text: e.target.value })}
                                    placeholder="Enter watermark text..."
                                    className="w-full px-3 py-2 bg-background/60 border border-border-glass/50 rounded-lg text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-amber-500 transition-colors"
                                />

                                {watermark?.text && (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        <CompactSlider
                                            label="Opacity"
                                            value={Math.round((watermark.opacity || 0.3) * 100)}
                                            onChange={(v) => setWatermark({ opacity: v / 100 })}
                                            min={0}
                                            max={100}
                                            unit="%"
                                            color="amber"
                                        />
                                        <CompactSlider
                                            label="Font Size"
                                            value={watermark.fontSize || 16}
                                            onChange={(v) => setWatermark({ fontSize: v })}
                                            min={8}
                                            max={48}
                                            color="amber"
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-foreground-muted">Position</label>
                                            <div className="grid grid-cols-5 gap-1">
                                                {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => setWatermark({ position: pos as any })}
                                                        className={cn(
                                                            "py-1 text-[9px] font-semibold rounded-md border transition-all duration-200",
                                                            watermark.position === pos
                                                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent"
                                                                : "bg-background/40 border-border-glass/50 text-foreground-secondary hover:border-amber-500/50"
                                                        )}
                                                    >
                                                        {pos.split('-').map(w => w[0].toUpperCase()).join('')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* Background */}
                        <CollapsibleSection
                            icon={<Palette className="w-4 h-4 text-pink-400" />}
                            title="Background"
                            iconBg="from-pink-500/20 to-rose-500/20 border border-pink-500/30"
                        >
                            <div className="grid grid-cols-5 gap-2">
                                {XNAPPER_BG_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handleBgSelect(preset)}
                                        className={cn(
                                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 group",
                                            selectedBg === preset.id
                                                ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-105"
                                                : "border-border-glass/50 hover:border-indigo-500/50"
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
                                            <div className="w-full h-full bg-background/50 border border-dashed border-foreground-muted/30 flex items-center justify-center">
                                                <span className="text-[8px] text-foreground-muted font-bold">∅</span>
                                            </div>
                                        ) : preset.id === 'custom' ? (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center">
                                                <Palette className="w-3 h-3 text-white" />
                                            </div>
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

                            {showCustomPicker && (
                                <div className="mt-3 p-3 bg-background/40 border border-border-glass/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-foreground">Custom Gradient</span>
                                        <button
                                            onClick={() => setShowCustomPicker(false)}
                                            className="text-[10px] text-foreground-muted hover:text-foreground"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-foreground-muted">
                                        Custom gradient editor coming soon!
                                    </p>
                                </div>
                            )}
                        </CollapsibleSection>
                    </div>
                </TabsContent>

                {/* Export Tab */}
                <TabsContent value="export" className="flex-1 overflow-y-auto custom-scrollbar outline-none">
                    <ExportPanel canvasRef={canvasRef} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
