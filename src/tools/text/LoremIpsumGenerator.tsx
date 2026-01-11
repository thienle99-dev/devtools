import React, { useEffect, useCallback } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Slider } from '@components/ui/Slider';
import { Checkbox } from '@components/ui/Checkbox';
import { Select } from '@components/ui/Select';
import { Copy, RefreshCw, AlignLeft, Hash } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'lorem-ipsum-generator';

const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'curabitur', 'vel', 'hendrerit', 'libero',
    'eleifend', 'blandit', 'nunc', 'ornare', 'odio', 'ut', 'orci', 'gravida', 'imperdiet', 'nullam', 'purus', 'lacinia',
    'a', 'pretium', 'quis', 'congue', 'praesent', 'sagittis', 'laoreet', 'auctor', 'mauris', 'non', 'velit', 'eros',
    'dictum', 'proin', 'accumsan', 'sapien', 'nec', 'massa', 'volutpat', 'venenatis', 'sed', 'eu', 'molestie', 'lacus',
    'quisque', 'porttitor', 'ligula', 'dui', 'mollis', 'tempus', 'at', 'magna', 'vestibulum', 'ante', 'ipsum', 'primis',
    'in', 'faucibus', 'orci', 'luctus', 'et', 'ultrices', 'posuere', 'cubilia', 'curae', 'etiam', 'cursus', 'aliquam',
    'quam', 'dapibus', 'nisl', 'faucibus', 'iaculis', 'tortor', 'dignissim', 'pharetra', 'donec', 'velit', 'neque',
    'sollicitudin', 'nulla', 'risus', 'id', 'feugiat', 'suspendisse', 'id', 'varius', 'enim', 'viverra', 'nunc', 'faucibus'
];

export const LoremIpsumGenerator: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);

    const options = data?.options || {
        count: 3,
        unit: 'paragraphs',
        startWithLorem: true,
        format: 'text'
    };
    const output = data?.output || '';

    const generateText = useCallback(() => {
        let result = '';
        const { count, unit, startWithLorem, format } = options;

        const getRandomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

        const generateSentence = () => {
            const length = Math.floor(Math.random() * 10) + 5;
            let sentence = Array.from({ length }, getRandomWord).join(' ');
            return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
        };

        const generateParagraph = (isFirst = false) => {
            const length = Math.floor(Math.random() * 4) + 3;
            let sentences = Array.from({ length }, generateSentence);

            if (isFirst && startWithLorem) {
                sentences[0] = 'Lorem ipsum dolor sit amet, ' + sentences[0].charAt(0).toLowerCase() + sentences[0].slice(1);
            }

            return sentences.join(' ');
        };

        if (unit === 'paragraphs') {
            const paragraphs = Array.from({ length: count }, (_, i) => generateParagraph(i === 0));
            if (format === 'html') {
                result = paragraphs.map(p => `<p>${p}</p>`).join('\n');
            } else {
                result = paragraphs.join('\n\n');
            }
        } else if (unit === 'words') {
            let words = Array.from({ length: count }, getRandomWord);
            if (startWithLorem) {
                words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', ...words.slice(5)];
            }
            result = words.join(' ');
        } else if (unit === 'sentences') {
            const sentences = Array.from({ length: count }, (_, i) => {
                let s = generateSentence();
                if (i === 0 && startWithLorem) {
                    s = 'Lorem ipsum dolor sit amet, ' + s.charAt(0).toLowerCase() + s.slice(1);
                }
                return s;
            });
            result = sentences.join(' ');
        }

        setToolData(TOOL_ID, { output: result, options });
    }, [options, setToolData]);

    useEffect(() => {
        if (!output) {
            generateText();
        }
    }, [output, generateText]);

    const handleOptionChange = (key: string, value: any) => {
        setToolData(TOOL_ID, {
            options: {
                ...options,
                [key]: value
            }
        });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-panel p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-4 h-4 text-indigo-400" />
                            <label className="text-sm font-medium text-foreground/70">Generation Options</label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-foreground/50">Unit</label>
                                <Select
                                    value={options.unit}
                                    onChange={(val) => handleOptionChange('unit', val)}
                                    options={[
                                        { value: 'paragraphs', label: 'Paragraphs' },
                                        { value: 'words', label: 'Words' },
                                        { value: 'sentences', label: 'Sentences' }
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-foreground/50">Output Format</label>
                                <Select
                                    value={options.format}
                                    onChange={(val) => handleOptionChange('format', val)}
                                    options={[
                                        { value: 'text', label: 'Plain Text' },
                                        { value: 'html', label: 'HTML' }
                                    ]}
                                />
                            </div>
                        </div>

                        <Slider
                            label={`Count: ${options.count}`}
                            min={1}
                            max={options.unit === 'words' ? 1000 : 50}
                            step={1}
                            value={options.count}
                            onChange={(val) => handleOptionChange('count', val)}
                        />

                        <Checkbox
                            label="Start with 'Lorem ipsum...'"
                            checked={options.startWithLorem}
                            onChange={(e) => handleOptionChange('startWithLorem', e.target.checked)}
                        />
                    </div>

                    <div className="flex flex-col justify-end gap-3">
                        <Button
                            onClick={generateText}
                            variant="primary"
                            icon={RefreshCw}
                            className="w-full"
                        >
                            Regenerate
                        </Button>
                        <Button
                            onClick={copyToClipboard}
                            variant="secondary"
                            icon={Copy}
                            className="w-full"
                        >
                            Copy Result
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col glass-panel overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border-glass bg-foreground/5">
                    <div className="flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-foreground/70">
                            Generated Text
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-foreground/40">
                        <span>Characters: {output.length}</span>
                        <span>Words: {output.split(/\s+/).filter(Boolean).length}</span>
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-black/5 dark:bg-black/20">
                    <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                        {output || 'Generating...'}
                    </div>
                </div>
            </div>
        </div>
    );
};
