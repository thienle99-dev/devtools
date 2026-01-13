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

export class DownloadManager extends EventEmitter {
    private store: Store<StoreSchema>;
    private history: DownloadTask[];
    private activeTasks: Map<string, {
        task: DownloadTask;
        abortControllers: AbortController[];
    }> = new Map();

    constructor() {
        super();
        this.store = new Store<StoreSchema>({
            name: 'download-manager-history',
            defaults: {
                history: [],
                settings: {
                    downloadPath: app.getPath('downloads'),
                    maxConcurrentDownloads: 3,
                    segmentsPerDownload: 8,
                    autoStart: true
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

        const parsedUrl = new URL(url);
        const filename = customFilename || info.filename || path.basename(parsedUrl.pathname) || 'download';
        const settings = this.getSettings();
        const filepath = path.join(settings.downloadPath, filename);

        const category = this.getCategory(filename);

        const task: DownloadTask = {
            id: randomUUID(),
            url,
            filename,
            filepath,
            totalSize: info.size,
            downloadedSize: 0,
            segments: [],
            status: 'queued', // Start as queued, let checkQueue handle it
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

    private async getFileInfo(url: string, limit = 5): Promise<{ size: number, acceptRanges: boolean, filename?: string }> {
        if (limit <= 0) {
            throw new Error('Too many redirects');
        }

        return new Promise((resolve, reject) => {
            try {
                const parsedUrl = new URL(url);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;
                const options = {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*'
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
                            resolve({ size, acceptRanges, filename });
                        });
                        getReq.on('error', reject);
                        getReq.end();
                        return;
                    }

                    const size = parseInt(res.headers['content-length'] || '0', 10);
                    const acceptRanges = res.headers['accept-ranges'] === 'bytes';
                    const contentDisposition = res.headers['content-disposition'];
                    const filename = this.parseFilename(contentDisposition);

                    resolve({ size, acceptRanges, filename });
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
                        resolve({ size, acceptRanges, filename });
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
        const match = disposition.match(/filename=['"]?([^'"]+)['"]?/);
        return match ? match[1] : undefined;
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
        this.activeTasks.set(taskId, { task, abortControllers });

        // Ensure directory exists
        const dir = path.dirname(task.filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize/Pre-allocate file ONLY if it doesn't exist
        try {
            if (!fs.existsSync(task.filepath)) {
                if (task.totalSize > 0) {
                    const fd = fs.openSync(task.filepath, 'w');
                    fs.ftruncateSync(fd, task.totalSize);
                    fs.closeSync(fd);
                } else {
                    fs.writeFileSync(task.filepath, Buffer.alloc(0));
                }
            }
        } catch (err) {
            console.error('File allocation error:', err);
        }

        const promises = task.segments.map(segment => {
            if (segment.status === 'completed') return Promise.resolve();
            return this.downloadSegment(task, segment, abortControllers);
        });

        Promise.all(promises).then(() => {
            if (task.status === 'downloading') {
                task.status = 'completed';
                task.completedAt = Date.now();
                task.speed = 0;
                this.saveTask(task);
                this.emitProgress(task);
                this.activeTasks.delete(taskId);
                this.checkQueue();
            }
        }).catch(err => {
            if (err.name === 'AbortError' || task.status === 'paused') return;
            console.error(`Download failed for ${task.filename}:`, err);
            task.status = 'failed';
            task.error = err.message;
            task.speed = 0;
            this.saveTask(task);
            this.emitProgress(task);
            this.activeTasks.delete(taskId);
            this.checkQueue();
        });
    }

    private downloadSegment(
        task: DownloadTask,
        segment: DownloadSegment,
        abortControllers: AbortController[]
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

            const protocol = task.url.startsWith('https') ? https : http;
            const headers: any = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            };

            if (endPos !== -1) {
                headers['Range'] = `bytes=${startPos}-${endPos}`;
            }

            let fileStream: fs.WriteStream | null = null;

            const req = protocol.get(task.url, { headers, signal: controller.signal }, (res) => {
                if (res.statusCode !== 200 && res.statusCode !== 206) {
                    reject(new Error(`Server returned ${res.statusCode} for segment ${segment.id}`));
                    return;
                }

                segment.status = 'downloading';

                try {
                    fileStream = fs.createWriteStream(task.filepath, {
                        flags: 'r+',
                        start: startPos
                    });
                } catch (e) {
                    reject(e);
                    return;
                }

                res.pipe(fileStream);

                let lastUpdateTime = Date.now();
                let downloadedSinceLastUpdate = 0;

                res.on('data', (chunk: Buffer) => {
                    segment.downloaded += chunk.length;
                    task.downloadedSize += chunk.length;
                    downloadedSinceLastUpdate += chunk.length;

                    const now = Date.now();
                    const diff = now - lastUpdateTime;
                    if (diff >= 1000) {
                        task.speed = Math.floor((downloadedSinceLastUpdate * 1000) / diff);
                        task.eta = task.totalSize > 0 ? (task.totalSize - task.downloadedSize) / task.speed : 0;

                        this.emitProgress(task);

                        lastUpdateTime = now;
                        downloadedSinceLastUpdate = 0;
                    }
                });

                res.on('end', () => {
                    if (fileStream) {
                        fileStream.end(() => {
                            segment.status = 'completed';
                            resolve();
                        });
                    } else {
                        segment.status = 'completed';
                        resolve();
                    }
                });

                res.on('error', (err) => {
                    segment.status = 'failed';
                    if (fileStream) fileStream.destroy();
                    reject(err);
                });
            });

            req.on('error', (err) => {
                segment.status = 'failed';
                if (fileStream) fileStream.destroy();
                reject(err);
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Segment download timeout'));
            });
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

    private getCategory(filename: string): DownloadTask['category'] {
        const ext = path.extname(filename).toLowerCase().slice(1);
        const categories: Record<string, string[]> = {
            music: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
            video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mpeg', 'mpg'],
            document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'epub', 'csv'],
            program: ['exe', 'msi', 'dmg', 'pkg', 'app', 'sh', 'bat', 'bin'],
            compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso']
        };

        for (const [cat, extensions] of Object.entries(categories)) {
            if (extensions.includes(ext)) return cat as DownloadTask['category'];
        }
        return 'other';
    }
}

export const downloadManager = new DownloadManager();
