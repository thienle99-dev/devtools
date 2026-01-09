export interface AudioLayer {
    id: string;
    path: string;
    name: string;
    volume: number; // 0-2 (0% - 200%)
    startTime: number; // Start time in the video timeline (seconds)
    clipStart: number; // Start time within the audio file (seconds)
    clipEnd: number; // End time within the audio file (seconds)
    duration: number; // Total duration of the audio clip (seconds)
    isMuted: boolean;
}

export interface AudioManagerOptions {
    videoPath: string;
    audioLayers: AudioLayer[];
    outputPath?: string;
    outputFormat: string;
    keepOriginalAudio: boolean;
    originalAudioVolume: number;
}

export interface AudioProgress {
    id: string;
    percent: number;
    state: 'analyzing' | 'processing' | 'complete' | 'error';
    error?: string;
    outputPath?: string;
}

export interface AudioInfo {
    path: string;
    duration: number;
    format: string;
    sampleRate: number;
    channels: number;
    size: number;
}
