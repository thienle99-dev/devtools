import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Minus, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'code-minifier';

interface CodeMinifierProps {
    tabId?: string;
}

const TYPES = [
    { id: 'json', label: 'JSON', language: 'json' },
    { id: 'xml', label: 'XML', language: 'xml' },
    { id: 'html', label: 'HTML', language: 'html' },
    { id: 'css', label: 'CSS', language: 'css' },
    { id: 'javascript', label: 'JavaScript', language: 'javascript' },
];

export const CodeMinifier: React.FC<CodeMinifierProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { type: 'json', action: 'minify' } };
    const { input, output } = data;
    const [type, setType] = useState<string>(data.options?.type || 'json');
    const [action, setAction] = useState<'minify' | 'beautify'>(data.options?.action || 'minify');

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const minifyJSON = (json: string): string => {
        try {
            const parsed = JSON.parse(json);
            return JSON.stringify(parsed);
        } catch {
            throw new Error('Invalid JSON');
        }
    };

    const beautifyJSON = (json: string): string => {
        try {
            const parsed = JSON.parse(json);
            return JSON.stringify(parsed, null, 2);
        } catch {
            throw new Error('Invalid JSON');
        }
    };

    const minifyXML = (xml: string): string => {
        return xml.replace(/>\s+</g, '><').trim();
    };

    const beautifyXML = (xml: string): string => {
        let formatted = '';
        let indent = '';
        xml.split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) indent = indent.substring(2);
            formatted += indent + '<' + node + '>\r\n';
            if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('input')) indent += '  ';
        });
        return formatted.substring(1, formatted.length - 3);
    };

    const minifyHTML = (html: string): string => {
        return html
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .trim();
    };

    const beautifyHTML = (html: string): string => {
        // Simple HTML beautifier
        let formatted = html.replace(/>\s+</g, '><');
        formatted = formatted.replace(/></g, '>\n<');
        const lines = formatted.split('\n');
        let indent = 0;
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('</')) indent--;
            const result = '  '.repeat(Math.max(0, indent)) + trimmed;
            if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) indent++;
            return result;
        }).join('\n');
    };

    const minifyCSS = (css: string): string => {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .trim();
    };

    const beautifyCSS = (css: string): string => {
        return css
            .replace(/\s*{\s*/g, ' {\n  ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/\s*;\s*/g, ';\n  ')
            .replace(/;\s*}/g, ';\n}')
            .trim();
    };

    const minifyJS = (js: string): string => {
        // Basic JS minification - remove comments and extra whitespace
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .trim();
    };

    const beautifyJS = (js: string): string => {
        // Basic JS beautification
        let formatted = js.replace(/;/g, ';\n');
        formatted = formatted.replace(/{/g, ' {\n');
        formatted = formatted.replace(/}/g, '\n}\n');
        return formatted.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
    };

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            let result = '';

            switch (type) {
                case 'json':
                    result = action === 'minify' ? minifyJSON(input) : beautifyJSON(input);
                    break;
                case 'xml':
                    result = action === 'minify' ? minifyXML(input) : beautifyXML(input);
                    break;
                case 'html':
                    result = action === 'minify' ? minifyHTML(input) : beautifyHTML(input);
                    break;
                case 'css':
                    result = action === 'minify' ? minifyCSS(input) : beautifyCSS(input);
                    break;
                case 'javascript':
                    result = action === 'minify' ? minifyJS(input) : beautifyJS(input);
                    break;
            }

            setToolData(effectiveId, { 
                output: result,
                options: { ...data.options, type, action }
            });
            toast.success(`${action === 'minify' ? 'Minified' : 'Beautified'} ${TYPES.find(t => t.id === type)?.label}`);
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const currentType = TYPES.find(t => t.id === type);

    return (
        <ToolPane
            title="Code Minifier/Beautifier"
            description="Minify or beautify JSON, XML, HTML, CSS, and JavaScript"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Type and Action Selectors */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Type Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">Code Type</label>
                        <div className="grid grid-cols-5 gap-1.5">
                            {TYPES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setType(t.id);
                                        setToolData(effectiveId, { options: { ...data.options, type: t.id } });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-xs font-medium text-center",
                                        type === t.id
                                            ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                            : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">Action</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => {
                                    setAction('minify');
                                    setToolData(effectiveId, { options: { ...data.options, action: 'minify' } });
                                }}
                                className={cn(
                                    "p-2.5 rounded-lg border transition-all text-xs font-medium flex items-center justify-center gap-1.5",
                                    action === 'minify'
                                        ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                        : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                )}
                            >
                                <Minus className="w-3.5 h-3.5" />
                                Minify
                            </button>
                            <button
                                onClick={() => {
                                    setAction('beautify');
                                    setToolData(effectiveId, { options: { ...data.options, action: 'beautify' } });
                                }}
                                className={cn(
                                    "p-2.5 rounded-lg border transition-all text-xs font-medium flex items-center justify-center gap-1.5",
                                    action === 'beautify'
                                        ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                        : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                )}
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                                Beautify
                            </button>
                        </div>
                    </div>
                </div>

                {/* Split Editor */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                    {/* Left Input */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{currentType?.label || 'Input'}</span>
                            </div>
                            {input && (
                                <button 
                                    onClick={() => handleCopy(input, 'Input')} 
                                    className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                    title="Copy Input"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language={currentType?.language as any || 'text'}
                                value={input}
                                onChange={handleInputChange}
                                placeholder={`Enter ${currentType?.label || 'code'}...`}
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convert} 
                                className="w-full font-semibold gap-2"
                                disabled={!input.trim()}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                {action === 'minify' ? 'Minify' : 'Beautify'}
                            </Button>
                        </div>
                    </div>

                    {/* Right Output */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {output && (
                                    <button 
                                        onClick={() => handleCopy(output, 'Output')} 
                                        className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                        title="Copy Output"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <span className="text-[9px] font-mono text-foreground-muted/50">{currentType?.label.toUpperCase() || 'OUT'}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language={currentType?.language as any || 'text'}
                                value={output}
                                readOnly
                                editable={false}
                                placeholder={`${action === 'minify' ? 'Minified' : 'Beautified'} ${currentType?.label || 'code'} will appear here...`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
