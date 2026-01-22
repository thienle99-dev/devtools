import type { ToolDefinition } from '@tools/registry/types';

// All media tools have been moved to plugins:
// - beautiful-screenshot → beautiful-screenshot plugin
// - voice-recorder → media-tools plugin
// - webcam-photo → media-tools plugin
// - video-recorder → media-tools plugin
// - video-compressor → media-tools plugin
// These tools will appear in the footer when their respective plugins are installed

export const mediaTools: ToolDefinition[] = [];
