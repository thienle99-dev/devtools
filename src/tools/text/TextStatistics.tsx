import React, { useMemo } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Copy, Trash2, Hash, Clock, BarChart3, Type } from 'lucide-react';
import { toast } from 'sonner';
import { formatETA } from '@utils/format';

const TOOL_ID = 'text-statistics';

export const TextStatistics: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);

    const input = data?.input || '';

    const stats = useMemo(() => {
        const text = input || '';
        const trimmedText = text.trim();

        const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean) : [];
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const sentences = text ? (text.match(/[.!?]+(?=\s|$)/g) || []).length : 0;
        const paragraphs = text ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
        const lines = text ? text.split('\n').length : 0;

        // Times (average)
        const wordsPerMinute = 200; // Reading
        const speakingWordsPerMinute = 130; // Speaking
        const readingTimeSeconds = Math.ceil((words.length / wordsPerMinute) * 60);
        const speakingTimeSeconds = Math.ceil((words.length / speakingWordsPerMinute) * 60);

        // Keyword density
        const stopWords = new Set(['the', 'is', 'at', 'which', 'and', 'a', 'an', 'to', 'in', 'of', 'for', 'with', 'on', 'that', 'this', 'it', 'as', 'are', 'be', 'by']);
        const wordFreq: Record<string, number> = {};
        words.forEach(w => {
            const word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (word && word.length > 2 && !stopWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        const topKeywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count, density: ((count / (words.length || 1)) * 100).toFixed(1) }));

        // Characters breakdown
        const uppercase = (text.match(/[A-Z]/g) || []).length;
        const lowercase = (text.match(/[a-z]/g) || []).length;
        const digits = (text.match(/\d/g) || []).length;
        const spaces = (text.match(/\s/g) || []).length;
        const special = characters - uppercase - lowercase - digits - spaces;

        return {
            characters,
            charactersNoSpaces,
            words: words.length,
            sentences,
            paragraphs,
            lines,
            readingTime: readingTimeSeconds,
            speakingTime: speakingTimeSeconds,
            topKeywords,
            breakdown: {
                uppercase,
                lowercase,
                digits,
                spaces,
                special
            }
        };
    }, [input]);



    const handleClear = () => {
        setToolData(TOOL_ID, { input: '' });
        toast.info('Text cleared');
    };

    const handleCopy = () => {
        if (!input) return;
        navigator.clipboard.writeText(input);
        toast.success('Text copied');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex-1 flex flex-col min-h-0 gap-6">
                <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-glass bg-foreground/5">
                        <div className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium text-foreground/70">Input Text</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={handleClear} icon={Trash2}>Clear</Button>
                            <Button size="sm" variant="secondary" onClick={handleCopy} icon={Copy}>Copy</Button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setToolData(TOOL_ID, { input: e.target.value })}
                        placeholder="Paste or type your text here to analyze..."
                        className="flex-1 p-6 bg-transparent text-foreground/80 resize-none font-mono text-sm focus:outline-none custom-scrollbar"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Counts */}
                    <div className="glass-panel p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-sm font-semibold text-foreground/70">Counts</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <StatItem label="Characters" value={stats.characters} />
                            <StatItem label="Sans Spaces" value={stats.charactersNoSpaces} />
                            <StatItem label="Words" value={stats.words} />
                            <StatItem label="Sentences" value={stats.sentences} />
                            <StatItem label="Paragraphs" value={stats.paragraphs} />
                            <StatItem label="Lines" value={stats.lines} />
                        </div>
                    </div>

                    {/* Estimates */}
                    <div className="glass-panel p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-semibold text-foreground/70">Estimates</h3>
                        </div>
                        <div className="space-y-4">
                            <StatItemInline label="Reading Time" value={formatETA(stats.readingTime)} />
                            <StatItemInline label="Speaking Time" value={formatETA(stats.speakingTime)} />
                            <div className="pt-2">
                                <label className="text-xs text-foreground/40 mb-1 block uppercase tracking-wider">Breakdown</label>
                                <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-foreground/5 border border-border-glass">
                                    <div style={{ width: `${(stats.breakdown.uppercase / (stats.characters || 1)) * 100}%` }} className="bg-blue-500" title="Uppercase" />
                                    <div style={{ width: `${(stats.breakdown.lowercase / (stats.characters || 1)) * 100}%` }} className="bg-indigo-500" title="Lowercase" />
                                    <div style={{ width: `${(stats.breakdown.digits / (stats.characters || 1)) * 100}%` }} className="bg-emerald-500" title="Digits" />
                                    <div style={{ width: `${(stats.breakdown.special / (stats.characters || 1)) * 100}%` }} className="bg-rose-500" title="Special" />
                                </div>
                                <div className="flex justify-between text-[10px] text-foreground/40 mt-1">
                                    <span>ABC: {stats.breakdown.uppercase}</span>
                                    <span>abc: {stats.breakdown.lowercase}</span>
                                    <span>123: {stats.breakdown.digits}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="glass-panel p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-orange-400" />
                            <h3 className="text-sm font-semibold text-foreground/70">Top Keywords</h3>
                        </div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                            {stats.topKeywords.length > 0 ? (
                                stats.topKeywords.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <span className="text-xs text-foreground/60 truncate max-w-[120px]">{item.word}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-foreground/30">{item.count} hits</span>
                                            <span className="text-xs font-medium text-orange-400 w-10 text-right">{item.density}%</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-foreground/30 italic text-center py-4">No keywords detected</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatItem: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-foreground/40">{label}</span>
        <span className="text-lg font-bold text-foreground/90">{value}</span>
    </div>
);

const StatItemInline: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-xs text-foreground/60">{label}</span>
        <span className="text-sm font-semibold text-foreground/90">{value}</span>
    </div>
);
