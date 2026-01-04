import React, { useEffect } from 'react';
import { UAParser } from 'ua-parser-js';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolStore } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';

const TOOL_ID = 'user-agent-parser';

export const UserAgentParser: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    const data = tools[TOOL_ID] || {
        input: '',
        options: {
            // Parsed results
            browser: {},
            cpu: {},
            device: {},
            engine: {},
            os: {},
            ua: ''
        }
    };

    // We treat 'input' as the UA String
    const { input, options } = data;
    const result = options; // Alias for readability

    useEffect(() => {
        addToHistory(TOOL_ID);
        // Default to current UA if empty
        if (!input) {
            handleInputChange(navigator.userAgent);
        }
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        const parser = new UAParser(val);
        const res = parser.getResult();
        setToolData(TOOL_ID, {
            input: val,
            options: res
        });
    };

    const handleClear = () => clearToolData(TOOL_ID);

    const InfoCard = ({ title, data }: { title: string, data: Record<string, any> }) => (
        <div className="space-y-2 p-4 glass-panel rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-3 flex items-center">
                {title}
            </h3>
            <div className="grid grid-cols-1 gap-2">
                {Object.entries(data).map(([k, v]) => (
                    v ? (
                        <div key={k} className="flex justify-between items-center text-sm border-b border-white/5 pb-1 last:border-0">
                            <span className="text-foreground-secondary capitalize">{k}</span>
                            <span className="font-mono text-primary font-medium">{String(v)}</span>
                        </div>
                    ) : null
                ))}
                {Object.keys(data).length === 0 && <div className="text-foreground-muted italic text-xs">No info detected</div>}
            </div>
        </div>
    );

    return (
        <ToolPane
            title="User Agent Parser"
            description="Parse User-Agent strings to detect browser, OS, and device"
            onClear={handleClear}
            actions={<Button variant="glass" size="sm" onClick={() => handleInputChange(navigator.userAgent)}>My User Agent</Button>}
        >
            <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">User Agent String</label>
                    <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="glass-input w-full min-h-[80px] text-sm font-mono p-3 leading-relaxed"
                        placeholder="Mozilla/5.0..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoCard title="Browser" data={result.browser || {}} />
                    <InfoCard title="Operating System" data={result.os || {}} />
                    <InfoCard title="Device" data={result.device || {}} />
                    <InfoCard title="Engine" data={result.engine || {}} />
                    <InfoCard title="CPU" data={result.cpu || {}} />
                </div>
            </div>
        </ToolPane>
    );
};
