import React, { useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'url-parser';

interface UrlParserProps {
    tabId?: string;
}

export const UrlParser: React.FC<UrlParserProps> = ({ tabId }) => {
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
        try {
            if (!val) {
                clearToolData(effectiveId);
                return;
            }
            // Add protocol if missing to try and parse flexible inputs
            let urlToParse = val;
            if (!val.match(/^https?:\/\//)) {
                // urlToParse = 'http://' + val; // Optional flexibility
            }

            const url = new URL(urlToParse);
            const params: Record<string, string> = {};
            url.searchParams.forEach((value, key) => {
                params[key] = value;
            });

            setToolData(effectiveId, {
                options: {
                    protocol: url.protocol,
                    host: url.host,
                    hostname: url.hostname,
                    port: url.port,
                    pathname: url.pathname,
                    search: url.search,
                    hash: url.hash,
                    origin: url.origin,
                    params
                }
            });
        } catch (e) {
            // Invalid URL
        }
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
