import React, { createContext, useContext } from 'react';
import { cn } from '../../utils/cn';

interface TabsContextType {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabsContext must be used within Tabs component');
    }
    return context;
};

export interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
    return (
        <div className={cn('flex gap-2', className)}>
            {children}
        </div>
    );
};

export interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className }) => {
    const { value: activeValue, onValueChange } = useTabs();
    const isActive = activeValue === value;

    return (
        <button
            onClick={() => onValueChange(value)}
            className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-glass-panel text-foreground hover:bg-glass-panel/80 border border-border-glass',
                className
            )}
        >
            {children}
        </button>
    );
};

export interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className }) => {
    const { value: activeValue } = useTabs();

    if (activeValue !== value) {
        return null;
    }

    return (
        <div className={className}>
            {children}
        </div>
    );
};
