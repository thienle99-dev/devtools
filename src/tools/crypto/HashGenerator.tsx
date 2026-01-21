import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { generateHash } from './logic';
import { Copy, Check, FileText, Type, Hash, Shield, Zap, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

const TOOL_ID = 'hash-generator';

// Hash algorithm configurations
const HASH_ALGORITHMS = [
    { id: 'md5', name: 'MD5', bits: 128, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', description: 'Fast but not secure', security: 'weak' },
    { id: 'sha1', name: 'SHA-1', bits: 160, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', description: 'Legacy, avoid for security', security: 'weak' },
    { id: 'sha256', name: 'SHA-256', bits: 256, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', description: 'Recommended for most uses', security: 'strong' },
    { id: 'sha512', name: 'SHA-512', bits: 512, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', description: 'Maximum security', security: 'strong' },
    { id: 'sha3', name: 'SHA-3', bits: 512, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20', description: 'Latest standard', security: 'strong' },
    { id: 'ripemd160', name: 'RIPEMD-160', bits: 160, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', description: 'Used in Bitcoin', security: 'moderate' },
] as const;

type HashAlgorithm = typeof HASH_ALGORITHMS[number]['id'];

// Export for pipeline support
export const process = async (input: string, options: { algorithm?: HashAlgorithm } = {}) => {
    return generateHash(input, options.algorithm);
};

interface HashGeneratorProps {
    tabId?: string;
}

export const HashGenerator: React.FC<HashGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
    const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
    const [compareHash, setCompareHash] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const defaultHashes = {
        md5: '',
        sha1: '',
        sha256: '',
        sha512: '',
        sha3: '',
        ripemd160: ''
    };

    // Handle both new format (hashes) and old format (options) from store
    const input = toolData?.input || '';
    const fileName = toolData?.fileName || '';
    const hashes = toolData?.hashes || toolData?.options || defaultHashes;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const generateAllHashes = useCallback((text: string) => {
        if (!text) {
            setToolData(effectiveId, { 
                hashes: { md5: '', sha1: '', sha256: '', sha512: '', sha3: '', ripemd160: '' } 
            });
            return;
        }

        setIsProcessing(true);
        
        // Use setTimeout to avoid blocking UI for large inputs
        setTimeout(() => {
            const newHashes = {
                md5: generateHash(text, 'md5'),
                sha1: generateHash(text, 'sha1'),
                sha256: generateHash(text, 'sha256'),
                sha512: generateHash(text, 'sha512'),
                sha3: generateHash(text, 'sha3'),
                ripemd160: generateHash(text, 'ripemd160')
            };
            setToolData(effectiveId, { hashes: newHashes });
            setIsProcessing(false);
        }, 0);
    }, [effectiveId, setToolData]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val, fileName: '' });
        generateAllHashes(val);
    };

    const handleFileSelect = async () => {
        try {
            const result = await (window as any).ipcRenderer.invoke('dialog:openFile', {
                filters: [{ name: 'All Files', extensions: ['*'] }],
                properties: ['openFile']
            });

            if (result && !result.canceled && result.filePaths?.length > 0) {
                const filePath = result.filePaths[0];
                const fileContent = await (window as any).ipcRenderer.invoke('fs:readFile', filePath);
                const name = filePath.split(/[/\\]/).pop() || 'file';
                
                setToolData(effectiveId, { input: fileContent, fileName: name });
                generateAllHashes(fileContent);
                toast.success(`File loaded: ${name}`);
            }
        } catch (error) {
            toast.error('Failed to read file');
        }
    };

    const handleCopy = (algo: string, hash: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedAlgo(algo);
        toast.success(`${algo.toUpperCase()} hash copied`);
        setTimeout(() => setCopiedAlgo(null), 2000);
    };

    const handleCopyAll = () => {
        const allHashes = HASH_ALGORITHMS
            .filter(algo => hashes[algo.id])
            .map(algo => `${algo.name}: ${hashes[algo.id]}`)
            .join('\n');
        
        if (allHashes) {
            navigator.clipboard.writeText(allHashes);
            toast.success('All hashes copied');
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        setCompareHash('');
    };

    const compareResult = compareHash.trim().toLowerCase();
    const matchedAlgo = compareResult 
        ? HASH_ALGORITHMS.find(algo => hashes[algo.id]?.toLowerCase() === compareResult)
        : null;

    const hasAnyHash = Object.values(hashes).some(h => h);

    return (
        <ToolPane
            title="Hash Generator"
            description="Generate and verify cryptographic hashes"
            onClear={handleClear}
            onCopy={handleCopyAll}
            actions={
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-border-glass">
                        <button
                            onClick={() => setInputMode('text')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                                inputMode === 'text' 
                                    ? "bg-indigo-500 text-white" 
                                    : "bg-transparent text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Type className="w-3.5 h-3.5" />
                            Text
                        </button>
                        <button
                            onClick={() => setInputMode('file')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                                inputMode === 'file' 
                                    ? "bg-indigo-500 text-white" 
                                    : "bg-transparent text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            File
                        </button>
                    </div>
                </div>
            }
        >
            <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
                {/* Input Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5" />
                            {inputMode === 'text' ? 'Input Text' : 'File Content'}
                        </label>
                        {fileName && (
                            <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {fileName}
                            </span>
                        )}
                    </div>
                    
                    {inputMode === 'text' ? (
                        <CodeEditor
                            className="min-h-[120px]"
                            language="text"
                            placeholder="Enter text to hash..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <div 
                            onClick={handleFileSelect}
                            className="min-h-[120px] border-2 border-dashed border-border-glass rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                        >
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">Click to select a file</p>
                                <p className="text-xs text-foreground-muted mt-1">Any file type supported</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hash Comparison */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        Verify Hash (Optional)
                    </label>
                    <div className="relative">
                        <Input
                            type="text"
                            value={compareHash}
                            onChange={(e) => setCompareHash(e.target.value)}
                            placeholder="Paste a hash to verify..."
                            className={cn(
                                "font-mono text-xs pr-10",
                                compareResult && matchedAlgo && "border-emerald-500/50 bg-emerald-500/5",
                                compareResult && !matchedAlgo && hasAnyHash && "border-red-500/50 bg-red-500/5"
                            )}
                            fullWidth
                        />
                        {compareResult && hasAnyHash && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {matchedAlgo ? (
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs font-bold">{matchedAlgo.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-red-400">
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-xs font-medium">No match</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hash Results */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" />
                            Generated Hashes
                        </label>
                        {isProcessing && (
                            <span className="text-xs text-indigo-400 animate-pulse">Processing...</span>
                        )}
                    </div>

                    {hasAnyHash ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {HASH_ALGORITHMS.map((algo) => {
                                const hash = hashes[algo.id];
                                if (!hash) return null;
                                
                                const isMatched = compareResult && hash.toLowerCase() === compareResult;
                                const isCopied = copiedAlgo === algo.id;

                                return (
                                    <div
                                        key={algo.id}
                                        className={cn(
                                            "group relative rounded-xl border p-4 transition-all",
                                            isMatched 
                                                ? "border-emerald-500/50 bg-emerald-500/10" 
                                                : `${algo.borderColor} ${algo.bgColor} hover:border-opacity-50`
                                        )}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center",
                                                    isMatched ? "bg-emerald-500/20" : algo.bgColor
                                                )}>
                                                    {algo.security === 'strong' ? (
                                                        <Lock className={cn("w-3.5 h-3.5", isMatched ? "text-emerald-400" : algo.color)} />
                                                    ) : (
                                                        <Hash className={cn("w-3.5 h-3.5", isMatched ? "text-emerald-400" : algo.color)} />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={cn(
                                                        "font-bold text-sm",
                                                        isMatched ? "text-emerald-400" : algo.color
                                                    )}>
                                                        {algo.name}
                                                    </span>
                                                    <span className="text-[10px] text-foreground-muted ml-2">
                                                        {algo.bits} bits
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {isMatched && (
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Match
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                    algo.security === 'strong' && "bg-emerald-500/20 text-emerald-400",
                                                    algo.security === 'moderate' && "bg-amber-500/20 text-amber-400",
                                                    algo.security === 'weak' && "bg-red-500/20 text-red-400"
                                                )}>
                                                    {algo.security}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Hash Value */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={hash}
                                                    className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 font-mono text-[11px] text-foreground-secondary truncate focus:outline-none"
                                                />
                                            </div>
                                            <Button
                                                variant="glass"
                                                size="sm"
                                                onClick={() => handleCopy(algo.id, hash)}
                                                className={cn(
                                                    "shrink-0 transition-all",
                                                    isCopied && "bg-emerald-500/20 border-emerald-500/30"
                                                )}
                                            >
                                                {isCopied ? (
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[10px] text-foreground-muted mt-2 opacity-60">
                                            {algo.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-border-glass rounded-xl">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                <Hash className="w-8 h-8 text-indigo-400" />
                            </div>
                            <p className="text-foreground-muted font-medium">No hashes generated yet</p>
                            <p className="text-xs text-foreground-muted/60 mt-1">
                                Enter text or select a file to generate hashes
                            </p>
                        </div>
                    )}
                </div>

                {/* Security Note */}
                {hasAnyHash && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-amber-400">Security Recommendation</p>
                            <p className="text-[11px] text-foreground-muted mt-1">
                                For security-critical applications, use <strong className="text-emerald-400">SHA-256</strong>, <strong className="text-cyan-400">SHA-512</strong>, or <strong className="text-violet-400">SHA-3</strong>. 
                                Avoid MD5 and SHA-1 for password hashing or security verification.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
