import type { WorkflowStep } from './workflowStore';

export interface ChainTemplate {
    id: string;
    name: string;
    description: string;
    steps: Omit<WorkflowStep, 'id'>[];
}

export const CHAIN_TEMPLATES: ChainTemplate[] = [
    {
        id: 'json-clean-csv-export',
        name: 'JSON Clean → CSV Export',
        description: 'Formatter → Validator → JSON to CSV (Ready for download)',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format & Validate JSON'
            },
            {
                toolId: 'converter',
                options: { mode: 'json-csv' },
                label: 'Convert to CSV'
            }
        ]
    },
    {
        id: 'json-minify-copy',
        name: 'JSON Format → Minify',
        description: 'JSON Formatter → JSON Minifier (Ready for clipboard)',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Ensure Valid JSON'
            },
            {
                toolId: 'json-minifier',
                options: {},
                label: 'Compress / Minify'
            }
        ]
    },
    {
        id: 'json-to-yaml-flow',
        name: 'JSON → YAML flow',
        description: 'JSON Formatter → JSON to YAML conversion',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Clean Input'
            },
            {
                toolId: 'converter',
                options: { mode: 'json-yaml' },
                label: 'Convert to YAML'
            }
        ]
    },
    {
        id: 'yaml-to-json-flow',
        name: 'YAML → JSON flow',
        description: 'YAML to JSON conversion → JSON Validator',
        steps: [
            {
                toolId: 'converter',
                options: { mode: 'yaml-json' },
                label: 'Parse YAML'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format Result'
            }
        ]
    },
    {
        id: 'json-to-xml-flow',
        name: 'JSON → XML flow',
        description: 'JSON Formatter → JSON to XML conversion',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Clean JSON'
            },
            {
                toolId: 'converter',
                options: { mode: 'json-xml' },
                label: 'Convert to XML'
            }
        ]
    },
    {
        id: 'jwt-claims-flow',
        name: 'JWT Debugger Flow',
        description: 'JWT Parser → JSON Formatter (Inspect Claims)',
        steps: [
            {
                toolId: 'jwt',
                options: {},
                label: 'Parse JWT'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format Claims'
            }
        ]
    },
    {
        id: 'safelink-inspect-flow',
        name: 'Safelink → URL Parser',
        description: 'Decode Outlook Safelink → URL Parameter Parser',
        steps: [
            {
                toolId: 'safelink',
                options: {},
                label: 'Decode Safelink'
            },
            {
                toolId: 'url-parser',
                options: {},
                label: 'Parse Parameters'
            }
        ]
    },
    {
        id: 'ua-inspect-flow',
        name: 'UA Parser → JSON',
        description: 'User-Agent Parser → JSON Formatter',
        steps: [
            {
                toolId: 'user-agent',
                options: {},
                label: 'Parse UA String'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format Info'
            }
        ]
    },
    {
        id: 'docker-compose-flow',
        name: 'Docker → Compose → Prep',
        description: 'Docker run → docker-compose Converter → YAML Formatter',
        steps: [
            {
                toolId: 'docker-convert',
                options: {},
                label: 'Convert to Compose'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'yaml', indent: 2 },
                label: 'Format YAML'
            }
        ]
    },
    {
        id: 'secure-token-flow',
        name: 'Secure Token → Hash',
        description: 'Generate Token → Create SHA256 Hash',
        steps: [
            {
                toolId: 'token-generator',
                options: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true },
                label: 'Generate Secret'
            },
            {
                toolId: 'hash',
                options: { algorithm: 'sha256' },
                label: 'Create SHA256'
            }
        ]
    },
    {
        id: 'seo-meta-flow',
        name: 'SEO & Social Meta Flow',
        description: 'Standard Meta Tags + Open Graph Tag Generator',
        steps: [
            {
                toolId: 'meta-tags',
                options: { charset: 'UTF-8', viewport: 'width=device-width, initial-scale=1' },
                label: 'Generate Base Meta'
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
                toolId: 'image-to-ascii',
                options: { width: 100, charSet: 'standard' },
                label: 'Generate ASCII'
            }
        ]
    },
    {
        id: 'structured-data-flow',
        name: 'Structured Data Validator Flow',
        description: 'Generate JSON-LD → Format/Validate JSON',
        steps: [
            {
                toolId: 'structured-data',
                options: { type: 'WebSite' },
                label: 'Generate JSON-LD'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format & Validate'
            }
        ]
    },
    {
        id: 'uuid-flow',
        name: 'Bulk UUID Generator',
        description: 'Generate multiple UUIDs → Copy to Clipboard',
        steps: [
            {
                toolId: 'uuid',
                options: { count: 10, hyphens: true },
                label: 'Generate 10 IDs'
            }
        ]
    },
    {
        id: 'data-uri-flow',
        name: 'Image → Data URI Flow',
        description: 'Convert Image to Base64 Data URI',
        steps: [
            {
                toolId: 'data-uri',
                options: {},
                label: 'Generate URI'
            }
        ]
    },
    {
        id: 'jwt-inspect-flow',
        name: 'JWT Insights Flow',
        description: 'Parse JWT → Format Claims → Highlight Payload',
        steps: [
            {
                toolId: 'jwt',
                options: {},
                label: 'Parse JWT'
            },
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format Claims'
            }
        ]
    },
    {
        id: 'utm-campaign-flow',
        name: 'Marketing URL Flow',
        description: 'Build UTM URL → Generate QR Code',
        steps: [
            {
                toolId: 'utm-builder',
                options: { source: 'google', medium: 'social' },
                label: 'Build UTM Link'
            },
            {
                toolId: 'qr-code',
                options: { size: 400 },
                label: 'Generate QR'
            }
        ]
    },
    {
        id: 'post-slug-flow',
        name: 'SEO URL Prep Flow',
        description: 'Clean Text → Generate Slug → Copy URL',
        steps: [
            {
                toolId: 'slug',
                options: { separator: '-', lowercase: true },
                label: 'Generate Slug'
            }
        ]
    },
    {
        id: 'secrets-sanitization-flow',
        name: 'Security Audit & Masking',
        description: 'Scan for Secrets → Redact PII/Keys',
        steps: [
            {
                toolId: 'secrets-scanner',
                options: {},
                label: 'Scan for Vulnerabilities'
            },
            {
                toolId: 'data-masking',
                options: { fields: 'password,api_key,token,secret', visibleStart: 4 },
                label: 'Mask Sensitive Data'
            }
        ]
    },
    {
        id: 'regex-masking-flow',
        name: 'Smart Redaction Flow',
        description: 'Regex Replace Pattern → Apply Masking',
        steps: [
            {
                toolId: 'regex-replace',
                options: { pattern: '[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}', replacement: '[CARD_NUMBER]' },
                label: 'Redact Credit Cards'
            },
            {
                toolId: 'data-masking',
                options: { maskChar: 'X', visibleStart: 0, visibleEnd: 0 },
                label: 'Final Pass Masking'
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
    }
];
