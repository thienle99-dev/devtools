import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Binary } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'binary-hex-text';

interface BinaryHexTextConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'binary-to-text', label: 'Binary → Text', description: 'Convert binary string to ASCII text' },
    { id: 'text-to-binary', label: 'Text → Binary', description: 'Convert text to binary string' },
    { id: 'hex-to-text', label: 'Hex → Text', description: 'Convert hex string to ASCII text' },
    { id: 'text-to-hex', label: 'Text → Hex', description: 'Convert text to hex string' },
];

export const BinaryHexTextConverter: React.FC<BinaryHexTextConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'binary-to-text' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'binary-to-text');

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

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            let result = '';

            switch (mode) {
                case 'binary-to-text':
                    // Remove spaces and validate binary
                    const binaryStr = input.replace(/\s+/g, '');
                    if (!/^[01]+$/.test(binaryStr)) {
                        throw new Error('Invalid binary string. Only 0 and 1 are allowed.');
                    }
                    // Convert 8-bit chunks to characters
                    result = binaryStr.match(/.{1,8}/g)?.map(bin => {
                        const charCode = parseInt(bin.padEnd(8, '0'), 2);
                        return String.fromCharCode(charCode);
                    }).join('') || '';
                    break;

                case 'text-to-binary':
                    result = input.split('').map(char => {
                        return char.charCodeAt(0).toString(2).padStart(8, '0');
                    }).join(' ');
                    break;

                case 'hex-to-text':
                    // Remove spaces and validate hex
                    const hexStr = input.replace(/\s+/g, '').replace(/0x/gi, '');
                    if (!/^[0-9A-Fa-f]+$/.test(hexStr)) {
                        throw new Error('Invalid hex string. Only 0-9, A-F are allowed.');
                    }
                    // Convert hex pairs to characters
                    result = hexStr.match(/.{1,2}/g)?.map(hex => {
                        const charCode = parseInt(hex, 16);
                        return String.fromCharCode(charCode);
                    }).join('') || '';
                    break;

                case 'text-to-hex':
                    result = input.split('').map(char => {
                        return char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
                    }).join(' ');
                    break;
            }

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, mode }
            });
            toast.success('Conversion completed');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Binary/Hex to Text Converter"
            description="Convert between binary/hex strings and ASCII text"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Mode Switcher */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id);
                                setToolData(effectiveId, { options: { ...data.options, mode: m.id } });
                            }}
                            className={cn(
                                "p-2.5 rounded-lg border transition-all text-xs font-medium text-center",
                                mode === m.id
                                    ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                    : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                            )}
                            title={m.description}
                        >
                            <div className="font-semibold">{m.label}</div>
                        </button>
                    ))}
                </div>

                {/* Split Editor */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                    {/* Left Input */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Input</span>
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
                                placeholder="Enter binary, hex, or text..."
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convert} 
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Output</span>
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
                                <Binary className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted result will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
