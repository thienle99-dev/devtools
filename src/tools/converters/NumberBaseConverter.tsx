import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Binary, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'number-base';

interface NumberBaseConverterProps {
    tabId?: string;
}

const BASE_TYPES = [
    { id: 'decimal', label: 'Decimal', base: 10, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { id: 'hex', label: 'Hexadecimal', base: 16, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { id: 'octal', label: 'Octal', base: 8, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    { id: 'binary', label: 'Binary', base: 2, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
];

export const NumberBaseConverter: React.FC<NumberBaseConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromBase: 'decimal', toBase: 'hex' } };
    const { input, output } = data;
    const [fromBase, setFromBase] = useState<string>(data.options?.fromBase || 'decimal');
    const [toBase, setToBase] = useState<string>(data.options?.toBase || 'hex');

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

    const convertNumberBase = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            const fromBaseConfig = BASE_TYPES.find(b => b.id === fromBase);
            const toBaseConfig = BASE_TYPES.find(b => b.id === toBase);

            if (!fromBaseConfig || !toBaseConfig) {
                toast.error('Invalid base configuration');
                return;
            }

            // Parse from source base
            const num = parseInt(input.trim(), fromBaseConfig.base);
            
            if (isNaN(num)) {
                throw new Error(`Invalid ${fromBaseConfig.label} number`);
            }

            // Convert to target base
            let result = '';
            if (toBaseConfig.base === 10) {
                result = num.toString();
            } else if (toBaseConfig.base === 16) {
                result = num.toString(16).toUpperCase();
            } else if (toBaseConfig.base === 8) {
                result = num.toString(8);
            } else if (toBaseConfig.base === 2) {
                result = num.toString(2);
            }

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, fromBase, toBase }
            });
            toast.success(`Converted from ${fromBaseConfig.label} to ${toBaseConfig.label}`);
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    return (
        <ToolPane
            title="Number Base Converter"
            description="Convert between decimal, hex, octal, and binary"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Base Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Base */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Base</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {BASE_TYPES.map((base) => (
                                <button
                                    key={base.id}
                                    onClick={() => {
                                        setFromBase(base.id);
                                        setToolData(effectiveId, { options: { ...data.options, fromBase: base.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium flex items-center justify-center gap-1.5",
                                        fromBase === base.id
                                            ? `${base.bgColor} ${base.borderColor} border-2`
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    <Binary className="w-3 h-3" />
                                    {base.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Base */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Base</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {BASE_TYPES.map((base) => (
                                <button
                                    key={base.id}
                                    onClick={() => {
                                        setToBase(base.id);
                                        setToolData(effectiveId, { options: { ...data.options, toBase: base.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium flex items-center justify-center gap-1.5",
                                        toBase === base.id
                                            ? `${base.bgColor} ${base.borderColor} border-2`
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    <Binary className="w-3 h-3" />
                                    {base.label}
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
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {BASE_TYPES.find(b => b.id === fromBase)?.label || 'Input'}
                                </span>
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
                                placeholder={`Enter ${BASE_TYPES.find(b => b.id === fromBase)?.label || 'number'} here...`}
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convertNumberBase} 
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
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {BASE_TYPES.find(b => b.id === toBase)?.label || 'Output'}
                                </span>
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
                                <span className="text-[9px] font-mono text-foreground-muted/50">
                                    {BASE_TYPES.find(b => b.id === toBase)?.label.toUpperCase().slice(0, 3) || 'OUT'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder={`Converted ${BASE_TYPES.find(b => b.id === toBase)?.label || 'number'} will appear here...`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
