import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Maximize2, Eye, Palette, Type, Share2 } from 'lucide-react';
import { useXnapperStore } from '@store/xnapperStore';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { XNAPPER_BG_PRESETS, ASPECT_RATIO_PRESETS, SOCIAL_PRESETS, generateGradientCSS } from '../../utils/xnapperPresets';

export const DesignTabContent: React.FC = () => {
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
        showWindowControls,
        setShowWindowControls,
        watermark,
        setWatermark,
        aspectRatio,
        setAspectRatio,
    } = useXnapperStore();

    const [selectedBackgroundId, setSelectedBackgroundId] = useState('desktop');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [selectedSocialPreset, setSelectedSocialPreset] = useState<string | null>(null);

    const showShadow = useMemo(() => shadowBlur > 0 || shadowOpacity > 0, [shadowBlur, shadowOpacity]);

    useEffect(() => {
        if (!background) {
            setSelectedBackgroundId('none');
            return;
        }

        if ('colors' in background && background.colors) {
            const match = XNAPPER_BG_PRESETS.find(preset =>
                preset.gradient &&
                preset.gradient.colors.length === background.colors.length &&
                preset.gradient.colors.every((c, i) => c === background.colors[i])
            );
            setSelectedBackgroundId(match ? match.id : 'custom');
        }
    }, [background]);

    const handleBackgroundSelect = (preset: typeof XNAPPER_BG_PRESETS[number]) => {
        if (preset.id === 'custom') {
            setShowCustomPicker(true);
            return;
        }

        setSelectedBackgroundId(preset.id);
        setShowCustomPicker(false);

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
            return;
        }
        setShadowBlur(40);
        setShadowOpacity(0.3);
    };

    const applyAspectRatio = (presetId: string, label: string) => {
        setAspectRatio(presetId);
        setSelectedSocialPreset(null);
        toast.success(`Aspect ratio: ${label}`, { duration: 2000 });
    };

    const applySocialPreset = (preset: typeof SOCIAL_PRESETS[number], ratioLabel: string) => {
        setAspectRatio(ratioLabel);
        setSelectedSocialPreset(preset.id);
        toast.success(`Applied ${preset.label}`, {
            description: `${ratioLabel} aspect ratio`,
            duration: 2500,
        });
    };

    return (
        <div className="space-y-5 pt-2 mt-0 border-none outline-none overflow-y-auto px-5 pb-6">
            <section className="space-y-3">
                <SectionTitle icon={<Layout className="w-4 h-4 text-indigo-400" />} title="Canvas">
                    {aspectRatio && aspectRatio !== 'auto' && (
                        <div className="ml-auto px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-xs font-bold text-indigo-400">{aspectRatio}</span>
                        </div>
                    )}
                </SectionTitle>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIO_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => applyAspectRatio(preset.id, preset.label)}
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
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle icon={<Maximize2 className="w-4 h-4 text-purple-400" />} title="Spacing & Style" />
                <SliderField label="Padding" value={backgroundPadding} min={0} max={200} onChange={setBackgroundPadding} unit="px" />
                <SliderField label="Inset" value={inset} min={0} max={100} onChange={setInset} unit="px" />
                <SliderField label="Border Radius" value={borderRadius} min={0} max={40} onChange={setBorderRadius} unit="px" />
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle icon={<Eye className="w-4 h-4 text-blue-400" />} title="Shadow">
                    <ToggleSwitch active={showShadow} onClick={handleShadowToggle} />
                </SectionTitle>
                {showShadow && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200 pl-10">
                        <SliderField label="Blur" value={shadowBlur} min={0} max={100} onChange={setShadowBlur} unit="px" gradient="from-blue-500 to-cyan-500" />
                        <SliderField label="Opacity" value={Math.round(shadowOpacity * 100)} min={0} max={100} onChange={(val) => setShadowOpacity(val / 100)} unit="%" gradient="from-blue-500 to-cyan-500" />
                        <SliderField label="Offset Y" value={shadowOffsetY} min={-50} max={50} onChange={setShadowOffsetY} unit="px" gradient="from-blue-500 to-cyan-500" />
                    </div>
                )}
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle
                    icon={
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                    }
                    title="Window Controls"
                >
                    <ToggleSwitch active={showWindowControls} onClick={() => setShowWindowControls(!showWindowControls)} />
                </SectionTitle>
                <p className="text-xs text-foreground-muted pl-10">Show macOS-style traffic lights on screenshot</p>
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle icon={<Type className="w-4 h-4 text-amber-400" />} title="Watermark" />
                <div className="space-y-4 pl-10">
                    <input
                        type="text"
                        value={watermark?.text || ''}
                        onChange={(e) => setWatermark({ text: e.target.value })}
                        placeholder="Enter watermark text..."
                        className="w-full px-4 py-2.5 bg-background/80 border border-border-glass rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    {watermark?.text && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <SliderField label="Opacity" value={Math.round((watermark.opacity || 0.3) * 100)} min={0} max={100} onChange={(val) => setWatermark({ opacity: val / 100 })} unit="%" gradient="from-amber-500 to-orange-500" />
                            <SliderField label="Font Size" value={watermark.fontSize || 16} min={8} max={48} onChange={(val) => setWatermark({ fontSize: val })} unit="px" gradient="from-amber-500 to-orange-500" />
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
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle icon={<Palette className="w-4 h-4 text-pink-400" />} title="Background" />
                <div className="grid grid-cols-5 gap-2.5 pl-10">
                    {XNAPPER_BG_PRESETS.map((preset) => (
                        <BackgroundPresetButton
                            key={preset.id}
                            preset={preset}
                            isSelected={selectedBackgroundId === preset.id}
                            onClick={() => handleBackgroundSelect(preset)}
                        />
                    ))}
                </div>
                {showCustomPicker && (
                    <div className="pl-10 pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-4 bg-glass-panel border border-border-glass rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">Custom Gradient</span>
                                <button onClick={() => setShowCustomPicker(false)} className="text-xs text-foreground-muted hover:text-foreground">
                                    Close
                                </button>
                            </div>
                            <p className="text-xs text-foreground-muted">
                                🚧 Custom gradient editor coming soon! For now, choose from the presets above.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <Divider />

            <section className="space-y-4">
                <SectionTitle icon={<Share2 className="w-4 h-4 text-green-400" />} title="Social Media" />
                <div className="grid grid-cols-4 gap-2 pl-10">
                    {SOCIAL_PRESETS.map((preset) => {
                        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
                        const divisor = gcd(preset.width, preset.height);
                        const ratioLabel = `${preset.width / divisor}:${preset.height / divisor}`;
                        const isSelected = selectedSocialPreset === preset.id;

                        return (
                            <button
                                key={preset.id}
                                onClick={() => applySocialPreset(preset, ratioLabel)}
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
                                <div className={cn("text-[8px]", isSelected ? "text-white/80" : "text-foreground-muted group-hover:text-green-400/70")}>
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
                <p className="text-[10px] text-foreground-muted leading-relaxed pl-10">
                    💡 Click a preset to apply aspect ratio. Final dimensions will be applied when exporting.
                </p>
            </section>
        </div>
    );
};

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-border-glass to-transparent" />;

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {children}
    </div>
);

const SliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    gradient?: string;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, unit, gradient = 'from-indigo-500 via-purple-500 to-pink-500', onChange }) => (
    <div className="space-y-2.5">
        <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs text-center bg-background/80 border border-border-glass rounded-lg text-foreground-primary focus:outline-none focus:border-indigo-500"
                />
                {unit && <span className="text-xs text-foreground-tertiary">{unit}</span>}
            </div>
        </div>
        <div className="relative h-2">
            <div className="absolute inset-0 bg-background/80 rounded-full overflow-hidden border border-border-glass">
                <div className={cn("h-full transition-all duration-150", `bg-gradient-to-r ${gradient}`)} style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
            </div>
            <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-all duration-150" style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 10px)` }} />
        </div>
    </div>
);

const BackgroundPresetButton = ({
    preset,
    isSelected,
    onClick,
}: {
    preset: typeof XNAPPER_BG_PRESETS[number];
    isSelected: boolean;
    onClick: () => void;
}) => (
    <div className="space-y-1.5">
        <button
            onClick={onClick}
            className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 group w-full",
                isSelected ? "border-indigo-500 ring-4 ring-indigo-500/30 scale-105 shadow-lg shadow-indigo-500/20" : "border-border-glass hover:border-indigo-500/50"
            )}
            title={preset.name}
        >
            {preset.gradient ? (
                <div className="w-full h-full" style={{ background: generateGradientCSS({ ...preset.gradient, colors: [...preset.gradient.colors] }) }} />
            ) : preset.id === 'none' ? (
                <div className="w-full h-full bg-background/50 dark:bg-background/30 border-2 border-dashed border-foreground-muted/30 flex items-center justify-center">
                    <div className="text-[8px] text-foreground-muted font-bold uppercase">None</div>
                </div>
            ) : preset.id === 'custom' ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 dark:from-gray-600 dark:via-gray-500 dark:to-gray-400 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.3)_49%,rgba(255,255,255,0.3)_51%,transparent_52%)] bg-[length:8px_8px]" />
                    <Palette className="w-3 h-3 text-white z-10" />
                </div>
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
            {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <div className="w-3 h-3 bg-white rounded-full shadow-lg animate-pulse" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-1">
                <span className="text-[8px] text-white font-bold drop-shadow-lg">
                    {preset.id === 'custom' ? 'Edit' : 'Select'}
                </span>
            </div>
        </button>
        <div className="text-[9px] text-foreground-muted text-center font-medium truncate">{preset.name}</div>
    </div>
);

const ToggleSwitch: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "ml-auto relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-200 focus:outline-none",
            active ? "bg-indigo-600 dark:bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
        )}
    >
        <span className={cn("inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform duration-200 ease-in-out bg-white dark:bg-gray-100", active ? "translate-x-8" : "translate-x-1")} />
        {active && <div className="absolute inset-0 rounded-full bg-indigo-500 blur-md opacity-30" />}
    </button>
);
