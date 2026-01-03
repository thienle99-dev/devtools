import React, { useEffect, useCallback, useState } from 'react';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'json-xml';

export const JsonXmlConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = tools[TOOL_ID] || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(TOOL_ID, { input: val });
    }, [setToolData]);

    const handleToJson = () => {
        setLoadingAction('ToJson');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_"
                });
                const result = parser.parse(input);
                const formatted = JSON.stringify(result, null, 2);
                setToolData(TOOL_ID, { output: formatted });
            } catch (error) {
                setToolData(TOOL_ID, { output: `Error: Invalid XML\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleToXml = () => {
        setLoadingAction('ToXml');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = JSON.parse(input);
                const builder = new XMLBuilder({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_",
                    format: true,
                    indentBy: "  "
                });
                const xml = builder.build(parsed);
                setToolData(TOOL_ID, { output: xml });
            } catch (error) {
                setToolData(TOOL_ID, { output: `Error: Invalid JSON\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleClear = () => clearToolData(TOOL_ID);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            title="JSON <> XML"
            description="Convert between JSON and XML formats"
            onClear={handleClear}
            onCopy={handleCopy}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            placeholder="Paste JSON or XML..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleToXml} loading={loadingAction === 'ToXml'} className="uppercase tracking-widest">JSON → XML</Button>
                    <Button variant="secondary" onClick={handleToJson} loading={loadingAction === 'ToJson'} className="uppercase tracking-widest">XML → JSON</Button>
                </div>
            </div>
        </ToolPane>
    );
};
