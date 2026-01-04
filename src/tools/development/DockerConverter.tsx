import React, { useEffect, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolStore } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import composerize from 'composerize';

const TOOL_ID = 'docker-converter';

export const DockerConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    // input: docker run command
    // output: docker-compose.yml content
    const data = tools[TOOL_ID] || {
        input: '',
        output: '',
    };

    const { input, output } = data;
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleConvert = () => {
        if (!input.trim()) return;
        setLoading(true);

        // composerize is sync but let's not block UI
        setTimeout(() => {
            try {
                // composerize() returns string or throws
                const yaml = composerize(input.trim());
                setToolData(TOOL_ID, { output: yaml });
            } catch (e) {
                setToolData(TOOL_ID, { output: `Error: ${(e as Error).message}\n\nMake sure input is a valid 'docker run' command.` });
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleClear = () => clearToolData(TOOL_ID);

    return (
        <ToolPane
            title="Docker Run to Compose"
            description="Convert 'docker run' commands to docker-compose.yml"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Docker Run Command</label>
                        <textarea
                            value={input}
                            onChange={(e) => setToolData(TOOL_ID, { input: e.target.value })}
                            className="glass-input flex-1 min-h-[200px] font-mono text-xs leading-relaxed p-4 resize-none"
                            placeholder={"docker run -d -p 80:80 --name web nginx"}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">docker-compose.yml</label>
                        <textarea
                            value={output}
                            readOnly
                            className="glass-input flex-1 min-h-[200px] font-mono text-xs leading-relaxed p-4 resize-none bg-black/20"
                            placeholder="version: '3'..."
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="primary" onClick={handleConvert} loading={loading}>
                        Convert
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
