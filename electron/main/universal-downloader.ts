import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import type {
    UniversalDownloadOptions,
    UniversalMediaInfo,
    UniversalHistoryItem,
    UniversalDownloadProgress,
    SupportedPlatform
} from '../../src/types/universal-media';

const require = createRequire(import.meta.url);

interface UniversalSettings {
    downloadPath?: string;
    defaultFormat: 'video' | 'audio';
    defaultQuality: 'best' | 'medium' | 'low';
    maxConcurrentDownloads: number;
    maxSpeedLimit?: string;
    useBrowserCookies?: 'chrome' | 'firefox' | 'edge' | null;
}

interface StoreSchema {
    history: UniversalHistoryItem[];
    settings: UniversalSettings;
}

export class UniversalDownloader {
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
            name: 'universal-download-history',
            defaults: {
                history: [],
                settings: {
                    defaultFormat: 'video',
                    defaultQuality: 'best',
                    maxConcurrentDownloads: 3,
                    maxSpeedLimit: '',
                    useBrowserCookies: null
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

            // Ensure binary exists (YouTube downloader should have handled this)
            if (!fs.existsSync(this.binaryPath)) {
                console.log('Downloading yt-dlp binary (Universal)...');
                await YTDlpWrap.downloadFromGithub(this.binaryPath);
            }

            this.ytDlp = new YTDlpWrap(this.binaryPath);

            // Check FFmpeg
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
                if (ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path as string)) {
                    this.ffmpegPath = ffmpegInstaller.path;
                    if (process.platform !== 'win32') {
                        try { fs.chmodSync(this.ffmpegPath as string, '755'); } catch { }
                    }
                } else {
                    // Fallback to global
                    try {
                        execSync('ffmpeg -version', { stdio: 'ignore' });
                    } catch {
                        console.warn('FFmpeg not found for Universal downloader');
                    }
                }
            } catch (e) {
                console.warn('FFmpeg setup failed:', e);
            }
        } catch (error) {
            console.error('Failed to init Universal downloader:', error);
            throw error;
        }
    }

    private async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    // --- Core Methods ---

    private detectPlatform(url: string, extractor?: string): SupportedPlatform {
        const u = url.toLowerCase();
        if (extractor) {
            const e = extractor.toLowerCase();
            if (e.includes('youtube')) return 'youtube';
            if (e.includes('tiktok')) return 'tiktok';
            if (e.includes('instagram')) return 'instagram';
            if (e.includes('facebook')) return 'facebook';
            if (e.includes('twitter') || e.includes('x')) return 'twitter';
            if (e.includes('twitch')) return 'twitch';
            if (e.includes('reddit')) return 'reddit';
        }

        if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
        if (u.includes('tiktok.com')) return 'tiktok';
        if (u.includes('instagram.com')) return 'instagram';
        if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
        if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
        if (u.includes('twitch.tv')) return 'twitch';
        if (u.includes('reddit.com')) return 'reddit';

        return 'other';
    }

    async getMediaInfo(url: string): Promise<UniversalMediaInfo> {
        await this.ensureInitialized();

        try {
            const args = [
                url,
                '--dump-json',
                '--no-playlist',
                '--no-check-certificate',
                '--no-call-home'
            ];

            // Add cookies if configured
            const settings = this.getSettings();
            if (settings.useBrowserCookies) {
                args.push('--cookies-from-browser', settings.useBrowserCookies);
            }

            const stdout = await this.ytDlp.execPromise(args);
            const info = JSON.parse(stdout);

            const platform = this.detectPlatform(url, info.extractor);

            // Extract available video qualities
            const availableQualities: string[] = [];
            if (info.formats && Array.isArray(info.formats)) {
                const qualitySet = new Set<string>();

                info.formats.forEach((fmt: any) => {
                    // Only consider formats with video
                    if (fmt.vcodec && fmt.vcodec !== 'none' && fmt.height) {
                        const quality = `${fmt.height}p`;
                        qualitySet.add(quality);
                    }
                });

                // Convert to array and sort from highest to lowest
                const sortedQualities = Array.from(qualitySet).sort((a, b) => {
                    const heightA = parseInt(a.replace('p', ''));
                    const heightB = parseInt(b.replace('p', ''));
                    return heightB - heightA; // Descending order
                });

                availableQualities.push(...sortedQualities);
            }

            return {
                id: info.id,
                url: info.webpage_url || url,
                title: info.title || 'Unknown Media',
                platform,
                thumbnailUrl: info.thumbnail || '',
                author: info.uploader || info.channel || info.uploader_id || 'Unknown',
                authorUrl: info.uploader_url || info.channel_url,
                duration: info.duration,
                uploadDate: info.upload_date, // YYYYMMDD
                description: info.description,
                viewCount: info.view_count,
                likeCount: info.like_count,
                isLive: info.is_live || false,
                webpageUrl: info.webpage_url,
                availableQualities: availableQualities.length > 0 ? availableQualities : undefined
            };
        } catch (error: any) {
            // Provide a cleaner error message
            let msg = error.message || String(error);
            if (msg.includes('Video unavailable')) msg = 'Video is unavailable or private';
            if (msg.includes('Login required')) msg = 'Login required to access this content';
            throw new Error(`Failed to get media info: ${msg}`);
        }
    }

    async downloadMedia(
        options: UniversalDownloadOptions,
        progressCallback?: (progress: UniversalDownloadProgress) => void
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
        options: UniversalDownloadOptions,
        progressCallback?: (progress: UniversalDownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();

        const { url, format, quality, outputPath, maxSpeed, id, cookiesBrowser } = options;
        const downloadId = id || randomUUID();

        try {
            // First get info to determine filename and platform
            // NOTE: We could skip this to save time and rely on yt-dlp filename, 
            // but getting metadata first is safer for history/thumbnails.
            // However, for pure speed, we might want to do it in one go.
            // Let's get info first as used in other downloaders.
            const info = await this.getMediaInfo(url);

            const sanitizedTitle = this.sanitizeFilename(info.title);
            const author = this.sanitizeFilename(info.author || 'unknown');

            const downloadsPath = outputPath || this.store.get('settings.downloadPath') || app.getPath('downloads');
            const extension = format === 'audio' ? 'mp3' : 'mp4';
            // Filename: [Platform] Author - Title [ID].ext
            // Keep it reasonably short
            const safeTitle = sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 50) + '...' : sanitizedTitle;
            const filename = `[${info.platform}] ${author} - ${safeTitle} [${info.id}].${extension}`;
            const outputTemplate = path.join(downloadsPath, filename);

            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            const args: string[] = [
                url,
                '-o', outputTemplate,
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

            const settings = this.getSettings();
            const browserForCookies = cookiesBrowser || settings.useBrowserCookies;
            if (browserForCookies) {
                args.push('--cookies-from-browser', browserForCookies);
            }

            // Quality / Format Logic
            if (format === 'audio') {
                args.push(
                    '-x',
                    '--audio-format', 'mp3'
                );

                // Audio quality: 0 (best), 5 (192kbps), 9 (128kbps)
                const audioQuality = quality || '0';
                args.push('--audio-quality', audioQuality);
            } else {
                // Video - support specific quality strings like "1080p", "720p", etc.
                if (quality && quality.endsWith('p')) {
                    // Specific quality requested (e.g., "1080p", "720p")
                    const height = quality.replace('p', '');
                    args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
                } else {
                    // Fallback to best quality
                    args.push('-f', 'bestvideo+bestaudio/best');
                }
                args.push('--merge-output-format', 'mp4');
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

                                const unitMultipliers: any = { 'B': 1, 'KiB': 1024, 'MiB': 1024 * 1024, 'GiB': 1024 * 1024 * 1024 };
                                totalBytes = sizeVal * (unitMultipliers[sizeUnit] || 1);
                                downloadedBytes = (percent / 100) * totalBytes;
                                const speed = speedVal * (unitMultipliers[speedUnit] || 1);

                                // Parse ETA
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
                                        filename,
                                        platform: info.platform
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
                                    filePath: outputTemplate,
                                    platform: info.platform
                                });
                            }

                            // History
                            this.addToHistory({
                                id: downloadId,
                                url,
                                title: info.title,
                                platform: info.platform,
                                thumbnailUrl: info.thumbnailUrl,
                                author: info.author,
                                timestamp: Date.now(),
                                path: outputTemplate,
                                size: totalBytes,
                                duration: info.duration,
                                format: format,
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

    getHistory(): UniversalHistoryItem[] {
        return this.store.get('history', []);
    }

    clearHistory(): void {
        this.store.set('history', []);
    }

    removeFromHistory(id: string): void {
        const history = this.getHistory();
        this.store.set('history', history.filter(h => h.id !== id));
    }

    private addToHistory(item: UniversalHistoryItem) {
        const history = this.getHistory();
        history.unshift(item);
        this.store.set('history', history.slice(0, 200));
    }

    getSettings(): UniversalSettings {
        return this.store.get('settings');
    }

    saveSettings(settings: Partial<UniversalSettings>): void {
        const current = this.getSettings();
        this.store.set('settings', { ...current, ...settings });
    }

    // --- Helpers ---

    private sanitizeFilename(name: string): string {
        return name.replace(/[<>:"/\\|?*]/g, '').trim();
    }
}

export const universalDownloader = new UniversalDownloader();
