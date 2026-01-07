import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import https from 'https';

// Create require function for ES modules
const require = createRequire(import.meta.url);

export interface DownloadOptions {
    url: string;
    format: 'video' | 'audio' | 'best';
    quality?: string;
    container?: string;
    outputPath?: string;
    maxSpeed?: string;
    concurrentFragments?: number;
}

export interface Settings {
    downloadPath?: string;
    defaultVideoQuality: string;
    defaultAudioQuality: string;
    maxConcurrentDownloads: number;
    maxSpeedLimit?: string;
    ffmpegPath?: string;
}

export interface HistoryItem {
    id: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    format: string;
    quality: string;
    timestamp: number;
    path: string;
    size: number;
    duration: number;
    status: 'completed' | 'failed';
    playlistId?: string;
}

interface StoreSchema {
    history: HistoryItem[];
    settings: Settings;
}

export interface VideoFormat {
    itag: number;
    quality: string;
    qualityLabel?: string;
    hasVideo: boolean;
    hasAudio: boolean;
    container: string;
    codecs?: string;
    bitrate?: number;
    audioBitrate?: number;
}

export interface VideoInfo {
    videoId: string;
    title: string;
    author: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    uploadDate?: string;
    formats: VideoFormat[];
    availableQualities: string[];
    hasVideo: boolean;
    hasAudio: boolean;
}

export interface DownloadProgress {
    id?: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
    filename?: string;
}

export class YouTubeDownloader {
    private ytDlp: any;
    private activeProcesses: Map<string, any> = new Map();
    private binaryPath: string;
    private initPromise: Promise<void>;
    private hasAria2c: boolean = false;
    private hasFFmpeg: boolean = false;
    private ffmpegPath: string | null = null;
    private aria2Path: string | null = null;
    private store: Store<StoreSchema>;
    
    constructor() {
        this.store = new Store<StoreSchema>({
            name: 'youtube-download-history',
            defaults: { 
                history: [],
                settings: {
                    defaultVideoQuality: '1080p',
                    defaultAudioQuality: '0',
                    maxConcurrentDownloads: 3,
                    maxSpeedLimit: ''
                }
            }
        });
        // Set binary path in app data directory (add .exe for Windows)
        const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        this.binaryPath = path.join(app.getPath('userData'), binaryName);
        
        // Initialize yt-dlp wrapper asynchronously
        this.initPromise = this.initYtDlp();
    }

    private async initYtDlp(): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const ytDlpModule = require('yt-dlp-wrap');
            const YTDlpWrap = ytDlpModule.default || ytDlpModule;
            
            // Download yt-dlp binary if it doesn't exist
            if (!fs.existsSync(this.binaryPath)) {
                console.log('Downloading yt-dlp binary to:', this.binaryPath);
                try {
                    await YTDlpWrap.downloadFromGithub(this.binaryPath);
                    console.log('yt-dlp binary downloaded successfully');
                } catch (downloadError) {
                    console.error('Failed to download yt-dlp binary:', downloadError);
                    throw new Error(`Failed to download yt-dlp: ${downloadError}`);
                }
            } else {
                console.log('Using existing yt-dlp binary at:', this.binaryPath);
            }
            
            // Initialize with binary path
            this.ytDlp = new YTDlpWrap(this.binaryPath);

            // Setup FFmpeg Static
            try {
                const staticPath = require('ffmpeg-static');
                if (staticPath) {
                    this.ffmpegPath = staticPath.replace('app.asar', 'app.asar.unpacked');
                }
            } catch (e) {
                console.warn('FFmpeg static load failed:', e);
            }
            
