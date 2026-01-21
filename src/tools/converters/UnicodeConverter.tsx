import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Hash } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'unicode';

interface UnicodeConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'text-to-unicode', label: 'Text → Unicode', icon: '→' },
    { id: 'unicode-to-text', label: 'Unicode → Text', icon: '←' },
    { id: 'text-to-escape', label: 'Text → Escape', icon: '\\' },
    { id: 'escape-to-text', label: 'Escape → Text', icon: '/' },
];

export const UnicodeConverter: React.FC<UnicodeConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'text-to-unicode' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'text-to-unicode');

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
                case 'text-to-unicode':
                    // Text to Unicode codes (U+0041 format)
                    result = input.split('').map(char => {
                        const code = char.charCodeAt(0);
                        return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
                    }).join(' ');
                    break;

                case 'unicode-to-text':
                    // Unicode codes (U+0041) to Text
                    const unicodeRegex = /U\+([0-9A-Fa-f]{1,6})/g;
                    result = input.replace(unicodeRegex, (_, hex) => {
                        const code = parseInt(hex, 16);
                        return String.fromCharCode(code);
                    });
                    break;

                case 'text-to-escape':
                    // Text to Unicode escape sequences (\u0041)
                    result = input.split('').map(char => {
                        const code = char.charCodeAt(0);
                        if (code > 0xFFFF) {
                            // Surrogate pair for code points > 0xFFFF
                            const high = Math.floor((code - 0x10000) / 0x400) + 0xD800;
                            const low = ((code - 0x10000) % 0x400) + 0xDC00;
                            return `\\u${high.toString(16).toUpperCase().padStart(4, '0')}\\u${low.toString(16).toUpperCase().padStart(4, '0')}`;
                        }
                        return `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
                    }).join('');
                    break;

                case 'escape-to-text':
                    // Unicode escape sequences (\u0041) to Text
                    result = input.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => {
                        const code = parseInt(hex, 16);
                        return String.fromCharCode(code);
                    });
                    // Handle surrogate pairs
                    result = result.replace(/\\u([Dd][89ABab][0-9A-Fa-f]{2})\\u([Dd][CDEFcdef][0-9A-Fa-f]{2})/g, (_, high, low) => {
                        const highCode = parseInt(high, 16);
                        const lowCode = parseInt(low, 16);
                        const code = (highCode - 0xD800) * 0x400 + (lowCode - 0xDC00) + 0x10000;
                        return String.fromCharCode(code);
                    });
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
            title="Unicode Converter"
            description="Convert between text and Unicode codes/escape sequences"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Mode Switcher */}
                <div className="flex rounded-lg overflow-hidden border border-border-glass bg-[var(--color-glass-panel-light)] p-0.5 w-fit">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id);
                                setToolData(effectiveId, { options: { ...data.options, mode: m.id } });
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all min-w-[120px] justify-center",
                                mode === m.id
                                    ? "bg-indigo-500 text-white shadow-lg"
                                    : "text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button)]"
                            )}
                        >
                            <span className="text-sm">{m.icon}</span>
                            {m.label}
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
                                placeholder="Enter text or Unicode codes..."
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
                                <Hash className="w-3.5 h-3.5 text-foreground-muted/50" />
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
