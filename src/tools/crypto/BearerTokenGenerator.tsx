import React from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { generateBearerToken } from '../crypto/logic';
import { toast } from 'sonner';

const TOOL_ID = 'bearer-token';

export const BearerTokenGenerator: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);

    const handleGenerate = () => {
        const token = generateBearerToken(32);
        setToolData(TOOL_ID, { output: token });
    };

    const output = toolData?.output || '';

    return (
        <ToolPane
            title="Bearer Token Generator"
            description="Generate secure, random tokens for Authorization headers"
            onClear={() => clearToolData(TOOL_ID)}
        >
            <div className="space-y-6 flex flex-col items-center justify-center py-10">
                <div className="w-full max-w-md space-y-4">
                    <div className="flex flex-col items-center gap-4 mb-2">
                        <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <ShieldCheck className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Secure Token</h3>
                            <p className="text-[10px] text-foreground-muted">Alphanumeric (A-Z, a-z, 0-9)</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 flex flex-col items-center gap-6">
                        <div className="w-full h-14 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center px-4 overflow-hidden">
                            <span className="font-mono text-xl text-emerald-400 tracking-wider truncate">
                                {output || '••••••••••••••••••••••••••••••••'}
                            </span>
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                variant="primary"
                                onClick={handleGenerate}
                                className="flex-1 uppercase tracking-widest"
                                icon={RefreshCw}
                            >
                                GENERATE
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    if (!output) return;
                                    navigator.clipboard.writeText(output);
                                    toast.success('Token copied!');
                                }}
                                disabled={!output}
                                className="uppercase tracking-widest"
                                icon={Copy}
                            >
                                COPY
                            </Button>
                        </div>
                    </div>

                    {output && (
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Example Header</span>
                            <code className="text-xs font-mono text-indigo-300 break-all">
                                Authorization: Bearer {output}
                            </code>
                        </div>
                    )}
                </div>
            </div>
        </ToolPane>
    );
};
