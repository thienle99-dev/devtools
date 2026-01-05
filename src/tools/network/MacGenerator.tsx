import React, { useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

const TOOL_ID = 'mac-generator';

interface MacGeneratorProps {
    tabId?: string;
}

export const MacGenerator: React.FC<MacGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            separator: ':', // : or - or none
            casing: 'upper', // upper or lower
            prefix: '', // Specific OUI
            quantity: 1
        }
    };

    // Default valid options
    const options = data.options || { separator: ':', casing: 'upper', prefix: '', quantity: 1 };
    const { output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const generateMac = () => {
        const lines = [];
        for (let j = 0; j < (options.quantity || 1); j++) {
            let macBytes: string[] = [];

            // Check if prefix is provided (e.g., 00:1A:2B)
            let prefixBytes: string[] = [];
            if (options.prefix) {
                // simple cleanup
                const clean = options.prefix.replace(/[^0-9A-Fa-f]/g, '');
                for (let i = 0; i < clean.length; i += 2) {
                    if (i + 1 < clean.length) prefixBytes.push(clean.substring(i, i + 2));
                }
            }

            for (let i = 0; i < 6; i++) {
                if (i < prefixBytes.length) {
                    macBytes.push(prefixBytes[i]);
                } else {
                    const byte = Math.floor(Math.random() * 256);
                    let hex = byte.toString(16).padStart(2, '0');
                    macBytes.push(hex);
                }
            }

            let mac = macBytes.join(options.separator === 'none' ? '' : options.separator);
            if (options.casing === 'upper') mac = mac.toUpperCase();
            else mac = mac.toLowerCase();

            lines.push(mac);
        }

        setToolData(effectiveId, { output: lines.join('\n') });
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="MAC Address Generator"
            description="Generate random MAC addresses"
            onClear={handleClear}
            actions={<Button variant="primary" onClick={generateMac}>Generate</Button>}
        >
            <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Quantity"
                        type="number"
                        min="1" max="1000"
                        value={options.quantity}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, quantity: parseInt(e.target.value) } })}
                        fullWidth
                    />

                    <Input
                        label="Prefix (OUI) - Optional"
                        type="text"
                        value={options.prefix}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, prefix: e.target.value } })}
                        placeholder="00:1A:2B"
                        fullWidth
                    />

                    <Select
                        label="Format"
                        value={options.separator}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, separator: e.target.value } })}
                        options={[
                            { label: 'Colon (MM:MM:MM:SS:SS:SS)', value: ':' },
                            { label: 'Dash (MM-MM-MM-SS-SS-SS)', value: '-' },
                            { label: 'None (MMMMMMSSSSSS)', value: '' }
                        ]}
                        fullWidth
                    />

                    <Select
                        label="Casing"
                        value={options.casing}
                        onChange={(e) => setToolData(effectiveId, { options: { ...options, casing: e.target.value } })}
                        options={[
                            { label: 'Uppercase', value: 'upper' },
                            { label: 'Lowercase', value: 'lower' }
                        ]}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Generated MACs</label>
                    <div className="relative group">
                        <TextArea
                            readOnly
                            value={output}
                            className="min-h-[200px] font-mono leading-relaxed"
                            fullWidth
                        />
                        {output && (
                            <Button
                                variant="glass"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => navigator.clipboard.writeText(output)}
                            >
                                Copy
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
