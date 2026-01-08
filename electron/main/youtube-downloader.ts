import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import si from 'systeminformation';

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
    embedSubs?: boolean;
    id?: string;
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
    filesize?: number;
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
    private store: Store<StoreSchema>;
    
    // Queue System
    private downloadQueue: Array<{
        run: () => Promise<string>;
        resolve: (value: string | PromiseLike<string>) => void;
        reject: (reason?: any) => void;
    }> = [];
    private activeDownloadsCount = 0;
    
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

            // Setup FFmpeg using @ffmpeg-installer/ffmpeg
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
                const ffmpegPath = ffmpegInstaller.path;
                
                console.log('FFmpeg installer path resolved:', ffmpegPath);
                
                if (ffmpegPath && fs.existsSync(ffmpegPath)) {
                    this.ffmpegPath = ffmpegPath;
                    this.hasFFmpeg = true;
                    console.log('✅ FFmpeg binary verified at:', this.ffmpegPath);
                    
                    // Set executable permissions on Unix-like systems
                    if (process.platform !== 'win32' && this.ffmpegPath) {
                        try { fs.chmodSync(this.ffmpegPath, '755'); } catch (e) { /* ignore */ }
                    }
                } else {
                    console.warn('⚠️ FFmpeg binary not found at:', ffmpegPath);
                }
            } catch (e) {
                console.warn('FFmpeg installer load failed:', e);
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
        
        // 1. Check local bin (priority)
        try {
            const userData = app.getPath('userData');
            const localBin = path.join(userData, 'bin', 'aria2c.exe');
            if (fs.existsSync(localBin)) {
                this.hasAria2c = true;
                // this.aria2Path = localBin; // Removed
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

    private videoInfoCache: Map<string, { info: VideoInfo, timestamp: number }> = new Map();
    private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    /**
     * Get video information
     */
    async getVideoInfo(url: string): Promise<VideoInfo> {
        await this.ensureInitialized();
        
        // Check cache
        const cached = this.videoInfoCache.get(url);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log('Returning cached video info for:', url);
            return cached.info;
        }

        try {
            // Use yt-dlp to get video info with optimizations
            const info: any = await this.ytDlp.getVideoInfo([
                url,
                '--skip-download',
                '--no-playlist',
                '--no-check-certificate',
                '--no-call-home', // Optimization: Don't contact yt-dlp server for updates
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
                filesize: format.filesize || format.filesize_approx,
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
            
            // Parse upload date
            let uploadDate: string | undefined;
            if (info.upload_date) {
                try {
                    const dateStr = info.upload_date.toString();
                    if (dateStr.length === 8) {
                        const year = dateStr.substring(0, 4);
                        const month = dateStr.substring(4, 6);
                        const day = dateStr.substring(6, 8);
                        uploadDate = `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    console.warn('Failed to parse upload date:', info.upload_date);
                }
            }
            
            const videoInfo: VideoInfo = {
                videoId: info.id || '',
                title: info.title || 'Unknown',
                author: info.uploader || info.channel || 'Unknown',
                lengthSeconds: parseInt(info.duration) || 0,
                thumbnailUrl: info.thumbnail || '',
                description: info.description || undefined,
                viewCount: parseInt(info.view_count) || undefined,
                uploadDate,
                formats,
                availableQualities,
                hasVideo,
                hasAudio,
            };

            // Cache the result
            this.videoInfoCache.set(url, { info: videoInfo, timestamp: Date.now() });

            return videoInfo;
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
                '--no-check-certificate', // Fix SSL certificate verification on macOS
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
     * Check if there is enough free space on the disk
     */
    async checkDiskSpace(directory: string, requiredBytes: number): Promise<void> {
        try {
            // Get all filesystems
            const filesystems = await si.fsSize();
            
            // Find the drive that contains the directory
            const root = path.parse(path.resolve(directory)).root.toLowerCase();
            
            // Normalize mount points for comparison (e.g. "C:" -> "c:")
            const fs = filesystems.find(d => {
                const mount = d.mount.toLowerCase();
                // Check if root starts with mount (handles C:\ vs C:)
                return root.startsWith(mount) || mount.startsWith(root.replace(/\\/g, ''));
            });

            if (fs) {
                // Add 100MB buffer
                const buffer = 100 * 1024 * 1024;
                if (fs.available < requiredBytes + buffer) {
                     throw new Error(`Insufficient disk space. Required: ${(requiredBytes / 1024 / 1024).toFixed(2)} MB, Available: ${(fs.available / 1024 / 1024).toFixed(2)} MB`);
                }
            }
        } catch (error) {
            console.warn('Disk space check failed:', error);
            // Don't block download if check fails, just warn
        }
    }
    
    /**
     * Queue download task
     */
    async downloadVideo(
        options: DownloadOptions,
        progressCallback?: (progress: DownloadProgress) => void
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

    /**
     * internal Execute download
     */
    private async executeDownload(
        options: DownloadOptions,
        progressCallback?: (progress: DownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();
        
        console.log('ExecuteDownload - hasFFmpeg:', this.hasFFmpeg, 'path:', this.ffmpegPath);
        
        const { url, format, quality, container, outputPath, maxSpeed, embedSubs, id } = options;
        const downloadId = id || randomUUID(); // Use provided ID or generate new one
        
        try {
            const info = await this.getVideoInfo(url);
            const sanitizedTitle = this.sanitizeFilename(info.title);
            
            const downloadsPath = outputPath || app.getPath('downloads');
            const extension = container || (format === 'audio' ? 'mp3' : 'mp4');
            
            // Add quality/format suffix to filename to avoid overwriting
            let filenameSuffix = '';
            if (format === 'audio') {
                filenameSuffix = `_audio_${quality || 'best'}`;
            } else if (format === 'video' && quality) {
                filenameSuffix = `_${quality}`;
            }
            
            const outputTemplate = path.join(downloadsPath, `${sanitizedTitle}${filenameSuffix}.%(ext)s`);
            
            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            // Calculate estimated size
            let estimatedSize = 0;
            if (format === 'audio') {
                // Estimate based on audio quality or take best audio
                const audioFormat = info.formats.find(f => f.hasAudio && !f.hasVideo && (f.quality === quality || f.itag.toString() === '140')); // 140 is m4a 128k usually
                estimatedSize = audioFormat?.filesize || 0;
            } else {
                // Estimate video + audio
                let videoFormat;
                if (quality && quality !== 'best') {
                     videoFormat = info.formats.find(f => f.qualityLabel?.startsWith(quality) && f.hasVideo);
                } else {
                     videoFormat = info.formats.find(f => f.hasVideo); // Best usually first or use logic
                }
                
                const audioFormat = info.formats.find(f => f.hasAudio && !f.hasVideo); // Best audio
                
                if (videoFormat) estimatedSize += (videoFormat.filesize || 0);
                if (audioFormat) estimatedSize += (audioFormat.filesize || 0);
            }

            // Check disk space if size is known (and > 1MB to be worth checking)
            if (estimatedSize > 1024 * 1024) {
                await this.checkDiskSpace(downloadsPath, estimatedSize);
            }

            // Build yt-dlp arguments
            const args: string[] = [
                url,
                '-o', outputTemplate,
                '--no-playlist',
                '--no-warnings',
                '--newline',
                '--no-check-certificate', // Fix SSL certificate verification on macOS
                // Optimizations
                '--concurrent-fragments', `${options.concurrentFragments || 4}`,
                '--buffer-size', '1M',
                '--retries', '10',
                '--fragment-retries', '10', 
                '-c', // Resume interrupted downloads
                // Metadata embedding disabled due to ffprobe dependency
                // '--embed-thumbnail',
                // '--add-metadata',
            ];

            if (embedSubs) {
                args.push(
                    '--write-subs',
                    '--write-auto-subs',
                    '--sub-lang', 'en.*,vi',
                    '--embed-subs'
                );
            }

            if (this.ffmpegPath) {
                args.push('--ffmpeg-location', this.ffmpegPath);
            }

            if (maxSpeed) {
                args.push('--limit-rate', maxSpeed);
            }

            // Aria2c usage disabled due to stability issues (error code 22)
            /*
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
            */

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
                // Use more compatible format selection to avoid FFmpeg stream mapping errors
                if (quality && quality !== 'best') {
                    const height = quality.replace('p', '');
                    // Select best video with height <= specified + best audio, fallback to best single file
                    args.push('-f', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
                } else {
                    // Select best mp4 video + best m4a audio for better compatibility
                    args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best');
                }
                
                // Merge format and post-processing options
                const outputFormat = container || 'mp4';
                args.push('--merge-output-format', outputFormat);
                
                // Add recode option if needed for compatibility
                if (outputFormat === 'mp4') {
                    args.push('--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac');
                }
            } else {
                args.push('-f', 'best');
            }

            return new Promise((resolve, reject) => {
                let downloadedBytes = 0;
                let totalBytes = 0;
                let percent = 0;

                // Spawn Process using execPromise for better progress handling
                const process = this.ytDlp.exec(args);
                this.activeProcesses.set(downloadId, process);

                // Listen to ytDlpProcess events
                if (process.ytDlpProcess) {
                    const ytDlpProc = process.ytDlpProcess;
                    
                    // Capture all output
                    ytDlpProc.stdout?.on('data', (data: Buffer) => {
                        const output = data.toString();
                        console.log(`[${downloadId}] stdout:`, output);
                        
                        // Parse each line
                        output.split(/\r?\n/).forEach(line => {
                            if (!line.trim()) return;
                            const progress = this.parseProgressLine(line);
                            if (progress && progressCallback) {
                                if (progress.totalBytes > 0) totalBytes = progress.totalBytes;
                                if (progress.percent > 0) percent = progress.percent;
                                downloadedBytes = (percent / 100) * totalBytes;
                                
                                progressCallback({
                                    id: downloadId,
                                    percent: Math.round(percent),
                                    downloaded: downloadedBytes,
                                    total: totalBytes,
                                    speed: progress.speed,
                                    eta: progress.eta,
                                    state: 'downloading',
                                    filename: `${sanitizedTitle}${filenameSuffix}.${extension}`
                                });
                            }
                        });
                    });
                    
                    ytDlpProc.stderr?.on('data', (data: Buffer) => {
                        const output = data.toString();
                        console.log(`[${downloadId}] stderr:`, output);
                        
                        // Parse each line
                        output.split(/\r?\n/).forEach(line => {
                            if (!line.trim()) return;
                            const progress = this.parseProgressLine(line);
                            if (progress && progressCallback) {
                                if (progress.totalBytes > 0) totalBytes = progress.totalBytes;
                                if (progress.percent > 0) percent = progress.percent;
                                downloadedBytes = (percent / 100) * totalBytes;
                                
                                progressCallback({
                                    id: downloadId,
                                    percent: Math.round(percent),
                                    downloaded: downloadedBytes,
                                    total: totalBytes,
                                    speed: progress.speed,
                                    eta: progress.eta,
                                    state: 'downloading',
                                    filename: `${sanitizedTitle}.${extension}`
                                });
                            }
                        });
                    });
                }

                process.on('close', (code: number) => {
                    this.activeProcesses.delete(downloadId);
                    
                    if (code === 0) {

                        const expectedFile = path.join(downloadsPath, `${sanitizedTitle}${filenameSuffix}.${extension}`);
                        
                        // Get actual file size from disk
                        let actualFileSize = totalBytes;
                        try {
                            if (fs.existsSync(expectedFile)) {
                                const stats = fs.statSync(expectedFile);
                                actualFileSize = stats.size;
                            }
                        } catch (e) {
                            console.warn('Failed to get file size:', e);
                        }
                        
                        // Final success callback with filename to clear active download
                        if (progressCallback) {
                             progressCallback({
                                id: downloadId,
                                percent: 100,
                                downloaded: actualFileSize,
                                total: actualFileSize,
                                speed: 0,
                                eta: 0,
                                state: 'complete',
                                filename: `${sanitizedTitle}.${extension}`
                            });
                        }

                        this.addToHistory({
                            url,
                            title: info.title,
                            thumbnailUrl: info.thumbnailUrl,
                            format,
                            quality: quality || (format === 'audio' ? 'best' : 'auto'),
                            path: expectedFile,
                            size: actualFileSize,
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
                try {
                    // yt-dlp-wrap returns an object with ytDlpProcess property
                    if (proc.ytDlpProcess && typeof proc.ytDlpProcess.kill === 'function') {
                        proc.ytDlpProcess.kill();
                    } else if (typeof proc.kill === 'function') {
                        proc.kill();
                    }
                } catch (e) {
                    console.error('Failed to kill process:', e);
                }
                this.activeProcesses.delete(id);
            }
        } else {
            console.log(`Cancelling all ${this.activeProcesses.size} downloads`);
            this.activeProcesses.forEach(proc => {
                try {
                    if (proc.ytDlpProcess && typeof proc.ytDlpProcess.kill === 'function') {
                        proc.ytDlpProcess.kill();
                    } else if (typeof proc.kill === 'function') {
                        proc.kill();
                    }
                } catch (e) {
                    console.error('Failed to kill process:', e);
                }
            });
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
    
    /**
     * Parse yt-dlp progress output
     * Handles standard format: [download] 12.3% of 10.00MiB at 1.23MiB/s ETA 00:05
     * And Aria2c format if enabled (though currently disabled)
     */
    private parseProgressLine(line: string): {
        percent: number;
        totalBytes: number;
        downloadedBytes: number;
        speed: number;
        eta: number;
        status: string;
    } | null {
        // 1. Helper for units
        const getMultiplier = (unit: string) => {
            if (!unit) return 1;
            const u = unit.toLowerCase();
            if (u.includes('k')) return 1024;
            if (u.includes('m')) return 1024 * 1024;
            if (u.includes('g')) return 1024 * 1024 * 1024;
            return 1;
        };

        // 2. Check for Standard yt-dlp output
        // Example: [download]  25.0% of 10.00MiB at  2.50MiB/s ETA 00:04
        if (line.includes('[download]')) {
            const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
            const sizeMatch = line.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/);
            const speedMatch = line.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/);
            const etaMatch = line.match(/ETA\s+([\d:]+)/);

            console.log('[parseProgressLine] Matches:', {
                line,
                percentMatch: percentMatch?.[0],
                sizeMatch: sizeMatch?.[0],
                speedMatch: speedMatch?.[0],
                etaMatch: etaMatch?.[0]
            });

            if (percentMatch) {
                const percent = parseFloat(percentMatch[1]);
                let totalBytes = 0;
                let speed = 0;
                let eta = 0;

                if (sizeMatch) {
                    totalBytes = parseFloat(sizeMatch[1].replace(/,/g, '')) * getMultiplier(sizeMatch[2]);
                }

                if (speedMatch) {
                    const speedVal = parseFloat(speedMatch[1].replace(/,/g, ''));
                    const unit = speedMatch[2].replace('/s', '');
                    speed = speedVal * getMultiplier(unit);
                }

                if (etaMatch) {
                    const parts = etaMatch[1].split(':').map(Number);
                    if (parts.length === 3) eta = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    else if (parts.length === 2) eta = parts[0] * 60 + parts[1];
                    else eta = parts[0];
                }

                return {
                    percent,
                    totalBytes,
                    downloadedBytes: 0, // Calculated by caller if totalBytes known
                    speed,
                    eta,
                    status: 'downloading'
                };
            }
        }
        
        return null;
    }

    getHistory(): HistoryItem[] { return this.store.get('history', []); }

    addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
        const history = this.store.get('history', []);
        const newItem: HistoryItem = { ...item, id: randomUUID(), timestamp: Date.now() };
        this.store.set('history', [newItem, ...history].slice(0, 50));
    }
    
    removeFromHistory(id: string): void {
        const history = this.store.get('history', []);
        const filtered = history.filter(item => item.id !== id);
        this.store.set('history', filtered);
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
