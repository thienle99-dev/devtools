import React from 'react';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Sun, Moon, Laptop, Droplets, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@utils/cn';
import { CATEGORIES } from '../../tools/registry';
import { toast } from 'sonner';

export interface AppearanceTabProps {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    layoutMode: 'comfortable' | 'compact' | 'dense';
    setLayoutMode: (mode: 'comfortable' | 'compact' | 'dense') => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
    glassIntensity: number;
    setGlassIntensity: (intensity: number) => void;
    blurEnabled: boolean;
    setBlurEnabled: (enabled: boolean) => void;
    categoryOrder: string[];
    setCategoryOrder: (order: string[]) => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
    theme, setTheme,
    layoutMode, setLayoutMode,
    accentColor, setAccentColor,
    glassIntensity, setGlassIntensity,
    blurEnabled, setBlurEnabled,
    categoryOrder, setCategoryOrder
}) => {
    const currentOrder = categoryOrder.length > 0 ? categoryOrder : CATEGORIES.map(c => c.id);

    const moveCategory = (id: string, direction: 'up' | 'down') => {
        const index = currentOrder.indexOf(id);
        if (index === -1) return;

        const newOrder = [...currentOrder];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        setCategoryOrder(newOrder);
        toast.success(`Moved category ${direction}`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Appearance & UI</h2>

            <Card className="p-1">
                <div className="flex items-center justify-between p-4 border-b border-border-glass">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Theme</p>
                        <p className="text-xs text-foreground-muted">Choose your preferred interface style</p>
                    </div>
                    <div className="flex bg-[var(--color-glass-input)] p-1 rounded-xl border border-border-glass">
                        {[
                            { id: 'light', icon: Sun, label: 'Light' },
                            { id: 'dark', icon: Moon, label: 'Dark' },
                            { id: 'system', icon: Laptop, label: 'System' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id as any)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${theme === t.id
                                    ? 'bg-bg-glass-hover text-foreground shadow-lg shadow-black/5'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button-hover)]'
                                    }`}
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-border-glass">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Layout Density</p>
                        <p className="text-xs text-foreground-muted">Adjust the compactness of the interface</p>
                    </div>
                    <div className="flex bg-[var(--color-glass-input)] p-1 rounded-xl border border-border-glass">
                        {[
                            { id: 'comfortable', label: 'Comfortable' },
                            { id: 'compact', label: 'Compact' },
                            { id: 'dense', label: 'Dense' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setLayoutMode(mode.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${layoutMode === mode.id
                                    ? 'bg-bg-glass-hover text-foreground shadow-lg shadow-black/5'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button-hover)]'
                                    }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-border-glass">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Accent Color</p>
                        <p className="text-xs text-foreground-muted">Choose a color for highlights and buttons</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[
                            '#6366f1', // indigo
                            '#8b5cf6', // violet
                            '#ec4899', // pink
                            '#f43f5e', // rose
                            '#f59e0b', // amber
                            '#10b981', // emerald
                            '#06b6d4', // cyan
                            '#3b82f6', // blue
                        ].map((color) => (
                            <button
                                key={color}
                                onClick={() => setAccentColor(color)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95",
                                    accentColor === color ? "border-white scale-110 shadow-lg" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="w-px h-6 bg-border-glass mx-2" />
                        <Input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex flex-col p-4 border-b border-border-glass">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Glass Intensity</p>
                            <p className="text-xs text-foreground-muted">Transparency and blur of panels</p>
                        </div>
                        <span className="text-xs font-mono text-indigo-400">{(glassIntensity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={glassIntensity}
                        onChange={(e) => setGlassIntensity(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-glass-panel rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: accentColor }}
                    />
                </div>

                <div className="flex items-center justify-between p-4 border-b border-border-glass">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Droplets className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Blur Effects</p>
                            <p className="text-xs text-foreground-muted">Enable background blur for glass effect (GPU intensive)</p>
                        </div>
                    </div>
                    <Switch
                        checked={blurEnabled}
                        onChange={(e) => setBlurEnabled(e.target.checked)}
                    />
                </div>

                <div className="p-4">
                    <p className="text-sm font-semibold text-foreground mb-4">Sidebar Categories Order</p>
                    <div className="space-y-1">
                        {currentOrder.map((catId: string, idx: number) => {
                            const category = CATEGORIES.find(c => c.id === catId);
                            if (!category) return null;
                            return (
                                <div key={catId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border-glass group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-1.5 h-4 rounded-full bg-current opacity-60", category.color || "text-foreground-muted")} />
                                        <span className="text-sm font-medium text-foreground">{category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => moveCategory(catId, 'up')}
                                            disabled={idx === 0}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground-muted disabled:opacity-30"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveCategory(catId, 'down')}
                                            disabled={idx === currentOrder.length - 1}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground-muted disabled:opacity-30"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryOrder([])}
                        className="mt-4 text-[10px] uppercase tracking-widest text-foreground-muted hover:text-foreground"
                    >
                        Reset Order to Default
                    </Button>
                </div>
            </Card>
        </div>
    );
};
