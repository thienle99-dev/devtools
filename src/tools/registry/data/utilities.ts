import { LayoutGrid } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const utilityTools: ToolDefinition[] = [

    {
        id: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        description: 'Overview and Quick Access',
        category: 'utilities',
        icon: LayoutGrid,
        color: 'text-indigo-500',
        component: Lazy.DashboardPage,
        keywords: ['home', 'dashboard', 'overview']
    },
];

