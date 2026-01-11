import React, { useState, useEffect } from 'react';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Calculator, Equal, Trash2, History, Info } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'math-evaluator';

export const MathEvaluator: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);
    const [expr, setExpr] = useState(data?.input || '');
    const [result, setResult] = useState(data?.output || '');
    const [history, setHistory] = useState<string[]>(data?.options?.history || []);

    useEffect(() => {
        if (data?.input) setExpr(data.input);
        if (data?.output) setResult(data.output);
    }, [data]);

    const evaluate = () => {
        if (!expr.trim()) return;
        try {
            // Basic sanitization: only allow math characters and common functions
            const sanitized = expr
                .replace(/math\./gi, '') // Remove existing Math. calls
                .replace(/[^-+*/%()0-9. ,]/g, (match) => {
                    // Allow specific math functions
                    const allowed = ['sin', 'cos', 'tan', 'sqrt', 'log', 'pow', 'abs', 'round', 'ceil', 'floor', 'pi', 'e'];
                    return allowed.some(fn => expr.toLowerCase().includes(fn)) ? match : '';
                });

            // Replace math functions with Math. equivalents
            const processExpr = sanitized
                .replace(/sin/gi, 'Math.sin')
                .replace(/cos/gi, 'Math.cos')
                .replace(/tan/gi, 'Math.tan')
                .replace(/sqrt/gi, 'Math.sqrt')
                .replace(/log/gi, 'Math.log')
                .replace(/pow/gi, 'Math.pow')
                .replace(/abs/gi, 'Math.abs')
                .replace(/round/gi, 'Math.round')
                .replace(/ceil/gi, 'Math.ceil')
                .replace(/floor/gi, 'Math.floor')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e/gi, 'Math.E');

            // eslint-disable-next-line no-new-func
            const evalResult = new Function(`return ${processExpr}`)();
            const formattedResult = Number.isFinite(evalResult) ? evalResult.toString() : 'Error';

            setResult(formattedResult);
            const newHistory = [expr + ' = ' + formattedResult, ...history.slice(0, 9)];
            setHistory(newHistory);

            setToolData(TOOL_ID, {
                input: expr,
                output: formattedResult,
                options: { history: newHistory }
            });
        } catch (e) {
            setResult('Error');
            toast.error('Invalid expression');
        }
    };

    const handleClear = () => {
        setExpr('');
        setResult('');
        setToolData(TOOL_ID, { input: '', output: '' });
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') evaluate();
    };

    const insert = (val: string) => {
        setExpr(expr + val);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 space-y-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white/70">Expression Evaluator</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                value={expr}
                                onChange={(e) => setExpr(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="e.g. (10 + 5) * 2 or sqrt(16) + sin(pi/2)"
                                className="pr-12 text-lg font-mono"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Button size="sm" variant="ghost" onClick={handleClear} icon={Trash2} className="h-8 w-8 p-0" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-8 glass-panel bg-black/40 border-indigo-500/20">
                            <span className="text-xs text-white/30 uppercase tracking-widest mb-2">Result</span>
                            <div className="text-4xl font-bold text-white tracking-tight">
                                {result || '0'}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {['sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'pow(', 'pi', 'abs('].map(fn => (
                                <Button key={fn} size="sm" variant="ghost" onClick={() => insert(fn)} className="text-xs font-mono">
                                    {fn.replace('(', '')}
                                </Button>
                            ))}
                        </div>

                        <Button onClick={evaluate} variant="primary" icon={Equal} className="w-full h-12 text-lg">
                            Evaluate
                        </Button>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 mt-auto">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                        <p className="text-[10px] text-blue-300/60 leading-relaxed">
                            Supports standard math operators (+, -, *, /, %) and functions:
                            sin, cos, tan, sqrt, log, pow, abs, round, ceil, floor, pi, e.
                        </p>
                    </div>
                </div>

                <div className="glass-panel flex flex-col overflow-hidden h-full">
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 text-sm font-semibold text-white/70">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-400" />
                            <span>Recent History</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setHistory([])}>Clear</Button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-2">
                        {history.length > 0 ? (
                            history.map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center group">
                                    <span className="text-sm font-mono text-white/60 truncate mr-4">{item.split('=')[0]}</span>
                                    <span className="text-sm font-bold text-indigo-400 shrink-0">={item.split('=')[1]}</span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 italic text-sm">
                                <span>No history yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
