import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'color-converter';

// Formatting helpers
const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

const hexToRgb = (hex: string) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};

interface ColorConverterProps {
    tabId?: string;
}

export const ColorConverter: React.FC<ColorConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, addToHistory } = useToolState(effectiveId);

    // Store all formats in options
    const data = toolData || {
        options: { hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)', r: '0', g: '0', b: '0' }
    };
    const values = data.options!;

    useEffect(() => {
        addToHistory(TOOL_ID);
        // Set default if empty
        if (!values.hex) updateFromHex('#6366F1'); // Indigo-500 default
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addToHistory]);

    const updateFromHex = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            setToolData(effectiveId, {
                options: {
                    hex: hex,
                    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
                    r: rgb.r.toString(),
                    g: rgb.g.toString(),
                    b: rgb.b.toString()
                }
            });
        } else {
            setToolData(effectiveId, { options: { ...values, hex } });
        }
    };

    const updateFromRgb = (rStr: string, gStr: string, bStr: string) => {
        const r = parseInt(rStr) || 0;
        const g = parseInt(gStr) || 0;
        const b = parseInt(bStr) || 0;
        const hex = rgbToHex(Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)));
        updateFromHex(hex);
    };

    const handleClear = () => updateFromHex('#000000');

    return (
        <ToolPane
            toolId={effectiveId}
            title="Color Converter"
            description="Convert colors between Hex, RGB, and HSL"
            onClear={handleClear}
        >
            <div className="max-w-xl mx-auto space-y-8 py-8 px-4">
                <div className="flex justify-center mb-4">
                    <div
                        className="w-32 h-32 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/10 transition-transform hover:scale-105 duration-300"
                        style={{ backgroundColor: values.hex }}
                    />
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Hex Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 glass-panel shrink-0">
                                <input 
                                    type="color" 
                                    value={values.hex} 
                                    onChange={(e) => updateFromHex(e.target.value)} 
                                    className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] cursor-pointer" 
                                />
                            </div>
                            <Input
                                value={values.hex}
                                onChange={(e) => updateFromHex(e.target.value)}
                                className="font-mono uppercase text-lg"
                                placeholder="#000000"
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">RGB Values</label>
                        <div className="grid grid-cols-3 gap-3">
                            <Input type="number" value={values.r} onChange={e => updateFromRgb(e.target.value, values.g, values.b)} placeholder="R" min="0" max="255" className="text-center font-mono" fullWidth />
                            <Input type="number" value={values.g} onChange={e => updateFromRgb(values.r, e.target.value, values.b)} placeholder="G" min="0" max="255" className="text-center font-mono" fullWidth />
                            <Input type="number" value={values.b} onChange={e => updateFromRgb(values.r, values.g, e.target.value)} placeholder="B" min="0" max="255" className="text-center font-mono" fullWidth />
                        </div>
                        <Input
                            value={values.rgb}
                            readOnly
                            className="font-mono text-foreground-secondary"
                            fullWidth
                        />
                    </div>

                    <Input
                        label="HSL"
                        value={values.hsl}
                        readOnly
                        className="font-mono text-foreground-secondary"
                        fullWidth
                    />
                </div>
            </div>
        </ToolPane>
    );
};
