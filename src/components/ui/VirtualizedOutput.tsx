import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '../../utils/cn';

interface VirtualizedOutputProps {
    content: string;
    className?: string;
    language?: string;
}

export const VirtualizedOutput: React.FC<VirtualizedOutputProps> = ({ content, className }) => {
    // Split content into lines for virtualization
    // For very large content, this split itself might be expensive, 
    // but usually it's fine for < 10MB strings. 
    // For extremely large strings, we'd need a chunking strategy or stream.
    const lines = React.useMemo(() => content.split('\n'), [content]);

    return (
        <div className={cn("h-full w-full", className)}>
            <Virtuoso
                style={{ height: '100%', width: '100%' }}
                totalCount={lines.length}
                itemContent={(index) => (
                    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed px-1 font-variant-ligatures-none">
                        {lines[index] || '\u00A0'} 
                    </div>
                )}
                components={{
                    Scroller: React.forwardRef((props, ref) => (
                        <div 
                            {...props} 
                            ref={ref} 
                            className="overflow-y-auto custom-scrollbar" 
                        />
                    ))
                }}
            />
        </div>
    );
};
