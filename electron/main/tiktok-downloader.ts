import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import type { 
    TikTokDownloadOptions, 
    TikTokVideoInfo, 
    TikTokHistoryItem, 
    TikTokDownloadProgress 
} from '../../src/types/tiktok';

const require = createRequire(import.meta.url);

interface TikTokSettings {
    downloadPath?: string;
    defaultFormat: 'video' | 'audio';
    defaultQuality: 'best' | 'medium' | 'low';
    removeWatermark: boolean;
    maxConcurrentDownloads: number;
    maxSpeedLimit?: string;
}

interface StoreSchema {
    history: TikTokHistoryItem[];
    settings: TikTokSettings;
}

export class TikTokDownloader {
    private ytDlp: any;
    private activeProcesses: Map<string, any> = new Map();
    private binaryPath: string;
    private initPromise: Promise<void>;
    private store: Store<StoreSchema>;
    private ffmpegPath: string | null = null;
    
    // Queue System
    private downloadQueue: Array<{
        run: () => Promise<string>;
        resolve: (value: string | PromiseLike<string>) => void;
        reject: (reason?: any) => void;
    }> = [];
    private activeDownloadsCount = 0;

    constructor() {
        this.store = new Store<StoreSchema>({
            name: 'tiktok-download-history',
            defaults: {
                history: [],
                settings: {
                    defaultFormat: 'video',
                    defaultQuality: 'best',
                    removeWatermark: false,
                    maxConcurrentDownloads: 3,
                    maxSpeedLimit: ''
                }
            }
        });

        const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        this.binaryPath = path.join(app.getPath('userData'), binaryName);
        this.initPromise = this.init();
    }

    private async init(): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ytDlpModule = require('yt-dlp-wrap');
            const YTDlpWrap = ytDlpModule.default || ytDlpModule;

            // Ensure binary exists (YouTube downloader should have handled this, but we check just in case)
            if (!fs.existsSync(this.binaryPath)) {
                console.log('Downloading yt-dlp binary (TikTok)...');
                await YTDlpWrap.downloadFromGithub(this.binaryPath);
            }

            this.ytDlp = new YTDlpWrap(this.binaryPath);

            // Check FFmpeg using smart helper
            const { FFmpegHelper } = await import('./ffmpeg-helper');
            const ffmpegPath = FFmpegHelper.getFFmpegPath();
            
