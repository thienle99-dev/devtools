import { Search } from 'lucide-react';

export const EmptySearch = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-foreground/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-4 border border-border-glass">
            <Search className="w-8 h-8 text-foreground-muted/20" />
        </div>
        <h4 className="text-xs font-black uppercase tracking-widest text-foreground-muted mb-1">No Results</h4>
        <p className="text-[10px] text-foreground-muted/40 italic">Try searching for something else</p>
    </div>
);
