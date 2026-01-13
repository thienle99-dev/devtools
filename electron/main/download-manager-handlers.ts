import { ipcMain, BrowserWindow, shell } from 'electron';
import { downloadManager } from './download-manager';
import type { DownloadSettings } from '../../src/types/network/download';

export function setupDownloadManagerHandlers() {
    // Listen for progress updates and broadcast to all windows
    downloadManager.on('progress', (progress) => {
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send(`download:progress:${progress.taskId}`, progress);
                win.webContents.send('download:any-progress', progress);
            }
        });
    });

    downloadManager.on('task-started', (task) => {
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('download:task-started', task);
            }
        });
    });

    downloadManager.on('task-completed', (task) => {
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('download:task-completed', task);
            }
        });
    });

    ipcMain.handle('download:get-history', () => {
        return downloadManager.getHistory();
    });

    ipcMain.handle('download:get-settings', () => {
        return downloadManager.getSettings();
    });

    ipcMain.handle('download:save-settings', (_event, settings: Partial<DownloadSettings>) => {
        downloadManager.saveSettings(settings);
        return { success: true };
    });

    ipcMain.handle('download:create', async (_event, options: any) => {
        const task = await downloadManager.createDownload(options.url, options.filename, options);
        return task;
    });

    ipcMain.handle('download:verify-checksum', async (_event, taskId: string) => {
        return await downloadManager.verifyChecksum(taskId);
    });

    ipcMain.handle('download:start', async (_event, taskId: string) => {
        downloadManager.startDownload(taskId);
        return { success: true };
    });

    ipcMain.handle('download:pause', (_event, taskId: string) => {
        downloadManager.pauseDownload(taskId);
        return { success: true };
    });

    ipcMain.handle('download:resume', (_event, taskId: string) => {
        downloadManager.resumeDownload(taskId);
        return { success: true };
    });

    ipcMain.handle('download:cancel', (_event, taskId: string) => {
        downloadManager.cancelDownload(taskId);
        return { success: true };
    });

    ipcMain.handle('download:open-folder', (_event, filePath: string) => {
        shell.showItemInFolder(filePath);
        return { success: true };
    });

    ipcMain.handle('download:clear-history', () => {
        downloadManager.clearHistory();
        return { success: true };
    });

    ipcMain.handle('download:reorder', (_event, { startIndex, endIndex }: { startIndex: number, endIndex: number }) => {
        downloadManager.reorderHistory(startIndex, endIndex);
        return { success: true };
    });

    ipcMain.handle('download:save-history', (_event, history: any[]) => {
        downloadManager.saveHistory(history);
        return { success: true };
    });
}
