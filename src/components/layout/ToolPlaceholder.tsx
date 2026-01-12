import React, { useMemo } from 'react';
import { cn } from '@utils/cn';
import { CodeEditor } from '../ui/CodeEditor';

export const ToolPlaceholder: React.FC<{ name: string }> = ({ name }) => {
    const language = useMemo(() => {
        const n = name.toLowerCase();
        if (n.includes('json')) return 'json';
        if (n.includes('sql')) return 'sql';
        if (n.includes('html')) return 'html';
        if (n.includes('css')) return 'css';
        if (n.includes('xml')) return 'html'; // XML uses HTML mode often
        if (n.includes('yaml')) return 'yaml';
        if (n.includes('script') || n.includes('js')) return 'javascript';
        return 'text';
    }, [name]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                    <CodeEditor
                        className="h-96"
                        language={language}
                        placeholder="Paste your content here..."
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                    <CodeEditor
                        className="h-96"
                        language={language}
                        value={`// Output for ${name} will appear here`}
                        readOnly={true}
                        editable={false}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {['Format', 'Minify', 'Validate', 'Reset'].map((action) => (
                    <button
                        key={action}
                        className={cn(
                            "glass-button px-8 py-2.5 font-semibold text-xs uppercase tracking-widest text-foreground-secondary hover:text-foreground",
                            action === 'Format' && "glass-button-primary bg-indigo-500/80 hover:bg-indigo-500 text-white shadow-none hover:shadow-indigo-500/20"
                        )}
                    >
                        {action}
                    </button>
                ))}
            </div>
        </div>
    );
};