            // Check for helpers
            await this.checkHelpers();
        } catch (error) {
            console.error('Failed to initialize yt-dlp:', error);
            throw error;
        }
    }

    private async checkHelpers(): Promise<void> {
        // Check Aria2c
        this.hasAria2c = false;
        this.aria2Path = null;
        
        // 1. Check local bin (priority)
        try {
            const userData = app.getPath('userData');
            const localBin = path.join(userData, 'bin', 'aria2c.exe');
            if (fs.existsSync(localBin)) {
                this.hasAria2c = true;
                this.aria2Path = localBin;
                console.log('✅ Aria2c found locally:', localBin);
            }
        } catch {}

        // 2. Check global if not found locally
        if (!this.hasAria2c) {
            try {
                execSync('aria2c --version', { stdio: 'ignore' });
                this.hasAria2c = true;
                console.log('✅ Aria2c found globally');
            } catch {
                console.log('ℹ️ Aria2c not found');
            }
        }

        // Check FFmpeg
        if (this.ffmpegPath) {
            this.hasFFmpeg = true;
            console.log('✅ FFmpeg static detected', this.ffmpegPath);
        } else {
            try {
                execSync('ffmpeg -version', { stdio: 'ignore' });
                this.hasFFmpeg = true;
                console.log('✅ FFmpeg found globally');
            } catch {
                this.hasFFmpeg = false;
                console.warn('⚠️ FFmpeg not found');
            }
        }
    }

    async installAria2(): Promise<boolean> {
        console.log('Starting Aria2 download...');
        try {
            const userData = app.getPath('userData');
            const binDir = path.join(userData, 'bin');
            if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
            
            const zipPath = path.join(binDir, 'aria2.zip');
            // Using a specific mirror or github release
            const url = 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip';
            
            await new Promise<void>((resolve, reject) => {
                const file = fs.createWriteStream(zipPath);
                https.get(url, (res) => {
                    if (res.statusCode === 302 || res.statusCode === 301) {
                         https.get(res.headers.location!, (res2) => {
                             if (res2.statusCode !== 200) { reject(new Error('DL Fail ' + res2.statusCode)); return; }
                             res2.pipe(file);
                             file.on('finish', () => { file.close(); resolve(); });
                         }).on('error', reject);
                    } else if (res.statusCode === 200) {
                        res.pipe(file);
                        file.on('finish', () => { file.close(); resolve(); });
                    } else {
                        reject(new Error(`Failed to download: ${res.statusCode}`));
                    }
                }).on('error', reject);
            });
            
            const execAsync = promisify(exec);
            // Expand using Powershell
            await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`);
            
            // Move exe
            const subDir = path.join(binDir, 'aria2-1.36.0-win-64bit-build1');
            const exePath = path.join(subDir, 'aria2c.exe');
            const targetPath = path.join(binDir, 'aria2c.exe');
            
            if (fs.existsSync(exePath)) {
                fs.copyFileSync(exePath, targetPath);
            }
            
            // Cleanup
            try { 
                fs.unlinkSync(zipPath);
                // fs.rmSync(subDir, { recursive: true, force: true });
            } catch {}

            await this.checkHelpers();
            return this.hasAria2c;
        } catch (e) {
            console.error('Install Aria2 Failed', e);
            throw e;
        }
    }

    private async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    /**
     * Get video information
     */
    async getVideoInfo(url: string): Promise<VideoInfo> {
        await this.ensureInitialized();
        
        try {
            // Use yt-dlp to get video info with optimizations
            const info: any = await this.ytDlp.getVideoInfo([
                url,
                '--skip-download',
                '--no-playlist',
            ]);
            
            // Parse available formats
            const formats: VideoFormat[] = (info.formats || []).map((format: any) => ({
                itag: format.format_id ? parseInt(format.format_id) : 0,
                quality: format.quality || format.format_note || 'unknown',
                qualityLabel: format.format_note || format.resolution,
                hasVideo: !!format.vcodec && format.vcodec !== 'none',
                hasAudio: !!format.acodec && format.acodec !== 'none',
                container: format.ext || 'unknown',
                codecs: format.vcodec || format.acodec,
                bitrate: format.tbr ? format.tbr * 1000 : undefined,
                audioBitrate: format.abr,
            }));

            // Extract unique quality labels
            const qualityLabels = new Set<string>();
            formats.forEach(format => {
                if (format.qualityLabel) {
                    const match = format.qualityLabel.match(/(\d+p)/);
                    if (match) {
                        qualityLabels.add(match[1]);
                    }
                }
            });

            const availableQualities = Array.from(qualityLabels).sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                return bNum - aNum;
            });

            const hasVideo = formats.some(f => f.hasVideo);
            const hasAudio = formats.some(f => f.hasAudio);
            
            return {
                videoId: info.id || '',
                title: info.title || 'Unknown',
                author: info.uploader || info.channel || 'Unknown',
                lengthSeconds: parseInt(info.duration) || 0,
                thumbnailUrl: info.thumbnail || '',
                description: info.description || undefined,
                viewCount: parseInt(info.view_count) || undefined,
                uploadDate: info.upload_date || undefined,
                formats,
                availableQualities,
                hasVideo,
                hasAudio,
            };
        } catch (error) {
            throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    async getPlaylistInfo(url: string): Promise<{
        playlistId: string;
        title: string;
        videoCount: number;
        videos: Array<{
            id: string;
            title: string;
            duration: number;
            thumbnail: string;
            url: string;
        }>;
    }> {
        await this.ensureInitialized();
        
        try {
            const info: any = await this.ytDlp.getVideoInfo([
                url,
                '--flat-playlist',
                '--skip-download',
            ]);
            
            if (!info.entries || !Array.isArray(info.entries)) {
                throw new Error('Not a valid playlist URL');
            }
            
            const videos = info.entries.map((entry: any) => ({
                id: entry.id || entry.url,
                title: entry.title || 'Unknown Title',
                duration: entry.duration || 0,
                thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || '',
                url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            }));
            
            return {
                playlistId: info.id || info.playlist_id || 'unknown',
                title: info.title || info.playlist_title || 'Unknown Playlist',
                videoCount: videos.length,
                videos,
            };
        } catch (error) {
            throw new Error(`Failed to get playlist info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Download video using yt-dlp with optimized buffer and concurrency
     */
    async downloadVideo(
        options: DownloadOptions,
        progressCallback?: (progress: DownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();
        
        const { url, format, quality, container, outputPath, maxSpeed } = options;
        const downloadId = randomUUID(); // Unique ID for this download (for concurrency)
        
        try {
            const info = await this.getVideoInfo(url);
            const sanitizedTitle = this.sanitizeFilename(info.title);
            
            const downloadsPath = outputPath || app.getPath('downloads');
            const extension = container || (format === 'audio' ? 'mp3' : 'mp4');
            const outputTemplate = path.join(downloadsPath, `${sanitizedTitle}.%(ext)s`);
            
            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            // Build yt-dlp arguments
            const args: string[] = [
                url,
                '-o', outputTemplate,
                '--no-playlist',
                '--no-warnings',
                '--newline',
                // Optimizations
                '--concurrent-fragments', `${options.concurrentFragments || 4}`,
                '--buffer-size', '1M',
                '--retries', '10',
                '--fragment-retries', '10', 
                '--no-overwrites',
                // Metadata (New)
                '--embed-thumbnail',
                '--add-metadata',
            ];

            if (maxSpeed) {
                args.push('--limit-rate', maxSpeed);
            }

            if (this.hasAria2c) {
                console.log(`[${downloadId}] Using aria2c`);
                if (this.aria2Path) {
                    args.push(
                        '--downloader', this.aria2Path,
                        '--downloader-args', 'aria2c:-x 16 -s 16 -k 1M'
                    );
                } else {
                    args.push(
                        '--downloader', 'aria2c',
                        '--downloader-args', 'aria2c:-x 16 -s 16 -k 1M'
                    );
                }
            }

            // Using FFmpeg static path if available
            if (this.ffmpegPath) {
                args.push('--ffmpeg-location', this.ffmpegPath);
            }

            // Format Logic
            if (format === 'audio') {
                args.push(
                    '-x', // Extract audio
                    '--audio-format', container || 'mp3',
                    '--audio-quality', quality || '0'
                );
            } else if (format === 'video') {
                if (quality && quality !== 'best') {
                    args.push('-f', `bestvideo[height<=${quality.replace('p', '')}]+bestaudio/best[height<=${quality.replace('p', '')}]`);
                } else {
                    args.push('-f', 'bestvideo+bestaudio/best');
                }
                args.push('--merge-output-format', container || 'mp4');
            } else {
                args.push('-f', 'best');
            }

            return new Promise((resolve, reject) => {
                let downloadedBytes = 0;
                let totalBytes = 0;
                let startTime = Date.now();

                // Spawn Process
                const process = this.ytDlp.exec(args);
                this.activeProcesses.set(downloadId, process);

                let outputBuffer = '';

                process.stdout?.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    outputBuffer += chunk;
                    const lines = outputBuffer.split(/\r?\n/);
                    outputBuffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        // Check completion
                        if (line.includes('100%') || line.includes('has already been downloaded')) {
                            if (progressCallback) {
                                progressCallback({
                                    id: downloadId,
                                    percent: 100,
                                    downloaded: totalBytes,
                                    total: totalBytes,
                                    speed: 0,
                                    eta: 0,
                                    state: 'complete',
                                    filename: `${sanitizedTitle}.${extension}`
                                });
                            }
                            continue;
                        }

                        // Parse Progress
                        const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?([\d.]+)([a-zA-Z]+)(?:\s+at\s+([\d.]+)([a-zA-Z]+\/s))?(?:\s+ETA\s+([\d:]+))?/);
                        
                        if (progressMatch && progressCallback) {
                            const percent = parseFloat(progressMatch[1]);
                            const sizeStr = progressMatch[2];
                            const unitStr = progressMatch[3];
                            const speedStr = progressMatch[4];
                            const speedUnitStr = progressMatch[5];
                            const etaStr = progressMatch[6];
                            
                            const getMultiplier = (unit: string) => {
                                if (!unit) return 1;
                                if (unit.includes('KiB') || unit.includes('K')) return 1024;
                                if (unit.includes('MiB') || unit.includes('M')) return 1024 * 1024;
                                if (unit.includes('GiB') || unit.includes('G')) return 1024 * 1024 * 1024;
                                return 1;
                            };
                            
                            totalBytes = parseFloat(sizeStr) * getMultiplier(unitStr);
                            downloadedBytes = (percent / 100) * totalBytes;
                            
                            let speed = 0;
                            if (speedStr && speedUnitStr) {
                                speed = parseFloat(speedStr) * getMultiplier(speedUnitStr);
                            }
                            
                            let eta = 0;
                            if (etaStr) {
                                const parts = etaStr.split(':').map(Number);
                                if (parts.length === 3) eta = parts[0] * 3600 + parts[1] * 60 + parts[2];
                                else if (parts.length === 2) eta = parts[0] * 60 + parts[1];
                                else eta = parts[0];
                            } else {
                                const elapsedTime = (Date.now() - startTime) / 1000;
                                const currentSpeed = downloadedBytes / elapsedTime; 
                                if (!speed) speed = currentSpeed;
                                eta = speed > 0 ? (totalBytes - downloadedBytes) / speed : 0;
                            }
                            
                            progressCallback({
                                id: downloadId,
                                percent: Math.round(percent),
                                downloaded: downloadedBytes,
                                total: totalBytes,
                                speed,
                                eta,
                                state: 'downloading',
                                filename: `${sanitizedTitle}.${extension}`
                            });
                        }
                    }
                });

                process.stderr?.on('data', (data: Buffer) => {
                    // Log errors but don't reject immediately as stderr includes warnings
                    // console.error(`[${downloadId}]`, data.toString());
                });

                process.on('close', (code: number) => {
                    this.activeProcesses.delete(downloadId);
                    
                    if (code === 0) {
                        const expectedFile = path.join(downloadsPath, `${sanitizedTitle}.${extension}`);
                        
                        // Final success callback
                        if (progressCallback) {
                             progressCallback({
                                id: downloadId,
                                percent: 100,
                                downloaded: totalBytes,
                                total: totalBytes,
                                speed: 0,
                                eta: 0,
                                state: 'complete'
                            });
                        }

                        this.addToHistory({
                            url,
                            title: info.title,
                            thumbnailUrl: info.thumbnailUrl,
                            format,
                            quality: quality || (format === 'audio' ? 'best' : 'auto'),
                            path: expectedFile,
                            size: totalBytes,
                            duration: info.lengthSeconds,
                            status: 'completed'
                        });
                        
                        resolve(expectedFile);
                    } else {
                        this.cleanupPartialFiles(downloadsPath, sanitizedTitle, extension);
                        reject(new Error(`yt-dlp exited with code ${code}`));
                    }
                });

                process.on('error', (error: Error) => {
                    this.activeProcesses.delete(downloadId);
                    this.cleanupPartialFiles(downloadsPath, sanitizedTitle, extension);
                    reject(error);
                });
            });
        } catch (error) {
            this.activeProcesses.delete(downloadId);
            throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Cancel download(s)
     * @param id Optional download ID to cancel specific download. If omitted, cancels all.
     */
    cancelDownload(id?: string): void {
        if (id) {
            const proc = this.activeProcesses.get(id);
            if (proc) {
                console.log(`Cancelling download ${id}`);
                proc.kill();
                this.activeProcesses.delete(id);
            }
        } else {
            console.log(`Cancelling all ${this.activeProcesses.size} downloads`);
            this.activeProcesses.forEach(proc => proc.kill());
            this.activeProcesses.clear();
        }
    }
    
    // ... helper methods ...
    private cleanupPartialFiles(directory: string, filename: string, extension: string): void {
        try {
            const patterns = [
                path.join(directory, `${filename}.${extension}`),
                path.join(directory, `${filename}.${extension}.part`),
                path.join(directory, `${filename}.${extension}.ytdl`),
                path.join(directory, `${filename}.part`),
            ];
            patterns.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
    
    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }

    getHistory(): HistoryItem[] { return this.store.get('history', []); }

    addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
        const history = this.store.get('history', []);
        const newItem: HistoryItem = { ...item, id: randomUUID(), timestamp: Date.now() };
        this.store.set('history', [newItem, ...history].slice(0, 50));
    }
    
    clearHistory(): void { this.store.set('history', []); }

    getCapabilities(): { hasAria2c: boolean; hasFFmpeg: boolean } {
        return {
            hasAria2c: this.hasAria2c,
            hasFFmpeg: this.hasFFmpeg
        };
    }

    getSettings(): Settings { return this.store.get('settings'); }

    saveSettings(settings: Partial<Settings>): Settings {
        const current = this.store.get('settings');
        const updated = { ...current, ...settings };
        this.store.set('settings', updated);
        return updated;
    }
}

export const youtubeDownloader = new YouTubeDownloader();
