import composerize from 'composerize';

export const convertDockerRun = (input: string) => {
    try {
        return composerize(input);
    } catch (e) {
        throw new Error(`Docker conversion failed: ${(e as Error).message}`);
    }
};

export const analyzeLogs = (logs: string) => {
    const lines = logs.split('\n');
    const analysis = {
        totalLines: lines.length,
        errors: 0,
        warnings: 0,
        infos: 0,
        patterns: [] as string[]
    };

    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('error') || lower.includes('fatal') || lower.includes('exception')) analysis.errors++;
        else if (lower.includes('warn')) analysis.warnings++;
        else if (lower.includes('info')) analysis.infos++;
    });

    return analysis;
};

export const highlightLogs = (logs: string) => {
    // Return HTML or structured data for highlighting
    return logs.split('\n').map(line => {
        let type = 'default';
        const lower = line.toLowerCase();
        if (lower.includes('error') || lower.includes('fatal') || lower.includes('exception')) type = 'error';
        else if (lower.includes('warn')) type = 'warning';
        else if (lower.includes('info')) type = 'info';
        
        return { text: line, type };
    });
};
