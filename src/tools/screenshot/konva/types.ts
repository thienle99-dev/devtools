export interface ShapeData {
    id: string;
    type: 'rect' | 'circle' | 'arrow' | 'line' | 'text' | 'pen';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    points?: number[];
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    opacity?: number;
    radius?: number;
    draggable?: boolean;
    tension?: number;
    lineCap?: 'butt' | 'round' | 'square';
    lineJoin?: 'round' | 'bevel' | 'miter';
    pointerLength?: number;
    pointerWidth?: number;
}
