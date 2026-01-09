export interface TrimRange {
    id: string;
    start: number;
    end: number;
}

export interface VideoTrimmerOptions {
    inputPath: string;
    ranges: TrimRange[]; // If multiple, we might want to concatenate them or export as separate files
    mode: 'trim' | 'split' | 'cut'; 
    outputFormat: string;
    outputPath?: string;
}

export interface VideoTrimmerProgress {
    id: string;
    percent: number;
    state: 'analyzing' | 'processing' | 'complete' | 'error';
    error?: string;
    outputPath?: string;
}
