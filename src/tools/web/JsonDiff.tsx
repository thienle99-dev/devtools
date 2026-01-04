import React, { useEffect, useState } from 'react';
import { createPatch } from 'diff';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'json-diff';

export const JsonDiff: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = tools[TOOL_ID] || {
        input: '',  // Left side
        output: '', // Diff output
        options: {
            right: '' // Right side
        }
    };

    // input = left, options.right = right
    const { input, output, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleLeftChange = (val: string) => {
        setToolData(TOOL_ID, { input: val });
    };

    const handleRightChange = (val: string) => {
        setToolData(TOOL_ID, { options: { ...options, right: val } });
    };

    const handleCompare = () => {
        setLoadingAction('Compare');
        setTimeout(() => {
            try {
                // Try to format JSONs first if valid, else string compare
                let leftText = input;
                let rightText = options.right;

                try {
                    leftText = JSON.stringify(JSON.parse(input), null, 2);
                } catch (e) { }

                try {
                    rightText = JSON.stringify(JSON.parse(options.right), null, 2);
                } catch (e) { }

                const patch = createPatch('diff', leftText, rightText, 'Left', 'Right');
                setToolData(TOOL_ID, { output: patch });
            } catch (e) {
                setToolData(TOOL_ID, { output: 'Error comparing inputs' });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleClear = () => clearToolData(TOOL_ID);

    return (
        <ToolPane
            title="JSON / Text Diff"
            description="Compare two text or JSON blocks"
            onClear={handleClear}
            actions={<Button variant="primary" onClick={handleCompare} loading={loadingAction === 'Compare'}>Compare</Button>}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-1/2 min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Left</label>
                        <CodeEditor
                            className="flex-1"
                            language="json"
                            value={input}
                            onChange={handleLeftChange}
                            placeholder="{}"
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Right</label>
                        <CodeEditor
                            className="flex-1"
                            language="json"
                            value={options.right}
                            onChange={handleRightChange}
                            placeholder="{}"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-[200px] flex flex-col space-y-3">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Diff Output</label>
                    <CodeEditor
                        className="flex-1"
                        language="diff"
                        value={output}
                        readOnly={true}
                        editable={false}
                    />
                </div>
            </div>
        </ToolPane>
    );
};
