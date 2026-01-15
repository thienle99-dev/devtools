import type { ToolDefinition, ToolCategory } from './types';
import { TOOLS } from './tools';
import { usePluginStore } from '@/store/pluginStore';
import { PluginHost } from '@/tools/plugins/components/PluginHost';
import { getCategoryIcon, getCategoryColor } from '@/tools/plugins/plugin-utils';

// Pre-compute maps for faster lookups
export const TOOLS_BY_ID = new Map<string, ToolDefinition>(
    TOOLS.map(tool => [tool.id, tool])
);

export const TOOLS_BY_PATH = new Map<string, ToolDefinition>(
    TOOLS.map(tool => [tool.path, tool])
);

export const TOOLS_BY_CATEGORY = TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
}, {} as Record<ToolCategory, ToolDefinition[]>);

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
    return TOOLS_BY_CATEGORY[category] || [];
};

export const getToolById = (id: string): ToolDefinition | undefined => {
    // Check built-in tools first (O(1) lookup)
    const coreTool = TOOLS_BY_ID.get(id);
    if (coreTool) return coreTool;

    // Check active plugins
    const activePlugins = usePluginStore.getState().activePlugins;
    const plugin = activePlugins.find(p => p.manifest.id === id);

    if (plugin) {
        return {
            id: plugin.manifest.id,
            name: plugin.manifest.name,
            description: plugin.manifest.description,
            category: plugin.manifest.category as any,
            path: `/plugin/${plugin.manifest.id}`,
            icon: getCategoryIcon(plugin.manifest.category),
            color: getCategoryColor(plugin.manifest.category),
            component: (props: any) => PluginHost({ ...props, pluginId: plugin.manifest.id }),
            keywords: plugin.manifest.tags || []
        } as ToolDefinition;
    }

    return undefined;
};

export const getToolByPath = (path: string): ToolDefinition | undefined => {
    return TOOLS_BY_PATH.get(path);
};
