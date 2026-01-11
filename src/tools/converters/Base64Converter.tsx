import React, { useEffect, useCallback, useState } from 'react';
import { Button } from '@components/ui/Button';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { base64Encode, base64Decode } from './logic';

const TOOL_ID = 'base64';

// Export for pipeline support
export const process = async (input: string, options: { action?: 'encode' | 'decode' } = {}) => {
    const action = options.action || 'encode';
    if (action === 'decode') return base64Decode(input);
    return base64Encode(input);
};

interface Base64ConverterProps {
    tabId?: string;
}

export const Base64Converter: React.FC<Base64ConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = toolData || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleAction = async (action: 'Encode' | 'Decode', fn: (s: string) => string) => {
        setLoadingAction(action);
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            if (!input) {
                // allow empty input to clear output or just do nothing? 
                // logic functions return empty string for empty input roughly
            }
            const result = fn(input);
            setToolData(effectiveId, { output: result });
        } catch (error) {
            setToolData(effectiveId, { output: `Error: ${(error as Error).message}` });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEncode = () => handleAction('Encode', base64Encode);
    const handleDecode = () => handleAction('Decode', base64Decode);

    const handleClear = () => clearToolData(effectiveId);

    const handleCopy = () => {
        if (output) navigator.clipboard.writeText(output);
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'base64_result.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            title="Base64 Converter"
            description="Encode and decode text to/from Base64"
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
                            language="text"
                            placeholder="Type text or paste Base64..."
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
                        onClick={handleEncode}
                        loading={loadingAction === 'Encode'}
                        className="uppercase tracking-widest"
                    >
                        Encode
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDecode}
                        loading={loadingAction === 'Decode'}
                        className="uppercase tracking-widest"
                    >
                        Decode
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
