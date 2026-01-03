import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Settings,
    Search
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORIES, getToolsByCategory } from '../../tools/registry';

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-full glass-panel-light border-r-0 flex flex-col transition-all duration-300 z-20">
            <div className="p-4 flex items-center mb-2 mt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        className="glass-input w-full pl-10"
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
                {CATEGORIES.map((category) => {
                    const tools = getToolsByCategory(category.id);

                    // Skip Favorites/Recent if empty for now, or keep them if you want to implement logic later
                    if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                    if (tools.length === 0) return null;

                    return (
                        <div key={category.id} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] mb-2 flex items-center">
                                <category.icon className="w-3 h-3 mr-2" />
                                {category.name}
                            </h3>
                            <div className="space-y-[2px]">
                                {tools.map((tool) => (
                                    <NavLink
                                        key={tool.id}
                                        to={tool.path}
                                        className={({ isActive }) => cn(
                                            "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                                            isActive
                                                ? "bg-bg-glass-hover text-foreground shadow-lg shadow-black/5"
                                                : "text-foreground-secondary hover:bg-[var(--color-glass-button-hover)] hover:text-foreground"
                                        )}
                                    >
                                        {/* Optional: Add tool icon here if we want icons per tool in sidebar */}
                                        {/* <tool.icon className="w-4 h-4 mr-2 opacity-70" /> */}
                                        {tool.name}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border-glass">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => cn(
                        "glass-button w-full flex items-center justify-start border-none bg-transparent hover:bg-[var(--color-glass-button-hover)]",
                        isActive && "bg-bg-glass-hover text-foreground"
                    )}
                >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                </NavLink>
            </div>
        </aside>
    );
};
