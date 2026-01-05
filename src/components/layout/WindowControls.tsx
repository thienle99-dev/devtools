import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const WindowControls: React.FC = () => {
    
    // Check if we are on macOS to conditionally render (or rely on CSS)
    // For now, render standard controls for Windows/Linux, and hide on macOS if needed via platform check
    // Since we don't have easy platform check here, we render and assume Windows style for this user.
    
    const handleMinimize = () => {
        (window as any).ipcRenderer?.send('window-minimize');
    };

    const handleMaximize = () => {
        (window as any).ipcRenderer?.send('window-maximize');
    };

    const handleClose = () => {
        (window as any).ipcRenderer?.send('window-close');
    };

    return (
        <div className="flex items-center px-4 h-9 select-none drag bg-transparent">
            {/* Title / Drag Area */}
            <div className="flex-1 text-center text-xs font-medium text-foreground-muted tracking-wider uppercase flex items-center gap-2">
                 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">DEVTOOLS</span>
            </div>

            {/* Window Controls (Windows/Linux style) */}
            <div className="flex items-center gap-2 no-drag">
                <button 
                    onClick={handleMinimize}
                    className="p-1.5 hover:bg-[var(--color-glass-button)] rounded-md transition-colors text-foreground-muted hover:text-foreground"
                    title="Minimize"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleMaximize}
                    className="p-1.5 hover:bg-[var(--color-glass-button)] rounded-md transition-colors text-foreground-muted hover:text-foreground"
                    title="Maximize"
                >
                    <Square className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={handleClose}
                    className="p-1.5 hover:bg-red-500/80 rounded-md transition-colors text-foreground-muted hover:text-white group"
                    title="Close"
                >
                    <X className="w-4 h-4 group-hover:text-white" />
                </button>
            </div>
        </div>
    );
};
