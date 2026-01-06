import { ipcMain, desktopCapturer, screen, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Capture area with selection overlay
    ipcMain.handle('screenshot:capture-area', async () => {
        try {
            // First, capture the full screen
            console.log('Capturing screen for area selection...');
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: screen.getPrimaryDisplay().size
            });

            console.log(`Found ${sources.length} sources.`);

            if (sources.length === 0) {
                console.error('No screens available for capture.');
                throw new Error('No screens available');
            }

            const primaryScreen = sources[0];
            const fullScreenImage = primaryScreen.thumbnail;
            const display = screen.getPrimaryDisplay();

            console.log(`Captured thumbnail size: ${fullScreenImage.getSize().width}x${fullScreenImage.getSize().height}`);
            console.log(`Display size: ${display.size.width}x${display.size.height} (Scale: ${display.scaleFactor})`);

            // Wait for user selection - setup handlers FIRST
            return new Promise((resolve, reject) => {
                let selectionWindow: BrowserWindow | null = null;

                const cleanup = () => {
                    if (selectionWindow && !selectionWindow.isDestroyed()) {
                        selectionWindow.close();
                    }
                    ipcMain.removeHandler('screenshot:area-selected');
                    ipcMain.removeHandler('screenshot:area-cancelled');
                };

                // Register IPC handlers BEFORE creating window
                ipcMain.handle('screenshot:area-selected', async (_event, bounds: { x: number; y: number; width: number; height: number }) => {
                    cleanup();

                    // Crop the full screen image to the selected area
                    const scaleFactor = display.scaleFactor;
                    const croppedImage = fullScreenImage.crop({
                        x: Math.round(bounds.x * scaleFactor),
                        y: Math.round(bounds.y * scaleFactor),
                        width: Math.round(bounds.width * scaleFactor),
                        height: Math.round(bounds.height * scaleFactor)
                    });

                    resolve({
                        dataUrl: croppedImage.toDataURL(),
                        width: croppedImage.getSize().width,
                        height: croppedImage.getSize().height
                    });
                });

                ipcMain.handle('screenshot:area-cancelled', () => {
                    cleanup();
                    reject(new Error('Area selection cancelled'));
                });

                // NOW create the window
                selectionWindow = new BrowserWindow({
                    fullscreen: true,
                    frame: false,
                    transparent: true,
                    hasShadow: false, // Ensure no shadow
                    backgroundColor: '#00000000', // Explicitly transparent
                    alwaysOnTop: true,
                    skipTaskbar: true,
                    resizable: false,
                    enableLargerThanScreen: true, // Allow covering multiple screens
                    movable: false,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        preload: path.join(__dirname, '../preload/preload.js'),
                    }
                });

                // Load selection overlay HTML with lighter background
                const selectionHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                width: 100vw;
                                height: 100vh;
                                cursor: crosshair;
                                background: rgba(0, 0, 0, 0.1);
                                overflow: hidden;
                            }
                            #selection {
                                position: absolute;
                                border: 2px solid #3b82f6;
                                background: rgba(59, 130, 246, 0.1);
                                display: none;
                                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
                            }
                            #instructions {
                                position: absolute;
                                top: 20px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: rgba(0, 0, 0, 0.8);
                                color: white;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-family: system-ui, -apple-system, sans-serif;
                                font-size: 14px;
                                z-index: 1000;
                            }
                        </style>
                    </head>
                    <body>
                        <div id="instructions">Drag to select area • ESC or Right-click to cancel</div>
                        <div id="selection"></div>
                        <script>
                            const selection = document.getElementById('selection');
                            let startX, startY, isDrawing = false;

                            document.addEventListener('mousedown', (e) => {
                                if (e.button !== 0) return; // Only left click
                                isDrawing = true;
                                startX = e.clientX;
                                startY = e.clientY;
                                selection.style.left = startX + 'px';
                                selection.style.top = startY + 'px';
                                selection.style.width = '0px';
                                selection.style.height = '0px';
                                selection.style.display = 'block';
                            });

                            document.addEventListener('mousemove', (e) => {
                                if (!isDrawing) return;
                                const currentX = e.clientX;
                                const currentY = e.clientY;
                                const width = Math.abs(currentX - startX);
                                const height = Math.abs(currentY - startY);
                                const left = Math.min(startX, currentX);
                                const top = Math.min(startY, currentY);
                                
                                selection.style.left = left + 'px';
                                selection.style.top = top + 'px';
                                selection.style.width = width + 'px';
                                selection.style.height = height + 'px';
                            });

                            document.addEventListener('mouseup', (e) => {
                                if (!isDrawing) return;
                                isDrawing = false;
                                
                                const currentX = e.clientX;
                                const currentY = e.clientY;
                                const width = Math.abs(currentX - startX);
                                const height = Math.abs(currentY - startY);
                                const left = Math.min(startX, currentX);
                                const top = Math.min(startY, currentY);
                                
                                // Only capture if selection is large enough
                                if (width > 10 && height > 10) {
                                    window.electronAPI.sendSelection({ x: left, y: top, width, height });
                                } else {
                                    window.electronAPI.cancelSelection();
                                }
                            });

                            // ESC to cancel
                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Escape') {
                                    window.electronAPI.cancelSelection();
                                }
                            });

                            // Right-click to cancel
                            document.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                window.electronAPI.cancelSelection();
                            });
                        </script>
                    </body>
                    </html>
                `;

                selectionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(selectionHTML)}`);

                // Auto-cancel after 60 seconds
                setTimeout(() => {
                    if (selectionWindow && !selectionWindow.isDestroyed()) {
                        cleanup();
                        reject(new Error('Area selection timeout'));
                    }
                }, 60000);
            });
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
