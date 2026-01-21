import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { symmetricEncrypt, symmetricDecrypt } from './logic';

const TOOL_ID = 'symmetric-encryptor';

// Export for pipeline support
export const process = async (input: string, options: { key: string; action?: 'encrypt' | 'decrypt'; algorithm?: 'AES' | 'TripleDES' | 'Rabbit' | 'RC4' }) => {
    if (!options.key) throw new Error('Secret key is required.');
    const action = options.action || 'encrypt';
    const algo = options.algorithm || 'AES';
    if (action === 'decrypt') return symmetricDecrypt(input, options.key, algo);
    return symmetricEncrypt(input, options.key, algo);
};

interface SymmetricEncryptorProps {
    tabId?: string;
}

export const SymmetricEncryptor = ({ tabId }: SymmetricEncryptorProps): JSX.Element => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            key: '',
            algorithm: 'AES' as const
        }
    };

    const { input, output, options } = data;

    // Ensure algorithm is set in case of old state
    if (!options.algorithm) {
        options.algorithm = 'AES';
    }

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToolData(effectiveId, { options: { ...options, key: e.target.value } });
    };

    const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
         setToolData(effectiveId, { options: { ...options, algorithm: e.target.value as any } });
    };

    const runAction = async (action: 'Encrypt' | 'Decrypt', fn: (i: string, k: string, a: any) => string) => {
        setLoadingAction(action);
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            if (!input || !options.key) {
                setToolData(effectiveId, { output: 'Please enter both text and a secret key.' });
                return;
            }
            const result = fn(input, options.key, options.algorithm);
            setToolData(effectiveId, { output: result });
        } catch (e) {
            setToolData(effectiveId, { output: (e as Error).message });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEncrypt = () => runAction('Encrypt', symmetricEncrypt);
    const handleDecrypt = () => runAction('Decrypt', symmetricDecrypt);

    const handleClear = () => clearToolData(effectiveId);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Symmetric Encryptor"
            description="Encrypt/Decrypt text using AES, TripleDES, Rabbit, RC4"
            onClear={handleClear}
            onCopy={handleCopy}
            actions={
                <div className="flex bg-muted/50 rounded-lg p-1">
                    <select
                        className="bg-transparent border-0 text-xs font-medium focus:ring-0 cursor-pointer text-foreground"
                        value={options.algorithm}
                        onChange={handleAlgorithmChange}
                    >
                        <option value="AES">AES</option>
                        <option value="TripleDES">TripleDES</option>
                        <option value="Rabbit">Rabbit</option>
                        <option value="RC4">RC4</option>
                    </select>
                </div>
            }
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex-none">
                    <Input
                        label="Secret Key"
                        type="text"
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
                        Encrypt ({options.algorithm})
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDecrypt}
                        loading={loadingAction === 'Decrypt'}
                        className="uppercase tracking-widest"
                    >
                        Decrypt ({options.algorithm})
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
