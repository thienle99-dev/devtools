import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, FileCode } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'character-encoding';

interface CharacterEncodingConverterProps {
    tabId?: string;
}

const ENCODINGS = [
    { id: 'utf-8', label: 'UTF-8', description: 'Unicode Transformation Format' },
    { id: 'ascii', label: 'ASCII', description: 'American Standard Code' },
    { id: 'iso-8859-1', label: 'ISO-8859-1', description: 'Latin-1' },
    { id: 'windows-1252', label: 'Windows-1252', description: 'Western European' },
    { id: 'utf-16', label: 'UTF-16', description: '16-bit Unicode' },
    { id: 'utf-32', label: 'UTF-32', description: '32-bit Unicode' },
];

export const CharacterEncodingConverter: React.FC<CharacterEncodingConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { fromEncoding: 'utf-8', toEncoding: 'utf-8' } };
    const { input, output } = data;
    const [fromEncoding, setFromEncoding] = useState<string>(data.options?.fromEncoding || 'utf-8');
    const [toEncoding, setToEncoding] = useState<string>(data.options?.toEncoding || 'utf-8');

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const convertEncoding = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            // Convert from source encoding
            let text: string;
            
            if (fromEncoding === 'utf-8') {
                text = input;
            } else if (fromEncoding === 'ascii') {
                // ASCII is subset of UTF-8
                text = input;
            } else {
                // For other encodings, try to decode
                try {
                    const bytes = new Uint8Array(input.split('').map(c => c.charCodeAt(0)));
                    const decoder = new TextDecoder(fromEncoding as any);
                    text = decoder.decode(bytes);
                } catch {
                    // Fallback: treat as UTF-8
                    text = input;
                }
            }

            // Convert to target encoding
            let result: string;
            
            if (toEncoding === 'utf-8') {
                result = text;
            } else {
                try {
                    const encoder = new TextEncoder();
                    const bytes = encoder.encode(text);
                    const decoder = new TextDecoder(toEncoding as any);
                    result = decoder.decode(bytes);
                } catch {
                    // Fallback: use UTF-8
                    result = text;
                }
            }

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, fromEncoding, toEncoding }
            });
            toast.success(`Converted from ${ENCODINGS.find(e => e.id === fromEncoding)?.label} to ${ENCODINGS.find(e => e.id === toEncoding)?.label}`);
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    return (
        <ToolPane
            title="Character Encoding Converter"
            description="Convert between different character encodings"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Encoding Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* From Encoding */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Encoding</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {ENCODINGS.map((enc) => (
                                <button
                                    key={enc.id}
                                    onClick={() => {
                                        setFromEncoding(enc.id);
                                        setToolData(effectiveId, { options: { ...data.options, fromEncoding: enc.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-left",
                                        fromEncoding === enc.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                    title={enc.description}
                                >
                                    <div className="font-semibold">{enc.label}</div>
                                    <div className="text-[9px] text-foreground-muted/70 truncate">{enc.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* To Encoding */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Encoding</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {ENCODINGS.map((enc) => (
                                <button
                                    key={enc.id}
                                    onClick={() => {
                                        setToEncoding(enc.id);
                                        setToolData(effectiveId, { options: { ...data.options, toEncoding: enc.id } });
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-lg border transition-all text-xs font-medium text-left",
                                        toEncoding === enc.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                    title={enc.description}
                                >
                                    <div className="font-semibold">{enc.label}</div>
                                    <div className="text-[9px] text-foreground-muted/70 truncate">{enc.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Split Editor */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                    {/* Left Input */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {ENCODINGS.find(e => e.id === fromEncoding)?.label || 'Input'}
                                </span>
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
                                placeholder={`Enter text in ${ENCODINGS.find(e => e.id === fromEncoding)?.label || 'UTF-8'}...`}
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convertEncoding} 
                                className="w-full font-semibold gap-2"
                                disabled={!input.trim()}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Convert
                            </Button>
                        </div>
                    </div>

                    {/* Right Output */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                                    {ENCODINGS.find(e => e.id === toEncoding)?.label || 'Output'}
                                </span>
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
                                <FileCode className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder={`Converted text in ${ENCODINGS.find(e => e.id === toEncoding)?.label || 'UTF-8'} will appear here...`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
