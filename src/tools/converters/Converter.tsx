import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '@utils/cn';
import { ArrowRightLeft, Code, Binary, Lock, Type, FileSpreadsheet, FileText, Copy, Eye, EyeOff, Link, Globe, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import Papa from 'papaparse';
import { marked } from 'marked';
import he from 'he';
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
    { 
        id: 'base64', 
        name: 'Base64', 
        icon: Lock, 
        category: 'string',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        description: 'Encode and decode Base64 strings'
    },
    { 
        id: 'url-encode', 
        name: 'URL Encode', 
        icon: Link, 
        category: 'string',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        description: 'URL encode and decode strings'
    },
    { 
        id: 'html-entity', 
        name: 'HTML Entity', 
        icon: Globe, 
        category: 'string',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        description: 'Escape and unescape HTML entities'
    },
    { 
        id: 'number-base', 
        name: 'Number Base', 
        icon: Binary, 
        category: 'number',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        description: 'Convert between decimal, hex, octal, binary'
    },
    { 
        id: 'case', 
        name: 'Text Case', 
        icon: Type, 
        category: 'string',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
        description: 'Convert text to different case formats'
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
    const values = data.options?.values || {};
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

    // Base64
    const encodeBase64 = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
            setToolData(effectiveId, { output: res });
            toast.success('Encoded to Base64');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeBase64 = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            const res = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
            setToolData(effectiveId, { output: res });
            toast.success('Decoded from Base64');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    // URL Encode
    const encodeUrl = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: encodeURIComponent(input) });
            toast.success('URL encoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeUrl = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: decodeURIComponent(input) });
            toast.success('URL decoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    // HTML Entity
    const encodeHtmlEntity = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: he.encode(input) });
            toast.success('HTML entities encoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Encoding failed');
        }
    };

    const decodeHtmlEntity = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }
            setToolData(effectiveId, { output: he.decode(input) });
            toast.success('HTML entities decoded');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Decoding failed');
        }
    };

    // Case Converter
    const caseTypes = [
        { id: 'upper', label: 'UPPERCASE' },
        { id: 'lower', label: 'lowercase' },
        { id: 'title', label: 'Title Case' },
        { id: 'camel', label: 'camelCase' },
        { id: 'snake', label: 'snake_case' },
        { id: 'kebab', label: 'kebab-case' },
    ];

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
        toast.success(`Converted to ${caseTypes.find((c: { id: string; label: string }) => c.id === type)?.label || type}`);
    };

    // Number Base
    const updateNumberBase = (type: 'decimal' | 'hex' | 'octal' | 'binary', val: string) => {
        let decimalValue: number | null = null;
        val = val.trim();
        if (val === '') {
            setToolData(effectiveId, { options: { ...data.options, values: {} } });
            return;
        }

        try {
            if (type === 'decimal' && /^-?\d+$/.test(val)) decimalValue = parseInt(val, 10);
            if (type === 'hex' && /^[0-9A-Fa-f]+$/.test(val)) decimalValue = parseInt(val, 16);
            if (type === 'octal' && /^[0-7]+$/.test(val)) decimalValue = parseInt(val, 8);
            if (type === 'binary' && /^[01]+$/.test(val)) decimalValue = parseInt(val, 2);
        } catch { }

        const newValues: any = { [type]: val };
        if (decimalValue !== null && !isNaN(decimalValue)) {
            if (type !== 'decimal') newValues.decimal = decimalValue.toString(10);
            if (type !== 'hex') newValues.hex = decimalValue.toString(16).toUpperCase();
            if (type !== 'octal') newValues.octal = decimalValue.toString(8);
            if (type !== 'binary') newValues.binary = decimalValue.toString(2);
        }
        setToolData(effectiveId, { options: { ...data.options, values: { ...values, ...newValues } } });
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
            case 'base64':
                return renderSplitEditor('text', 'text', encodeBase64, decodeBase64, 'Encode to Base64', 'Decode Base64');
            case 'url-encode':
                return renderSplitEditor('text', 'text', encodeUrl, decodeUrl, 'Encode URL', 'Decode URL');
            case 'html-entity':
                return renderSplitEditor('html', 'text', encodeHtmlEntity, decodeHtmlEntity, 'Escape HTML Entities', 'Unescape HTML Entities');
            case 'case':
                const caseTypesWithExamples = [
                    { id: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
                    { id: 'lower', label: 'lowercase', example: 'hello world' },
                    { id: 'title', label: 'Title Case', example: 'Hello World' },
                    { id: 'camel', label: 'camelCase', example: 'helloWorld' },
                    { id: 'snake', label: 'snake_case', example: 'hello_world' },
                    { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
                ];
                return (
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
                            {caseTypesWithExamples.map(caseType => (
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
                );
            case 'number-base':
                const numberBases = [
                    { id: 'decimal', label: 'Decimal', base: 10, placeholder: '0', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
                    { id: 'hex', label: 'Hexadecimal', base: 16, placeholder: '00', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
                    { id: 'octal', label: 'Octal', base: 8, placeholder: '0', color: 'text-violet-400', bgColor: 'bg-violet-500/10' },
                    { id: 'binary', label: 'Binary', base: 2, placeholder: '0000', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
                ];
                return (
                    <div className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-3 overflow-auto">
                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center gap-2 mb-3">
                                <Binary className="w-3.5 h-3.5" />
                                Number Base Converter
                            </label>
                            <p className="text-xs text-foreground-muted/70 px-1">
                                Enter a value in any base to convert to all other bases
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {numberBases.map(base => (
                                <div key={base.id} className={cn("p-3 rounded-lg border", base.bgColor, "border-border-glass/30")}>
                                    <label className={cn("text-xs font-semibold mb-2 block", base.color)}>
                                        {base.label} ({base.base})
                                    </label>
                                    <Input 
                                        value={values[base.id] || ''} 
                                        onChange={e => updateNumberBase(base.id as any, e.target.value)} 
                                        className="font-mono text-sm bg-[var(--color-glass-panel)] border-border-glass/30" 
                                        placeholder={base.placeholder}
                                        fullWidth
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
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