            if (ffmpegPath) {
                this.ffmpegPath = ffmpegPath;
                console.log('✅ TikTok Downloader: FFmpeg ready');
            } else {
                console.warn('⚠️ TikTok Downloader: FFmpeg not available');
            }
        } catch (error) {
            console.error('Failed to init TikTok downloader:', error);
            throw error;
        }
    }

    private async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    // --- Core Methods ---

    async getVideoInfo(url: string): Promise<TikTokVideoInfo> {
        await this.ensureInitialized();

        try {
             const info: any = await this.ytDlp.getVideoInfo([
                url,
                '--skip-download',
                '--no-playlist',
                '--no-check-certificate',
            ]);

            return {
                id: info.id,
                title: info.title || 'TikTok Video',
                author: info.uploader || info.channel || 'Unknown',
                authorUsername: info.uploader_id || '',
                duration: info.duration || 0,
                thumbnailUrl: info.thumbnail || '',
                description: info.description,
                viewCount: info.view_count,
                likeCount: info.like_count,
                commentCount: info.comment_count,
                shareCount: info.repost_count, // yt-dlp maps share count variously, checking common fields
                uploadDate: info.upload_date,
                musicTitle: info.track,
                musicAuthor: info.artist
            };
        } catch (error) {
            throw new Error(`Failed to get TikTok info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async downloadVideo(
        options: TikTokDownloadOptions,
        progressCallback?: (progress: TikTokDownloadProgress) => void
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.downloadQueue.push({
                run: () => this.executeDownload(options, progressCallback),
                resolve,
                reject
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        const settings = this.getSettings();
        const maxConcurrent = settings.maxConcurrentDownloads || 3;

        while (this.activeDownloadsCount < maxConcurrent && this.downloadQueue.length > 0) {
            const task = this.downloadQueue.shift();
            if (task) {
                this.activeDownloadsCount++;
                task.run()
                    .then(result => task.resolve(result))
                    .catch(error => task.reject(error))
                    .finally(() => {
                        this.activeDownloadsCount--;
                        this.processQueue();
                    });
            }
        }
    }

    private async executeDownload(
        options: TikTokDownloadOptions,
        progressCallback?: (progress: TikTokDownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();

        const { url, format, quality, outputPath, maxSpeed, id } = options;
        const downloadId = id || randomUUID();

        try {
            const info = await this.getVideoInfo(url);
            const sanitizedTitle = this.sanitizeFilename(info.title);
            const author = this.sanitizeFilename(info.authorUsername || info.author);
            
            const downloadsPath = outputPath || this.store.get('settings.downloadPath') || app.getPath('downloads');
            const extension = format === 'audio' ? 'mp3' : 'mp4';
            const filename = `${author}_${sanitizedTitle}_${info.id}.${extension}`;
            const outputTemplate = path.join(downloadsPath, filename);

            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            const args: string[] = [
                url,
                '-o', outputTemplate,
                '--no-playlist',
                '--newline',
                '--no-warnings',
                '--no-check-certificate',
                '--concurrent-fragments', '4',
                '--retries', '10',
            ];

            if (this.ffmpegPath) {
                args.push('--ffmpeg-location', this.ffmpegPath);
            }

            if (maxSpeed) {
                args.push('--limit-rate', maxSpeed);
            }

            // Quality / Format Logic
            if (format === 'audio') {
                args.push(
                    '-x',
                    '--audio-format', 'mp3',
                    '--audio-quality', '0' // best
                );
            } else {
                // Video
                if (quality === 'low') {
                    args.push('-f', 'worst');
                } else if (quality === 'medium') {
                    // Simple heuristic for medium? TikTok usually just has one or two streams via yt-dlp
                    // We'll trust 'best' for now unless specific reqs come up
                    args.push('-f', 'best'); 
                } else {
                    args.push('-f', 'best');
                }
                
                // Note on Watermark: yt-dlp for TikTok often grabs non-watermarked by default if available aka 'aweme' source
                // Explicit watermark removal logic strictly depends on yt-dlp support at the time.
            }

            return new Promise((resolve, reject) => {
                let totalBytes = 0;
                let downloadedBytes = 0;
                let percent = 0;

                const process = this.ytDlp.exec(args);
                this.activeProcesses.set(downloadId, process);

                // Progress Parsing
                if (process.ytDlpProcess) {
                    process.ytDlpProcess.stdout?.on('data', (data: Buffer) => {
                        const output = data.toString();
                        // console.log(`[TikTok ${downloadId}] stdout:`, output);

                        output.split(/\r?\n/).forEach(line => {
                            if (!line.trim()) return;
                            
                            // [download]  25.0% of 10.00MiB at 2.50MiB/s ETA 00:03
                            const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(\w+)\s+at\s+(\d+\.?\d*)(\w+)\/s\s+ETA\s+(\d+:\d+)/);
                            
                            if (progressMatch) {
                                percent = parseFloat(progressMatch[1]);
                                const sizeVal = parseFloat(progressMatch[2]);
                                const sizeUnit = progressMatch[3];
                                const speedVal = parseFloat(progressMatch[4]);
                                const speedUnit = progressMatch[5];
                                const etaStr = progressMatch[6]; // MM:SS

                                // Approximate conversions for UI
                                const unitMultipliers: any = { 'B': 1, 'KiB': 1024, 'MiB': 1024*1024, 'GiB': 1024*1024*1024 };
                                totalBytes = sizeVal * (unitMultipliers[sizeUnit] || 1);
                                downloadedBytes = (percent / 100) * totalBytes;
                                const speed = speedVal * (unitMultipliers[speedUnit] || 1);

                                // Parse ETA to seconds
                                const etaParts = etaStr.split(':');
                                let eta = 0;
                                if (etaParts.length === 2) eta = parseInt(etaParts[0]) * 60 + parseInt(etaParts[1]);
                                if (etaParts.length === 3) eta = parseInt(etaParts[0]) * 3600 + parseInt(etaParts[1]) * 60 + parseInt(etaParts[2]);

                                if (progressCallback) {
                                    progressCallback({
                                        id: downloadId,
                                        percent,
                                        downloaded: downloadedBytes,
                                        total: totalBytes,
                                        speed,
                                        eta,
                                        state: 'downloading',
                                        filename
                                    });
                                }
                            }
                        });
                    });
                }

                process.on('close', (code: number) => {
                    this.activeProcesses.delete(downloadId);
                    if (code === 0) {
                        // verify file exists
                        if (fs.existsSync(outputTemplate)) {
                             // Final callback
                             if (progressCallback) {
                                progressCallback({
                                    id: downloadId,
                                    percent: 100,
                                    downloaded: totalBytes,
                                    total: totalBytes,
                                    speed: 0,
                                    eta: 0,
                                    state: 'complete',
                                    filename,
                                    filePath: outputTemplate
                                });
                            }
                            
                            // History
                            this.addToHistory({
                                id: downloadId,
                                url,
                                title: info.title,
                                thumbnailUrl: info.thumbnailUrl,
                                author: info.author,
                                authorUsername: info.authorUsername,
                                timestamp: Date.now(),
                                path: outputTemplate,
                                size: totalBytes, // approximate
                                duration: info.duration,
                                format: format || 'video',
                                status: 'completed'
                            });

                            resolve(outputTemplate);
                        } else {
                            reject(new Error('Download finished but file not found'));
                        }
                    } else {
                        reject(new Error(`yt-dlp exited with code ${code}`));
                    }
                });

                process.on('error', (err: Error) => {
                     this.activeProcesses.delete(downloadId);
                     reject(err);
                });
            });
        } catch (error) {
            this.activeProcesses.delete(downloadId);
            throw error;
        }
    }

    cancelDownload(id?: string): void {
        if (id) {
            const proc = this.activeProcesses.get(id);
            if (proc && proc.ytDlpProcess) {
                proc.ytDlpProcess.kill();
            }
        } else {
            this.activeProcesses.forEach(proc => {
                if (proc.ytDlpProcess) proc.ytDlpProcess.kill();
            });
        }
    }

    // --- History & Settings ---

    getHistory(): TikTokHistoryItem[] {
        return this.store.get('history', []);
    }

    clearHistory(): void {
        this.store.set('history', []);
    }

    removeFromHistory(id: string): void {
        const history = this.getHistory();
        this.store.set('history', history.filter(h => h.id !== id));
    }

    private addToHistory(item: TikTokHistoryItem) {
        const history = this.getHistory();
        // Add to beginning, limit to 100
        history.unshift(item);
        this.store.set('history', history.slice(0, 100));
    }

    getSettings(): TikTokSettings {
        return this.store.get('settings');
    }

    saveSettings(settings: Partial<TikTokSettings>): void {
        const current = this.getSettings();
        this.store.set('settings', { ...current, ...settings });
    }

    // --- Helpers ---

    private sanitizeFilename(name: string): string {
        return name.replace(/[<>:"/\\|?*]/g, '').trim();
    }
}

export const tiktokDownloader = new TikTokDownloader();
