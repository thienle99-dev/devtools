import { Percent, Settings } from 'lucide-react';
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
        id: 'settings',
        name: 'Settings',
        path: '/settings',
        description: 'Customize your experience and manage application preferences',
        category: 'development',
        icon: Settings,
        component: Lazy.SettingsPage,
        keywords: ['settings', 'preferences', 'config', 'options']
    }
    // Removed tools (moved to Developer Tools plugin):
    // - Crontab Generator
    // - Chmod Calculator
    // - Docker Converter
    // - Mock Data Generator
    // - Code Snippet Generator
];
