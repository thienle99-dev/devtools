export interface VideoEffectOptions {
    id?: string;
    inputPath: string;
    outputPath?: string;
    format: 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm';
    
    // Speed control
    speed?: number; // 0.1 to 10
    
    // Manipulation
    reverse?: boolean;
    flip?: 'horizontal' | 'vertical' | 'both' | 'none';
    rotate?: 0 | 90 | 180 | 270;
    
    // Color Grading
    brightness?: number; // -1 to 1
    contrast?: number; // -10 to 10
    saturation?: number; // 0 to 10
    gamma?: number; // 0.1 to 10
    
    // Filters
    blur?: number; // 0 to 50
    sharpen?: boolean;
    grayscale?: boolean;
    sepia?: boolean;
    vintage?: boolean;
    glitch?: boolean;
    noise?: number; // 0 to 100
    
    // Quality
    quality?: 'low' | 'medium' | 'high';
}

export interface VideoEffectProgress {
    id: string;
    percent: number;
    state: 'analyzing' | 'processing' | 'complete' | 'error';
    speed?: number;
    error?: string;
    outputPath?: string;
}
