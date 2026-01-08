import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';

const TOOL_ID = 'aes-encryptor';

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

    const handleEncrypt = () => {
        setLoadingAction('Encrypt');
        setTimeout(() => {
            try {
                if (!input || !options.key) {
                    setToolData(effectiveId, { output: 'Please enter both text and a secret key.' });
                    return;
                }
                const ciphertext = CryptoJS.AES.encrypt(input, options.key).toString();
                setToolData(effectiveId, { output: ciphertext });
            } catch (e) {
                setToolData(effectiveId, { output: 'Encryption Error' });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleDecrypt = () => {
        setLoadingAction('Decrypt');
        setTimeout(() => {
            try {
                if (!input || !options.key) {
                    setToolData(effectiveId, { output: 'Please enter both ciphertext and a secret key.' });
                    return;
                }
                const bytes = CryptoJS.AES.decrypt(input, options.key);
                const originalText = bytes.toString(CryptoJS.enc.Utf8);
                if (!originalText) {
                    setToolData(effectiveId, { output: 'Error: Could not decrypt. Wrong key or invalid ciphertext.' });
                } else {
                    setToolData(effectiveId, { output: originalText });
                }
            } catch (e) {
                setToolData(effectiveId, { output: 'Decryption Error' });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

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
