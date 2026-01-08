import React, { useEffect } from 'react';
import { format, isValid, parseISO, fromUnixTime } from 'date-fns';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'date-time';

interface DateConverterProps {
    tabId?: string;
}

export const DateConverter: React.FC<DateConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
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
        setToolData(effectiveId, { input: val });
        convert(val);
    };

    const convert = (val: string) => {
        if (!val.trim()) {
            setToolData(effectiveId, { options: {} });
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
            setToolData(effectiveId, {
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

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="Date-time Converter"
            description="Convert between various date and time formats (ISO, Unix, UTC, etc.)"
            onClear={handleClear}
            actions={<Button variant="glass" size="sm" onClick={handleNow}>Now</Button>}
        >
            <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
                <Input
                    label="Input (ISO, Unix, or Text)"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="e.g. 1698500000 or 2023-10-29T10:00:00Z"
                    fullWidth
                    className="text-lg"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Human Readable" readOnly value={values.readable || ''} fullWidth className="text-foreground-secondary font-medium" />
                    <Input label="ISO 8601" readOnly value={values.iso || ''} fullWidth className="text-foreground-secondary font-mono text-xs" />
                    <Input label="UTC / GMT" readOnly value={values.utc || ''} fullWidth className="text-foreground-secondary font-mono text-xs" />
                    <Input label="Local Time" readOnly value={values.local || ''} fullWidth className="text-foreground-secondary font-mono text-xs" />
                    <Input label="Unix Timestamp (Seconds)" readOnly value={values.unix || ''} fullWidth className="text-foreground-secondary font-mono" />
                    <Input label="Unix Timestamp (Milliseconds)" readOnly value={values.unix_ms || ''} fullWidth className="text-foreground-secondary font-mono" />
                </div>
            </div>
        </ToolPane>
    );
};
