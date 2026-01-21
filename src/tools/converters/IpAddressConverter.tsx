import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Network } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'ip-address';

interface IpAddressConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'dotted-to-decimal', label: 'Dotted → Decimal', description: '192.168.1.1 → 3232235777' },
    { id: 'decimal-to-dotted', label: 'Decimal → Dotted', description: '3232235777 → 192.168.1.1' },
    { id: 'dotted-to-binary', label: 'Dotted → Binary', description: '192.168.1.1 → 11000000.10101000.00000001.00000001' },
    { id: 'binary-to-dotted', label: 'Binary → Dotted', description: '11000000.10101000.00000001.00000001 → 192.168.1.1' },
];

export const IpAddressConverter: React.FC<IpAddressConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'dotted-to-decimal' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'dotted-to-decimal');

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

    const isValidIPv4 = (ip: string): boolean => {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255;
        });
    };

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            let result = '';

            switch (mode) {
                case 'dotted-to-decimal':
                    if (!isValidIPv4(input.trim())) {
                        throw new Error('Invalid IPv4 address format');
                    }
                    const parts = input.trim().split('.').map(Number);
                    result = (parts[0] * 256 * 256 * 256 + parts[1] * 256 * 256 + parts[2] * 256 + parts[3]).toString();
                    break;

                case 'decimal-to-dotted':
                    const decimal = parseInt(input.trim(), 10);
                    if (isNaN(decimal) || decimal < 0 || decimal > 4294967295) {
                        throw new Error('Invalid decimal value (must be 0-4294967295)');
                    }
                    result = [
                        (decimal >>> 24) & 255,
                        (decimal >>> 16) & 255,
                        (decimal >>> 8) & 255,
                        decimal & 255
                    ].join('.');
                    break;

                case 'dotted-to-binary':
                    if (!isValidIPv4(input.trim())) {
                        throw new Error('Invalid IPv4 address format');
                    }
                    result = input.trim().split('.').map(part => {
                        return parseInt(part, 10).toString(2).padStart(8, '0');
                    }).join('.');
                    break;

                case 'binary-to-dotted':
                    const binaryParts = input.trim().split('.');
                    if (binaryParts.length !== 4) {
                        throw new Error('Invalid binary format. Expected 4 octets separated by dots.');
                    }
                    result = binaryParts.map(bin => {
                        if (!/^[01]{1,8}$/.test(bin)) {
                            throw new Error(`Invalid binary octet: ${bin}`);
                        }
                        return parseInt(bin, 2).toString();
                    }).join('.');
                    break;
            }

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, mode }
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
            title="IP Address Converter"
            description="Convert between IPv4 address formats"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Mode Switcher */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id);
                                setToolData(effectiveId, { options: { ...data.options, mode: m.id } });
                            }}
                            className={cn(
                                "p-2.5 rounded-lg border transition-all text-xs font-medium text-center",
                                mode === m.id
                                    ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                    : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                            )}
                            title={m.description}
                        >
                            <div className="font-semibold">{m.label}</div>
                        </button>
                    ))}
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
                                placeholder="Enter IP address..."
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
                                placeholder="Converted IP address will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
