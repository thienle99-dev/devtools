import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, clipboard, Notification, dialog, protocol } from 'electron'
import path, { dirname, join } from 'node:path'

import Store from 'electron-store';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import * as os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { videoMerger } from './video-merger';
import { audioManager } from './audio-manager';
import { audioExtractor } from './audio-extractor';
import { videoTrimmer } from './video-trimmer';
import { videoEffects } from './video-effects';
import { videoCompressor } from './video-compressor';
import { youtubeDownloader } from './youtube-downloader';
import { tiktokDownloader } from './tiktok-downloader';
import { universalDownloader } from './universal-downloader';
import { pluginManager } from './plugin-manager';
import { setupScreenshotHandlers } from './screenshot';
import { setupCleanerHandlers } from './cleaner';
import { setupDownloadManagerHandlers } from './download-manager-handlers';
import { setupCryptoHandlers } from './crypto';
import { setupSystemHandlers } from './system';
import { setupZipHandlers } from './zip';

const store = new Store()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

// Register protocol for local media files
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-media', privileges: { bypassCSP: true, stream: true, secure: true, supportFetchAPI: true } }
])

let win: BrowserWindow | null
let tray: Tray | null = null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || '', 'tray-icon.png')

/**
 * Safely set login item settings with error handling
 * On macOS, this may fail if app is not code-signed or lacks permissions
 */
