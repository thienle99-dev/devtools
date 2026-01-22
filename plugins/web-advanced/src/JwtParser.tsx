import React, { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { CodeEditor } from '@components/ui/CodeEditor';
import { TextArea } from '@components/ui/TextArea';

const TOOL_ID = 'jwt-parser';

interface JwtParserProps {
    tabId?: string;
}

export const JwtParser: React.FC<JwtParserProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Default options
    const data = toolData || {
        input: '',
        options: {
            header: '',
            payload: '',
            isValid: null
        }
    };

    const { input, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        let header = '';
        let payload = '';
        let isValid = false;

        if (val) {
            try {
                // Decode payload
                const decodedPayload = jwtDecode(val);
                payload = JSON.stringify(decodedPayload, null, 2);

                // Decode header
                const decodedHeader = jwtDecode(val, { header: true });
                header = JSON.stringify(decodedHeader, null, 2);

                isValid = true;
            } catch (error) {
                // Invalid JWT
                isValid = false;
            }
        }

        setToolData(effectiveId, {
            input: val,
            options: { header, payload, isValid }
        });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="JWT Parser"
            description="Decode JSON Web Tokens (JWT) to view header and payload"
            onClear={handleClear}
        >
            <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 h-full flex flex-col">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">JWT String</label>
                        {options.isValid === false && input && <span className="text-xs text-red-500 font-bold">Invalid JWT</span>}
                        {options.isValid === true && <span className="text-xs text-emerald-500 font-bold">Valid Format</span>}
                    </div>
                    <TextArea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className={`font-mono text-xs break-all ${options.isValid === false ? 'border-red-500/30 bg-red-500/5' : ''}`}
                        placeholder="ey..."
                        fullWidth
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="space-y-2 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Header</label>
                        <CodeEditor
                            className="flex-1"
                            language="json"
                            value={options.header}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                    <div className="space-y-2 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Payload</label>
                        <CodeEditor
                            className="flex-1"
                            language="json"
                            value={options.payload}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
