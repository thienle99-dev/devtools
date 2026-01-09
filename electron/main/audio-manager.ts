import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import type { 
    AudioManagerOptions, 
    AudioProgress, 
    AudioInfo 
} from '../../src/types/audio-manager';

export class AudioManager {
    private ffmpegPath: string | null = null;
    private activeProcesses: Map<string, any> = new Map();

    constructor() {
        this.initFFmpeg().catch(e => console.error('Audio Manager FFmpeg init error:', e));
    }

    private async initFFmpeg() {
        try {
            const { FFmpegHelper } = await import('./ffmpeg-helper');
            this.ffmpegPath = FFmpegHelper.getFFmpegPath();
        } catch (e) {
            console.warn('FFmpeg setup failed for Audio Manager:', e);
        }
    }

    async getAudioInfo(filePath: string): Promise<AudioInfo> {
        if (!this.ffmpegPath) {
            throw new Error('FFmpeg not available');
        }

        return new Promise((resolve, reject) => {
            const args = ['-i', filePath, '-hide_banner'];
            const process = spawn(this.ffmpegPath as string, args);
            let output = '';

            process.stderr.on('data', (data) => output += data.toString());

            process.on('close', () => {
                try {
                    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
                    const duration = durationMatch 
                        ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
                        : 0;

                    const sampleRateMatch = output.match(/(\d+) Hz/);
                    const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1]) : 0;

                    const info: AudioInfo = {
                        path: filePath,
                        duration,
                        format: path.extname(filePath).slice(1),
                        sampleRate,
                        channels: output.includes('stereo') ? 2 : 1,
                        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
                    };
                    resolve(info);
                } catch (e) {
                    reject(new Error('Failed to parse audio info'));
                }
            });
        });
    }

    async applyAudioChanges(
        options: AudioManagerOptions,
        progressCallback?: (progress: AudioProgress) => void
    ): Promise<string> {
        if (!this.ffmpegPath) throw new Error('FFmpeg not available');

        const id = randomUUID();
        const { videoPath, audioLayers, outputPath, outputFormat, keepOriginalAudio, originalAudioVolume } = options;

        if (progressCallback) progressCallback({ id, percent: 0, state: 'analyzing' });

        // Get total duration from video
        const videoInfoArgs = ['-i', videoPath, '-hide_banner'];
        const infoProcess = spawn(this.ffmpegPath, videoInfoArgs);
        let infoOutput = '';
        await new Promise((resolve) => {
            infoProcess.stderr.on('data', d => infoOutput += d.toString());
            infoProcess.on('close', resolve);
        });

        const durationMatch = infoOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        const totalDuration = durationMatch 
            ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
            : 0;

        const outputDir = outputPath ? path.dirname(outputPath) : app.getPath('downloads');
        const finalOutputPath = outputPath || path.join(outputDir, `audio_mixed_${Date.now()}.${outputFormat}`);

        const args: string[] = ['-i', videoPath];
        audioLayers.forEach(layer => {
            if (layer.clipStart > 0) args.push('-ss', layer.clipStart.toString());
            if (layer.clipEnd > 0) args.push('-to', layer.clipEnd.toString());
            args.push('-i', layer.path);
        });

        // Filter Complex for mixing
        // [0:a] is video's original audio
        // [1:a], [2:a]... are added layers
        let filterStr = '';
        let inputCount = 0;
        
        if (keepOriginalAudio) {
            filterStr += `[0:a]volume=${originalAudioVolume}[a0];`;
            inputCount++;
        }

        audioLayers.forEach((layer, i) => {
            const inputIdx = i + 1;
            filterStr += `[${inputIdx}:a]volume=${layer.volume},adelay=${layer.startTime * 1000}|${layer.startTime * 1000}[a${inputIdx}];`;
            inputCount++;
        });

        for (let i = 0; i < inputCount; i++) {
            filterStr += `[a${i}]`;
        }
        filterStr += `amix=inputs=${inputCount}:duration=first:dropout_transition=2[aout]`;

        args.push('-filter_complex', filterStr);
        args.push('-map', '0:v', '-map', '[aout]');
        args.push('-c:v', 'copy'); // Fast copy for video stream
        args.push('-c:a', 'aac', '-b:a', '192k', '-y', finalOutputPath);

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
                if (code === 0) {
                    if (progressCallback) progressCallback({ id, percent: 100, state: 'complete', outputPath: finalOutputPath });
                    resolve(finalOutputPath);
                } else {
                    reject(new Error(`Exit code ${code}`));
                }
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

export const audioManager = new AudioManager();
