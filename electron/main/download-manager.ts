import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';
import type { DownloadTask, DownloadSegment, DownloadProgress, DownloadSettings } from '../../src/types/network/download';

interface StoreSchema {
    history: DownloadTask[];
    settings: DownloadSettings;
}

export class DownloadManager {
    private store: Store<StoreSchema>;
    private activeTasks: Map<string, {
        task: DownloadTask;
        abortControllers: AbortController[];
    }> = new Map();

    constructor() {
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
    }

    getSettings(): DownloadSettings {
        return this.store.get('settings');
    }

    saveSettings(settings: Partial<DownloadSettings>): void {
        const current = this.getSettings();
        this.store.set('settings', { ...current, ...settings });
    }

    getHistory(): DownloadTask[] {
        return this.store.get('history', []);
    }

    private saveTask(task: DownloadTask) {
        const history = this.getHistory();
        const index = history.findIndex(t => t.id === task.id);
        if (index > -1) {
            history[index] = task;
        } else {
            history.unshift(task);
        }
        this.store.set('history', history.slice(0, 500));
    }

    async createDownload(url: string, customFilename?: string): Promise<DownloadTask> {
        const info = await this.getFileInfo(url);

        const parsedUrl = new URL(url);
        const filename = customFilename || info.filename || path.basename(parsedUrl.pathname) || 'download';
        const settings = this.getSettings();
        const filepath = path.join(settings.downloadPath, filename);

        const task: DownloadTask = {
            id: randomUUID(),
            url,
            filename,
            filepath,
            totalSize: info.size,
            downloadedSize: 0,
            segments: [],
            status: settings.autoStart ? 'downloading' : 'queued',
            speed: 0,
            eta: 0,
            priority: 5,
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

        if (settings.autoStart) {
            this.startDownload(task.id);
        }

        return task;
    }

    private async getFileInfo(url: string, limit = 5): Promise<{ size: number, acceptRanges: boolean, filename?: string }> {
        if (limit <= 0) {
            throw new Error('Too many redirects');
        }

        return new Promise((resolve, reject) => {
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

                        // Consume the stream
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
                // If HEAD request fails with socket hang up or similar, try GET
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
                getReq.on('error', () => reject(err)); // If GET also fails, throw original error
                getReq.end();
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
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

    async startDownload(taskId: string, progressCallback?: (p: DownloadProgress) => void): Promise<void> {
        const history = this.getHistory();
        const task = history.find(t => t.id === taskId);
        if (!task || task.status === 'downloading' || task.status === 'completed') return;

        task.status = 'downloading';
        this.saveTask(task);

        const abortControllers: AbortController[] = [];
        this.activeTasks.set(taskId, { task, abortControllers });

        // Ensure directory exists
        const dir = path.dirname(task.filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize/Pre-allocate file
        try {
            if (!fs.existsSync(task.filepath)) {
                if (task.totalSize > 0) {
                    fs.writeFileSync(task.filepath, Buffer.alloc(0));
                    fs.truncateSync(task.filepath, task.totalSize);
                } else {
                    fs.writeFileSync(task.filepath, Buffer.alloc(0));
                }
            }
        } catch (err: any) {
            console.error('Failed to pre-allocate file:', err);
            // Fallback: just open/ensure it exists
            if (!fs.existsSync(task.filepath)) {
                fs.closeSync(fs.openSync(task.filepath, 'w'));
            }
        }

        const promises = task.segments.map(segment => {
            if (segment.status === 'completed') return Promise.resolve();
            return this.downloadSegment(task, segment, abortControllers, progressCallback);
        });

        Promise.all(promises).then(() => {
            if (task.status === 'downloading') {
                task.status = 'completed';
                task.completedAt = Date.now();
                this.saveTask(task);
                this.activeTasks.delete(taskId);
            }
        }).catch(err => {
            if (err.name === 'AbortError') return;
            task.status = 'failed';
            task.error = err.message;
            this.saveTask(task);
            this.activeTasks.delete(taskId);
        });
    }

    private downloadSegment(
        task: DownloadTask,
        segment: DownloadSegment,
        abortControllers: AbortController[],
        progressCallback?: (p: DownloadProgress) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            abortControllers.push(controller);

            const startPos = segment.start + segment.downloaded;
            const endPos = segment.end;

            const protocol = task.url.startsWith('https') ? https : http;
            const headers: any = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            };
            if (endPos !== -1) {
                headers['Range'] = `bytes=${startPos}-${endPos}`;
            }

            const req = protocol.get(task.url, { headers, signal: controller.signal }, (res) => {
                if (res.statusCode !== 200 && res.statusCode !== 206) {
                    reject(new Error(`Server returned status code ${res.statusCode}`));
                    return;
                }

                segment.status = 'downloading';
                const fileStream = fs.createWriteStream(task.filepath, {
                    flags: 'r+',
                    start: startPos
                });

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

                        if (progressCallback) {
                            progressCallback({
                                taskId: task.id,
                                downloadedSize: task.downloadedSize,
                                totalSize: task.totalSize,
                                speed: task.speed,
                                eta: task.eta,
                                progress: task.totalSize > 0 ? (task.downloadedSize / task.totalSize) * 100 : 0,
                                status: task.status
                            });
                        }

                        lastUpdateTime = now;
                        downloadedSinceLastUpdate = 0;
                        // Periodically save task state
                        this.saveTask(task);
                    }
                });

                res.on('end', () => {
                    segment.status = 'completed';
                    resolve();
                });

                res.on('error', (err) => {
                    segment.status = 'failed';
                    reject(err);
                });

                fileStream.on('error', (err) => {
                    segment.status = 'failed';
                    reject(err);
                });
            });

            req.on('error', (err) => {
                segment.status = 'failed';
                reject(err);
            });
        });
    }

    pauseDownload(taskId: string): void {
        const active = this.activeTasks.get(taskId);
        if (active) {
            active.abortControllers.forEach(c => c.abort());
            active.task.status = 'paused';
            this.saveTask(active.task);
            this.activeTasks.delete(taskId);
        }
    }

    resumeDownload(taskId: string, progressCallback?: (p: DownloadProgress) => void): void {
        this.startDownload(taskId, progressCallback);
    }

    cancelDownload(taskId: string): void {
        this.pauseDownload(taskId);
        const history = this.getHistory();
        const index = history.findIndex(t => t.id === taskId);
        if (index > -1) {
            const task = history[index];
            if (fs.existsSync(task.filepath)) {
                fs.unlinkSync(task.filepath);
            }
            history.splice(index, 1);
            this.store.set('history', history);
        }
    }

    clearHistory(): void {
        this.store.set('history', []);
    }
}

export const downloadManager = new DownloadManager();
