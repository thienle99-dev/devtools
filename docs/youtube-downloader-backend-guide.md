# YouTube Downloader - Backend Implementation Guide

## 📚 Tổng quan
Hướng dẫn chi tiết để implement backend cho tính năng YouTube Downloader.

---

## 🎯 Option 1: Using ytdl-core (Recommended for Quick Start)

### Installation
```bash
pnpm add ytdl-core @types/ytdl-core
```

### Step 1: Create YouTube Downloader Module

**File**: `electron/main/youtube-downloader.ts`

```typescript
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface DownloadOptions {
    url: string;
    format: 'video' | 'audio' | 'best';
    quality?: string;
    outputPath?: string;
}

export class YouTubeDownloader {
    private currentDownload: any = null;
    
    /**
     * Get video information
     */
    async getVideoInfo(url: string) {
        try {
            const info = await ytdl.getInfo(url);
            return {
                videoId: info.videoDetails.videoId,
                title: info.videoDetails.title,
                author: info.videoDetails.author.name,
                lengthSeconds: parseInt(info.videoDetails.lengthSeconds),
                thumbnailUrl: info.videoDetails.thumbnails[0]?.url,
                description: info.videoDetails.description,
                viewCount: parseInt(info.videoDetails.viewCount),
                formats: info.formats.map(f => ({
                    itag: f.itag,
                    quality: f.qualityLabel || f.quality,
                    container: f.container,
                    hasVideo: f.hasVideo,
                    hasAudio: f.hasAudio,
                    codec: f.codecs,
                    bitrate: f.bitrate,
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get video info: ${error.message}`);
        }
    }
    
    /**
     * Download video
     */
    async downloadVideo(
        options: DownloadOptions,
        progressCallback?: (progress: any) => void
    ): Promise<string> {
        const { url, format, quality, outputPath } = options;
        
        // Get video info for filename
        const info = await this.getVideoInfo(url);
        const sanitizedTitle = this.sanitizeFilename(info.title);
        
        // Determine output path
        const downloadsPath = outputPath || app.getPath('downloads');
        const extension = format === 'audio' ? 'mp3' : 'mp4';
        const outputFile = path.join(downloadsPath, `${sanitizedTitle}.${extension}`);
        
        return new Promise((resolve, reject) => {
            try {
                // Configure download options
                const downloadOptions: any = {
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
                let startTime = Date.now();
                
                // Track progress
                this.currentDownload.on('response', (response: any) => {
                    totalBytes = parseInt(response.headers['content-length'] || '0');
                });
                
                this.currentDownload.on('data', (chunk: Buffer) => {
                    downloadedBytes += chunk.length;
                    
                    if (progressCallback && totalBytes > 0) {
                        const percent = Math.round((downloadedBytes / totalBytes) * 100);
                        const elapsedTime = (Date.now() - startTime) / 1000;
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
                    fs.unlink(outputFile, () => {}); // Clean up partial file
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
                    fs.unlink(outputFile, () => {});
                    reject(error);
                });
                
                this.currentDownload.pipe(writeStream);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Cancel current download
     */
    cancelDownload() {
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
            return 'highestvideo';
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
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }
}

// Export singleton instance
export const youtubeDownloader = new YouTubeDownloader();
```

### Step 2: Add IPC Handlers

**File**: `electron/main/main.ts` (add these handlers)

```typescript
import { ipcMain } from 'electron';
import { youtubeDownloader } from './youtube-downloader';

// Get video info
ipcMain.handle('youtube:getInfo', async (event, url: string) => {
    try {
        return await youtubeDownloader.getVideoInfo(url);
    } catch (error) {
        throw error;
    }
});

// Download video
ipcMain.handle('youtube:download', async (event, options) => {
    try {
        const filepath = await youtubeDownloader.downloadVideo(
            options,
            (progress) => {
                // Send progress to renderer
                event.sender.send('youtube:progress', progress);
            }
        );
        return { success: true, filepath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Cancel download
ipcMain.handle('youtube:cancel', async () => {
    youtubeDownloader.cancelDownload();
    return { success: true };
});
```

### Step 3: Update Preload Script

**File**: `electron/preload/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // ... existing APIs ...
    
    youtube: {
        getInfo: (url: string) => ipcRenderer.invoke('youtube:getInfo', url),
        download: (options: any) => ipcRenderer.invoke('youtube:download', options),
        cancel: () => ipcRenderer.invoke('youtube:cancel'),
        onProgress: (callback: (progress: any) => void) => {
            ipcRenderer.on('youtube:progress', (_, progress) => callback(progress));
            return () => ipcRenderer.removeAllListeners('youtube:progress');
        }
    }
});
```

### Step 4: Update Frontend Component

**File**: `src/tools/media/YoutubeDownloader.tsx`

Replace the mock download function with:

```typescript
const handleDownload = async () => {
    if (!url.trim() || !isValidYoutubeUrl(url)) {
        setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
        return;
    }

    setDownloadStatus({ status: 'downloading', message: 'Preparing download...', progress: 0 });

    try {
        // Set up progress listener
        const unsubscribe = window.electron.youtube.onProgress((progress) => {
            setDownloadStatus({
                status: 'downloading',
                message: `Downloading... ${progress.percent}%`,
                progress: progress.percent
            });
        });

        // Start download
        const result = await window.electron.youtube.download({
            url,
            format,
            quality: format === 'audio' ? undefined : quality,
        });

        unsubscribe();

        if (result.success) {
            setDownloadStatus({
                status: 'success',
                message: 'Download completed successfully!',
                filename: result.filepath
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        setDownloadStatus({
            status: 'error',
            message: error instanceof Error ? error.message : 'Download failed'
        });
    }
};
```

---

## 🎯 Option 2: Using yt-dlp (More Stable)

### Installation

1. Download yt-dlp binary:
   - Windows: `yt-dlp.exe`
   - macOS/Linux: `yt-dlp`
   - From: https://github.com/yt-dlp/yt-dlp/releases

2. Place binary in `resources/` folder

3. Bundle with electron-builder:

**electron-builder.yml**:
```yaml
extraResources:
  - from: resources/yt-dlp${os.executableSuffix}
    to: yt-dlp${os.executableSuffix}
```

### Implementation

**File**: `electron/main/youtube-downloader.ts`

```typescript
import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

export class YouTubeDownloader {
    private ytDlpPath: string;
    private currentProcess: any = null;
    
    constructor() {
        // Get yt-dlp binary path
        const isDev = !app.isPackaged;
        const resourcesPath = isDev 
            ? path.join(__dirname, '../../resources')
            : process.resourcesPath;
        
        this.ytDlpPath = path.join(
            resourcesPath,
            `yt-dlp${process.platform === 'win32' ? '.exe' : ''}`
        );
    }
    
    async downloadVideo(options: DownloadOptions, progressCallback?: Function) {
        const { url, format, quality, outputPath } = options;
        
        const downloadsPath = outputPath || app.getPath('downloads');
        const outputTemplate = path.join(downloadsPath, '%(title)s.%(ext)s');
        
        const args = [
            url,
            '-o', outputTemplate,
            '--newline', // For progress parsing
        ];
        
        // Add format options
        if (format === 'audio') {
            args.push('-x', '--audio-format', 'mp3');
        } else {
            const formatStr = quality && quality !== 'best' 
                ? `bestvideo[height<=${quality.replace('p', '')}]+bestaudio/best`
                : 'bestvideo+bestaudio/best';
            args.push('-f', formatStr);
        }
        
        return new Promise((resolve, reject) => {
            this.currentProcess = spawn(this.ytDlpPath, args);
            
            let outputFile = '';
            
            this.currentProcess.stdout.on('data', (data: Buffer) => {
                const output = data.toString();
                
                // Parse progress
                const progressMatch = output.match(/(\d+\.?\d*)%/);
                if (progressMatch && progressCallback) {
                    progressCallback({
                        percent: parseFloat(progressMatch[1]),
                        state: 'downloading'
                    });
                }
                
                // Get output filename
                const fileMatch = output.match(/\[download\] Destination: (.+)/);
                if (fileMatch) {
                    outputFile = fileMatch[1];
                }
            });
            
            this.currentProcess.on('close', (code: number) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error(`Download failed with code ${code}`));
                }
            });
            
            this.currentProcess.on('error', (error: Error) => {
                reject(error);
            });
        });
    }
    
    cancelDownload() {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
}
```

---

## 🔧 Type Definitions

**File**: `src/types/electron.d.ts`

```typescript
export interface YouTubeAPI {
    getInfo: (url: string) => Promise<VideoInfo>;
    download: (options: DownloadOptions) => Promise<DownloadResult>;
    cancel: () => Promise<{ success: boolean }>;
    onProgress: (callback: (progress: DownloadProgress) => void) => () => void;
}

declare global {
    interface Window {
        electron: {
            youtube: YouTubeAPI;
            // ... other APIs
        };
    }
}
```

---

## ✅ Testing Checklist

- [ ] Test với video ngắn (< 1 phút)
- [ ] Test với video dài (> 10 phút)
- [ ] Test audio-only download
- [ ] Test different qualities
- [ ] Test cancel functionality
- [ ] Test error scenarios (invalid URL, network error)
- [ ] Test concurrent downloads
- [ ] Test file naming with special characters

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find ytdl-core"
**Solution**: Run `pnpm install` and rebuild electron

### Issue 2: Progress not updating
**Solution**: Ensure IPC progress event is properly set up

### Issue 3: Download fails silently
**Solution**: Check error handling and add proper try-catch blocks

### Issue 4: File permissions error
**Solution**: Ensure write permissions in downloads folder

---

## 📝 Next Steps

1. Choose implementation option (ytdl-core or yt-dlp)
2. Install dependencies
3. Copy code from this guide
4. Test thoroughly
5. Add advanced features (playlist, batch download, etc.)

---

**Last Updated**: January 7, 2026

