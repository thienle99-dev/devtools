import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'epoch-timestamp';

interface EpochTimestampConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'seconds-to-date', label: 'Seconds → Date', description: 'Unix timestamp (seconds) to date' },
    { id: 'milliseconds-to-date', label: 'Milliseconds → Date', description: 'Unix timestamp (ms) to date' },
    { id: 'date-to-seconds', label: 'Date → Seconds', description: 'Date to Unix timestamp (seconds)' },
    { id: 'date-to-milliseconds', label: 'Date → Milliseconds', description: 'Date to Unix timestamp (ms)' },
];

export const EpochTimestampConverter: React.FC<EpochTimestampConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'seconds-to-date' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'seconds-to-date');

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
                case 'seconds-to-date':
                    const seconds = parseInt(input.trim(), 10);
                    if (isNaN(seconds)) throw new Error('Invalid number');
                    const dateFromSeconds = new Date(seconds * 1000);
                    result = dateFromSeconds.toISOString() + '\n' + dateFromSeconds.toLocaleString();
                    break;

                case 'milliseconds-to-date':
                    const milliseconds = parseInt(input.trim(), 10);
                    if (isNaN(milliseconds)) throw new Error('Invalid number');
                    const dateFromMs = new Date(milliseconds);
                    result = dateFromMs.toISOString() + '\n' + dateFromMs.toLocaleString();
                    break;

                case 'date-to-seconds':
                    const dateToSeconds = new Date(input.trim());
                    if (isNaN(dateToSeconds.getTime())) throw new Error('Invalid date format');
                    result = Math.floor(dateToSeconds.getTime() / 1000).toString();
                    break;

                case 'date-to-milliseconds':
                    const dateToMs = new Date(input.trim());
                    if (isNaN(dateToMs.getTime())) throw new Error('Invalid date format');
                    result = dateToMs.getTime().toString();
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
            title="Epoch Timestamp Converter"
            description="Convert between Unix timestamps and dates"
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
                                placeholder="Enter timestamp or date..."
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
                                <Clock className="w-3.5 h-3.5 text-foreground-muted/50" />
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
