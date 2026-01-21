import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '@utils/cn';
import { ArrowRightLeft, Code, Binary, Lock, Type, FileSpreadsheet, FileText, Copy, Eye, EyeOff, Link, Globe, CheckCircle2, ArrowRight, Zap, Info } from 'lucide-react';
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
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const res = yaml.dump(parsed);
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const convertYamlToJson = () => {
        try {
            if (!input.trim()) return;
            const parsed = yaml.load(input);
            const res = JSON.stringify(parsed, null, 2);
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // JSON <> XML
    const convertJsonToXml = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: "  " });
            const res = builder.build(parsed);
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const convertXmlToJson = () => {
        try {
            if (!input.trim()) return;
            const parser = new XMLParser({ ignoreAttributes: false });
            const res = JSON.stringify(parser.parse(input), null, 2);
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // JSON <> CSV
    const convertJsonToCsv = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            const csv = Papa.unparse(parsed, { quotes: true, header: true });
            setToolData(effectiveId, { output: csv });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const convertCsvToJson = () => {
        try {
            if (!input.trim()) return;
            const res = Papa.parse(input, { header: true, dynamicTyping: true, skipEmptyLines: true });
            if (res.errors.length > 0) throw new Error(res.errors[0].message);
            setToolData(effectiveId, { output: JSON.stringify(res.data, null, 2) });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // Markdown <> HTML
    const convertMarkdownToHtml = async () => {
        try {
            if (!input) return;
            const html = await marked.parse(input);
            setToolData(effectiveId, { output: html });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const convertHtmlToMarkdown = () => {
        // Placeholder for now, simplistic approach or just unsupported message
        setToolData(effectiveId, { output: "HTML to Markdown not fully supported yet." });
    };


    // Base64
    const encodeBase64 = () => {
        try {
            if (!input) return;
            const res = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const decodeBase64 = () => {
        try {
            if (!input) return;
            const res = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
            setToolData(effectiveId, { output: res });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // URL Encode
    const encodeUrl = () => {
        try {
            if (!input) return;
            setToolData(effectiveId, { output: encodeURIComponent(input) });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const decodeUrl = () => {
        try {
            if (!input) return;
            setToolData(effectiveId, { output: decodeURIComponent(input) });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // HTML Entity
    const encodeHtmlEntity = () => {
        try {
            if (!input) return;
            setToolData(effectiveId, { output: he.encode(input) });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    const decodeHtmlEntity = () => {
        try {
            if (!input) return;
            setToolData(effectiveId, { output: he.decode(input) });
        } catch (e) { setToolData(effectiveId, { output: `Error: ${(e as Error).message}` }); }
    };

    // Case Converter
    const convertCase = (type: 'upper' | 'lower' | 'camel' | 'snake' | 'kebab' | 'title') => {
        if (!input) return;
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

    const renderSplitEditor = (
        leftLang: string,
        rightLang: string,
        leftAction: () => void,
        rightAction: () => void,
        leftLabel: string,
        rightLabel: string,
        allowPreview: boolean = false
    ) => (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border-glass">
            {/* Left Input */}
            <div className="flex flex-col min-h-0 bg-background/20">
                <div className="h-9 px-4 flex items-center justify-between border-b border-border-glass/50 bg-background/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</span>
                </div>
                <div className="flex-1 relative">
                    <CodeEditor
                        className="absolute inset-0"
                        language={leftLang as any}
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Paste content here..."
                    />
                </div>
                <div className="p-2 border-t border-border-glass bg-background/40 flex justify-center">
                    <Button variant="secondary" size="sm" onClick={leftAction} className="w-full font-bold">
                        {leftLabel}
                    </Button>
                </div>
            </div>

            {/* Right Output */}
            <div className="flex flex-col min-h-0 bg-background/20">
                <div className="h-9 px-4 flex items-center justify-between border-b border-border-glass/50 bg-background/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output</span>
                    <div className="flex items-center gap-2">
                        {allowPreview && output && (
                            <button
                                onClick={() => setPreviewMarkdown(!previewMarkdown)}
                                className={cn("p-1 hover:text-indigo-500", previewMarkdown && "text-indigo-500")}
                                title="Toggle Preview"
                            >
                                {previewMarkdown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        )}
                        <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="p-1 hover:text-emerald-500 disabled:opacity-50"><Copy className="w-3 h-3" /></button>
                    </div>
                </div>
                <div className="flex-1 relative">
                    {allowPreview && previewMarkdown ? (
                        <div
                            className="absolute inset-0 p-4 overflow-auto prose prose-invert max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: output }}
                        />
                    ) : (
                        <CodeEditor
                            className="absolute inset-0"
                            language={rightLang as any}
                            value={output}
                            readOnly
                            editable={false}
                        />
                    )}
                </div>
                <div className="p-2 border-t border-border-glass bg-background/40 flex justify-center">
                    <Button variant="secondary" size="sm" onClick={rightAction} className="w-full font-bold">
                        {rightLabel}
                    </Button>
                </div>
            </div>
        </div>
    );

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
                return (
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Input Text</label>
                            <CodeEditor value={input} onChange={handleInputChange} className="h-32 rounded-lg border border-border-glass" language="text" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button size="sm" variant="glass" onClick={() => convertCase('upper')}>UPPERCASE</Button>
                            <Button size="sm" variant="glass" onClick={() => convertCase('lower')}>lowercase</Button>
                            <Button size="sm" variant="glass" onClick={() => convertCase('title')}>Title Case</Button>
                            <Button size="sm" variant="glass" onClick={() => convertCase('camel')}>camelCase</Button>
                            <Button size="sm" variant="glass" onClick={() => convertCase('snake')}>snake_case</Button>
                            <Button size="sm" variant="glass" onClick={() => convertCase('kebab')}>kebab-case</Button>
                        </div>
                        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Result</label>
                            <CodeEditor value={output} readOnly className="flex-1 rounded-lg border border-border-glass" language="text" />
                        </div>
                    </div>
                );
            case 'number-base':
                return (
                    <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6 overflow-auto">
                        <Input label="Decimal (10)" value={values.decimal || ''} onChange={e => updateNumberBase('decimal', e.target.value)} className="font-mono" placeholder="0" />
                        <Input label="Hexadecimal (16)" value={values.hex || ''} onChange={e => updateNumberBase('hex', e.target.value)} className="font-mono" placeholder="00" />
                        <Input label="Octal (8)" value={values.octal || ''} onChange={e => updateNumberBase('octal', e.target.value)} className="font-mono" placeholder="0" />
                        <Input label="Binary (2)" value={values.binary || ''} onChange={e => updateNumberBase('binary', e.target.value)} className="font-mono" placeholder="0000" />
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
            contentClassName="p-0 flex flex-col h-full bg-background/30"
        >
            <div className="flex flex-col h-full">
                {/* Top Tabs */}
                <div className="flex items-center space-x-1 bg-muted/20 p-1 mx-6 mt-3 mb-0 rounded-xl w-fit overflow-x-auto no-scrollbar max-w-[calc(100%-3rem)]">
                    {MODES.map(m => {
                        const isActive = mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => handleModeChange(m.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors z-10 whitespace-nowrap",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeConverterTab"
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

                {data.output && mode !== 'number-base' && mode !== 'case' && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2">
                        <p className="text-xs text-amber-500">
                            Note: Conversion is done locally. Large files may cause lag.
                        </p>
                    </div>
                )}

                {/* Content */}
                {renderContent()}
            </div>
        </ToolPane>
    );
};
