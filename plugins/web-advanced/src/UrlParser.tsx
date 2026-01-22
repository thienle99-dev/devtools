import React, { useEffect } from 'react';
import type { BaseToolProps } from '@tools/registry/types'; // Import BaseToolProps
 // Import BaseToolProps
import { parseUrl as parseUrlLogic } from './logic'; // Import logic
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';

import { TOOL_IDS } from '@tools/registry/tool-ids';

const TOOL_ID = TOOL_IDS.URL_PARSER;

// interface UrlParserProps removed, utilize BaseToolProps
// Or explicit:  export const UrlParser: React.FC<BaseToolProps>


export const UrlParser: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '',
        options: {
            protocol: '',
            host: '',
            hostname: '',
            port: '',
            pathname: '',
            search: '',
            hash: '',
            origin: '',
            params: {} // Record<string, string>
        }
    };

    const { input, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
        parseUrl(val);
    };

    const parseUrl = (val: string) => {
        if (!val) {
            clearToolData(effectiveId);
            return;
        }
        
        const result = parseUrlLogic(val);
        if (result.isValid) {
            setToolData(effectiveId, {
                options: {
                    protocol: result.protocol,
                    host: result.host,
                    hostname: result.hostname,
                    port: result.port,
                    pathname: result.pathname,
                    search: result.search,
                    hash: result.hash,
                    origin: result.origin,
                    params: result.params
                }
            });
        }
        // If invalid, we might want to handle it or just do nothing/clear options? 
        // Existing code did nothing on catch. logic.ts returns isValid: false.
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="URL Parser"
            description="Parse URL into constituent parts"
            onClear={handleClear}
        >
            <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">URL String</label>
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="https://example.com:8080/path?query=123#hash"
                            fullWidth
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-glass pb-2">Components</h3>
                        {[
                            { label: 'Protocol', value: options.protocol },
                            { label: 'Host', value: options.host },
                            { label: 'Hostname', value: options.hostname },
                            { label: 'Port', value: options.port },
                            { label: 'Pathname', value: options.pathname },
                            { label: 'Origin', value: options.origin },
                            { label: 'Hash', value: options.hash },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col space-y-1">
                                <label className="text-[10px] text-foreground-muted uppercase">{item.label}</label>
                                <Input 
                                    type="text" 
                                    readOnly 
                                    value={item.value || ''} 
                                    className="text-sm font-mono text-foreground-secondary py-1"
                                    fullWidth
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted border-b border-border-glass pb-2">Query Parameters</h3>
                        {Object.keys(options.params || {}).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(options.params).map(([key, value]) => (
                                    <div key={key} className="flex space-x-2 items-center">
                                        <div className="w-1/3">
                                            <Input 
                                                type="text" 
                                                readOnly 
                                                value={key} 
                                                className="!border-none !bg-transparent !shadow-none text-sm font-bold text-right" 
                                                fullWidth
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Input 
                                                type="text" 
                                                readOnly 
                                                value={value as string} 
                                                className="text-sm font-mono text-foreground-secondary" 
                                                fullWidth
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-foreground-muted text-sm italic">No query parameters found.</div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
