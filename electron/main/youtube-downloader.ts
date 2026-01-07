import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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
    private currentDownload: any = null;
    private startTime: number = 0;
    
    /**
     * Get video information
     */
    async getVideoInfo(url: string): Promise<VideoInfo> {
        try {
            if (!ytdl.validateURL(url)) {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(url);
            const videoDetails = info.videoDetails;
            
            // Parse available formats
            const formats: VideoFormat[] = info.formats.map(format => ({
                itag: format.itag,
                quality: format.quality || 'unknown',
                qualityLabel: format.qualityLabel,
                hasVideo: !!format.hasVideo,
                hasAudio: !!format.hasAudio,
                container: format.container || 'unknown',
                codecs: format.codecs,
                bitrate: format.bitrate,
                audioBitrate: format.audioBitrate,
            }));

            // Extract unique quality labels (for video formats with both video and audio)
            const qualityLabels = new Set<string>();
            formats.forEach(format => {
                if (format.qualityLabel && format.hasVideo) {
                    // Extract quality like "720p", "1080p" from labels like "720p60", "1080p HD"
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
                videoId: videoDetails.videoId,
                title: videoDetails.title,
                author: videoDetails.author.name,
                lengthSeconds: parseInt(videoDetails.lengthSeconds),
                thumbnailUrl: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
                description: videoDetails.description,
                viewCount: parseInt(videoDetails.viewCount),
                uploadDate: videoDetails.uploadDate,
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
     * Download video
     */
    async downloadVideo(
        options: DownloadOptions,
        progressCallback?: (progress: DownloadProgress) => void
    ): Promise<string> {
        const { url, format, quality, outputPath } = options;
        
        try {
            // Validate URL
            if (!ytdl.validateURL(url)) {
                throw new Error('Invalid YouTube URL');
            }

            // Get video info for filename
            const info = await this.getVideoInfo(url);
            const sanitizedTitle = this.sanitizeFilename(info.title);
            
            // Determine output path
            const downloadsPath = outputPath || app.getPath('downloads');
            const extension = format === 'audio' ? 'mp3' : 'mp4';
            const outputFile = path.join(downloadsPath, `${sanitizedTitle}.${extension}`);
            
            // Ensure directory exists
            if (!fs.existsSync(downloadsPath)) {
                fs.mkdirSync(downloadsPath, { recursive: true });
            }

            return new Promise((resolve, reject) => {
                try {
                    // Configure download options
                    const downloadOptions: ytdl.downloadOptions = {
                        quality: this.getQualityFilter(quality, format),
                    };
                    
                    if (format === 'audio') {
                        downloadOptions.filter = 'audioonly';
                    } else if (format === 'video') {
                        downloadOptions.filter = 'audioandvideo';
                    }
                    
                    // Start download
                    this.currentDownload = ytdl(url, downloadOptions);
                    const writeStream = fs.createWriteStream(outputFile);
                    
                    let downloadedBytes = 0;
                    let totalBytes = 0;
                    this.startTime = Date.now();
                    
                    // Track progress
                    this.currentDownload.on('response', (response: any) => {
                        totalBytes = parseInt(response.headers['content-length'] || '0');
                    });
                    
                    this.currentDownload.on('data', (chunk: Buffer) => {
                        downloadedBytes += chunk.length;
                        
                        if (progressCallback && totalBytes > 0) {
                            const percent = Math.round((downloadedBytes / totalBytes) * 100);
                            const elapsedTime = (Date.now() - this.startTime) / 1000;
                            const speed = downloadedBytes / elapsedTime;
                            const eta = (totalBytes - downloadedBytes) / speed;
                            
                            progressCallback({
                                percent,
                                downloaded: downloadedBytes,
                                total: totalBytes,
                                speed,
                                eta,
                                state: 'downloading'
                            });
                        }
                    });
                    
                    this.currentDownload.on('error', (error: Error) => {
                        // Clean up partial file
                        if (fs.existsSync(outputFile)) {
                            fs.unlink(outputFile, () => {});
                        }
                        reject(error);
                    });
                    
                    writeStream.on('finish', () => {
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
                        resolve(outputFile);
                    });
                    
                    writeStream.on('error', (error: Error) => {
                        // Clean up partial file
                        if (fs.existsSync(outputFile)) {
                            fs.unlink(outputFile, () => {});
                        }
                        reject(error);
                    });
                    
                    this.currentDownload.pipe(writeStream);
                    
                } catch (error) {
                    reject(error);
                }
            });
        } catch (error) {
            throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Cancel current download
     */
    cancelDownload(): void {
        if (this.currentDownload) {
            this.currentDownload.destroy();
            this.currentDownload = null;
        }
    }
    
    /**
     * Get quality filter for ytdl
     */
    private getQualityFilter(quality?: string, format?: string): string {
        if (!quality || quality === 'best') {
            return format === 'audio' ? 'highestaudio' : 'highestvideo';
        }
        
        // Map quality to itag or quality string
        const qualityMap: Record<string, string> = {
            '144p': 'tiny',
            '240p': 'small',
            '360p': 'medium',
            '480p': 'large',
            '720p': 'hd720',
            '1080p': 'hd1080',
        };
        
        return qualityMap[quality] || 'highest';
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

