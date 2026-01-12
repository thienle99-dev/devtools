import React from 'react';
import { Package, Users, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '@utils/cn';
import type { AppFilterType } from '../../../types/application-manager';

interface AppTypeFilterProps {
    filter: AppFilterType;
    onFilterChange: (filter: AppFilterType) => void;
    counts: {
        all: number;
        user: number;
        system: number;
    };
}

export const AppTypeFilter: React.FC<AppTypeFilterProps> = ({ filter, onFilterChange, counts }) => {
    const filters: Array<{ id: AppFilterType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
        { id: 'all', label: 'All', icon: Package },
        { id: 'user', label: 'User', icon: Users },
        { id: 'system', label: 'System', icon: Shield },
    ];

    return (
        <div className="flex items-center gap-2">
            {filters.map((f) => {
                const Icon = f.icon;
                const count = counts[f.id];
                return (
                    <Button
                        key={f.id}
                        variant={filter === f.id ? "primary" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange(f.id)}
                        className={cn(
                            "text-xs",
                            filter === f.id && "shadow-lg shadow-indigo-500/20"
                        )}
                    >
                        <Icon className="w-3 h-3 mr-1.5" />
                        {f.label}
                        {count > 0 && (
                            <span className={cn(
                                "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                filter === f.id 
                                    ? "bg-white/20 text-white" 
                                    : "bg-foreground-muted/20 text-foreground-muted"
                            )}>
                                {count}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div>
    );
};

