import React, { useState } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Shield, Lock, Unlock, Copy, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { obfuscate, deobfuscate, type ObfuscationMethod } from './logic';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.STRING_OBFUSCATOR;

// Export for pipeline support
export const process = async (input: string, options: { method?: ObfuscationMethod; action?: 'obfuscate' | 'deobfuscate' } = {}) => {
    const method = options.method || 'rot13';
    const action = options.action || 'obfuscate';
    if (action === 'deobfuscate') return deobfuscate(input, method);
    return obfuscate(input, method);
};

export const StringObfuscator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData } = useToolState(effectiveId);
    const [method, setMethod] = useState<ObfuscationMethod>((data?.options?.method as ObfuscationMethod) || 'rot13');
    const input = data?.input || '';
    const output = data?.output || '';

    const handleInput = (val: string) => {
        const result = obfuscate(val, method);
        setToolData(effectiveId, { input: val, output: result, options: { method } });
    };

    const handleMethodChange = (m: string) => {
        const newMethod = m as ObfuscationMethod;
        setMethod(newMethod);
        const result = obfuscate(input, newMethod);
        setToolData(effectiveId, { output: result, options: { method: newMethod } });
    };

    const handleSwap = () => {
        const result = deobfuscate(output, method);
        setToolData(effectiveId, { input: output, output: result });
    };

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-panel p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-glass pb-6">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-foreground/70">Text Obfuscator</h3>
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            value={method}
                            onChange={(e) => handleMethodChange(e.target.value)}
                            options={[
                                { value: 'rot13', label: 'ROT13' },
                                { value: 'base64', label: 'Base64' },
                                { value: 'hex', label: 'Hexadecimal' },
                                { value: 'binary', label: 'Binary' },
                                { value: 'reverse', label: 'Reverse' }
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold ml-1 flex items-center gap-2">
                            <Unlock className="w-3 h-3" /> Input (Plain Text)
                        </label>
                        <textarea
                            value={input}
                            onChange={(e) => handleInput(e.target.value)}
                            placeholder="Type or paste text here..."
                            className="flex-1 w-full bg-foreground/5 border border-border-glass rounded-2xl p-6 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-indigo-500/50 focus:bg-foreground/10 transition-all font-mono resize-none custom-scrollbar"
                        />
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-foreground/20 italic">Characters: {input.length}</span>
                            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setToolData(effectiveId, { input: '', output: '' })} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold ml-1 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Output (Obfuscated)
                        </label>
                        <div className="relative flex-1 group">
                            <textarea
                                value={output}
                                readOnly
                                placeholder="Result will appear here..."
                                className="w-full h-full bg-foreground/5 border border-border-glass rounded-2xl p-6 text-indigo-400 dark:text-indigo-300 placeholder:text-foreground/10 focus:outline-none focus:border-indigo-500/30 transition-all font-mono resize-none custom-scrollbar shadow-inner"
                            />
                            <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="secondary" icon={Copy} onClick={handleCopy} className="h-8 w-8 p-0" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-foreground/20 italic">Characters: {output.length}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" icon={RefreshCw} onClick={handleSwap}>Swap Input/Output</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <Shield className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-foreground/60 block">Encoding vs Encryption</span>
                        <p className="text-[10px] text-foreground/30 leading-relaxed">
                            These methods are for obfuscation and formatting, not secure data encryption.
                            Use the <strong>AES Encryptor</strong> tool for sensitive or private information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
