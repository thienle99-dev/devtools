import React, { useEffect, useCallback, useState } from 'react';
import yaml from 'js-yaml';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'json-yaml';

interface JsonYamlConverterProps {
    tabId?: string;
}

export const JsonYamlConverter: React.FC<JsonYamlConverterProps> = ({ tabId }) => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const effectiveId = tabId || TOOL_ID;

    // Get current state or default
    const data = tools[effectiveId] || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleToJson = () => {
        setLoadingAction('ToJson');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = yaml.load(input);
                const formatted = JSON.stringify(parsed, null, 2);
                setToolData(effectiveId, { output: formatted });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid YAML\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleToYaml = () => {
        setLoadingAction('ToYaml');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = JSON.parse(input);
                const formatted = yaml.dump(parsed);
                setToolData(effectiveId, { output: formatted });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid JSON\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleClear = () => clearToolData(effectiveId);

    const handleCopy = () => {
        if (output) navigator.clipboard.writeText(output);
    };

    const handleDownload = () => {
        if (!output) return;
        const isJson = output.trim().startsWith('{') || output.trim().startsWith('[');
        const blob = new Blob([output], { type: isJson ? 'application/json' : 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isJson ? 'converted.json' : 'converted.yaml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            title="JSON <> YAML"
            description="Convert between JSON and YAML formats"
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
                            language="text" // Auto-detect might be hard here, just keeping text or maybe dynamic?
                            placeholder="Paste JSON or YAML content..."
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
                    <Button
                        variant="primary"
                        onClick={handleToYaml}
                        loading={loadingAction === 'ToYaml'}
                        className="uppercase tracking-widest"
                    >
                        JSON → YAML
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleToJson}
                        loading={loadingAction === 'ToJson'}
                        className="uppercase tracking-widest"
                    >
                        YAML → JSON
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
