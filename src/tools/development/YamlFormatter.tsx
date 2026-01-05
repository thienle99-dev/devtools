import React, { useEffect, useCallback, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import yaml from 'js-yaml';

const TOOL_ID = 'yaml-format';

interface YamlFormatterProps {
    tabId?: string;
}

export const YamlFormatter: React.FC<YamlFormatterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            indent: 2,
            lineWidth: 80,
            noRefs: false,
            quotingType: "'" as "'" | '"' | undefined,
        }
    };

    const { input, output, options } = data;
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = useCallback((val: string) => {
        setToolData(effectiveId, { input: val });
    }, [setToolData, effectiveId]);

    const handleFormat = () => {
        setLoadingAction('Format');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = yaml.load(input);
                const formatted = yaml.dump(parsed, {
                    indent: options.indent,
                    lineWidth: options.lineWidth,
                    noRefs: options.noRefs,
                    quotingType: options.quotingType,
                });
                setToolData(effectiveId, { output: formatted });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid YAML\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400);
    };

    const handleMinify = () => {
        setLoadingAction('Minify');
        setTimeout(() => {
            try {
                if (!input.trim()) return;
                const parsed = yaml.load(input);
                const minified = yaml.dump(parsed, {
                    indent: 0,
                    lineWidth: -1,
                    noRefs: true,
                });
                setToolData(effectiveId, { output: minified });
            } catch (error) {
                setToolData(effectiveId, { output: `Error: Invalid YAML\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400);
    };

    const handleValidate = () => {
        setLoadingAction('Validate');
        setTimeout(() => {
            try {
                if (!input.trim()) {
                    setToolData(effectiveId, { output: 'Empty input.' });
                    return;
                }
                yaml.load(input);
                setToolData(effectiveId, { output: 'Valid YAML ✔️' });
            } catch (error) {
                setToolData(effectiveId, { output: `Invalid YAML ❌\n${(error as Error).message}` });
            } finally {
                setLoadingAction(null);
            }
        }, 400);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
        }
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.yaml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            title="YAML Formatter"
            description="Prettify, minify, and validate YAML data"
            onClear={handleClear}
            onCopy={handleCopy}
            onDownload={handleDownload}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-wrap gap-8 p-4 glass-panel rounded-xl items-center">
                    <Select
                        label="Indentation"
                        value={options.indent.toString()}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, indent: parseInt(e.target.value) || 2 } })}
                        className="w-40"
                        options={[
                            { label: '2 Spaces', value: '2' },
                            { label: '4 Spaces', value: '4' },
                            { label: 'Tab', value: '1' }
                        ]}
                    />

                    <Select
                        label="Line Width"
                        value={options.lineWidth.toString()}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, lineWidth: parseInt(e.target.value) || 80 } })}
                        className="w-40"
                        options={[
                            { label: '80 chars', value: '80' },
                            { label: '120 chars', value: '120' },
                            { label: 'Unlimited', value: '-1' }
                        ]}
                    />

                    <Select
                        label="Quoting Type"
                        value={options.quotingType || 'none'}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, quotingType: e.target.value === 'none' ? undefined : e.target.value as "'" | '"' } })}
                        className="w-40"
                        options={[
                            { label: 'None', value: 'none' },
                            { label: 'Single Quote', value: "'" },
                            { label: 'Double Quote', value: '"' }
                        ]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="yaml"
                            placeholder="Paste your YAML here..."
                            value={input}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="yaml"
                            value={output}
                            readOnly={true}
                            editable={false}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="primary"
                        onClick={handleFormat}
                        loading={loadingAction === 'Format'}
                        className="uppercase tracking-widest"
                    >
                        Format
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleMinify}
                        loading={loadingAction === 'Minify'}
                        className="uppercase tracking-widest"
                    >
                        Minify
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleValidate}
                        loading={loadingAction === 'Validate'}
                        className="uppercase tracking-widest"
                    >
                        Validate
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};

