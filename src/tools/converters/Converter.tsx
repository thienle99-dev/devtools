import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { ArrowRightLeft, Code, FileSpreadsheet, FileText, Copy, Eye, EyeOff, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import Papa from 'papaparse';
import { marked } from 'marked';
import { toast } from 'sonner';

const MODES = [
    {
        id: 'json-yaml',
        name: 'JSON ↔ YAML',
        icon: ArrowRightLeft,
        category: 'data',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        description: 'Convert between JSON and YAML formats'
    },
    {
        id: 'json-xml',
        name: 'JSON ↔ XML',
        icon: Code,
        category: 'data',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        description: 'Convert between JSON and XML formats'
    },
    {
        id: 'json-csv',
        name: 'JSON ↔ CSV',
        icon: FileSpreadsheet,
        category: 'data',
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/20',
        description: 'Convert between JSON arrays and CSV'
    },
    {
        id: 'markdown-html',
        name: 'Markdown ↔ HTML',
        icon: FileText,
        category: 'markup',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        description: 'Convert Markdown to HTML and preview'
    },
] as const;

type Mode = typeof MODES[number]['id'];

interface UniversalConverterProps {
    initialMode?: Mode;
    tabId?: string;
}

export const Converter: React.FC<UniversalConverterProps> = ({ initialMode = 'json-yaml', tabId }) => {
    const effectiveId = tabId || 'universal-converter';
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { mode: initialMode } };
    const { input, output } = data;
    const mode = (data.options?.mode || initialMode) as Mode;
    const [previewMarkdown, setPreviewMarkdown] = useState(false);

    useEffect(() => {
        addToHistory('universal-converter');
    }, [addToHistory]);

    const handleModeChange = (newMode: Mode) => {
        setToolData(effectiveId, { options: { ...data.options, mode: newMode }, input: '', output: '' });
        setPreviewMarkdown(false);
        const modeConfig = MODES.find(m => m.id === newMode);
        if (modeConfig) {
            toast.success(`Switched to ${modeConfig.name}`);
        }
    };

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    // --- Logic Implementations ---

    // JSON <> YAML
    const convertJsonToYaml = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const parsed = JSON.parse(input);
            const res = yaml.dump(parsed);
            setToolData(effectiveId, { output: res });
            toast.success('Converted JSON to YAML');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const convertYamlToJson = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const parsed = yaml.load(input);
            const res = JSON.stringify(parsed, null, 2);
            setToolData(effectiveId, { output: res });
            toast.success('Converted YAML to JSON');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    // JSON <> XML
    const convertJsonToXml = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const parsed = JSON.parse(input);
            const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: "  " });
            const res = builder.build(parsed);
            setToolData(effectiveId, { output: res });
            toast.success('Converted JSON to XML');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const convertXmlToJson = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const parser = new XMLParser({ ignoreAttributes: false });
            const res = JSON.stringify(parser.parse(input), null, 2);
            setToolData(effectiveId, { output: res });
            toast.success('Converted XML to JSON');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    // JSON <> CSV
    const convertJsonToCsv = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const parsed = JSON.parse(input);
            const csv = Papa.unparse(parsed, { quotes: true, header: true });
            setToolData(effectiveId, { output: csv });
            toast.success('Converted JSON to CSV');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const convertCsvToJson = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = Papa.parse(input, { header: true, dynamicTyping: true, skipEmptyLines: true });
            if (res.errors.length > 0) throw new Error(res.errors[0].message);
            setToolData(effectiveId, { output: JSON.stringify(res.data, null, 2) });
            toast.success('Converted CSV to JSON');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    // Markdown <> HTML
    const convertMarkdownToHtml = async () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const html = await marked.parse(input);
            setToolData(effectiveId, { output: html });
            toast.success('Converted Markdown to HTML');
        } catch (e) {
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const convertHtmlToMarkdown = () => {
        toast.warning('HTML to Markdown conversion is not fully supported yet');
        setToolData(effectiveId, { output: "HTML to Markdown not fully supported yet." });
    };



    // --- Render Helpers ---

    const handleCopy = (text: string, label: string) => {
        if (!text) {
            toast.error('Nothing to copy');
            return;
        }
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const renderSplitEditor = (
        leftLang: string,
        rightLang: string,
        leftAction: () => void,
        rightAction: () => void,
        leftLabel: string,
        rightLabel: string,
        allowPreview: boolean = false
    ) => {
        const modeConfig = MODES.find(m => m.id === mode);
        return (
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                {/* Left Input */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", modeConfig?.bgColor.replace('bg-', 'bg-').replace('/10', ''))} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Input</span>
                        </div>
                        <span className="text-[9px] font-mono text-foreground-muted/50">{leftLang.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <CodeEditor
                            className="h-full w-full"
                            language={leftLang as any}
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Paste content here..."
                        />
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={leftAction}
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            {leftLabel}
                        </Button>
                    </div>
                </div>

                {/* Right Output */}
                <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                    <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", modeConfig?.bgColor.replace('bg-', 'bg-').replace('/10', ''))} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Output</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {allowPreview && output && (
                                <button
                                    onClick={() => setPreviewMarkdown(!previewMarkdown)}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)]",
                                        previewMarkdown && "text-indigo-400 bg-indigo-500/10"
                                    )}
                                    title="Toggle Preview"
                                >
                                    {previewMarkdown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            <button
                                onClick={() => handleCopy(output, 'Output')}
                                disabled={!output}
                                className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Copy output"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[9px] font-mono text-foreground-muted/50">{rightLang.toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        {allowPreview && previewMarkdown ? (
                            <div
                                className="h-full w-full p-4 overflow-auto prose prose-invert max-w-none text-sm bg-[var(--color-glass-panel-light)]"
                                dangerouslySetInnerHTML={{ __html: output }}
                            />
                        ) : (
                            <CodeEditor
                                className="h-full w-full"
                                language={rightLang as any}
                                value={output}
                                readOnly
                                editable={false}
                            />
                        )}
                    </div>
                    <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={rightAction}
                            className="w-full font-semibold gap-2"
                            disabled={!input.trim() || rightLabel.includes('N/A')}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            {rightLabel}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        switch (mode) {
            case 'json-yaml':
                return renderSplitEditor('json', 'yaml', convertJsonToYaml, convertYamlToJson, 'Convert JSON → YAML', 'Convert YAML → JSON');
            case 'json-xml':
                return renderSplitEditor('json', 'xml', convertJsonToXml, convertXmlToJson, 'Convert JSON → XML', 'Convert XML → JSON');
            case 'json-csv':
                return renderSplitEditor('json', 'text', convertJsonToCsv, convertCsvToJson, 'Convert JSON → CSV', 'Convert CSV → JSON');
            case 'markdown-html':
                return renderSplitEditor('markdown', 'html', convertMarkdownToHtml, convertHtmlToMarkdown, 'Convert MD → HTML', 'HTML → MD (N/A)', true);
            default: return null;
        }
    };

    return (
        <ToolPane
            title="Universal Converter"
            description="Convert between different formats and types"
            toolId={effectiveId}
            onClear={handleClear}
            contentClassName="p-0 flex flex-col h-full"
        >
            <div className="flex flex-col h-full">
                {/* Mode Selector - Visual Cards */}
                <div className="p-3 border-b border-border-glass/30 bg-[var(--color-glass-panel-light)]">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-1.5 mb-2">
                        <Zap className="w-3 h-3" />
                        Conversion Mode
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                        {MODES.map(m => {
                            const Icon = m.icon;
                            const isActive = mode === m.id;

                            return (
                                <button
                                    key={m.id}
                                    onClick={() => handleModeChange(m.id)}
                                    className={cn(
                                        "relative p-2 rounded-lg transition-all text-left group",
                                        isActive
                                            ? `${m.bgColor} ${m.borderColor} border-2`
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/60"
                                    )}
                                    title={m.description}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn(
                                            "w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0",
                                            isActive ? m.bgColor : "bg-[var(--color-glass-button)]"
                                        )}>
                                            <Icon className={cn("w-3 h-3", isActive ? m.color : "text-foreground-muted")} />
                                        </div>
                                        <span className={cn("font-bold text-[11px] truncate flex-1", isActive ? m.color : "text-foreground")}>
                                            {m.name}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-1 right-1">
                                            <CheckCircle2 className={cn("w-2.5 h-2.5", m.color)} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 p-4 overflow-hidden">
                    <div className="h-full">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
