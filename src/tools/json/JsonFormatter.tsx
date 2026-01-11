import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { formatJson, minifyJson, validateJson } from './logic';

const TOOL_ID = 'json-format';

// Export for pipeline support
export const process = async (input: string, options: { method?: 'format' | 'minify' | 'validate' } = {}) => {
    const method = options.method || 'format';
    switch (method) {
        case 'minify': return minifyJson(input);
        case 'validate': return validateJson(input);
        default: return formatJson(input);
    }
};

interface JsonFormatterProps {
    tabId?: string;
}

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ tabId }) => {
    // Use tabId if provided, otherwise fallback to singleton TOOL_ID
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Get current state or default
    const data = toolData || { input: '', output: '', options: {} };
    const { input, output } = data;

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Register usage on mount
    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleAction = async (action: 'Format' | 'Minify' | 'Validate', fn: (s: string) => string) => {
        setLoadingAction(action);
        // Fake delay for UX
        await new Promise(resolve => setTimeout(resolve, 400));
        try {
            const result = fn(input);
            setToolData(effectiveId, { output: result });
        } catch (error) {
            setToolData(effectiveId, { output: `Error: Invalid JSON\n${(error as Error).message}` });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleFormat = () => handleAction('Format', formatJson);
    const handleMinify = () => handleAction('Minify', minifyJson);
    const handleValidate = () => handleAction('Validate', validateJson);

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
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
