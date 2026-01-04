import React from 'react';
import { ClipboardItem } from '../../../store/clipboardStore';
import { ClipboardItemCard } from './ClipboardItemCard';
import { Clipboard } from 'lucide-react';

interface ClipboardListProps {
    items: ClipboardItem[];
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
    onDelete: (id: string) => void;
    onViewFull: (item: ClipboardItem) => void;
}

export const ClipboardList: React.FC<ClipboardListProps> = ({
    items,
    onPin,
    onUnpin,
    onDelete,
    onViewFull,
}) => {
    const pinnedItems = items.filter(item => item.pinned);
    const recentItems = items.filter(item => !item.pinned);

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
        <div className="space-y-6">
            {/* Pinned Items */}
            {pinnedItems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                        📌 Pinned Items ({pinnedItems.length})
                    </h3>
                    <div className="space-y-3">
                        {pinnedItems.map(item => (
                            <ClipboardItemCard
                                key={item.id}
                                item={item}
                                onPin={onPin}
                                onUnpin={onUnpin}
                                onDelete={onDelete}
                                onViewFull={onViewFull}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Items */}
            {recentItems.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">
                        Recent Items ({recentItems.length})
                    </h3>
                    <div className="space-y-3">
                        {recentItems.map(item => (
                            <ClipboardItemCard
                                key={item.id}
                                item={item}
                                onPin={onPin}
                                onUnpin={onUnpin}
                                onDelete={onDelete}
                                onViewFull={onViewFull}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
