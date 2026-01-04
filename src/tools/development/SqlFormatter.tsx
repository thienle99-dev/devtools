import React, { useEffect, useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { useToolState } from '../../store/toolStore';
import { Button } from '../../components/ui/Button';
import { format as sqlFormatter } from 'sql-formatter';

const TOOL_ID = 'sql-format';

interface SqlFormatterProps {
    tabId?: string;
}

export const SqlFormatter: React.FC<SqlFormatterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Get current state or default
    const data = toolData || {
        input: '',
        output: '',
        options: {
            language: 'sql', // 'sql', 'mysql', 'postgresql', 'sqlite', 'mariadb', 'tsql'
            tabWidth: 2,
            useTabs: false,
            keywordCase: 'upper', // 'preserve', 'upper', 'lower'
            linesBetweenQueries: 1,
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
                const formatted = sqlFormatter(input, {
                    language: options.language,
                    tabWidth: options.tabWidth,
                    useTabs: options.useTabs,
                    keywordCase: options.keywordCase,
                    linesBetweenQueries: options.linesBetweenQueries
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

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, { options: { ...options, [key]: value } });
    };

    return (
        <ToolPane
            title="SQL Formatter"
            description="Prettify and format SQL queries"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Options Toolbar */}
                <div className="flex flex-wrap gap-4 p-4 glass-panel rounded-xl items-center">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Dialect</label>
                        <select
                            value={options.language}
                            onChange={(e) => updateOption('language', e.target.value)}
                            className="glass-input h-9 text-xs w-32"
                        >
                            <option value="sql">Standard SQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="sqlite">SQLite</option>
                            <option value="mariadb">MariaDB</option>
                            <option value="tsql">T-SQL (SQL Server)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Keywords</label>
                        <select
                            value={options.keywordCase}
                            onChange={(e) => updateOption('keywordCase', e.target.value)}
                            className="glass-input h-9 text-xs w-28"
                        >
                            <option value="preserve">Preserve</option>
                            <option value="upper">UPPERCASE</option>
                            <option value="lower">lowercase</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Indent</label>
                        <select
                            value={options.tabWidth}
                            onChange={(e) => updateOption('tabWidth', parseInt(e.target.value))}
                            className="glass-input h-9 text-xs w-20"
                        >
                            <option value="2">2 Spaces</option>
                            <option value="4">4 Spaces</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Input SQL</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="sql"
                            value={input}
                            onChange={(val) => setToolData(effectiveId, { input: val })}
                            placeholder="SELECT * FROM table..."
                        />
                    </div>
                    <div className="space-y-3 flex flex-col h-full min-h-0">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Formatted Output</label>
                        <CodeEditor
                            className="flex-1 min-h-[200px]"
                            language="sql"
                            value={output}
                            readOnly
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="primary" onClick={handleFormat} loading={loading}>
                        Format SQL
                    </Button>
                </div>
            </div>
        </ToolPane>
    );
};
