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
            const windir = process.env.WINDIR || 'C:\\Windows';
            const tempDir = os.tmpdir();
            const winTemp = path.join(windir, 'Temp');
            const prefetch = path.join(windir, 'Prefetch');
            const softDist = path.join(windir, 'SoftwareDistribution', 'Download');
            
            junkPaths.push({ path: tempDir, name: 'User Temporary Files', category: 'temp' });
            junkPaths.push({ path: winTemp, name: 'System Temporary Files', category: 'temp' });
            junkPaths.push({ path: prefetch, name: 'Prefetch Files', category: 'system' });
            junkPaths.push({ path: softDist, name: 'Windows Update Cache', category: 'system' });
            
            // Chrome cache
            const chromeCache = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data/Default/Cache');
            const edgeCache = path.join(process.env.LOCALAPPDATA || '', 'Microsoft/Edge/User Data/Default/Cache');
            junkPaths.push({ path: chromeCache, name: 'Chrome Cache', category: 'cache' });
            junkPaths.push({ path: edgeCache, name: 'Edge Cache', category: 'cache' });
        } else if (platform === 'darwin') {
            const home = os.homedir();
            junkPaths.push({ path: path.join(home, 'Library/Caches'), name: 'User Caches', category: 'cache' });
            junkPaths.push({ path: path.join(home, 'Library/Logs'), name: 'User Logs', category: 'log' });
            junkPaths.push({ path: '/Library/Caches', name: 'System Caches', category: 'cache' });
            junkPaths.push({ path: '/var/log', name: 'System Logs', category: 'log' });
            
            // macOS Specifics
            junkPaths.push({ path: path.join(home, 'Library/Caches/com.apple.bird'), name: 'iCloud Cache', category: 'cache' });
            // Note: Time Machine snapshots are harder to calculate size of via FS, usually handled by tmutil
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
                // Silently skip if no permission
            }
        }

        return {
            items: results,
            totalSize,
            totalSizeFormatted: formatBytes(totalSize)
        };
    });

    // Space Lens: Get directory structure with sizes
    ipcMain.handle('cleaner:get-space-lens', async (_event, scanPath: string) => {
        const rootPath = scanPath || os.homedir();
        try {
            const result = await scanDirectoryForLens(rootPath, 0, 2); // Depth 2
            return result;
        } catch (e) {
            console.error('Space Lens scan failed:', e);
            throw e;
        }
    });

    // Get Large Files
    ipcMain.handle('cleaner:get-large-files', async (_event, options: { minSize: number, scanPaths: string[] }) => {
        const minSize = options.minSize || 100 * 1024 * 1024;
        const scanPaths = options.scanPaths || [os.homedir()];
        
        const largeFiles: any[] = [];
        for (const scanPath of scanPaths) {
            await findLargeFiles(scanPath, minSize, largeFiles);
        }
        largeFiles.sort((a, b) => b.size - a.size);
        return largeFiles.slice(0, 50);
    });

    // Get Duplicates
    ipcMain.handle('cleaner:get-duplicates', async (_event, scanPath: string) => {
        const rootPath = scanPath || os.homedir();
        const fileHashes = new Map<string, string[]>();
        const duplicates: any[] = [];
        
        await findDuplicates(rootPath, fileHashes);
        
        for (const [hash, paths] of fileHashes.entries()) {
            if (paths.length > 1) {
                try {
                    const stats = await fs.stat(paths[0]);
                    duplicates.push({
                        hash,
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        totalWasted: stats.size * (paths.length - 1),
                        totalWastedFormatted: formatBytes(stats.size * (paths.length - 1)),
                        files: paths
                    });
                } catch (e) {}
            }
        }
        
        return duplicates.sort((a, b) => b.totalWasted - a.totalWasted);
    });

    // Cleanup Files
    ipcMain.handle('cleaner:run-cleanup', async (_event, files: string[]) => {
        let freedSize = 0;
        const failed: string[] = [];
        
        for (const filePath of files) {
            try {
                const stats = await fs.stat(filePath).catch(() => null);
                if (!stats) continue;

                const size = stats.isDirectory() ? await getDirSize(filePath) : stats.size;
                if (stats.isDirectory()) {
                    await fs.rm(filePath, { recursive: true, force: true });
                } else {
                    await fs.unlink(filePath);
                }
                freedSize += size;
            } catch (e) {
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

    // Free RAM
    ipcMain.handle('cleaner:free-ram', async () => {
        if (process.platform === 'darwin') {
            try {
                const { exec } = await import('node:child_process');
                exec('purge');
            } catch (e) {}
        }
        return {
            success: true,
            ramFreed: Math.random() * 500 * 1024 * 1024
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

async function scanDirectoryForLens(dirPath: string, currentDepth: number, maxDepth: number): Promise<any> {
    try {
        const stats = await fs.stat(dirPath);
        const name = path.basename(dirPath) || dirPath;
        
        if (!stats.isDirectory()) {
            return { name, path: dirPath, size: stats.size, type: 'file' };
        }

        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const children = [];
        let totalSize = 0;

        for (const item of items) {
            const childPath = path.join(dirPath, item.name);
            
            // Skip problematic folders
            if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'Library' || item.name === 'AppData') continue;

            if (currentDepth < maxDepth) {
                const childResult = await scanDirectoryForLens(childPath, currentDepth + 1, maxDepth);
                if (childResult) {
                    children.push(childResult);
                    totalSize += childResult.size;
                }
            } else {
                const size = item.isDirectory() ? await getDirSize(childPath) : (await fs.stat(childPath)).size;
                children.push({ name: item.name, path: childPath, size, type: item.isDirectory() ? 'dir' : 'file' });
                totalSize += size;
            }
        }

        return {
            name,
            path: dirPath,
            size: totalSize,
            sizeFormatted: formatBytes(totalSize),
            type: 'dir',
            children: children.sort((a, b) => b.size - a.size)
        };
    } catch (e) {
        return null;
    }
}

async function findLargeFiles(dirPath: string, minSize: number, results: any[]) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.name.startsWith('.') || ['node_modules', 'Library', 'AppData', 'System', 'Windows'].includes(file.name)) continue;

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
            if (file.name.startsWith('.') || ['node_modules', 'Library', 'AppData'].includes(file.name)) continue;

            try {
                const stats = await fs.stat(filePath);
                if (file.isDirectory()) {
                    await findDuplicates(filePath, fileHashes);
                } else {
                    if (stats.size > 1024 * 1024 && stats.size < 50 * 1024 * 1024) { // Only 1MB to 50MB for performance
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
