import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// Create require function for ES modules
const require = createRequire(import.meta.url);

export interface DownloadOptions {
    url: string;
    format: 'video' | 'audio' | 'best';
    quality?: string;
    outputPath?: string;
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
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
}

export class YouTubeDownloader {
    private ytDlp: any;
    private currentProcess: any = null;
    private binaryPath: string;
    private initPromise: Promise<void>;
    
    constructor() {
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
        } catch (error) {
            console.error('Failed to initialize yt-dlp:', error);
            throw error;
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
            // Use yt-dlp to get video info
            const info: any = await this.ytDlp.getVideoInfo(url);
            
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

            // Extract unique quality labels (ALL qualities)
            const qualityLabels = new Set<string>();
            formats.forEach(format => {
                if (format.qualityLabel) {
                    // Extract quality like "720p", "1080p" from labels
                    const match = format.qualityLabel.match(/(\d+p)/);
                    if (match) {
                        qualityLabels.add(match[1]);
                    }
                }
            });

            const availableQualities = Array.from(qualityLabels).sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                return bNum - aNum; // Descending order
            });

            // Check if video has video/audio
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
    
    /**
     * Download video using yt-dlp
     */
    async downloadVideo(
        options: DownloadOptions,
        progressCallback?: (progress: DownloadProgress) => void
    ): Promise<string> {
        await this.ensureInitialized();
        
        const { url, format, quality, outputPath } = options;
        
        try {
            // Get video info for filename
            const info = await this.getVideoInfo(url);
            const sanitizedTitle = this.sanitizeFilename(info.title);
            
            // Determine output path
            const downloadsPath = outputPath || app.getPath('downloads');
            const extension = format === 'audio' ? 'mp3' : 'mp4';
            const outputTemplate = path.join(downloadsPath, `${sanitizedTitle}.%(ext)s`);
            
            // Ensure directory exists
            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            // Build yt-dlp arguments
            const args: string[] = [
                url,
                '-o', outputTemplate,
                '--no-playlist',
                '--no-warnings',
                '--newline', // For progress parsing
            ];

            // Format selection
            if (format === 'audio') {
                args.push(
                    '-x', // Extract audio
                    '--audio-format', 'mp3',
                    '--audio-quality', '0' // Best quality
                );
            } else if (format === 'video') {
                if (quality && quality !== 'best') {
                    // Try to get the exact quality with audio
                    args.push('-f', `bestvideo[height<=${quality.replace('p', '')}]+bestaudio/best[height<=${quality.replace('p', '')}]`);
                } else {
                    args.push('-f', 'bestvideo+bestaudio/best');
                }
                args.push('--merge-output-format', 'mp4');
            } else {
                args.push('-f', 'best');
            }

            return new Promise((resolve, reject) => {
                let downloadedBytes = 0;
                let totalBytes = 0;
                let startTime = Date.now();

                // Execute yt-dlp
                this.currentProcess = this.ytDlp.exec(args);

                this.currentProcess.stdout?.on('data', (data: Buffer) => {
                    const output = data.toString();
                    
                    // Parse progress from yt-dlp output
                    // Format: [download]  45.5% of 123.45MiB at 1.23MiB/s ETA 00:12
                    const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?([\d.]+)(\w+)/);
                    if (progressMatch && progressCallback) {
                        const percent = parseFloat(progressMatch[1]);
                        const size = parseFloat(progressMatch[2]);
                        const unit = progressMatch[3];
                        
                        // Convert to bytes
                        let multiplier = 1;
                        if (unit.includes('KiB')) multiplier = 1024;
                        else if (unit.includes('MiB')) multiplier = 1024 * 1024;
                        else if (unit.includes('GiB')) multiplier = 1024 * 1024 * 1024;
                        
                        totalBytes = size * multiplier;
                        downloadedBytes = (percent / 100) * totalBytes;
                        
                        const elapsedTime = (Date.now() - startTime) / 1000;
                        const speed = downloadedBytes / elapsedTime;
                        const eta = (totalBytes - downloadedBytes) / speed;
                        
                        progressCallback({
                            percent: Math.round(percent),
                            downloaded: downloadedBytes,
                            total: totalBytes,
                            speed,
                            eta,
                            state: 'downloading'
                        });
                    }
                });

                this.currentProcess.on('close', (code: number) => {
                    if (code === 0) {
                        // Find the downloaded file
                        const expectedFile = path.join(downloadsPath, `${sanitizedTitle}.${extension}`);
                        
                        if (progressCallback) {
                            progressCallback({
                                percent: 100,
                                downloaded: totalBytes,
                                total: totalBytes,
                                speed: 0,
                                eta: 0,
                                state: 'complete'
                            });
                        }
                        
                        resolve(expectedFile);
                    } else {
                        reject(new Error(`yt-dlp exited with code ${code}`));
                    }
                });

                this.currentProcess.on('error', (error: Error) => {
                    reject(error);
                });
            });
        } catch (error) {
            throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Cancel current download
     */
    cancelDownload(): void {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
    
    /**
     * Sanitize filename
     */
    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim()
            .substring(0, 200); // Limit length
    }
}

// Export singleton instance
export const youtubeDownloader = new YouTubeDownloader();
