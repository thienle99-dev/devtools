import { Percent, Settings } from 'lucide-react';
import * as Lazy from '@tools/registry/lazy-tools';
import type { ToolDefinition } from '@tools/registry/types';
import { TOOL_IDS } from '../tool-ids';

export const developmentTools: ToolDefinition[] = [
    {
        id: TOOL_IDS.REGEX_TESTER,
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
        id: TOOL_IDS.SETTINGS,
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
