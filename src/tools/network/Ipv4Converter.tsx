import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'ipv4-converter';

interface Ipv4ConverterProps {
    tabId?: string;
}

export const Ipv4Converter: React.FC<Ipv4ConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: '',
        options: {
            decimal: '',
            binary: '',
            hex: '',
            ipv4: ''
        }
    };

    const { options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Helpers
    const ipToLong = (ip: string) => {
        const parts = ip.split('.');
        if (parts.length !== 4) return null;
        let num = 0;
        for (let i = 0; i < 4; i++) {
            const p = parseInt(parts[i]);
            if (isNaN(p) || p < 0 || p > 255) return null;
            num = (num << 8) + p;
        }
        return num >>> 0; // unsigned
    };

    const longToIp = (num: number) => {
        return [
            (num >>> 24) & 0xFF,
            (num >>> 16) & 0xFF,
            (num >>> 8) & 0xFF,
            num & 0xFF
        ].join('.');
    };

    const handleInputChange = (val: string, type: 'ip' | 'decimal' | 'binary' | 'hex') => {
        let num: number | null = null;

        try {
            if (type === 'ip') {
                num = ipToLong(val);
            } else if (type === 'decimal') {
                num = parseInt(val, 10);
            } else if (type === 'binary') {
                num = parseInt(val.replace(/\s|\./g, ''), 2);
            } else if (type === 'hex') {
                num = parseInt(val.replace(/^0x/, ''), 16);
            }

            if (num !== null && !isNaN(num) && num >= 0 && num <= 4294967295) {
                // Valid 32-bit uint
                setToolData(effectiveId, {
                    input: val, // Just to update UI state derived from last changed field?
                    options: {
                        ipv4: longToIp(num),
                        decimal: num.toString(10),
                        binary: num.toString(2).padStart(32, '0').match(/.{1,8}/g)?.join(' ') || '',
                        hex: '0x' + num.toString(16).toUpperCase().padStart(8, '0'),
                    }
                });
            } else {
                // Invalid
                setToolData(effectiveId, {
                    input: val,
                    options: { ...options, [type === 'ip' ? 'ipv4' : type]: val } // update field being typed
                });
            }
        } catch (e) {
            // ignore
        }
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="IPv4 Address Converter"
            description="Convert IP addresses between Decimal, Binary, Hex, and Dot-decimal formats"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
                <Input
                    label="IP Address (Dot-decimal)"
                    type="text"
                    value={options.ipv4}
                    onChange={(e) => handleInputChange(e.target.value, 'ip')}
                    className="font-mono"
                    placeholder="192.168.1.1"
                    fullWidth
                />

                <Input
                    label="Decimal (Integer)"
                    type="text"
                    value={options.decimal}
                    onChange={(e) => handleInputChange(e.target.value, 'decimal')}
                    className="font-mono"
                    placeholder="3232235777"
                    fullWidth
                />

                <Input
                    label="Hexadecimal"
                    type="text"
                    value={options.hex}
                    onChange={(e) => handleInputChange(e.target.value, 'hex')}
                    className="font-mono"
                    placeholder="0xC0A80101"
                    fullWidth
                />

                <Input
                    label="Binary"
                    type="text"
                    value={options.binary}
                    onChange={(e) => handleInputChange(e.target.value, 'binary')}
                    className="font-mono"
                    placeholder="11000000 10101000 00000001 00000001"
                    fullWidth
                />
            </div>
        </ToolPane>
    );
};
