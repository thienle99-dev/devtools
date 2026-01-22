import React, { useEffect, useMemo } from 'react';
import { FileCode, Search, Tag } from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';
import { parseContentType } from './logic';

const TOOL_ID = TOOL_IDS.CONTENT_TYPE_PARSER;

interface ParsedContentType {
    mimeType: string;
    type: string;
    subtype: string;
    parameters: Record<string, string>;
}

export const ContentTypeParser: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: 'multipart/form-data; boundary=---------------------------974767299852498929531610575' };
    const { input } = data;

    const parsed = useMemo<ParsedContentType | null>(() => {
        if (!input) return null;
        return parseContentType(input) as ParsedContentType;
    }, [input]);

    useEffect(() => {
        if (input && parsed) {
            addToHistory(effectiveId);
        }
    }, [input, parsed, addToHistory, effectiveId]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="Content-Type Parser"
            description="Parse MIME types and Content-Type headers"
            onClear={handleClear}
        >
             <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Content-Type Header
                    </label>
                    <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                        <Search className="w-4 h-4 text-foreground-muted" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="w-full bg-transparent text-sm focus:outline-none"
                            placeholder="application/json; charset=utf-8"
                        />
                    </div>
                </div>

                {parsed ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                                <FileCode className="w-4 h-4" />
                                Base Info
                            </h3>
                            
                            <div className="grid gap-3">
                                 <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-lg intems-center p-3">
                                    <div className="text-xs text-foreground-muted mb-1">Full MIME Type</div>
                                    <div className="text-lg font-mono text-indigo-400">{parsed.mimeType}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                     <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-lg p-3">
                                        <div className="text-xs text-foreground-muted mb-1">Type</div>
                                        <div className="font-medium text-foreground">{parsed.type}</div>
                                    </div>
                                     <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-lg p-3">
                                        <div className="text-xs text-foreground-muted mb-1">Subtype</div>
                                        <div className="font-medium text-foreground">{parsed.subtype}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Parameters
                            </h3>
                            
                            {Object.keys(parsed.parameters).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(parsed.parameters).map(([key, value]) => (
                                        <div key={key} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass">
                                            <span className="text-sm font-medium text-foreground-secondary">{key}</span>
                                            <span className="text-sm font-mono text-amber-300 break-all">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-foreground-muted italic border border-border-glass rounded-lg p-4 bg-white/5 text-center">
                                    No parameters found
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center p-12 text-foreground-muted border border-dashed border-border-glass rounded-xl">
                        <FileCode className="w-12 h-12 mb-4 opacity-20" />
                        <p>Enter a valid Content-Type to parse</p>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
