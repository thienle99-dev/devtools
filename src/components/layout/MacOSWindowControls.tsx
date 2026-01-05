import React from 'react';

/**
 * macOS-style window controls
 * Shows traffic light buttons on the left (handled by native macOS)
 * This component is minimal since macOS uses native controls
 */
export const MacOSWindowControls: React.FC = () => {
    return (
        <div className="flex items-center h-12 select-none drag">
            {/* Left side: Reserve space for native macOS traffic lights */}
            <div className="w-20" />

            {/* Center: App title */}
            <div className="flex-1 text-center text-sm font-medium text-foreground-muted tracking-wider uppercase flex items-center justify-center gap-2">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    DEVTOOLS
                </span>
            </div>

            {/* Right side: Balance the layout */}
            <div className="w-20" />
        </div>
    );
};
