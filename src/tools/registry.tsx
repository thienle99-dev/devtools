import React from 'react';
import {
    Code2,
    Box,
    Hash,
    Globe,
    Star,
    History,
    FileJson,
    Database,
    Binary,
    Braces
} from 'lucide-react';

export type ToolCategory = 'converters' | 'formatters' | 'crypto' | 'web' | 'favorites' | 'recent';

export interface ToolDefinition {
    id: string;
    name: string;
    path: string;
    description: string;
    category: ToolCategory;
    icon: React.ElementType;
    component: React.ComponentType;
    keywords?: string[];
}

export interface CategoryDefinition {
    id: ToolCategory;
    name: string;
    icon: React.ElementType;
}

export const CATEGORIES: CategoryDefinition[] = [
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'recent', name: 'Recent', icon: History },
    { id: 'converters', name: 'Converters', icon: Box },
    { id: 'formatters', name: 'Formatters', icon: Code2 },
    { id: 'crypto', name: 'Crypto', icon: Hash },
    { id: 'web', name: 'Web', icon: Globe },
];

// Import existing tools
import { JsonFormatter } from './json/JsonFormatter';

// Import placeholders for now (we'll replace them as we build them)
import { ToolPlaceholder } from '../components/layout/ToolPlaceholder';
import { ToolPane } from '../components/layout/ToolPane';

// Helper to create a placeholder component easily
const createPlaceholder = (name: string, description: string) => () => (
    <ToolPane title={name} description={description}>
        <ToolPlaceholder name={name} />
    </ToolPane>
);

export const TOOLS: ToolDefinition[] = [
    // Formatters
    {
        id: 'json-format',
        name: 'JSON Formatter',
        path: '/json-format',
        description: 'Prettify, minify and validate JSON data',
        category: 'formatters',
        icon: FileJson,
        component: JsonFormatter,
        keywords: ['json', 'format', 'minify', 'prettier']
    },
    {
        id: 'sql-format',
        name: 'SQL Formatter',
        path: '/sql-format',
        description: 'Prettify and format SQL queries',
        category: 'formatters',
        icon: Database,
        component: createPlaceholder('SQL Formatter', 'Prettify and format SQL queries'),
    },

    // Converters
    {
        id: 'json-yaml',
        name: 'JSON <> YAML',
        path: '/json-yaml',
        description: 'Convert between JSON and YAML formats',
        category: 'converters',
        icon: Braces, // Approximation
        component: createPlaceholder('JSON <> YAML', 'Convert between JSON and YAML formats'),
    },
    {
        id: 'base64',
        name: 'Base64',
        path: '/base64',
        description: 'Encode and decode Base64 strings',
        category: 'converters',
        icon: Binary,
        component: createPlaceholder('Base64 Converter', 'Encode and decode Base64 strings'),
    },

    // Crypto
    {
        id: 'hash',
        name: 'Hash Generator',
        path: '/hash',
        description: 'Generate various cryptographic hashes',
        category: 'crypto',
        icon: Hash,
        component: createPlaceholder('Hash Generator', 'Generate various cryptographic hashes'),
    },
    {
        id: 'uuid',
        name: 'UUID Generator',
        path: '/uuid',
        description: 'Generate unique identifiers (UUIDs)',
        category: 'crypto',
        icon: Hash, // Or a better ID icon
        component: createPlaceholder('UUID Generator', 'Generate unique identifiers (UUIDs)'),
    },

    // Web
    {
        id: 'url',
        name: 'URL Encoder',
        path: '/url',
        description: 'Encode and decode URLs',
        category: 'web',
        icon: Globe,
        component: createPlaceholder('URL Encoder/Decoder', 'Encode and decode URLs'),
    },
    {
        id: 'jwt',
        name: 'JWT Parser',
        path: '/jwt',
        description: 'Parse and inspect JSON Web Tokens',
        category: 'web',
        icon: Globe, // Or Key icon
        component: createPlaceholder('JWT Decoder', 'Parse and inspect JSON Web Tokens'),
    },
];

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
    return TOOLS.filter(tool => tool.category === category);
};

export const getToolById = (id: string): ToolDefinition | undefined => {
    return TOOLS.find(tool => tool.id === id);
};
