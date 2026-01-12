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
    }
];
