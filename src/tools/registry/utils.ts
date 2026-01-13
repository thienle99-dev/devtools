import type { ToolDefinition, ToolCategory } from './types';
import { TOOLS } from './tools';
import { usePluginStore } from '@/store/pluginStore';
import { PluginHost } from '@/tools/plugins/components/PluginHost';
import { getCategoryIcon, getCategoryColor } from '@/tools/plugins/plugin-utils';

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
    return TOOLS.filter(tool => tool.category === category);
};

export const getToolById = (id: string): ToolDefinition | undefined => {
    // Check built-in tools first
    const coreTool = TOOLS.find(tool => tool.id === id);
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
