import { Mic, Camera, Shield, Film, Search, Music } from 'lucide-react';
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
    {
        id: 'video-studio',
        name: 'Video Studio',
        path: '/video-studio',
        description: 'Extract frames from video or create video from frames',
        category: 'media',
        icon: Film,
        color: 'text-purple-400',
        component: Lazy.VideoStudio,
        keywords: ['video', 'frames', 'extract', 'media', 'convert'],
    },
    {
        id: 'universal-downloader',
        name: 'Universal Downloader',
        path: '/universal-downloader',
        description: 'Download media from many social platforms',
        category: 'media',
        icon: Search,
        color: 'text-emerald-400',
        component: Lazy.UniversalDownloader,
        keywords: ['download', 'media', 'social', 'video', 'youtube', 'tiktok', 'facebook', 'twitter'],
    },
    {
        id: 'audio-extractor',
        name: 'Audio Extractor',
        path: '/audio-extractor',
        description: 'Extract audio from video files',
        category: 'media',
        icon: Music,
        color: 'text-pink-400',
        component: Lazy.AudioExtractor,
        keywords: ['audio', 'extract', 'video', 'mp3', 'media'],
    },
];
