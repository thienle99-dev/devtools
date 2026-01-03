import React, { useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'hmac-generator';

export const HmacGenerator: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    const data = tools[TOOL_ID] || {
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
        setToolData(TOOL_ID, { input: text, options: { key, algo } });

        if (!text || !key) {
            setToolData(TOOL_ID, { output: '' });
            return;
        }

        let hash = '';
        try {
            switch (algo) {
                case 'MD5': hash = CryptoJS.HmacMD5(text, key).toString(); break;
                case 'SHA1': hash = CryptoJS.HmacSHA1(text, key).toString(); break;
                case 'SHA256': hash = CryptoJS.HmacSHA256(text, key).toString(); break;
                case 'SHA512': hash = CryptoJS.HmacSHA512(text, key).toString(); break;
                case 'SHA3': hash = CryptoJS.HmacSHA3(text, key).toString(); break;
                case 'RIPEMD160': hash = CryptoJS.HmacRIPEMD160(text, key).toString(); break;
                default: hash = 'Unknown Algorithm';
            }
            setToolData(TOOL_ID, { output: hash });
        } catch (e) {
            setToolData(TOOL_ID, { output: 'Error generating HMAC' });
        }
    };

    const handleClear = () => clearToolData(TOOL_ID);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
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
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Secret Key</label>
                    <input
                        type="text"
                        value={options.key}
                        onChange={(e) => update(input, e.target.value, options.algo)}
                        className="glass-input w-full font-mono"
                        placeholder="Enter secret key..."
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
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">HMAC Output</label>
                    <input
                        type="text"
                        readOnly
                        value={output}
                        className="glass-input w-full font-mono text-primary bg-primary/5"
                    />
                </div>
            </div>
        </ToolPane>
    );
};
