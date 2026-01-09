import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import type { 
    VideoEffectOptions, 
    VideoEffectProgress 
} from '../../src/types/video-effects';
import type { VideoInfo } from '../../src/types/video-merger';

export class VideoEffects {
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
                console.log('✅ Video Effects: FFmpeg ready');
            } else {
                console.warn('⚠️ Video Effects: FFmpeg not available');
            }
        } catch (e) {
            console.warn('FFmpeg setup failed:', e);
        }
    }

    async applyEffects(
        options: VideoEffectOptions,
        progressCallback?: (progress: VideoEffectProgress) => void
    ): Promise<string> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        const id = options.id || randomUUID();
        const { inputPath, outputPath, format } = options;

        if (!fs.existsSync(inputPath)) {
            throw new Error(`File not found: ${inputPath}`);
        }

        // Analyze file
        if (progressCallback) {
            progressCallback({ id, percent: 0, state: 'analyzing' });
        }

        // We need duration for progress
        const videoInfo = await this.getVideoInfo(inputPath);
        const totalDuration = options.speed 
            ? videoInfo.duration / options.speed 
            : videoInfo.duration;

        // Determine output path
        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const outputFilename = outputPath 
            ? path.basename(outputPath) 
            : `effect_video_${Date.now()}.${format}`;
        const finalOutputPath = path.join(outputDir, outputFilename);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const args: string[] = ['-i', inputPath];
        
        // Video Filters
        let vFilters: string[] = [];
        let aFilters: string[] = [];

        // 1. Speed
        if (options.speed && options.speed !== 1) {
            vFilters.push(`setpts=${1/options.speed}*PTS`);
            // Audio speed needs to be handled in chunks of 0.5 to 2.0
            let tempSpeed = options.speed;
            while (tempSpeed > 2.0) {
                aFilters.push('atempo=2.0');
                tempSpeed /= 2.0;
            }
            while (tempSpeed < 0.5) {
                aFilters.push('atempo=0.5');
                tempSpeed /= 0.5;
            }
            aFilters.push(`atempo=${tempSpeed}`);
        }

        // 2. Flip
        if (options.flip === 'horizontal' || options.flip === 'both') vFilters.push('hflip');
        if (options.flip === 'vertical' || options.flip === 'both') vFilters.push('vflip');

        // 3. Rotate
        if (options.rotate) {
            if (options.rotate === 90) vFilters.push('transpose=1');
            else if (options.rotate === 180) vFilters.push('transpose=2,transpose=2');
            else if (options.rotate === 270) vFilters.push('transpose=2');
        }

        // 4. Color Grading (eq filter)
        // eq=brightness=0:contrast=1:saturation=1:gamma=1
        if (options.brightness !== undefined || options.contrast !== undefined || options.saturation !== undefined || options.gamma !== undefined) {
            vFilters.push(`eq=brightness=${options.brightness || 0}:contrast=${options.contrast !== undefined ? options.contrast : 1}:saturation=${options.saturation !== undefined ? options.saturation : 1}:gamma=${options.gamma !== undefined ? options.gamma : 1}`);
        }

        // 5. Special Filters
        if (options.grayscale) vFilters.push('hue=s=0');
        if (options.sepia) vFilters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
        if (options.blur) vFilters.push(`boxblur=${options.blur}:1`);
        if (options.noise) vFilters.push(`noise=alls=${options.noise}:allf=t+u`);
        if (options.sharpen) vFilters.push('unsharp=5:5:1.0:5:5:0.0');
        
        if (options.vintage) {
            vFilters.push('curves=vintage');
            vFilters.push('vignette=PI/4');
        }

        if (options.reverse) {
            vFilters.push('reverse');
            aFilters.push('areverse');
        }

        if (vFilters.length > 0) {
            args.push('-vf', vFilters.join(','));
        }
        if (aFilters.length > 0) {
            args.push('-af', aFilters.join(','));
        }

        // Encoding options
        if (options.quality === 'low') {
            args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30');
        } else if (options.quality === 'high') {
            args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18');
        } else {
            args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
        }
        
        args.push('-c:a', 'aac', '-b:a', '128k');
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
                    reject(new Error(`Effects application failed with code ${code}`));
                }
            });

            process.on('error', (err: Error) => {
                this.activeProcesses.delete(id);
                reject(err);
            });
        });
    }

    private async getVideoInfo(filePath: string): Promise<VideoInfo> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');
        return new Promise((resolve, reject) => {
            const process = spawn(this.ffmpegPath as string, ['-i', filePath, '-hide_banner']);
            let output = '';
            process.stderr.on('data', data => output += data.toString());
            process.on('close', (code) => {
                if (code !== 0 && !output.includes('Duration')) {
                    reject(new Error('Failed to get video info'));
                    return;
                }
                const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                const duration = durationMatch 
                    ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
                    : 0;
                resolve({ duration } as VideoInfo);
            });
            process.on('error', reject);
        });
    }

    cancelEffects(id: string): void {
        const process = this.activeProcesses.get(id);
        if (process) {
            process.kill();
            this.activeProcesses.delete(id);
        }
    }
}

export const videoEffects = new VideoEffects();
