export const formatJson = (input: string) => {
    if (!input.trim()) return '';
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
};

export const minifyJson = (input: string) => {
    if (!input.trim()) return '';
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
};

export const validateJson = (input: string) => {
    if (!input.trim()) return 'Empty input.';
    try {
        JSON.parse(input);
        return 'Valid JSON ✔️';
    } catch (e) {
        return `Invalid JSON: ${(e as Error).message}`;
    }
};

export const jsonDiff = (left: string, right: string) => {
    try {
        const leftObj = JSON.parse(left);
        const rightObj = JSON.parse(right);
        // Prettify both for line-by-line comparison
        const leftPretty = JSON.stringify(leftObj, null, 2);
        const rightPretty = JSON.stringify(rightObj, null, 2);
        return { leftPretty, rightPretty };
    } catch (e) {
        throw new Error('Invalid JSON input for comparison');
    }
};
