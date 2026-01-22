export interface RequestData {
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    body: string;
}

export const generateSnippet = (request: RequestData, language: string): string => {
    try {
        let snippet = '';
        const headers = request.headers
            .filter(h => h.key && h.value)
            .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as Record<string, string>);

        switch (language) {
            case 'curl':
                snippet = `curl -X ${request.method} "${request.url}"`;
                Object.entries(headers).forEach(([k, v]) => {
                    snippet += ` \\\n  -H "${k}: ${v}"`;
                });
                if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
                    snippet += ` \\\n  -d '${request.body.replace(/'/g, "'\\''")}'`;
                }
                break;
            
            case 'javascript-fetch':
                snippet = `fetch("${request.url}", {\n  method: "${request.method}",\n`;
                if (Object.keys(headers).length > 0) {
                    snippet += `  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},\n`;
                }
                if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
                    snippet += `  body: JSON.stringify(${request.body})\n`;
                }
                snippet += `})`;
                break;

            case 'node-axios':
                snippet = `const axios = require('axios');\n\n`;
                snippet += `axios({\n  method: '${request.method.toLowerCase()}',\n  url: '${request.url}',\n`;
                if (Object.keys(headers).length > 0) {
                    snippet += `  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},\n`;
                }
                if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
                    snippet += `  data: ${request.body}\n`;
                }
                snippet += `});`;
                break;

            case 'python-requests':
                snippet = `import requests\n\nurl = "${request.url}"\n`;
                if (Object.keys(headers).length > 0) {
                    snippet += `headers = ${JSON.stringify(headers, null, 2)}\n`;
                } else {
                    snippet += `headers = {}\n`;
                }
                if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
                    snippet += `payload = ${request.body}\n`;
                    snippet += `response = requests.request("${request.method}", url, headers=headers, json=payload)`;
                } else {
                    snippet += `response = requests.request("${request.method}", url, headers=headers)`;
                }
                break;

            default:
                snippet = `// Language ${language} not supported yet`;
        }
        return snippet;
    } catch (e) {
        return `// Error generating snippet: ${(e as Error).message}`;
    }
};
