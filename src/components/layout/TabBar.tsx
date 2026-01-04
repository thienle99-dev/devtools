import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useToolStore } from '../../store/toolStore';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TOOLS } from '../../tools/registry';
import { TabContextMenu } from '../ui/TabContextMenu';

export const TabBar: React.FC = React.memo(() => {
    const { 
        tabs, 
        activeTabId, 
        setActiveTab, 
        closeTab, 
        closeAllTabs, 
        closeOtherTabs, 
        closeTabsToRight, 
        closeTabsToLeft 
    } = useTabStore();
    const { removeToolData } = useToolStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeTabRef = useRef<HTMLDivElement>(null);
    
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        tabId: string;
    } | null>(null);

    // Get tool icon from registry
    const getToolIcon = useCallback((toolId: string) => {
        const tool = TOOLS.find(t => t.id === toolId);
        return tool?.icon || null;
    }, []);

    // Check scroll position
    const checkScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [tabs, checkScroll]);

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
                container.scrollTo({ left: elementLeft - 8, behavior: 'smooth' });
            } else if (elementLeft + elementWidth > containerScrollLeft + containerWidth) {
                container.scrollTo({ left: elementLeft + elementWidth - containerWidth + 8, behavior: 'smooth' });
            }
            checkScroll();
        }
    }, [activeTabId]);

    // Handle horizontal scroll with wheel
    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
            checkScroll();
        }
    };

    const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        closeTab(tabId);
        removeToolData(tabId);
    };

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            tabId
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleCloseTabFromMenu = (tabId: string) => {
        closeTab(tabId);
        removeToolData(tabId);
    };

    const handleCloseOthersFromMenu = (tabId: string) => {
        const tabsToClose = tabs.filter(t => t.id !== tabId).map(t => t.id);
        closeOtherTabs(tabId);
        tabsToClose.forEach(id => removeToolData(id));
    };

    const handleCloseToRightFromMenu = (tabId: string) => {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const tabsToClose = tabs.slice(tabIndex + 1).map(t => t.id);
        closeTabsToRight(tabId);
        tabsToClose.forEach(id => removeToolData(id));
    };

    const handleCloseToLeftFromMenu = (tabId: string) => {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const tabsToClose = tabs.slice(0, tabIndex).map(t => t.id);
        closeTabsToLeft(tabId);
        tabsToClose.forEach(id => removeToolData(id));
    };

    const handleCloseAllFromMenu = () => {
        const allTabIds = tabs.map(t => t.id);
        closeAllTabs();
        allTabIds.forEach(id => removeToolData(id));
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // Memoize sorted tabs (pinned first, then by order)
    const sortedTabs = useMemo(() => {
        return [...tabs]; // Can add sorting logic here if needed
    }, [tabs]);

    if (tabs.length === 0) return null;

    return (
        <div className="tab-bar-container h-10 flex items-center w-full z-10 shrink-0 select-none relative">
            {/* Left scroll button */}
            {canScrollLeft && (
                <button
                    onClick={scrollLeft}
                    className="tab-scroll-button tab-scroll-button-left absolute left-0 z-20"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            )}

            {/* Tabs container */}
            <div
                ref={scrollContainerRef}
                className="tab-bar-scroll flex items-end h-full overflow-x-auto overflow-y-hidden custom-scrollbar max-w-full"
                onWheel={handleWheel}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="flex items-end h-full">
                    {sortedTabs.map((tab, index) => {
                        const isActive = tab.id === activeTabId;
                        const Icon = getToolIcon(tab.toolId);
                        const isFirst = index === 0;
                        const isLast = index === sortedTabs.length - 1;
                        
                        return (
                            <div
                                key={tab.id}
                                ref={isActive ? activeTabRef : null}
                                onClick={() => setActiveTab(tab.id)}
                                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                                onAuxClick={(e) => {
                                    if (e.button === 1) { // Middle click
                                        e.preventDefault();
                                        handleCloseTab(e, tab.id);
                                    }
                                }}
                                className={cn(
                                    "tab-item-chrome group flex items-center h-9 px-4 cursor-pointer transition-all duration-150",
                                    "min-w-[120px] max-w-[240px] relative",
                                    isActive ? "tab-item-chrome-active" : "tab-item-chrome-inactive",
                                    isFirst && "tab-item-first",
                                    isLast && "tab-item-last"
                                )}
                                title={tab.description || tab.title}
                            >
                                {/* Tool Icon */}
                                {Icon && (
                                    <Icon className={cn(
                                        "w-4 h-4 mr-2 shrink-0",
                                        isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"
                                    )} />
                                )}

                                {/* Tab Title */}
                                <span className={cn(
                                    "text-sm truncate flex-1",
                                    isActive ? "text-foreground font-medium" : "text-foreground-secondary"
                                )}>
                                    {tab.title}
                                </span>

                                {/* Close Button */}
                                <button
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    className={cn(
                                        "tab-close-button-chrome ml-2 shrink-0 rounded-full p-0.5 transition-all duration-150",
                                        "hover:bg-red-500/20"
                                    )}
                                    aria-label="Close tab"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right scroll button */}
            {canScrollRight && (
                <button
                    onClick={scrollRight}
                    className="tab-scroll-button tab-scroll-button-right absolute right-0 z-20"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            {/* Scroll shadows */}
            {canScrollLeft && (
                <div className="tab-scroll-shadow tab-scroll-shadow-left" />
            )}
            {canScrollRight && (
                <div className="tab-scroll-shadow tab-scroll-shadow-right" />
            )}

            {/* Context Menu */}
            {contextMenu && (() => {
                // Memoize calculations to prevent re-renders
                const tabIndex = tabs.findIndex(t => t.id === contextMenu.tabId);
                const isActive = contextMenu.tabId === activeTabId;
                const canCloseLeft = tabIndex > 0;
                const canCloseRight = tabIndex < tabs.length - 1;
                const canCloseOthers = tabs.length > 1;

                return (
                    <TabContextMenu
                        key={contextMenu.tabId} // Key to force remount when tab changes
                        x={contextMenu.x}
                        y={contextMenu.y}
                        tabId={contextMenu.tabId}
                        isActive={isActive}
                        canCloseLeft={canCloseLeft}
                        canCloseRight={canCloseRight}
                        canCloseOthers={canCloseOthers}
                        onClose={handleCloseContextMenu}
                        onCloseTab={() => handleCloseTabFromMenu(contextMenu.tabId)}
                        onCloseOthers={() => handleCloseOthersFromMenu(contextMenu.tabId)}
                        onCloseToRight={() => handleCloseToRightFromMenu(contextMenu.tabId)}
                        onCloseToLeft={() => handleCloseToLeftFromMenu(contextMenu.tabId)}
                        onCloseAll={handleCloseAllFromMenu}
                    />
                );
            })()}
        </div>
    );
});

TabBar.displayName = 'TabBar';
