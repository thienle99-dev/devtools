import React, { useState, useEffect, useCallback } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Checkbox } from '@components/ui/Checkbox';
import { cn } from '@utils/cn';
import { formatJson, minifyJson } from '@tools/json/logic';
import xmlFormatter from 'xml-formatter';
import yaml from 'js-yaml';
import { format as sqlFormatter } from 'sql-formatter';
import { Braces, FileCode, FileText, Database, Lightbulb, Copy, Trash2, ArrowRight } from 'lucide-react';
import { detectContent } from '@utils/detector';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getToolById } from '@tools/registry';

const MODES = [
    { id: 'json', name: 'JSON', icon: Braces, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'xml', name: 'XML', icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'yaml', name: 'YAML', icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' },
    { id: 'sql', name: 'SQL', icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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

    const [xmlOptions, setXmlOptions] = useState({ indentation: '  ', collapseContent: true });
    const [yamlOptions, setYamlOptions] = useState({ indent: 2, lineWidth: 80, quotingType: undefined as any });
    const [sqlOptions, setSqlOptions] = useState({ language: 'sql', tabWidth: 2, keywordCase: 'upper' });

    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ label: string, action: () => void } | null>(null);

    useEffect(() => {
        addToHistory('universal-formatter');
    }, [addToHistory]);

    const handleModeChange = (newMode: Mode) => {
        setToolData(effectiveId, { options: { ...data.options, mode: newMode } });
        setSuggestion(null);
    };

    const navigate = useNavigate();

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
        setSuggestion(null);

        if (!val.trim()) return;

        const detected = detectContent(val);
        if (detected && detected.confidence >= 0.7) {
            // 1. Same Tool, different mode (JSON <-> XML <-> YAML <-> SQL)
            if (detected.toolId === 'code-formatter' && detected.type && detected.type !== mode) {
                const targetMode = detected.type as Mode;
                setSuggestion({
                    label: `Detected ${detected.description}. Switch to ${targetMode.toUpperCase()}?`,
                    action: () => handleModeChange(targetMode)
                });
            }
            // 2. Different Tool (e.g. JWT)
            else if (detected.toolId !== 'code-formatter') {
                const targetTool = getToolById(detected.toolId);
                // Only suggest if we found the tool and it's not the current one (though toolId check covers that)
                if (targetTool) {
                    setSuggestion({
                        label: `Detected ${detected.description}. Switch to ${targetTool.name}?`,
                        action: () => navigate(targetTool.path)
                    });
                }
            }
        }
    }, [setToolData, effectiveId, mode, navigate]);

    const handleClear = () => {
        clearToolData(effectiveId);
        setSuggestion(null);
    };

    // --- Actions ---

    const handleFormat = async () => {
        setLoading(true);
        // Small delay for UI feedback
        await new Promise(r => setTimeout(r, 100));
        try {
            if (!input.trim()) return;

            let res = '';
            if (mode === 'json') res = formatJson(input);
            if (mode === 'xml') {
                res = xmlFormatter(input, {
                    indentation: xmlOptions.indentation,
                    collapseContent: xmlOptions.collapseContent,
                });
            }
            if (mode === 'yaml') {
                const parsed = yaml.load(input);
                res = yaml.dump(parsed, {
                    indent: yamlOptions.indent,
                    lineWidth: yamlOptions.lineWidth,
                    quotingType: yamlOptions.quotingType,
                });
            }
            if (mode === 'sql') {
                res = sqlFormatter(input, {
                    language: sqlOptions.language as any,
                    tabWidth: sqlOptions.tabWidth,
                    keywordCase: sqlOptions.keywordCase as any,
                });
            }
            setToolData(effectiveId, { output: res });
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    const handleMinify = async () => {
        setLoading(true);
        try {
            if (!input.trim()) return;
            let res = '';
            if (mode === 'json') res = minifyJson(input);
            if (mode === 'xml') res = xmlFormatter(input, { indentation: '', lineSeparator: '' }); // basic xml minify
            if (mode === 'yaml') {
                const parsed = yaml.load(input);
                res = yaml.dump(parsed, { indent: 0, noRefs: true, lineWidth: -1 });
            }
            if (mode === 'sql') {
                // SQL minify isn't directly supported by sql-formatter options usually, 
                // but we can try basic formatting or just leave it. 
                // Actually sql-formatter doesn't have strict 'minify', maybe just single line?
                // For now fall back to default format or skip.
                res = sqlFormatter(input, { language: sqlOptions.language as any, linesBetweenQueries: 0 });
            }
            setToolData(effectiveId, { output: res });
        } catch (e) {
            setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
        } finally { setLoading(false); }
    };

    // --- UI Components ---

    const renderOptions = () => {
        switch (mode) {
            case 'json': return null;
            case 'xml':
                return (
                    <>
                        <div className="h-4 w-px bg-border-glass mx-2" />
                        <Select label="Indent" value={xmlOptions.indentation} onChange={e => setXmlOptions({ ...xmlOptions, indentation: e.target.value })} options={[{ label: '2 Spaces', value: '  ' }, { label: '4 Spaces', value: '    ' }]} className="w-28" />
                        <Checkbox label="Collapse" checked={xmlOptions.collapseContent} onChange={e => setXmlOptions({ ...xmlOptions, collapseContent: e.target.checked })} />
                    </>
                );
            case 'yaml':
                return (
                    <>
                        <div className="h-4 w-px bg-border-glass mx-2" />
                        <Select label="Indent" value={yamlOptions.indent.toString()} onChange={e => setYamlOptions({ ...yamlOptions, indent: parseInt(e.target.value) })} options={[{ label: '2', value: '2' }, { label: '4', value: '4' }]} className="w-24" />
                        <Select label="Quotes" value={yamlOptions.quotingType || 'none'} onChange={e => setYamlOptions({ ...yamlOptions, quotingType: e.target.value === 'none' ? undefined : e.target.value })} options={[{ label: 'None', value: 'none' }, { label: "Single '", value: "'" }, { label: 'Double "', value: '"' }]} className="w-32" />
                    </>
                );
            case 'sql':
                return (
                    <>
                        <div className="h-4 w-px bg-border-glass mx-2" />
                        <Select label="Dialect" value={sqlOptions.language} onChange={e => setSqlOptions({ ...sqlOptions, language: e.target.value })} options={[{ label: 'Standard', value: 'sql' }, { label: 'MySQL', value: 'mysql' }, { label: 'Postgres', value: 'postgresql' }]} className="w-32" />
                        <Select label="Case" value={sqlOptions.keywordCase} onChange={e => setSqlOptions({ ...sqlOptions, keywordCase: e.target.value })} options={[{ label: 'UPPER', value: 'upper' }, { label: 'lower', value: 'lower' }]} className="w-28" />
                    </>
                );
        }
    };

    const currentMode = MODES.find(m => m.id === mode) || MODES[0];

    return (
        <ToolPane
            title="Code Formatter"
            description="Format, validate and convert code"
            toolId={effectiveId}
            onClear={handleClear}
            contentClassName="p-0 flex flex-col h-full bg-background/30" // Remove padding for full-height layout
        >
            <div className="flex flex-col h-full">
                {/* 1. Top Bar: Tabs & Main Actions */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border-glass bg-background/40 backdrop-blur-md">
                    <LayoutGroup>
                        <div className="flex items-center space-x-1 bg-muted/20 p-1 rounded-xl">
                            {MODES.map(m => {
                                const isActive = mode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModeChange(m.id)}
                                        className={cn(
                                            "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors z-10",
                                            isActive ? m.color : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-background shadow-sm rounded-lg border border-border-glass/50 -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <m.icon className="w-3.5 h-3.5" />
                                        <span>{m.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </LayoutGroup>

                    {/* Main Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Dynamic Options based on mode */}
                        <div className="flex items-center gap-3 mr-4">
                            {renderOptions()}
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleMinify}
                            loading={loading}
                            className="h-8 text-xs font-bold"
                        >
                            Minify
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleFormat}
                            loading={loading}
                            className="h-8 px-6 text-xs font-bold"
                        >
                            Format {currentMode?.name}
                        </Button>
                    </div>
                </div>

                {/* Suggestion Banner */}
                <AnimatePresence>
                    {suggestion && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-indigo-500/10 border-b border-indigo-500/20"
                        >
                            <div
                                onClick={suggestion.action}
                                className="px-6 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-500/5 transition-colors text-indigo-400"
                            >
                                <Lightbulb className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wide">{suggestion.label}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Main Split Editor Area */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border-glass">
                    {/* Left: Input */}
                    <div className="flex flex-col min-h-0 bg-background/20">
                        <div className="h-9 px-4 flex items-center justify-between border-b border-border-glass/50 bg-background/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full", currentMode?.bg.replace('/10', ''))} />
                                Input
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleInputChange('')} className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded text-muted-foreground transition-colors" title="Clear Input">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <CodeEditor
                                className="absolute inset-0"
                                language={mode === 'xml' ? 'html' : mode as any}
                                value={input}
                                onChange={handleInputChange}
                                placeholder={`Paste your ${mode.toUpperCase()} code here...`}
                            />
                        </div>
                    </div>

                    {/* Right: Output */}
                    <div className="flex flex-col min-h-0 bg-background/20">
                        <div className="h-9 px-4 flex items-center justify-between border-b border-border-glass/50 bg-background/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="w-3 h-3" />
                                Result
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigator.clipboard.writeText(output)}
                                    disabled={!output}
                                    className="p-1 hover:bg-emerald-500/10 hover:text-emerald-500 rounded text-muted-foreground transition-colors disabled:opacity-50"
                                    title="Copy Output"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            {output ? (
                                <CodeEditor
                                    className="absolute inset-0"
                                    language={mode === 'xml' ? 'html' : mode as any}
                                    value={output}
                                    readOnly
                                    editable={false}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 select-none">
                                    <currentMode.icon className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-xs font-medium">Output will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
