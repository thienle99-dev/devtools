import { Percent, Clock, Lock, Container, Settings } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

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
        keywords: ['docker', 'compose', 'convert', 'container']
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
