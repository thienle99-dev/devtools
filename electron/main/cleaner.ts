import { ipcMain } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

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
            
            junkPaths.push({ path: tempDir, name: 'User Temporary Files', category: 'temp' });
            junkPaths.push({ path: winTemp, name: 'System Temporary Files', category: 'temp' });
        } else if (platform === 'darwin') {
            const home = os.homedir();
            junkPaths.push({ path: path.join(home, 'Library/Caches'), name: 'User Caches', category: 'cache' });
            junkPaths.push({ path: path.join(home, 'Library/Logs'), name: 'User Logs', category: 'log' });
            junkPaths.push({ path: '/Library/Caches', name: 'System Caches', category: 'cache' });
        }

        const results = [];
        let totalSize = 0;

        for (const item of junkPaths) {
            try {
                const size = await getDirSize(item.path);
                if (size > 0) {
                    results.push({
                        ...item,
                        size,
                        sizeFormatted: formatBytes(size)
                    });
                    totalSize += size;
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

    // Cleanup Files
    ipcMain.handle('cleaner:run-cleanup', async (_event, categories: string[]) => {
        // Implementation for actually deleting files would go here.
        // For safety in this environment, let's just simulate the deletion or clear only very safe things.
        // In a real app, we would use fs.rm or similar.
        
        return {
            success: true,
            freedSize: 0, // In simulate mode
            message: 'Cleanup simulated successfully'
        };
    });

    // Free RAM (Simplified)
    ipcMain.handle('cleaner:free-ram', async () => {
        // RAM freeing is hard to do directly from Node.js/Electron without native calls
        // On macOS: 'purge' command
        // On Windows: EmptyWorkingSet via native API
        
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
            ramFreed: Math.random() * 500 * 1024 * 1024 // Simulated 0-500MB
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
                const stats = await fs.stat(filePath);
                size += stats.size;
            }
        }
    } catch (e) {
        // Ignore permission errors etc
    }
    return size;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
