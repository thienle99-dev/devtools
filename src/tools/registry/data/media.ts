import { Mic, Camera, Shield, Scale, Video } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const mediaTools: ToolDefinition[] = [
    {
        id: 'voice-recorder',
        name: 'Voice Recorder',
        description: 'Record and save audio from your microphone',
        path: '/voice-recorder',
        category: 'capture',
        icon: Mic,
        color: 'text-red-400',
        component: Lazy.VoiceRecorder,
        keywords: ['voice', 'recorder', 'audio', 'mic', 'microphone']
    },
    {
        id: 'webcam-photo',
        name: 'Webcam Photo',
        description: 'Capture high-quality photos from your webcam',
        path: '/camera-photo',
        category: 'capture',
        icon: Camera,
        color: 'text-indigo-400',
        component: Lazy.Camera,
        props: { mode: 'photo' },
        keywords: ['camera', 'webcam', 'photo', 'capture']
    },
    {
        id: 'video-recorder',
        name: 'Video Recorder',
        description: 'Record high-quality videos from your webcam',
        path: '/video-recorder',
        category: 'capture',
        icon: Video,
        color: 'text-rose-400',
        component: Lazy.Camera,
        props: { mode: 'video' },
        keywords: ['video', 'recorder', 'webcam', 'capture']
    },
    {
        id: 'beautiful-screenshot',
        name: 'Beautiful Screenshot',
        path: '/screenshot',
        description: 'Create professional screenshots with backgrounds and effects',
        category: 'capture',
        icon: Shield,
        color: 'text-indigo-400',
        component: Lazy.Xnapper,
        keywords: ['screenshot', 'canvas', 'image', 'capture', 'preview', 'beautify'],
    },
    {
        id: 'video-compressor',
        name: 'Video Compressor',
        path: '/video-compressor',
        description: 'Compress, resize and upscale video files',
        category: 'media',
        icon: Scale,
        color: 'text-indigo-400',
        component: Lazy.VideoCompressor,
        keywords: ['video', 'compress', 'resize', 'scale', 'upscale', 'media'],
    },
];
