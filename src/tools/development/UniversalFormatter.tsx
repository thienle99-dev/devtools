import React, { useState, useEffect, useCallback } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { cn } from '../../utils/cn';
import { formatJson, minifyJson, validateJson } from '../json/logic';
import xmlFormatter from 'xml-formatter';
import yaml from 'js-yaml';
import { format as sqlFormatter } from 'sql-formatter';
import { Braces, FileCode, FileText, Database, Lightbulb } from 'lucide-react';
import { detectContent } from '../../utils/detector';

const MODES = [
    { id: 'json', name: 'JSON', icon: Braces, color: 'text-yellow-400' },
    { id: 'xml', name: 'XML', icon: FileCode, color: 'text-orange-500' },
    { id: 'yaml', name: 'YAML', icon: FileText, color: 'text-red-400' },
    { id: 'sql', name: 'SQL', icon: Database, color: 'text-blue-500' },
] as const;

type Mode = typeof MODES[number]['id'];

interface UniversalFormatterProps {
    initialMode?: Mode;
    tabId?: string;
}

export const UniversalFormatter: React.FC<UniversalFormatterProps> = ({ initialMode = 'json', tabId }) => {
    const effectiveId = tabId || 'universal-formatter';
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: initialMode } };
    const { input, output } = data;
    const mode = (data.options?.mode || initialMode) as Mode;

    // Local state for options to avoid persisting everything to global store (simplified)
    const [xmlOptions, setXmlOptions] = useState({ indentation: '  ', collapseContent: true });

    const [yamlOptions, setYamlOptions] = useState({ indent: 2, lineWidth: 80, quotingType: undefined as any });
    const [sqlOptions, setSqlOptions] = useState({ language: 'sql', tabWidth: 2, keywordCase: 'upper' });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        addToHistory('universal-formatter');
    }, [addToHistory]);

    const handleModeChange = (newMode: Mode) => {
        setToolData(effectiveId, { options: { ...data.options, mode: newMode } });
    };

    const [suggestion, setSuggestion] = useState<{ label: string, action: () => void } | null>(null);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
        setSuggestion(null);

        if (!val.trim()) return;

        const detected = detectContent(val);
        if (detected && detected.confidence > 0.8) {
            // If detected type is different from current mode, but it's handled by this tool
            if (detected.toolId === 'code-formatter' && detected.type && detected.type !== mode) {
                const targetMode = detected.type as Mode;
                setSuggestion({
                    label: `Detected ${detected.description}. Switch to ${targetMode.toUpperCase()}?`,
                    action: () => handleModeChange(targetMode)
                });
            }
            // If detected tool is different (e.g. JWT, Base64)
            else if (detected.toolId !== 'code-formatter') {
                // We don't have easy access to navigation here without extra hooks or passing it down?
                // Actually we can use window.location or just suggest it. 
                // For now, let's stick to mode switching within the tool as that's the primary use case.
                // To support external tool switching we'd need useNavigate or access to openTab from store.
            }
        }
    }, [setToolData, effectiveId, mode]);

    const handleClear = () => {
        clearToolData(effectiveId);
        setSuggestion(null);
    };

    // --- Action Handlers ---

    const handleJsonAction = async (action: 'Format' | 'Minify' | 'Validate') => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        try {
            let res = '';
            if (action === 'Format') res = formatJson(input);
            if (action === 'Minify') res = minifyJson(input);
            if (action === 'Validate') res = validateJson(input);
            setToolData(effectiveId, { output: res });
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    const handleXmlFormat = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        try {
            if (!input.trim()) return;
            const res = xmlFormatter(input, {
                indentation: xmlOptions.indentation,
                collapseContent: xmlOptions.collapseContent,
            });
            setToolData(effectiveId, { output: res });
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    const handleYamlAction = async (action: 'Format' | 'Minify' | 'Validate') => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        try {
            if (!input.trim()) {
                if (action === 'Validate') setToolData(effectiveId, { output: 'Empty input.' });
                return;
            }
            if (action === 'Validate') {
                yaml.load(input);
                setToolData(effectiveId, { output: 'Valid YAML ✔️' });
            } else {
                const parsed = yaml.load(input);
                const res = yaml.dump(parsed, {
                    indent: action === 'Minify' ? 0 : yamlOptions.indent,
                    lineWidth: action === 'Minify' ? -1 : yamlOptions.lineWidth,
                    noRefs: action === 'Minify' ? true : false,
                    quotingType: yamlOptions.quotingType,
                });
                setToolData(effectiveId, { output: res });
            }
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    const handleSqlFormat = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        try {
            if (!input.trim()) return;
            const res = sqlFormatter(input, {
                language: sqlOptions.language as any,
                tabWidth: sqlOptions.tabWidth,
                keywordCase: sqlOptions.keywordCase as any,
            });
            setToolData(effectiveId, { output: res });
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    // --- Render Content Based on Mode ---

    const renderOptions = () => {
        switch (mode) {
            case 'json':
                return null; // No options for simplified JSON
            case 'xml':
                return (
                    <div className="flex flex-wrap gap-4 items-center">
                        <Select label="Indent" value={xmlOptions.indentation} onChange={e => setXmlOptions({ ...xmlOptions, indentation: e.target.value })} options={[{ label: '2 Spaces', value: '  ' }, { label: '4 Spaces', value: '    ' }]} className="w-32" />
                        <Checkbox label="Collapse" checked={xmlOptions.collapseContent} onChange={e => setXmlOptions({ ...xmlOptions, collapseContent: e.target.checked })} />
                    </div>
                );
            case 'yaml':
                return (
                    <div className="flex flex-wrap gap-4 items-center">
                        <Select label="Indent" value={yamlOptions.indent.toString()} onChange={e => setYamlOptions({ ...yamlOptions, indent: parseInt(e.target.value) })} options={[{ label: '2', value: '2' }, { label: '4', value: '4' }]} className="w-24" />
                        <Select label="Quotes" value={yamlOptions.quotingType || 'none'} onChange={e => setYamlOptions({ ...yamlOptions, quotingType: e.target.value === 'none' ? undefined : e.target.value })} options={[{ label: 'None', value: 'none' }, { label: "'", value: "'" }, { label: '"', value: '"' }]} className="w-32" />
                    </div>
                );
            case 'sql':
                return (
                    <div className="flex flex-wrap gap-4 items-center">
                        <Select label="Dialect" value={sqlOptions.language} onChange={e => setSqlOptions({ ...sqlOptions, language: e.target.value })} options={[{ label: 'Standard', value: 'sql' }, { label: 'MySQL', value: 'mysql' }, { label: 'Postgres', value: 'postgresql' }]} className="w-36" />
                        <Select label="Keywords" value={sqlOptions.keywordCase} onChange={e => setSqlOptions({ ...sqlOptions, keywordCase: e.target.value })} options={[{ label: 'UPPER', value: 'upper' }, { label: 'lower', value: 'lower' }]} className="w-28" />
                    </div>
                );
        }
    };

    const renderButtons = () => {
        switch (mode) {
            case 'json':
                return (
                    <>
                        <Button variant="primary" onClick={() => handleJsonAction('Format')} loading={loading}>Format</Button>
                        <Button variant="secondary" onClick={() => handleJsonAction('Minify')} loading={loading}>Minify</Button>
                        <Button variant="success" onClick={() => handleJsonAction('Validate')} loading={loading}>Validate</Button>
                    </>
                );
            case 'xml':
                return <Button variant="primary" onClick={handleXmlFormat} loading={loading}>Format XML</Button>;
            case 'yaml':
                return (
                    <>
                        <Button variant="primary" onClick={() => handleYamlAction('Format')} loading={loading}>Format</Button>
                        <Button variant="secondary" onClick={() => handleYamlAction('Minify')} loading={loading}>Minify</Button>
                        <Button variant="success" onClick={() => handleYamlAction('Validate')} loading={loading}>Validate</Button>
                    </>
                );
            case 'sql':
                return <Button variant="primary" onClick={handleSqlFormat} loading={loading}>Format SQL</Button>;
        }
    };

    return (
        <ToolPane
            title="Code Formatter"
            description="Universal code prettifier and validator"
            toolId={effectiveId}
            onClear={handleClear}
        >
            <div className="flex flex-col h-full space-y-4">
                {/* Mode Selector Tabs */}
                <div className="flex space-x-1 bg-muted/20 p-1 rounded-xl w-fit self-center">
                    {MODES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => handleModeChange(m.id)}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                mode === m.id
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <m.icon className={cn("w-4 h-4", mode === m.id && m.color)} />
                            <span>{m.name}</span>
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 glass-panel rounded-xl min-h-[60px]">
                    <div className="flex items-center gap-4">
                        {renderOptions()}
                    </div>
                </div>

                {/* Suggestion Banner */}
                {suggestion && (
                    <div
                        onClick={suggestion.action}
                        className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-indigo-500/20 transition-colors animate-in fade-in slide-in-from-top-2"
                    >
                        <Lightbulb className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold">{suggestion.label}</span>
                    </div>
                )}

                {/* Editors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="flex flex-col space-y-2 h-full min-h-0">
                        <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase pl-1">Input {mode}</label>
                        <CodeEditor
                            className="flex-1"
                            language={mode === 'xml' ? 'html' : mode as any}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={`Paste ${mode.toUpperCase()} here...`}
                        />
                    </div>
                    <div className="flex flex-col space-y-2 h-full min-h-0">
                        <label className="text-xs font-bold text-muted-foreground tracking-wider uppercase pl-1">Output</label>
                        <CodeEditor
                            className="flex-1"
                            language={mode === 'xml' ? 'html' : mode as any}
                            value={output}
                            readOnly
                            editable={false}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    {renderButtons()}
                </div>
            </div>
        </ToolPane>
    );
};
