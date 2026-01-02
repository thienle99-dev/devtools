import React, { useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'json-format';

export const JsonFormatter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    // Get current state or default
    const data = tools[TOOL_ID] || { input: '', output: '', options: {} };
    const { input, output } = data;

    // Register usage on mount
    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(TOOL_ID, { input: val });
    }, [setToolData]);

    const handleFormat = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setToolData(TOOL_ID, { output: formatted });
        } catch (error) {
            setToolData(TOOL_ID, { output: `Error: Invalid JSON\n${(error as Error).message}` });
        }
    };

    const handleMinify = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setToolData(TOOL_ID, { output: minified });
        } catch (error) {
            setToolData(TOOL_ID, { output: `Error: Invalid JSON\n${(error as Error).message}` });
        }
    };

    const handleValidate = () => {
        try {
            if (!input.trim()) {
                setToolData(TOOL_ID, { output: 'Empty input.' });
                return;
            }
            JSON.parse(input);
            setToolData(TOOL_ID, { output: 'Valid JSON ✔️' });
        } catch (error) {
            setToolData(TOOL_ID, { output: `Invalid JSON ❌\n${(error as Error).message}` });
        }
    };

    const handleClear = () => {
        clearToolData(TOOL_ID);
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
                    <button
                        onClick={handleFormat}
                        className={cn(
                            "glass-button-primary bg-indigo-500/80 hover:bg-indigo-500 text-white shadow-none hover:shadow-indigo-500/20",
                            "px-8 py-2.5 font-semibold text-xs uppercase tracking-widest transition-all"
                        )}
                    >
                        Format
                    </button>
                    <button
                        onClick={handleMinify}
                        className="glass-button px-8 py-2.5 font-semibold text-xs uppercase tracking-widest text-foreground-secondary hover:text-foreground"
                    >
                        Minify
                    </button>
                    <button
                        onClick={handleValidate}
                        className="glass-button px-8 py-2.5 font-semibold text-xs uppercase tracking-widest text-foreground-secondary hover:text-foreground"
                    >
                        Validate
                    </button>
                </div>
            </div>
        </ToolPane>
    );
};
