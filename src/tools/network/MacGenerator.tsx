import React, { useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'mac-generator';

export const MacGenerator: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    const data = tools[TOOL_ID] || {
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
                    if (i === 0 && prefixBytes.length === 0) {
                        // Ensure Unicast (bit 0 of byte 0 is 0) and Locally Administered (bit 1 of byte 0)
                        // Actually, standard random generator usually sets locally administered bit (0x02) to 1 for "private", or 0 for "public" (if valid OUI).
                        // Let's just generate completely random bytes, but maybe force unicast (last bit of first byte = 0) to look real?
                        // "Normally" random MACs should probably set the "Locally Administered" bit (bit 1 of first byte) to 1.
                        // x2, x6, xA, xE
                        // Let's keep it truly random for now or just generic.
                    }
                    macBytes.push(hex);
                }
            }

            let mac = macBytes.join(options.separator === 'none' ? '' : options.separator);
            if (options.casing === 'upper') mac = mac.toUpperCase();
            else mac = mac.toLowerCase();

            lines.push(mac);
        }

        setToolData(TOOL_ID, { output: lines.join('\n') });
    };

    const handleClear = () => clearToolData(TOOL_ID);

    return (
        <ToolPane
            title="MAC Address Generator"
            description="Generate random MAC addresses"
            onClear={handleClear}
            actions={<Button variant="primary" onClick={generateMac}>Generate</Button>}
        >
            <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Quantity</label>
                        <input
                            type="number"
                            min="1" max="1000"
                            value={options.quantity}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, quantity: parseInt(e.target.value) } })}
                            className="glass-input w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Prefix (OUI) - Optional</label>
                        <input
                            type="text"
                            value={options.prefix}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, prefix: e.target.value } })}
                            className="glass-input w-full"
                            placeholder="00:1A:2B"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Format</label>
                        <select
                            value={options.separator}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, separator: e.target.value } })}
                            className="glass-input w-full"
                        >
                            <option value=":">Colon (MM:MM:MM:SS:SS:SS)</option>
                            <option value="-">Dash (MM-MM-MM-SS-SS-SS)</option>
                            <option value="">None (MMMMMMSSSSSS)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Casing</label>
                        <select
                            value={options.casing}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, casing: e.target.value } })}
                            className="glass-input w-full"
                        >
                            <option value="upper">Uppercase</option>
                            <option value="lower">Lowercase</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Generated MACs</label>
                    <div className="relative">
                        <textarea
                            readOnly
                            value={output}
                            className="glass-input w-full min-h-[200px] font-mono leading-relaxed"
                        />
                        {output && (
                            <Button
                                variant="glass"
                                size="sm"
                                className="absolute top-2 right-2"
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
