import React, { useEffect, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import xmlFormatter from 'xml-formatter';

const TOOL_ID = 'xml-format';

interface XmlFormatterProps {
    tabId?: string;
}

export const XmlFormatter: React.FC<XmlFormatterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Default valid options
    const data = toolData || {
        input: '',
        output: '',
        options: {
            indentation: '  ',
            collapseContent: true,
            lineSeparator: '\n',
        }
    };

    const { input, output, options } = data;
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFormat = () => {
        if (!input.trim()) return;
        setLoading(true);

        setTimeout(() => {
            try {
                const formatted = xmlFormatter(input, {
                    indentation: options.indentation,
                    collapseContent: options.collapseContent,
                    lineSeparator: options.lineSeparator,
                });
                setToolData(effectiveId, { output: formatted });

            } catch (e) {
                setToolData(effectiveId, { output: `Error: ${(e as Error).message}` });
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="XML Formatter"
            description="Prettify and format XML strings"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-wrap gap-8 p-4 glass-panel rounded-xl items-center">
                    <Select
                        label="Indentation"
                        value={options.indentation}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, indentation: e.target.value } })}
                        className="w-40"
                        options={[
                            { label: '2 Spaces', value: '  ' },
                            { label: '4 Spaces', value: '    ' },
                            { label: 'Tab', value: '\t' }
                        ]}
                    />

                    <div className="pt-5">
                        <Checkbox
                            label="Collapse Content"
                            checked={options.collapseContent}
                            onChange={(e) => setToolData(effectiveId, { options: { ...options, collapseContent: e.target.checked } })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input XML</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="html" // xml fallback
                            value={input}
                            onChange={(val) => setToolData(effectiveId, { input: val })}
                            placeholder="<root>...</root>"
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Formatted Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="html"
                            value={output}
                            readOnly
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="primary" onClick={handleFormat} loading={loading}>
                        Format XML
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
