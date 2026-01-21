import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, FileType } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'mime-type';

interface MimeTypeConverterProps {
    tabId?: string;
}

const MODES = [
    { id: 'extension-to-mime', label: 'Extension → MIME', description: 'Get MIME type from file extension' },
    { id: 'mime-to-extension', label: 'MIME → Extension', description: 'Get file extension from MIME type' },
];

const MIME_TYPES: Record<string, string[]> = {
    'application/json': ['json'],
    'application/xml': ['xml'],
    'application/pdf': ['pdf'],
    'application/zip': ['zip'],
    'application/javascript': ['js'],
    'application/typescript': ['ts'],
    'text/html': ['html', 'htm'],
    'text/css': ['css'],
    'text/plain': ['txt'],
    'text/markdown': ['md'],
    'text/csv': ['csv'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/svg+xml': ['svg'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/mpeg': ['mpeg', 'mpg'],
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['ogg'],
    'font/woff': ['woff'],
    'font/woff2': ['woff2'],
    'font/ttf': ['ttf'],
    'font/otf': ['otf'],
};

const EXTENSION_TO_MIME: Record<string, string> = {};
Object.entries(MIME_TYPES).forEach(([mime, exts]) => {
    exts.forEach(ext => {
        EXTENSION_TO_MIME[ext.toLowerCase()] = mime;
    });
});

export const MimeTypeConverter: React.FC<MimeTypeConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: 'extension-to-mime' } };
    const { input, output } = data;
    const [mode, setMode] = useState<string>(data.options?.mode || 'extension-to-mime');

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
                case 'extension-to-mime':
                    const ext = input.trim().replace(/^\./, '').toLowerCase();
                    const mime = EXTENSION_TO_MIME[ext];
                    if (!mime) {
                        result = `Unknown extension: .${ext}\n\nCommon MIME types:\n${Object.keys(MIME_TYPES).slice(0, 10).join('\n')}`;
                    } else {
                        result = mime;
                    }
                    break;

                case 'mime-to-extension':
                    const mimeType = input.trim().toLowerCase();
                    const extensions = MIME_TYPES[mimeType];
                    if (!extensions) {
                        result = `Unknown MIME type: ${mimeType}\n\nCommon extensions:\n${Object.keys(EXTENSION_TO_MIME).slice(0, 10).join(', ')}`;
                    } else {
                        result = extensions.map(ext => `.${ext}`).join(', ');
                    }
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
            title="MIME Type Converter"
            description="Convert between file extensions and MIME types"
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
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all min-w-[150px] justify-center",
                                mode === m.id 
                                    ? "bg-indigo-500 text-white shadow-lg" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button)]"
                            )}
                            title={m.description}
                        >
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
                                placeholder={mode === 'extension-to-mime' ? 'Enter file extension (e.g., .json, pdf)...' : 'Enter MIME type (e.g., application/json)...'}
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
                                <FileType className="w-3.5 h-3.5 text-foreground-muted/50" />
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
