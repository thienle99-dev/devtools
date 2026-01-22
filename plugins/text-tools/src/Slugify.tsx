import React from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'slugify';

export const Slugify: React.FC = () => {
    const { data, setToolData, clearToolData } = useToolState(TOOL_ID);
    const input = data?.input || '';
    const output = data?.output || '';

    const handleSlugify = (val: string) => {
        const slug = val.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setToolData(TOOL_ID, { input: val, output: slug });
    };

    return (
        <ToolPane
            toolId={TOOL_ID}
            title="Slugify"
            description="Convert text into URL-friendly slugs"
            onClear={() => clearToolData(TOOL_ID)}
        >
            <div className="flex flex-col h-full gap-6 p-6">
                <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Input Text</label>
                    <textarea
                        value={input}
                        onChange={(e) => handleSlugify(e.target.value)}
                        placeholder="Type something to slugify..."
                        className="flex-1 glass-input rounded-2xl p-6 text-sm focus:outline-none resize-none"
                    />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Generated Slug</label>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="xs"
                                icon={Copy}
                                onClick={() => {
                                    navigator.clipboard.writeText(output);
                                    toast.success('Slug copied');
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 bg-indigo-500/5 border border-border-glass rounded-2xl p-6 text-sm font-mono text-indigo-400 break-all overflow-auto">
                        {output || <span className="opacity-30 italic">Slug will appear here...</span>}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

export default Slugify;
