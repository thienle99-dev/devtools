import React, { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Select } from '@components/ui/Select';
import { Copy, Download, RefreshCw, Type } from 'lucide-react';
import { toast } from 'sonner';
import figlet from 'figlet';

// Import standard fonts (in figlet JS they might be bundled or need to be loaded)
// For figlet in browser/electron, we might need to use the bundled ones or 
// provide a way to select them.

const TOOL_ID = 'ascii-art';

const FONTS = [
    'Standard', 'Slant', 'Shadow', 'Big', 'Block', 'Bubble', 'Digital', 'Ivrit', 'Lean', 'Mini', 'Mnemonic', 'Script', 'Small', 'Small Slant', 'Standard', 'Sub-Zero'
];

export const AsciiArtGenerator: React.FC<{ tabId?: string }> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData } = useToolState(effectiveId);
    const [output, setOutput] = useState<string>('');
    const fonts = FONTS;

    const data = toolData || {
        input: 'DevTools',
        options: {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        }
    };

    const { input, options } = data;

    useEffect(() => {
        // figlet.defaults({ fontPath: 'fonts' }); // Optional: if fonts are in a specific dir
        generateArt();
    }, [input, options]);

    const generateArt = () => {
        if (!input) {
            setOutput('');
            return;
        }

        figlet.text(
            input,
            {
                font: options.font as any,
                horizontalLayout: options.horizontalLayout as any,
                verticalLayout: options.verticalLayout as any,
                width: options.width,
                whitespaceBreak: options.whitespaceBreak,
            },
            (err, data) => {
                if (err) {
                    console.error('Figlet error:', err);
                    toast.error('Failed to generate ASCII art');
                    return;
                }
                setOutput(data || '');
            }
        );
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        toast.success('ASCII Art copied to clipboard!');
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([output], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `ascii-art-${Date.now()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success('ASCII Art downloaded as .txt');
    };

    return (
        <ToolPane
            title="ASCII Art Generator"
            description="Transform your text into stylized ASCII art using various FIGlet fonts"
            onClear={() => {
                clearToolData(effectiveId);
                setOutput('');
            }}
        >
            <div className="flex flex-col h-full space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                    {/* Input Panel */}
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                Text Input
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setToolData(effectiveId, { input: e.target.value })}
                                className="w-full h-32 bg-foreground/[0.02] border border-border-glass rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none font-mono"
                                placeholder="Type something to convert..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass-panel rounded-2xl border border-border-glass">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Font Style
                                </label>
                                <Select
                                    value={options.font}
                                    onChange={(e) => setToolData(effectiveId, { options: { ...options, font: e.target.value } })}
                                    options={fonts.map(f => ({ label: f, value: f }))}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Horizontal Layout
                                </label>
                                <Select
                                    value={options.horizontalLayout}
                                    onChange={(e) => setToolData(effectiveId, { options: { ...options, horizontalLayout: e.target.value } })}
                                    options={[
                                        { label: 'Default', value: 'default' },
                                        { label: 'Full', value: 'full' },
                                        { label: 'Fitted', value: 'fitted' },
                                        { label: 'Controlled Smushing', value: 'controlled smushing' },
                                        { label: 'Universal Smushing', value: 'universal smushing' }
                                    ]}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Line Width
                                </label>
                                <input
                                    type="number"
                                    value={options.width}
                                    onChange={(e) => setToolData(effectiveId, { options: { ...options, width: parseInt(e.target.value) || 80 } })}
                                    className="w-full bg-foreground/[0.05] border border-border-glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="flex flex-col glass-panel rounded-3xl border border-border-glass overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-glass bg-foreground/[0.02]">
                            <div className="flex items-center gap-2">
                                <Type size={14} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">ASCII Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={generateArt}
                                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground-muted"
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground-muted"
                                    title="Copy"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground-muted"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-black/20 font-mono text-[10px] leading-none whitespace-pre select-all">
                            {output || (
                                <div className="h-full flex items-center justify-center text-foreground-muted italic opacity-50">
                                    Result will appear here...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
