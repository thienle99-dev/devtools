import React, { useEffect, useState, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';

const TOOL_ID = 'base64-file';

interface Base64FileConverterProps {
    tabId?: string;
}

export const Base64FileConverter: React.FC<Base64FileConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || { input: '', output: '', options: { fileName: '' } };
    // We use 'output' to store the Base64 string result. 
    // We don't really use 'input' for text here, but we can store the file name options.
    const { output, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoadingAction('Reading');
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            setToolData(effectiveId, {
                output: result,
                options: { fileName: file.name, fileSize: file.size }
            });
            setLoadingAction(null);
        };

        reader.onerror = () => {
            setToolData(effectiveId, { output: 'Error reading file' });
            setLoadingAction(null);
        };

        reader.readAsDataURL(file);
    };

    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };
    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Base64 File Converter"
            description="Convert files (images, docs, etc.) to Base64 strings"
            onClear={handleClear}
            onCopy={handleCopy}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div
                    className="border-2 border-dashed border-border-glass rounded-xl p-8 flex flex-col items-center justify-center space-y-4 hover:bg-bg-glass-hover transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold">{options?.fileName || "Click to upload a file"}</p>
                        <p className="text-xs text-foreground-secondary mt-1">Any file type supported</p>
                    </div>
                </div>

                {loadingAction === 'Reading' && (
                    <div className="text-center text-sm text-foreground-muted animate-pulse">
                        Reading file...
                    </div>
                )}

                <div className="flex-1 min-h-[200px] flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Base64 Output</label>
                    <CodeEditor
                        className="flex-1"
                        language="text"
                        value={output}
                        readOnly={true}
                        editable={false}
                    />
                </div>
            </div>
        </ToolPane>
    );
};
