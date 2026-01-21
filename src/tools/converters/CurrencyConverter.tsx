import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'currency-converter';

interface CurrencyConverterProps {
    tabId?: string;
}

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromCurrency: 'USD', toCurrency: 'EUR' } };
    const { input, output } = data;
    const [fromCurrency, setFromCurrency] = useState<string>(data.options?.fromCurrency || 'USD');
    const [toCurrency, setToCurrency] = useState<string>(data.options?.toCurrency || 'EUR');
    const [loading, setLoading] = useState(false);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

    useEffect(() => {
        addToHistory(TOOL_ID);
        // Load exchange rates (using free API or fallback)
        loadExchangeRates();
    }, [addToHistory]);

    const loadExchangeRates = async () => {
        try {
            setLoading(true);
            // Using exchangerate-api.com free tier (no API key needed for USD base)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (response.ok) {
                const data = await response.json();
                setExchangeRates(data.rates || {});
            } else {
                // Fallback: use approximate rates
                setExchangeRates({
                    EUR: 0.92, GBP: 0.79, JPY: 150, CNY: 7.2, INR: 83, KRW: 1330,
                    AUD: 1.52, CAD: 1.35, CHF: 0.88, SGD: 1.34, HKD: 7.82
                });
            }
        } catch (error) {
            // Fallback rates
            setExchangeRates({
                EUR: 0.92, GBP: 0.79, JPY: 150, CNY: 7.2, INR: 83, KRW: 1330,
                AUD: 1.52, CAD: 1.35, CHF: 0.88, SGD: 1.34, HKD: 7.82
            });
        } finally {
            setLoading(false);
        }
    };

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

            const amount = parseFloat(input.trim());
            if (isNaN(amount) || amount < 0) {
                throw new Error('Invalid amount');
            }

            // Get exchange rates
            const fromRate = fromCurrency === 'USD' ? 1 : (exchangeRates[fromCurrency] || 1);
            const toRate = toCurrency === 'USD' ? 1 : (exchangeRates[toCurrency] || 1);

            // Convert: USD amount = amount / fromRate, then multiply by toRate
            const usdAmount = amount / fromRate;
            const result = usdAmount * toRate;

            // const fromCurr = CURRENCIES.find(c => c.code === fromCurrency);
            const toCurr = CURRENCIES.find(c => c.code === toCurrency);

            setToolData(effectiveId, {
                output: `${toCurr?.symbol || ''}${result.toFixed(2)} ${toCurrency}\n\nRate: 1 ${fromCurrency} = ${(toRate / fromRate).toFixed(4)} ${toCurrency}`,
                options: { ...data.options, fromCurrency, toCurrency }
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
            title="Currency Converter"
            description="Convert between different currencies"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Currency Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Currency */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Currency</label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => {
                                        setFromCurrency(curr.code);
                                        setToolData(effectiveId, { options: { ...data.options, fromCurrency: curr.code } });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                        fromCurrency === curr.code
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    <div className="font-semibold">{curr.code}</div>
                                    <div className="text-[9px] text-foreground-muted/70">{curr.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Currency */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Currency</label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => {
                                        setToCurrency(curr.code);
                                        setToolData(effectiveId, { options: { ...data.options, toCurrency: curr.code } });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                        toCurrency === curr.code
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    <div className="font-semibold">{curr.code}</div>
                                    <div className="text-[9px] text-foreground-muted/70">{curr.name}</div>
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
                                    {CURRENCIES.find(c => c.code === fromCurrency)?.code || 'Input'}
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
                                placeholder="Enter amount..."
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={convert}
                                className="w-full font-semibold gap-2"
                                disabled={!input.trim() || loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-3.5 h-3.5" />
                                )}
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
                                    {CURRENCIES.find(c => c.code === toCurrency)?.code || 'Output'}
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
                                <DollarSign className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted amount will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
