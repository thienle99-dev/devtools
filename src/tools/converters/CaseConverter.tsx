import React, { useEffect, useCallback, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'case-converter';

export const CaseConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = tools[TOOL_ID] || { input: '', output: '', options: {} };
    const { input, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(TOOL_ID, { input: val });
    }, [setToolData]);

    const performConversion = (converter: (s: string) => string, actionName: string) => {
        setLoadingAction(actionName);
        setTimeout(() => {
            if (input) setToolData(TOOL_ID, { output: converter(input) });
            setLoadingAction(null);
        }, 200);
    };

    const toUpperCase = () => performConversion(s => s.toUpperCase(), 'Upper');
    const toLowerCase = () => performConversion(s => s.toLowerCase(), 'Lower');

    // Simple implementations
    const toTitleCase = () => performConversion(s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), 'Title');
    const toSentenceCase = () => performConversion(s => s.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase()), 'Sentence');

    // Heuristic: Split by spaces, underscores, dashes, or camelCase boundaries
    const splitWords = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/);

    const toCamelCase = () => performConversion(s => {
        return splitWords(s)
            .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }, 'Camel');

    const toPascalCase = () => performConversion(s => {
        return splitWords(s)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }, 'Pascal');

    const toSnakeCase = () => performConversion(s => {
        return splitWords(s).map(w => w.toLowerCase()).join('_');
    }, 'Snake');

    const toKebabCase = () => performConversion(s => {
        return splitWords(s).map(w => w.toLowerCase()).join('-');
    }, 'Kebab');

    const toConstantCase = () => performConversion(s => {
        return splitWords(s).map(w => w.toUpperCase()).join('_');
    }, 'Constant');


    const handleClear = () => clearToolData(TOOL_ID);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            title="Case Converter"
            description="Convert text components between different naming conventions"
            onClear={handleClear}
            onCopy={handleCopy}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            placeholder="Type or paste text..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="text"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="glass" onClick={toUpperCase} loading={loadingAction === 'Upper'}>UPPERCASE</Button>
                    <Button variant="glass" onClick={toLowerCase} loading={loadingAction === 'Lower'}>lowercase</Button>
                    <Button variant="glass" onClick={toTitleCase} loading={loadingAction === 'Title'}>Title Case</Button>
                    <Button variant="glass" onClick={toSentenceCase} loading={loadingAction === 'Sentence'}>Sentence case</Button>
                    <Button variant="glass" onClick={toCamelCase} loading={loadingAction === 'Camel'}>camelCase</Button>
                    <Button variant="glass" onClick={toPascalCase} loading={loadingAction === 'Pascal'}>PascalCase</Button>
                    <Button variant="glass" onClick={toSnakeCase} loading={loadingAction === 'Snake'}>snake_case</Button>
                    <Button variant="glass" onClick={toKebabCase} loading={loadingAction === 'Kebab'}>kebab-case</Button>
                    <Button variant="glass" onClick={toConstantCase} loading={loadingAction === 'Constant'}>CONSTANT_CASE</Button>
                </div>
            </div>
        </ToolPane>
    );
};
