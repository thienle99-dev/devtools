import React, { useEffect, useState } from 'react';
import { createPatch } from 'diff';
import { Button } from '@components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs';
import { GitCompare, FileText, ArrowRightLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'json-diff';

interface JsonDiffProps {
    tabId?: string;
}

export const JsonDiff: React.FC<JsonDiffProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { 
        data: toolData, setToolData, clearToolData, addToHistory,
        addToolHistoryEntry 
    } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [activeInputTab, setActiveInputTab] = useState('left');

    const data = toolData || {
        input: '',  // Left side
        output: '', // Diff output
        options: {
            right: '' // Right side
        }
    };

    const { input, output, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleLeftChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleRightChange = (val: string) => {
        setToolData(effectiveId, { options: { ...options, right: val } });
    };

    const handleCompare = () => {
        if (!input || !options.right) {
            toast.error("Both inputs are required for comparison");
            return;
        }

        setLoadingAction('Compare');
        setTimeout(() => {
            try {
                let leftText = input;
                let rightText = options.right;

                // Attempt to auto-format if it looks like JSON
                try {
                    if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
                        leftText = JSON.stringify(JSON.parse(input), null, 2);
                    }
                } catch (e) { }

                try {
                    if (options.right.trim().startsWith('{') || options.right.trim().startsWith('[')) {
                        rightText = JSON.stringify(JSON.parse(options.right), null, 2);
                    }
                } catch (e) { }

                const patch = createPatch('diff', leftText, rightText, 'Left Source', 'Right Source');
                setToolData(effectiveId, { output: patch });
                addToolHistoryEntry(effectiveId, { input, output: patch, options });
                toast.success("Comparison complete");
            } catch (e) {
                toast.error("Error comparing inputs");
            } finally {
                setLoadingAction(null);
            }
        }, 300);
    };

    const handleSwap = () => {
        setToolData(effectiveId, { 
            input: options.right, 
            options: { ...options, right: input } 
        });
        toast.success("Inputs swapped");
    };

    const handleClearInputs = () => {
        setToolData(effectiveId, { input: '', options: { ...options, right: '' }, output: '' });
        toast.info("Inputs cleared");
    };

    return (
        <ToolPane
            title="Advanced JSON / Text Diff"
            description="Professional comparison tool with multi-input tabs"
            toolId={TOOL_ID}
            onClear={() => clearToolData(effectiveId)}
        >
            <div className="space-y-6 h-full flex flex-col max-w-6xl mx-auto w-full">
                {/* Multi-Input Tabs Section */}
                <div className="bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                    <Tabs value={activeInputTab} onValueChange={setActiveInputTab}>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-4">
                            <TabsList className="bg-black/20 p-1 rounded-xl">
                                <TabsTrigger value="left" className="gap-2 px-6">
                                    <FileText size={14} className={activeInputTab === 'left' ? "text-indigo-400" : ""} />
                                    <span>Source Left</span>
                                </TabsTrigger>
                                <TabsTrigger value="right" className="gap-2 px-6">
                                    <FileText size={14} className={activeInputTab === 'right' ? "text-emerald-400" : ""} />
                                    <span>Source Right</span>
                                </TabsTrigger>
                                <TabsTrigger value="split" className="gap-2 px-6">
                                    <GitCompare size={14} className={activeInputTab === 'split' ? "text-amber-400" : ""} />
                                    <span>Side by Side</span>
                                </TabsTrigger>
                            </TabsList>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSwap}
                                    className="p-2.5 rounded-xl hover:bg-white/5 text-foreground-muted transition-colors border border-transparent hover:border-white/5"
                                    title="Swap Left & Right"
                                >
                                    <ArrowRightLeft size={16} />
                                </button>
                                <button
                                    onClick={handleClearInputs}
                                    className="p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400/60 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/10"
                                    title="Clear Inputs"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <Button 
                                    className="ml-2 gap-2 shadow-lg shadow-indigo-500/20" 
                                    onClick={handleCompare} 
                                    loading={loadingAction === 'Compare'}
                                >
                                    <GitCompare size={16} />
                                    Run Comparison
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="left" className="h-[400px]">
                            <CodeEditor
                                className="h-full rounded-xl border border-white/10"
                                language="json"
                                value={input}
                                onChange={handleLeftChange}
                                placeholder="Paste or drag first JSON/Text here..."
                            />
                        </TabsContent>

                        <TabsContent value="right" className="h-[400px]">
                            <CodeEditor
                                className="h-full rounded-xl border border-white/10"
                                language="json"
                                value={options.right}
                                onChange={handleRightChange}
                                placeholder="Paste or drag second JSON/Text here..."
                            />
                        </TabsContent>

                        <TabsContent value="split" className="h-[400px]">
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/30 pl-2">Left Base</span>
                                    <CodeEditor
                                        className="flex-1 rounded-xl border border-white/10"
                                        language="json"
                                        value={input}
                                        onChange={handleLeftChange}
                                        placeholder="Left side..."
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/30 pl-2">Right Base</span>
                                    <CodeEditor
                                        className="flex-1 rounded-xl border border-white/10"
                                        language="json"
                                        value={options.right}
                                        onChange={handleRightChange}
                                        placeholder="Right side..."
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Diff Output */}
                <div className="flex-1 flex flex-col space-y-3 mt-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">Difference Analysis</label>
                        {output && (
                            <span className="text-[9px] font-mono opacity-30">Unified Patch Format</span>
                        )}
                    </div>
                    <div className="flex-1 min-h-[300px] shadow-2xl">
                        <CodeEditor
                            className="h-full rounded-3xl border-white/5 overflow-hidden"
                            language="diff"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
