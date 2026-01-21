import React, { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { FileKey, Download, RefreshCw, Copy } from 'lucide-react';
import { generateCsr } from './logic';
import { toast } from 'sonner';

const TOOL_ID = 'csr-generator';

export const CsrGenerator: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [loading, setLoading] = useState(false);

    const [fields, setFields] = useState({
        commonName: 'example.com',
        organization: 'My Company',
        country: 'US',
        state: 'California',
        locality: 'San Francisco',
        keySize: 2048
    });

    const handleGenerate = async () => {
        if (!fields.commonName) {
            toast.error('Common Name is required');
            return;
        }

        setLoading(true);
        setTimeout(() => { // Small delay for UX
            try {
                const result = generateCsr(fields);
                setToolData(TOOL_ID, { output: result });
                toast.success('CSR Generated Successfully');
            } catch (error) {
                toast.error('Error generating CSR');
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const result = toolData?.output as { csr: string, privateKey: string, publicKey: string } | undefined;

    return (
        <ToolPane
            toolId={TOOL_ID}
            title="CSR Generator"
            description="Generate Certificate Signing Requests (PKCS#10) and Private Keys"
            onClear={() => clearToolData(TOOL_ID)}
        >
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-white/5 pb-2">Subject Details</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                label="Common Name (CN)"
                                value={fields.commonName}
                                onChange={e => setFields({ ...fields, commonName: e.target.value })}
                                placeholder="e.g. example.com"
                            />
                            <Input
                                label="Organization (O)"
                                value={fields.organization}
                                onChange={e => setFields({ ...fields, organization: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Country (C)"
                                    value={fields.country}
                                    onChange={e => setFields({ ...fields, country: e.target.value })}
                                    maxLength={2}
                                    placeholder="e.g. US"
                                />
                                <Input
                                    label="State (ST)"
                                    value={fields.state}
                                    onChange={e => setFields({ ...fields, state: e.target.value })}
                                    placeholder="e.g. CA"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Locality (L)"
                                    value={fields.locality}
                                    onChange={e => setFields({ ...fields, locality: e.target.value })}
                                    placeholder="e.g. San Francisco"
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] text-foreground-muted uppercase pl-1">Key Size</label>
                                    <select
                                        value={fields.keySize}
                                        onChange={e => setFields({ ...fields, keySize: parseInt(e.target.value) })}
                                        className="w-full glass-input text-xs py-2 bg-black/40 border-white/5"
                                    >
                                        <option value={2048}>RSA 2048-bit</option>
                                        <option value={4096}>RSA 4096-bit</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            loading={loading}
                            fullWidth
                            icon={RefreshCw}
                            className="h-12 uppercase tracking-widest text-xs"
                        >
                            Generate CSR & Key
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {result ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ResultSection
                                    label="CSR (Request)"
                                    content={result.csr}
                                    onDownload={() => handleDownload(result.csr, 'request.csr')}
                                />
                                <ResultSection
                                    label="Private Key"
                                    content={result.privateKey}
                                    onDownload={() => handleDownload(result.privateKey, 'private.key')}
                                    variant="warning"
                                />
                            </div>
                        ) : (
                            <div className="h-full border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-foreground-muted/30 p-10 text-center">
                                <FileKey className="w-16 h-16 mb-4 opacity-5" />
                                <p className="text-sm">Enter domain details to generate your certificate request and private key pairs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

const ResultSection = ({ label, content, onDownload, variant = 'default' }: {
    label: string,
    content: string,
    onDownload: () => void,
    variant?: 'default' | 'warning'
}) => (
    <div className="glass-panel p-4 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${variant === 'warning' ? 'text-amber-400' : 'text-indigo-400'}`}>
                {label}
            </span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(content);
                        toast.success('Copied to clipboard');
                    }}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Copy"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={onDownload}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Download"
                >
                    <Download size={14} />
                </button>
            </div>
        </div>
        <pre className="text-[10px] font-mono p-3 bg-black/40 rounded border border-white/5 text-foreground-secondary break-all white-space-pre-wrap max-h-32 overflow-y-auto">
            {content}
        </pre>
        {variant === 'warning' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black text-amber-500/40 uppercase">
                <ShieldAlert size={10} /> Secret
            </div>
        )}
    </div>
);

const ShieldAlert = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
);
