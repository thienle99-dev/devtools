import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs';
import { generateKeyPair, rsaEncrypt, rsaDecrypt, rsaSign, rsaVerify } from './rsaLogic';
import { toast } from 'sonner';

const TOOL_ID = 'rsa-generator';

interface RsaGeneratorProps {
    tabId?: string;
}

export const RsaGenerator: React.FC<RsaGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    
    // Local state for tabs, not necessarily persisted unless we want to
    const [activeTab, setActiveTab] = useState<string>('keygen');
    const [loading, setLoading] = useState(false);

    const defaultOptions = {
        keySize: 2048,
        publicKey: '',
        privateKey: '',
        encryptInput: '',
        encryptKey: '',
        encryptOutput: '',
        decryptInput: '',
        decryptKey: '',
        decryptOutput: '',
        signInput: '',
        signKey: '',
        signOutput: '',
        verifyInput: '',
        verifySignature: '',
        verifyKey: '',
        verifyResult: null as boolean | null
    };

    const options = { ...defaultOptions, ...toolData?.options };

    const { 
        keySize, publicKey, privateKey, 
        encryptInput, encryptKey, encryptOutput,
        decryptInput, decryptKey, decryptOutput,
        signInput, signKey, signOutput,
        verifyInput, verifySignature, verifyKey, verifyResult
    } = options;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const updateOptions = (updates: Partial<typeof defaultOptions>) => {
        setToolData(effectiveId, { options: { ...options, ...updates } });
    };

    const handleGenerateKeys = async () => {
        setLoading(true);
        try {
            // Delay for UI update
            await new Promise(r => setTimeout(r, 100));
            const keys = await generateKeyPair(keySize);
            updateOptions({ publicKey: keys.publicKey, privateKey: keys.privateKey });
            toast.success('Keys generated successfully');
        } catch (e) {
            toast.error('Failed to generate keys: ' + (e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleEncrypt = () => {
        try {
            if (!encryptInput || !encryptKey) return toast.error('Input and Public Key required');
            const res = rsaEncrypt(encryptInput, encryptKey);
            updateOptions({ encryptOutput: res });
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const handleDecrypt = () => {
        try {
            if (!decryptInput || !decryptKey) return toast.error('Input (base64) and Private Key required');
            const res = rsaDecrypt(decryptInput, decryptKey);
            updateOptions({ decryptOutput: res });
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const handleSign = () => {
        try {
            if (!signInput || !signKey) return toast.error('Input and Private Key required');
            const res = rsaSign(signInput, signKey);
            updateOptions({ signOutput: res });
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    const handleVerify = () => {
        try {
            if (!verifyInput || !verifySignature || !verifyKey) return toast.error('Input, Signature and Public Key required');
            const res = rsaVerify(verifyInput, verifySignature, verifyKey);
            updateOptions({ verifyResult: res });
            if(res) toast.success('Signature Valid');
            else toast.error('Signature Invalid');
        } catch (e) {
            toast.error((e as Error).message);
        }
    };
    
    // ... existing handleClear and render implementation mapping to these handlers and updateOptions ...


    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="RSA Tools"
            description="Generate keys, encrypt, decrypt, sign and verify with RSA"
            onClear={handleClear}
        >
            <div className="flex flex-col h-full space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="mb-4 flex-wrap">
                        <TabsTrigger value="keygen">Key Generator</TabsTrigger>
                        <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
                        <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
                        <TabsTrigger value="sign">Sign</TabsTrigger>
                        <TabsTrigger value="verify">Verify</TabsTrigger>
                    </TabsList>

                    <TabsContent value="keygen" className="flex-1 min-h-0 overflow-y-auto space-y-4">
                         <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">Key Size:</label>
                            <select 
                                className="bg-glass-panel border border-border-glass rounded px-2 py-1 text-sm"
                                value={keySize}
                                onChange={(e) => updateOptions({ keySize: Number(e.target.value) })}
                            >
                                <option value={1024}>1024 bits</option>
                                <option value={2048}>2048 bits</option>
                                <option value={4096}>4096 bits</option>
                            </select>
                            <Button onClick={handleGenerateKeys} loading={loading} variant="primary">Generate Keys</Button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-60px)]">
                             <div className="flex flex-col space-y-2">
                                <label className="text-xs uppercase font-bold text-muted-foreground">Public Key</label>
                                <CodeEditor 
                                    language="text" 
                                    value={publicKey} 
                                    readOnly 
                                    className="flex-1"
                                />
                             </div>
                             <div className="flex flex-col space-y-2">
                                <label className="text-xs uppercase font-bold text-muted-foreground">Private Key</label>
                                <CodeEditor 
                                    language="text" 
                                    value={privateKey} 
                                    readOnly 
                                    className="flex-1"
                                />
                             </div>
                         </div>
                    </TabsContent>

                    <TabsContent value="encrypt" className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col space-y-4">
                            <CodeEditor 
                                language="text" 
                                placeholder="Message to encrypt..." 
                                value={encryptInput}
                                onChange={(val) => updateOptions({ encryptInput: val })}
                                className="h-40"
                            />
                            <CodeEditor 
                                language="text" 
                                placeholder="Public Key (PEM)..." 
                                value={encryptKey}
                                onChange={(val) => updateOptions({ encryptKey: val })}
                                className="flex-1"
                            />
                            <Button onClick={handleEncrypt} variant="primary">Encrypt</Button>
                         </div>
                         <div className="flex flex-col space-y-2">
                             <label className="text-xs uppercase font-bold text-muted-foreground">Encrypted Output (Base64)</label>
                             <CodeEditor 
                                 language="text" 
                                 value={encryptOutput} 
                                 readOnly 
                                 className="flex-1"
                             />
                         </div>
                    </TabsContent>

                     <TabsContent value="decrypt" className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col space-y-4">
                            <CodeEditor 
                                language="text" 
                                placeholder="Encrypted content (Base64)..." 
                                value={decryptInput}
                                onChange={(val) => updateOptions({ decryptInput: val })}
                                className="h-40"
                            />
                            <CodeEditor 
                                language="text" 
                                placeholder="Private Key (PEM)..." 
                                value={decryptKey}
                                onChange={(val) => updateOptions({ decryptKey: val })}
                                className="flex-1"
                            />
                            <Button onClick={handleDecrypt} variant="primary">Decrypt</Button>
                         </div>
                         <div className="flex flex-col space-y-2">
                             <label className="text-xs uppercase font-bold text-muted-foreground">Decrypted Output</label>
                             <CodeEditor 
                                 language="text" 
                                 value={decryptOutput} 
                                 readOnly 
                                 className="flex-1"
                             />
                         </div>
                    </TabsContent>

                    <TabsContent value="sign" className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col space-y-4">
                            <CodeEditor 
                                language="text" 
                                placeholder="Message to sign..." 
                                value={signInput}
                                onChange={(val) => updateOptions({ signInput: val })}
                                className="h-40"
                            />
                            <CodeEditor 
                                language="text" 
                                placeholder="Private Key (PEM)..." 
                                value={signKey}
                                onChange={(val) => updateOptions({ signKey: val })}
                                className="flex-1"
                            />
                            <Button onClick={handleSign} variant="primary">Sign</Button>
                         </div>
                         <div className="flex flex-col space-y-2">
                             <label className="text-xs uppercase font-bold text-muted-foreground">Signature (Base64)</label>
                             <CodeEditor 
                                 language="text" 
                                 value={signOutput} 
                                 readOnly 
                                 className="flex-1"
                             />
                         </div>
                    </TabsContent>

                    <TabsContent value="verify" className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex flex-col space-y-4">
                            <CodeEditor 
                                language="text" 
                                placeholder="Original Message..." 
                                value={verifyInput}
                                onChange={(val) => updateOptions({ verifyInput: val })}
                                className="h-32"
                            />
                             <CodeEditor 
                                language="text" 
                                placeholder="Signature (Base64)..." 
                                value={verifySignature}
                                onChange={(val) => updateOptions({ verifySignature: val })}
                                className="h-32"
                            />
                            <CodeEditor 
                                language="text" 
                                placeholder="Public Key (PEM)..." 
                                value={verifyKey}
                                onChange={(val) => updateOptions({ verifyKey: val })}
                                className="flex-1"
                            />
                            <Button onClick={handleVerify} variant="primary">Verify</Button>
                         </div>
                         <div className="flex flex-col items-center justify-center space-y-2 border border-border-glass rounded-lg bg-glass-panel">
                             {verifyResult !== null && (
                                 <div className={`text-2xl font-bold ${verifyResult ? 'text-green-500' : 'text-red-500'}`}>
                                     {verifyResult ? 'Signature Valid' : 'Signature Invalid'}
                                 </div>
                             )}
                             {verifyResult === null && <div className="text-muted-foreground">Result will appear here</div>}
                         </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ToolPane>
    );
};
