import React, { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Button } from '@components/ui/Button';
import { EyeOff, Hash, Tag } from 'lucide-react';
import { maskText, maskJson } from './logic';

const TOOL_ID = 'data-masking';

export const DataMasking: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [input, setInput] = useState('');
    const [fields, setFields] = useState('email, password, token, api_key, secret');
    const [maskChar, setMaskChar] = useState('*');
    const [visibleStart, setVisibleStart] = useState(2);
    const [visibleEnd, setVisibleEnd] = useState(2);

    const handleMask = () => {
        if (!input.trim()) return;
        
        try {
            // Try to parse as JSON first
            const json = JSON.parse(input);
            const fieldList = fields.split(',').map(s => s.trim()).filter(Boolean);
            const masked = maskJson(json, fieldList);
            setToolData(TOOL_ID, { output: JSON.stringify(masked, null, 2) });
        } catch {
            // Treat as plain text
            const masked = maskText(input, { 
                maskChar, 
                visibleStart, 
                visibleEnd 
            });
            setToolData(TOOL_ID, { output: masked });
        }
    };

    const output = typeof toolData?.output === 'string' ? toolData.output : '';

    return (
        <ToolPane
            title="Data Masking"
            description="Mask sensitive information in text or JSON objects"
            onClear={() => { setInput(''); clearToolData(TOOL_ID); }}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Text / JSON</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste text or JSON here..."
                        className="glass-input w-full min-h-[150px] text-sm font-mono"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Tag className="w-3 h-3" /> JSON Fields to Mask
                        </label>
                        <input
                            type="text"
                            value={fields}
                            onChange={(e) => setFields(e.target.value)}
                            className="glass-input w-full text-xs"
                            placeholder="email, password, api_key..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Mask Character
                        </label>
                        <input
                            type="text"
                            maxLength={1}
                            value={maskChar}
                            onChange={(e) => setMaskChar(e.target.value)}
                            className="glass-input w-full text-xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Visible Start</label>
                        <input
                            type="number"
                            min="0"
                            value={visibleStart}
                            onChange={(e) => setVisibleStart(parseInt(e.target.value) || 0)}
                            className="glass-input w-full text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Visible End</label>
                        <input
                            type="number"
                            min="0"
                            value={visibleEnd}
                            onChange={(e) => setVisibleEnd(parseInt(e.target.value) || 0)}
                            className="glass-input w-full text-xs"
                        />
                    </div>
                </div>

                <Button
                    variant="primary"
                    onClick={handleMask}
                    className="w-full uppercase tracking-widest"
                    icon={EyeOff}
                >
                    APPLY MASKING
                </Button>

                {output && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Masked Output</label>
                        <div className="relative group">
                            <textarea
                                value={output}
                                readOnly
                                className="glass-input w-full min-h-[150px] text-sm font-mono text-emerald-400"
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => navigator.clipboard.writeText(output)}
                            >
                                COPY
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
