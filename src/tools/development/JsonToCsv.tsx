import React, { useEffect, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import Papa from 'papaparse';

const TOOL_ID = 'json-to-csv';

export const JsonToCsv: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    // Default valid options
    const data = tools[TOOL_ID] || {
        input: '',
        output: '',
        options: {
            delimiter: ',',
            quotes: true, // Quote strings
            header: true,
        }
    };

    const { input, output, options } = data;
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleConvert = () => {
        if (!input.trim()) return;
        setLoading(true);

        setTimeout(() => {
            try {
                // Parse JSON first
                let jsonData;
                try {
                    jsonData = JSON.parse(input);
                } catch (e) {
                    setToolData(TOOL_ID, { output: 'Error: Invalid JSON input.' });
                    setLoading(false);
                    return;
                }

                // If single object, wrap in array? Papa parse handles array of objects best.
                // If nested, Papa parse might struggle without flattening.
                // Let's assume standard array of flat(ish) objects.

                const csv = Papa.unparse(jsonData, {
                    quotes: options.quotes,
                    delimiter: options.delimiter,
                    header: options.header,
                });

                setToolData(TOOL_ID, { output: csv });

            } catch (e) {
                setToolData(TOOL_ID, { output: `Error: ${(e as Error).message}` });
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleClear = () => clearToolData(TOOL_ID);

    return (
        <ToolPane
            title="JSON to CSV Converter"
            description="Convert JSON arrays to CSV format"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Options */}
                <div className="flex flex-wrap gap-4 p-4 glass-panel rounded-xl items-center">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Delimiter</label>
                        <select
                            value={options.delimiter}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, delimiter: e.target.value } })}
                            className="glass-input h-9 text-xs w-24"
                        >
                            <option value=",">Comma (,)</option>
                            <option value=";">Semi-colon (;)</option>
                            <option value="\t">Tab</option>
                            <option value="|">Pipe (|)</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.header}
                                onChange={(e) => setToolData(TOOL_ID, { options: { ...options, header: e.target.checked } })}
                                className="rounded border-border-glass bg-glass-input text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-bold text-foreground-secondary">Include Header</span>
                        </label>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.quotes}
                                onChange={(e) => setToolData(TOOL_ID, { options: { ...options, quotes: e.target.checked } })}
                                className="rounded border-border-glass bg-glass-input text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-bold text-foreground-secondary">Quote Values</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input JSON</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="json"
                            value={input}
                            onChange={(val) => setToolData(TOOL_ID, { input: val })}
                            placeholder='[{"name": "John", "age": 30}, ...]'
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">CSV Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            value={output}
                            readOnly
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="primary" onClick={handleConvert} loading={loading}>
                        Convert to CSV
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
