import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { symmetricEncrypt, symmetricDecrypt } from './logic';
import { Settings, Lock, Unlock, ArrowRightLeft, Copy, Key } from 'lucide-react';
import { toast } from 'sonner';

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
    const { 
        data: toolData, setToolData, clearToolData, addToHistory,
        addToolHistoryEntry 
    } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [validation, setValidation] = useState<{ status: string, message: string, details?: string } | null>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            key: '',
            algorithm: 'AES' as const
        }
    };

    const { input, output, options } = data;
    const algorithm = options.algorithm || 'AES';

    useEffect(() => {
        addToHistory(effectiveId);
    }, [addToHistory, effectiveId]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
        if (validation) setValidation(null);
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToolData(effectiveId, { options: { ...options, key: e.target.value } });
        if (validation) setValidation(null);
    };

    const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
         setToolData(effectiveId, { options: { ...options, algorithm: e.target.value as any } });
    };

    const getErrorExplanation = (message: string) => {
        if (message.includes('Malformed UTF-8 data')) {
            return "This usually happens when the secret key is incorrect or the input is not a valid encrypted string. Make sure you are using the same algorithm and key as when you encrypted it.";
        }
        if (message.includes('key is required')) {
            return "A secret key is needed to perform cryptographic operations. Choose a strong, secret phrase.";
        }
        return "An unexpected error occurred during processing.";
    };

    const runAction = async (action: 'Encrypt' | 'Decrypt', fn: (i: string, k: string, a: any) => string) => {
        setLoadingAction(action);
        setValidation(null);
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            if (!input) {
                setValidation({ status: 'warning', message: 'Input required', details: 'Please enter text to process.' });
                return;
            }
            if (!options.key) {
                setValidation({ status: 'error', message: 'Secret key missing', details: getErrorExplanation('key is required') });
                return;
            }
            const result = fn(input, options.key, algorithm);
            setToolData(effectiveId, { output: result });
            addToolHistoryEntry(effectiveId, { input, output: result, options });
            toast.success(`${action}ed successfully`);
        } catch (e) {
            const msg = (e as Error).message;
            setValidation({ 
                status: 'error', 
                message: `${action} Failed`, 
                details: getErrorExplanation(msg) 
            });
            setToolData(effectiveId, { output: '' });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEncrypt = () => runAction('Encrypt', symmetricEncrypt);
    const handleDecrypt = () => runAction('Decrypt', symmetricDecrypt);

    const handleClear = () => {
        clearToolData(effectiveId);
        setValidation(null);
    };

    const handleSwap = () => {
        setToolData(effectiveId, { input: output, output: input });
    };
    
    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const helpContent = (
        <>
            <section>
                <h4 className="flex items-center gap-2 text-foreground font-bold mb-2">
                    <Lock size={14} className="text-indigo-400" />
                    How to Encrypt
                </h4>
                <p>Enter your text, provide a secret key, choose an algorithm, and click Encrypt.</p>
            </section>
            <section>
                <h4 className="flex items-center gap-2 text-foreground font-bold mb-2">
                    <Unlock size={14} className="text-emerald-400" />
                    How to Decrypt
                </h4>
                <p>Paste the encrypted text, provide the SAME secret key and algorithm, and click Decrypt.</p>
            </section>
            <section>
                <h4 className="flex items-center gap-2 text-foreground font-bold mb-2">
                    <Settings size={14} className="text-amber-400" />
                    Algorithms
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong>AES:</strong> Industry standard, very secure.</li>
                    <li><strong>TripleDES:</strong> Legacy support for older systems.</li>
                    <li><strong>RC4:</strong> Very fast, but less secure for sensitive data.</li>
                </ul>
            </section>
        </>
    );

    return (
        <ToolPane 
            title="Symmetric Encryptor" 
            description="Secure your data with AES, TripleDES, Rabbit or RC4"
            toolId={TOOL_ID}
            validation={validation as any}
            onClear={handleClear}
            helpContent={helpContent}
        >
            <div className="space-y-8 max-w-5xl mx-auto">
                {/* Configuration Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted ml-1">Algorithm</label>
                        <select 
                            value={algorithm}
                            onChange={handleAlgorithmChange}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none cursor-pointer"
                        >
                            <option value="AES">AES (Modern Standard)</option>
                            <option value="TripleDES">TripleDES (Legacy)</option>
                            <option value="Rabbit">Rabbit (Stateful Stream)</option>
                            <option value="RC4">RC4 (Fast Stream)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted ml-1">Secret Key</label>
                        <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-disabled group-focus-within:text-indigo-400 transition-colors" />
                            <Input
                                placeholder="Enter secret key..."
                                value={options.key}
                                onChange={handleKeyChange}
                                type="password"
                                className="pl-11 h-11 bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                    {/* Input */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Input Content</label>
                            <span className="text-[9px] font-mono opacity-30">{input.length} chars</span>
                        </div>
                        <CodeEditor
                            value={input}
                            onChange={handleInputChange}
                            language="text"
                            placeholder="Enter text here..."
                            className="flex-1 min-h-[300px] rounded-2xl border-white/5 overflow-hidden shadow-inner"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-center justify-center gap-3 py-4">
                        <Button 
                            onClick={handleEncrypt}
                            loading={loadingAction === 'Encrypt'}
                            className="w-full lg:w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 group"
                            title="Encrypt"
                        >
                            <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Button>

                        <button 
                            onClick={handleSwap}
                            className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-foreground-muted transition-all"
                            title="Swap Input/Output"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        <Button 
                            onClick={handleDecrypt}
                            loading={loadingAction === 'Decrypt'}
                            variant="secondary"
                            className="w-full lg:w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 group"
                            title="Decrypt"
                        >
                            <Unlock className="w-5 h-5 group-hover:scale-110 transition-transform text-white" />
                        </Button>
                    </div>

                    {/* Output */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">Result Output</label>
                            {output && (
                                <button 
                                    onClick={() => copyToClipboard(output)}
                                    className="p-1 hover:bg-white/5 rounded text-indigo-400 transition-colors"
                                    title="Copy Result"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="relative flex-1 min-h-[300px] group">
                            <CodeEditor
                                value={output}
                                readOnly
                                language="text"
                                placeholder="Result will appear here..."
                                className="h-full rounded-2xl border-white/5 overflow-hidden shadow-xl bg-indigo-500/[0.02]"
                            />
                            {!output && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                                    <Lock size={40} className="text-foreground" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
