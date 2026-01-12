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

                // Get display bounds for manual fullscreen
                const { width, height, x, y } = display.bounds;

                // NOW create the window
                selectionWindow = new BrowserWindow({
                    x, y, width, height, // Set bounds manually
                    frame: false,
                    transparent: true,
                    hasShadow: false,
                    backgroundColor: '#00000000',
                    alwaysOnTop: true,
                    skipTaskbar: true,
                    resizable: false,
                    enableLargerThanScreen: true,
                    movable: false,
                    acceptFirstMouse: true, // Handle first click
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        // Use the same preload as the main window
                        preload: path.join(__dirname, 'preload.mjs'),
                    }
                });

                // Ensure window is visible and focused
                selectionWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                selectionWindow.show();
                selectionWindow.focus(); // Crucial for keyboard events

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
                                background: transparent;
                                overflow: hidden;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                user-select: none;
                            }
                            #selection {
                                position: absolute;
                                border: 2px solid #3b82f6;
                                background: rgba(59, 130, 246, 0.05);
                                display: none;
                                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
                                z-index: 100;
                                pointer-events: none;
                            }
                            #toolbar {
                                position: absolute;
                                display: none;
                                background: #1a1b1e;
                                padding: 6px;
                                border-radius: 10px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
                                z-index: 2000;
                                display: flex;
                                gap: 8px;
                                align-items: center;
                                pointer-events: auto;
                                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                            }
                            @keyframes popIn {
                                from { opacity: 0; transform: scale(0.95) translateY(5px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                            .btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 0 16px;
                                height: 36px;
                                border-radius: 8px;
                                border: none;
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.15s ease;
                                color: white;
                            }
                            .btn-cancel {
                                background: rgba(255,255,255,0.08);
                                color: #e5e5e5;
                            }
                            .btn-cancel:hover { background: rgba(255,255,255,0.12); color: white; }
                            .btn-capture {
                                background: #3b82f6;
                                color: white;
                                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                            }
                            .btn-capture:hover { background: #2563eb; transform: translateY(-1px); }
                            .btn-capture:active { transform: translateY(0); }
                            #dimensions {
                                position: absolute;
                                top: -34px;
                                left: 0;
                                background: #3b82f6;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                opacity: 0;
                                transition: opacity 0.2s;
                            }
                            #instructions {
                                position: absolute;
                                top: 40px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: rgba(0, 0, 0, 0.7);
                                backdrop-filter: blur(10px);
                                color: white;
                                padding: 8px 16px;
                                border-radius: 20px;
                                font-size: 13px;
                                font-weight: 500;
                                pointer-events: none;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                border: 1px solid rgba(255,255,255,0.1);
                                opacity: 0.8;
                            }
                            .hidden { display: none !important; }
                        </style>
                    </head>
                    <body>
                        <div id="instructions">Click and drag to capture</div>
                        <div id="selection">
                            <div id="dimensions">0 x 0</div>
                        </div>
                        <div id="toolbar" class="hidden">
                            <button class="btn btn-cancel" id="btn-cancel">Cancel</button>
                            <button class="btn btn-capture" id="btn-capture">Capture</button>
                        </div>
                        <script>
                            const selection = document.getElementById('selection');
                            const toolbar = document.getElementById('toolbar');
                            const dimensions = document.getElementById('dimensions');
                            const btnCancel = document.getElementById('btn-cancel');
                            const btnCapture = document.getElementById('btn-capture');
                            
                            let startX, startY, isDrawing = false;
                            let currentBounds = { x: 0, y: 0, width: 0, height: 0 };
                            
                            document.addEventListener('contextmenu', e => e.preventDefault());

                            function capture() {
                                if (!window.electronAPI) {
                                    alert('Error: Electron API not available. Preload script missed?');
                                    return;
                                }
                                if (currentBounds.width > 0 && currentBounds.height > 0) {
                                    window.electronAPI.sendSelection(currentBounds);
                                }
                            }
                            
                            function cancel() {
                                if (window.electronAPI) {
                                    window.electronAPI.cancelSelection();
                                } else {
                                    // If API is missing, we can't notify main process, but we can try to close window via window.close() if not sandboxed?
                                    // But contextIsolation is on.
                                    alert('Error: Electron API not available. Cannot cancel properly.');
                                }
                            }

                            btnCapture.onclick = capture;
                            btnCancel.onclick = cancel;

                            document.addEventListener('mousedown', (e) => {
                                if (e.target.closest('#toolbar')) return;
                                if (e.button !== 0) {
                                    if (e.button === 2) cancel();
                                    return;
                                }
                                isDrawing = true;
                                startX = e.clientX;
                                startY = e.clientY;
                                toolbar.classList.add('hidden');
                                dimensions.style.opacity = '1';
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
                                dimensions.textContent = Math.round(width) + ' x ' + Math.round(height);
                                currentBounds = { x: left, y: top, width, height };
                            });

                            document.addEventListener('mouseup', (e) => {
                                if (!isDrawing) return;
                                isDrawing = false;
                                if (currentBounds.width > 10 && currentBounds.height > 10) {
                                    toolbar.classList.remove('hidden');
                                    const toolbarHeight = 60;
                                    let top = currentBounds.y + currentBounds.height + 10;
                                    if (top + toolbarHeight > window.innerHeight) top = currentBounds.y - toolbarHeight - 10;
                                    let left = currentBounds.x + (currentBounds.width / 2) - 100;
                                    left = Math.max(10, Math.min(window.innerWidth - 210, left));
                                    toolbar.style.top = top + 'px';
                                    toolbar.style.left = left + 'px';
                                } else {
                                    selection.style.display = 'none';
                                    toolbar.classList.add('hidden');
                                }
                            });

                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Escape') cancel();
                                if (e.key === 'Enter' && !toolbar.classList.contains('hidden')) capture();
                            });
                        </script>
                    </body>
                    </html>
                `;

                selectionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(selectionHTML)}`);

                // Auto-cancel after 2 minutes
                setTimeout(() => {
                    if (selectionWindow && !selectionWindow.isDestroyed()) {
                        cleanup();
                        reject(new Error('Area selection timeout'));
                    }
                }, 120000);
            });
        } catch (error) {
            console.error('Failed to capture area:', error);
            throw error;
        }
    });

    // Capture URL (Full Page)
    ipcMain.handle('screenshot:capture-url', async (_event, url: string) => {
        try {
            console.log('Capturing URL:', url);
            const win = new BrowserWindow({
                width: 1200,
                height: 800,
                show: false,
                webPreferences: {
                    offscreen: false,
                    contextIsolation: true
                }
            });

            await win.loadURL(url);

            // Access CDP
            try {
                const dbg = win.webContents.debugger;
                dbg.attach('1.3');

                // Get layout metrics
                const layout = await dbg.sendCommand('Page.getLayoutMetrics');
                // @ts-ignore
                const contentSize = layout.contentSize || layout.cssContentSize || { width: 1200, height: 800 };
                const width = Math.ceil(contentSize.width);
                const height = Math.ceil(contentSize.height);

                console.log(`Page dimensions: ${width}x${height}`);

                // Emulate device metrics to full height
                await dbg.sendCommand('Emulation.setDeviceMetricsOverride', {
                    width: width,
                    height: height,
                    deviceScaleFactor: 1,
                    mobile: false,
                });

                // Capture
                const result = await dbg.sendCommand('Page.captureScreenshot', {
                    format: 'png',
                    captureBeyondViewport: true
                });

                dbg.detach();
                win.close();

                return {
                    dataUrl: 'data:image/png;base64,' + result.data,
                    width,
                    height
                };

            } catch (cdpError) {
                console.error('CDP Error:', cdpError);
                // Fallback
                const img = await win.webContents.capturePage();
                win.close();
                return {
                    dataUrl: img.toDataURL(),
                    width: img.getSize().width,
                    height: img.getSize().height
                };
            }

        } catch (error) {
            console.error('Failed to capture URL:', error);
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
