import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

/**
 * Windows/Linux-style window controls
 * Shows minimize, maximize, and close buttons on the right
 */
export const WindowsWindowControls: React.FC = () => {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const handleMaximized = (_event: any, state: boolean) => {
            setIsMaximized(state);
        };

        const ipcRenderer = (window as any).ipcRenderer;
        if (ipcRenderer) {
            const removeListener = ipcRenderer.on('window-maximized', handleMaximized);
            return () => {
                if (typeof removeListener === 'function') {
                    removeListener();
                }
            };
        }
    }, []);

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
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    DEVTOOLS
                </span>
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
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <Copy className="w-3.5 h-3.5 rotate-180" /> // Approximate restore icon
                    ) : (
                        <Square className="w-3.5 h-3.5" />
                    )}
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
