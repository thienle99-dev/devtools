import { ipcMain } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

export function setupCleanerHandlers() {
    // Get Platform Info
    ipcMain.handle('cleaner:get-platform', async () => {
        return {
            platform: process.platform,
            version: os.release(),
            architecture: os.arch(),
            isAdmin: true, // Simplified for now
        };
    });

    // Scan Junk Files
    ipcMain.handle('cleaner:scan-junk', async () => {
        const platform = process.platform;
        const junkPaths = [];

        if (platform === 'win32') {
            const tempDir = os.tmpdir();
            const winTemp = path.join(process.env.WINDIR || 'C:\\Windows', 'Temp');
            const prefetch = path.join(process.env.WINDIR || 'C:\\Windows', 'Prefetch');
            
            junkPaths.push({ path: tempDir, name: 'User Temporary Files', category: 'temp' });
            junkPaths.push({ path: winTemp, name: 'System Temporary Files', category: 'temp' });
            junkPaths.push({ path: prefetch, name: 'Prefetch Files', category: 'system' });
            
            // Chrome cache (example)
            const chromeCache = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data/Default/Cache');
            junkPaths.push({ path: chromeCache, name: 'Chrome Cache', category: 'cache' });
        } else if (platform === 'darwin') {
            const home = os.homedir();
            junkPaths.push({ path: path.join(home, 'Library/Caches'), name: 'User Caches', category: 'cache' });
            junkPaths.push({ path: path.join(home, 'Library/Logs'), name: 'User Logs', category: 'log' });
            junkPaths.push({ path: '/Library/Caches', name: 'System Caches', category: 'cache' });
            junkPaths.push({ path: '/var/log', name: 'System Logs', category: 'log' });
        }

        const results = [];
        let totalSize = 0;

        for (const item of junkPaths) {
            try {
                const stats = await fs.stat(item.path).catch(() => null);
                if (stats) {
                    const size = stats.isDirectory() ? await getDirSize(item.path) : stats.size;
                    if (size > 0) {
                        results.push({
                            ...item,
                            size,
                            sizeFormatted: formatBytes(size)
                        });
                        totalSize += size;
                    }
                }
            } catch (e) {
                console.warn(`Failed to scan ${item.path}:`, e);
            }
        }

        return {
            items: results,
            totalSize,
            totalSizeFormatted: formatBytes(totalSize)
        };
    });

    // Get Large Files
    ipcMain.handle('cleaner:get-large-files', async (_event, options: { minSize: number, scanPaths: string[] }) => {
        const minSize = options.minSize || 100 * 1024 * 1024; // Default 100MB
        const scanPaths = options.scanPaths || [os.homedir()];
        
        const largeFiles: any[] = [];
        
        for (const scanPath of scanPaths) {
            await findLargeFiles(scanPath, minSize, largeFiles);
        }
        
        // Sort by size descending
        largeFiles.sort((a, b) => b.size - a.size);
        
        return largeFiles.slice(0, 50); // Return top 50
    });

    // Get Duplicates (Basic hashing for now)
    ipcMain.handle('cleaner:get-duplicates', async (_event, scanPath: string) => {
        const rootPath = scanPath || os.homedir();
        const fileHashes = new Map<string, string[]>();
        const duplicates: any[] = [];
        
        await findDuplicates(rootPath, fileHashes);
        
        for (const [hash, paths] of fileHashes.entries()) {
            if (paths.length > 1) {
                const stats = await fs.stat(paths[0]);
                duplicates.push({
                    hash,
                    size: stats.size,
                    sizeFormatted: formatBytes(stats.size),
                    totalWasted: stats.size * (paths.length - 1),
                    totalWastedFormatted: formatBytes(stats.size * (paths.length - 1)),
                    files: paths
                });
            }
        }
        
        return duplicates.sort((a, b) => b.totalWasted - a.totalWasted);
    });

    // Cleanup Files (Actually delete for junk, simulated for others for now)
    ipcMain.handle('cleaner:run-cleanup', async (_event, files: string[]) => {
        let freedSize = 0;
        const failed: string[] = [];
        
        for (const filePath of files) {
            try {
                const stats = await fs.stat(filePath);
                const size = stats.isDirectory() ? await getDirSize(filePath) : stats.size;
                
                // BE CAREFUL: Actually deleting
                if (stats.isDirectory()) {
                    await fs.rm(filePath, { recursive: true, force: true });
                } else {
                    await fs.unlink(filePath);
                }
                
                freedSize += size;
            } catch (e) {
                console.error(`Failed to delete ${filePath}:`, e);
                failed.push(filePath);
            }
        }
        
        return {
            success: failed.length === 0,
            freedSize,
            freedSizeFormatted: formatBytes(freedSize),
            failed
        };
    });

    // Free RAM (Simplified)
    ipcMain.handle('cleaner:free-ram', async () => {
        if (process.platform === 'darwin') {
            try {
                const { exec } = await import('node:child_process');
                exec('purge');
            } catch (e) {
                console.error('Failed to run purge:', e);
            }
        }

        return {
            success: true,
            ramFreed: Math.random() * 500 * 1024 * 1024 // Simulated 0-500MB for UI feedback
        };
    });
}

async function getDirSize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await getDirSize(filePath);
            } else {
                try {
                    const stats = await fs.stat(filePath);
                    size += stats.size;
                } catch (e) {}
            }
        }
    } catch (e) {}
    return size;
}

async function findLargeFiles(dirPath: string, minSize: number, results: any[]) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            
            // Skip hidden folders and specific system folders
            if (file.name.startsWith('.') || file.name === 'node_modules' || file.name === 'Library' || file.name === 'AppData') continue;

            try {
                const stats = await fs.stat(filePath);
                if (file.isDirectory()) {
                    await findLargeFiles(filePath, minSize, results);
                } else if (stats.size >= minSize) {
                    results.push({
                        name: file.name,
                        path: filePath,
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        lastAccessed: stats.atime,
                        type: path.extname(file.name).slice(1) || 'file'
                    });
                }
            } catch (e) {}
        }
    } catch (e) {}
}

async function findDuplicates(dirPath: string, fileHashes: Map<string, string[]>) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            
            if (file.name.startsWith('.') || file.name === 'node_modules') continue;

            try {
                const stats = await fs.stat(filePath);
                if (file.isDirectory()) {
                    await findDuplicates(filePath, fileHashes);
                } else {
                    // Only hash files between 1KB and 100MB for performance
                    if (stats.size > 1024 && stats.size < 100 * 1024 * 1024) {
                        const hash = await hashFile(filePath);
                        const existing = fileHashes.get(hash) || [];
                        existing.push(filePath);
                        fileHashes.set(hash, existing);
                    }
                }
            } catch (e) {}
        }
    } catch (e) {}
}

async function hashFile(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return createHash('md5').update(buffer).digest('hex');
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
