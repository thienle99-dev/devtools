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
        id: 'clean-pipeline',
        name: 'Format -> Convert -> Minify',
        description: 'Example flow: Format JSON, Convert to YAML, then back to JSON (demo)',
        steps: [
            {
                toolId: 'code-formatter',
                options: { language: 'json' },
                label: 'Ensure JSON'
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
