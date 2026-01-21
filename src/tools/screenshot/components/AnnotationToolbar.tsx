import React from 'react';
import {
    ArrowRight,
    Type,
    Square,
    Circle,
    Minus,
    Scissors,
    Eraser,
    Undo2,
    Redo2,
    Trash2,
    Pen,
    BringToFront,
    SendToBack
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { AnnotationType } from '../utils/annotations';
import { cn } from '@utils/cn';

interface AnnotationToolbarProps {
    onUndo?: () => void;
    onRedo?: () => void;
    onClear?: () => void;
    onBringForward?: () => void;
    onSendBackward?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    annotationCount?: number;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
    onUndo,
    onRedo,
    onClear,
    onBringForward,
    onSendBackward,
    canUndo = false,
    canRedo = false,
    annotationCount = 0,
}) => {
    const {
        activeAnnotationTool,
        setActiveAnnotationTool,
        annotationConfig,
        setAnnotationConfig,
        isCropping,
        setIsCropping,
    } = useXnapperStore();

    const tools: Array<{
        type: AnnotationType | 'crop';
        icon: any;
        label: string;
        description: string;
    }> = [
            { type: 'arrow', icon: ArrowRight, label: 'Arrow', description: 'Draw arrows' },
            { type: 'pen', icon: Pen, label: 'Pen', description: 'Free draw' },
            { type: 'text', icon: Type, label: 'Text', description: 'Add text' },
            { type: 'rectangle', icon: Square, label: 'Rectangle', description: 'Draw rectangle' },
            { type: 'circle', icon: Circle, label: 'Circle', description: 'Draw circle' },
            { type: 'line', icon: Minus, label: 'Line', description: 'Draw line' },
            { type: 'blur', icon: Eraser, label: 'Blur', description: 'Blur area' },
            { type: 'crop', icon: Scissors, label: 'Crop', description: 'Crop image' },
        ];

    const colors = [
        '#FF0000', // Red
        '#FF6B00', // Orange
        '#FFD700', // Gold
        '#00FF00', // Green
        '#00BFFF', // Blue
        '#8B00FF', // Purple
        '#FF1493', // Pink
        '#000000', // Black
        '#FFFFFF', // White
    ];

    const strokeWidths = [1, 2, 3, 4, 5, 6, 8, 10];
    const fontSizes = [12, 16, 20, 24, 32, 40, 48, 64];

    const handleToolSelect = (tool: AnnotationType | 'crop') => {
        if (tool === 'crop') {
            setIsCropping(!isCropping);
            setActiveAnnotationTool(null);
        } else {
            setActiveAnnotationTool(tool);
            setIsCropping(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-glass-panel border-b border-border-glass">
            {/* Tools */}
            <div>
                <label className="text-xs font-medium text-foreground-secondary mb-2 block">
                    Tools
                </label>
                <div className="flex flex-wrap gap-2">
                    {tools.map(({ type, icon: Icon, label, description }) => (
                        <button
                            key={type}
                            onClick={() => handleToolSelect(type as AnnotationType | 'crop')}
                            title={description}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm",
                                (type === 'crop' ? isCropping : activeAnnotationTool === type)
                                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50 text-foreground-secondary"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Picker */}
            <div>
                <label className="text-xs font-medium text-foreground-secondary mb-2 block">
                    Color
                </label>
                <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => setAnnotationConfig({ color })}
                            className={cn(
                                "w-8 h-8 rounded-lg border-2 transition-all",
                                annotationConfig.color === color
                                    ? "border-indigo-500 ring-2 ring-indigo-500/50 scale-110"
                                    : "border-border-glass hover:border-indigo-500/50"
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                    <input
                        type="color"
                        value={annotationConfig.color}
                        onChange={(e) => setAnnotationConfig({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-2 border-border-glass"
                        title="Custom color"
                    />
                </div>
            </div>

            {/* Stroke Width */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-foreground-secondary">
                        Stroke Width
                    </label>
                    <span className="text-xs text-foreground-muted">
                        {annotationConfig.strokeWidth}px
                    </span>
                </div>
                <div className="flex gap-2">
                    {strokeWidths.map((width) => (
                        <button
                            key={width}
                            onClick={() => setAnnotationConfig({ strokeWidth: width })}
                            className={cn(
                                "flex-1 py-2 rounded-lg border-2 transition-all text-xs",
                                annotationConfig.strokeWidth === width
                                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50 text-foreground-secondary"
                            )}
                        >
                            {width}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Size (for text tool) */}
            {activeAnnotationTool === 'text' && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-foreground-secondary">
                            Font Size
                        </label>
                        <span className="text-xs text-foreground-muted">
                            {annotationConfig.fontSize}px
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {fontSizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setAnnotationConfig({ fontSize: size })}
                                className={cn(
                                    "flex-1 py-2 rounded-lg border-2 transition-all text-xs",
                                    annotationConfig.fontSize === size
                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                        : "border-border-glass bg-glass-panel hover:border-indigo-500/50 text-foreground-secondary"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-glass">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border-glass mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSendBackward}
                    title="Send Backward ([)"
                >
                    <SendToBack className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBringForward}
                    title="Bring Forward (])"
                >
                    <BringToFront className="w-4 h-4" />
                </Button>
                <div className="flex-1" />
                {annotationCount > 0 && (
                    <span className="text-xs text-foreground-muted">
                        {annotationCount} annotation{annotationCount > 1 ? 's' : ''}
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    disabled={annotationCount === 0}
                    className="text-rose-400 hover:text-rose-300"
                    title="Clear all annotations"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
