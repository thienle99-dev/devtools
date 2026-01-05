import { ipcMain, desktopCapturer, screen, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';

export function setupScreenshotHandlers(win: BrowserWindow) {
    // Get available capture sources (screens and windows)
    ipcMain.handle('screenshot:get-sources', async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['window', 'screen'],
                thumbnailSize: { width: 300, height: 200 }
            });

            return sources.map(source => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail.toDataURL(),
                type: source.id.startsWith('screen') ? 'screen' : 'window'
            }));
        } catch (error) {
            console.error('Failed to get sources:', error);
            return [];
        }
    });

    // Capture full screen
    ipcMain.handle('screenshot:capture-screen', async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: screen.getPrimaryDisplay().size
            });

            if (sources.length === 0) {
                throw new Error('No screens available');
            }

            const primaryScreen = sources[0];
            const image = primaryScreen.thumbnail;

            return {
                dataUrl: image.toDataURL(),
                width: image.getSize().width,
                height: image.getSize().height
            };
        } catch (error) {
            console.error('Failed to capture screen:', error);
            throw error;
        }
    });

    // Capture specific window
    ipcMain.handle('screenshot:capture-window', async (_event, sourceId: string) => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['window'],
                thumbnailSize: { width: 1920, height: 1080 }
            });

            const source = sources.find(s => s.id === sourceId);
            if (!source) {
                throw new Error('Window not found');
            }

            const image = source.thumbnail;

            return {
                dataUrl: image.toDataURL(),
                width: image.getSize().width,
                height: image.getSize().height
            };
        } catch (error) {
            console.error('Failed to capture window:', error);
            throw error;
        }
    });

    // Capture area (captures full screen, user crops in UI)
    ipcMain.handle('screenshot:capture-area', async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: screen.getPrimaryDisplay().size
            });

            if (sources.length === 0) {
                throw new Error('No screens available');
            }

            const primaryScreen = sources[0];
            const image = primaryScreen.thumbnail;

            return {
                dataUrl: image.toDataURL(),
                width: image.getSize().width,
                height: image.getSize().height
            };
        } catch (error) {
            console.error('Failed to capture area:', error);
            throw error;
        }
    });

    // Save screenshot to file
    ipcMain.handle('screenshot:save-file', async (_event, dataUrl: string, options: { filename?: string; format?: string }) => {
        try {
            const { filename, format = 'png' } = options;

            // Show save dialog
            const result = await dialog.showSaveDialog(win, {
                defaultPath: filename || `screenshot-${Date.now()}.${format}`,
                filters: [
                    { name: 'PNG Image', extensions: ['png'] },
                    { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
                    { name: 'WebP Image', extensions: ['webp'] }
                ]
            });

            if (result.canceled || !result.filePath) {
                return { success: false, canceled: true };
            }

            // Convert data URL to buffer
            const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Save file
            await fs.writeFile(result.filePath, buffer);

            return { success: true, filePath: result.filePath };
        } catch (error) {
            console.error('Failed to save screenshot:', error);
            return { success: false, error: (error as Error).message };
        }
    });
}
