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
        <aside className="w-64 h-full sidebar-macos flex flex-col transition-all duration-300 z-20">
            {/* Search Section - macOS Style */}
            <div className="px-4 pt-4 pb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        className="sidebar-search-input w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                </div>
            </div>

            {/* Navigation - macOS Style */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-5 custom-scrollbar">
                {CATEGORIES.map((category) => {
                    const tools = getToolsByCategory(category.id);

                    // Skip Favorites/Recent if empty for now, or keep them if you want to implement logic later
                    if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                    if (tools.length === 0) return null;

                    return (
                        <div key={category.id} className="space-y-1.5">
                            {/* Category Header - macOS Style */}
                            <h3 className="px-2.5 text-[11px] font-semibold text-foreground-muted uppercase tracking-[0.08em] mb-1.5 flex items-center">
                                <category.icon className="w-3.5 h-3.5 mr-2 opacity-60" />
                                {category.name}
                            </h3>
                            
                            {/* Tool Items - macOS Style */}
                            <div className="space-y-0.5">
                                {tools.map((tool) => (
                                    <NavLink
                                        key={tool.id}
                                        to={tool.path}
                                        className={({ isActive }) => cn(
                                            "sidebar-nav-item flex items-center px-2.5 py-2 rounded-md text-sm transition-all duration-200 group cursor-pointer",
                                            isActive
                                                ? "sidebar-nav-item-active"
                                                : "sidebar-nav-item-inactive"
                                        )}
                                    >
                                        <span className="truncate flex-1">{tool.name}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer - Settings Button - macOS Style */}
            <div className="px-4 py-3 border-t border-border-glass">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => cn(
                        "sidebar-settings-button flex items-center px-3 py-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer",
                        isActive && "sidebar-settings-button-active"
                    )}
                >
                    <Settings className="w-4 h-4 mr-2.5" />
                    <span>Settings</span>
                </NavLink>
            </div>
        </aside>
    );
};
