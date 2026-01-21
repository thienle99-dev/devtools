import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'url-encode';

interface UrlEncoderProps {
    tabId?: string;
}

export const UrlEncoder: React.FC<UrlEncoderProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '' };
    const { input, output } = data;

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

    const encodeUrl = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: encodeURIComponent(input) });
            toast.success('URL encoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeUrl = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: decodeURIComponent(input) });
            toast.success('URL decoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    return (
        <ToolPane
            title="URL Encode/Decode"
            description="Encode and decode URL strings"
            onClear={handleClear}
        >
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                {/* Left Input */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Text Input</span>
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
                            placeholder="Paste URL or text here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={encodeUrl} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Encode URL
                        </Button>
                    </div>
                </div>

                {/* Right Output */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Encoded Output</span>
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
                            <span className="text-[9px] font-mono text-foreground-muted/50">URL</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor
                            className="h-full w-full"
                            language="text"
                            value={output}
                            readOnly
                            editable={false}
                            placeholder="Encoded URL will appear here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={decodeUrl} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Decode URL
                        </Button>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
