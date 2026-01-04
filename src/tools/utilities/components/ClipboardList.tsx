import React from 'react';
import type { ClipboardItem } from '../../../store/clipboardStore';
import { ClipboardItemCard } from './ClipboardItemCard';
import { Clipboard } from 'lucide-react';

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
    
    // Flatten items for index calculation (pinned first, then recent)
    const allItems = [...pinnedItems, ...recentItems];

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-6 bg-surface-elevated rounded-full mb-4">
                    <Clipboard className="w-12 h-12 text-foreground-muted" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    No clipboard items yet
                </h3>
                <p className="text-sm text-foreground-muted max-w-md">
                    Copy some text using the quick copy section above, or enable clipboard monitoring in settings to automatically track your clipboard.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Pinned Items */}
            {pinnedItems.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                        📌 Pinned Items ({pinnedItems.length})
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-[0.2em] pl-2">
                        Recent Items ({recentItems.length})
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
