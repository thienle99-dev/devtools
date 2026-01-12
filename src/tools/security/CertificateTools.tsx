import React, { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Shield, FileCode, CheckCircle } from 'lucide-react';
import { parseCertificate, convertCertificate } from './logic';

const TOOL_ID = 'cert-tools';

export const CertificateTools: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [input, setInput] = useState('');

    const handleParse = () => {
        if (!input.trim()) return;
        const result = parseCertificate(input);
        setToolData(TOOL_ID, { output: result });
    };

    const handleConvert = (format: 'PEM' | 'DER' | 'BASE64') => {
        if (!input.trim()) return;
        const result = convertCertificate(input, format);
        setToolData(TOOL_ID, { output: result });
    };

    const output = toolData?.output;

    return (
        <ToolPane
            title="Certificate Tools"
            description="Parse X.509 certificates and convert between PEM/DER formats"
            onClear={() => { setInput(''); clearToolData(TOOL_ID); }}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Certificate / Key (PEM)</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste your certificate (-----BEGIN CERTIFICATE-----) here..."
                        className="glass-input w-full min-h-[150px] text-sm font-mono"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        onClick={handleParse}
                        className="flex-1 uppercase tracking-widest"
                        icon={Shield}
                    >
                        PARSE
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => handleConvert('BASE64')}
                        className="uppercase tracking-widest"
                        icon={FileCode}
                    >
                        TO BASE64
                    </Button>
                </div>

                {output && typeof output === 'object' && output.isLoaded && (
                    <div className="glass-panel p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{output.type} Loaded</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                                <span className="text-foreground-muted uppercase">Subject</span>
                                <span className="font-mono text-emerald-400">{output.subject}</span>
                            </div>
                            <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                                <span className="text-foreground-muted uppercase">Issuer</span>
                                <span className="font-mono">{output.issuer}</span>
                            </div>
                            <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                                <span className="text-foreground-muted uppercase">Expires</span>
                                <span className="font-mono text-rose-400">{output.expiry}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-foreground-muted uppercase">Thumbprint</span>
                                <span className="font-mono opacity-60">{output.thumbprint}</span>
                            </div>
                        </div>
                    </div>
                )}

                {output && typeof output === 'string' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Result</label>
                        <div className="relative group">
                            <textarea
                                value={output}
                                readOnly
                                className="glass-input w-full min-h-[100px] text-xs font-mono text-emerald-400"
                            />
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
