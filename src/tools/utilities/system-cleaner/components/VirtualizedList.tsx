import React, { useMemo, useRef, useState } from 'react';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
}

/**
 * Virtual scrolling component for large lists
 */
export function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex + 1);
    }, [items, startIndex, endIndex]);

    const offsetY = startIndex * itemHeight;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    return (
        <div
            ref={containerRef}
            style={{
                height: containerHeight,
                overflow: 'auto',
            }}
            onScroll={handleScroll}
            className="custom-scrollbar"
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    {visibleItems.map((item, index) => (
                        <div
                            key={startIndex + index}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

