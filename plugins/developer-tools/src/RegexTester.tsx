import React, { useEffect, useMemo } from 'react';
import { Input } from '@components/ui/Input';
import { TextArea } from '@components/ui/TextArea';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolStore } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.REGEX_TESTER;

export const RegexTester: React.FC<BaseToolProps> = ({ tabId }) => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    const effectiveId = tabId || TOOL_ID;

    // Default valid options
    const data = tools[effectiveId] || {
        input: '', // Test String
        options: {
            regex: '', // The regex pattern
            flags: 'g', // g, i, m, s, u, y
        },
        meta: {
            matches: [] // List of matches
        }
    };

    const { input, options, meta } = data;
    const matches: Record<string, any>[] = meta?.matches || [];

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Calculate matches
    useEffect(() => {
        if (!options.regex) {
            if (matches.length > 0) setToolData(effectiveId, { meta: { matches: [] } });
            return;
        }

        try {
            const re = new RegExp(options.regex, options.flags);
            const found = [];

            // Limit execution time/loops
            if (!options.flags.includes('g')) {
                const m = re.exec(input);
                if (m) found.push(m);
            } else {
                let m;
                let count = 0;
                // prevent infinite loops with empty matches or problematic regex
                while ((m = re.exec(input)) !== null && count < 1000) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === re.lastIndex) {
                        re.lastIndex++;
                    }
                    found.push(m);
                    count++;
                }
            }

            // Serializing MatchArray might be tricky because it has properties like 'index', 'input', 'groups'
            // We strip it down to simpler objects for state storage if needed, or just store essential info.
            // For now, let's store simpler objects.
            const serializableMatches = found.map(m => ({
                0: m[0],
                index: m.index,
                groups: m.groups,
                length: m.length,
                ...Array.from(m).slice(1).reduce((acc, val, i) => ({ ...acc, [i + 1]: val }), {})
            }));

            setToolData(effectiveId, { meta: { matches: serializableMatches } });

        } catch (e) {
            // Invalid regex
            setToolData(effectiveId, { meta: { matches: [], error: (e as Error).message } });
        }
    }, [input, options.regex, options.flags, setToolData, effectiveId, matches.length]);


    const handleFlagChange = (flag: string) => {
        const currentFlags = options.flags;
        if (currentFlags.includes(flag)) {
            setToolData(effectiveId, { options: { ...options, flags: currentFlags.replace(flag, '') } });
        } else {
            setToolData(effectiveId, { options: { ...options, flags: currentFlags + flag } });
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        setToolData(effectiveId, { options: { regex: '', flags: 'g' }, input: '' });
    };

    // Highlight matches in text overlay?
    // This is complex to do perfectly in a textarea. simpler to list matches.
    // Or render a "Highlighter" view.

    const HighlightedText = useMemo(() => {
        if (!input || !matches.length) return <span className="font-mono whitespace-pre-wrap">{input}</span>;

        // Simple highlighting for non-overlapping global matches
        // If regex is invalid, text is plain.
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        matches.forEach((m: Record<string, any>, i: number) => {
            const index = m.index;
            const matchText = m[0];

            // Text before match
            if (index > lastIndex) {
                elements.push(<span key={`text-${i}`}>{input.substring(lastIndex, index)}</span>);
            }

            // Match
            elements.push(
                <span key={`match-${i}`} className="bg-primary/20 text-primary border-b-2 border-primary" title={`Match ${i + 1}`}>
                    {matchText}
                </span>
            );

            lastIndex = index + matchText.length;
        });

        // Text after last match
        if (lastIndex < input.length) {
            elements.push(<span key={`text-end`}>{input.substring(lastIndex)}</span>);
        }

        return <div className="font-mono whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">{elements}</div>;
    }, [input, matches]);

    return (
        <ToolPane
            title="Regex Tester"
            description="Test Regular Expressions against text"
            onClear={handleClear}
            toolId={effectiveId}
        >
            <div className="space-y-6 h-full p-4 overflow-y-auto w-full max-w-4xl mx-auto">
                {/* Regex Input & Flags */}
                <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <span className="text-foreground-muted font-mono font-bold">/</span>
                            </div>
                            <Input
                                value={options.regex}
                                onChange={(e) => setToolData(effectiveId, { options: { ...options, regex: e.target.value } })}
                                className="pl-6 pr-6 w-full font-mono text-lg"
                                placeholder="pattern"
                                fullWidth
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                <span className="text-foreground-muted font-mono font-bold">/</span>
                            </div>
                        </div>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-2">
                        {['g', 'i', 'm', 's', 'u', 'y'].map(flag => (
                            <Button
                                key={flag}
                                size="sm"
                                variant={options.flags.includes(flag) ? 'primary' : 'outline'}
                                onClick={() => handleFlagChange(flag)}
                                className="font-mono font-bold rounded-full w-8 h-8 p-0 flex items-center justify-center"
                            >
                                {flag}
                            </Button>
                        ))}
                        <span className="text-xs text-foreground-muted ml-auto pt-1 flex items-center">
                            {meta?.error ? <span className="text-red-400">{meta.error}</span> : `${matches.length} matches`}
                        </span>
                    </div>
                </div>

                {/* Test String Input */}
                <div className="space-y-2">
                    <TextArea
                        label="Test String"
                        value={input}
                        onChange={(e) => setToolData(effectiveId, { input: e.target.value })}
                        className="h-32 font-mono text-sm leading-relaxed"
                        placeholder="Paste your text here..."
                        fullWidth
                    />
                </div>

                {/* Results / Highlights */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Match Highlights</label>
                    <Card className="p-4 rounded-xl min-h-[120px] max-h-[400px] overflow-y-auto">
                        {HighlightedText}
                    </Card>
                </div>

                {/* Match Details */}
                {matches.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">Match Details</label>
                        <div className="space-y-2">
                            {matches.map((m: Record<string, any>, i: number) => (
                                <Card key={i} className="p-3 rounded-lg text-xs font-mono space-y-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-primary">Match {i + 1}</span>
                                        <span className="text-foreground-muted">Index: {m.index}</span>
                                    </div>
                                    <div className="text-foreground-secondary break-all">"{m[0]}"</div>
                                    {Object.keys(m).filter(k => !isNaN(parseInt(k)) && k !== '0').length > 0 && (
                                        <div className="pl-4 border-l border-border-glass mt-2 space-y-1">
                                            {Object.keys(m).filter(k => !isNaN(parseInt(k)) && k !== '0').map(k => (
                                                <div key={k} className="flex gap-2">
                                                    <span className="text-foreground-muted">Group {k}:</span>
                                                    <span className="text-foreground-secondary">"{m[k]}"</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </ToolPane>
    );
};
