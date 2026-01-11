import React, { useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { generateHash } from './logic';

const TOOL_ID = 'hash-generator';

// Export for pipeline support
export const process = async (input: string, options: { algorithm?: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'ripemd160' | 'sha3' } = {}) => {
    return generateHash(input, options.algorithm);
};

interface HashGeneratorProps {
    tabId?: string;
}

export const HashGenerator: React.FC<HashGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // We'll store the input text and update all hashes automatically
    const data = toolData || {
        input: '',
        options: {
            md5: '',
            sha1: '',
            sha256: '',
            sha512: '',
            ripemd160: '',
            sha3: ''
        }
    };

    const { input, options } = data;
    const values = options || {};

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
        generateAllHashes(val);
    };

    const generateAllHashes = (text: string) => {
        if (!text) {
            setToolData(effectiveId, { options: { md5: '', sha1: '', sha256: '', sha512: '', ripemd160: '', sha3: '' } });
            return;
        }

        setToolData(effectiveId, {
            options: {
                md5: generateHash(text, 'md5'),
                sha1: generateHash(text, 'sha1'),
                sha256: generateHash(text, 'sha256'),
                sha512: generateHash(text, 'sha512'),
                ripemd160: generateHash(text, 'ripemd160'),
                sha3: generateHash(text, 'sha3')
            }
        });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="Hash Generator"
            description="Generate MD5, SHA1, SHA256, SHA512, and other hashes"
            onClear={handleClear}
        >
            <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Text</label>
                    <CodeEditor
                        className="min-h-[100px]"
                        language="text"
                        placeholder="Type text to hash..."
                        value={input}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(values).map(([algo, hash]) => (hash ? (
                        <div key={algo} className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">{algo.toUpperCase()}</label>
                            <div className="flex space-x-2 items-center">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        readOnly
                                        value={hash as string}
                                        className="font-mono text-xs text-foreground-secondary"
                                        fullWidth
                                    />
                                </div>
                                <Button
                                    variant="glass"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(hash as string)}
                                    title="Copy"
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>
                    ) : null))}
                    {!input && <div className="text-center text-foreground-muted italic py-8">Start typing to generate hashes...</div>}
                </div>
            </div>
        </ToolPane>
    );
};
