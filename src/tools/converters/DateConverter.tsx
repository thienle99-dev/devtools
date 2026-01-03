import React, { useEffect } from 'react';
import { format, isValid, parseISO, fromUnixTime } from 'date-fns';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolStore } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';

const TOOL_ID = 'date-time';

export const DateConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    const data = tools[TOOL_ID] || {
        input: '',
        options: {
            iso: '',
            utc: '',
            local: '',
            unix: '',
            readable: ''
        }
    };

    // We treat 'input' as the raw source currently being typed, 
    // and 'options' holds the converted values.
    const { input, options } = data;
    const values = options || {};

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Auto-detect and convert on input change
    const handleInputChange = (val: string) => {
        setToolData(TOOL_ID, { input: val });
        convert(val);
    };

    const convert = (val: string) => {
        if (!val.trim()) {
            setToolData(TOOL_ID, { options: {} });
            return;
        }

        let date: Date | null = null;

        // 1. Try Unix Timestamp (seconds or milliseconds)
        if (/^\d{10,}$/.test(val)) {
            // Assume ms if > 12 digits, else seconds
            const num = parseInt(val, 10);
            if (val.length > 11) {
                date = new Date(num);
            } else {
                date = fromUnixTime(num);
            }
        }
        // 2. Try ISO string text
        else {
            const parsed = parseISO(val);
            if (isValid(parsed)) date = parsed;
            // 3. Try standard Date parse
            else {
                const d = new Date(val);
                if (isValid(d)) date = d;
            }
        }

        if (date && isValid(date)) {
            setToolData(TOOL_ID, {
                options: {
                    iso: date.toISOString(),
                    utc: date.toUTCString(),
                    local: date.toString(),
                    unix: Math.floor(date.getTime() / 1000).toString(),
                    unix_ms: date.getTime().toString(),
                    readable: format(date, 'PPP pp'), // e.g., Oct 29, 2023 10:00 AM
                }
            });
        }
    };

    const handleNow = () => {
        const now = new Date();
        const unix = Math.floor(now.getTime() / 1000).toString();
        handleInputChange(unix);
    };

    const handleClear = () => clearToolData(TOOL_ID);

    return (
        <ToolPane
            title="Date-time Converter"
            description="Convert between various date and time formats (ISO, Unix, UTC, etc.)"
            onClear={handleClear}
            actions={<Button variant="glass" size="sm" onClick={handleNow}>Now</Button>}
        >
            <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input (ISO, Unix, or Text)</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="glass-input w-full"
                        placeholder="e.g. 1698500000 or 2023-10-29T10:00:00Z"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Human Readable</label>
                        <input type="text" readOnly value={values.readable || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">ISO 8601</label>
                        <input type="text" readOnly value={values.iso || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">UTC / GMT</label>
                        <input type="text" readOnly value={values.utc || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Local Time</label>
                        <input type="text" readOnly value={values.local || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Unix Timestamp (Seconds)</label>
                        <input type="text" readOnly value={values.unix || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Unix Timestamp (Milliseconds)</label>
                        <input type="text" readOnly value={values.unix_ms || ''} className="glass-input w-full bg-black/10 text-foreground-secondary" />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
