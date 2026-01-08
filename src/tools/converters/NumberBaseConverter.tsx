import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';

const TOOL_ID = 'number-base';

interface NumberBaseConverterProps {
    tabId?: string;
}

export const NumberBaseConverter: React.FC<NumberBaseConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, addToHistory } = useToolState(effectiveId);

    // We store the 'decimal' value as the source of truth, but we also need to store 'current inputs' 
    // to handle invalid intermediate states (like typing 'A' in hex).
    // Actually, simplest is to store each field text.
    const data = toolData || {
        input: '', // we won't strictly use 'input/output' struct for this multi-field, but can map 'input' to decimal
        options: {
            decimal: '',
            hex: '',
            octal: '',
            binary: ''
        }
    };

    // If first load, ensure options object exists
    const values = data.options || { decimal: '', hex: '', octal: '', binary: '' };

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const updateAll = (sourceType: 'decimal' | 'hex' | 'octal' | 'binary', value: string) => {
        let decimalValue: number | null = null;

        // Remove spaces for processing (except maybe decimal?)
        const cleanValue = value.trim();

        if (cleanValue === '') {
            setToolData(effectiveId, { options: { decimal: '', hex: '', octal: '', binary: '' } });
            return;
        }

        try {
            switch (sourceType) {
                case 'decimal':
                    if (/^-?\d+$/.test(cleanValue)) decimalValue = parseInt(cleanValue, 10);
                    break;
                case 'hex':
                    if (/^[0-9A-Fa-f]+$/.test(cleanValue)) decimalValue = parseInt(cleanValue, 16);
                    break;
                case 'octal':
                    if (/^[0-7]+$/.test(cleanValue)) decimalValue = parseInt(cleanValue, 8);
                    break;
                case 'binary':
                    if (/^[01]+$/.test(cleanValue)) decimalValue = parseInt(cleanValue, 2);
                    break;
            }
        } catch (e) {
            // ignore parse errors
        }

        const newValues = { ...values, [sourceType]: value };

        if (decimalValue !== null && !isNaN(decimalValue)) {
            if (sourceType !== 'decimal') newValues.decimal = decimalValue.toString(10);
            if (sourceType !== 'hex') newValues.hex = decimalValue.toString(16).toUpperCase();
            if (sourceType !== 'octal') newValues.octal = decimalValue.toString(8);
            if (sourceType !== 'binary') newValues.binary = decimalValue.toString(2);
        }

        setToolData(effectiveId, { options: newValues });
    };

    const handleClear = () => {
        setToolData(effectiveId, { options: { decimal: '', hex: '', octal: '', binary: '' } });
    };

    return (
        <ToolPane
            title="Number Base Converter"
            description="Convert numbers between Decimal, Hex, Octal and Binary"
            onClear={handleClear}
        >
            <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
                <Input
                    label="Decimal (Base 10)"
                    value={values.decimal}
                    onChange={(e) => updateAll('decimal', e.target.value)}
                    className="text-lg font-mono tracking-wide"
                    placeholder="0"
                    fullWidth
                />

                <Input
                    label="Hexadecimal (Base 16)"
                    value={values.hex}
                    onChange={(e) => updateAll('hex', e.target.value)}
                    className="text-lg font-mono tracking-wide"
                    placeholder="00"
                    fullWidth
                />

                <Input
                    label="Octal (Base 8)"
                    value={values.octal}
                    onChange={(e) => updateAll('octal', e.target.value)}
                    className="text-lg font-mono tracking-wide"
                    placeholder="0"
                    fullWidth
                />

                <Input
                    label="Binary (Base 2)"
                    value={values.binary}
                    onChange={(e) => updateAll('binary', e.target.value)}
                    className="text-lg font-mono tracking-wide"
                    placeholder="0000"
                    fullWidth
                />
            </div>
        </ToolPane>
    );
};
