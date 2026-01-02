import React from 'react';

export const WindowControls: React.FC = () => {
    return (
        <div className="flex items-center space-x-2 px-4 h-12 select-none drag sticky top-0 z-50">
            <div className="flex space-x-2 no-drag">
                {/* These are mostly for visual consistency if not handled by OS */}
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#d8a124]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
            </div>
            <div className="flex-1 text-center text-xs font-medium text-white/40 tracking-wider uppercase">
                Antigravity DevTools
            </div>
            <div className="w-16" /> {/* Spacer to balance the left side */}
        </div>
    );
};
