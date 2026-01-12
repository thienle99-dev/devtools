export interface RequestData {
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    body: string;
}

export const generateSnippet = (data: RequestData, language: string): string => {
    const { method, url, headers, body } = data;
    const cleanHeaders = headers.filter(h => h.key && h.value);
    
    switch (language) {
        case 'curl':
            let curl = `curl -X ${method} "${url}"`;
            cleanHeaders.forEach(h => {
                curl += ` \\\n  -H "${h.key}: ${h.value}"`;
            });
            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                // Determine content type to escape properly if needed
                // Simple escaping for now
                const escapedBody = body.replace(/"/g, '\\"');
                curl += ` \\\n  -d "${escapedBody}"`;
            }
            return curl;

        case 'javascript-fetch':
            const options: any = {
                method: method,
                headers: cleanHeaders.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
            };
            
            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = body; // In real code usually JSON.stringify if it's object, but here we assume body is string
            }

            // Detect if body looks like JSON but user didn't wrap it? 
            // We assume body string is raw body.

            let fetchCode = `fetch("${url}", {\n`;
            fetchCode += `  method: "${method}",\n`;
            
            if (Object.keys(options.headers).length > 0) {
                fetchCode += `  headers: {\n`;
                Object.entries(options.headers).forEach(([k, v]) => {
                    fetchCode += `    "${k}": "${v}",\n`;
                });
                fetchCode += `  },\n`;
            }
            
            if (options.body) {
                // Try to format body if it's valid JSON
                try {
                    JSON.parse(options.body);
                    fetchCode += `  body: JSON.stringify(${options.body}),\n`;
                } catch {
                     fetchCode += `  body: \`${options.body}\`,\n`;
                }
            }
            
            fetchCode += `})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Error:', error));`;
            return fetchCode;

        case 'python-requests':
            let py = `import requests\n\n`;
            py += `url = "${url}"\n`;
            
            if (cleanHeaders.length > 0) {
                py += `headers = {\n`;
                cleanHeaders.forEach(h => {
                    py += `    "${h.key}": "${h.value}",\n`;
                });
                py += `}\n`;
            } else {
                py += `headers = {}\n`;
            }

            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                     JSON.parse(body);
                     py += `payload = ${body}\n`; // Python dict syntax often matches JSON
                     // But strictly we should parse and re-stringify or use json parameter
                     // For simplicity, let's treat it as string data for now unless we do 'json='
                     // Better:
                } catch {
                     py += `payload = """${body}"""\n`;
                }
            } else {
                py += `payload = {}\n`;
            }

            py += `\nresponse = requests.request("${method}", url, headers=headers, data=payload)\n\n`;
            py += `print(response.text)`;
            return py;

        case 'node-axios':
            let axios = `const axios = require('axios');\n\n`;
            axios += `let config = {\n`;
            axios += `  method: '${method.toLowerCase()}',\n`;
            axios += `  maxBodyLength: Infinity,\n`;
            axios += `  url: '${url}',\n`;
            
            if (cleanHeaders.length > 0) {
                axios += `  headers: { \n`;
                cleanHeaders.forEach(h => {
                    axios += `    '${h.key}': '${h.value}',\n`;
                });
                axios += `  },\n`;
            } else {
                axios += `  headers: { },\n`;
            }
            
            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                 try {
                    JSON.parse(body);
                    axios += `  data: ${body}\n`;
                } catch {
                     axios += `  data: \`${body}\`\n`;
                }
            }

            axios += `};\n\n`;
            axios += `axios.request(config)\n`;
            axios += `.then((response) => {\n`;
            axios += `  console.log(JSON.stringify(response.data));\n`;
            axios += `})\n`;
            axios += `.catch((error) => {\n`;
            axios += `  console.log(error);\n`;
            axios += `});`;
            return axios;

        default:
            return '// Language not supported';
    }
};
