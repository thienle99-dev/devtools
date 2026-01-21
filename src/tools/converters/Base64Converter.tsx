import React, { useEffect, useState, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Type, File, Upload, Download, Copy, ArrowRight } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

const TOOL_ID = 'base64';

interface Base64ConverterProps {
    tabId?: string;
}

export const Base64Converter: React.FC<Base64ConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { base64Mode: 'text', base64FileName: '' } };
    const { input, output } = data;
    const [base64Mode, setBase64Mode] = useState<'text' | 'file'>(data.options?.base64Mode || 'text');
    const [base64FileName, setBase64FileName] = useState<string>(data.options?.base64FileName || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    useEffect(() => {
        if (data.options?.base64Mode) {
            setBase64Mode(data.options.base64Mode);
            setBase64FileName(data.options.base64FileName || '');
        }
    }, [data.options]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setBase64FileName('');
    };

    // Base64 - Text Mode
    const encodeBase64Text = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
            setToolData(effectiveId, { output: res });
            toast.success('Encoded to Base64');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeBase64Text = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
            setToolData(effectiveId, { output: res });
            toast.success('Decoded from Base64');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    // Base64 - File Mode
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix if present (data:image/png;base64,)
            const base64Content = result.includes(',') ? result.split(',')[1] : result;
            
            setBase64FileName(file.name);
            setToolData(effectiveId, { 
                input: base64Content,
                output: '',
                options: { ...data.options, base64FileName: file.name, base64Mode: 'file' }
            });
            toast.success(`File loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
        };

        reader.onerror = () => {
            toast.error('Failed to read file');
        };

        reader.readAsDataURL(file);
    };

    const encodeBase64File = () => {
        try {
            if (!input.trim()) {
                toast.error('No file selected');
                return;
            }
            setToolData(effectiveId, { output: input });
            toast.success('File encoded to Base64');
        } catch (e) { 
            toast.error('Encoding failed');
        }
    };

    const decodeBase64File = async () => {
        try {
            if (!input.trim()) {
                toast.error('No Base64 data');
                return;
            }
            
            const binaryString = atob(input);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = base64FileName || 'decoded_file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('File decoded and downloaded');
            setToolData(effectiveId, { output: `File decoded: ${base64FileName || 'decoded_file'}` });
        } catch (e) { 
            toast.error('Decoding failed: ' + (e as Error).message);
        }
    };

    const renderSplitEditor = (leftLabel: string, rightLabel: string, leftAction: () => void, rightAction: () => void) => {
        return (
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                {/* Left Input */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{leftLabel}</span>
                        </div>
                        {input && (
                            <button 
                                onClick={() => handleCopy(input, 'Input')} 
                                className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                title="Copy Input"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor
                            className="h-full w-full"
                            language="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Paste content here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={leftAction} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Encode to Base64
                        </Button>
                    </div>
                </div>

                {/* Right Output */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{rightLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {output && (
                                <button 
                                    onClick={() => handleCopy(output, 'Output')} 
                                    className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                    title="Copy Output"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <span className="text-[9px] font-mono text-foreground-muted/50">BASE64</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor
                            className="h-full w-full"
                            language="text"
                            value={output}
                            readOnly
                            editable={false}
                            placeholder="Base64 encoded data will appear here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={rightAction} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Decode Base64
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Base64 Converter"
            description="Encode and decode Base64 strings or files"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col">
                {/* Mode Switcher */}
                <div className="flex rounded-lg overflow-hidden border border-border-glass bg-[var(--color-glass-panel-light)] p-0.5 w-fit mb-4">
                    <button
                        onClick={() => {
                            setBase64Mode('text');
                            setToolData(effectiveId, { options: { ...data.options, base64Mode: 'text' } });
                        }}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all min-w-[90px] justify-center",
                            base64Mode === 'text' 
                                ? "bg-indigo-500 text-white shadow-lg" 
                                : "text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button)]"
                        )}
                    >
                        <Type className="w-3.5 h-3.5" />
                        Text
                    </button>
                    <button
                        onClick={() => {
                            setBase64Mode('file');
                            setToolData(effectiveId, { options: { ...data.options, base64Mode: 'file' } });
                        }}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all min-w-[90px] justify-center",
                            base64Mode === 'file' 
                                ? "bg-indigo-500 text-white shadow-lg" 
                                : "text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button)]"
                        )}
                    >
                        <File className="w-3.5 h-3.5" />
                        File
                    </button>
                </div>

                {base64Mode === 'text' ? (
                    renderSplitEditor('Text Input', 'Base64 Output', encodeBase64Text, decodeBase64Text)
                ) : (
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                        {/* Left - File Input */}
                        <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                            <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">File Input</span>
                                </div>
                                {base64FileName && (
                                    <span className="text-[9px] font-mono text-foreground-muted/70 truncate max-w-[200px]" title={base64FileName}>
                                        {base64FileName}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-h-0 p-4 flex flex-col items-center justify-center border-dashed border-2 border-border-glass/30 rounded-lg m-4 cursor-pointer hover:border-indigo-500/50 transition-all"
                                onClick={handleFileSelect}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {base64FileName ? (
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto">
                                            <File className="w-8 h-8 text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{base64FileName}</p>
                                            <p className="text-xs text-foreground-muted mt-1">
                                                {input.length > 0 ? `${Math.round(input.length / 1024)} KB Base64` : 'No data'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileSelect();
                                            }}
                                            className="gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Change File
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto">
                                            <Upload className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">Select a file</p>
                                            <p className="text-xs text-foreground-muted mt-1">Choose a file to encode/decode</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileSelect();
                                            }}
                                            className="gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Select File
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0 space-y-2">
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={encodeBase64File} 
                                    className="w-full font-semibold gap-2"
                                    disabled={!input.trim()}
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    Encode File to Base64
                                </Button>
                            </div>
                        </div>

                        {/* Right - Base64 Output */}
                        <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                            <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Base64 Output</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {output && (
                                        <button 
                                            onClick={() => handleCopy(output, 'Base64')} 
                                            className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                            title="Copy Base64"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <span className="text-[9px] font-mono text-foreground-muted/50">BASE64</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 relative">
                                <CodeEditor
                                    className="h-full w-full"
                                    language="text"
                                    value={output}
                                    readOnly
                                    editable={false}
                                    placeholder="Base64 encoded data will appear here..."
                                />
                            </div>
                            <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={decodeBase64File} 
                                    className="w-full font-semibold gap-2"
                                    disabled={!output.trim()}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Decode & Save File
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
