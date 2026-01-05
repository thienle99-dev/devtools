import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, XCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface TabContextMenuProps {
    x: number;
    y: number;
    tabId: string;
    isActive: boolean;
    canCloseLeft: boolean;
    canCloseRight: boolean;
    canCloseOthers: boolean;
    onClose: () => void;
    onCloseTab: () => void;
    onCloseOthers: () => void;
    onCloseToRight: () => void;
    onCloseToLeft: () => void;
    onCloseAll: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
    x,
    y,
    canCloseLeft,
    canCloseRight,
    canCloseOthers,
    onClose,
    onCloseTab,
    onCloseOthers,
    onCloseToRight,
    onCloseToLeft,
    onCloseAll,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Use setTimeout to avoid immediate close if the click originated the menu
        const timeoutId = setTimeout(() => {
             document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        
        document.addEventListener('scroll', onClose, { capture: true }); // Close on scroll
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', onClose);

        return () => {
             clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', onClose, { capture: true });
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = x;
            let adjustedY = y;

            if (x + rect.width > viewportWidth) {
                adjustedX = viewportWidth - rect.width - 8;
            }
            if (y + rect.height > viewportHeight) {
                adjustedY = viewportHeight - rect.height - 8;
            }

            menuRef.current.style.left = `${adjustedX}px`;
            menuRef.current.style.top = `${adjustedY}px`;
        }
    }, [x, y]);

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[180px] glass-panel rounded-lg py-1 text-sm font-sans select-none overflow-hidden flex flex-col"
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <button
                onClick={() => {
                    onCloseTab();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-foreground hover:bg-[var(--color-glass-button-hover)] flex items-center gap-2 transition-colors duration-150"
            >
                <X className="w-4 h-4 opacity-70" />
                <span>Close Tab</span>
            </button>

            {canCloseOthers && (
                <button
                    onClick={() => {
                        onCloseOthers();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-foreground hover:bg-[var(--color-glass-button-hover)] flex items-center gap-2 transition-colors duration-150"
                >
                    <XCircle className="w-4 h-4 opacity-70" />
                    <span>Close Other Tabs</span>
                </button>
            )}

            {canCloseRight && (
                <button
                    onClick={() => {
                        onCloseToRight();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-foreground hover:bg-[var(--color-glass-button-hover)] flex items-center gap-2 transition-colors duration-150"
                >
                    <ChevronRight className="w-4 h-4 opacity-70" />
                    <span>Close Tabs to the Right</span>
                </button>
            )}

            {canCloseLeft && (
                <button
                    onClick={() => {
                        onCloseToLeft();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-foreground hover:bg-[var(--color-glass-button-hover)] flex items-center gap-2 transition-colors duration-150"
                >
                    <ChevronLeft className="w-4 h-4 opacity-70" />
                    <span>Close Tabs to the Left</span>
                </button>
            )}

            <div className="h-px bg-[var(--color-glass-border)] my-1" />

            <button
                onClick={() => {
                    onCloseAll();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-foreground hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 transition-colors duration-150 group"
            >
                <XCircle className="w-4 h-4 opacity-70 group-hover:text-red-500" />
                <span>Close All Tabs</span>
            </button>
        </div>,
        document.body
    );
};

