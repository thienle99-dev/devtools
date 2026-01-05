import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, FileCode } from 'lucide-react';

const TOOL_ID = 'markdown-to-pdf';

interface MarkdownToPdfProps {
    tabId?: string;
}

export const MarkdownToPdf: React.FC<MarkdownToPdfProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            orientation: 'portrait' as 'portrait' | 'landscape',
            pageSize: 'a4' as 'a4' | 'letter',
            margin: 10,
            pdfBlob: undefined as Blob | undefined
        }
    };

    const input = data.input || '';
    const options = data.options || {};
    const orientation = (options.orientation || 'portrait') as 'portrait' | 'landscape';
    const pageSize = (options.pageSize || 'a4') as 'a4' | 'letter';
    const margin = (options.margin || 10) as number;
    const pdfBlob = options.pdfBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const convertToPdf = async () => {
        if (!input.trim()) {
            setToolData(effectiveId, { output: 'Please enter Markdown content.' });
            return;
        }

        setLoadingAction('Converting');

        try {
            // Convert Markdown to HTML
            const html = marked.parse(input) as string;

            // Create a temporary iframe to render HTML
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '1200px';
            iframe.style.height = '1600px';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
                throw new Error('Failed to create iframe');
            }

            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                        h1 { font-size: 2em; margin-top: 0.67em; margin-bottom: 0.67em; }
                        h2 { font-size: 1.5em; margin-top: 0.83em; margin-bottom: 0.83em; }
                        h3 { font-size: 1.17em; margin-top: 1em; margin-bottom: 1em; }
                        p { margin: 1em 0; }
                        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
                        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
                        ul, ol { margin: 1em 0; padding-left: 2em; }
                        blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; }
                    </style>
                </head>
                <body>${html}</body>
                </html>
            `);
            iframeDoc.close();

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: pageSize
            });

            // Get the body element from iframe
            const body = iframeDoc.body;
            if (!body) {
                throw new Error('Failed to get body element');
            }

            // Convert HTML content to PDF
            const textContent = body.innerText || body.textContent || '';
            const lines = pdf.splitTextToSize(textContent, pdf.internal.pageSize.getWidth() - margin * 2);
            
            let y = margin;
            lines.forEach((line: string) => {
                if (y > pdf.internal.pageSize.getHeight() - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(line, margin, y);
                y += 7;
            });

            const pdfBytes = pdf.output('arraybuffer');
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            document.body.removeChild(iframe);

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    pdfBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error converting Markdown to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadPdf = () => {
        if (!pdfBlob) return;

        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `markdown-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (input) {
            navigator.clipboard.writeText(input);
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, {
            input,
            options: {
                ...options,
                [key]: value,
                pdfBlob: undefined
            }
        });
    };

    return (
        <ToolPane
            title="Markdown to PDF"
            description="Convert Markdown content to PDF"
            onClear={handleClear}
            onCopy={handleCopy}
            onDownload={pdfBlob ? downloadPdf : undefined}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Markdown Input */}
                <div className="space-y-2 flex-1 min-h-0">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                        Markdown Content
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setToolData(effectiveId, { input: e.target.value, options })}
                        placeholder="Enter Markdown content here..."
                        className="glass-input w-full h-full min-h-[300px] font-mono text-sm resize-none"
                    />
                </div>

                {/* Options */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Orientation</label>
                        <select
                            value={orientation}
                            onChange={(e) => updateOption('orientation', e.target.value)}
                            className="glass-input w-full text-sm"
                        >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Page Size</label>
                        <select
                            value={pageSize}
                            onChange={(e) => updateOption('pageSize', e.target.value)}
                            className="glass-input w-full text-sm"
                        >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Margin (mm)</label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            value={margin}
                            onChange={(e) => updateOption('margin', parseInt(e.target.value) || 10)}
                            className="glass-input w-full text-sm"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="primary"
                        onClick={convertToPdf}
                        loading={loadingAction === 'Converting'}
                        disabled={!input.trim()}
                        className="uppercase tracking-widest"
                    >
                        Convert to PDF
                    </Button>
                    {pdfBlob && (
                        <Button
                            variant="secondary"
                            onClick={downloadPdf}
                            className="uppercase tracking-widest"
                        >
                            Download PDF
                        </Button>
                    )}
                </div>

                {!input && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Enter Markdown content to convert to PDF
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

