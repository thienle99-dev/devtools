import React from 'react';
import { cn } from '@utils/cn';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div 
            className={cn(
                "animate-pulse bg-white/5 rounded-lg",
                className
            )} 
        />
    );
};

export const ToolSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="w-48 h-6" />
                    <Skeleton className="w-64 h-4" />
                </div>
            </div>
            
            <div className="space-y-4">
                <Skeleton className="w-full h-32 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="w-full h-24 rounded-2xl" />
                    <Skeleton className="w-full h-24 rounded-2xl" />
                </div>
                <Skeleton className="w-full h-64 rounded-2xl" />
            </div>
        </div>
    );
};
