import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import type { 
    VideoMergeOptions, 
    VideoMergeProgress, 
    VideoInfo 
} from '../../src/types/video-merger';


export class VideoMerger {
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
                console.log('✅ Video Merger: FFmpeg ready');
            } else {
                console.warn('⚠️ Video Merger: FFmpeg not available');
            }
        } catch (e) {
            console.warn('FFmpeg setup failed:', e);
        }
    }

    async getVideoInfo(filePath: string): Promise<VideoInfo> {
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

                    const info: VideoInfo = {
                        path: filePath,
                        duration,
                        width,
                        height,
                        codec,
                        fps,
                        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
                    };

                    resolve(info);
                } catch (error) {
                    reject(new Error('Failed to parse video info'));
                }
            });

            process.on('error', reject);
        });
    }

    async mergeVideos(
        options: VideoMergeOptions,
        progressCallback?: (progress: VideoMergeProgress) => void
    ): Promise<string> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        const id = options.id || randomUUID();
        const { inputPaths, outputPath, format } = options;

        if (!inputPaths || inputPaths.length === 0) {
            throw new Error('No input files provided');
        }

        // Validate all files exist
        for (const p of inputPaths) {
            if (!fs.existsSync(p)) {
                throw new Error(`File not found: ${p}`);
            }
        }

        // Analyze files
        if (progressCallback) {
            progressCallback({ id, percent: 0, state: 'analyzing' });
        }

        const videoInfos = await Promise.all(inputPaths.map(p => this.getVideoInfo(p)));
        const totalDuration = videoInfos.reduce((acc, curr) => acc + curr.duration, 0);

        // Determine output path
        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const outputFilename = outputPath 
            ? path.basename(outputPath) 
            : `merged_video_${Date.now()}.${format}`;
        const finalOutputPath = path.join(outputDir, outputFilename);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        /**
         * We'll use the concat filter method as it's more flexible for different file formats/codecs
         * although more CPU intensive than concat demuxer.
         */
        
        // Temporarily using a list file for FFmpeg concat demuxer if all streams are same
        // But for dev-tools, we want something more robust (concat filter)
        
        const args: string[] = [];
        
        // Input files
        inputPaths.forEach(p => {
            args.push('-i', p);
        });

        // Concat filter string: [0:v][0:a][1:v][1:a]...concat=n=3:v=1:a=1[v][a]
        let filterStr = '';
        inputPaths.forEach((_, i) => {
            filterStr += `[${i}:v][${i}:a]`;
        });
        filterStr += `concat=n=${inputPaths.length}:v=1:a=1[v][a]`;

        args.push('-filter_complex', filterStr);
        args.push('-map', '[v]', '-map', '[a]');
        
        // Encoding options
        args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
        args.push('-c:a', 'aac', '-b:a', '128k');
        
        // Output
        args.push('-y', finalOutputPath);

        return new Promise((resolve, reject) => {
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
                    reject(new Error(`Merge failed with code ${code}`));
                }
            });

            process.on('error', (err: Error) => {
                this.activeProcesses.delete(id);
                reject(err);
            });
        });
    }

    cancelMerge(id: string): void {
        const process = this.activeProcesses.get(id);
        if (process) {
            process.kill();
            this.activeProcesses.delete(id);
        }
    }
}

export const videoMerger = new VideoMerger();
