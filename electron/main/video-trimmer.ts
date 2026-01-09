import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import type { 
    VideoTrimmerOptions, 
    VideoTrimmerProgress 
} from '../../src/types/video-trimmer';

export class VideoTrimmer {
    private ffmpegPath: string | null = null;
    private activeProcesses: Map<string, any> = new Map();

    constructor() {
        this.initFFmpeg().catch(e => console.error('Video Trimmer FFmpeg init error:', e));
    }

    private async initFFmpeg() {
        try {
            const { FFmpegHelper } = await import('./ffmpeg-helper');
            this.ffmpegPath = FFmpegHelper.getFFmpegPath();
        } catch (e) {
            console.warn('FFmpeg setup failed for Video Trimmer:', e);
        }
    }

    async process(
        options: VideoTrimmerOptions,
        progressCallback?: (progress: VideoTrimmerProgress) => void
    ): Promise<string[]> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');

        const { inputPath, ranges, mode, outputFormat, outputPath } = options;
        const id = randomUUID();

        if (progressCallback) progressCallback({ id, percent: 0, state: 'analyzing' });

        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const results: string[] = [];

        if (mode === 'trim' || mode === 'cut') {
            // Cut mode: Concatenate multiple ranges from one file
            // Trim mode: One range
            const finalOutputPath = outputPath || path.join(outputDir, `trimmed_${Date.now()}.${outputFormat}`);
            
            const args: string[] = [];
            
            // For simple single range trim, we can use fast copy
            if (ranges.length === 1 && mode === 'trim') {
                args.push('-ss', ranges[0].start.toString(), '-to', ranges[0].end.toString(), '-i', inputPath);
                args.push('-c', 'copy', '-y', finalOutputPath);
            } else {
                // Multi-range cut or complex trim: requires filter_complex
                args.push('-i', inputPath);
                let filterStr = '';
                ranges.forEach((range, i) => {
                    filterStr += `[0:v]trim=start=${range.start}:end=${range.end},setpts=PTS-STARTPTS[v${i}];`;
                    filterStr += `[0:a]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${i}];`;
                });
                
                for (let i = 0; i < ranges.length; i++) {
                    filterStr += `[v${i}][a${i}]`;
                }
                filterStr += `concat=n=${ranges.length}:v=1:a=1[outv][outa]`;

                args.push('-filter_complex', filterStr);
                args.push('-map', '[outv]', '-map', '[outa]');
                args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23');
                args.push('-c:a', 'aac', '-y', finalOutputPath);
            }

            await this.runFFmpeg(args, id, ranges.reduce((acc, r) => acc + (r.end - r.start), 0), progressCallback);
            results.push(finalOutputPath);

        } else if (mode === 'split') {
            // Split mode: Each range becomes a separate file
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
                const splitPath = path.join(outputDir, `split_${i+1}_${Date.now()}.${outputFormat}`);
                const args = [
                    '-ss', range.start.toString(),
                    '-to', range.end.toString(),
                    '-i', inputPath,
                    '-c', 'copy',
                    '-y', splitPath
                ];
                
                if (progressCallback) progressCallback({ id, percent: (i / ranges.length) * 100, state: 'processing' });
                await this.runFFmpeg(args, id, range.end - range.start);
                results.push(splitPath);
            }
        }

        if (progressCallback) progressCallback({ id, percent: 100, state: 'complete', outputPath: results[0] });
        return results;
    }

    private async runFFmpeg(args: string[], id: string, totalDuration: number, progressCallback?: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = spawn(this.ffmpegPath!, args);
            this.activeProcesses.set(id, process);

            process.stderr.on('data', (data) => {
                const output = data.toString();
                const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                if (timeMatch && progressCallback) {
                    const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
                    const percent = Math.min((currentTime / totalDuration) * 100, 100);
                    progressCallback({ id, percent, state: 'processing' });
                }
            });

            process.on('close', (code) => {
                this.activeProcesses.delete(id);
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
            process.on('error', (err) => {
                this.activeProcesses.delete(id);
                reject(err);
            });
        });
    }

    cancel(id: string) {
        const p = this.activeProcesses.get(id);
        if (p) {
            p.kill();
            this.activeProcesses.delete(id);
        }
    }
}

export const videoTrimmer = new VideoTrimmer();
