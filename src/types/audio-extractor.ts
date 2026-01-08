export type AudioFormat = 'mp3' | 'aac' | 'flac' | 'wav' | 'ogg' | 'm4a';
export type AudioBitrate = '64k' | '128k' | '192k' | '256k' | '320k';
export type AudioSampleRate = 44100 | 48000;
export type AudioChannels = 1 | 2; // mono or stereo

export interface AudioExtractionOptions {
    id?: string;
    inputPath: string;
    outputPath?: string;
    format: AudioFormat;
    bitrate?: AudioBitrate;
    sampleRate?: AudioSampleRate;
    channels?: AudioChannels;
    trim?: {
        start?: number; // seconds
        end?: number; // seconds
    };
    normalize?: boolean;
    fadeIn?: number; // seconds
    fadeOut?: number; // seconds
}

export interface AudioInfo {
    duration: number;
    bitrate: number;
    sampleRate: number;
    channels: number;
    codec: string;
    size: number;
    hasAudio: boolean;
    hasVideo: boolean;
}

export interface AudioExtractionProgress {
    id: string;
    filename: string;
    inputPath: string;
    percent: number;
    state: 'processing' | 'complete' | 'error';
    outputPath?: string;
    error?: string;
    speed?: number; // processing speed multiplier (e.g., 2.5x)
}

export interface AudioBatchItem {
    id: string;
    inputPath: string;
    filename: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    progress?: number;
    outputPath?: string;
    error?: string;
}
