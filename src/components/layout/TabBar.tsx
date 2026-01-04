import React, { useRef, useEffect } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useToolStore } from '../../store/toolStore';
import { X, FileCode } from 'lucide-react';
import { cn } from '../../utils/cn';

export const TabBar: React.FC = () => {
    const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
    const { removeToolData } = useToolStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeTabRef = useRef<HTMLDivElement>(null);

    // Scroll active tab into view
    useEffect(() => {
        if (activeTabRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = activeTabRef.current;

            const elementLeft = element.offsetLeft;
            const elementWidth = element.offsetWidth;
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;

            if (elementLeft < containerScrollLeft) {
                container.scrollTo({ left: elementLeft, behavior: 'smooth' });
            } else if (elementLeft + elementWidth > containerScrollLeft + containerWidth) {
                container.scrollTo({ left: elementLeft + elementWidth - containerWidth, behavior: 'smooth' });
            }
        }
    }, [activeTabId]);

    // Handle horizontal scroll with wheel
    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleCloseTab = (tabId: string) => {
        closeTab(tabId);
        removeToolData(tabId);
    };

    if (tabs.length === 0) return null;

    return (
        <div className="tab-bar h-10 flex items-center w-full z-10 shrink-0 select-none">
            <div
                ref={scrollContainerRef}
                className="flex items-center h-full px-2 overflow-x-auto overflow-y-hidden custom-scrollbar max-w-full"
                onWheel={handleWheel}
                style={{ scrollbarWidth: 'none' }} // Hide scrollbar for cleaner look, relying on wheel/touch
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                        <div
                            key={tab.id}
                            ref={isActive ? activeTabRef : null}
                            onClick={() => setActiveTab(tab.id)}
                            onAuxClick={(e) => {
                                if (e.button === 1) { // Middle click
                                    e.preventDefault();
                                    handleCloseTab(tab.id);
                                }
                            }}
                            className={cn(
                                "tab-item group flex items-center h-8 px-3 mr-1 min-w-[120px] max-w-[200px] cursor-pointer",
                                isActive ? "tab-item-active" : "tab-item-inactive opacity-70 hover:opacity-100"
                            )}
                            title={tab.description || tab.title}
                        >
                            {/* Icon could be added here if we store it or fetch by toolId */}
                            <FileCode className={cn("w-3.5 h-3.5 mr-2 shrink-0", isActive ? "opacity-100" : "opacity-60")} />

                            <span className="text-xs truncate flex-1">{tab.title}</span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseTab(tab.id);
                                }}
                                className="tab-close-button ml-2"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
            {/* Optional: Add "Right Scroll Shadow" if needed */}
        </div>
    );
};
