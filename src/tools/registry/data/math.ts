import { Calculator, Percent, Thermometer, Timer } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { evaluateExpression, convertTemperature } from '../../math/logic';

export const mathTools: ToolDefinition[] = [
    {
        id: 'math-evaluator',
        name: 'Math Evaluator',
        path: '/math-evaluator',
        description: 'Evaluate mathematical expressions',
        category: 'math',
        icon: Calculator,
        color: 'text-emerald-400',
        component: Lazy.MathEvaluator,
        keywords: ['math', 'calculator', 'evaluate', 'expression', 'scientific'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input) => evaluateExpression(input)
    },
    {
        id: 'percentage-calculator',
        name: 'Percentage Calculator',
        path: '/percentage',
        description: 'Calculate percentages in various scenarios',
        category: 'math',
        icon: Percent,
        color: 'text-emerald-400',
        component: Lazy.PercentageCalculator,
        keywords: ['percent', 'percentage', 'math', 'calculator', 'increase', 'decrease'],
    },
    {
        id: 'temperature-converter',
        name: 'Temperature Converter',
        path: '/temperature',
        description: 'Convert between Celsius, Fahrenheit and Kelvin',
        category: 'math',
        icon: Thermometer,
        color: 'text-emerald-400',
        component: Lazy.TemperatureConverter,
        keywords: ['temperature', 'convert', 'celsius', 'fahrenheit', 'kelvin', 'math'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input, options) => {
            const val = parseFloat(input);
            if (isNaN(val)) return { error: 'Invalid number' };
            return convertTemperature(val, options?.unit || 'C');
        }
    },
    {
        id: 'chronometer',
        name: 'Chronometer',
        path: '/chronometer',
        description: 'Stopwatch and count down timer',
        category: 'math',
        icon: Timer,
        color: 'text-emerald-400',
        component: Lazy.Chronometer,
        keywords: ['timer', 'stopwatch', 'chronometer', 'countdown', 'lap'],
    },
];
