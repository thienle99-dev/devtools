
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
    fontFamily: 'Inter, sans-serif',
};
