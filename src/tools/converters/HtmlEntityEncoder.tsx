import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Copy, ArrowRight } from 'lucide-react';
import he from 'he';
import { toast } from 'sonner';

const TOOL_ID = 'html-entity';

interface HtmlEntityEncoderProps {
    tabId?: string;
}

export const HtmlEntityEncoder: React.FC<HtmlEntityEncoderProps> = ({ tabId }) => {
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

    const encodeHtmlEntity = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = he.encode(input, { useNamedReferences: true });
            setToolData(effectiveId, { output: res });
            toast.success('HTML entities encoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeHtmlEntity = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = he.decode(input);
            setToolData(effectiveId, { output: res });
            toast.success('HTML entities decoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    return (
        <ToolPane
            title="HTML Entity Encode/Decode"
            description="Escape and unescape HTML entities"
            onClear={handleClear}
        >
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                {/* Left Input */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">HTML Input</span>
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
                            language="html"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Paste HTML content here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={encodeHtmlEntity} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Escape HTML Entities
                        </Button>
                    </div>
                </div>

                {/* Right Output */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Escaped Output</span>
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
                            <span className="text-[9px] font-mono text-foreground-muted/50">HTML</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor
                            className="h-full w-full"
                            language="text"
                            value={output}
                            readOnly
                            editable={false}
                            placeholder="Escaped HTML entities will appear here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={decodeHtmlEntity} 
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Unescape HTML Entities
                        </Button>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
