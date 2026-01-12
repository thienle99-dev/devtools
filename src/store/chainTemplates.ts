export interface ChainTemplate {
    id: string;
    name: string;
    description: string;
    steps: {
        toolId: string;
        options: Record<string, any>;
        label: string;
    }[];
}

export const CHAIN_TEMPLATES: ChainTemplate[] = [
    {
        id: 'json-format-flow',
        name: 'Standard JSON Cleanup',
        description: 'Format JSON → Validate → Copy to Clipboard',
        steps: [
            {
                toolId: 'universal-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format & Prettify'
            }
        ]
    },
    {
        id: 'json-to-csv-flow',
        name: 'JSON → CSV Export Flow',
        description: 'Format JSON → Convert to CSV → Download File',
        steps: [
            {
                toolId: 'universal-formatter',
                options: { language: 'json' },
                label: 'Pre-format'
            },
            {
                toolId: 'csv-converter',
                options: { from: 'json', to: 'csv' },
                label: 'Convert to CSV'
            }
        ]
    },
    {
        id: 'xml-to-json-flow',
        name: 'XML → Clean JSON Pipeline',
        description: 'Convert XML → Format JSON → Export',
        steps: [
            {
                toolId: 'converter',
                options: { from: 'xml', to: 'json' },
                label: 'XML to JSON'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format Output'
            }
        ]
    },
    {
        id: 'yaml-to-json-flow',
        name: 'YAML → JSON Flow',
        description: 'Convert YAML → Format JSON Output',
        steps: [
            {
                toolId: 'converter',
                options: { from: 'yaml', to: 'json' },
                label: 'YAML to JSON'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format JSON'
            }
        ]
    },
    {
        id: 'base64-decode-image',
        name: 'Base64 → Image File',
        description: 'Decode String → Save as Image',
        steps: [
            {
                toolId: 'converter',
                options: { from: 'base64', to: 'text' },
                label: 'Decode Base64'
            },
            {
                toolId: 'image-converter',
                options: { format: 'image/png' },
                label: 'Convert to PNG'
            }
        ]
    },
    {
        id: 'jwt-decode-flow',
        name: 'JWT Investigation Flow',
        description: 'Decode JWT → Format Payload → Check Expiry',
        steps: [
            {
                toolId: 'jwt',
                options: {},
                label: 'Decode JWT'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'json' },
                label: 'Format Claims'
            }
        ]
    },
    {
        id: 'log-clean-flow',
        name: 'Production Log Sanitization',
        description: 'Mask sensitive data in logs for sharing',
        steps: [
            {
                toolId: 'data-masking',
                options: { fields: ['password', 'token', 'email', 'secret', 'key'] },
                label: 'Anonymize PII'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'text' },
                label: 'Cleanup Format'
            }
        ]
    },
    {
        id: 'seo-social-flow',
        name: 'Quick Social Config',
        description: 'Generate Meta Tags + OpenGraph Tags',
        steps: [
            {
                toolId: 'meta-tags',
                options: { title: 'My Awesome Page' },
                label: 'Base Meta'
            },
            {
                toolId: 'open-graph',
                options: { type: 'website' },
                label: 'Generate OG Tags'
            }
        ]
    },
    {
        id: 'seo-optimization-flow',
        name: 'Full SEO Site Config Flow',
        description: 'Meta Tags + OG + Robots.txt + Sitemap Generator',
        steps: [
            {
                toolId: 'meta-tags',
                options: { charset: 'UTF-8' },
                label: 'Base Meta'
            },
            {
                toolId: 'open-graph',
                options: {},
                label: 'Social Meta'
            },
            {
                toolId: 'robots-txt',
                options: { userAgent: '*', sitemap: 'https://example.com/sitemap.xml' },
                label: 'Robots.txt'
            },
            {
                toolId: 'sitemap-generator',
                options: {},
                label: 'XML Sitemap'
            }
        ]
    },
    {
        id: 'image-pdf-flow',
        name: 'Optimized Image → PDF',
        description: 'Compress Images → Generate PDF document',
        steps: [
            {
                toolId: 'image-converter',
                options: { format: 'image/jpeg', maxSizeMB: 0.5, maxWidthOrHeight: 1200 },
                label: 'Compress for PDF'
            },
            {
                toolId: 'images-to-pdf',
                options: { quality: 0.7, compression: 'FAST' },
                label: 'Create PDF'
            }
        ]
    },
    {
        id: 'image-ascii-flow',
        name: 'Image → ASCII Art Flow',
        description: 'Resize Image → Convert to stylized ASCII text',
        steps: [
            {
                toolId: 'image-converter',
                options: { format: 'image/jpeg', maxWidthOrHeight: 300 },
                label: 'Resize for Grid'
            },
            {
                toolId: 'ascii-art',
                options: { font: 'Standard' },
                label: 'Stylize Text'
            }
        ]
    },
    {
        id: 'uuid-flow',
        name: 'Batch UUID Generator',
        description: 'Generate 10 v4 UUIDs',
        steps: [
            {
                toolId: 'uuid',
                options: { type: 'v4', count: 10 },
                label: 'Generate Bulk'
            }
        ]
    },
    {
        id: 'xml-json-flow',
        name: 'XML → Clean JSON Flow',
        description: 'Convert XML → Format JSON Output',
        steps: [
            {
                toolId: 'converter',
                options: { mode: 'xml-json' },
                label: 'Parse XML'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format JSON'
            }
        ]
    },
    {
        id: 'json-masking-flow',
        name: 'JSON Privacy Flow',
        description: 'Format JSON → Mask Sensitive Fields',
        steps: [
            {
                toolId: 'universal-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Pre-format'
            },
            {
                toolId: 'data-masking',
                options: { fields: 'email,password,api_key' },
                label: 'Apply PII Mask'
            }
        ]
    },
    {
        id: 'sql-format-flow',
        name: 'SQL Cleanup Flow',
        description: 'Format SQL Queries → Export Clean SQL',
        steps: [
            {
                toolId: 'universal-formatter',
                options: { language: 'sql', uppercase: true },
                label: 'Format SQL'
            }
        ]
    },
    {
        id: 'docker-compose-flow',
        name: 'Docker Run → Compose Flow',
        description: 'Convert Command → Format YAML Output',
        steps: [
            {
                toolId: 'docker-convert',
                options: {},
                label: 'Convert to Compose'
            },
            {
                toolId: 'universal-formatter',
                options: { language: 'yaml', indent: 2 },
                label: 'Prettify YAML'
            }
        ]
    },
    {
        id: 'log-analysis-flow',
        name: 'Log Analysis & Masking',
        description: 'Analyze Logs → Mask Sensitive Data',
        steps: [
            {
                toolId: 'log-analyzer',
                options: {},
                label: 'Analyze Logs'
            },
            {
                toolId: 'data-masking',
                options: { maskChar: '*', visibleStart: 2 },
                label: 'Redact Secrets'
            }
        ]
    },
    {
        id: 'date-standard-flow',
        name: 'Universal Date Formatting',
        description: 'Convert Any Date → Standard ISO 8601',
        steps: [
            {
                toolId: 'date-converter',
                options: { format: 'iso' },
                label: 'To ISO 8601'
            }
        ]
    },
    {
        id: 'json-diff-report-flow',
        name: 'JSON Architecture Diff',
        description: 'Compare JSON → Export Markdown Report',
        steps: [
            {
                toolId: 'json-diff',
                options: {},
                label: 'Diff Structures'
            }
        ]
    },
    {
        id: 'bearer-token-copy-flow',
        name: 'API Key Generation Flow',
        description: 'Generate Bearer Token → Copy to Clipboard',
        steps: [
            {
                toolId: 'bearer-token',
                options: { length: 32 },
                label: 'Generate Secret'
            }
        ]
    },
    {
        id: 'url-deep-parse-flow',
        name: 'Deep URL Investigation',
        description: 'URL Decode → Parse Components → Extract Query',
        steps: [
            {
                toolId: 'url-parser',
                options: {},
                label: 'Parse & Inspect'
            }
        ]
    },
    {
        id: 'password-security-flow',
        name: 'Security Compliance Check',
        description: 'Analyze Strength → Verify Policy Compliance',
        steps: [
            {
                toolId: 'password-policy',
                options: { minLength: 12, requireSymbols: true },
                label: 'Policy Check'
            }
        ]
    }
];
