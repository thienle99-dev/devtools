
export const evaluateExpression = (expr: string) => {
    if (!expr?.trim()) return '';
    try {
        // Basic sanitization (concept only for now, relying on restricted function scope mostly)
        
        // Replace math functions with Math. equivalents
        const processExpr = expr
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
            .replace(/e\b/gi, 'Math.E'); // word boundary for e

        // eslint-disable-next-line no-new-func
        const evalResult = new Function(`return ${processExpr}`)();
        return Number.isFinite(evalResult) ? evalResult.toString() : 'Error';
    } catch (e) {
        return 'Error';
    }
};

export const convertTemperature = (v: number, from: 'C' | 'F' | 'K'): Record<'C' | 'F' | 'K', number> => {
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
