import React, { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Search } from 'lucide-react';
import { analyzeLogs, highlightLogs } from './logic';

const TOOL_ID = 'log-analyzer';

export const LogAnalyzer: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [input, setInput] = useState('');

    const handleAnalyze = () => {
        if (!input.trim()) return;
        const analysis = analyzeLogs(input);
        const highlighted = highlightLogs(input);
        setToolData(TOOL_ID, { output: { analysis, highlighted } });
    };

    const output = toolData?.output;
    const analysis = output?.analysis;
    const highlighted = output?.highlighted || [];

    return (
        <ToolPane
            title="Log Analyzer"
            description="Analyze and highlight service logs, errors, and warnings"
            onClear={() => { setInput(''); clearToolData(TOOL_ID); }}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Raw Logs</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste your server logs, console output, or stack traces here..."
                        className="glass-input w-full min-h-[200px] text-xs font-mono"
                    />
                </div>

                <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    className="w-full uppercase tracking-widest"
                    icon={Search}
                >
                    ANALYZE LOGS
                </Button>

                {analysis && (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="glass-panel p-3 text-center">
                            <div className="text-[10px] text-foreground-muted uppercase font-bold mb-1">Total</div>
                            <div className="text-xl font-bold">{analysis.totalLines}</div>
                        </div>
                        <div className="glass-panel p-3 text-center border-rose-500/20">
                            <div className="text-[10px] text-rose-500 uppercase font-bold mb-1">Errors</div>
                            <div className="text-xl font-bold text-rose-500">{analysis.errors}</div>
                        </div>
                        <div className="glass-panel p-3 text-center border-amber-500/20">
                            <div className="text-[10px] text-amber-500 uppercase font-bold mb-1">Warnings</div>
                            <div className="text-xl font-bold text-amber-500">{analysis.warnings}</div>
                        </div>
                        <div className="glass-panel p-3 text-center border-blue-500/20">
                            <div className="text-[10px] text-blue-500 uppercase font-bold mb-1">Infos</div>
                            <div className="text-xl font-bold text-blue-500">{analysis.infos}</div>
                        </div>
                    </div>
                )}

                {highlighted.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Highlighted output</label>
                        <div className="glass-panel p-3 max-h-[400px] overflow-auto font-mono text-[11px] space-y-0.5 whitespace-pre bg-black/40">
                            {highlighted.map((line: any, i: number) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "px-2 rounded",
                                        line.type === 'error' && "bg-rose-500/10 text-rose-400 border-l-2 border-rose-500",
                                        line.type === 'warning' && "bg-amber-500/10 text-amber-400 border-l-2 border-amber-500",
                                        line.type === 'info' && "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500",
                                        line.type === 'default' && "text-foreground-muted"
                                    )}
                                >
                                    {line.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
