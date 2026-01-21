import React, { useState } from 'react';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { Thermometer, ThermometerSnowflake, ThermometerSun } from 'lucide-react';
import { cn } from '@utils/cn';

const TOOL_ID = 'temperature-converter';

type Unit = 'C' | 'F' | 'K';

export const TemperatureConverter: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);
    const [val, setVal] = useState(data?.input || '0');
    const [unit, setUnit] = useState<Unit>((data?.options?.unit as Unit) || 'C');

    const numVal = parseFloat(val) || 0;

    const convert = (v: number, from: Unit): Record<Unit, number> => {
        let c = 0;
        if (from === 'C') c = v;
        else if (from === 'F') c = (v - 32) * 5 / 9;
        else if (from === 'K') c = v - 273.15;

        return {
            C: c,
            F: (c * 9 / 5) + 32,
            K: c + 273.15
        };
    };

    const results = convert(numVal, unit);

    const handleValChange = (v: string) => {
        setVal(v);
        setToolData(TOOL_ID, { input: v, options: { unit } });
    };

    const handleUnitChange = (u: Unit) => {
        setUnit(u);
        setToolData(TOOL_ID, { input: val, options: { unit: u } });
    };

    const getIcon = () => {
        if (results.C <= 0) return <ThermometerSnowflake className="w-12 h-12 text-blue-400" />;
        if (results.C >= 35) return <ThermometerSun className="w-12 h-12 text-orange-400" />;
        return <Thermometer className="w-12 h-12 text-emerald-400" />;
    };

    return (
        <ToolPane
            toolId={TOOL_ID}
            title="Temperature Converter"
            description="Convert between Celsius, Fahrenheit, and Kelvin"
        >
            <div className="flex flex-col h-full gap-6">
                <div className="glass-panel rounded-2xl border border-border-glass p-8 flex flex-col items-center gap-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-6 rounded-full bg-foreground/5 border border-border-glass shadow-xl">
                            {getIcon()}
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Temperature Converter</h3>
                    </div>

                    <div className="w-full max-w-md flex flex-col gap-8">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    value={val}
                                    onChange={(e) => handleValChange(e.target.value)}
                                    placeholder="Value"
                                    className="text-2xl font-bold h-16 text-center bg-background/50 border-input"
                                    type="number"
                                />
                            </div>
                            <div className="flex gap-1 p-1 bg-background/50 rounded-xl border border-border-glass">
                                {(['C', 'F', 'K'] as Unit[]).map(u => (
                                    <button
                                        key={u}
                                        onClick={() => handleUnitChange(u)}
                                        className={cn(
                                            "w-12 h-12 rounded-lg font-bold transition-all",
                                            unit === u
                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                : 'text-foreground-muted hover:bg-foreground/10'
                                        )}
                                    >
                                        °{u}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ResultCard label="Celsius" value={results.C} unit="°C" active={unit === 'C'} />
                            <ResultCard label="Fahrenheit" value={results.F} unit="°F" active={unit === 'F'} />
                            <ResultCard label="Kelvin" value={results.K} unit="K" active={unit === 'K'} />
                        </div>
                    </div>

                    <div className="w-full max-w-2xl pt-8">
                        <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500 overflow-hidden">
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-500"
                                style={{ left: `${Math.min(Math.max((results.C + 20) / 100 * 100, 0), 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-foreground-muted uppercase tracking-widest font-bold">
                            <span>Freezing (-20°C)</span>
                            <span>Room Temp (20°C)</span>
                            <span>Boiling (100°C)</span>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

const ResultCard: React.FC<{ label: string; value: number; unit: string; active: boolean }> = ({ label, value, unit, active }) => (
    <div className={cn(
        "p-4 rounded-xl border transition-all",
        active
            ? 'bg-indigo-500/10 border-indigo-500/50 scale-105 shadow-lg'
            : 'bg-foreground/5 border-border-glass opacity-70'
    )}>
        <span className="text-[10px] uppercase tracking-widest text-foreground-muted font-bold block mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground truncate">
                {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-foreground-muted">{unit}</span>
        </div>
    </div>
);
