import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Network } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'mac-address';

interface MacAddressConverterProps {
    tabId?: string;
}

const FORMATS = [
    { id: 'colon', label: 'Colon', example: 'AA:BB:CC:DD:EE:FF', separator: ':' },
    { id: 'hyphen', label: 'Hyphen', example: 'AA-BB-CC-DD-EE-FF', separator: '-' },
    { id: 'none', label: 'None', example: 'AABBCCDDEEFF', separator: '' },
    { id: 'dot', label: 'Dot', example: 'AA.BB.CC.DD.EE.FF', separator: '.' },
];

export const MacAddressConverter: React.FC<MacAddressConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromFormat: 'colon', toFormat: 'hyphen' } };
    const { input, output } = data;
    const [fromFormat, setFromFormat] = useState<string>(data.options?.fromFormat || 'colon');
    const [toFormat, setToFormat] = useState<string>(data.options?.toFormat || 'hyphen');

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const parseMacAddress = (mac: string, format: string): string[] => {
        const formatConfig = FORMATS.find(f => f.id === format);
        if (!formatConfig) return [];

        if (format === 'none') {
            // No separator - expect 12 hex characters
            const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '');
            if (cleaned.length !== 12) throw new Error('Invalid MAC address length');
            return cleaned.match(/.{1,2}/g) || [];
        } else {
            // Has separator
            const parts = mac.split(formatConfig.separator);
            if (parts.length !== 6) throw new Error('Invalid MAC address format');
            return parts.map(part => {
                const cleaned = part.replace(/[^0-9A-Fa-f]/g, '');
                if (cleaned.length !== 2) throw new Error(`Invalid octet: ${part}`);
                return cleaned.toUpperCase();
            });
        }
    };

    const formatMacAddress = (parts: string[], format: string): string => {
        const formatConfig = FORMATS.find(f => f.id === format);
        if (!formatConfig) return parts.join('');
        return parts.join(formatConfig.separator);
    };

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            const parts = parseMacAddress(input.trim(), fromFormat);
            const result = formatMacAddress(parts, toFormat);

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, fromFormat, toFormat }
            });
            toast.success('Conversion completed');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    return (
        <ToolPane
            title="MAC Address Converter"
            description="Convert between different MAC address formats"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Format Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Format */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Format</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FORMATS.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => {
                                        setFromFormat(fmt.id);
                                        setToolData(effectiveId, { options: { ...data.options, fromFormat: fmt.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-left",
                                        fromFormat === fmt.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                    title={fmt.example}
                                >
                                    <div className="font-semibold">{fmt.label}</div>
                                    <div className="text-[9px] text-foreground-muted/70 font-mono truncate">{fmt.example}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Format */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Format</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FORMATS.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => {
                                        setToFormat(fmt.id);
                                        setToolData(effectiveId, { options: { ...data.options, toFormat: fmt.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-left",
                                        toFormat === fmt.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                    title={fmt.example}
                                >
                                    <div className="font-semibold">{fmt.label}</div>
                                    <div className="text-[9px] text-foreground-muted/70 font-mono truncate">{fmt.example}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Split Editor */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                    {/* Left Input */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Input</span>
                            </div>
                            {input && (
                                <button 
                                    onClick={() => handleCopy(input, 'Input')} 
                                    className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                    title="Copy Input"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Enter MAC address..."
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convert} 
                                className="w-full font-semibold gap-2"
                                disabled={!input.trim()}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Convert
                            </Button>
                        </div>
                    </div>

                    {/* Right Output */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {output && (
                                    <button 
                                        onClick={() => handleCopy(output, 'Output')} 
                                        className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                        title="Copy Output"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <Network className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted MAC address will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