function setLoginItemSettingsSafely(openAtLogin: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin,
      openAsHidden: true // Always launch hidden to tray if auto-launching
    });
    return { success: true };
  } catch (error) {
    // Handle permission errors gracefully (common on macOS in development)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('Failed to set login item settings:', errorMessage);

    // In development mode, this is expected if app is not code-signed
    if (!app.isPackaged) {
      console.info('Note: Launch at login requires code signing in production builds');
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

function createTray() {
  if (tray) return

  const icon = nativeImage.createFromPath(TRAY_ICON_PATH)
  // Resize if needed, 16x16 or 22x22 usually best for tray
  // icon.resize({ width: 16, height: 16 })

  tray = new Tray(icon.resize({ width: 22, height: 22 }))
  tray.setToolTip('DevTools')

  updateTrayMenu()

  tray.on('double-click', () => {
    toggleWindow();
  })
}

function toggleWindow() {
  if (win) {
    if (win.isVisible()) win.hide()
    else win.show()
    updateTrayMenu()
  }
}



// Helper functions for formatting


function updateTrayMenu() {
  if (!tray) return

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: win?.isVisible() ? '▼ Hide Window' : '▲ Show Window',
      click: () => {
        if (win) {
          if (win.isVisible()) win.hide()
          else win.show()
          updateTrayMenu()
        }
      }
    },
    { type: 'separator' },
    {
      label: '⚡ Quick Actions',
      submenu: [
        {
          label: '◆ Generate UUID',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => {
            const uuid = randomUUID();
            clipboard.writeText(uuid);
            new Notification({
              title: '✓ UUID Generated',
              body: `Copied: ${uuid.substring(0, 20)}...`,
              silent: true
            }).show();
          }
        },
        {
          label: '◇ Format JSON',
          accelerator: 'CmdOrCtrl+Shift+J',
          click: () => {
            try {
              const text = clipboard.readText();
              const json = JSON.parse(text);
              const formatted = JSON.stringify(json, null, 2);
              clipboard.writeText(formatted);
              new Notification({
                title: '✓ JSON Formatted',
                body: 'Formatted JSON copied to clipboard',
                silent: true
              }).show();
            } catch (e) {
              new Notification({
                title: '✗ Format Failed',
                body: 'Clipboard does not contain valid JSON',
                silent: true
              }).show();
            }
          }
        },
        {
          label: '# Hash Text (SHA-256)',
          click: () => {
            try {
              const text = clipboard.readText();
              if (!text) throw new Error('Empty clipboard');
              const hash = createHash('sha256').update(text).digest('hex');
              clipboard.writeText(hash);
              new Notification({
                title: '✓ Hash Generated',
                body: `SHA-256: ${hash.substring(0, 20)}...`,
                silent: true
              }).show();
            } catch (e) {
              new Notification({
                title: '✗ Hash Failed',
                body: 'Could not hash clipboard content',
                silent: true
              }).show();
            }
          }
        },
        { type: 'separator' },
        {
          label: '↑ Base64 Encode',
          click: () => {
            try {
              const text = clipboard.readText();
              if (!text) throw new Error('Empty clipboard');
              const encoded = Buffer.from(text).toString('base64');
              clipboard.writeText(encoded);
              new Notification({
                title: '✓ Base64 Encoded',
                body: 'Encoded text copied to clipboard',
                silent: true
              }).show();
            } catch (e) {
              new Notification({
                title: '✗ Encode Failed',
                body: 'Could not encode clipboard content',
                silent: true
              }).show();
            }
          }
        },
        {
          label: '↓ Base64 Decode',
          click: () => {
            try {
              const text = clipboard.readText();
              if (!text) throw new Error('Empty clipboard');
              const decoded = Buffer.from(text, 'base64').toString('utf-8');
              clipboard.writeText(decoded);
              new Notification({
                title: '✓ Base64 Decoded',
                body: 'Decoded text copied to clipboard',
                silent: true
              }).show();
            } catch (e) {
              new Notification({
                title: '✗ Decode Failed',
                body: 'Invalid Base64 in clipboard',
                silent: true
              }).show();
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '⚙️ Settings',
      click: () => {
        win?.show();
        win?.webContents.send('navigate-to', 'settings');
      }
    },
    { type: 'separator' },
    {
      label: '✕ Quit DevTools',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        (app as any).isQuitting = true;
        app.quit()
      }
    }
  ];

  const contextMenu = Menu.buildFromTemplate(template)
  tray.setContextMenu(contextMenu)
}

function createWindow() {
  const windowBounds = store.get('windowBounds') as { width: number; height: number; x?: number; y?: number } || {
    width: 1600, // Increased from 1200 for better clipboard manager experience
    height: 900, // Increased from 800
  };

  const startMinimized = store.get('startMinimized') as boolean || false;

  win = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
    ...windowBounds,
    minWidth: 800, // Reduced for better tablet support
    minHeight: 600,
    resizable: true, // Explicitly enable resizing for frameless window
    show: !startMinimized, // Respect startMinimized
    // Frameless for custom UI
    frame: false,
    transparent: process.platform === 'darwin', // Transparency often breaks Windows resizing
    backgroundColor: '#050505', // Prevent white flash on load
    titleBarStyle: 'hidden',
    vibrancy: 'sidebar', // for macOS
    trafficLightPosition: { x: 15, y: 15 }, // macOS specific
  })


  // Save window bounds on change
  const saveBounds = () => {
    store.set('windowBounds', win?.getBounds())
  }
  win.on('resize', saveBounds)
  win.on('move', saveBounds)

  win.on('close', (event) => {
    const minimizeToTray = store.get('minimizeToTray') as boolean ?? true;

    if (!(app as any).isQuitting && minimizeToTray) {
      event.preventDefault();
      win?.hide();
      updateTrayMenu();
    }
    return false;
  });

  win.on('show', updateTrayMenu);
  win.on('hide', updateTrayMenu);

  win.on('maximize', () => {
    win?.webContents.send('window-maximized', true);
  });
  win.on('unmaximize', () => {
    win?.webContents.send('window-maximized', false);
  });


  // Get Home Directory
  ipcMain.handle('get-home-dir', () => {
    return os.homedir();
  });

  // Select Folder Dialog
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: 'Select Folder to Scan'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  // Handle Store IPC
  ipcMain.handle('store-get', (_event, key) => store.get(key))
  ipcMain.handle('store-set', (_event, key, value) => {
    store.set(key, value)

    if (key === 'launchAtLogin') {
      const result = setLoginItemSettingsSafely(value === true);
      if (!result.success && win) {
        // Optionally notify renderer process about the error
        win.webContents.send('login-item-error', {
          message: 'Unable to set launch at login. This may require additional permissions.',
          error: result.error
        });
      }
    }
  })
  ipcMain.handle('store-delete', (_event, key) => store.delete(key))

  // Setup screenshot handlers
  setupScreenshotHandlers(win);

  // Video Compressor Handlers
  ipcMain.handle('video-compressor:get-info', async (_event, filePath) => {
    return await videoCompressor.getVideoInfo(filePath);
  });

  ipcMain.handle('video-compressor:compress', async (_event, options) => {
    return await videoCompressor.compress(options, (progress) => {
      win?.webContents.send('video-compressor:progress', progress);
    });
  });

  ipcMain.handle('video-compressor:cancel', async (_event, id) => {
    return videoCompressor.cancel(id);
  });

  // Window settings IPC handlers
  ipcMain.on('window-set-opacity', (_event, opacity: number) => {
    if (win) {
      win.setOpacity(Math.max(0.5, Math.min(1.0, opacity)));
    }
  });

  ipcMain.on('window-set-always-on-top', (_event, alwaysOnTop: boolean) => {
    if (win) {
      win.setAlwaysOnTop(alwaysOnTop);
    }
  });



  // Clipboard read IPC - Use Electron's clipboard API (no permission needed)
  ipcMain.handle('clipboard-read-text', () => {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  });

  // Clipboard read images IPC
  ipcMain.handle('clipboard-read-image', async () => {
    try {
      const image = clipboard.readImage();
      if (image.isEmpty()) {
        return null;
      }
      // Convert to base64
      return image.toDataURL();
    } catch (error) {
      console.error('Failed to read clipboard image:', error);
      return null;
    }
  });



  // Window Controls IPC
  ipcMain.on('window-minimize', () => {
    win?.minimize();
  });
  ipcMain.on('window-maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    win?.close();
  });
  ipcMain.on('window-open-devtools', () => {
    win?.webContents.openDevTools();
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(join(process.env.DIST || '', 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else if (win) {
    win.show();
  }
})

app.on('before-quit', () => {
  (app as any).isQuitting = true;



  // Clear clipboard on quit if setting is enabled
  if (win) {
    win.webContents.send('check-clear-clipboard-on-quit');
  }
});

app.whenReady().then(() => {


  // Register Global Shortcuts
  try {
    // Toggle window shortcut
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      toggleWindow();
    });


  } catch (e) {
    console.error('Failed to register global shortcut', e);
  }

  // Check launch at login status on startup
  const launchAtLogin = store.get('launchAtLogin') as boolean;
  setLoginItemSettingsSafely(launchAtLogin === true);

  setupSystemHandlers();
  setupCryptoHandlers();
  setupZipHandlers();
  setupCleanerHandlers();
  setupDownloadManagerHandlers();





  // YouTube Downloader IPC Handlers
  ipcMain.handle('youtube:getInfo', async (_event, url: string) => {
    try {
      return await youtubeDownloader.getVideoInfo(url);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('youtube:getPlaylistInfo', async (_event, url: string) => {
    try {
      return await youtubeDownloader.getPlaylistInfo(url);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('youtube:download', async (event, options) => {
    try {
      const filepath = await youtubeDownloader.downloadVideo(
        options,
        (progress) => {
          // Send progress to renderer
          event.sender.send('youtube:progress', progress);
        }
      );
      return { success: true, filepath };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Download failed' };
    }
  });

  ipcMain.handle('youtube:cancel', async () => {
    youtubeDownloader.cancelDownload();
    return { success: true };
  });

  ipcMain.handle('youtube:openFile', async (_event, filePath: string) => {
    const { shell } = await import('electron');
    return shell.openPath(filePath);
  });

  ipcMain.handle('youtube:showInFolder', async (_event, filePath: string) => {
    const { shell } = await import('electron');
    shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('youtube:chooseFolder', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose Download Location',
      buttonLabel: 'Select Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('youtube:getHistory', () => {
    return youtubeDownloader.getHistory();
  });

  ipcMain.handle('youtube:clearHistory', () => {
    youtubeDownloader.clearHistory();
    return true;
  });

  ipcMain.handle('youtube:removeFromHistory', (_event, id: string) => {
    youtubeDownloader.removeFromHistory(id);
    return true;
  });

  ipcMain.handle('youtube:getSettings', () => {
    return youtubeDownloader.getSettings();
  });

  ipcMain.handle('youtube:saveSettings', (_event, settings) => {
    return youtubeDownloader.saveSettings(settings);
  });

  ipcMain.handle('youtube:getCapabilities', () => {
    return youtubeDownloader.getCapabilities();
  });

  ipcMain.handle('youtube:installAria2', async () => {
    return await youtubeDownloader.installAria2();
  });

  // TikTok Downloader IPC Handlers
  ipcMain.handle('tiktok:get-info', async (_, url: string) => {
    return await tiktokDownloader.getVideoInfo(url);
  });

  ipcMain.handle('tiktok:download', async (_, options) => {
    return new Promise((resolve, reject) => {
      tiktokDownloader.downloadVideo(options, (progress) => {
        win?.webContents.send('tiktok:progress', progress);
      })
        .then(resolve)
        .catch(reject);
    });
  });

  ipcMain.handle('tiktok:cancel', async (_, id?: string) => {
    tiktokDownloader.cancelDownload(id);
  });

  ipcMain.handle('tiktok:get-history', async () => {
    return tiktokDownloader.getHistory();
  });

  ipcMain.handle('tiktok:clear-history', async () => {
    tiktokDownloader.clearHistory();
  });

  ipcMain.handle('tiktok:remove-from-history', async (_, id: string) => {
    tiktokDownloader.removeFromHistory(id);
  });

  ipcMain.handle('tiktok:get-settings', async () => {
    return tiktokDownloader.getSettings();
  });

  ipcMain.handle('tiktok:save-settings', async (_, settings) => {
    return tiktokDownloader.saveSettings(settings);
  });

  ipcMain.handle('tiktok:choose-folder', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Universal Downloader IPC Handlers
  ipcMain.handle('universal:get-info', async (_, url: string) => {
    return await universalDownloader.getMediaInfo(url);
  });

  ipcMain.handle('universal:download', async (_, options) => {
    return new Promise((resolve, reject) => {
      universalDownloader.downloadMedia(options, (progress) => {
        win?.webContents.send('universal:progress', progress);
      })
        .then(resolve)
        .catch(reject);
    });
  });

  ipcMain.handle('universal:cancel', async (_, id?: string) => {
    universalDownloader.cancelDownload(id);
  });

  ipcMain.handle('universal:get-history', async () => {
    return universalDownloader.getHistory();
  });

  ipcMain.handle('universal:clear-history', async () => {
    universalDownloader.clearHistory();
  });

  ipcMain.handle('universal:remove-from-history', async (_, id: string) => {
    universalDownloader.removeFromHistory(id);
  });

  ipcMain.handle('universal:get-settings', async () => {
    return universalDownloader.getSettings();
  });

  ipcMain.handle('universal:save-settings', async (_, settings) => {
    return universalDownloader.saveSettings(settings);
  });

  ipcMain.handle('universal:choose-folder', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('universal:check-disk-space', async (_, path?: string) => {
    return await universalDownloader.checkDiskSpace(path);
  });

  ipcMain.handle('universal:get-queue', async () => {
    return universalDownloader.getQueue();
  });

  ipcMain.handle('universal:get-pending-count', async () => {
    return universalDownloader.getPendingDownloadsCount();
  });

  ipcMain.handle('universal:resume-pending', async () => {
    universalDownloader.resumePendingDownloads();
    return { success: true };
  });

  ipcMain.handle('universal:clear-pending', async () => {
    universalDownloader.clearPendingDownloads();
    return { success: true };
  });

  // Error Management Handlers
  ipcMain.handle('universal:get-error-log', async (_, limit?: number) => {
    return universalDownloader.getErrorLog(limit);
  });

  ipcMain.handle('universal:export-error-log', async (_, format: 'json' | 'csv' | 'txt') => {
    return await universalDownloader.exportErrorLog(format);
  });

  ipcMain.handle('universal:get-error-stats', async () => {
    return universalDownloader.getErrorStats();
  });

  ipcMain.handle('universal:clear-error-log', async (_, type: 'all' | 'resolved') => {
    universalDownloader.clearErrorLog(type);
    return { success: true };
  });

  ipcMain.handle('universal:pause', async (_, id: string) => {
    return await universalDownloader.pauseDownload(id);
  });

  ipcMain.handle('universal:resume', async (_, id: string) => {
    return await universalDownloader.resumeDownload(id);
  });

  ipcMain.handle('universal:reorder-queue', async (_, id: string, newIndex: number) => {
    return universalDownloader.reorderQueue(id, newIndex);
  });

  ipcMain.handle('universal:retry', async (_, id: string) => {
    return await universalDownloader.retryDownload(id);
  });




  ipcMain.handle('universal:open-file', async (_, path: string) => {
    const { shell } = await import('electron');
    // Check if file exists first to avoid cryptic errors
    try {
      await fs.access(path);
      shell.openPath(path);
    } catch {
      // If file doesn't exist, try opening folder? No, just fail silently or return error
      console.error('File not found:', path);
    }
  });

  ipcMain.handle('universal:show-in-folder', async (_, path: string) => {
    const { shell } = await import('electron');
    shell.showItemInFolder(path);
  });

  // Audio Extractor IPC Handlers
  ipcMain.handle('audio:get-info', async (_, filePath: string) => {
    return await audioExtractor.getAudioInfo(filePath);
  });

  ipcMain.handle('audio:extract', async (_, options) => {
    return new Promise((resolve, reject) => {
      audioExtractor.extractAudio(options, (progress) => {
        win?.webContents.send('audio:progress', progress);
      })
        .then(resolve)
        .catch(reject);
    });
  });

  ipcMain.handle('audio:cancel', async (_, id: string) => {
    audioExtractor.cancelExtraction(id);
  });

  ipcMain.handle('audio:cancel-all', async () => {
    audioExtractor.cancelAll();
  });

  ipcMain.handle('audio:choose-input-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv'] },
        { name: 'Audio Files', extensions: ['mp3', 'aac', 'flac', 'wav', 'ogg', 'm4a', 'wma'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('audio:choose-input-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv'] },
        { name: 'Audio Files', extensions: ['mp3', 'aac', 'flac', 'wav', 'ogg', 'm4a', 'wma'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('audio:choose-output-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Video Merger IPC Handlers
  ipcMain.handle('video-merger:get-info', async (_, filePath: string) => {
    return await videoMerger.getVideoInfo(filePath);
  });

  ipcMain.handle('video-merger:generate-thumbnail', async (_, filePath: string, time: number) => {
    return await videoMerger.generateThumbnail(filePath, time);
  });

  ipcMain.handle('video-compressor:generate-thumbnail', async (_, filePath: string) => {
    return await videoCompressor.generateThumbnail(filePath);
  });

  ipcMain.handle('video-filmstrip:generate', async (_, filePath: string, duration: number, count?: number) => {
    return await videoMerger.generateFilmstrip(filePath, duration, count);
  });

  ipcMain.handle('video-merger:extract-waveform', async (_, filePath: string) => {
    return await videoMerger.extractWaveform(filePath);
  });

  ipcMain.handle('video-merger:merge', async (_, options) => {
    return new Promise((resolve, reject) => {
      videoMerger.mergeVideos(options, (progress) => {
        win?.webContents.send('video-merger:progress', progress);
      })
        .then(resolve)
        .catch(reject);
    });
  });

  ipcMain.handle('video-merger:create-from-images', async (_, options) => {
    return new Promise((resolve, reject) => {
      videoMerger.createVideoFromImages(options, (progress) => {
        win?.webContents.send('video-merger:progress', progress);
      })
        .then(resolve)
        .catch(reject);
    });
  });

  ipcMain.handle('video-merger:cancel', async (_, id: string) => {
    videoMerger.cancelMerge(id);
  });

  // Audio Manager IPC Handlers
  ipcMain.handle('audio-manager:get-info', async (_, filePath: string) => {
    return await audioManager.getAudioInfo(filePath);
  });

  ipcMain.handle('audio-manager:apply', async (event, options: any) => {
    return await audioManager.applyAudioChanges(options, (progress) => {
      event.sender.send('audio-manager:progress', progress);
    });
  });

  ipcMain.handle('audio-manager:cancel', async (_, id: string) => {
    audioManager.cancel(id);
  });

  // Video Trimmer IPC Handlers
  ipcMain.handle('video-trimmer:process', async (event, options: any) => {
    return await videoTrimmer.process(options, (progress) => {
      event.sender.send('video-trimmer:progress', progress);
    });
  });

  // Video Effects IPC Handlers
  ipcMain.handle('video-effects:apply', async (_event, options) => {
    return await videoEffects.applyEffects(options, (progress) => {
      win?.webContents.send('video-effects:progress', progress);
    });
  });

  ipcMain.on('video-effects:cancel', (_event, id) => {
    videoEffects.cancelEffects(id);
  });

  ipcMain.handle('video-effects:get-info', async (_event, path) => {
    return await videoMerger.getVideoInfo(path);
  });

  ipcMain.handle('video-trimmer:cancel', async (_, id: string) => {
    videoTrimmer.cancel(id);
  });

  ipcMain.handle('video-merger:choose-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });

  // ============================================================
  // PLUGIN MANAGER IPC HANDLERS
  // ============================================================

  // Initialize plugin manager
  pluginManager.initialize().catch(console.error);

  ipcMain.handle('plugins:get-available', () => {
    return pluginManager.getAvailablePlugins();
  });

  ipcMain.handle('plugins:get-installed', () => {
    return pluginManager.getInstalledPlugins();
  });

  ipcMain.handle('plugins:install', async (event, pluginId) => {
    await pluginManager.installPlugin(pluginId, (progress) => {
      event.sender.send('plugins:progress', progress);
    });
  });

  ipcMain.handle('plugins:uninstall', async (_event, pluginId) => {
    await pluginManager.uninstallPlugin(pluginId);
  });

  ipcMain.handle('plugins:toggle', async (_event, pluginId, active) => {
    await pluginManager.togglePlugin(pluginId, active);
  });

  ipcMain.handle('plugins:update-registry', async () => {
    await pluginManager.updateRegistry(true);
  });

  // Handle local-media protocol
  protocol.handle('local-media', async (request) => {
    try {
      const url = new URL(request.url);
      let decodedPath = decodeURIComponent(url.pathname);

      // Fix Windows path issues
      if (process.platform === 'win32') {
        if (/^\/[a-zA-Z]:/.test(decodedPath)) {
          decodedPath = decodedPath.slice(1);
        } else if (/^[a-zA-Z]\//.test(decodedPath)) {
          decodedPath = decodedPath.charAt(0) + ':' + decodedPath.slice(1);
        }
      } else {
        decodedPath = decodedPath.replace(/^\/+/, '/');
      }

      // Verify file exists
      const stats = await fs.stat(decodedPath);
      const fileSize = stats.size;

      // Determine MIME type
      const ext = path.extname(decodedPath).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (ext === '.mp4') mimeType = 'video/mp4';
      else if (ext === '.webm') mimeType = 'video/webm';
      else if (ext === '.mov') mimeType = 'video/quicktime';
      else if (ext === '.avi') mimeType = 'video/x-msvideo';
      else if (ext === '.mkv') mimeType = 'video/x-matroska';
      else if (ext === '.mp3') mimeType = 'audio/mpeg';
      else if (ext === '.wav') mimeType = 'audio/wav';

      // Smart Preview: Check if transcoding is needed for modern codecs not supported by Chromium (HEVC)
      let useTranscoding = false;
      const unsupportedCodecs = ['hevc', 'hvc1', 'h265', 'dvhe', 'dvh1']; // HEVC variants

      try {
        // Only check for video containers
        if (['.mp4', '.mov', '.mkv', '.webm'].includes(ext)) {
          // This probing adds a small delay (~100ms) but ensures playback works
          const info = await videoCompressor.getVideoInfo(decodedPath);
          if (info.codec && unsupportedCodecs.some(c => info.codec.toLowerCase().includes(c))) {
            useTranscoding = true;
          }
        }
      } catch (e) {
        // Fallback to direct play if probing fails
      }

      if (useTranscoding) {
        console.log(`[LocalMedia] Transcoding ${decodedPath} for preview`);
        const stream = videoCompressor.getPreviewStream(decodedPath);
        const webStream = Readable.toWeb(stream as any);

        return new Response(webStream as any, {
          status: 200,
          headers: {
            'Content-Type': 'video/mp4',
            // Transcoded stream doesn't support range requests easily, so we stream it as a whole
          }
        });
      }

      // Handle Range Header for direct playback
      const range = request.headers.get('Range');
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        const nodeStream = createReadStream(decodedPath, { start, end });
        const webStream = Readable.toWeb(nodeStream as any);

        return new Response(webStream as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': mimeType
          }
        });
      } else {
        const nodeStream = createReadStream(decodedPath);
        const webStream = Readable.toWeb(nodeStream as any);

        return new Response(webStream as any, {
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes'
          }
        });
      }

    } catch (e) {
      console.error('[LocalMedia] Error:', e);
      if ((e as any).code === 'ENOENT') {
        return new Response('File not found', { status: 404 });
      }
      return new Response('Error loading media: ' + (e as any).message, { status: 500 });
    }
  })

  if (process.platform === 'win32') {
    app.setAppUserModelId('com.devtools.app');
  }

  createTray();
  createWindow();
})

// Helper functions for bluetooth and timezones


// Helper functions for formatting

