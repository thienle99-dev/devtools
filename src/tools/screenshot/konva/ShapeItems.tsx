import React, { memo } from 'react';
import { Image as KonvaImage, Rect, Circle, Arrow, Line, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import type { ShapeData } from './types';

export const URLImage = memo(({ src, width, height }: { src: string; width: number; height: number }) => {
    const [image] = useImage(src, 'anonymous');
    return <KonvaImage image={image} width={width} height={height} listening={false} />;
});
URLImage.displayName = 'URLImage';

interface ShapeItemProps {
    shape: ShapeData;
    isEditing: boolean;
    activeTool: string | null;
    onSelect: (id: string) => void;
    onTextDblClick: (e: any, id: string) => void;
    onDragEnd: (e: any) => void;
    onTransformEnd: (e: any) => void;
}

export const ShapeItem = memo<ShapeItemProps>(({
    shape,
    isEditing,
    activeTool,
    onSelect,
    onTextDblClick,
    onDragEnd,
    onTransformEnd
}) => {
    const commonProps = {
        ...shape,
        onClick: () => onSelect(shape.id),
        onTap: () => onSelect(shape.id),
        onDragEnd,
        onTransformEnd,
        draggable: shape.draggable && !activeTool,
        onMouseEnter: (e: any) => {
            if (activeTool) return;
            const container = e.target.getStage().container();
            container.style.cursor = 'move';
        },
        onMouseLeave: (e: any) => {
            if (activeTool) return;
            const container = e.target.getStage().container();
            container.style.cursor = 'default';
        },
    };

    if (shape.type === 'rect') return <Rect {...commonProps} />;
    if (shape.type === 'circle') return <Circle {...commonProps} />;

    if (shape.type === 'arrow') {
        return (
            <Arrow
                {...commonProps}
                points={shape.points || []}
                hitStrokeWidth={20}
            />
        );
    }

    if (shape.type === 'line') {
        return (
            <Arrow
                {...commonProps}
                points={shape.points || []}
                pointerLength={0}
                pointerWidth={0}
                hitStrokeWidth={20}
            />
        );
    }

    if (shape.type === 'pen') {
        return (
            <Line
                {...commonProps}
                points={shape.points || []}
                hitStrokeWidth={10}
            />
        );
    }

    if (shape.type === 'text') {
        return (
            <KonvaText
                {...commonProps}
                onDblClick={(e) => onTextDblClick(e, shape.id)}
                onDblTap={(e) => onTextDblClick(e, shape.id)}
                listening={!isEditing}
                hitStrokeWidth={20}
            />
        );
    }

    return null;
});
ShapeItem.displayName = 'ShapeItem';
