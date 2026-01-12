import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { symmetricEncrypt, symmetricDecrypt } from './logic';
import { Settings, Lock, Unlock, ArrowRightLeft, Copy, Trash2, Key } from 'lucide-react';
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
            if (!input) {
                toast.error('Please enter text to process.');
                return;
            }
            if (!options.key) {
                toast.error('Secret key is required.');
                return;
            }
            const result = fn(input, options.key, options.algorithm);
            setToolData(effectiveId, { output: result });
            toast.success(`${action}ed successfully`);
        } catch (e) {
            setToolData(effectiveId, { output: (e as Error).message });
            toast.error((e as Error).message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEncrypt = () => runAction('Encrypt', symmetricEncrypt);
    const handleDecrypt = () => runAction('Decrypt', symmetricDecrypt);

    const handleClear = () => clearToolData(effectiveId);
    const handleSwap = () => {
        setToolData(effectiveId, { input: output, output: input });
    };
    
    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <ToolPane
            title="Symmetric Encryptor"
            description="Secure encryption using AES, TripleDES, Rabbit, and RC4 algorithms"
            onClear={handleClear}
            /* Removing default actions to implement custom header if desired, or keeping minimal */
        >
            <div className="flex flex-col h-full space-y-4">
                
                {/* Configuration Bar */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-glass-panel border border-border-glass items-end sm:items-center shadow-sm">
                    <div className="flex-1 w-full sm:w-auto">
                         <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                             <Key className="w-3.5 h-3.5" /> Secret Key
                         </label>
                         <Input
                            type="text" 
                            value={options.key}
                            onChange={handleKeyChange}
                            className="font-mono bg-background/50 border-border-glass focus:border-primary/50 transition-all"
                            placeholder="Enter your secret passphrase..."
                            fullWidth
                        />
                    </div>
                    
                    <div className="w-full sm:w-48">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5" /> Algorithm
                        </label>
                        <div className="relative">
                            <select
                                className="w-full h-10 pl-3 pr-8 rounded-md border border-border-glass bg-background/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:bg-accent/50"
                                value={options.algorithm}
                                onChange={handleAlgorithmChange}
                            >
                                <option value="AES">AES (256-bit)</option>
                                <option value="TripleDES">TripleDES</option>
                                <option value="Rabbit">Rabbit</option>
                                <option value="RC4">RC4</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                    
                    {/* Input Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Input</label>
                            <div className="flex gap-1">
                                <button onClick={() => setToolData(effectiveId, { input: '' })} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Clear Input">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => copyToClipboard(input)} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Copy Input">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border-glass shadow-sm bg-glass-panel">
                            <CodeEditor
                                className="h-full"
                                language="text"
                                placeholder="Type or paste content here..."
                                value={input}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Action Center - Desktop: Vertical, Mobile: Horizontal */}
                    <div className="flex md:flex-col items-center justify-center gap-3 py-2 md:py-0 md:px-2">
                        <Button
                            variant="primary"
                            onClick={handleEncrypt}
                            loading={loadingAction === 'Encrypt'}
                            className="w-full md:w-32 h-10 shadow-lg shadow-primary/20"
                            icon={Lock}
                        >
                            Encrypt
                        </Button>
                        
                        <Button
                            variant="secondary"
                            onClick={handleSwap}
                            className="p-2 rounded-full h-10 w-10 md:h-10 md:w-10 flex items-center justify-center bg-accent/50 hover:bg-accent border-border-glass"
                            title="Swap Input & Output"
                        >
                            <ArrowRightLeft className="w-4 h-4 md:rotate-90" />
                        </Button>

                        <Button
                            variant="primary" // Changed to primary but maybe a different color via className if supported, or stick to secondary
                            className="w-full md:w-32 h-10 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-600"
                            onClick={handleDecrypt}
                            loading={loadingAction === 'Decrypt'}
                            icon={Unlock}
                        >
                            Decrypt
                        </Button>
                    </div>

                    {/* Output Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                         <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Output</label>
                            <div className="flex gap-1">
                                <button onClick={() => copyToClipboard(output)} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Copy Output">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border-glass shadow-sm bg-glass-panel relative group">
                            <CodeEditor
                                className="h-full"
                                language="text"
                                value={output}
                                readOnly={true}
                                editable={false}
                            />
                            {/* Overlay for empty state if needed, or just let CodeEditor handle it */}
                            {!output && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Lock className="w-8 h-8 opacity-20" />
                                        <span className="text-xs uppercase tracking-widest font-medium">Result will appear here</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
