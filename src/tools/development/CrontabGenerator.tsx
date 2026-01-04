import React, { useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import cronstrue from 'cronstrue';

const TOOL_ID = 'crontab-generator';

const STANDARD_PRESETS = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Every Sunday at midnight', value: '0 0 * * 0' },
    { label: 'Every month (1st)', value: '0 0 1 * *' },
];

interface CrontabGeneratorProps {
    tabId?: string;
}

export const CrontabGenerator: React.FC<CrontabGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '* * * * *',
        options: {
            minute: '*',
            hour: '*',
            day: '*',
            month: '*',
            weekday: '*'
        },
        meta: {
            desc: '',
            nextDates: []
        }
    };

    // We treat 'input' as the generated cron expression string
    const { input, options, meta } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    useEffect(() => {
        // Update description when input changes
        try {
            const desc = cronstrue.toString(input, { use24HourTimeFormat: true });
            setToolData(effectiveId, { meta: { ...meta, desc } });
        } catch (e) {
            setToolData(effectiveId, { meta: { ...meta, desc: 'Invalid cron expression' } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input, setToolData, effectiveId]); // meta is unstable dependency

    const handlePartChange = (part: string, value: string) => {
        const newOptions = { ...options, [part]: value };
        const newVal = `${newOptions.minute} ${newOptions.hour} ${newOptions.day} ${newOptions.month} ${newOptions.weekday}`;
        setToolData(effectiveId, { options: newOptions, input: newVal });
    };

    const handleInputChange = (val: string) => {
        // Reverse parse is hard, just update input and try to describe
        setToolData(effectiveId, { input: val });
        // Optionally try to split back into parts if it matches standard 5-part
        const parts = val.trim().split(/\s+/);
        if (parts.length === 5) {
            setToolData(effectiveId, {
                input: val,
                options: {
                    minute: parts[0],
                    hour: parts[1],
                    day: parts[2],
                    month: parts[3],
                    weekday: parts[4]
                }
            });
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        setToolData(effectiveId, { input: '* * * * *', options: { minute: '*', hour: '*', day: '*', month: '*', weekday: '*' } });
    };

    return (
        <ToolPane
            title="Crontab Generator"
            description="Generate and explain cron schedule expressions"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">

                {/* Main Display */}
                <div className="text-center space-y-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="glass-input text-center text-3xl font-mono tracking-widest w-full py-4"
                    />
                    <div className="text-xl font-medium text-primary min-h-[1.5rem] transition-all">
                        {meta?.desc}
                    </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap justify-center gap-2">
                    {STANDARD_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => handleInputChange(p.value)}
                            className="px-3 py-1 rounded-full text-xs bg-glass-input hover:bg-glass-input-focus border border-border-glass transition-colors"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Simple Builders */}
                <div className="grid grid-cols-5 gap-2 text-center">
                    {['Minute', 'Hour', 'Day', 'Month', 'Weekday'].map((label, i) => {
                        const key = label.toLowerCase();
                        const val = Object.values(options)[i];
                        return (
                            <div key={label} className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-foreground-muted">{label}</label>
                                <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handlePartChange(key, e.target.value)}
                                    className="glass-input w-full text-center font-mono text-sm"
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="glass-panel p-4 text-xs text-foreground-secondary space-y-2">
                    <h4 className="font-bold text-foreground-muted uppercase tracking-wider">Cheat Sheet</h4>
                    <pre className="font-mono whitespace-pre-wrap">
                        {`* * * * * command to execute
│ │ │ │ │
│ │ │ │ └── Day of week (0 - 7) (Sunday=0 or 7)
│ │ │ └──── Month (1 - 12)
│ │ └────── Day of month (1 - 31)
│ └──────── Hour (0 - 23)
└────────── Minute (0 - 59)

* : Any value
, : Value list separator (1,3,5)
- : Range of values (1-5)
/ : Step values (*/5)
`}
                    </pre>
                </div>
            </div>
        </ToolPane>
    );
};
