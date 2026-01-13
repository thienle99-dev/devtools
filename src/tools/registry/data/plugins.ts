import { Box } from 'lucide-react';
import * as Lazy from '../lazy-tools'; // Assuming lazy-tools is in the parent directory
import type { ToolDefinition } from '../types'; // Assuming types is in the parent directory

export const pluginTools: ToolDefinition[] = [
    {
        id: 'plugin-marketplace',
        name: 'Marketplace',
        path: '/plugins/marketplace',
        description: 'Browse and install plugins to extend DevTools',
        category: 'plugins',
        icon: Box,
        color: 'text-blue-500',
        component: Lazy.PluginMarketplace,
        keywords: ['plugins', 'marketplace', 'store', 'install', 'extensions', 'addons']
    }
];
