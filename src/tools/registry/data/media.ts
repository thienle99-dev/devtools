import { Mic, Camera, Shield } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const mediaTools: ToolDefinition[] = [
    {
        id: 'voice-recorder',
        name: 'Voice Recorder',
        description: 'Record and save audio from your microphone',
        path: '/voice-recorder',
        category: 'media',
        icon: Mic,
        color: 'text-red-400',
        component: Lazy.VoiceRecorder,
        keywords: ['voice', 'recorder', 'audio', 'mic', 'microphone']
    },
    {
        id: 'camera',
        name: 'Camera & Recorder',
        description: 'Capture photos and record videos from your webcam',
        path: '/camera',
        category: 'media',
        icon: Camera,
        color: 'text-indigo-400',
        component: Lazy.Camera,
        keywords: ['camera', 'webcam', 'photo', 'video', 'capture', 'recorder']
    },
    {
        id: 'xnapper',
        name: 'Beautiful Screenshot',
        path: '/screenshot',
        description: 'Create beautiful screenshots with backgrounds',
        category: 'media',
        icon: Shield,
        color: 'text-indigo-400',
        component: Lazy.Xnapper,
        keywords: ['screenshot', 'canvas', 'image', 'capture', 'preview'],
    },

];
