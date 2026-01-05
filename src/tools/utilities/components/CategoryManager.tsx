import React, { useState } from 'react';
import { X, Plus, Tag, Trash2 } from 'lucide-react';
import { useClipboardStore } from '../../../store/clipboardStore';
import { Button } from '../../../components/ui/Button';

interface CategoryManagerProps {
    itemId?: string; // If provided, manage categories for specific item
    onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ itemId, onClose }) => {
    const availableCategories = useClipboardStore((state) => state.availableCategories);
    const items = useClipboardStore((state) => state.items);
    const addCategory = useClipboardStore((state) => state.addCategory);
    const removeCategory = useClipboardStore((state) => state.removeCategory);
    const addItemToCategory = useClipboardStore((state) => state.addItemToCategory);
    const removeItemFromCategory = useClipboardStore((state) => state.removeItemFromCategory);

    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    const currentItem = itemId ? items.find(item => item.id === itemId) : null;
    const itemCategories = currentItem?.categories || [];

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            setError('Category name cannot be empty');
            return;
        }

        if (availableCategories.includes(newCategory.trim())) {
            setError('Category already exists');
            return;
        }

        addCategory(newCategory.trim());
        setNewCategory('');
        setError('');
    };

    const handleToggleItemCategory = (category: string) => {
        if (!itemId) return;

        if (itemCategories.includes(category)) {
            removeItemFromCategory(itemId, category);
        } else {
            addItemToCategory(itemId, category);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-2xl max-h-[80vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Tag className="w-5 h-5 text-accent" />
                            {itemId ? 'Manage Item Categories' : 'Manage Categories'}
                        </h2>
                        <p className="text-sm text-foreground-muted mt-1">
                            {itemId ? 'Add or remove categories for this item' : 'Create and manage your categories'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        {/* Add New Category */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                Add New Category
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded-lg 
                                             text-foreground placeholder-foreground-muted text-sm
                                             focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                                             transition-all"
                                    placeholder="e.g., Work, Personal, Important..."
                                    value={newCategory}
                                    onChange={(e) => {
                                        setNewCategory(e.target.value);
                                        setError('');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddCategory();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 
                                             transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}
                        </div>

                        {/* Available Categories */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {itemId ? 'Available Categories' : 'All Categories'} ({availableCategories.length})
                            </label>

                            {availableCategories.length === 0 ? (
                                <div className="p-8 text-center bg-surface-elevated border border-border rounded-lg">
                                    <Tag className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                                    <p className="text-sm text-foreground-muted">
                                        No categories yet. Create your first category above.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availableCategories.map((category) => {
                                        const isSelected = itemCategories.includes(category);
                                        const itemCount = items.filter(item =>
                                            item.categories?.includes(category)
                                        ).length;

                                        return (
                                            <div
                                                key={category}
                                                className={`p-3 border rounded-lg transition-all ${itemId
                                                        ? isSelected
                                                            ? 'bg-accent/10 border-accent cursor-pointer hover:bg-accent/20'
                                                            : 'bg-surface-elevated border-border cursor-pointer hover:border-accent/50'
                                                        : 'bg-surface-elevated border-border'
                                                    }`}
                                                onClick={() => itemId && handleToggleItemCategory(category)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Tag className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-accent' : 'text-foreground-muted'
                                                            }`} />
                                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-accent' : 'text-foreground'
                                                            }`}>
                                                            {category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-foreground-muted">
                                                            {itemCount}
                                                        </span>
                                                        {!itemId && (
                                                            <button
                                                                onClick={() => removeCategory(category)}
                                                                className="p-1 rounded hover:bg-red-500/10 text-foreground-muted 
                                                                         hover:text-red-500 transition-colors"
                                                                title="Delete category"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Selected Categories (for item mode) */}
                        {itemId && itemCategories.length > 0 && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground">
                                    Selected Categories ({itemCategories.length})
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {itemCategories.map((category) => (
                                        <div
                                            key={category}
                                            className="px-3 py-1.5 bg-accent/10 border border-accent rounded-full 
                                                     flex items-center gap-2 text-sm text-accent"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {category}
                                            <button
                                                onClick={() => removeItemFromCategory(itemId, category)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
