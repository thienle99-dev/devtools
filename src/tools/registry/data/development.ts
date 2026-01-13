import { Percent, Clock, Lock, Container, Settings, Database, Code } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../development/logic';

export const developmentTools: ToolDefinition[] = [

    {
        id: 'regex-tester',
        name: 'Regex Tester',
        path: '/regex-tester',
        description: 'Test regular expressions',
        category: 'development',
        icon: Percent,
        color: 'text-pink-500',
        component: Lazy.RegexTester,
        keywords: ['regex', 'test', 'regexp', 'match']
    },
    {
        id: 'crontab',
        name: 'Crontab Generator',
        path: '/crontab',
        description: 'Cron schedule generator',
        category: 'development',
        icon: Clock,
        color: 'text-blue-400',
        component: Lazy.CrontabGenerator,
        keywords: ['cron', 'schedule', 'job', 'timer']
    },
    {
        id: 'chmod',
        name: 'Chmod Calculator',
        path: '/chmod',
        description: 'File permissions (chmod)',
        category: 'development',
        icon: Lock,
        color: 'text-red-400',
        component: Lazy.ChmodCalculator,
        keywords: ['chmod', 'permission', 'octal', 'linux', 'unix']
    },
    {
        id: 'docker-convert',
        name: 'Docker > Compose',
        path: '/docker-convert',
        description: 'Convert run to compose',
        category: 'development',
        icon: Container,
        color: 'text-sky-500',
        component: Lazy.DockerConverter,
        keywords: ['docker', 'compose', 'convert', 'container'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input) => Logic.convertDockerRun(input)
    },

    {
        id: 'mock-data-generator',
        name: 'Mock Data Generator',
        path: '/mock-data',
        description: 'Generate realistic test data',
        category: 'development',
        icon: Database,
        color: 'text-emerald-400',
        component: Lazy.MockDataGenerator,
        keywords: ['mock', 'data', 'fake', 'generate', 'json', 'csv']
    },
    {
        id: 'code-snippet-generator',
        name: 'Code Snippet Gen',
        path: '/code-snippets',
        description: 'Generate HTTP code for curl, fetch, axios, etc.',
        category: 'development',
        icon: Code,
        color: 'text-orange-400',
        component: Lazy.CodeSnippetGenerator,
        keywords: ['http', 'curl', 'fetch', 'axios', 'request', 'api']
    },
    {
        id: 'settings',
        name: 'Settings',
        path: '/settings',
        description: 'Customize your experience and manage application preferences',
        category: 'development',
        icon: Settings,
        component: Lazy.SettingsPage,
        keywords: ['settings', 'preferences', 'config', 'options']
    },
];
