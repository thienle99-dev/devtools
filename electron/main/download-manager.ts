import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';
import type { DownloadTask, DownloadSegment, DownloadProgress, DownloadSettings } from '../../src/types/network/download';

interface StoreSchema {
    history: DownloadTask[];
    settings: DownloadSettings;
}

const HTTP_AGENT = new http.Agent({ keepAlive: true, maxSockets: 128, keepAliveMsecs: 10000 });
const HTTPS_AGENT = new https.Agent({ keepAlive: true, maxSockets: 128, keepAliveMsecs: 10000 });
const COMMON_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export class DownloadManager extends EventEmitter {
    private store: Store<StoreSchema>;
    private history: DownloadTask[];
    private activeTasks: Map<string, {
        task: DownloadTask;
        abortControllers: AbortController[];
        fd?: number;
        lastUpdate: number;
        lastDownloaded: number;
    }> = new Map();

    constructor() {
        super();
        this.store = new Store<StoreSchema>({
            name: 'download-manager-history',
            defaults: {
                history: [],
                settings: {
                    downloadPath: app.getPath('downloads'),
                    maxConcurrentDownloads: 5,
                    segmentsPerDownload: 32,
                    autoStart: true,
                    monitorClipboard: true,
                    autoUnzip: false,
                    autoOpenFolder: true
                }
            }
        });
        this.history = this.store.get('history', []);
    }

    getSettings(): DownloadSettings {
        return this.store.get('settings');
    }

    saveSettings(settings: Partial<DownloadSettings>): void {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        this.store.set('settings', updated);
        this.checkQueue();
    }

    getHistory(): DownloadTask[] {
        return this.history;
    }

    private saveTask(task: DownloadTask) {
        const index = this.history.findIndex(t => t.id === task.id);
        if (index > -1) {
            this.history[index] = { ...task };
        } else {
            this.history.unshift({ ...task });
        }

        // Persist periodically or on important changes
        // For now, persist on every status change or periodically
        this.persistHistory();
    }

    private persistHistory() {
        this.store.set('history', this.history.slice(0, 500));
    }

    private emitProgress(task: DownloadTask) {
        const progress: DownloadProgress = {
            taskId: task.id,
            downloadedSize: task.downloadedSize,
            totalSize: task.totalSize,
            speed: task.speed,
            eta: task.eta,
            progress: task.totalSize > 0 ? (task.downloadedSize / task.totalSize) * 100 : 0,
            status: task.status,
            segments: task.segments
        };
        this.emit('progress', progress);
    }

    async createDownload(url: string, customFilename?: string): Promise<DownloadTask> {
        const info = await this.getFileInfo(url);

        const settings = this.getSettings();
        // Use custom filename, or filename from headers, or from final URL path
        let filename = customFilename || info.filename || path.basename(new URL(info.finalUrl).pathname) || 'download';
        filename = this.sanitizeFilename(filename);
        
        const filepath = path.join(settings.downloadPath, filename);
        const category = this.getCategory(filename);

        const task: DownloadTask = {
            id: randomUUID(),
            url: info.finalUrl, // Use resolve/final URL for the task
            filename,
            filepath,
            totalSize: info.size,
            downloadedSize: 0,
            segments: [],
            status: 'queued',
            speed: 0,
            eta: 0,
            priority: 5,
            category,
            createdAt: Date.now()
        };

        if (info.acceptRanges && info.size > 0 && settings.segmentsPerDownload > 1) {
            const segmentSize = Math.ceil(info.size / settings.segmentsPerDownload);
            for (let i = 0; i < settings.segmentsPerDownload; i++) {
                const start = i * segmentSize;
                const end = Math.min((i + 1) * segmentSize - 1, info.size - 1);
                task.segments.push({
                    id: i,
                    start,
                    end,
                    downloaded: 0,
                    status: 'pending'
                });
            }
        } else {
            task.segments.push({
                id: 0,
                start: 0,
                end: info.size > 0 ? info.size - 1 : -1,
                downloaded: 0,
                status: 'pending'
            });
        }

        this.saveTask(task);
        this.checkQueue();

        return task;
    }

    private async getFileInfo(url: string, limit = 5): Promise<{ size: number, acceptRanges: boolean, filename?: string, finalUrl: string }> {
        if (limit <= 0) {
            throw new Error('Too many redirects');
        }

        return new Promise((resolve, reject) => {
            try {
                const parsedUrl = new URL(url);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;
                const agent = parsedUrl.protocol === 'https:' ? HTTPS_AGENT : HTTP_AGENT;
                const options = {
                    method: 'HEAD',
                    agent,
                    headers: {
                        'User-Agent': COMMON_USER_AGENT,
                        'Accept': '*/*',
                        'Connection': 'keep-alive'
                    }
                };

                const req = protocol.request(url, options, (res) => {
                    // Handle redirects
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        const redirectUrl = new URL(res.headers.location, url).toString();
                        resolve(this.getFileInfo(redirectUrl, limit - 1));
                        return;
                    }

                    // If HEAD fails, try GET with range 0-0
                    if (res.statusCode === 405 || res.statusCode === 403 || res.statusCode === 404) {
                        const getOptions = { ...options, method: 'GET', headers: { ...options.headers, 'Range': 'bytes=0-0' } };
                        const getReq = protocol.request(url, getOptions, (getRes) => {
                            const size = this.parseContentRange(getRes.headers['content-range']) ||
                                parseInt(getRes.headers['content-length'] || '0', 10);
                            const acceptRanges = getRes.headers['accept-ranges'] === 'bytes' || !!getRes.headers['content-range'];
                            const contentDisposition = getRes.headers['content-disposition'];
                            const filename = this.parseFilename(contentDisposition);

                            getRes.resume();
                            resolve({ size, acceptRanges, filename, finalUrl: url });
                        });
                        getReq.on('error', reject);
                        getReq.end();
                        return;
                    }

                    const size = parseInt(res.headers['content-length'] || '0', 10);
                    const acceptRanges = res.headers['accept-ranges'] === 'bytes';
                    const contentDisposition = res.headers['content-disposition'];
                    const filename = this.parseFilename(contentDisposition);

                    resolve({ size, acceptRanges, filename, finalUrl: url });
                });

                req.on('error', (err) => {
                    const getOptions = { ...options, method: 'GET', headers: { ...options.headers, 'Range': 'bytes=0-0' } };
                    const getReq = protocol.request(url, getOptions, (getRes) => {
                        const size = this.parseContentRange(getRes.headers['content-range']) ||
                            parseInt(getRes.headers['content-length'] || '0', 10);
                        const acceptRanges = getRes.headers['accept-ranges'] === 'bytes' || !!getRes.headers['content-range'];
                        const contentDisposition = getRes.headers['content-disposition'];
                        const filename = this.parseFilename(contentDisposition);

                        getRes.resume();
                        resolve({ size, acceptRanges, filename, finalUrl: url });
                    });
                    getReq.on('error', () => reject(err));
                    getReq.end();
                });

                req.setTimeout(15000, () => {
                    req.destroy();
                    reject(new Error('Request timeout during getFileInfo'));
                });

                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    private parseContentRange(range?: string): number {
        if (!range) return 0;
        const match = range.match(/\/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    }

    private parseFilename(disposition?: string): string | undefined {
        if (!disposition) return undefined;

        let filename: string | undefined;

        // Try filename* first (RFC 5987)
        // Matches filename*=UTF-8''name.ext
        const filenameStarMatch = disposition.match(/filename\*=(?:UTF-8|utf-8)''([^;\s]+)/i);
        if (filenameStarMatch) {
            try {
                filename = decodeURIComponent(filenameStarMatch[1]);
            } catch (e) { }
        }

        // If not found or failed, try regular filename
        if (!filename) {
            // Matches filename="quoted name.ext" or filename=unquoted_name.ext
            const filenameMatch = disposition.match(/filename=(?:(['"])(.*?)\1|([^;\s]+))/i);
            if (filenameMatch) {
                filename = filenameMatch[2] || filenameMatch[3];
            }
        }

        return filename;
    }

    private sanitizeFilename(filename: string): string {
        // First, strip common header pollution if they were accidentally captured
        // (This is a safety net for imperfect regex)
        let clean = filename.split(';')[0]; // Take everything before the first semicolon
        clean = clean.replace(/filename\*?=.*/gi, ''); // Remove trailing filename assignments
        
        // Remove characters that are problematic across OSs
        clean = clean.replace(/[<>:"/\\|?*]/g, '_');
        
        // Strip leading/trailing spaces and dots
        clean = clean.replace(/^\.+|\.+$/g, '').trim();
        
        return clean || 'download';
    }

    private checkQueue(): void {
        const settings = this.getSettings();
        const activeCount = [...this.activeTasks.values()].filter(a => a.task.status === 'downloading').length;

        if (activeCount >= settings.maxConcurrentDownloads) return;

        const nextTask = this.history.find(t => t.status === 'queued');

        if (nextTask) {
            this.startDownload(nextTask.id);
        }
    }

    async startDownload(taskId: string): Promise<void> {
        const task = this.history.find(t => t.id === taskId);
        if (!task || task.status === 'completed' || task.status === 'downloading') return;

        const settings = this.getSettings();

        // Concurrency check (in case it was called directly instead of from checkQueue)
        const activeCount = [...this.activeTasks.values()].filter(a => a.task.status === 'downloading').length;
        if (activeCount >= settings.maxConcurrentDownloads) {
            task.status = 'queued';
            this.saveTask(task);
            return;
        }

        task.status = 'downloading';
        task.error = undefined;
        this.saveTask(task);
        this.emitProgress(task);

        const abortControllers: AbortController[] = [];
        this.activeTasks.set(taskId, { 
            task, 
            abortControllers, 
            lastUpdate: Date.now(), 
            lastDownloaded: task.downloadedSize 
        });

        // Ensure directory exists
        const dir = path.dirname(task.filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize/Pre-allocate file ONLY if it doesn't exist
        try {
            if (!fs.existsSync(task.filepath)) {
                if (task.totalSize > 0) {
                    const tempFd = fs.openSync(task.filepath, 'w');
                    fs.ftruncateSync(tempFd, task.totalSize);
                    fs.closeSync(tempFd);
                } else {
                    fs.writeFileSync(task.filepath, Buffer.alloc(0));
                }
            }

            // Open for parallel reading/writing
            const fd = fs.openSync(task.filepath, 'r+');
            const entry = this.activeTasks.get(taskId);
            if (entry) entry.fd = fd;
        } catch (err: any) {
            console.error('File allocation/open error:', err);
            task.status = 'failed';
            task.error = `File error: ${err.message}`;
            this.saveTask(task);
            this.activeTasks.delete(taskId);
            return;
        }

        const entry = this.activeTasks.get(taskId);
        if (!entry || entry.fd === undefined) return;
        const fd = entry.fd;

        const promises = task.segments.map(segment => {
            if (segment.status === 'completed') return Promise.resolve();
            return this.downloadSegment(task, segment, abortControllers, fd);
        });

        Promise.all(promises).then(() => {
            if (task.status === 'downloading') {
                task.status = 'completed';
                task.completedAt = Date.now();
                task.speed = 0;
                this.saveTask(task);
                this.closeTaskFd(taskId);
                this.activeTasks.delete(taskId);
                this.handlePostProcessing(task);
                this.checkQueue();
            }
        }).catch(err => {
            if (err.name === 'AbortError' || task.status === 'paused') {
                this.closeTaskFd(taskId);
                return;
            }
            console.error(`Download failed for ${task.filename}:`, err);
            task.status = 'failed';
            task.error = err.message;
            task.speed = 0;
            this.saveTask(task);
            this.emitProgress(task);
            this.closeTaskFd(taskId);
            this.activeTasks.delete(taskId);
            this.checkQueue();
        });
    }

    private closeTaskFd(taskId: string) {
        const entry = this.activeTasks.get(taskId);
        if (entry && entry.fd !== undefined) {
            try {
                fs.closeSync(entry.fd);
                entry.fd = undefined;
            } catch (e) {
                console.error('Error closing fd:', e);
            }
        }
    }

    private downloadSegment(
        task: DownloadTask,
        segment: DownloadSegment,
        abortControllers: AbortController[],
        fd: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            abortControllers.push(controller);

            const startPos = segment.start + segment.downloaded;
            const endPos = segment.end;

            // If segment already finished
            if (startPos > endPos && endPos !== -1) {
                segment.status = 'completed';
                return resolve();
            }

            const headers: any = {
                'User-Agent': COMMON_USER_AGENT,
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Referer': new URL(task.url).origin
            };

            if (endPos !== -1) {
                headers['Range'] = `bytes=${startPos}-${endPos}`;
            }

            const download = (currentUrl: string, redirectLimit: number, retryCount: number = 0) => {
                if (redirectLimit <= 0) {
                    reject(new Error('Too many redirects in segment download'));
                    return;
                }

                const parsedUrl = new URL(currentUrl);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;
                const agent = parsedUrl.protocol === 'https:' ? HTTPS_AGENT : HTTP_AGENT;
                
                // Update Referer if helpful
                headers['Referer'] = parsedUrl.origin;
                
                const req = protocol.get(currentUrl, { headers, agent, signal: controller.signal }, (res) => {
                    // Handle redirects
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        const redirectUrl = new URL(res.headers.location, currentUrl).toString();
                        res.resume(); // Must consume current response
                        download(redirectUrl, redirectLimit - 1, retryCount);
                        return;
                    }

                    if (res.statusCode !== 200 && res.statusCode !== 206) {
                        // If we get an error but haven't exhausted retries, try again
                        if (retryCount < 3) {
                            res.resume();
                            setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2000 * (retryCount + 1));
                            return;
                        }
                        reject(new Error(`Server returned ${res.statusCode} for segment ${segment.id}`));
                        return;
                    }

                    segment.status = 'downloading';

                    let isWriting = false;

                    res.on('data', (chunk: Buffer) => {
                        const writePos = segment.start + segment.downloaded;
                        
                        // Increment metrics
                        segment.downloaded += chunk.length;
                        task.downloadedSize += chunk.length;

                        // Perform direct write using the task's shared file descriptor
                        isWriting = true;
                        fs.write(fd, chunk, 0, chunk.length, writePos, (err) => {
                            isWriting = false;
                            if (err) {
                                console.error('Write error in segment:', err);
                                req.destroy();
                                reject(err);
                            }
                        });

                        const now = Date.now();
                        const entry = this.activeTasks.get(task.id);
                        if (entry && now - entry.lastUpdate >= 1000) {
                            const diff = now - entry.lastUpdate;
                            const downloadedDiff = task.downloadedSize - entry.lastDownloaded;
                            
                            task.speed = Math.floor((downloadedDiff * 1000) / diff);
                            task.eta = task.totalSize > 0 ? (task.totalSize - task.downloadedSize) / task.speed : 0;
                            
                            entry.lastUpdate = now;
                            entry.lastDownloaded = task.downloadedSize;
                            this.emitProgress(task);
                        }
                    });

                    res.on('end', () => {
                        const checkFinish = () => {
                            if (!isWriting) {
                                segment.status = 'completed';
                                resolve();
                            } else {
                                setTimeout(checkFinish, 10);
                            }
                        };
                        checkFinish();
                    });

                    res.on('error', (err) => {
                        if (retryCount < 3) {
                            setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2000 * (retryCount + 1));
                        } else {
                            segment.status = 'failed';
                            reject(err);
                        }
                    });
                });

                req.on('error', (err) => {
                    if (retryCount < 3 && err.name !== 'AbortError') {
                        setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2000 * (retryCount + 1));
                    } else {
                        segment.status = 'failed';
                        reject(err);
                    }
                });

                req.setTimeout(60000, () => {
                    req.destroy();
                    if (retryCount < 3) {
                        setTimeout(() => download(currentUrl, redirectLimit, retryCount + 1), 2000 * (retryCount + 1));
                    } else {
                        reject(new Error('Segment download timeout'));
                    }
                });
            };

            download(task.url, 5);
        });
    }

    pauseDownload(taskId: string): void {
        const active = this.activeTasks.get(taskId);
        if (active) {
            active.task.status = 'paused';
            active.task.speed = 0;
            active.abortControllers.forEach(c => c.abort());
            this.saveTask(active.task);
            this.emitProgress(active.task);
            this.closeTaskFd(taskId);
            this.activeTasks.delete(taskId);
            this.checkQueue();
        } else {
            const task = this.history.find(t => t.id === taskId);
            if (task && task.status === 'queued') {
                task.status = 'paused';
                this.saveTask(task);
                this.emitProgress(task);
            }
        }
    }

    resumeDownload(taskId: string): void {
        const task = this.history.find(t => t.id === taskId);
        if (task) {
            task.status = 'queued';
            this.saveTask(task);
            this.checkQueue();
        }
    }

    cancelDownload(taskId: string): void {
        this.pauseDownload(taskId);
        const index = this.history.findIndex(t => t.id === taskId);
        if (index > -1) {
            const task = this.history[index];
            if (fs.existsSync(task.filepath) && task.status !== 'completed') {
                try {
                    fs.unlinkSync(task.filepath);
                } catch (e) {
                    console.error('Failed to delete partial file:', e);
                }
            }
            this.history.splice(index, 1);
            this.persistHistory();
            this.checkQueue();
        }
    }

    clearHistory(): void {
        // Only clear non-active tasks
        this.history = this.history.filter(t => this.activeTasks.has(t.id));
        this.persistHistory();
    }

    private async handlePostProcessing(task: DownloadTask) {
        const settings = this.getSettings();
        
        // 1. Auto Open Folder
        if (settings.autoOpenFolder) {
            try {
                const { shell } = require('electron');
                shell.showItemInFolder(task.filepath);
            } catch (err) {
                console.error('Failed to auto-open folder:', err);
            }
        }

        // 2. Auto Unzip
        if (settings.autoUnzip && task.category === 'compressed') {
            // This would require an unzip library like adm-zip or similar
            // For now we'll just log and maybe open it
            console.log('Auto-unzip triggered for:', task.filename);
        }
    }

    private getCategory(filename: string): DownloadTask['category'] {
        const ext = path.extname(filename).toLowerCase().slice(1);
        const categories: Record<string, string[]> = {
            music: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'alac', 'aik', 'opus'],
            video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mpeg', 'mpg', 'm4v', '3gp', 'ts'],
            document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'epub', 'csv', 'rtf', 'odt', 'ods'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic', 'avif'],
            program: ['exe', 'msi', 'dmg', 'pkg', 'app', 'sh', 'bat', 'bin', 'deb', 'rpm'],
            compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', '7zip', 'xz']
        };

        for (const [cat, extensions] of Object.entries(categories)) {
            if (extensions.includes(ext)) return cat as DownloadTask['category'];
        }
        return 'other';
    }
}

export const downloadManager = new DownloadManager();
