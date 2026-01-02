import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Box,
    Code2,
    FileJson,
    Hash,
    Globe,
    Settings,
    History,
    Star,
    Search
} from 'lucide-react';
import { cn } from '../../utils/cn';

const categories = [
    { id: 'favorites', name: 'Favorites', icon: Star, items: [] },
    { id: 'recent', name: 'Recent', icon: History, items: [] },
    {
        id: 'converters', name: 'Converters', icon: Box, items: [
            { id: 'json-yaml', name: 'JSON <> YAML', path: '/json-yaml' },
            { id: 'base64', name: 'Base64', path: '/base64' },
        ]
    },
    {
        id: 'formatters', name: 'Formatters', icon: Code2, items: [
            { id: 'json-format', name: 'JSON Formatter', path: '/json-format' },
            { id: 'sql-format', name: 'SQL Formatter', path: '/sql-format' },
        ]
    },
    {
        id: 'crypto', name: 'Crypto', icon: Hash, items: [
            { id: 'hash', name: 'Hash Generator', path: '/hash' },
            { id: 'uuid', name: 'UUID Generator', path: '/uuid' },
        ]
    },
    {
        id: 'web', name: 'Web', icon: Globe, items: [
            { id: 'url', name: 'URL Encoder', path: '/url' },
            { id: 'jwt', name: 'JWT Parser', path: '/jwt' },
        ]
    },
];

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300">
            <div className="p-4 flex items-center mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
                {categories.map((category) => (
                    <div key={category.id} className="space-y-1">
                        <h3 className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 flex items-center">
                            <category.icon className="w-3 h-3 mr-2" />
                            {category.name}
                        </h3>
                        <div className="space-y-[2px]">
                            {category.items.map((item) => (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                                        isActive
                                            ? "bg-white/10 text-white shadow-lg shadow-black/5"
                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                            {category.items.length === 0 && (
                                <p className="px-3 py-2 text-xs text-white/20 italic">No items yet</p>
                            )}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button className="flex items-center w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                </button>
            </div>
        </aside>
    );
};
