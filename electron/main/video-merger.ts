import fs from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';
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
    private mainWindow: BrowserWindow | null = null;

    constructor() {
        this.initFFmpeg().catch(e => console.error('FFmpeg init error:', e));
    }

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
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
                if (code === 0) {
                    const data = fs.readFileSync(outputPath, { encoding: 'base64' });
                    // Cleanup
                    fs.unlinkSync(outputPath);
                    resolve(`data:image/jpeg;base64,${data}`);
                } else {
                    reject(new Error('Thumbnail generation failed'));
                }
            });
            process.on('error', reject);
        });
    }

    async generateFilmstrip(filePath: string, duration: number, count: number = 10): Promise<string[]> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');
        
        // Limit count to reasonable number (at least 5, max 20)
        const actualCount = Math.min(20, Math.max(5, Math.min(count, Math.floor(duration))));
        const tempId = randomUUID();
        const outputDir = path.join(app.getPath('temp'), 'devtools-app-filmstrips', tempId);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // Optimization: Use single ffmpeg command with fps filter
        // fps = count / duration. 
        // Ensure duration is safe
        const safeDuration = duration > 0 ? duration : 1;
        const fps = actualCount / safeDuration;
        console.log(`Generating filmstrip (Optimized): Target ${actualCount} frames from ${safeDuration}s video (fps=${fps.toFixed(4)})`);

        // Normalize path for ffmpeg (Windows backslash issues with % pattern)
        const outputPattern = path.join(outputDir, 'thumb_%03d.jpg').replace(/\\/g, '/');

        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
                '-vf', `fps=${fps},scale=80:45`,
                '-q:v', '2',
                '-f', 'image2',
                outputPattern
            ];
            
            const process = spawn(this.ffmpegPath!, args);
            
            let stderr = '';
            process.stderr.on('data', (data) => {
                const text = data.toString();
                stderr += text;
                
                // Best effort progress parsing
                const match = text.match(/frame=\s*(\d+)/);
                if (match) {
                     const currentFrame = parseInt(match[1]);
                     if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        this.mainWindow.webContents.send('filmstrip-progress', {
                            current: Math.min(currentFrame, actualCount),
                            total: actualCount,
                            timestamp: 'Processing...'
                        });
                    }
                }
            });

            process.on('close', (code) => {
                 if (code === 0) {
                     try {
                         // Read all generated files
                         const files = fs.readdirSync(outputDir)
                             .filter(f => f.startsWith('thumb_') && f.endsWith('.jpg'))
                             .sort(); // thumb_001.jpg, thumb_002.jpg...

                         const frames = files.map(f => {
                             const p = path.join(outputDir, f);
                             const data = fs.readFileSync(p, { encoding: 'base64' });
                             return `data:image/jpeg;base64,${data}`;
                         });
                         
                         // Limit to requested count if we got extra
                         const finalFrames = frames.slice(0, actualCount);

                         // Cleanup
                         try {
                            fs.rmSync(outputDir, { recursive: true, force: true });
                         } catch (cleanupErr) {
                             console.warn('Filmstrip cleanup failed:', cleanupErr);
                         }
                         
                         console.log(`Filmstrip generated: ${finalFrames.length} frames`);
                         resolve(finalFrames);
                     } catch (e) {
                         reject(e);
                     }
                 } else {
                     console.error('Filmstrip generation failed:', stderr);
                     reject(new Error('Filmstrip generation failed'));
                 }
            });
            process.on('error', reject);
        });
    }

    async extractWaveform(filePath: string): Promise<number[]> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');
        
        console.log('Extracting waveform for:', filePath);

        return new Promise((resolve, reject) => {
            const args = [
                '-i', filePath,
                '-vn', // No video
                '-ac', '1', // Mono
                '-filter:a', 'aresample=8000', // Resample to 8kHz
                '-map', '0:a',
                '-c:a', 'pcm_s16le', // Raw 16-bit PCM
                '-f', 'data',
                '-' // Output to stdout
            ];

            const process = spawn(this.ffmpegPath!, args);
            const chunks: Buffer[] = [];

            process.stdout.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            process.stderr.on('data', () => {
                // Ignore stderr (ffmpeg progress)
            });

            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const data: number[] = [];
                        
                        // Process 16-bit signed integers
                        // We want about 100 points per second.
                        // Sample rate is 8000 Hz.
                        // So 1 point every 80 samples.
                        const samplesPerPoint = 80;
                        
                        for (let i = 0; i < buffer.length; i += samplesPerPoint * 2) { // * 2 because 16-bit = 2 bytes
                            let max = 0;
                            // Find max amplitude in this chunk
                            for (let j = 0; j < samplesPerPoint; j++) {
                                const offset = i + j * 2;
                                if (offset + 1 < buffer.length) {
                                    // Read Int16 Little Endian
                                    const val = Math.abs(buffer.readInt16LE(offset));
                                    if (val > max) max = val;
                                }
                            }
                            // Normalize to 0-1 (max 16-bit val is 32768)
                            data.push(max / 32768);
                        }
                        
                        console.log(`Waveform extracted: ${data.length} points`);
                        resolve(data);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error('Waveform extraction failed'));
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
