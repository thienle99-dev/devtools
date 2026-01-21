import {
    Group,
    Line,
    Triangle,
    FabricText as Text,
    Rect,
    Circle,
    Ellipse,
    Canvas
} from 'fabric';

export type AnnotationType = 'arrow' | 'text' | 'rectangle' | 'circle' | 'ellipse' | 'line' | 'blur' | 'pen' | 'select';

export interface AnnotationConfig {
    type: AnnotationType;
    color: string;
    strokeWidth: number;
    fontSize?: number;
    fontFamily?: string;
    text?: string;
}

export const DEFAULT_ANNOTATION_CONFIG: AnnotationConfig = {
    type: 'arrow',
    color: '#FF0000',
    strokeWidth: 3,
    fontSize: 24,
    fontFamily: 'Arial',
};

/**
 * Create an arrow annotation
 */
export function createArrow(
    points: { x1: number; y1: number; x2: number; y2: number },
    config: AnnotationConfig
): Group {
    const { x1, y1, x2, y2 } = points;

    // Calculate angle for arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    // Main line
    const line = new Line([x1, y1, x2, y2], {
        stroke: config.color,
        strokeWidth: config.strokeWidth,
        selectable: false,
    });

    // Arrowhead (triangle)
    const arrowHead = new Triangle({
        left: x2,
        top: y2,
        width: headLength,
        height: headLength,
        fill: config.color,
        angle: (angle * 180) / Math.PI + 90,
        originX: 'center',
        originY: 'center',
        selectable: false,
    });

    // Group line and arrowhead
    const arrow = new Group([line, arrowHead], {
        selectable: true,
        hasControls: true,
    });

    return arrow;
}

/**
 * Create a text annotation
 */
export function createText(
    position: { x: number; y: number },
    text: string,
    config: AnnotationConfig
): Text {
    const textObj = new Text(text, {
        left: position.x,
        top: position.y,
        fill: config.color,
        fontSize: config.fontSize || 24,
        fontFamily: config.fontFamily || 'Arial',
        selectable: true,
        hasControls: true,
    });

    return textObj;
}

/**
 * Create a rectangle annotation
 */
export function createRectangle(
    bounds: { left: number; top: number; width: number; height: number },
    config: AnnotationConfig
): Rect {
    const rect = new Rect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        fill: 'transparent',
        stroke: config.color,
        strokeWidth: config.strokeWidth,
        selectable: true,
        hasControls: true,
    });

    return rect;
}

/**
 * Create a circle annotation
 */
export function createCircle(
    center: { x: number; y: number },
    radius: number,
    config: AnnotationConfig
): Circle {
    const circle = new Circle({
        left: center.x - radius,
        top: center.y - radius,
        radius: radius,
        fill: 'transparent',
        stroke: config.color,
        strokeWidth: config.strokeWidth,
        selectable: true,
        hasControls: true,
    });

    return circle;
}

/**
 * Create an ellipse annotation
 */
export function createEllipse(
    bounds: { left: number; top: number; rx: number; ry: number },
    config: AnnotationConfig
): Ellipse {
    const ellipse = new Ellipse({
        left: bounds.left,
        top: bounds.top,
        rx: bounds.rx,
        ry: bounds.ry,
        fill: 'transparent',
        stroke: config.color,
        strokeWidth: config.strokeWidth,
        selectable: true,
        hasControls: true,
    });

    return ellipse;
}

/**
 * Create a line annotation
 */
export function createLine(
    points: { x1: number; y1: number; x2: number; y2: number },
    config: AnnotationConfig
): Line {
    const line = new Line([points.x1, points.y1, points.x2, points.y2], {
        stroke: config.color,
        strokeWidth: config.strokeWidth,
        selectable: true,
        hasControls: true,
    });

    return line;
}

/**
 * Create a blur area (will be rendered as pixelated rectangle)
 */
export function createBlurArea(
    bounds: { left: number; top: number; width: number; height: number },
    blurAmount: number = 20
): Rect {
    const rect = new Rect({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        fill: 'rgba(200, 200, 200, 0.5)',
        stroke: '#999',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: true,
        hasControls: true,
    });

    // Store blur amount as custom property
    (rect as any).blurAmount = blurAmount;
    (rect as any).isBlurArea = true;

    return rect;
}

/**
 * Export canvas to data URL with annotations
 */
export function exportCanvasWithAnnotations(canvas: Canvas): string {
    return canvas.toDataURL({ multiplier: 1 });
}

/**
 * Clear all annotations from canvas
 */
export function clearAllAnnotations(canvas: Canvas): void {
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
        if (obj !== canvas.backgroundImage) {
            canvas.remove(obj);
        }
    });
    canvas.renderAll();
}

/**
 * Delete selected annotation
 */
export function deleteSelectedAnnotation(canvas: Canvas): void {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
    }
}

/**
 * Get annotation count
 */
export function getAnnotationCount(canvas: Canvas): number {
    const objects = canvas.getObjects();
    return objects.filter((obj: any) => obj !== canvas.backgroundImage).length;
}
