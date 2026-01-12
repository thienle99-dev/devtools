import { ipcMain, BrowserWindow, shell } from 'electron';
import { downloadManager } from './download-manager';
import type { DownloadSettings } from '../../src/types/network/download';

export function setupDownloadManagerHandlers(win: BrowserWindow) {
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

    ipcMain.handle('download:create', async (_event, { url, filename }: { url: string, filename?: string }) => {
        const task = await downloadManager.createDownload(url, filename);
        return task;
    });

    ipcMain.handle('download:start', async (_event, taskId: string) => {
        downloadManager.startDownload(taskId, (progress) => {
            win.webContents.send(`download:progress:${taskId}`, progress);
            win.webContents.send('download:any-progress', progress);
        });
        return { success: true };
    });

    ipcMain.handle('download:pause', (_event, taskId: string) => {
        downloadManager.pauseDownload(taskId);
        return { success: true };
    });

    ipcMain.handle('download:resume', (_event, taskId: string) => {
        downloadManager.resumeDownload(taskId, (progress) => {
            win.webContents.send(`download:progress:${taskId}`, progress);
            win.webContents.send('download:any-progress', progress);
        });
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
}
