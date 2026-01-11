import React from 'react';

export type ToolCategory = 'converters' | 'formatters' | 'crypto' | 'web' | 'network' | 'development' | 'utilities' | 'pdf' | 'favorites' | 'recent' | 'image' | 'text' | 'math';

export interface ToolDefinition {
    id: string;
    name: string;
    path: string;
    description: string;
    category: ToolCategory;
    icon: React.ElementType;
    component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
    keywords?: string[];
    shortcut?: string;
    color?: string;
}

export interface CategoryDefinition {
    id: ToolCategory;
    name: string;
    icon: React.ElementType;
    color?: string;
}
