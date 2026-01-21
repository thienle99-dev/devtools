import React from 'react';
import { Sparkles } from 'lucide-react';
import { AnnotationToolbar } from '../AnnotationToolbar';
import type { CanvasPreviewHandle } from '../../types';

interface AnnotateTabContentProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
    historyState?: {
        canUndo: boolean;
        canRedo: boolean;
        count: number;
    };
}

export const AnnotateTabContent: React.FC<AnnotateTabContentProps> = ({
    canvasRef,
    historyState = { canUndo: false, canRedo: false, count: 0 },
}) => {
    return (
        <div className="flex-1 overflow-y-auto outline-none">
            <div className="p-5 pt-2 space-y-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-sm font-bold text-indigo-300">Annotation Mode</h4>
                    </div>
                    <p className="text-xs text-indigo-400/80 leading-relaxed pl-10">
                        Select tools below to draw on your screenshot. Add arrows, text, shapes, and more!
                    </p>
                </div>
                <AnnotationToolbar
                    onUndo={() => canvasRef?.current?.undo()}
                    onRedo={() => canvasRef?.current?.redo()}
                    onClear={() => canvasRef?.current?.clear()}
                    onBringForward={() => canvasRef?.current?.bringForward?.()}
                    onSendBackward={() => canvasRef?.current?.sendBackward?.()}
                    canUndo={historyState.canUndo}
                    canRedo={historyState.canRedo}
                    annotationCount={historyState.count}
                />
            </div>
        </div>
    );
};
