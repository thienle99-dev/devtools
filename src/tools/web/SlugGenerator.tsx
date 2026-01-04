import React, { useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

const TOOL_ID = 'slug-generator';

interface SlugGeneratorProps {
    tabId?: string;
}

export const SlugGenerator: React.FC<SlugGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Default options
    const data = toolData || {
        input: '',
        output: ''
    };

    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        const slug = val
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars (except space and dash)
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
            .replace(/^-+|-+$/g, ''); // Trim dashes

        setToolData(effectiveId, { input: val, output: slug });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="Slug Generator"
            description="Generate URL-friendly slugs from strings"
            onClear={handleClear}
        >
            <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Text</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="glass-input w-full text-lg"
                        placeholder="Hello World! This is a Title."
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Slug Output</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            readOnly
                            value={output}
                            className="glass-input w-full font-mono text-lg text-primary bg-primary/5"
                        />
                        <Button variant="glass" onClick={() => navigator.clipboard.writeText(output)}>Copy</Button>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
