import type { WorkflowStep } from './workflowStore';

export interface ChainTemplate {
    id: string;
    name: string;
    description: string;
    steps: Omit<WorkflowStep, 'id'>[];
}

export const CHAIN_TEMPLATES: ChainTemplate[] = [
    {
        id: 'json-clean',
        name: 'Clean & Format JSON',
        description: 'Parses JSON and formats it with proper indentation',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json', indent: 2 },
                label: 'Format JSON'
            }
        ]
    },
    {
        id: 'json-minify',
        name: 'Minify JSON',
        description: 'Compresses JSON for production use',
        steps: [
            {
                toolId: 'json-minifier',
                options: {},
                label: 'Minify JSON'
            }
        ]
    },
    {
        id: 'json-to-yaml',
        name: 'JSON to YAML',
        description: 'Converts JSON data to YAML format',
        steps: [
            {
                toolId: 'converter',
                options: { mode: 'json-yaml' },
                label: 'Convert to YAML'
            }
        ]
    },
    {
        id: 'yaml-to-json',
        name: 'YAML to JSON',
        description: 'Converts YAML data to JSON format',
        steps: [
            {
                toolId: 'converter',
                options: { mode: 'yaml-json' },
                label: 'Convert to JSON'
            }
        ]
    },
    {
        id: 'json-to-csv',
        name: 'JSON to CSV',
        description: 'Converts JSON array to CSV format',
        steps: [
            {
                toolId: 'converter',
                options: { mode: 'json-csv' },
                label: 'Convert to CSV'
            }
        ]
    },
    {
        id: 'json-clean-csv',
        name: 'JSON Clean → CSV',
        description: 'Format JSON array and convert to CSV format',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
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
        id: 'json-validate-minify',
        name: 'JSON Format → Minify',
        description: 'Ensures JSON is valid and then minimizes it',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Format JSON'
            },
            {
                toolId: 'json-minifier',
                options: {},
                label: 'Minify'
            }
        ]
    },
    {
        id: 'json-format-yaml',
        name: 'JSON Format → YAML',
        description: 'Clean up JSON before converting to YAML',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Format JSON'
            },
            {
                toolId: 'converter',
                options: { mode: 'json-yaml' },
                label: 'To YAML'
            }
        ]
    },
    {
        id: 'clean-pipeline',
        name: 'Multi-Format Roundtrip',
        description: 'Example flow: JSON → YAML → JSON (demo)',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Initial Format'
            },
            {
                toolId: 'converter',
                options: { mode: 'json-yaml' },
                label: 'To YAML'
            },
            {
                toolId: 'converter',
                options: { mode: 'yaml-json' },
                label: 'Back to JSON'
            }
        ]
    }
];
