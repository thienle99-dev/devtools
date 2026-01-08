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
            if (e.includes('facebook') || e.includes('fb')) return 'facebook';
            if (e.includes('twitter') || e.includes('x') || e.includes('periscope')) return 'twitter';
            if (e.includes('twitch')) return 'twitch';
            if (e.includes('reddit')) return 'reddit';
            if (e.includes('vimeo')) return 'other'; // Could add 'vimeo' to types if needed
            if (e.includes('pinterest')) return 'other';
            if (e.includes('soundcloud')) return 'other';
        }

        if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
        if (u.includes('tiktok.com')) return 'tiktok';
        if (u.includes('instagram.com')) return 'instagram';
        if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
        if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
        if (u.includes('twitch.tv')) return 'twitch';
        if (u.includes('reddit.com') || u.includes('redd.it')) return 'reddit';
        if (u.includes('pinterest.com')) return 'other';
        if (u.includes('vimeo.com')) return 'other';

        return 'other';
    }

    async getMediaInfo(url: string): Promise<UniversalMediaInfo> {
        await this.ensureInitialized();

        try {
            const args = [
                url,
                '--dump-json',
                '--no-check-certificate',
                '--no-call-home'
            ];

            // Improved detection: If it's a "watch" link with a playlist (RD or PL), we should still
            // allow fetching single video info first, but if it's ONLY a playlist link, use flat-playlist.
            const hasVideoId = url.includes('v=') || url.includes('youtu.be/');
            const isPlaylistOnly = (url.includes('list=') || url.includes('/playlist') || url.includes('/sets/')) && !hasVideoId;

            if (isPlaylistOnly) {
                args.push('--flat-playlist');
            } else {
                args.push('--no-playlist');
            }

            const settings = this.getSettings();
            if (settings.useBrowserCookies) {
                args.push('--cookies-from-browser', settings.useBrowserCookies);
            }

            const stdout = await this.ytDlp.execPromise(args);
            const info = JSON.parse(stdout);

            const platform = this.detectPlatform(url, info.extractor);
            const isPlaylist = info._type === 'playlist' || !!info.entries;

            // If it's not a playlist but the URL has a list ID, it might be a "watch & list" link
            // We can check info.playlist_id or the URL
            const hasPlaylistContext = url.includes('list=') || !!info.playlist_id;

            // Extract available video qualities
            const availableQualities: string[] = [];

            // If it's a playlist mode, get formats from first entry. Otherwise from root.
            const formatsSource = (isPlaylist && info.entries && info.entries[0]) ? info.entries[0].formats : info.formats;

            if (formatsSource && Array.isArray(formatsSource)) {
                const qualitySet = new Set<string>();
                formatsSource.forEach((fmt: any) => {
                    if (fmt.vcodec && fmt.vcodec !== 'none') {
                        if (fmt.height) {
                            qualitySet.add(`${fmt.height}p`);
                        } else if (fmt.format_note && /^\d+p$/.test(fmt.format_note)) {
                            qualitySet.add(fmt.format_note);
                        } else if (fmt.resolution && /^\d+x\d+$/.test(fmt.resolution)) {
                            const h = fmt.resolution.split('x')[1];
                            qualitySet.add(`${h}p`);
                        }
                    }
                });
                // If it's a direct file or no standard qualities found, check if info itself has resolution
                if (qualitySet.size === 0 && info.height) {
                    qualitySet.add(`${info.height}p`);
                }

                const sortedQualities = Array.from(qualitySet).sort((a, b) => {
                    const hA = parseInt(a);
                    const hB = parseInt(b);
                    return hB - hA;
                });
                availableQualities.push(...sortedQualities);
            }

            // Playlist videos
            const playlistVideos = isPlaylist && info.entries ? info.entries.map((entry: any) => ({
                id: entry.id,
                title: entry.title,
                duration: entry.duration,
                url: entry.url || (platform === 'youtube' ? `https://www.youtube.com/watch?v=${entry.id}` : entry.url),
                thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail
            })) : undefined;

            // Fallback for metadata
            const title = info.title || info.id || 'Untitled Media';
            const thumbnail = info.thumbnail || (info.entries?.[0]?.thumbnail) || (info.thumbnails?.[0]?.url) || '';

            return {
                id: info.id || info.entries?.[0]?.id || 'unknown',
                url: info.webpage_url || url,
                title,
                platform,
                thumbnailUrl: thumbnail,
                author: info.uploader || info.channel || info.uploader_id || 'Unknown',
                authorUrl: info.uploader_url || info.channel_url,
                duration: info.duration,
                uploadDate: info.upload_date,
                description: info.description,
                viewCount: info.view_count,
                likeCount: info.like_count,
                isLive: info.is_live || false,
                webpageUrl: info.webpage_url,
                availableQualities: availableQualities.length > 0 ? availableQualities : undefined,
                isPlaylist: isPlaylist || hasPlaylistContext,
                playlistCount: (isPlaylist || hasPlaylistContext) ? info.playlist_count || info.entries?.length : undefined,
                playlistVideos
            };
        } catch (error: any) {
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

        const { url, format, quality, outputPath, maxSpeed, id, cookiesBrowser, embedSubs, isPlaylist } = options;
        const downloadId = id || randomUUID();

        try {
            // Get info again or use provided info to determine filename
            // For playlists, we need to be careful with titles
            const info = await this.getMediaInfo(url);

            const sanitizedTitle = this.sanitizeFilename(info.title);
            const author = this.sanitizeFilename(info.author || 'unknown');

            const downloadsPath = outputPath || this.store.get('settings.downloadPath') || app.getPath('downloads');
            const extension = format === 'audio' ? 'mp3' : 'mp4';

            // Output template and display name
            let outputTemplate: string;
            let displayFilename: string;

            const shouldDownloadPlaylist = isPlaylist === true;
            const platformName = (info.platform || 'Other').toUpperCase();

            if (shouldDownloadPlaylist) {
                const playlistFolder = path.join(downloadsPath, sanitizedTitle);
                if (!fs.existsSync(playlistFolder)) {
                    fs.mkdirSync(playlistFolder, { recursive: true });
                }
                outputTemplate = path.join(playlistFolder, '%(playlist_index)s - %(title)s.%(ext)s');
                displayFilename = `[${platformName} PLAYLIST] ${sanitizedTitle}`;
            } else {
                const safeTitle = sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 50) + '...' : sanitizedTitle;
                displayFilename = `[${platformName}] ${author} - ${safeTitle} [${info.id}].${extension}`;
                outputTemplate = path.join(downloadsPath, displayFilename);
            }

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

            if (!shouldDownloadPlaylist) {
                args.push('--no-playlist');
            }

            // Subtitles
            if (embedSubs && info.platform === 'youtube') {
                args.push('--all-subs', '--embed-subs', '--write-auto-subs');
            }

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

            if (!isPlaylist && !info.isPlaylist) {
                args.push('--no-playlist');
            }

            return new Promise((resolve, reject) => {
                let totalBytes = 0;
                let downloadedBytes = 0;
                let percent = 0;
                let currentItemFilename = displayFilename;

                const process = this.ytDlp.exec(args);
                this.activeProcesses.set(downloadId, process);

                // Progress Parsing
                if (process.ytDlpProcess) {
                    process.ytDlpProcess.stdout?.on('data', (data: Buffer) => {
                        const output = data.toString();

                        output.split(/\r?\n/).forEach(line => {
                            if (!line.trim()) return;

                            // Detect currently downloading item in playlist
                            const itemMatch = line.match(/\[download\] Destination: .*[/\\](.*)$/);
                            if (itemMatch) {
                                currentItemFilename = itemMatch[1];
                            }

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
                                        filename: info.isPlaylist ? `${displayFilename} (${currentItemFilename})` : displayFilename,
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
                        // verify file exists (if single file)
                        const finalPath = (isPlaylist || info.isPlaylist) ? path.join(downloadsPath, sanitizedTitle) : outputTemplate;

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
                                filename: displayFilename,
                                filePath: finalPath,
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
                            path: finalPath,
                            size: totalBytes,
                            duration: info.duration,
                            format: format,
                            status: 'completed'
                        });

                        resolve(finalPath);
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
