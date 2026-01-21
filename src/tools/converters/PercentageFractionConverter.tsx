import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Percent } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'percentage-fraction';

interface PercentageFractionConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'percentage-to-decimal', label: 'Percentage → Decimal', description: '50% → 0.5' },
    { id: 'decimal-to-percentage', label: 'Decimal → Percentage', description: '0.5 → 50%' },
    { id: 'fraction-to-decimal', label: 'Fraction → Decimal', description: '1/2 → 0.5' },
    { id: 'decimal-to-fraction', label: 'Decimal → Fraction', description: '0.5 → 1/2' },
    { id: 'percentage-to-fraction', label: 'Percentage → Fraction', description: '50% → 1/2' },
    { id: 'fraction-to-percentage', label: 'Fraction → Percentage', description: '1/2 → 50%' },
];

const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
};

const decimalToFraction = (decimal: number): string => {
    if (decimal === 0) return '0/1';
    if (decimal === 1) return '1/1';
    
    const tolerance = 1.0E-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = decimal;
    
    do {
        const a = Math.floor(b);
        const aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
    
    const divisor = gcd(h1, k1);
    return `${h1 / divisor}/${k1 / divisor}`;
};

export const PercentageFractionConverter: React.FC<PercentageFractionConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'percentage-to-decimal' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'percentage-to-decimal');

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

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            let result = '';

            switch (mode) {
                case 'percentage-to-decimal':
                    const percent = parseFloat(input.replace('%', '').trim());
                    if (isNaN(percent)) throw new Error('Invalid percentage');
                    result = (percent / 100).toString();
                    break;

                case 'decimal-to-percentage':
                    const decimal = parseFloat(input.trim());
                    if (isNaN(decimal)) throw new Error('Invalid decimal');
                    result = `${(decimal * 100).toString()}%`;
                    break;

                case 'fraction-to-decimal':
                    const fractionMatch = input.trim().match(/^(\d+)\/(\d+)$/);
                    if (!fractionMatch) throw new Error('Invalid fraction format. Use: numerator/denominator');
                    const numerator = parseFloat(fractionMatch[1]);
                    const denominator = parseFloat(fractionMatch[2]);
                    if (denominator === 0) throw new Error('Division by zero');
                    result = (numerator / denominator).toString();
                    break;

                case 'decimal-to-fraction':
                    const dec = parseFloat(input.trim());
                    if (isNaN(dec)) throw new Error('Invalid decimal');
                    result = decimalToFraction(dec);
                    break;

                case 'percentage-to-fraction':
                    const perc = parseFloat(input.replace('%', '').trim());
                    if (isNaN(perc)) throw new Error('Invalid percentage');
                    const decValue = perc / 100;
                    result = decimalToFraction(decValue);
                    break;

                case 'fraction-to-percentage':
                    const fracMatch = input.trim().match(/^(\d+)\/(\d+)$/);
                    if (!fracMatch) throw new Error('Invalid fraction format. Use: numerator/denominator');
                    const num = parseFloat(fracMatch[1]);
                    const den = parseFloat(fracMatch[2]);
                    if (den === 0) throw new Error('Division by zero');
                    result = `${((num / den) * 100).toString()}%`;
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
            title="Percentage/Fraction/Decimal Converter"
            description="Convert between percentage, fraction, and decimal formats"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Mode Switcher */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
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
                                placeholder="Enter percentage, fraction, or decimal..."
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
                                <Percent className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted result will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
