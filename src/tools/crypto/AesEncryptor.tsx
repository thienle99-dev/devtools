import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { aesEncrypt, aesDecrypt } from './logic';

const TOOL_ID = 'aes-encryptor';

// Export for pipeline support
export const process = async (input: string, options: { key: string; action?: 'encrypt' | 'decrypt' }) => {
    if (!options.key) throw new Error('Secret key is required for AES.');
    const action = options.action || 'encrypt';
    if (action === 'decrypt') return aesDecrypt(input, options.key);
    return aesEncrypt(input, options.key);
};

interface AesEncryptorProps {
    tabId?: string;
}

export const AesEncryptor: React.FC<AesEncryptorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            key: '',
        }
    };

    const { input, output, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToolData(effectiveId, { options: { ...options, key: e.target.value } });
    };

    const runAction = async (action: 'Encrypt' | 'Decrypt', fn: (i: string, k: string) => string) => {
        setLoadingAction(action);
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            if (!input || !options.key) {
                setToolData(effectiveId, { output: 'Please enter both text and a secret key.' });
                return;
            }
            const result = fn(input, options.key);
            setToolData(effectiveId, { output: result });
        } catch (e) {
            setToolData(effectiveId, { output: (e as Error).message });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEncrypt = () => runAction('Encrypt', aesEncrypt);
    const handleDecrypt = () => runAction('Decrypt', aesDecrypt);

    const handleClear = () => clearToolData(effectiveId);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            title="AES Encryptor"
            description="Encrypt/Decrypt text using AES encryption"
            onClear={handleClear}
            onCopy={handleCopy}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex-none">
                    <Input
                        label="Secret Key"
                        type="text" // Or password if we want to hide it, but tools usually show it
                        value={options.key}
                        onChange={handleKeyChange}
                        className="font-mono"
                        placeholder="Enter encryption/decryption key..."
                        fullWidth
                    />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input (Text or Cipher)</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            placeholder="Type here..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="primary"
                        onClick={handleEncrypt}
                        loading={loadingAction === 'Encrypt'}
                        className="uppercase tracking-widest"
                    >
                        Encrypt
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDecrypt}
                        loading={loadingAction === 'Decrypt'}
                        className="uppercase tracking-widest"
                    >
                        Decrypt
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
