import React, { useState, useEffect, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Slider } from '@components/ui/Slider';
import { QrCode, Download, Copy, ScanLine, Wifi, Link as LinkIcon, Mail, MessageSquare } from 'lucide-react';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { toast } from 'sonner';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.QR_CODE_GENERATOR;

export const QrCodeGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [qrUrl, setQrUrl] = useState<string>('');
    const [scanResult, setScanResult] = useState<string>('');
    const [mode, setMode] = useState<'generate' | 'scan'>('generate');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        input: 'https://github.com/chithien0909/devtools',
        options: {
            size: 300,
            margin: 2,
            colorDark: '#000000',
            colorLight: '#ffffff',
            errorCorrectionLevel: 'M',
            type: 'url'
        }
    };

    const { input, options } = data; // Changed 'text' to 'input'

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    useEffect(() => {
        if (mode === 'generate' && input) { // Changed 'text' to 'input'
            generateQr();
        }
    }, [input, options, mode]); // Changed 'text' to 'input'

    const generateQr = async () => {
        try {
            const url = await QRCode.toDataURL(input, { // Changed 'text' to 'input'
                width: options.size,
                margin: options.margin,
                color: {
                    dark: options.colorDark,
                    light: options.colorLight,
                },
                errorCorrectionLevel: options.errorCorrectionLevel
            });
            setQrUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = qrUrl;
        link.click();
        toast.success('QR Code downloaded!');
    };

    const handleCopy = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('QR Code copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy image');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await QrScanner.scanImage(file);
            setScanResult(result);
            toast.success('QR Code scanned successfully!');
        } catch (err) {
            toast.error('Could not find a valid QR Code in this image');
        }
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="QR Code Tool"
            description="Generate high-quality stylized QR codes or scan them from images"
            onClear={() => clearToolData(effectiveId)}
        >
            <div className="flex flex-col h-full space-y-6">
                {/* Mode Selector */}
                <div className="flex p-1 bg-foreground/[0.05] rounded-xl w-fit">
                    <button
                        onClick={() => setMode('generate')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'generate' ? 'bg-background shadow-lg text-primary' : 'text-foreground-muted hover:text-foreground'}`}
                    >
                        GENERATE
                    </button>
                    <button
                        onClick={() => setMode('scan')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'scan' ? 'bg-background shadow-lg text-primary' : 'text-foreground-muted hover:text-foreground'}`}
                    >
                        SCAN
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                    {/* Input/Settings Panel */}
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        {mode === 'generate' ? (
                            <>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">QR Content</label>
                                    <textarea
                                        value={input} // Changed 'text' to 'input'
                                        onChange={(e) => setToolData(effectiveId, { input: e.target.value })} // Changed 'text' to 'input' and used TOOL_ID
                                        className="w-full h-32 bg-foreground/[0.02] border border-border-glass rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                        placeholder="Enter text or URL to generate QR code..."
                                    />

                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { icon: LinkIcon, label: 'URL', type: 'url' },
                                            { icon: MessageSquare, label: 'Text', type: 'text' },
                                            { icon: Wifi, label: 'WiFi', type: 'wifi' },
                                            { icon: Mail, label: 'Email', type: 'email' },
                                        ].map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => setToolData(effectiveId, { options: { ...options, type: item.type } })} // Used TOOL_ID
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${options.type === item.type ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-foreground/[0.02] border-border-glass text-foreground-muted hover:bg-foreground/[0.05]'}`}
                                            >
                                                <item.icon size={14} />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass-panel rounded-2xl">
                                    <div className="space-y-4">
                                        <Slider
                                            label="Size"
                                            value={options.size}
                                            unit="px"
                                            min={100}
                                            max={1000}
                                            step={10}
                                            onChange={(val) => setToolData(effectiveId, { options: { ...options, size: val } })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Slider
                                            label="Margin"
                                            value={options.margin}
                                            min={0}
                                            max={10}
                                            step={1}
                                            onChange={(val) => setToolData(effectiveId, { options: { ...options, margin: val } })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Error Correction</label>
                                        <Select
                                            value={options.errorCorrectionLevel}
                                            onChange={(e) => setToolData(effectiveId, { options: { ...options, errorCorrectionLevel: e.target.value } })}
                                            options={[
                                                { label: 'Low (L)', value: 'L' },
                                                { label: 'Medium (M)', value: 'M' },
                                                { label: 'Quartile (Q)', value: 'Q' },
                                                { label: 'High (H)', value: 'H' }
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Color (Dark)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={options.colorDark}
                                                onChange={(e) => setToolData(effectiveId, { options: { ...options, colorDark: e.target.value } })}
                                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                                            />
                                            <span className="text-xs font-mono">{options.colorDark}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div
                                    className="border-2 border-dashed border-border-glass rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 hover:bg-foreground/[0.02] transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <ScanLine size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold">Upload QR Image</p>
                                        <p className="text-xs text-foreground-muted mt-1">Select an image to decode</p>
                                    </div>
                                </div>

                                {scanResult && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Scan Result</label>
                                        <div className="glass-panel p-6 rounded-2xl relative group">
                                            <p className="text-sm break-all leading-relaxed">{scanResult}</p>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(scanResult);
                                                    toast.success('Result copied!');
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-foreground/[0.05] hover:bg-foreground/[0.1] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Preview Panel */}
                    <div className="flex flex-col items-center justify-center glass-panel rounded-3xl border border-border-glass p-8 relative overflow-hidden">
                        {mode === 'generate' ? (
                            <>
                                <div className="absolute inset-0 bg-primary/5 -z-10" />
                                <div className="bg-white p-6 rounded-3xl shadow-2xl relative group">
                                    {qrUrl ? (
                                        <img src={qrUrl} alt="QR Code" className="w-full max-w-[300px] h-auto rounded-xl" />
                                    ) : (
                                        <div className="w-[300px] h-[300px] bg-foreground/[0.05] animate-pulse rounded-xl" />
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button variant="primary" icon={Download} onClick={handleDownload}>
                                        Download
                                    </Button>
                                    <Button variant="secondary" icon={Copy} onClick={handleCopy}>
                                        Copy
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-foreground/[0.05] flex items-center justify-center mx-auto text-foreground-muted">
                                    <QrCode size={32} />
                                </div>
                                <p className="text-xs text-foreground-muted max-w-xs mx-auto uppercase tracking-widest leading-loose">
                                    Upload an image on the left to see the result here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
