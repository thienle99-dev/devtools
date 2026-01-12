import React, { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { scanSecrets } from './logic';

const TOOL_ID = 'secrets-scanner';

export const SecretsScanner: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [input, setInput] = useState('');
    const [scanning, setScanning] = useState(false);

    const handleScan = async () => {
        if (!input.trim()) return;
        setScanning(true);
        setTimeout(() => {
            const results = scanSecrets(input);
            setToolData(TOOL_ID, { output: results });
            setScanning(false);
        }, 800);
    };

    const results = Array.isArray(toolData?.output) ? toolData.output : [];

    return (
        <ToolPane
            title="Secrets Scanner"
            description="Scan text for API keys, passwords, and sensitive information"
            onClear={() => { setInput(''); clearToolData(TOOL_ID); }}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Text / Code</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste your code, config, or logs here..."
                        className="glass-input w-full min-h-[200px] text-sm font-mono"
                    />
                </div>

                <Button
                    variant="primary"
                    onClick={handleScan}
                    loading={scanning}
                    className="w-full uppercase tracking-widest"
                    icon={ShieldAlert}
                >
                    SCAN FOR SECRETS
                </Button>

                {results.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-rose-500">
                                <AlertTriangle className="w-4 h-4" />
                                {results.length} Potential Secrets Found
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {results.map((match: { name: string, found: string, line: number }, i: number) => (
                                <div key={i} className="glass-panel p-3 border border-rose-500/20 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full uppercase">
                                            {match.name}
                                        </span>
                                        <span className="text-[10px] text-foreground-muted font-mono">
                                            Line {match.line}
                                        </span>
                                    </div>
                                    <div className="text-sm font-mono bg-black/20 p-2 rounded break-all">
                                        {match.found}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    input && !scanning && (
                        <div className="flex flex-col items-center justify-center py-12 text-foreground-muted space-y-3">
                            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium">No common secrets detected</p>
                            <p className="text-[10px] uppercase tracking-widest opacity-50 text-center max-w-[200px]">
                                Remember: This scanner only detects common patterns. Be careful!
                            </p>
                        </div>
                    )
                )}
            </div>
        </ToolPane>
    );
};
