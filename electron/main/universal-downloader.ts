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
                }
            }
        });

        const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        this.binaryPath = path.join(app.getPath('userData'), binaryName);
        this.initPromise = this.init();

        // Initialize queue processing loop
        setInterval(() => this.processQueue(), 5000);
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
                playlistVideos,
                size: info.filesize || info.filesize_approx
            };
        } catch (error: any) {
            let msg = error.message || String(error);

            // Network errors
            if (msg.includes('nodename nor servname provided') ||
                msg.includes('getaddrinfo') ||
                msg.includes('ENOTFOUND') ||
                msg.includes('Unable to download webpage') ||
                msg.includes('Unable to download API page')) {
                throw new Error('Network error: Please check your internet connection');
            }

            // Content errors
            if (msg.includes('Video unavailable')) msg = 'Video is unavailable or private';
            if (msg.includes('Login required')) msg = 'Login required to access this content';
            if (msg.includes('Private video')) msg = 'This video is private';
            if (msg.includes('HTTP Error 429')) msg = 'Too many requests. Please try again later';
            if (msg.includes('Geographic restriction')) msg = 'This video is not available in your country';

            throw new Error(`Failed to get media info: ${msg}`);
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
            this.processQueue();
        });
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

    private async processQueue() {
        const settings = this.getSettings();
        const maxConcurrent = settings.maxConcurrentDownloads || 3;

        // Check disk space before starting any new download
        const space = await this.checkDiskSpace();
        if (space.available < 500 * 1024 * 1024) { // Less than 500MB
            // We don't throw error here to avoid killing the app, but we don't start new ones
            console.warn('Low disk space, skipping queue processing');
            return;
        }

        while (this.activeDownloadsCount < maxConcurrent && this.downloadQueue.length > 0) {
            const task = this.downloadQueue.shift();
            if (task) {
                this.activeDownloadsCount++;
                task.state = 'downloading';
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

        const { url, format, quality, outputPath, maxSpeed, id, cookiesBrowser, embedSubs, isPlaylist, playlistItems } = options;
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
                    } else if (code === null) {
                        // Process was killed/terminated
                        console.error('yt-dlp process terminated unexpectedly');
                        if (stderrOutput) {
                            console.error('stderr output:', stderrOutput);
                        }

                        const errorMsg = stderrOutput
                            ? `Download terminated: ${stderrOutput.substring(0, 200)}`
                            : 'Download was cancelled or terminated unexpectedly';

                        if (progressCallback) {
                            progressCallback({
                                id: downloadId,
                                percent: 0,
                                downloaded: downloadedBytes,
                                total: totalBytes,
                                speed: 0,
                                eta: 0,
                                state: 'error',
                                filename: displayFilename,
                                platform: info.platform
                            });
                        }

                        reject(new Error(errorMsg));
                    } else {
                        // Non-zero exit code
                        console.error(`yt-dlp exited with code ${code}`);
                        if (stderrOutput) {
                            console.error('stderr output:', stderrOutput);
                        }

                        // Parse common error messages
                        let errorMsg = `Download failed (exit code: ${code})`;
                        if (stderrOutput.includes('Video unavailable')) {
                            errorMsg = 'Video is unavailable or has been removed';
                        } else if (stderrOutput.includes('Private video')) {
                            errorMsg = 'Video is private';
                        } else if (stderrOutput.includes('Login required')) {
                            errorMsg = 'Login required to access this content';
                        } else if (stderrOutput.includes('HTTP Error 429')) {
                            errorMsg = 'Too many requests. Please try again later';
                        } else if (stderrOutput.includes('No space left')) {
                            errorMsg = 'No space left on device';
                        } else if (stderrOutput) {
                            // Include first line of stderr for context
                            const firstErrorLine = stderrOutput.split('\n').find(line => line.trim());
                            if (firstErrorLine) {
                                errorMsg = firstErrorLine.substring(0, 150);
                            }
                        }

                        if (progressCallback) {
                            progressCallback({
                                id: downloadId,
                                percent: 0,
                                downloaded: downloadedBytes,
                                total: totalBytes,
                                speed: 0,
                                eta: 0,
                                state: 'error',
                                filename: displayFilename,
                                platform: info.platform
                            });
                        }

                        reject(new Error(errorMsg));
                    }
                });

                process.on('error', (err: Error) => {
                    this.activeProcesses.delete(downloadId);
                    console.error('yt-dlp process error:', err);
                    if (stderrOutput) {
                        console.error('stderr output:', stderrOutput);
                    }

                    if (progressCallback) {
                        progressCallback({
                            id: downloadId,
                            percent: 0,
                            downloaded: downloadedBytes,
                            total: totalBytes,
                            speed: 0,
                            eta: 0,
                            state: 'error',
                            filename: displayFilename,
                            platform: info.platform
                        });
                    }

                    reject(new Error(`Download process error: ${err.message}`));
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
