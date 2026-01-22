import React, { useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';

const TOOL_ID = TOOL_IDS.BASIC_AUTH_GENERATOR;

interface BasicAuthGeneratorProps {
    tabId?: string;
}

export const BasicAuthGenerator: React.FC<BasicAuthGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        options: { username: '', password: '' },
        output: ''
    };

    // We update output whenever options change
    const { options, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const updateAuth = (u: string, p: string) => {
        const token = btoa(`${u}:${p}`);
        setToolData(effectiveId, {
            options: { username: u, password: p },
            output: `Basic ${token}`
        });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="Basic Auth Generator"
            description="Generate HTTP Basic Auth headers"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Username"
                        type="text"
                        value={options.username}
                        onChange={(e) => updateAuth(e.target.value, options.password)}
                        placeholder="user"
                        fullWidth
                    />
                    <Input
                        label="Password"
                        type="text"
                        value={options.password}
                        onChange={(e) => updateAuth(options.username, e.target.value)}
                        placeholder="password"
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Authorization Header</label>
                    <div className="flex space-x-2 items-center">
                        <div className="flex-1">
                            <Input
                                type="text"
                                readOnly
                                value={output}
                                className="font-mono text-primary bg-primary/5"
                                fullWidth
                            />
                        </div>
                        <Button variant="glass" onClick={() => navigator.clipboard.writeText(output)}>Copy</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Decoded</label>
                    <div className="glass-panel p-3 font-mono text-sm text-foreground-secondary rounded-xl">
                        {options.username}:{options.password}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
