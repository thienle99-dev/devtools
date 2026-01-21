import React from 'react';

export type ToolCategory = 'converters' | 'formatters' | 'crypto' | 'web' | 'network' | 'development' | 'utilities' | 'pdf' | 'favorites' | 'recent' | 'image' | 'text' | 'math' | 'media' | 'security' | 'plugins' | 'capture' | 'data';

export type ToolDataType = 'text' | 'json' | 'image' | 'file' | 'clipboard' | 'hex' | 'binary' | 'any' | 'xml' | 'yaml' | 'sql' | 'csv' | 'excel' | 'table';

export interface ToolDefinition {
    id: string;
    name: string;
    path: string;
    description: string;
    category: ToolCategory;
    icon: React.ElementType;
    component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
    props?: Record<string, any>;
    keywords?: string[];
    shortcut?: string;
    color?: string;
    hideFromSidebar?: boolean; // Hide from sidebar navigation (e.g., marketplace accessible via footer)

    // Pipeline Support
    inputTypes?: ToolDataType[];
    outputTypes?: ToolDataType[];
    process?: (input: any, options?: any) => Promise<any> | any;
}

export interface CategoryDefinition {
    id: ToolCategory;
    name: string;
    icon: React.ElementType;
    color?: string;
}
