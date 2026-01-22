import React, { useState } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Percent, ArrowRight, RefreshCw } from 'lucide-react';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.PERCENTAGE_CALCULATOR;

export const PercentageCalculator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData } = useToolState(effectiveId);
    const [vals, setVals] = useState(data?.options || {
        p1: '', y1: '', // what is X% of Y
        x2: '', y2: '', // X is what % of Y
        x3: '', y3: ''  // % increase from X to Y
    });

    const results = {
        r1: vals.p1 && vals.y1 ? (parseFloat(vals.p1) / 100) * parseFloat(vals.y1) : null,
        r2: vals.x2 && vals.y2 ? (parseFloat(vals.x2) / parseFloat(vals.y2)) * 100 : null,
        r3: vals.x3 && vals.y3 ? ((parseFloat(vals.y3) - parseFloat(vals.x3)) / Math.abs(parseFloat(vals.x3))) * 100 : null
    };

    const handleChange = (key: string, val: string) => {
        const newVals = { ...vals, [key]: val };
        setVals(newVals);
        setToolData(effectiveId, { options: newVals });
    };

    const handleClear = () => {
        const cleared = { p1: '', y1: '', x2: '', y2: '', x3: '', y3: '' };
        setVals(cleared);
        setToolData(effectiveId, { options: cleared });
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-panel p-6 space-y-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-foreground/70">What is...</h3>
                    </div>
                    <Button size="sm" variant="ghost" onClick={handleClear} icon={RefreshCw}>Reset All</Button>
                </div>

                <div className="space-y-12">
                    {/* Scenario 1 */}
                    <div className="flex flex-col md:flex-row items-center gap-4 group">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-foreground/50">What is</span>
                            <div className="w-24">
                                <Input value={vals.p1} onChange={(e) => handleChange('p1', e.target.value)} placeholder="X" className="text-center" />
                            </div>
                            <span className="text-sm text-foreground/50">% of</span>
                            <div className="w-32">
                                <Input value={vals.y1} onChange={(e) => handleChange('y1', e.target.value)} placeholder="Y" className="text-center" />
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground/20 hidden md:block" />
                        <div className="flex-1 w-full md:w-auto h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-6">
                            <span className="text-2xl font-bold text-foreground dark:text-white">
                                {results.r1 !== null ? results.r1.toLocaleString(undefined, { maximumFractionDigits: 5 }) : '?'}
                            </span>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="flex flex-col md:flex-row items-center gap-4 group">
                        <div className="flex items-center gap-3">
                            <div className="w-24">
                                <Input value={vals.x2} onChange={(e) => handleChange('x2', e.target.value)} placeholder="X" className="text-center" />
                            </div>
                            <span className="text-sm text-foreground/50">is what % of</span>
                            <div className="w-32">
                                <Input value={vals.y2} onChange={(e) => handleChange('y2', e.target.value)} placeholder="Y" className="text-center" />
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground/20 hidden md:block" />
                        <div className="flex-1 w-full md:w-auto h-12 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6">
                            <span className="text-2xl font-bold text-foreground dark:text-white">
                                {results.r2 !== null ? results.r2.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%' : '?'}
                            </span>
                        </div>
                    </div>

                    {/* Scenario 3 */}
                    <div className="flex flex-col md:flex-row items-center gap-4 group">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-foreground/50">Percentage increase from</span>
                            <div className="w-24">
                                <Input value={vals.x3} onChange={(e) => handleChange('x3', e.target.value)} placeholder="X" className="text-center" />
                            </div>
                            <span className="text-sm text-foreground/50">to</span>
                            <div className="w-32">
                                <Input value={vals.y3} onChange={(e) => handleChange('y3', e.target.value)} placeholder="Y" className="text-center" />
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground/20 hidden md:block" />
                        <div className="flex-1 w-full md:w-auto h-12 flex items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 px-6">
                            <span className={`text-2xl font-bold ${results.r3 !== null && results.r3 < 0 ? 'text-rose-400' : 'text-foreground dark:text-white'}`}>
                                {results.r3 !== null ? (results.r3 > 0 ? '+' : '') + results.r3.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%' : '?'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
