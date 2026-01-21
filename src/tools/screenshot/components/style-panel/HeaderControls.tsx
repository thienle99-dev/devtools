import React from 'react';
import { Sparkles, ZoomOut, ZoomIn, RotateCcw } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { useXnapperStore } from '@store/xnapperStore';
import type { CanvasPreviewHandle } from '../../types';

interface HeaderControlsProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
    zoom: number;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({ canvasRef, zoom }) => {
    const autoBalance = useXnapperStore(state => state.autoBalance);
    const setAutoBalance = useXnapperStore(state => state.setAutoBalance);

    const handleZoom = (action: 'in' | 'out' | 'reset') => {
        const canvas = canvasRef?.current;
        if (!canvas) return;

        if (action === 'in') canvas.zoomIn?.();
        if (action === 'out') canvas.zoomOut?.();
        if (action === 'reset') canvas.resetZoom?.();
    };

    const ControlButton = ({
        icon: Icon,
        title,
        action,
    }: {
        icon: React.ElementType;
        title: string;
        action: 'in' | 'out' | 'reset';
    }) => (
        <button
            className="p-1.5 rounded transition-colors hover:bg-[var(--color-glass-button-hover)]"
            onClick={() => handleZoom(action)}
            title={title}
        >
            <Icon className="w-3.5 h-3.5 text-foreground-secondary" />
        </button>
    );

    return (
        <div className="p-5 border-b border-border-glass space-y-4 bg-gradient-to-br from-glass-panel to-transparent">
            <div className="flex items-center justify-between">
                <Button
                    variant={autoBalance ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setAutoBalance(!autoBalance)}
                    className={cn(
                        "flex-1 mr-3 gap-2 text-xs font-bold transition-all duration-200",
                        autoBalance
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                            : "hover:scale-105"
                    )}
                >
                    <Sparkles className={cn("w-4 h-4", autoBalance && "animate-pulse")} />
                    Auto-balance
                </Button>

                <div className="flex items-center gap-1 border border-border-glass rounded-lg p-0.5 bg-background/20">
                    <ControlButton icon={ZoomOut} title="Zoom Out" action="out" />
                    <span className="text-[10px] w-8 text-center tabular-nums text-foreground-muted">
                        {Math.round(zoom * 100)}%
                    </span>
                    <ControlButton icon={ZoomIn} title="Zoom In" action="in" />
                    <div className="border-l border-border-glass ml-0.5 pl-0.5">
                        <ControlButton icon={RotateCcw} title="Reset Zoom" action="reset" />
                    </div>
                </div>
            </div>
        </div>
    );
};
