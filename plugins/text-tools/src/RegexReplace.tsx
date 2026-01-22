import React from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { TextArea } from '@components/ui/TextArea';
import { Input } from '@components/ui/Input';
import { Checkbox } from '@components/ui/Checkbox';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.REGEX_REPLACE;

export const RegexReplace: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData, clearToolData } = useToolState(effectiveId);
    const input = data?.input || '';
    const output = data?.output || '';
    const options = data?.options || {
        pattern: '',
        replacement: '',
        global: true,
        insensitive: false,
        multiline: false
    };

    const handleReplace = () => {
        if (!options.pattern) {
            setToolData(effectiveId, { output: input });
            return;
        }

        try {
            let flags = '';
            if (options.global) flags += 'g';
            if (options.insensitive) flags += 'i';
            if (options.multiline) flags += 'm';

            const regex = new RegExp(options.pattern, flags);
            const res = input.replace(regex, options.replacement);
            setToolData(effectiveId, { output: res });
        } catch (e) {
            toast.error('Invalid Regex: ' + (e as Error).message);
        }
    };

    const updateOption = (key: string, val: any) => {
        setToolData(effectiveId, { options: { ...options, [key]: val } });
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Regex Replace"
            description="Replace text using regular expressions"
            onClear={() => clearToolData(effectiveId)}
        >
            <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Pattern & Replacement</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            placeholder="Regex Pattern (e.g. \d+)"
                            value={options.pattern}
                            onChange={(e) => updateOption('pattern', e.target.value)}
                            fullWidth
                        />
                        <Input
                            placeholder="Replacement Text"
                            value={options.replacement}
                            onChange={(e) => updateOption('replacement', e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Checkbox id="rg-g" label="Global (g)" checked={options.global} onChange={(e) => updateOption('global', e.target.checked)} />
                        <Checkbox id="rg-i" label="Insensitive (i)" checked={options.insensitive} onChange={(e) => updateOption('insensitive', e.target.checked)} />
                        <Checkbox id="rg-m" label="Multiline (m)" checked={options.multiline} onChange={(e) => updateOption('multiline', e.target.checked)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Source Text</label>
                        <TextArea
                            value={input}
                            onChange={(e) => setToolData(effectiveId, { input: e.target.value })}
                            className="flex-1 font-mono text-xs"
                            placeholder="Paste your source text here..."
                            fullWidth
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Result</label>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="xs" onClick={handleReplace}>Apply</Button>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    icon={Copy}
                                    onClick={() => {
                                        navigator.clipboard.writeText(output);
                                        toast.success('Result copied');
                                    }}
                                />
                            </div>
                        </div>
                        <TextArea
                            readOnly
                            value={output}
                            className="flex-1 font-mono text-xs bg-foreground/[0.02]"
                            placeholder="Result will appear here..."
                            fullWidth
                        />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

export default RegexReplace;
