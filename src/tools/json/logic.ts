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
    JSON.parse(input);
    return 'Valid JSON ✔️';
};
