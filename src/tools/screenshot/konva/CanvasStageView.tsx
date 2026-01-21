import React from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import type { AnnotationType } from '../types';
import type { ShapeData } from './types';
import { URLImage, ShapeItem } from './ShapeItems';

interface CanvasStageViewProps {
    containerRef: React.RefObject<HTMLDivElement>;
    stageRef: React.MutableRefObject<any>;
    transformerRef: React.MutableRefObject<any>;
    baseDataUrl: string | null;
    imageSize: { width: number; height: number };
    scale: number;
    baseZoom: number;
    shapes: ShapeData[];
    selectedId: string | null;
    editingShape: string | null;
    activeAnnotationTool: AnnotationType | null;
    onMouseDown: (e: any) => void;
    onMouseMove: (e: any) => void;
    onMouseUp: (e: any) => void;
    onSelectShape: (id: string | null) => void;
    onDragEnd: (e: any) => void;
    onTransformEnd: (e: any) => void;
    onTextDblClick: (e: any, id: string) => void;
    onTextChange: (id: string, text: string) => void;
    onTextCommit: () => void;
    onTextCancel: () => void;
}

export const CanvasStageView: React.FC<CanvasStageViewProps> = ({
    containerRef,
    stageRef,
    transformerRef,
    baseDataUrl,
    imageSize,
    scale,
    baseZoom,
    shapes,
    selectedId,
    editingShape,
    activeAnnotationTool,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onSelectShape,
    onDragEnd,
    onTransformEnd,
    onTextDblClick,
    onTextChange,
    onTextCommit,
    onTextCancel,
}) => {
    if (!baseDataUrl) {
        return <div className="flex items-center justify-center h-full text-foreground-muted">Preparing canvas...</div>;
    }

    const width = imageSize.width * scale * baseZoom;
    const height = imageSize.height * scale * baseZoom;
    const editingShapeData = editingShape ? shapes.find(s => s.id === editingShape && s.type === 'text') : null;
    const currentScale = scale * baseZoom;

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
        >
            <div style={{ position: 'relative', width, height }}>
                <Stage
                    ref={stageRef}
                    width={width}
                    height={height}
                    scaleX={currentScale}
                    scaleY={currentScale}
                    onMouseDown={onMouseDown}
                    onTouchStart={onMouseDown}
                    onMouseMove={onMouseMove}
                    onTouchMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onTouchEnd={onMouseUp}
                    style={{
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                >
                    <Layer>
                        <URLImage
                            src={baseDataUrl}
                            width={imageSize.width}
                            height={imageSize.height}
                        />
                    </Layer>
                    <Layer>
                        {shapes.map((shape) => (
                            <ShapeItem
                                key={shape.id}
                                shape={shape}
                                isSelected={selectedId === shape.id}
                                isEditing={editingShape === shape.id}
                                activeTool={activeAnnotationTool}
                                onSelect={onSelectShape}
                                onTextDblClick={onTextDblClick}
                                onDragEnd={onDragEnd}
                                onTransformEnd={onTransformEnd}
                            />
                        ))}
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                            anchorSize={10}
                            anchorCornerRadius={5}
                            anchorStroke="#6366f1"
                            anchorFill="#ffffff"
                            anchorStrokeWidth={2}
                            borderStroke="#6366f1"
                            borderStrokeWidth={2}
                            rotateAnchorOffset={24}
                            keepRatio={false}
                        />
                    </Layer>
                </Stage>

                {editingShapeData && (
                    <textarea
                        value={editingShapeData.text}
                        onChange={(e) => onTextChange(editingShapeData.id, e.target.value)}
                        onBlur={onTextCommit}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                onTextCancel();
                            }
                            e.stopPropagation();
                        }}
                        style={{
                            position: 'absolute',
                            left: `${editingShapeData.x * currentScale}px`,
                            top: `${editingShapeData.y * currentScale}px`,
                            fontSize: `${(editingShapeData.fontSize || 24) * currentScale * (editingShapeData.scaleY || 1)}px`,
                            lineHeight: 1,
                            color: editingShapeData.fill,
                            fontFamily: editingShapeData.fontFamily || 'Inter, sans-serif',
                            background: 'transparent',
                            border: '1px solid rgba(99, 102, 241, 0.5)',
                            outline: 'none',
                            padding: '0px',
                            margin: '0px',
                            resize: 'none',
                            overflow: 'hidden',
                            whiteSpace: 'pre',
                            transform: `rotate(${editingShapeData.rotation || 0}deg)`,
                            transformOrigin: 'top left',
                            zIndex: 50,
                            width: `${(editingShapeData.width || 100) * currentScale * (editingShapeData.scaleX || 1) + 20}px`,
                            height: `${(editingShapeData.height || (editingShapeData.fontSize || 24)) * currentScale * (editingShapeData.scaleY || 1) + 20}px`,
                            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
                        }}
                        autoFocus
                    />
                )}
            </div>
        </div>
    );
};

CanvasStageView.displayName = 'CanvasStageView';
