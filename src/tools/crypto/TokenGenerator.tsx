import React, { useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { Checkbox } from '@components/ui/Checkbox';
import { TextArea } from '@components/ui/TextArea';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
// import zxcvbn from 'zxcvbn'; // Lazy loaded

const TOOL_ID = 'token-generator';

const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

interface TokenGeneratorProps {
    tabId?: string;
}

export const TokenGenerator: React.FC<TokenGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Default options
    const data = toolData || {
        options: {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: false,
            excludeSimilar: false, // 1, l, I, 0, O
            quantity: 1
        },
        output: '',
        meta: { strength: null }
    };

    const { options, output, meta } = data;
    const [zxcvbn, setZxcvbn] = React.useState<any>(null);

    useEffect(() => {
        import('zxcvbn').then(m => setZxcvbn((m as any).default || m));
    }, []);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, { options: { ...options, [key]: value } });
    };

    const generate = () => {
        let chars = '';
        if (options.uppercase) chars += CHAR_SETS.uppercase;
        if (options.lowercase) chars += CHAR_SETS.lowercase;
        if (options.numbers) chars += CHAR_SETS.numbers;
        if (options.symbols) chars += CHAR_SETS.symbols;

        if (options.excludeSimilar) {
            chars = chars.replace(/[ilLI|10Oo]/g, '');
        }

        if (!chars) {
            setToolData(effectiveId, { output: 'Please select at least one character set.' });
            return;
        }

        const quantity = Math.max(1, Math.min(50, options.quantity || 1));
        const length = Math.max(4, Math.min(128, options.length || 16));

        const tokens: string[] = [];

        for (let q = 0; q < quantity; q++) {
            let token = '';
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            for (let i = 0; i < length; i++) {
                token += chars[array[i] % chars.length];
            }
            tokens.push(token);
        }

        const result = tokens.join('\n');

        // Analyze strength of the first token (if length > 0)
        let strengthResult = null;
        if (tokens.length > 0 && result.length > 0 && zxcvbn) {
            strengthResult = zxcvbn(tokens[0]);
        }

        setToolData(effectiveId, {
            output: result,
            meta: { strength: strengthResult }
        });
    };

    const handleClear = () => clearToolData(effectiveId);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    // Check if we already have output; generate if empty on first load could be nice, currently manual.

    return (
        <ToolPane
            title="Token & Password Generator"
            description="Generate secure random tokens and passwords with strength analysis"
            onClear={handleClear}
            onCopy={handleCopy}
            actions={<Button variant="primary" onClick={generate}>Generate</Button>}
        >
            <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Length: {options.length}</label>
                            <input
                                type="range"
                                min="4"
                                max="64"
                                value={options.length}
                                onChange={(e) => updateOption('length', parseInt(e.target.value))}
                                className="w-full h-2 bg-bg-glass-hover rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'uppercase', label: 'Uppercase (A-Z)' },
                                { id: 'lowercase', label: 'Lowercase (a-z)' },
                                { id: 'numbers', label: 'Numbers (0-9)' },
                                { id: 'symbols', label: 'Symbols (!@#)' },
                            ].map(opt => (
                                <div key={opt.id} className="flex items-center">
                                    <Checkbox
                                        label={opt.label}
                                        checked={options[opt.id]}
                                        onChange={(e) => updateOption(opt.id, e.target.checked)}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center pt-2">
                            <Checkbox
                                label="Exclude Similar Characters"
                                description="Excludes 1, l, I, 0, O, etc."
                                checked={options.excludeSimilar}
                                onChange={(e) => updateOption('excludeSimilar', e.target.checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex-1 relative h-full flex flex-col">
                            <TextArea
                                readOnly
                                value={output}
                                placeholder="Generated tokens will appear here..."
                                fullWidth
                                className="flex-1 font-mono text-lg resize-none min-h-[200px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Strength Meter */}
                {meta?.strength && options.quantity === 1 && (
                    <div className="border border-border-glass rounded-xl p-4 bg-bg-glass-hover">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest">Strength Analysis</h3>
                            <span className="text-xs font-mono">Score: {meta.strength.score}/4</span>
                        </div>
                        <div className="flex space-x-1 h-2 mb-2">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-colors ${i < meta.strength.score + 1
                                        ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'][meta.strength.score]
                                        : 'bg-black/10'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-foreground-secondary italic">
                            {meta.strength.feedback?.warning && <span className="text-red-400 mr-2">{meta.strength.feedback.warning}</span>}
                            {meta.strength.feedback?.suggestions && meta.strength.feedback.suggestions.join(' ')}
                            {meta.strength.crack_times_display && (
                                <span className="block mt-1 opacity-70">Crack time (offline): {meta.strength.crack_times_display.offline_slow_hashing_1e4_per_second}</span>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
