import React from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { CodeEditor } from '@components/ui/CodeEditor';
import { Hash, AlignLeft, RefreshCw, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createPatch } from 'diff';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.TEXT_DIFF;

export const TextDiff: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData, clearToolData } = useToolState(effectiveId);

    // input stores the original text
    // options.right stores the text to compare with
    // output stores the diff result
    const leftText = data?.input || '';
    const rightText = data?.options?.right || '';
    const diffOutput = data?.output || '';

    const handleCompare = () => {
        if (!leftText && !rightText) return;

        try {
            const patch = createPatch('diff', leftText, rightText, 'Original', 'Modified');
            // Remove the header part of the patch to make it cleaner for display
            const cleanDiff = patch.split('\n').slice(4).join('\n');
            setToolData(effectiveId, { output: cleanDiff || 'No differences found' });
            toast.success('Comparison complete');
        } catch (error) {
            toast.error('Error generating diff');
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        toast.info('Cleared');
    };

    const handleCopy = () => {
        if (!diffOutput) return;
        navigator.clipboard.writeText(diffOutput);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[40%] min-h-[250px]">
                <div className="flex flex-col gap-2 glass-panel p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Left Text (Original)</span>
                        </div>
                    </div>
                    <CodeEditor
                        value={leftText}
                        onChange={(val) => setToolData(effectiveId, { input: val })}
                        language="text"
                        placeholder="Paste original text here..."
                        className="flex-1"
                    />
                </div>
                <div className="flex flex-col gap-2 glass-panel p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Right Text (Modified)</span>
                        </div>
                    </div>
                    <CodeEditor
                        value={rightText}
                        onChange={(val) => setToolData(effectiveId, { options: { ...data?.options, right: val } })}
                        language="text"
                        placeholder="Paste modified text here..."
                        className="flex-1"
                    />
                </div>
            </div>

            <div className="flex items-center justify-center gap-4">
                <Button variant="primary" onClick={handleCompare} icon={RefreshCw} className="px-8">
                    Compare Text
                </Button>
                <Button variant="ghost" onClick={handleClear} icon={Trash2}>
                    Clear All
                </Button>
            </div>

            <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border-glass bg-foreground/5">
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-foreground/70">Diff Result</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={handleCopy} icon={Copy} disabled={!diffOutput}>
                        Copy Result
                    </Button>
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
    );
};
