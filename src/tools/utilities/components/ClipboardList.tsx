import React from 'react';
import type { ClipboardItem } from '../../../store/clipboardStore';
import { ClipboardItemCard } from './ClipboardItemCard';
import { Clipboard, Sparkles, Pin } from 'lucide-react';

interface ClipboardListProps {
    items: ClipboardItem[];
    selectedIndex?: number;
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
    onDelete: (id: string) => void;
    onViewFull: (item: ClipboardItem) => void;
    onSelect?: (index: number) => void;
}

export const ClipboardList: React.FC<ClipboardListProps> = ({
    items,
    selectedIndex = -1,
    onPin,
    onUnpin,
    onDelete,
    onViewFull,
    onSelect,
}) => {
    const pinnedItems = items.filter(item => item.pinned);
    const recentItems = items.filter(item => !item.pinned);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 glass-panel rounded-xl mb-4 border border-border/50">
                    <Clipboard className="w-12 h-12 text-foreground-muted" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                    No clipboard items yet
                </h3>
                <p className="text-xs text-foreground-muted max-w-md leading-relaxed">
                    Copy some text using the quick copy section above, or enable clipboard monitoring in settings.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Pinned Items */}
            {pinnedItems.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <Pin className="w-3 h-3 text-accent" />
                        <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.15em]">
                            Pinned ({pinnedItems.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {pinnedItems.map((item, index) => (
                            <div
                                key={item.id}
                                data-item-index={index}
                                onClick={() => onSelect?.(index)}
                                className="w-full"
                            >
                                <ClipboardItemCard
                                    item={item}
                                    isSelected={selectedIndex === index}
                                    onPin={onPin}
                                    onUnpin={onUnpin}
                                    onDelete={onDelete}
                                    onViewFull={onViewFull}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Items */}
            {recentItems.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                        <Sparkles className="w-3 h-3 text-foreground-muted" />
                        <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.15em]">
                            Recent ({recentItems.length})
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {recentItems.map((item, index) => {
                            const globalIndex = pinnedItems.length + index;
                            return (
                                <div
                                    key={item.id}
                                    data-item-index={globalIndex}
                                    onClick={() => onSelect?.(globalIndex)}
                                    className="w-full"
                                >
                                    <ClipboardItemCard
                                        item={item}
                                        isSelected={selectedIndex === globalIndex}
                                        onPin={onPin}
                                        onUnpin={onUnpin}
                                        onDelete={onDelete}
                                        onViewFull={onViewFull}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
