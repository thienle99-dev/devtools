import { Database } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const dataTools: ToolDefinition[] = [
    {
        id: 'data-parser',
        name: 'Data Parser',
        description: 'Extract IBANs, Phone Numbers, and Emails',
        icon: Database,
        path: '/data/parser',
        category: 'data',
        component: Lazy.DataParser,
        keywords: ['data', 'extract', 'iban', 'phone', 'email', 'parse'],
        color: 'text-cyan-400'
    }
];
