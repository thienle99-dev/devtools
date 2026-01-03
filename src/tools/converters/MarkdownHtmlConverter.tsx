import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'markdown-html';

export const MarkdownHtmlConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = tools[TOOL_ID] || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleToHtml = async () => {
        setLoadingAction('ToHtml');
        // Markdown parsing is usually fast/sync, but marked can be async if using some options.
        // For simple usage it's sync or promise-returning if async=true. 
        // marked 12+ returns result directly or promise? It returns string usually.
        try {
            if (!input.trim()) return;
            const html = await marked.parse(input);
            setToolData(TOOL_ID, { output: html });
        } catch (error) {
            setToolData(TOOL_ID, { output: `Error: ${(error as Error).message}` });
        } finally {
            setLoadingAction(null);
        }
    };

    // HTML to Markdown is hard without a library like Turndown.
    // For now we only support MD -> HTML as per basic req.

    const handleClear = () => clearToolData(TOOL_ID);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    // Preview mode could be cool
    const [preview, setPreview] = useState(false);

    return (
        <ToolPane
            title="Markdown to HTML"
            description="Convert Markdown to HTML"
            onClear={handleClear}
            onCopy={handleCopy}
            actions={
                <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setPreview(!preview)}
                    className={preview ? "bg-bg-glass-hover text-foreground" : ""}
                >
                    {preview ? "Show Code" : "Preview Output"}
                </Button>
            }
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input (Markdown)</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="markdown" // We map text to this in editor usually or use markdown extension if available
                            placeholder="# Hello World"
                            value={input}
                            onChange={(val) => setToolData(TOOL_ID, { input: val })}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">
                            {preview ? "Preview" : "Output (HTML)"}
                        </label>

                        {preview ? (
                            <div
                                className="flex-1 min-h-[200px] p-4 glass-panel-light rounded-xl overflow-auto prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: output }}
                            />
                        ) : (
                            <CodeEditor
                                className="flex-1 min-h-[200px]"
                                language="html"
                                value={output}
                                readOnly={true}
                                editable={false}
                            />
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleToHtml} loading={loadingAction === 'ToHtml'} className="uppercase tracking-widest">Convert to HTML</Button>
                </div>
            </div>
        </ToolPane>
    );
};
