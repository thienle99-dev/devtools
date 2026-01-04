import React, { useEffect, useRef } from 'react';
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

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport - only run once on mount
    useEffect(() => {
        if (menuRef.current) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (!menuRef.current) return;
                
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
            });
        }
        // Only run once when component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={menuRef}
            className="tab-context-menu fixed z-50 min-w-[180px] bg-white dark:bg-[#2d2e30] border border-[#dadce0] dark:border-[#3c4043] rounded-lg shadow-lg py-1"
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => {
                    onCloseTab();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-2 transition-colors"
            >
                <X className="w-4 h-4" />
                <span>Close Tab</span>
            </button>

            {canCloseOthers && (
                <button
                    onClick={() => {
                        onCloseOthers();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-2 transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                    <span>Close Other Tabs</span>
                </button>
            )}

            {canCloseRight && (
                <button
                    onClick={() => {
                        onCloseToRight();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-2 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                    <span>Close Tabs to the Right</span>
                </button>
            )}

            {canCloseLeft && (
                <button
                    onClick={() => {
                        onCloseToLeft();
                        onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-2 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Close Tabs to the Left</span>
                </button>
            )}

            <div className="border-t border-[#dadce0] dark:border-[#3c4043] my-1" />

            <button
                onClick={() => {
                    onCloseAll();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-2 transition-colors"
            >
                <XCircle className="w-4 h-4" />
                <span>Close All Tabs</span>
            </button>
        </div>
    );
};

