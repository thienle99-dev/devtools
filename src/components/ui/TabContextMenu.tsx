import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Layers, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

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
    const [position, setPosition] = useState({ left: x, top: y });

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('scroll', onClose, { capture: true });
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', onClose);

        return () => {
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

            setPosition({ left: adjustedX, top: adjustedY });
        }
    }, [x, y]);

    return createPortal(
        <>
            {/* Transparent overlay for click-away */}
            <div
                className="fixed inset-0 z-[9998]"
                onMouseDown={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />

            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="fixed z-[9999] min-w-[220px] glass-panel rounded-2xl py-1.5 text-[11px] font-sans select-none overflow-hidden flex flex-col shadow-2xl border border-white/10 dark:border-white/5"
                style={{
                    left: `${position.left}px`,
                    top: `${position.top}px`,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)' // Fallback for light mode
                }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="px-3 py-1.5 mb-1 border-b border-border-glass/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground-muted/60">Tab Actions</span>
                </div>

                <MenuItem
                    onClick={onCloseTab}
                    onCloseMenu={onClose}
                    icon={X}
                    label="Close Tab"
                    shortcut="Ctrl+W"
                />

                {canCloseOthers && (
                    <MenuItem
                        onClick={onCloseOthers}
                        onCloseMenu={onClose}
                        icon={Layers}
                        label="Close Other Tabs"
                    />
                )}

                {(canCloseLeft || canCloseRight) && <div className="h-px bg-border-glass/50 my-1 mx-2" />}

                {canCloseRight && (
                    <MenuItem
                        onClick={onCloseToRight}
                        onCloseMenu={onClose}
                        icon={ChevronRight}
                        label="Close Tabs to the Right"
                    />
                )}

                {canCloseLeft && (
                    <MenuItem
                        onClick={onCloseToLeft}
                        onCloseMenu={onClose}
                        icon={ChevronLeft}
                        label="Close Tabs to the Left"
                    />
                )}

                <div className="h-px bg-border-glass/50 my-1 mx-2" />

                <MenuItem
                    onClick={onCloseAll}
                    onCloseMenu={onClose}
                    icon={MinusCircle}
                    label="Close All Tabs"
                    variant="danger"
                />
            </motion.div>
        </>,
        document.body
    );
};

interface MenuItemProps {
    onClick: () => void;
    onCloseMenu: () => void;
    icon: React.ElementType;
    label: string;
    shortcut?: string;
    variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({ onClick, onCloseMenu, icon: Icon, label, shortcut, variant = 'default' }) => {
    return (
        <button
            onClick={() => {
                onClick();
                onCloseMenu();
            }}
            className={cn(
                "w-full px-3 py-2 text-left flex items-center justify-between group transition-all duration-200 outline-none",
                variant === 'danger'
                    ? "text-rose-500 hover:bg-rose-500/10"
                    : "text-foreground-secondary hover:text-indigo-400 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10"
            )}
        >
            <div className="flex items-center gap-2.5">
                <Icon className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110",
                    variant === 'danger' ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                )} />
                <span className="font-bold tracking-tight">{label}</span>
            </div>
            {shortcut && (
                <span className="text-[9px] font-mono opacity-30 group-hover:opacity-50 transition-opacity">
                    {shortcut}
                </span>
            )}
        </button>
    );
};

