import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';

const TOOL_ID = 'json-format';

interface JsonFormatterProps {
    tabId?: string;
}

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ tabId }) => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    // Use tabId if provided, otherwise fallback to singleton TOOL_ID
    const effectiveId = tabId || TOOL_ID;

    // Get current state or default
    const data = tools[effectiveId] || { input: '', output: '', options: {} };
    const { input, output } = data;

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Register usage on mount
    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleFormat = () => {
        setLoadingAction('Format');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = JSON.parse(input);
                const formatted = JSON.stringify(parsed, null, 2);
                setToolData(effectiveId, { output: formatted });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid JSON\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400); // Fake delay for UX
    };

    const handleMinify = () => {
        setLoadingAction('Minify');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = JSON.parse(input);
                const minified = JSON.stringify(parsed);
                setToolData(effectiveId, { output: minified });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid JSON\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400);
    };

    const handleValidate = () => {
        setLoadingAction('Validate');
        setTimeout(() => {
            try {
                if (!input.trim()) {
                    setToolData(effectiveId, { output: 'Empty input.' });
                    return;
                }
                JSON.parse(input);
                setToolData(effectiveId, { output: 'Valid JSON ✔️' });
            } catch (error) {
                setToolData(effectiveId, { output: `Invalid JSON ❌\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
            // Optionally add toast here later
        }
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            title="JSON Formatter"
            description="Prettify, minify, and validate JSON data"
            onClear={handleClear}
            onCopy={handleCopy}
            onDownload={handleDownload}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="json"
                            placeholder="Paste your JSON here..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="json"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="primary"
                        onClick={handleFormat}
                        loading={loadingAction === 'Format'}
                        className="uppercase tracking-widest"
                    >
                        Format
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleMinify}
                        loading={loadingAction === 'Minify'}
                        className="uppercase tracking-widest"
                    >
                        Minify
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleValidate}
                        loading={loadingAction === 'Validate'}
                        className="uppercase tracking-widest"
                    >
                        Validate
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
