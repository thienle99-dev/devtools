import { 
    Film, 
    FileText, 
    Code2, 
    Shield, 
    Box, 
    Globe, 
    Zap
} from 'lucide-react';
import type { PluginCategory } from '@/types/plugin';

export const getCategoryIcon = (category: PluginCategory) => {
    switch (category) {
        case 'media': return Film;
        case 'document': return FileText;
        case 'developer': return Code2;
        case 'security': return Shield;
        case 'network': return Globe;
        case 'utility': return Box;
        default: return Zap;
    }
};

export const getCategoryColor = (category: PluginCategory) => {
    switch (category) {
        case 'media': return 'text-purple-400';
        case 'document': return 'text-amber-400';
        case 'developer': return 'text-pink-400';
        case 'security': return 'text-rose-400';
        case 'network': return 'text-cyan-400';
        case 'utility': return 'text-slate-400';
        default: return 'text-indigo-400';
    }
};
