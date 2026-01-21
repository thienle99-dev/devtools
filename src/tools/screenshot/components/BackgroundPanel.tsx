import React, { useState } from 'react';
import { Image as ImageIcon, Palette, Droplet, Upload } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Slider } from '@components/ui/Slider';
import { useXnapperStore } from '../../../store/xnapperStore';
import { PRESET_GRADIENTS, generateGradientCSS } from '../utils/backgroundGenerator';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

export const BackgroundPanel: React.FC = () => {
    const {
        currentScreenshot,
        background,
        setBackground,
        backgroundPadding,
        setBackgroundPadding,
        borderRadius,
        setBorderRadius,
        shadowBlur,
        setShadowBlur,
        shadowOpacity,
        setShadowOpacity,
        shadowOffsetX,
        setShadowOffsetX,
        shadowOffsetY,
        setShadowOffsetY,
        inset,
        setInset,
    } = useXnapperStore();

    const [activeTab, setActiveTab] = useState<'gradient' | 'image' | 'solid'>('gradient');
    const [solidColor, setSolidColor] = useState('#1a1a1a');
    const [imageBlur, setImageBlur] = useState(10);
    const [imageOpacity, setImageOpacity] = useState(80);

    const handleGradientSelect = (gradient: typeof PRESET_GRADIENTS[0]) => {
        setBackground({
            type: gradient.type,
            colors: gradient.colors,
            direction: gradient.direction,
        });
        toast.success(`Applied ${gradient.name} gradient`);
    };

    const handleSolidColor = () => {
        setBackground({
            type: 'solid',
            color: solidColor,
        });
        toast.success('Applied solid background');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            setBackground({
                type: 'image',
                imageUrl,
                blur: imageBlur,
                opacity: imageOpacity / 100,
            });
            toast.success('Background image uploaded');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBackground = () => {
        setBackground(null);
        toast.info('Background removed');
    };

    const tabs = [
        { id: 'gradient' as const, label: 'Gradient', icon: Palette },
        { id: 'image' as const, label: 'Image', icon: ImageIcon },
        { id: 'solid' as const, label: 'Solid', icon: Droplet },
    ];

    if (!currentScreenshot) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-foreground-muted">
                <div className="text-center">
                    <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Capture a screenshot to add background</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-glass-panel rounded-lg">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-sm font-medium",
                            activeTab === id
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "text-foreground-secondary hover:text-foreground"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Gradient Tab */}
            {activeTab === 'gradient' && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Preset Gradients</h3>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {PRESET_GRADIENTS.map((gradient) => (
                            <button
                                key={gradient.name}
                                onClick={() => handleGradientSelect(gradient)}
                                className={cn(
                                    "relative h-24 rounded-lg overflow-hidden border-2 transition-all",
                                    background && 'colors' in background &&
                                        JSON.stringify(background.colors) === JSON.stringify(gradient.colors)
                                        ? "border-indigo-500 ring-2 ring-indigo-500/50"
                                        : "border-border-glass hover:border-indigo-500/50"
                                )}
                                style={{
                                    background: generateGradientCSS(gradient),
                                }}
                            >
                                <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent">
                                    <span className="text-xs font-medium text-white">
                                        {gradient.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Upload Image</label>
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border-glass rounded-lg hover:border-indigo-500/50 cursor-pointer transition-colors">
                            <Upload className="w-5 h-5 text-foreground-muted" />
                            <span className="text-sm text-foreground-secondary">
                                Click to upload background image
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {background?.type === 'image' && (
                        <>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Blur</label>
                                    <span className="text-sm text-foreground-secondary">{imageBlur}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={imageBlur}
                                    onChange={(e) => {
                                        const blur = Number(e.target.value);
                                        setImageBlur(blur);
                                        if (background.type === 'image') {
                                            setBackground({
                                                ...background,
                                                blur,
                                            });
                                        }
                                    }}
                                    className="w-full h-2 bg-glass-panel rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Opacity</label>
                                    <span className="text-sm text-foreground-secondary">{imageOpacity}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={imageOpacity}
                                    onChange={(e) => {
                                        const opacity = Number(e.target.value);
                                        setImageOpacity(opacity);
                                        if (background.type === 'image') {
                                            setBackground({
                                                ...background,
                                                opacity: opacity / 100,
                                            });
                                        }
                                    }}
                                    className="w-full h-2 bg-glass-panel rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Solid Tab */}
            {activeTab === 'solid' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={solidColor}
                                onChange={(e) => setSolidColor(e.target.value)}
                                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border-glass"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={solidColor}
                                    onChange={(e) => setSolidColor(e.target.value)}
                                    className="w-full px-4 py-2 bg-glass-panel border border-border-glass rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="#000000"
                                />
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSolidColor}
                                    className="w-full mt-2"
                                >
                                    Apply Color
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick color presets */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Quick Colors</label>
                        <div className="grid grid-cols-6 gap-2">
                            {['#000000', '#FFFFFF', '#1a1a1a', '#2d3748', '#4a5568', '#718096'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setSolidColor(color);
                                        setBackground({ type: 'solid', color });
                                    }}
                                    className="w-full aspect-square rounded-lg border-2 border-border-glass hover:border-indigo-500 transition-colors"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Style Controls - Xnapper Style */}
            <div className="space-y-4 pt-4 border-t border-border-glass">
                <h3 className="text-sm font-semibold">Style Controls</h3>

                <Slider
                    label="Padding"
                    value={backgroundPadding}
                    onChange={setBackgroundPadding}
                    min={0}
                    max={200}
                    unit="px"
                />

                <Slider
                    label="Inset"
                    value={inset}
                    onChange={setInset}
                    min={0}
                    max={100}
                    unit="px"
                />

                <Slider
                    label="Border Radius"
                    value={borderRadius}
                    onChange={setBorderRadius}
                    min={0}
                    max={40}
                    unit="px"
                />

                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-foreground-secondary">Shadow</h4>

                    <Slider
                        label="Blur"
                        value={shadowBlur}
                        onChange={setShadowBlur}
                        min={0}
                        max={100}
                        unit="px"
                    />

                    <Slider
                        label="Opacity"
                        value={Math.round(shadowOpacity * 100)}
                        onChange={(val) => setShadowOpacity(val / 100)}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Slider
                            label="Offset X"
                            value={shadowOffsetX}
                            onChange={setShadowOffsetX}
                            min={-50}
                            max={50}
                            unit="px"
                        />

                        <Slider
                            label="Offset Y"
                            value={shadowOffsetY}
                            onChange={setShadowOffsetY}
                            min={-50}
                            max={50}
                            unit="px"
                        />
                    </div>
                </div>
            </div>

            {/* Remove Background */}
            {background && (
                <Button
                    variant="secondary"
                    size="md"
                    onClick={handleRemoveBackground}
                    className="w-full"
                >
                    Remove Background
                </Button>
            )}
        </div>
    );
};
