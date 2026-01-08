import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { execSync, spawn } from 'child_process';
import type { 
    AudioExtractionOptions, 
    AudioInfo, 
    AudioExtractionProgress 
} from '../../src/types/audio-extractor';

const require = createRequire(import.meta.url);

export class AudioExtractor {
    private ffmpegPath: string | null = null;
    private activeProcesses: Map<string, any> = new Map();

    constructor() {
        this.initFFmpeg();
    }

    private initFFmpeg() {
        try {
            // Try to get FFmpeg from installer
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            if (ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path as string)) {
                this.ffmpegPath = ffmpegInstaller.path;
                if (process.platform !== 'win32') {
                    try { fs.chmodSync(this.ffmpegPath as string, '755'); } catch {}
                }
            } else {
                // Fallback to global FFmpeg
                try {
                    execSync('ffmpeg -version', { stdio: 'ignore' });
                    this.ffmpegPath = 'ffmpeg';
                } catch {
                    console.warn('FFmpeg not found for Audio Extractor');
                }
            }
        } catch (e) {
            console.warn('FFmpeg setup failed:', e);
        }
    }

    async getAudioInfo(filePath: string): Promise<AudioInfo> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
                '-hide_banner'
            ];

            const process = spawn(this.ffmpegPath as string, args);
            let output = '';

            process.stderr.on('data', (data: Buffer) => {
                output += data.toString();
            });

            process.on('close', () => {
                try {
                    // Parse duration
                    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                    const duration = durationMatch 
                        ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
                        : 0;

                    // Parse audio stream info
                    const audioMatch = output.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?, (\d+) Hz.*?, (\w+).*?, (\d+) kb\/s/);
                    const hasAudio = !!audioMatch;
                    const hasVideo = output.includes('Video:');

                    const info: AudioInfo = {
                        duration,
                        bitrate: audioMatch ? parseInt(audioMatch[4]) : 0,
                        sampleRate: audioMatch ? parseInt(audioMatch[2]) : 0,
                        channels: audioMatch && audioMatch[3].includes('stereo') ? 2 : 1,
                        codec: audioMatch ? audioMatch[1] : 'unknown',
                        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
                        hasAudio,
                        hasVideo
                    };

                    resolve(info);
                } catch (error) {
                    reject(new Error('Failed to parse audio info'));
                }
            });

            process.on('error', reject);
        });
    }

    async extractAudio(
        options: AudioExtractionOptions,
        progressCallback?: (progress: AudioExtractionProgress) => void
    ): Promise<string> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        const id = options.id || randomUUID();
        const { inputPath, outputPath, format, bitrate, sampleRate, channels, trim, normalize, fadeIn, fadeOut } = options;

        // Validate input
        if (!fs.existsSync(inputPath)) {
            throw new Error('Input file not found');
        }

        // Get audio info first
        const audioInfo = await this.getAudioInfo(inputPath);
        if (!audioInfo.hasAudio) {
            throw new Error('No audio stream found in input file');
        }

        // Determine output path
        const inputFilename = path.basename(inputPath, path.extname(inputPath));
        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const outputFilename = outputPath 
            ? path.basename(outputPath) 
            : `${inputFilename}_extracted.${format}`;
        const finalOutputPath = path.join(outputDir, outputFilename);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Build FFmpeg arguments
        const args: string[] = ['-i', inputPath];

        // Trim
        if (trim?.start !== undefined) {
            args.push('-ss', trim.start.toString());
        }
        if (trim?.end !== undefined) {
            args.push('-to', trim.end.toString());
        }

        // No video
        args.push('-vn');

        // Audio filters
        const filters: string[] = [];
        
        if (normalize) {
            filters.push('loudnorm');
        }

        if (fadeIn && fadeIn > 0) {
            filters.push(`afade=t=in:d=${fadeIn}`);
        }

        if (fadeOut && fadeOut > 0) {
            const startTime = (trim?.end || audioInfo.duration) - fadeOut;
            filters.push(`afade=t=out:st=${startTime}:d=${fadeOut}`);
        }

        if (filters.length > 0) {
            args.push('-af', filters.join(','));
        }

        // Audio codec and quality
        switch (format) {
            case 'mp3':
                args.push('-acodec', 'libmp3lame');
                if (bitrate) args.push('-b:a', bitrate);
                break;
            case 'aac':
                args.push('-acodec', 'aac');
                if (bitrate) args.push('-b:a', bitrate);
                break;
            case 'flac':
                args.push('-acodec', 'flac');
                break;
            case 'wav':
                args.push('-acodec', 'pcm_s16le');
                break;
            case 'ogg':
                args.push('-acodec', 'libvorbis');
                if (bitrate) args.push('-b:a', bitrate);
                break;
            case 'm4a':
                args.push('-acodec', 'aac');
                if (bitrate) args.push('-b:a', bitrate);
                break;
        }

        // Sample rate
        if (sampleRate) {
            args.push('-ar', sampleRate.toString());
        }

        // Channels
        if (channels) {
            args.push('-ac', channels.toString());
        }

        // Output
        args.push('-y', finalOutputPath);

        return new Promise((resolve, reject) => {
            const process = spawn(this.ffmpegPath as string, args);
            this.activeProcesses.set(id, process);

            let duration = audioInfo.duration;
            if (trim?.start && trim?.end) {
                duration = trim.end - trim.start;
            } else if (trim?.end) {
                duration = trim.end;
            }

            process.stderr.on('data', (data: Buffer) => {
                const output = data.toString();
                
                // Parse progress: time=00:01:23.45
                const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                if (timeMatch && progressCallback) {
                    const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
                    const percent = Math.min((currentTime / duration) * 100, 100);

                    // Parse speed: speed=2.5x
                    const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
                    const speed = speedMatch ? parseFloat(speedMatch[1]) : 1;

                    progressCallback({
                        id,
                        filename: outputFilename,
                        inputPath,
                        percent,
                        state: 'processing',
                        speed
                    });
                }
            });

            process.on('close', (code: number) => {
                this.activeProcesses.delete(id);
                
                if (code === 0) {
                    if (progressCallback) {
                        progressCallback({
                            id,
                            filename: outputFilename,
                            inputPath,
                            percent: 100,
                            state: 'complete',
                            outputPath: finalOutputPath
                        });
                    }
                    resolve(finalOutputPath);
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            process.on('error', (err: Error) => {
                this.activeProcesses.delete(id);
                reject(err);
            });
        });
    }

    cancelExtraction(id: string): void {
        const process = this.activeProcesses.get(id);
        if (process) {
            process.kill();
            this.activeProcesses.delete(id);
        }
    }

    cancelAll(): void {
        this.activeProcesses.forEach(process => process.kill());
        this.activeProcesses.clear();
    }
}

export const audioExtractor = new AudioExtractor();
