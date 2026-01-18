import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import type {
    VideoCompressOptions,
    VideoCompressProgress,
    VideoMetadata
} from '../../src/types/video-compressor';

export class VideoCompressor {
    private ffmpegPath: string | null = null;
    private activeProcesses: Map<string, any> = new Map();

    getPreviewStream(filePath: string): Readable {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        const args = [
            '-i', filePath,
            '-c:v', 'libx264',
            '-preset', 'ultrafast', // Fast encoding for realtime
            '-tune', 'zerolatency', // Low latency
            '-vf', 'scale=-2:720', // Downscale to 720p max to save CPU
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ac', '2',
            '-f', 'ismv', // Fragmented MP4 for streaming
            '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
            'pipe:1'
        ];

        console.log(`[VideoCompressor] Starting preview stream for ${filePath}`);
        const process = spawn(this.ffmpegPath, args);

        // Ensure process is killed when the stream is destroyed/closed
        process.stdout.on('close', () => {
            try {
                process.kill();
            } catch (e) { /* ignore */ }
        });

        // Log stderr errors just in case
        process.stderr.on('data', (d) => {
            // console.log('[Preview FFmpeg]', d.toString());
        });

        return process.stdout;
    }

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
                    // Parse duration - handling both 00:00:00 and 00:00:00.00 formats
                    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/i);
                    const duration = durationMatch
                        ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
                        : 0;

                    console.log('[VideoCompressor] Info Output:', output);

                    // Global bitrate
                    const globalBitrateMatch = output.match(/bitrate: (\d+) kb\/s/i);
                    let bitrate = globalBitrateMatch ? parseInt(globalBitrateMatch[1]) : 0;

                    // Parse video stream info
                    // Find the line containing "Video:"
                    const videoLineMatch = output.match(/Stream #.*: Video: .*/i);

                    let codec = 'unknown';
                    let width = 0;
                    let height = 0;
                    let fps = 0;

                    if (videoLineMatch) {
                        const videoLine = videoLineMatch[0];

                        // Extract Codec: First term after "Video:"
                        const codecMatch = videoLine.match(/Video: ([^,\s]+)/i);
                        if (codecMatch) {
                            codec = codecMatch[1];
                        }

                        // Extract Resolution: Look for pattern DDDxDDD
                        const resMatch = videoLine.match(/(\d{2,5})x(\d{2,5})/);
                        if (resMatch) {
                            width = parseInt(resMatch[1]);
                            height = parseInt(resMatch[2]);
                        }

                        // Extract FPS
                        const fpsMatch = output.match(/, (\d+(?:\.\d+)?) fps/i);
                        if (fpsMatch) fps = parseFloat(fpsMatch[1]);
                    } else {
                        // Fallback: Try to find resolution anywhere if specific stream line search failed
                        const resMatch = output.match(/ (\d{2,5})x(\d{2,5})/);
                        if (resMatch) {
                            width = parseInt(resMatch[1]);
                            height = parseInt(resMatch[2]);
                        }
                    }

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

    async generateThumbnail(filePath: string): Promise<string | null> {
        try {
            const { nativeImage } = await import('electron');
            const thumbnail = await nativeImage.createThumbnailFromPath(filePath, { width: 1280, height: 720 });
            if (thumbnail.isEmpty()) return null;
            return thumbnail.toDataURL(); // Returns base64 string
        } catch (e) {
            console.error('Thumbnail generation failed:', e);
            return null;
        }
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

        // Calculate bitrate if targetSize is provided
        let calculatedVideoBitrate = bitrate;
        if (options.targetSize && totalDuration > 0) {
            // Target size in bits
            const targetBits = options.targetSize * 8;
            // Reserve ~128kbps for audio (if kept)
            const audioBitrate = keepAudio ? 128000 : 0;
            const availableVideoBits = targetBits - (audioBitrate * totalDuration);
            const videoBitrateKbps = Math.floor((availableVideoBits / totalDuration) / 1000);

            // Ensure a sane minimum
            calculatedVideoBitrate = `${Math.max(100, videoBitrateKbps)}k`;
        }

        const args: string[] = [
            '-threads', '0', // Use all available CPU threads
            '-i', inputPath
        ];

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
            filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
        }

        if (filters.length > 0) {
            args.push('-vf', filters.join(','));
        }

        // Codecs and Quality
        const useHW = options.useHardwareAcceleration;
        const platform = process.platform;

        if (format === 'mp4' || format === 'mov') {
            if (useHW) {
                if (platform === 'darwin') {
                    args.push('-c:v', 'h264_videotoolbox');
                    if (calculatedVideoBitrate) {
                        args.push('-b:v', calculatedVideoBitrate);
                    } else {
                        const q = Math.max(0, Math.min(100, 100 - (crf || 23) * 1.5));
                        args.push('-q:v', Math.round(q).toString());
                    }
                } else if (platform === 'win32') {
                    args.push('-c:v', 'h264_nvenc');
                    if (calculatedVideoBitrate) {
                        args.push('-b:v', calculatedVideoBitrate);
                    } else {
                        args.push('-cq', (crf || 23).toString());
                    }
                    args.push('-preset', 'p4');
                } else {
                    args.push('-c:v', 'libx264');
                    if (calculatedVideoBitrate) {
                        args.push('-b:v', calculatedVideoBitrate);
                    } else {
                        args.push('-crf', (crf || 23).toString());
                    }
                    args.push('-preset', preset || 'medium');
                }
            } else {
                args.push('-c:v', 'libx264');
                if (calculatedVideoBitrate) {
                    args.push('-b:v', calculatedVideoBitrate);
                } else {
                    args.push('-crf', (crf || 23).toString());
                }
                args.push('-preset', preset || 'medium');
            }
            args.push('-pix_fmt', 'yuv420p');
        } else if (format === 'webm') {
            args.push('-c:v', 'libvpx-vp9');
            if (calculatedVideoBitrate) {
                args.push('-b:v', calculatedVideoBitrate);
            } else {
                args.push('-crf', (crf || 30).toString());
                args.push('-b:v', '0');
            }
            args.push('-row-mt', '1');
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

                    const sizeMatch = output.match(/size=\s*(\d+)kB/);
                    const currentSize = sizeMatch ? parseInt(sizeMatch[1]) * 1024 : undefined;

                    // Calculate ETA
                    let eta = 0;
                    if (speed > 0) {
                        const remainingDuration = totalDuration - currentTime;
                        eta = Math.max(0, remainingDuration / speed);
                    }

                    progressCallback({
                        id,
                        percent,
                        state: 'processing',
                        speed,
                        currentSize,
                        eta
                    });
                }
            });

            process.on('close', (code: number) => {
                this.activeProcesses.delete(id);
                if (code === 0) {
                    if (progressCallback) {
                        const finalSize = fs.existsSync(finalOutputPath) ? fs.statSync(finalOutputPath).size : 0;
                        progressCallback({
                            id,
                            percent: 100,
                            state: 'complete',
                            outputPath: finalOutputPath,
                            currentSize: finalSize
                        });
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
