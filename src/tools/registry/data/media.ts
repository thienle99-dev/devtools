import type { ToolDefinition } from '@tools/registry/types';

// All media tools have been moved to plugins:
// - beautiful-screenshot → beautiful-screenshot plugin
// - voice-recorder → media-tools plugin
// - webcam-photo → media-tools plugin
// - video-recorder → media-tools plugin
// - video-compressor → media-tools plugin
// These tools will appear in the footer when their respective plugins are installed

import { Download } from 'lucide-react';
import * as Lazy from '@tools/registry/lazy-tools';


export const mediaTools: ToolDefinition[] = [
    {
        id: 'universal-downloader', // Matches plugin ID
        name: 'Universal Media Downloader',
        path: '/media/downloader', // Use a tool path, not plugin path, to distinguish? Or same?
        description: 'Download video and audio from 1000+ sites',
        icon: Download,
        category: 'media',
        component: Lazy.UniversalDownloader,
        keywords: ['download', 'youtube', 'tiktok', 'video'],
        color: 'text-rose-500'
    }
];
