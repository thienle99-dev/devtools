import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

const TOOL_ID = 'mac-lookup';

interface MacLookupProps {
    tabId?: string;
}

export const MacLookup: React.FC<MacLookupProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loading, setLoading] = useState(false);

    const data = toolData || {
        input: '',
        output: '',
        meta: {
            result: null
        },
    };

    // Allow meta result access
    const { input, meta } = data;
    const output = meta?.result;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleLookup = async () => {
        if (!input) return;
        setLoading(true);
        // Note: Client-side only means no backend proxy, but can fetch from public API if safe.
        // macvendors.com is a common one. https://api.macvendors.com/MAC
        // It might correct CORS if we are lucky or fail.
        // Alternative: https://api.maclookup.app/v2/macs/MAC

        try {
            const clean = input.trim();
            const response = await fetch(`https://api.maclookup.app/v2/macs/${clean}`);
            if (response.ok) {
                const json = await response.json();
                // json typically { success: true, found: true, company: "Apple, Inc.", ... }
                setToolData(effectiveId, { meta: { result: json } });
            } else {
                setToolData(effectiveId, { meta: { result: { found: false, error: 'Not found or API error' } } });
            }
        } catch (e) {
            setToolData(effectiveId, { meta: { result: { found: false, error: 'Network error (CORS or Offline)' } } });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => clearToolData(effectiveId);

    const getVendorName = () => {
        if (!output) return null;
        if (output.company) return output.company;
        if (output.vendor) return output.vendor; // some APIs
        if (output.found === false) return "Not found";
        return "Unknown";
    };

    return (
        <ToolPane
            title="MAC Address Lookup"
            description="Find vendor and details from MAC address"
            onClear={handleClear}
            actions={<Button variant="primary" onClick={handleLookup} loading={loading}>Lookup</Button>}
        >
            <div className="max-w-xl mx-auto space-y-8 py-8 px-4">
                <div className="space-y-4 text-center">
                    <Input
                        label="Target MAC Address"
                        type="text"
                        value={input}
                        onChange={(e) => setToolData(effectiveId, { input: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        className="text-center text-xl font-mono"
                        placeholder="00:1A:2B:3C:4D:5E"
                        fullWidth
                    />
                    <p className="text-xs text-foreground-muted">Uses public API to resolve vendor (Requires Internet)</p>
                </div>

                {output && (
                    <div className="glass-panel p-6 space-y-4">
                        <div className="text-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-1">Vendor</h3>
                            <p className="text-2xl font-bold text-primary">{getVendorName()}</p>
                        </div>

                        {output.address && (
                            <div className="text-center">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-1">Address Block</h3>
                                <p className="font-mono text-foreground-secondary">{output.address}</p>
                            </div>
                        )}

                        {output.macPrefix && (
                            <div className="text-center">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-1">Prefix</h3>
                                <p className="font-mono text-foreground-secondary">{output.macPrefix}</p>
                            </div>
                        )}

                        {output.error && (
                            <div className="text-center text-red-400 font-bold">
                                {output.error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
