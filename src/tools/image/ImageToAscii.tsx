import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Slider } from '@components/ui/Slider';
import { Checkbox } from '@components/ui/Checkbox';
import {
    Upload,
    Image as ImageIcon,
    Copy,
    Download,
    Settings,
    Maximize,
    RefreshCcw,
    Type
} from 'lucide-react';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

const TOOL_ID = 'image-to-ascii';

const CHAR_SETS = {
    standard: '@%#*+=-:. ',
    detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    blocks: '█▓▒░ ',
    simple: '#. '
};

interface AsciiOptions {
    width: number;
    charSet: string;
    invert: boolean;
    contrast: number;
    useColor: boolean;
    pixelSize: number;
}

export const ImageToAscii: React.FC<{ tabId?: string }> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData } = useToolState(effectiveId);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [ascii, setAscii] = useState<string>('');
    const [coloredAscii, setColoredAscii] = useState<React.ReactNode[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            width: 100,
            charSet: 'standard',
            invert: false,
            contrast: 1,
            useColor: false,
            pixelSize: 1
        }
    };

    const options = data.options as AsciiOptions;

    const generateAscii = useCallback(() => {
        if (!image || !canvasRef.current) return;

        setIsProcessing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Calculate height to maintain aspect ratio
        // Character aspect ratio is usually around 0.5 (double as tall as wide in mono)
        const charAspectRatio = 0.5;
        const width = options.width;
        const height = Math.max(1, Math.round((image.height / image.width) * width * charAspectRatio));

        canvas.width = width;
        canvas.height = height;

        // Draw and apply contrast
        ctx.drawImage(image, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        let result = '';
        const coloredResult: React.ReactNode[] = [];
        const charSet = CHAR_SETS[options.charSet as keyof typeof CHAR_SETS] || CHAR_SETS.standard;

        for (let y = 0; y < height; y++) {
            let rowText = '';
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const r = pixels[offset];
                const g = pixels[offset + 1];
                const b = pixels[offset + 2];
                const a = pixels[offset + 3];

                // Simple grayscale (luminosity method)
                let brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);

                // Transparency handling
                if (a < 128) brightness = 255;

                // Apply Contrast
                if (options.contrast !== 1) {
                    brightness = ((brightness / 255 - 0.5) * options.contrast + 0.5) * 255;
                    brightness = Math.max(0, Math.min(255, brightness));
                }

                if (options.invert) {
                    brightness = 255 - brightness;
                }

                // Map brightness to character
                const charIndex = Math.floor((brightness / 255) * (charSet.length - 1));
                const char = charSet[charIndex];

                rowText += char;

                if (options.useColor) {
                    coloredResult.push(
                        <span
                            key={`${x}-${y}`}
                            style={{ color: `rgb(${r},${g},${b})` }}
                        >
                            {char}
                        </span>
                    );
                }
            }
            result += rowText + '\n';
            if (options.useColor) {
                coloredResult.push(<br key={`br-${y}`} />);
            }
        }

        setAscii(result);
        setColoredAscii(coloredResult);
        setIsProcessing(false);
    }, [image, options]);

    useEffect(() => {
        const timeout = setTimeout(generateAscii, 100);
        return () => clearTimeout(timeout);
    }, [generateAscii]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                // Adjust width if image is very small
                if (img.width < options.width) {
                    setToolData(effectiveId, {
                        ...data,
                        options: { ...options, width: Math.min(img.width, 150) }
                    });
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(ascii);
        toast.success('ASCII text copied to clipboard!');
    };

    const handleDownload = () => {
        const blob = new Blob([ascii], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ascii-art-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Downloaded as .txt');
    };

    const updateOption = (key: keyof AsciiOptions, value: any) => {
        setToolData(effectiveId, {
            ...data,
            options: { ...options, [key]: value }
        });
    };

    const onClear = () => {
        setImage(null);
        setAscii('');
        setColoredAscii([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        clearToolData(effectiveId);
    };

    return (
        <ToolPane
            title="Image to ASCII"
            description="Convert images to stylized text art with color support"
            onClear={onClear}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!ascii}>
                        <Copy size={14} className="mr-2" /> Copy
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleDownload} disabled={!ascii}>
                        <Download size={14} className="mr-2" /> Download
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                    {/* Left Panel: Settings */}
                    <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar p-1">
                        {/* Dropzone/Preview */}
                        <div
                            className={cn(
                                "relative group cursor-pointer aspect-video rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden flex items-center justify-center bg-foreground/[0.02]",
                                image ? "border-primary/50" : "border-border-glass hover:border-primary/30 hover:bg-primary/[0.02]"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {image ? (
                                <img src={image.src} className="w-full h-full object-contain" alt="Preview" />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Upload size={32} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Drop image here</p>
                                        <p className="text-xs text-foreground-muted">JPG, PNG, WebP supported</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {/* Controls */}
                        <div className="space-y-6 glass-panel p-6 rounded-3xl border border-border-glass">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings size={14} className="text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Generation Settings</h3>
                            </div>

                            <div className="space-y-4">
                                <Slider
                                    label="Width (Characters)"
                                    min={20}
                                    max={300}
                                    step={1}
                                    value={options.width}
                                    onChange={(val: number) => updateOption('width', val)}
                                />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Character Set</label>
                                    <Select
                                        value={options.charSet}
                                        onChange={(e) => updateOption('charSet', e.target.value)}
                                        options={[
                                            { label: 'Standard (@#*+=-:. )', value: 'standard' },
                                            { label: 'Highly Detailed', value: 'detailed' },
                                            { label: 'Block Characters', value: 'blocks' },
                                            { label: 'Simple (#. )', value: 'simple' }
                                        ]}
                                    />
                                </div>

                                <Slider
                                    label="Contrast"
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    value={options.contrast}
                                    onChange={(val: number) => updateOption('contrast', val)}
                                />

                                <div className="grid grid-cols-1 gap-3 pt-2">
                                    <Checkbox
                                        id="invert"
                                        label="Invert Colors"
                                        checked={options.invert}
                                        onChange={() => updateOption('invert', !options.invert)}
                                    />
                                    <Checkbox
                                        id="color"
                                        label="Use Original Colors"
                                        checked={options.useColor}
                                        onChange={() => updateOption('useColor', !options.useColor)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl border border-border-glass bg-primary/5">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <ImageIcon size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black uppercase tracking-tight">Pro Tip</h4>
                                    <p className="text-[10px] text-foreground-muted leading-relaxed">
                                        Higher contrast helps define edges better for ASCII art. Use "Block Characters" for a more digital "low-fi" look.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output */}
                    <div className="lg:col-span-8 flex flex-col min-h-0 glass-panel rounded-3xl border border-border-glass overflow-hidden bg-black/40">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-glass bg-foreground/[0.02]">
                            <div className="flex items-center gap-3">
                                <Maximize size={14} className="text-primary" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Ascii Canvas</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={generateAscii}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60"
                                    title="Regenerate"
                                >
                                    <RefreshCcw size={14} />
                                </button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <span className="text-[10px] font-mono text-white/40">
                                    {isProcessing ? 'Processing...' : `GRID: ${ascii.split('\n')[0]?.length || 0}x${ascii.split('\n').length - 1}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono leading-none tracking-tight select-all">
                            {ascii ? (
                                options.useColor ? (
                                    <div className="whitespace-pre text-[8px] leading-[1] text-center" style={{ fontSize: `${Math.max(4, 10 - options.width / 30)}px` }}>
                                        {coloredAscii}
                                    </div>
                                ) : (
                                    <div className="text-white whitespace-pre text-[8px] leading-[1] text-center" style={{ fontSize: `${Math.max(4, 10 - options.width / 30)}px` }}>
                                        {ascii}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                    <Type size={48} strokeWidth={1} />
                                    <p className="text-xs font-medium italic">Upload an image to see the magic</p>
                                </div>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
