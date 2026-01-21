import React, { useEffect, useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { Copy, ArrowRight, Ruler } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'unit-converter';

interface UnitConverterProps {
    tabId?: string;
}

const UNIT_TYPES = [
    { id: 'length', label: 'Length', units: [
        { id: 'meter', label: 'Meter (m)', multiplier: 1 },
        { id: 'kilometer', label: 'Kilometer (km)', multiplier: 1000 },
        { id: 'centimeter', label: 'Centimeter (cm)', multiplier: 0.01 },
        { id: 'millimeter', label: 'Millimeter (mm)', multiplier: 0.001 },
        { id: 'inch', label: 'Inch (in)', multiplier: 0.0254 },
        { id: 'foot', label: 'Foot (ft)', multiplier: 0.3048 },
        { id: 'yard', label: 'Yard (yd)', multiplier: 0.9144 },
        { id: 'mile', label: 'Mile (mi)', multiplier: 1609.34 },
    ]},
    { id: 'weight', label: 'Weight', units: [
        { id: 'kilogram', label: 'Kilogram (kg)', multiplier: 1 },
        { id: 'gram', label: 'Gram (g)', multiplier: 0.001 },
        { id: 'pound', label: 'Pound (lb)', multiplier: 0.453592 },
        { id: 'ounce', label: 'Ounce (oz)', multiplier: 0.0283495 },
        { id: 'ton', label: 'Ton (t)', multiplier: 1000 },
    ]},
    { id: 'volume', label: 'Volume', units: [
        { id: 'liter', label: 'Liter (L)', multiplier: 1 },
        { id: 'milliliter', label: 'Milliliter (mL)', multiplier: 0.001 },
        { id: 'gallon', label: 'Gallon (gal)', multiplier: 3.78541 },
        { id: 'quart', label: 'Quart (qt)', multiplier: 0.946353 },
        { id: 'pint', label: 'Pint (pt)', multiplier: 0.473176 },
        { id: 'cup', label: 'Cup (cup)', multiplier: 0.236588 },
    ]},
    { id: 'speed', label: 'Speed', units: [
        { id: 'kmh', label: 'km/h', multiplier: 1 },
        { id: 'mph', label: 'mph', multiplier: 1.60934 },
        { id: 'ms', label: 'm/s', multiplier: 3.6 },
        { id: 'knot', label: 'Knot', multiplier: 1.852 },
    ]},
];

export const UnitConverter: React.FC<UnitConverterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || { input: '', output: '', options: { unitType: 'length', fromUnit: 'meter', toUnit: 'kilometer' } };
    const { input, output } = data;
    const [unitType, setUnitType] = useState<string>(data.options?.unitType || 'length');
    const [fromUnit, setFromUnit] = useState<string>(data.options?.fromUnit || 'meter');
    const [toUnit, setToUnit] = useState<string>(data.options?.toUnit || 'kilometer');

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
    };

    const convert = () => {
        try {
            if (!input.trim()) {
                toast.error('Input is empty');
                return;
            }

            const inputValue = parseFloat(input.trim());
            if (isNaN(inputValue)) {
                throw new Error('Invalid number');
            }

            const currentType = UNIT_TYPES.find(t => t.id === unitType);
            if (!currentType) {
                throw new Error('Invalid unit type');
            }

            const fromUnitConfig = currentType.units.find(u => u.id === fromUnit);
            const toUnitConfig = currentType.units.find(u => u.id === toUnit);

            if (!fromUnitConfig || !toUnitConfig) {
                throw new Error('Invalid unit configuration');
            }

            // Convert to base unit (first unit in the list)
            const baseValue = inputValue * fromUnitConfig.multiplier;
            // Convert to target unit
            const result = baseValue / toUnitConfig.multiplier;

            setToolData(effectiveId, { 
                output: `${result.toFixed(6)} ${toUnitConfig.label.split('(')[0].trim()}`,
                options: { ...data.options, unitType, fromUnit, toUnit }
            });
            toast.success('Conversion completed');
        } catch (e) { 
            const errorMsg = `Error: ${(e as Error).message}`;
            setToolData(effectiveId, { output: errorMsg });
            toast.error('Conversion failed');
        }
    };

    const currentType = UNIT_TYPES.find(t => t.id === unitType);

    return (
        <ToolPane
            toolId={effectiveId}
            title="Unit Converter"
            description="Convert between length, weight, volume, and speed units"
            onClear={handleClear}
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Unit Type Selector */}
                <div className="grid grid-cols-4 gap-1.5">
                    {UNIT_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setUnitType(type.id);
                                const firstUnit = type.units[0].id;
                                const secondUnit = type.units[1]?.id || firstUnit;
                                setFromUnit(firstUnit);
                                setToUnit(secondUnit);
                                setToolData(effectiveId, { options: { ...data.options, unitType: type.id, fromUnit: firstUnit, toUnit: secondUnit } });
                            }}
                            className={cn(
                                "p-2.5 rounded-lg border transition-all text-xs font-medium text-center",
                                unitType === type.id
                                    ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                    : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                            )}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Unit Selectors */}
                {currentType && (
                    <div className="grid grid-cols-2 gap-3">
                        {/* From Unit */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">From Unit</label>
                            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                {currentType.units.map((unit) => (
                                    <button
                                        key={unit.id}
                                        onClick={() => {
                                            setFromUnit(unit.id);
                                            setToolData(effectiveId, { options: { ...data.options, fromUnit: unit.id } });
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                            fromUnit === unit.id
                                                ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                                : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                        )}
                                    >
                                        {unit.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* To Unit */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted pl-1">To Unit</label>
                            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                {currentType.units.map((unit) => (
                                    <button
                                        key={unit.id}
                                        onClick={() => {
                                            setToUnit(unit.id);
                                            setToolData(effectiveId, { options: { ...data.options, toUnit: unit.id } });
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg border transition-all text-xs font-medium text-left",
                                            toUnit === unit.id
                                                ? "bg-indigo-500/10 border-indigo-500/20 border-2"
                                                : "border border-border-glass/40 bg-[var(--color-glass-panel-light)] hover:bg-[var(--color-glass-button)] hover:border-border-glass/50"
                                        )}
                                    >
                                        {unit.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Split Editor */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[var(--color-glass-panel-light)] p-0.5 rounded-lg">
                    {/* Left Input */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Input</span>
                            </div>
                            {input && (
                                <button 
                                    onClick={() => handleCopy(input, 'Input')} 
                                    className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                    title="Copy Input"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Enter value..."
                            />
                        </div>
                        <div className="p-2.5 border-t border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={convert} 
                                className="w-full font-semibold gap-2"
                                disabled={!input.trim()}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Convert
                            </Button>
                        </div>
                    </div>

                    {/* Right Output */}
                    <div className="flex flex-col h-full bg-[var(--color-glass-panel)] rounded-lg overflow-hidden">
                        <div className="h-10 px-4 flex items-center justify-between border-b border-border-glass/30 bg-[var(--color-glass-panel-light)] shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {output && (
                                    <button 
                                        onClick={() => handleCopy(output, 'Output')} 
                                        className="p-1.5 rounded-md transition-all hover:bg-[var(--color-glass-button)] hover:text-emerald-400"
                                        title="Copy Output"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <Ruler className="w-3.5 h-3.5 text-foreground-muted/50" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <CodeEditor
                                className="h-full w-full"
                                language="text"
                                value={output}
                                readOnly
                                editable={false}
                                placeholder="Converted value will appear here..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
