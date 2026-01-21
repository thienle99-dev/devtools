import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'file-size';

interface FileSizeConverterProps {
    tabId?: string;
}

const UNITS = [
    { id: 'bytes', label: 'Bytes', multiplier: 1 },
    { id: 'kb', label: 'KB', multiplier: 1024 },
    { id: 'mb', label: 'MB', multiplier: 1024 * 1024 },
    { id: 'gb', label: 'GB', multiplier: 1024 * 1024 * 1024 },
    { id: 'tb', label: 'TB', multiplier: 1024 * 1024 * 1024 * 1024 },
    { id: 'pb', label: 'PB', multiplier: 1024 * 1024 * 1024 * 1024 * 1024 },
];

export const FileSizeConverter: React.FC<FileSizeConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromUnit: 'bytes', toUnit: 'kb' } };
    const { input, output } = data;
    const [fromUnit, setFromUnit] = useState<string>(data.options?.fromUnit || 'bytes');
    const [toUnit, setToUnit] = useState<string>(data.options?.toUnit || 'kb');

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

    const formatFileSize = (bytes: number, unit: string): string => {
        const unitConfig = UNITS.find(u => u.id === unit);
        if (!unitConfig) return bytes.toString();
        
        const value = bytes / unitConfig.multiplier;
        return value.toFixed(2);
    };

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            const inputValue = parseFloat(input.trim());
            if (isNaN(inputValue) || inputValue < 0) {
                throw new Error('Invalid number. Please enter a positive number.');
            }

            const fromUnitConfig = UNITS.find(u => u.id === fromUnit);
            const toUnitConfig = UNITS.find(u => u.id === toUnit);

            if (!fromUnitConfig || !toUnitConfig) {
                throw new Error('Invalid unit configuration');
            }

            // Convert to bytes first
            const bytes = inputValue * fromUnitConfig.multiplier;
            // Convert to target unit
            const result = formatFileSize(bytes, toUnit);

            setToolData(effectiveId, { 
                output: `${result} ${toUnitConfig.label}`,
                options: { ...data.options, fromUnit, toUnit }
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
            title="File Size Converter"
            description="Convert between bytes, KB, MB, GB, TB, PB"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Unit Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Unit */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Unit</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {UNITS.map((unit) => (
                                <button
                                    key={unit.id}
                                    onClick={() => {
                                        setFromUnit(unit.id);
                                        setToolData(effectiveId, { options: { ...data.options, fromUnit: unit.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-center",
                                        fromUnit === unit.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    {unit.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Unit */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Unit</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {UNITS.map((unit) => (
                                <button
                                    key={unit.id}
                                    onClick={() => {
                                        setToUnit(unit.id);
                                        setToolData(effectiveId, { options: { ...data.options, toUnit: unit.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-center",
                                        toUnit === unit.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    {unit.label}
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {UNITS.find(u => u.id === fromUnit)?.label || 'Input'}
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
                                placeholder="Enter file size..."
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {UNITS.find(u => u.id === toUnit)?.label || 'Output'}
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
                                <HardDrive className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted file size will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
