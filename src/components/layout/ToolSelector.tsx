
import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { TOOLS } from '../../tools/registry/tools';
import type { ToolDefinition } from '../../tools/registry/types';
import { Search } from 'lucide-react';

interface ToolSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tool: ToolDefinition) => void;
    title?: string;
    compatibleInputType?: string;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Select Tool",
    compatibleInputType
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTools = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return TOOLS.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.category.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            if (compatibleInputType) {
                // If the tool explicitly supports 'any' input, or the specific type
                if (tool.inputTypes?.includes('any')) return true;
                if (tool.inputTypes?.includes(compatibleInputType as any)) return true;
                
                // Fallback: If no inputTypes defined, assume not compatible for strict typing
                // But if we want to be lenient for now while migrating:
                // return false; 
                
                // For now, strict:
                return false;
            }

            return true;
        });
    }, [searchQuery, compatibleInputType]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
            className="max-h-[80vh]"
        >
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                    {filteredTools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                onSelect(tool);
                                onClose();
                            }}
                            className="flex items-start space-x-3 p-3 rounded-lg text-left hover:bg-accent/10 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group"
                        >
                            <div className="p-2 rounded-md bg-secondary/20 text-primary group-hover:scale-110 transition-transform">
                                <tool.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">{tool.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                            </div>
                        </button>
                    ))}

                    {filteredTools.length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                            No tools found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
