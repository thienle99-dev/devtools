import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import type {
    VideoCompressOptions,
    VideoCompressProgress,
    VideoMetadata
} from '../../src/types/video-compressor';

export class VideoCompressor {
    private ffmpegPath: string | null = null;
    private activeProcesses: Map<string, any> = new Map();

    constructor() {
        this.initFFmpeg().catch(e => console.error('FFmpeg init error:', e));
    }

    private async initFFmpeg() {
        try {
            const { FFmpegHelper } = await import('./ffmpeg-helper');
            const ffmpegPath = FFmpegHelper.getFFmpegPath();

            if (ffmpegPath) {
                this.ffmpegPath = ffmpegPath;
                console.log('✅ Video Compressor: FFmpeg ready');
            } else {
                console.warn('⚠️ Video Compressor: FFmpeg not available');
            }
        } catch (e) {
            console.warn('FFmpeg setup failed:', e);
        }
    }

    async getVideoInfo(filePath: string): Promise<VideoMetadata> {
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

                    // Parse video resolution
                    const resMatch = output.match(/Video:.*?, (\d{3,5})x(\d{3,5})/);
                    const width = resMatch ? parseInt(resMatch[1]) : 0;
                    const height = resMatch ? parseInt(resMatch[2]) : 0;

                    // Parse FPS
                    const fpsMatch = output.match(/(\d+\.?\d*) fps/);
                    const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;

                    // Parse codec
                    const codecMatch = output.match(/Video: (\w+)/);
                    const codec = codecMatch ? codecMatch[1] : 'unknown';

                    // Parse bitrate
                    const bitrateMatch = output.match(/bitrate: (\d+) kb\/s/);
                    const bitrate = bitrateMatch ? parseInt(bitrateMatch[1]) : 0;

                    const info: VideoMetadata = {
                        path: filePath,
                        duration,
                        width,
                        height,
                        codec,
                        fps,
                        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
                        bitrate
                    };

                    resolve(info);
                } catch (error) {
                    reject(new Error('Failed to parse video info'));
                }
            });

            process.on('error', reject);
        });
    }

    async compress(
        options: VideoCompressOptions,
        progressCallback?: (progress: VideoCompressProgress) => void
    ): Promise<string> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        const id = options.id || randomUUID();
        const { inputPath, outputPath, format, resolution, preset, crf, bitrate, scaleMode, keepAudio } = options;

        if (!fs.existsSync(inputPath)) {
            throw new Error(`File not found: ${inputPath}`);
        }

        const videoInfo = await this.getVideoInfo(inputPath);
        const totalDuration = videoInfo.duration;

        // Determine output path
        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const outputFilename = outputPath
            ? path.basename(outputPath)
            : `compressed_${path.basename(inputPath, path.extname(inputPath))}_${Date.now()}.${format}`;
        const finalOutputPath = path.join(outputDir, outputFilename);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const args: string[] = ['-i', inputPath];

        // Video filters (Scaling)
        const filters: string[] = [];
        if (resolution) {
            let scaleString = `scale=${resolution.width}:${resolution.height}`;
            if (scaleMode === 'fit') {
                scaleString = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
            } else if (scaleMode === 'fill') {
                scaleString = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=increase,crop=${resolution.width}:${resolution.height}`;
            }
            filters.push(scaleString);
        }

        // Always ensure even dimensions for many codecs
        if (filters.length > 0 || resolution) {
            // If we already have filters, we might need to append. 
            // But actually let's just make sure the final result is even.
            filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
        }

        if (filters.length > 0) {
            args.push('-vf', filters.join(','));
        }

        // Codecs and Quality
        if (format === 'mp4' || format === 'mov') {
            args.push('-c:v', 'libx264');
            if (bitrate) {
                args.push('-b:v', bitrate);
            } else {
                args.push('-crf', (crf || 23).toString());
            }
            args.push('-preset', preset || 'medium');
            args.push('-pix_fmt', 'yuv420p');
        } else if (format === 'webm') {
            args.push('-c:v', 'libvpx-vp9');
            if (bitrate) {
                args.push('-b:v', bitrate);
            } else {
                args.push('-crf', (crf || 30).toString());
                args.push('-b:v', '0'); // Required for constant quality in VP9
            }
        }

        // Audio
        if (!keepAudio) {
            args.push('-an');
        } else {
            args.push('-c:a', 'aac', '-b:a', '128k');
        }

        args.push('-y', finalOutputPath);

        return new Promise((resolve, reject) => {
            console.log(`[VideoCompressor] Command: ${this.ffmpegPath} ${args.join(' ')}`);
            const process = spawn(this.ffmpegPath as string, args);
            this.activeProcesses.set(id, process);

            process.stderr.on('data', (data: Buffer) => {
                const output = data.toString();
                const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);

                if (timeMatch && progressCallback) {
                    const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
                    const percent = Math.min((currentTime / totalDuration) * 100, 100);

                    const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
                    const speed = speedMatch ? parseFloat(speedMatch[1]) : 1;

                    progressCallback({
                        id,
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
                        progressCallback({ id, percent: 100, state: 'complete', outputPath: finalOutputPath });
                    }
                    resolve(finalOutputPath);
                } else {
                    reject(new Error(`Compression failed with code ${code}`));
                }
            });

            process.on('error', (err: Error) => {
                this.activeProcesses.delete(id);
                reject(err);
            });
        });
    }

    cancel(id: string): void {
        const process = this.activeProcesses.get(id);
        if (process) {
            process.kill();
            this.activeProcesses.delete(id);
        }
    }
}

export const videoCompressor = new VideoCompressor();
