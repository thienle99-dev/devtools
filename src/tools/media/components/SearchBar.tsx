
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Loader2 } from 'lucide-react';

interface SearchBarProps {
    url: string;
    onUrlChange: (url: string) => void;
    onClear: () => void;
    onFetch: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    url,
    onUrlChange,
    onClear,
    onFetch,
    isLoading,
    disabled
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dropped = e.dataTransfer.getData('text');
        if (dropped) {
            onUrlChange(dropped);
        }
    };

    return (
        <Card 
            className={`p-6 bg-glass-panel border-border-glass transition-all ${
                isDragOver ? 'border-red-500 ring-2 ring-red-500/20 bg-red-500/5' : ''
            }`}
            onDragOver={(e: React.DragEvent) => {
                e.preventDefault();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            <label className="block text-sm font-medium text-foreground-primary mb-2 flex items-center gap-2">
                YouTube URL
                {isLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching info...
                    </span>
                )}
            </label>
            <div className="flex gap-2">
                <Input
                    type="text"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onFetch();
                        if (e.key === 'Escape') onClear();
                    }}
                    placeholder="https://www.youtube.com/watch?v=... (or drop link here)"
                    className="flex-1 h-12 text-base w-full"
                    disabled={disabled}
                    fullWidth
                />
                <Button
                    onClick={onClear}
                    variant="outline"
                    disabled={!url || disabled}
                    className="h-12 px-6"
                >
                    Clear
                </Button>
            </div>
        </Card>
    );
};
