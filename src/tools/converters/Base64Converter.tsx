import React, { useEffect, useCallback, useState } from 'react';
import CryptoJS from 'crypto-js';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'base64';

export const Base64Converter: React.FC = () => {
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

    const handleEncode = () => {
        setLoadingAction('Encode');
        setTimeout(() => {
            try {
                if (!input) return;
                const encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
                setToolData(TOOL_ID, { output: encoded });
            } catch (error) {
                setToolData(TOOL_ID, { output: `Error: ${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleDecode = () => {
        setLoadingAction('Decode');
        setTimeout(() => {
            try {
                if (!input) return;
                const decoded = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
                // If the resulting string is empty but input wasn't, it might be invalid encoding or binary data
                if (!decoded && input.trim().length > 0) {
                    setToolData(TOOL_ID, { output: 'Error: Could not decode to UTF-8 string. Input might be invalid Base64 or binary data.' });
                } else {
                    setToolData(TOOL_ID, { output: decoded });
                }
            } catch (error) {
                setToolData(TOOL_ID, { output: `Error: Invalid Base64 input\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleClear = () => clearToolData(TOOL_ID);

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
