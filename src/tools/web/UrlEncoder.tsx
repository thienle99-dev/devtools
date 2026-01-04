import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'url-encoder';

export const UrlEncoder: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = tools[TOOL_ID] || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(TOOL_ID, { input: val });
    };

    const handleEncode = () => {
        setLoadingAction('Encode');
        setTimeout(() => {
            try {
                if (!input) return;
                setToolData(TOOL_ID, { output: encodeURIComponent(input) });
            } catch (error) {
                setToolData(TOOL_ID, { output: 'Error encoding URL' });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleDecode = () => {
        setLoadingAction('Decode');
        setTimeout(() => {
            try {
                if (!input) return;
                setToolData(TOOL_ID, { output: decodeURIComponent(input) });
            } catch (error) {
                setToolData(TOOL_ID, { output: 'Error: Malformed URI sequence' });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleClear = () => clearToolData(TOOL_ID);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            title="URL Encoder / Decoder"
            description="Encode or decode URL-encoded format"
            onClear={handleClear}
            onCopy={handleCopy}
            actions={
                <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleEncode} loading={loadingAction === 'Encode'}>Encode</Button>
                    <Button variant="secondary" size="sm" onClick={handleDecode} loading={loadingAction === 'Decode'}>Decode</Button>
                </div>
            }
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            placeholder="Enter text here..."
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
            </div>
        </ToolPane>
    );
};
