import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@utils/cn';

interface ToolNavItemProps {
    tool: any;
    isActive: boolean;
    isCollapsed: boolean;
    favorites: string[];
    toggleFavorite: (id: string) => void;
    openTab: (id: string, path: string, name: string, desc: string, isPreview: boolean, isOrderLocked: boolean) => void;
    navigate: (path: string) => void;
}

export const ToolNavItem: React.FC<ToolNavItemProps> = ({ tool, isActive, isCollapsed, favorites, toggleFavorite, openTab, navigate }) => {
    const Icon = tool.icon;
    const isFav = favorites.includes(tool.id);

    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                openTab(tool.id, tool.path, tool.name, tool.description, e.altKey, false);
                navigate(tool.path);
            }}
            className={cn(
                "group relative flex items-center transition-all duration-500 cursor-pointer overflow-hidden",
                isCollapsed
                    ? "w-12 h-12 justify-center rounded-2xl mb-1 hover:scale-105"
                    : "h-10 px-3.5 gap-3 rounded-xl mb-0.5",
                isActive
                    ? "bg-indigo-500 text-white shadow-[0_6px_12px_-4px_rgba(99,102,241,0.4)]"
                    : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] text-foreground-secondary hover:text-foreground"
            )}
            title={isCollapsed ? tool.name : tool.description}
        >
            {/* Left Indicator - Active only */}
            {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/60 rounded-r-full" />
            )}

            <div className={cn(
                "shrink-0 flex items-center justify-center transition-all duration-300",
                isCollapsed ? "w-7 h-7" : "w-5 h-5",
                isActive ? "text-white" : tool.color || "text-foreground-muted/60 group-hover:text-indigo-400 group-hover:scale-110"
            )}>
                {Icon && <Icon className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate font-bold tracking-tight text-[12px]">{tool.name}</span>
                        {!isActive && (
                            <span className="text-[8px] text-foreground-muted/40 font-black uppercase tracking-widest truncate group-hover:text-foreground-muted group-hover:opacity-100 transition-all">
                                {tool.category}
                            </span>
                        )}
                    </div>

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                        }}
                        className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all hover:scale-125",
                            isFav ? "opacity-100" : ""
                        )}
                    >
                        <Star className={cn(
                            "w-3.5 h-3.5",
                            isFav ? "fill-amber-400 text-amber-400" : "text-foreground-muted/30"
                        )} />
                    </button>
                </>
            )}

            {/* Collapsed Active Indicator */}
            {isActive && isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/60 rounded-l-full" />
            )}
        </div>
    );
};
