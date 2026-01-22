import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import si from 'systeminformation';
import type {
    UniversalDownloadOptions,
    UniversalMediaInfo,
    UniversalHistoryItem,
    UniversalDownloadProgress,
    SupportedPlatform
} from '../../src/types/universal-media';
import { DownloadError, ErrorParser } from './errors/DownloadError';
import { errorLogger } from './errors/ErrorLogger';
import { retryManager } from './errors/RetryManager';

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
    queue: Array<{
        options: UniversalDownloadOptions;
        state: 'queued' | 'downloading' | 'paused' | 'error';
    }>;
}


export class UniversalDownloader {
    private ytDlp: any;
    private activeProcesses: Map<string, any> = new Map();
    private activeOptions: Map<string, UniversalDownloadOptions> = new Map();
    private binaryPath: string;

    private initPromise: Promise<void>;
    private store: Store<StoreSchema>;
    private ffmpegPath: string | null = null;

    // Queue System
    private downloadQueue: Array<{
        options: UniversalDownloadOptions;
        run: () => Promise<string>;
        resolve: (value: string | PromiseLike<string>) => void;
        reject: (reason?: any) => void;
        state: 'queued' | 'downloading' | 'paused' | 'error';
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
                },
                queue: []
            }
        });


        const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        this.binaryPath = path.join(app.getPath('userData'), binaryName);
        this.initPromise = this.init();

        // Initialize queue processing loop
        setInterval(() => this.processQueue(), 5000);

        // Load persisted queue
        this.loadPersistedQueue();
    }

    private loadPersistedQueue() {
        const persistedQueue = this.store.get('queue') || [];
        for (const item of persistedQueue) {
            this.downloadQueue.push({
                options: item.options,
                run: () => this.executeDownload(item.options),
                resolve: () => { },
                reject: () => { },
                state: item.state === 'downloading' ? 'paused' : item.state as any
            });
        }
    }

    private saveQueuePersistently() {
        const toSave = this.downloadQueue.map(item => ({
            options: item.options,
            state: item.state
        }));
        this.store.set('queue', toSave);
    }

    /**
     * Prepare for app shutdown - save all active downloads to queue
     */
    prepareForShutdown() {
        console.log('🔄 Preparing downloads for shutdown...');

        // Convert all active downloads to paused state in queue
        this.activeProcesses.forEach((process, downloadId) => {
            const options = this.activeOptions.get(downloadId);
            if (options) {
                // Add to queue if not already there
                const existsInQueue = this.downloadQueue.some(item => item.options.id === downloadId);
                if (!existsInQueue) {
                    this.downloadQueue.push({
                        options,
                        run: () => this.executeDownload(options),
                        resolve: () => { },
                        reject: () => { },
                        state: 'paused'
                    });
                } else {
                    // Update state to paused
                    const queueItem = this.downloadQueue.find(item => item.options.id === downloadId);
                    if (queueItem) {
                        queueItem.state = 'paused';
                    }
                }
            }

            // Kill the process
            if (process.ytDlpProcess) {
                process.ytDlpProcess.kill('SIGTERM');
            }
        });

        // Save the queue
        this.saveQueuePersistently();

        const pendingCount = this.downloadQueue.filter(item =>
            item.state === 'queued' || item.state === 'paused'
        ).length;

        console.log(`✅ Saved ${pendingCount} pending downloads`);
        return pendingCount;
    }

    /**
     * Get count of pending downloads that can be resumed
     */
    getPendingDownloadsCount(): number {
        const persisted = this.store.get('queue') || [];
        return persisted.filter(item =>
            item.state === 'queued' || item.state === 'paused'
        ).length;
    }

    /**
     * Resume all pending downloads from previous session
     */
    resumePendingDownloads() {
        console.log('🔄 Resuming pending downloads...');
        const pending = this.downloadQueue.filter(item =>
            item.state === 'queued' || item.state === 'paused'
        );

        pending.forEach(item => {
            item.state = 'queued';
        });

        this.saveQueuePersistently();
        this.processQueue();

        console.log(`✅ Resumed ${pending.length} downloads`);
    }

    /**
     * Clear all pending downloads (user chose not to resume)
     */
    clearPendingDownloads() {
        console.log('🗑️ Clearing pending downloads...');
        this.downloadQueue = this.downloadQueue.filter(item =>
            item.state === 'downloading'
        );
        this.saveQueuePersistently();
    }

    /**
     * Handle download error with retry logic
     */
    private handleDownloadError(
        error: Error | DownloadError,
        downloadId: string,
        url: string,
        platform: SupportedPlatform,
        progressCallback?: (progress: UniversalDownloadProgress) => void
    ): DownloadError {
        // Convert to DownloadError if needed
        const downloadError = error instanceof DownloadError
            ? error
            : ErrorParser.parse(error, { url, platform });

        // Update retry count in metadata
        const retryState = retryManager.getRetryState(downloadId);
        if (retryState) {
            downloadError.metadata.retryCount = retryState.attemptCount;
        }

        // Log the error
        const errorId = errorLogger.log(downloadError, downloadId);

        console.error(
            `[Download Error] ${downloadId}: ${downloadError.code} - ${downloadError.message}`,
            `(Retry: ${downloadError.metadata.retryCount || 0})`
        );

        // Notify frontend of error
        if (progressCallback) {
            progressCallback({
                id: downloadId,
                percent: 0,
                downloaded: 0,
                total: 0,
                speed: 0,
                eta: 0,
                state: 'error',
                filename: url,
                platform,
                error: {
                    code: downloadError.code,
                    message: downloadError.message,
                    suggestions: downloadError.suggestions,
                    retryable: downloadError.retryable,
                    errorId
                } as any
            });
        }

        // Schedule retry if applicable
        if (downloadError.retryable) {
            const options = this.activeOptions.get(downloadId);
            if (options) {
                const retryResult = retryManager.scheduleRetry(
                    downloadId,
                    async () => {
                        await this.executeDownload(options, progressCallback);
                    },
                    downloadError
                );

                if (retryResult.scheduled) {
                    console.log(
                        `[Retry Scheduled] ${downloadId} will retry in ${(retryResult.delay! / 1000).toFixed(1)}s`
                    );

                    // Update progress with retry info
                    if (progressCallback) {
                        progressCallback({
                            id: downloadId,
                            percent: 0,
                            downloaded: 0,
                            total: 0,
                            speed: 0,
                            eta: retryResult.delay! / 1000,
                            state: 'error',
                            filename: url,
                            platform,
                            error: {
                                code: downloadError.code,
                                message: `${downloadError.message} - Retrying in ${(retryResult.delay! / 1000).toFixed(0)}s...`,
                                suggestions: downloadError.suggestions,
                                retryable: true,
                                retryAt: retryResult.retryAt,
                                errorId
                            } as any
                        });
                    }
                }
            }
        }

        return downloadError;
    }

    /**
     * Get error log
     */
    getErrorLog(limit?: number) {
        return errorLogger.getRecentErrors(limit);
    }

    /**
     * Export error log
     */
    async exportErrorLog(format: 'json' | 'csv' | 'txt'): Promise<string> {
        return await errorLogger.exportToFile(format);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            errorLog: errorLogger.getStats(),
            retryManager: retryManager.getStats()
        };
    }

    /**
     * Clear error log
     */
    clearErrorLog(type: 'all' | 'resolved' = 'resolved') {
        if (type === 'all') {
            errorLogger.clearAll();
        } else {
            errorLogger.clearResolved();
        }
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

            // Check FFmpeg using smart helper
            const { FFmpegHelper } = await import('./ffmpeg-helper');
            const ffmpegPath = FFmpegHelper.getFFmpegPath();

            if (ffmpegPath) {
                this.ffmpegPath = ffmpegPath;
                console.log('✅ Universal Downloader: FFmpeg ready');
            } else {
                console.warn('⚠️ Universal Downloader: FFmpeg not available');
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
            const hasVideoId = url.includes('v=') || url.includes('youtu.be/') || url.includes('/video/') || url.includes('/v/');
            const hasPlaylistId = url.includes('list=') || url.includes('/playlist') || url.includes('/sets/') || url.includes('/album/') || url.includes('/c/') || url.includes('/channel/') || url.includes('/user/');

            const settings = this.getSettings();
            const commonArgs = ['--dump-json', '--no-check-certificate'];
            if (settings.useBrowserCookies) {
                commonArgs.push('--cookies-from-browser', settings.useBrowserCookies);
            }

            // Decide which call(s) to make
            const mainArgs = [url, ...commonArgs];
            if (hasPlaylistId && !hasVideoId) {
                mainArgs.push('--flat-playlist');
            } else {
                mainArgs.push('--no-playlist');
            }

            // If we have both, we can fetch playlist entries in parallel to be faster
            const fetchPlaylistEntries = hasPlaylistId && hasVideoId;
            const playlistArgs = fetchPlaylistEntries ? [url, ...commonArgs, '--flat-playlist'] : null;

            const [mainRes, playlistRes] = await Promise.allSettled([
                this.ytDlp.execPromise(mainArgs),
                playlistArgs ? this.ytDlp.execPromise(playlistArgs) : Promise.resolve(null)
            ]);

            if (mainRes.status === 'rejected') throw mainRes.reason;

            const stdout = mainRes.value;
            const lines = stdout.trim().split('\n');
            let info = JSON.parse(lines[0]);

            // Handle multiple lines/entries (some extractors return one per line)
            if (lines.length > 1 && !info.entries) {
                const entries = lines.map((l: string) => {
                    try { return JSON.parse(l); } catch (e) { return null; }
                }).filter((i: any) => i !== null);
                info = { ...entries[0], entries, _type: 'playlist' };
            }

            // Merge playlist entries if fetched in parallel
            if (playlistRes.status === 'fulfilled' && playlistRes.value) {
                try {
                    const pLines = playlistRes.value.trim().split('\n');
                    let playlistInfo = JSON.parse(pLines[0]);

                    // If multiple lines, it's a flat list of entries
                    if (pLines.length > 1 && !playlistInfo.entries) {
                        const entries = pLines.map((l: string) => {
                            try { return JSON.parse(l); } catch (e) { return null; }
                        }).filter((i: any) => i !== null);
                        playlistInfo = { ...entries[0], entries };
                    }

                    if (playlistInfo.entries && !info.entries) {
                        info.entries = playlistInfo.entries;
                        info.playlist_count = playlistInfo.playlist_count || playlistInfo.entries.length;
                        if (!info._type) info._type = 'playlist';
                    }
                } catch (e) {
                    console.warn('Failed to parse auxiliary playlist info:', e);
                }
            }

            const platform = this.detectPlatform(url, info.extractor);
            const isPlaylist = info._type === 'playlist' || !!info.entries || info._type === 'multi_video';

            // If it's not a playlist but the URL has a list ID, it might be a "watch & list" link
            const hasPlaylistContext = hasPlaylistId || !!info.playlist_id;

            // Extract available video qualities
            const availableQualities: string[] = [];

            // If it's a playlist mode, get formats from first entry. Otherwise from root.
            const formatsSource = (isPlaylist && info.entries && info.entries[0]) ? info.entries[0].formats : info.formats;

            if (formatsSource && Array.isArray(formatsSource)) {
                const qualitySet = new Set<string>();
                formatsSource.forEach((fmt: any) => {
                    // More robust video detection: check vcodec OR dimensions
                    const isVideo = (fmt.vcodec && fmt.vcodec !== 'none') || (fmt.height && fmt.height > 0) || (fmt.width && fmt.width > 0);

                    if (isVideo) {
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
                playlistVideos,
                size: info.filesize || info.filesize_approx
            };
        } catch (error: any) {
            // Parse error into structured DownloadError
            const downloadError = ErrorParser.parse(error, {
                url,
                platform: this.detectPlatform(url)
            });

            // Log the error
            errorLogger.log(downloadError);

            throw downloadError;
        }
    }
    async downloadMedia(
        options: UniversalDownloadOptions,
        progressCallback?: (progress: UniversalDownloadProgress) => void
    ): Promise<string> {
        const downloadId = options.id || randomUUID();

        return new Promise((resolve, reject) => {
            this.downloadQueue.push({
                options: { ...options, id: downloadId },
                run: () => this.executeDownload({ ...options, id: downloadId }, progressCallback),
                resolve,
                reject,
                state: 'queued'
            });
            this.saveQueuePersistently();
            this.processQueue();
        });
    }

    async retryDownload(id: string): Promise<void> {
        // 1. Check if it's already in the queue in error state
        const queuedItem = this.downloadQueue.find(item => item.options.id === id);
        if (queuedItem) {
            queuedItem.state = 'queued';
            this.saveQueuePersistently();
            this.processQueue();
            return;
        }

        // 2. Check if it's in activeOptions (maybe it was paused/killed and lost from queue)
        const options = this.activeOptions.get(id);
        if (options) {
            this.downloadQueue.push({
                options,
                run: () => this.executeDownload(options),
                resolve: () => { },
                reject: () => { },
                state: 'queued'
            });
            this.saveQueuePersistently();
            this.processQueue();
            return;
        }

        // 3. Fallback to history
        const historyItem = this.store.get('history').find(h => h.id === id);
        if (historyItem) {
            const reconstructedOptions: UniversalDownloadOptions = {
                url: historyItem.url,
                format: historyItem.format || 'video',
                quality: 'best',
                id: historyItem.id
            };
            this.downloadQueue.push({
                options: reconstructedOptions,
                run: () => this.executeDownload(reconstructedOptions),
                resolve: () => { },
                reject: () => { },
                state: 'queued'
            });
            this.saveQueuePersistently();
            this.processQueue();
        }
    }



    async pauseDownload(id: string): Promise<void> {
        const proc = this.activeProcesses.get(id);
        if (proc && proc.ytDlpProcess) {
            const task = this.downloadQueue.find(t => t.options.id === id);
            if (task) task.state = 'paused';
            proc.ytDlpProcess.kill('SIGTERM');
            this.saveQueuePersistently();
        }
    }

    async resumeDownload(id: string): Promise<void> {
        // Check if already in queue
        const queuedItem = this.downloadQueue.find(item => item.options.id === id);
        if (queuedItem) {
            queuedItem.state = 'queued';
            this.saveQueuePersistently();
            this.processQueue();
            return;
        }

        const options = this.activeOptions.get(id);
        if (options) {
            // Re-add to queue at the front
            this.downloadQueue.unshift({
                options,
                run: () => this.executeDownload(options),
                resolve: () => { },
                reject: () => { },
                state: 'queued'
            });
            this.saveQueuePersistently();
            this.processQueue();
        }
    }



    async checkDiskSpace(downloadPath?: string): Promise<{ available: number; total: number; warning: boolean }> {
        try {
            const targetPath = downloadPath || this.store.get('settings.downloadPath') || app.getPath('downloads');
            const disks = await si.fsSize();

            // Find the disk that contains the target path
            // On macOS/Linux, we look for the mount point that is a prefix of the target path
            // and has the longest length.
            let disk = disks[0];
            let maxMatchLen = -1;

            for (const d of disks) {
                if (targetPath.startsWith(d.mount) && d.mount.length > maxMatchLen) {
                    maxMatchLen = d.mount.length;
                    disk = d;
                }
            }

            if (!disk) return { available: 0, total: 0, warning: false };

            const available = disk.available;
            const total = disk.size;

            // Warning if less than 5GB or less than 10%
            const warning = available < 5 * 1024 * 1024 * 1024 || (available / total) < 0.1;

            return { available, total, warning };
        } catch (error) {
            console.error('Failed to check disk space:', error);
            return { available: 0, total: 0, warning: false };
        }
    }

    getQueue() {
        return this.downloadQueue.map(item => ({
            id: item.options.id,
            url: item.options.url,
            state: item.state,
            filename: item.options.url // Temporary until metadata is fetched
        }));
    }

    reorderQueue(id: string, newIndex: number): void {
        const index = this.downloadQueue.findIndex(item => item.options.id === id);
        if (index !== -1 && newIndex >= 0 && newIndex < this.downloadQueue.length) {
            const item = this.downloadQueue.splice(index, 1)[0];
            this.downloadQueue.splice(newIndex, 0, item);
            this.saveQueuePersistently();
        }
    }



    private async processQueue() {
        const settings = this.getSettings();
        const maxConcurrent = settings.maxConcurrentDownloads || 3;

        // Check disk space before starting any new download
        const space = await this.checkDiskSpace();
        if (space.available < 500 * 1024 * 1024) { // Less than 500MB
            console.warn('Low disk space, skipping queue processing');
            return;
        }

        while (this.activeDownloadsCount < maxConcurrent) {
            const task = this.downloadQueue.find(t => t.state === 'queued');
            if (!task) break;

            this.activeDownloadsCount++;
            task.state = 'downloading';
            this.saveQueuePersistently();

            task.run()
                .then(result => {
                    task.state = 'downloading'; // actually it will be removed soon
                    this.downloadQueue = this.downloadQueue.filter(t => t !== task);
                    task.resolve(result);
                })
                .catch(error => {
                    task.state = 'error';
                    task.reject(error);
                })
                .finally(() => {
                    this.activeDownloadsCount--;
                    this.saveQueuePersistently();
                    this.processQueue();
                });
        }
    }


    private async executeDownload(
        options: UniversalDownloadOptions,
        progressCallback?: (progress: UniversalDownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();

        const { url, format, quality, outputPath, maxSpeed, id, cookiesBrowser, embedSubs, isPlaylist, playlistItems, audioFormat } = options;
        const downloadId = id || randomUUID();
        this.activeOptions.set(downloadId, options);


        // Check disk space before starting
        try {
            const space = await this.checkDiskSpace(outputPath);
            if (space.warning && space.available < 100 * 1024 * 1024) { // Less than 100MB
                throw new Error('Not enough disk space to start download.');
            }
        } catch (e) {
            console.warn('Disk space check failed:', e);
        }

        try {


            // Get info again or use provided info to determine filename
            // For playlists, we need to be careful with titles
            const info = await this.getMediaInfo(url);

            const sanitizedTitle = this.sanitizeFilename(info.title);
            const author = this.sanitizeFilename(info.author || 'unknown');

            const downloadsPath = outputPath || this.store.get('settings.downloadPath') || app.getPath('downloads');
            const extension = format === 'audio' ? (audioFormat || 'mp3') : 'mp4';

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
            } else if (playlistItems) {
                args.push('--playlist-items', playlistItems);
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
                    '--audio-format', audioFormat || 'mp3'
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
                let stderrOutput = '';

                const process = this.ytDlp.exec(args);
                this.activeProcesses.set(downloadId, process);

                // Progress Parsing
                if (process.ytDlpProcess) {
                    // Capture stderr for error debugging
                    process.ytDlpProcess.stderr?.on('data', (data: Buffer) => {
                        stderrOutput += data.toString();
                    });

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
                            // Also handles variants like ~10.00MB or ETA 01:02:03
                            const progressMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+)([\w]+)\s+at\s+([\d.]+)([\w/]+)\s+ETA\s+([\d:]+)/);

                            if (progressMatch) {
                                percent = parseFloat(progressMatch[1]);
                                const sizeVal = parseFloat(progressMatch[2]);
                                const sizeUnit = progressMatch[3];
                                const speedVal = parseFloat(progressMatch[4]);
                                const speedUnit = progressMatch[5].split('/')[0]; // Remove /s if present
                                const etaStr = progressMatch[6];

                                const unitMultipliers: any = {
                                    'B': 1,
                                    'KB': 1024, 'KIB': 1024, 'K': 1024,
                                    'MB': 1024 * 1024, 'MIB': 1024 * 1024, 'M': 1024 * 1024,
                                    'GB': 1024 * 1024 * 1024, 'GIB': 1024 * 1024 * 1024, 'G': 1024 * 1024 * 1024,
                                    'TB': 1024 * 1024 * 1024 * 1024, 'TIB': 1024 * 1024 * 1024 * 1024, 'T': 1024 * 1024 * 1024 * 1024
                                };

                                totalBytes = sizeVal * (unitMultipliers[sizeUnit.toUpperCase()] || 1);
                                downloadedBytes = (percent / 100) * totalBytes;
                                const speed = speedVal * (unitMultipliers[speedUnit.toUpperCase()] || 1);

                                // Parse ETA (HH:MM:SS or MM:SS)
                                const etaParts = etaStr.split(':').reverse();
                                let eta = 0;
                                if (etaParts[0]) eta += parseInt(etaParts[0]); // Seconds
                                if (etaParts[1]) eta += parseInt(etaParts[1]) * 60; // Minutes
                                if (etaParts[2]) eta += parseInt(etaParts[2]) * 3600; // Hours

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

                process.on('close', (code: number | null) => {
                    this.activeProcesses.delete(downloadId);
                    // Don't delete options yet, we might need them for resume
                    // this.activeOptions.delete(downloadId); 

                    if (code === 0) {
                        this.activeOptions.delete(downloadId); // Done

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
                    } else if (code === null) {
                        // Process was killed/terminated
                        const errorMsg = stderrOutput
                            ? `Download terminated: ${stderrOutput.substring(0, 200)}`
                            : 'Download was cancelled or terminated unexpectedly';

                        const error = this.handleDownloadError(
                            new Error(errorMsg),
                            downloadId,
                            url,
                            info.platform,
                            progressCallback
                        );

                        reject(error);
                    } else {
                        // Non-zero exit code - parse error from stderr
                        const errorMsg = stderrOutput || `Download failed (exit code: ${code})`;

                        const error = this.handleDownloadError(
                            new Error(errorMsg),
                            downloadId,
                            url,
                            info.platform,
                            progressCallback
                        );

                        reject(error);
                    }
                });

                process.on('error', (err: Error) => {
                    this.activeProcesses.delete(downloadId);

                    const error = this.handleDownloadError(
                        err,
                        downloadId,
                        url,
                        info.platform,
                        progressCallback
                    );

                    reject(error);
                });

                // Timeout protection (1 hour max for downloads)
                const timeout = setTimeout(() => {
                    if (this.activeProcesses.has(downloadId)) {
                        console.warn(`Download timeout for ${downloadId}, killing process`);
                        const proc = this.activeProcesses.get(downloadId);
                        if (proc && proc.ytDlpProcess) {
                            proc.ytDlpProcess.kill('SIGTERM');
                        }
                    }
                }, 3600000); // 1 hour

                // Clear timeout on completion
                const originalResolve = resolve;
                const originalReject = reject;

                resolve = (value: any) => {
                    clearTimeout(timeout);
                    originalResolve(value);
                };

                reject = (reason: any) => {
                    clearTimeout(timeout);
                    originalReject(reason);
                };
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
            this.downloadQueue = this.downloadQueue.filter(t => t.options.id !== id);
            this.saveQueuePersistently();
        } else {
            this.activeProcesses.forEach(proc => {
                if (proc.ytDlpProcess) proc.ytDlpProcess.kill();
            });
            this.downloadQueue = [];
            this.saveQueuePersistently();
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
