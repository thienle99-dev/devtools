
interface DetectionResult {
    toolId: string;
    description: string;
    confidence: number;
    type?: string;
}

export const detectContent = (input: string): DetectionResult | null => {
    input = input.trim();
    if (!input) return null;

    // JSON
    if ((input.startsWith('{') && input.endsWith('}')) || (input.startsWith('[') && input.endsWith(']'))) {
        try {
            JSON.parse(input);
            return { toolId: 'code-formatter', description: 'JSON Detected', confidence: 1.0, type: 'json' };
        } catch { }
    }

    // XML / HTML
    if (input.startsWith('<') && input.endsWith('>')) {
        return { toolId: 'code-formatter', description: 'XML Detected', confidence: 0.8, type: 'xml' };
    }

    // SQL
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\s/i.test(input)) {
        return { toolId: 'code-formatter', description: 'SQL Detected', confidence: 0.9, type: 'sql' };
    }

    // YAML (Simple heuristic: starts with "key:" or "- ")
    if (/^([a-z0-9_]+:\s|(\s*-\s))/i.test(input)) {
        // Exclude simple JSON-like things if they parse as JSON, but YAML usually handles JSON too.
        // We prioritizing JSON earlier handles that.
        return { toolId: 'code-formatter', description: 'YAML Detected', confidence: 0.75, type: 'yaml' };
    }

    // JWT - Specific tool
    if (input.split('.').length === 3 && input.startsWith('eyJ')) {
        return { toolId: 'jwt-decoder', description: 'JWT Detected', confidence: 0.95 };
    }

    // Base64
    if (input.length > 20 && input.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(input)) {
        return { toolId: 'base64', description: 'Base64 Detected', confidence: 0.6 };
    }

    // Hex
    if (input.length > 4 && /^[0-9a-fA-F\s]+$/.test(input) && !input.includes(' ')) {
        return { toolId: 'number-base', description: 'Hex Detected', confidence: 0.5 };
    }

    return null;
};
