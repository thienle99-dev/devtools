import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { cn } from '@utils/cn';
import { Type, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'text-case';

interface TextCaseConverterProps {
    tabId?: string;
}

const caseTypes = [
    { id: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
    { id: 'lower', label: 'lowercase', example: 'hello world' },
    { id: 'title', label: 'Title Case', example: 'Hello World' },
    { id: 'camel', label: 'camelCase', example: 'helloWorld' },
    { id: 'snake', label: 'snake_case', example: 'hello_world' },
    { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
];

export const TextCaseConverter: React.FC<TextCaseConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '' };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        if (!text) {
            toast.error('Nothing to copy');
            return;
        }
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const convertCase = (type: 'upper' | 'lower' | 'camel' | 'snake' | 'kebab' | 'title') => {
        if (!input.trim()) {
            toast.error('Input is empty');
            return;
        }
        let res = input;

        const splitWords = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/);

        switch (type) {
            case 'upper': res = input.toUpperCase(); break;
            case 'lower': res = input.toLowerCase(); break;
            case 'title': res = input.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
            case 'camel':
                res = splitWords(input).map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                break;
            case 'snake':
                res = splitWords(input).map(w => w.toLowerCase()).join('_');
                break;
            case 'kebab':
                res = splitWords(input).map(w => w.toLowerCase()).join('-');
                break;
        }
        setToolData(effectiveId, { output: res });
        toast.success(`Converted to ${caseTypes.find((c) => c.id === type)?.label || type}`);
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Text Case Converter"
            description="Convert text to different case formats"
            onClear={handleClear}
        >
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto max-w-4xl mx-auto w-full">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Type className="w-3.5 h-3.5" />
                        Input Text
                    </label>
                    <CodeEditor 
                        value={input} 
                        onChange={handleInputChange} 
                        className="h-32 rounded-lg border border-border-glass/30 bg-[var(--color-glass-panel)]" 
                        language="text"
                        placeholder="Enter text to convert..."
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {caseTypes.map(caseType => (
                        <button
                            key={caseType.id}
                            onClick={() => convertCase(caseType.id as any)}
                            disabled={!input.trim()}
                            className={cn(
                                "p-3 rounded-lg border transition-all text-left group",
                                "bg-[var(--color-glass-panel-light)] border-border-glass/30",
                                "hover:bg-[var(--color-glass-button)] hover:border-border-glass",
                                "disabled:opacity-40 disabled:cursor-not-allowed"
                            )}
                        >
                            <div className="font-semibold text-sm text-foreground mb-1">{caseType.label}</div>
                            <div className="text-[10px] text-foreground-muted font-mono">{caseType.example}</div>
                        </button>
                    ))}
                </div>
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" />
                            Result
                        </label>
                        {output && (
                            <button
                                onClick={() => handleCopy(output, 'Result')}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            >
                                <Copy className="w-3 h-3" />
                                Copy
                            </button>
                        )}
                    </div>
                    <CodeEditor 
                        value={output} 
                        readOnly 
                        className="flex-1 rounded-lg border border-border-glass/30 bg-[var(--color-glass-panel)]" 
                        language="text"
                        placeholder="Converted text will appear here..."
                    />
                </div>
            </div>
        </ToolPane>
    );
};
