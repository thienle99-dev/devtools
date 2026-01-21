import React from 'react';
import { DownloadCloud } from 'lucide-react';

interface DownloadEmptyStateProps {
    searchQuery: string;
}

export const DownloadEmptyState: React.FC<DownloadEmptyStateProps> = ({ searchQuery }) => (
    <div className="group relative flex flex-col items-center justify-center py-32 text-center bg-glass-panel border-2 border-dashed border-border-glass rounded-[40px] animate-in fade-in zoom-in duration-1000 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full animate-pulse-slow" />
            <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <DownloadCloud className="w-14 h-14 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
        </div>

        <h3 className="relative z-10 text-3xl font-black text-foreground-primary mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground-primary to-foreground-primary/60">
            No Downloads Found
        </h3>
        <p className="relative z-10 text-foreground-tertiary max-w-[320px] mx-auto text-base font-medium leading-relaxed opacity-80">
            {searchQuery
                ? "We couldn't find any tasks matching your search criteria. Try a different keyword."
                : "Ready to go? Simply paste a URL here or use the Add Task button to start downloading."}
        </p>

        <div className="absolute top-10 right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />
    </div>
);

DownloadEmptyState.displayName = 'DownloadEmptyState';
