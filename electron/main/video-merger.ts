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

    async generateThumbnail(filePath: string, time: number = 1): Promise<string> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');
        const outputDir = path.join(app.getPath('temp'), 'devtools-app-thumbs');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        const thumbName = `thumb_${randomUUID()}.jpg`;
        const outputPath = path.join(outputDir, thumbName);

        return new Promise((resolve, reject) => {
            const args = [
                '-ss', time.toString(),
                '-i', filePath,
                '-vframes', '1',
                '-s', '160x90',
                '-f', 'image2',
                '-y', outputPath
            ];

            const process = spawn(this.ffmpegPath!, args);
            process.on('close', (code) => {
                if (code === 0) resolve(`file://${outputPath}`);
                else reject(new Error('Thumbnail generation failed'));
            });
            process.on('error', reject);
        });
    }

    async generateFilmstrip(filePath: string, duration: number, count: number = 10): Promise<string[]> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');
        const outputDir = path.join(app.getPath('temp'), 'devtools-app-filmstrips', randomUUID());
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const interval = duration / count;

        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
                '-vf', `fps=1/${interval},scale=160:-1`,
                '-f', 'image2',
                path.join(outputDir, 'thumb_%03d.jpg')
            ];

            const process = spawn(this.ffmpegPath!, args);
            process.on('close', (code) => {
                if (code === 0) {
                    const files = fs.readdirSync(outputDir)
                        .filter(f => f.endsWith('.jpg'))
                        .map(f => `file://${path.join(outputDir, f)}`);
                    resolve(files);
                } else {
                    reject(new Error('Filmstrip generation failed'));
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
        const { clips, outputPath, format } = options;

        if (!clips || clips.length === 0) {
            throw new Error('No input clips provided');
        }

        // Validate all files exist
        for (const clip of clips) {
            if (!fs.existsSync(clip.path)) {
                throw new Error(`File not found: ${clip.path}`);
            }
        }

        // Analyze files
        if (progressCallback) {
            progressCallback({ id, percent: 0, state: 'analyzing' });
        }

        const videoInfos = await Promise.all(clips.map(c => this.getVideoInfo(c.path)));
        
        // Calculate total duration considering trims
        let totalDuration = 0;
        clips.forEach((clip, i) => {
            const fullDuration = videoInfos[i].duration;
            const start = clip.startTime || 0;
            const end = clip.endTime || fullDuration;
            totalDuration += (end - start);
        });

        // Determine output path
        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const outputFilename = outputPath 
            ? path.basename(outputPath) 
            : `merged_video_${Date.now()}.${format}`;
        const finalOutputPath = path.join(outputDir, outputFilename);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const args: string[] = [];
        
        // Input files with trimming
        clips.forEach(clip => {
            if (clip.startTime !== undefined) {
                args.push('-ss', clip.startTime.toString());
            }
            if (clip.endTime !== undefined) {
                args.push('-to', clip.endTime.toString());
            }
            args.push('-i', clip.path);
        });

        // Concat filter string: [0:v][0:a][1:v][1:a]...concat=n=3:v=1:a=1[v][a]
        let filterStr = '';
        clips.forEach((_, i) => {
            filterStr += `[${i}:v][${i}:a]`;
        });
        filterStr += `concat=n=${clips.length}:v=1:a=1[v][a]`;

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
