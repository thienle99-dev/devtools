import React, { useMemo } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Slider } from '@components/ui/Slider';
import { Select } from '@components/ui/Select';
import { FileImage, Copy, Download, RefreshCw, Type, Maximize, Palette } from 'lucide-react';
import { toast } from 'sonner';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.SVG_PLACEHOLDER_GENERATOR;

export const SvgPlaceholderGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData } = useToolState(effectiveId);

    const options = data?.options || {
        width: 300,
        height: 200,
        text: '300x200',
        bgColor: '#333333',
        textColor: '#ffffff',
        fontSize: 24,
        fontFamily: 'sans-serif'
    };

    const svgString = useMemo(() => {
        const { width, height, text, bgColor, textColor, fontSize, fontFamily } = options;
        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="${fontFamily}" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
    ${text || `${width}x${height}`}
  </text>
</svg>`;
    }, [options]);

    const handleOptionChange = (key: string, value: any) => {
        const newOptions = { ...options, [key]: value };
        setToolData(effectiveId, { options: newOptions });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(svgString);
        toast.success('SVG code copied to clipboard');
    };

    const handleDownload = () => {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `placeholder-${options.width}x${options.height}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('SVG downloaded');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="glass-panel p-6 space-y-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <FileImage className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-foreground/70">Placeholder Configuration</h3>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Width (px)"
                                type="number"
                                value={options.width}
                                onChange={(e) => handleOptionChange('width', parseInt(e.target.value) || 0)}
                                icon={Maximize}
                            />
                            <Input
                                label="Height (px)"
                                type="number"
                                value={options.height}
                                onChange={(e) => handleOptionChange('height', parseInt(e.target.value) || 0)}
                                icon={Maximize}
                            />
                        </div>

                        <Input
                            label="Placeholder Text"
                            value={options.text}
                            onChange={(e) => handleOptionChange('text', e.target.value)}
                            placeholder="Defaults to dimensions"
                            icon={Type}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground-secondary ml-1">Background Color</label>
                                <div className="flex gap-2">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-border-glass shrink-0 shadow-sm"
                                        style={{ backgroundColor: options.bgColor }}
                                    />
                                    <Input
                                        value={options.bgColor}
                                        onChange={(e) => handleOptionChange('bgColor', e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground-secondary ml-1">Text Color</label>
                                <div className="flex gap-2">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-border-glass shrink-0 shadow-sm"
                                        style={{ backgroundColor: options.textColor }}
                                    />
                                    <Input
                                        value={options.textColor}
                                        onChange={(e) => handleOptionChange('textColor', e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <Slider
                            label={`Font Size: ${options.fontSize}px`}
                            min={10}
                            max={200}
                            value={options.fontSize}
                            onChange={(val) => handleOptionChange('fontSize', val)}
                        />

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground-secondary ml-1">Font Family</label>
                            <Select
                                value={options.fontFamily}
                                onChange={(val) => handleOptionChange('fontFamily', val)}
                                options={[
                                    { value: 'sans-serif', label: 'Sans Serif' },
                                    { value: 'serif', label: 'Serif' },
                                    { value: 'monospace', label: 'Monospace' },
                                    { value: 'cursive', label: 'Cursive' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border-glass">
                        <Button variant="primary" onClick={handleCopy} icon={Copy} className="flex-1">
                            Copy SVG
                        </Button>
                        <Button variant="secondary" onClick={handleDownload} icon={Download} className="flex-1">
                            Download
                        </Button>
                    </div>
                </div>

                <div className="glass-panel flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-glass bg-foreground/5">
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-foreground/70">Preview</span>
                        </div>
                        <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => handleOptionChange('text', `${options.width}x${options.height}`)}>
                            Reset Text
                        </Button>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center bg-black/40 overflow-auto custom-scrollbar">
                        <div
                            className="shadow-2xl ring-1 ring-border-glass bg-foreground/5"
                            dangerouslySetInnerHTML={{ __html: svgString }}
                        />
                    </div>
                    <div className="p-4 bg-foreground/5 border-t border-border-glass">
                        <div className="flex justify-between text-[10px] text-foreground/30 uppercase tracking-widest font-bold">
                            <span>Image Size: {options.width} × {options.height}</span>
                            <span>Format: SVG</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
