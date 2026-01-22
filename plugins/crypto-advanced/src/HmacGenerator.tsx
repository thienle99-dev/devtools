import React, { useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';
import { generateHmac } from './logic';

const TOOL_ID = TOOL_IDS.HMAC_GENERATOR;

export const HmacGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            key: '',
            algo: 'SHA256'
        }
    };

    // input is source text, options.key is secret
    const { input, output, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const update = (text: string, key: string, algo: string) => {
        setToolData(effectiveId, { input: text, options: { key, algo } });

        if (!text || !key) {
            setToolData(effectiveId, { output: '' });
            return;
        }

        const hash = generateHmac(text, key, algo.toLowerCase() as any);
        setToolData(effectiveId, { output: hash });
    };

    const handleClear = () => clearToolData(effectiveId);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            toolId={effectiveId}
            title="HMAC Generator"
            description="Compute Hash-based Message Authentication Codes"
            onClear={handleClear}
            onCopy={handleCopy}
        >
            <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Algorithm</label>
                    <div className="flex flex-wrap gap-2">
                        {['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3', 'RIPEMD160'].map(algo => (
                            <Button
                                key={algo}
                                variant={options.algo === algo ? 'primary' : 'glass'}
                                size="sm"
                                onClick={() => update(input, options.key, algo)}
                            >
                                {algo}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Input
                        label="Secret Key"
                        type="text"
                        value={options.key}
                        onChange={(e) => update(input, e.target.value, options.algo)}
                        className="font-mono"
                        placeholder="Enter secret key..."
                        fullWidth
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Text</label>
                    <CodeEditor
                        className="min-h-[120px]"
                        language="text"
                        placeholder="Enter message to hash..."
                        value={input}
                        onChange={(val) => update(val, options.key, options.algo)}
                    />
                </div>

                <div className="space-y-2">
                    <Input
                        label="HMAC Output"
                        type="text"
                        readOnly
                        value={output}
                        className="font-mono text-primary bg-primary/5"
                        fullWidth
                    />
                </div>
            </div>
        </ToolPane>
    );
};
