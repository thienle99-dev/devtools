import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'timezone-converter';

interface TimeZoneConverterProps {
    tabId?: string;
}

const TIMEZONES = [
    { id: 'UTC', label: 'UTC', offset: 0 },
    { id: 'America/New_York', label: 'New York (EST/EDT)', offset: -5 },
    { id: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: -8 },
    { id: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
    { id: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 1 },
    { id: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
    { id: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 8 },
    { id: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4 },
    { id: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 11 },
];

export const TimeZoneConverter: React.FC<TimeZoneConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromTimezone: 'UTC', toTimezone: 'America/New_York' } };
    const { input, output } = data;
    const [fromTimezone, setFromTimezone] = useState<string>(data.options?.fromTimezone || 'UTC');
    const [toTimezone, setToTimezone] = useState<string>(data.options?.toTimezone || 'America/New_York');

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

            // Parse input date
            const inputDate = new Date(input.trim());
            if (isNaN(inputDate.getTime())) {
                throw new Error('Invalid date format');
            }

            // Format date in from timezone
            const fromTz = TIMEZONES.find(tz => tz.id === fromTimezone);
            const toTz = TIMEZONES.find(tz => tz.id === toTimezone);

            if (!fromTz || !toTz) {
                throw new Error('Invalid timezone');
            }

            // Convert using Intl.DateTimeFormat
            const fromFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: fromTz.id,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const toFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: toTz.id,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const fromFormatted = fromFormatter.format(inputDate);
            const toFormatted = toFormatter.format(inputDate);

            const result = `${toFormatted}\n${toTz.label}\n\nOriginal: ${fromFormatted}\n${fromTz.label}`;

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, fromTimezone, toTimezone }
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
            title="Time Zone Converter"
            description="Convert dates between different time zones"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Timezone Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Timezone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Timezone</label>
                        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {TIMEZONES.map((tz) => (
                                <button
                                    key={tz.id}
                                    onClick={() => {
                                        setFromTimezone(tz.id);
                                        setToolData(effectiveId, { options: { ...data.options, fromTimezone: tz.id } });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                        fromTimezone === tz.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    {tz.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Timezone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Timezone</label>
                        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {TIMEZONES.map((tz) => (
                                <button
                                    key={tz.id}
                                    onClick={() => {
                                        setToTimezone(tz.id);
                                        setToolData(effectiveId, { options: { ...data.options, toTimezone: tz.id } });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                        toTimezone === tz.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    {tz.label}
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
                                    {TIMEZONES.find(tz => tz.id === fromTimezone)?.label || 'Input'}
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
                                placeholder="Enter date/time..."
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
                                    {TIMEZONES.find(tz => tz.id === toTimezone)?.label || 'Output'}
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
                                <Globe className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted date/time will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
