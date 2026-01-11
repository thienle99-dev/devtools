import { Clipboard, Activity, Smartphone, Eraser, Monitor } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const utilityTools: ToolDefinition[] = [
    {
        id: 'clipboard-manager',
        name: 'Clipboard Manager',
        path: '/clipboard-manager',
        description: 'Manage clipboard history',
        category: 'utilities',
        icon: Clipboard,
        color: 'text-yellow-400',
        component: Lazy.ClipboardManager,
        keywords: ['clipboard', 'history', 'manager', 'copy', 'paste']
    },
    {
        id: 'stats-monitor',
        name: 'Stats Monitor',
        path: '/stats-monitor',
        description: 'Real-time system stats (CPU, RAM, Network)',
        category: 'utilities',
        icon: Activity,
        color: 'text-indigo-400',
        component: Lazy.StatsMonitor,
        keywords: ['stats', 'system', 'monitor', 'real-time', 'process']
    },
    {
        id: 'application-manager',
        name: 'App Manager',
        path: '/application-manager',
        description: 'Manage installed applications',
        category: 'utilities',
        icon: Smartphone,
        color: 'text-rose-400',
        component: Lazy.ApplicationManager,
        keywords: ['app', 'application', 'manager', 'uninstall', 'install']
    },
    {
        id: 'system-cleaner',
        name: 'System Cleaner',
        path: '/system-cleaner',
        description: 'Clean system junk and temporary files',
        category: 'utilities',
        icon: Eraser,
        color: 'text-blue-400',
        component: Lazy.SystemCleaner,
        keywords: ['clean', 'junk', 'temp', 'system', 'optimize']
    },
    {
        id: 'device-info',
        name: 'Device Info',
        path: '/device-info',
        description: 'Detailed system, hardware and browser information',
        category: 'utilities',
        icon: Monitor,
        color: 'text-cyan-400',
        component: Lazy.DeviceInfo,
        keywords: ['device', 'info', 'system', 'hardware', 'browser', 'os']
    },
];
