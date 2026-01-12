import React from 'react';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { ToolPane } from '../../components/layout/ToolPane';
import { FileDiff, Braces, RefreshCw, Trash2, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createPatch } from 'diff';
import { jsonDiff } from './logic';

const TOOL_ID = 'json-diff';

export const JsonDiff: React.FC = () => {
    const { data, setToolData, clearToolData } = useToolState(TOOL_ID);

    const leftJson = data?.input || '';
    const rightJson = data?.options?.right || '';
    const diffOutput = data?.output || '';

    const handleCompare = () => {
        if (!leftJson.trim() || !rightJson.trim()) {
            toast.error('Please provide both JSON inputs');
            return;
        }

        try {
            const { leftPretty, rightPretty } = jsonDiff(leftJson, rightJson);
            const patch = createPatch('json-diff', leftPretty, rightPretty, 'Original', 'Modified');
            // Clean up patch header
            const cleanDiff = patch.split('\n').slice(4).join('\n');
            setToolData(TOOL_ID, { output: cleanDiff || 'No differences found' });
            toast.success('JSON comparison complete');
        } catch (error) {
            toast.error('Invalid JSON input for comparison');
        }
    };

    const handleClear = () => {
        clearToolData(TOOL_ID);
        toast.info('Cleared');
    };

    const handleExport = (format: 'txt' | 'md') => {
        if (!diffOutput) return;
        const blob = new Blob([diffOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `json-diff.${format}`;
        a.click();
    };

    return (
        <ToolPane
            title="JSON Diff"
            description="Compare two JSON structures and identify differences"
            onClear={handleClear}
        >
            <div className="flex flex-col gap-6 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[40%] min-h-[250px]">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                             <Braces className="w-3 h-3" /> Original JSON
                        </label>
                        <CodeEditor
                            value={leftJson}
                            onChange={(val) => setToolData(TOOL_ID, { input: val })}
                            language="json"
                            placeholder="Paste original JSON here..."
                            className="flex-1 glass-panel"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                             <Braces className="w-3 h-3" /> Modified JSON
                        </label>
                        <CodeEditor
                            value={rightJson}
                            onChange={(val) => setToolData(TOOL_ID, { options: { ...data?.options, right: val } })}
                            language="json"
                            placeholder="Paste modified JSON here..."
                            className="flex-1 glass-panel"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <Button variant="primary" onClick={handleCompare} icon={RefreshCw} className="px-8 uppercase tracking-widest">
                        COMPARE JSON
                    </Button>
                </div>

                <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-glass bg-foreground/5">
                        <div className="flex items-center gap-2">
                            <FileDiff className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Diff Result</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleExport('md')} icon={FileText} disabled={!diffOutput}>
                                EXPORT MD
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(diffOutput)} icon={Copy} disabled={!diffOutput}>
                                COPY
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor
                            value={diffOutput}
                            readOnly
                            language="diff"
                            placeholder="Difference will appear here..."
                            className="h-full"
                        />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
