import { Store } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const pluginTools: ToolDefinition[] = [
    {
        id: 'plugin-marketplace',
        name: 'Plugin Marketplace',
        path: '/plugins/marketplace',
        description: 'Browse and install plugins to extend DevTools',
        category: 'plugins',
        icon: Store,
        color: 'text-violet-400',
        component: Lazy.PluginMarketplace,
        keywords: ['plugins', 'marketplace', 'store', 'install', 'extensions', 'addons'],
        // Hidden from sidebar - only accessible via footer button
        hideFromSidebar: true
    }
];
