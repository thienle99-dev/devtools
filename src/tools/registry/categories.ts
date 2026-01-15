import {
    Star,
    History,
    Box,
    Code2,
    Hash,
    Globe,
    FileText,
    Image as ImageIcon,
    Type,
    Percent,
    Film,
    Camera
} from 'lucide-react';
import type { CategoryDefinition } from './types';

export const CATEGORIES: CategoryDefinition[] = [
    { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-amber-400' },
    { id: 'recent', name: 'Recent', icon: History, color: 'text-blue-400' },
    { id: 'converters', name: 'Converters', icon: Box, color: 'text-emerald-400' },
    { id: 'formatters', name: 'Formatters', icon: Code2, color: 'text-orange-400' },
    { id: 'crypto', name: 'Crypto', icon: Hash, color: 'text-violet-400' },
    { id: 'web', name: 'Web', icon: Globe, color: 'text-sky-400' },
    { id: 'network', name: 'Network', icon: Globe, color: 'text-cyan-400' },
    { id: 'pdf', name: 'PDF Tools', icon: FileText, color: 'text-rose-500' },
    { id: 'utilities', name: 'Utilities', icon: Box, color: 'text-yellow-400' },
    { id: 'development', name: 'Dev Utils', icon: Code2, color: 'text-pink-400' },
    { id: 'image', name: 'Image Tools', icon: ImageIcon, color: 'text-purple-400' },
    { id: 'text', name: 'Text Tools', icon: Type, color: 'text-indigo-400' },
    { id: 'math', name: 'Math Tools', icon: Percent, color: 'text-emerald-400' },
    { id: 'media', name: 'Media Tools', icon: Film, color: 'text-indigo-400' },
    { id: 'plugins', name: 'Plugins', icon: Box, color: 'text-blue-500' },
    { id: 'capture', name: 'Capture', icon: Camera, color: 'text-rose-400' },
];
