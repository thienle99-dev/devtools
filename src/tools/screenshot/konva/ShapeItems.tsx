import { memo } from 'react';
import useImage from 'use-image';
import type { ShapeData } from './types';

type ReactKonvaModule = typeof import('react-konva');

interface ShapeItemProps {
    shape: ShapeData;
    isSelected: boolean;
    isEditing: boolean;
    activeTool: string | null;
    onSelect: (id: string) => void;
    onTextDblClick: (e: any, id: string) => void;
    onDragEnd: (e: any) => void;
    onTransformEnd: (e: any) => void;
}

export function createShapeComponents(module: ReactKonvaModule) {
    const { Image: KonvaImage, Rect, Circle, Arrow, Line, Text: KonvaText } = module;

    const URLImage = memo(({ src, width, height }: { src: string; width: number; height: number }) => {
        const [image] = useImage(src, 'anonymous');
        return <KonvaImage image={image} width={width} height={height} listening={false} />;
    });
    URLImage.displayName = 'URLImage';

    const ShapeItem = memo<ShapeItemProps>(({
        shape,
        isSelected,
        isEditing,
        activeTool,
        onSelect,
        onTextDblClick,
        onDragEnd,
        onTransformEnd
    }) => {
        const selectionStyles = isSelected
            ? {
                shadowColor: '#818cf8',
                shadowBlur: 12,
                shadowOpacity: 0.6,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            }
            : {};

        const commonProps = {
            ...shape,
            ...selectionStyles,
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

    return { URLImage, ShapeItem };
}
