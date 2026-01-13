import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, clipboard, Notification, dialog, desktopCapturer, protocol } from 'electron'
import { join } from 'node:path'
import path from 'node:path';
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import os from 'node:os'
import Store from 'electron-store'
import { pluginManager } from './plugin-manager'
import { setupScreenshotHandlers } from './screenshot'

const execAsync = promisify(exec)

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

  // ========== Permissions IPC Handlers ==========

  // Check all permissions
  ipcMain.handle('permissions:check-all', async () => {
    const platform = process.platform;
    const results: Record<string, any> = {};

    if (platform === 'darwin') {
      // macOS permissions
      results.accessibility = await checkAccessibilityPermission();
      results.fullDiskAccess = await checkFullDiskAccessPermission();
      results.screenRecording = await checkScreenRecordingPermission();
    } else if (platform === 'win32') {
      // Windows permissions
      results.fileAccess = await checkFileAccessPermission();
      results.registryAccess = await checkRegistryAccessPermission();
    }

    // Common permissions
    results.clipboard = await checkClipboardPermission();
    results.launchAtLogin = await checkLaunchAtLoginPermission();

    return results;
  });

  // Check Accessibility (macOS)
  ipcMain.handle('permissions:check-accessibility', async () => {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable', message: 'Only available on macOS' };
    }
    return await checkAccessibilityPermission();
  });

  // Check Full Disk Access (macOS)
  ipcMain.handle('permissions:check-full-disk-access', async () => {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable', message: 'Only available on macOS' };
    }
    return await checkFullDiskAccessPermission();
  });

  // Check Screen Recording (macOS)
  ipcMain.handle('permissions:check-screen-recording', async () => {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable', message: 'Only available on macOS' };
    }
    return await checkScreenRecordingPermission();
  });

  // Test Clipboard
  ipcMain.handle('permissions:test-clipboard', async () => {
    return await testClipboardPermission();
  });

  // Test File Access
  ipcMain.handle('permissions:test-file-access', async () => {
    return await testFileAccessPermission();
  });

  // Open System Preferences/Settings
  ipcMain.handle('permissions:open-system-preferences', async (_event, permissionType?: string) => {
    return await openSystemPreferences(permissionType);
  });

  // ========== Permission Check Functions ==========

  async function checkAccessibilityPermission(): Promise<{ status: string; message?: string }> {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable' };
    }

    try {
      // Try to test by attempting to register a global shortcut
      try {
        const testShortcut = 'CommandOrControl+Shift+TestPermission';
        const registered = globalShortcut.register(testShortcut, () => { });
        if (registered) {
          globalShortcut.unregister(testShortcut);
          return { status: 'granted' };
        }
      } catch (e) {
        // If registration fails, likely no permission
      }

      // Alternative: Check if we can access accessibility features
      // This is a heuristic - if global shortcuts work, accessibility is likely granted
      const existingShortcuts = globalShortcut.isRegistered('CommandOrControl+Shift+D');
      if (existingShortcuts) {
        return { status: 'granted' };
      }

      return { status: 'not-determined', message: 'Unable to determine status. Try testing.' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function checkFullDiskAccessPermission(): Promise<{ status: string; message?: string }> {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable' };
    }

    try {
      // Test by trying to access a protected directory
      const protectedPaths = [
        '/Library/Application Support',
        '/System/Library',
        '/private/var/db'
      ];

      for (const testPath of protectedPaths) {
        try {
          await fs.access(testPath);
          // If we can access, likely have permission
          return { status: 'granted' };
        } catch (e) {
          // Continue to next path
        }
      }

      // If we can read home directory without issues, might be granted
      const homeDir = os.homedir();
      try {
        await fs.readdir(homeDir);
        return { status: 'granted', message: 'Basic file access available' };
      } catch (e) {
        return { status: 'denied', message: 'Cannot access protected directories' };
      }
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function checkScreenRecordingPermission(): Promise<{ status: string; message?: string }> {
    if (process.platform !== 'darwin') {
      return { status: 'not-applicable' };
    }

    try {
      // Test by trying to use desktopCapturer (Electron's way)
      try {
        // Use desktopCapturer to check screen recording permission
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        if (sources && sources.length > 0) {
          return { status: 'granted' };
        }
      } catch (e) {
        // If getSources fails, likely no permission
      }

      return { status: 'not-determined', message: 'Unable to determine. Try testing screenshot feature.' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function checkClipboardPermission(): Promise<{ status: string; message?: string }> {
    try {
      // Test read and write
      const originalText = clipboard.readText();
      clipboard.writeText('__PERMISSION_TEST__');
      const written = clipboard.readText();
      clipboard.writeText(originalText); // Restore

      if (written === '__PERMISSION_TEST__') {
        return { status: 'granted' };
      }
      return { status: 'denied', message: 'Clipboard access failed' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function checkLaunchAtLoginPermission(): Promise<{ status: string; message?: string }> {
    try {
      const loginItemSettings = app.getLoginItemSettings();
      // This doesn't check permission, just if it's enabled
      // Permission is usually granted automatically, but may fail if not code-signed
      return {
        status: loginItemSettings.openAtLogin ? 'granted' : 'not-determined',
        message: loginItemSettings.openAtLogin ? 'Launch at login is enabled' : 'Launch at login is not enabled'
      };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function checkFileAccessPermission(): Promise<{ status: string; message?: string }> {
    if (process.platform !== 'win32') {
      return { status: 'not-applicable' };
    }

    try {
      // Test by trying to read/write a temp file
      const testPath = join(os.tmpdir(), `permission-test-${Date.now()}.txt`);
      const testContent = 'permission test';

      await fs.writeFile(testPath, testContent);
      const readContent = await fs.readFile(testPath, 'utf-8');
      await fs.unlink(testPath);

      if (readContent === testContent) {
        return { status: 'granted' };
      }
      return { status: 'denied', message: 'File access test failed' };
    } catch (error) {
      return { status: 'denied', message: (error as Error).message };
    }
  }

  async function checkRegistryAccessPermission(): Promise<{ status: string; message?: string }> {
    if (process.platform !== 'win32') {
      return { status: 'not-applicable' };
    }

    try {
      // Test by trying to read a registry key (read-only, safe)
      const { stdout } = await execAsync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion" /v ProgramFilesDir 2>&1');
      if (stdout && !stdout.includes('ERROR')) {
        return { status: 'granted' };
      }
      return { status: 'denied', message: 'Registry access test failed' };
    } catch (error) {
      return { status: 'denied', message: (error as Error).message };
    }
  }

  async function testClipboardPermission(): Promise<{ status: string; message?: string }> {
    try {
      const originalText = clipboard.readText();
      const testText = `Permission test ${Date.now()}`;

      clipboard.writeText(testText);
      const readText = clipboard.readText();
      clipboard.writeText(originalText); // Restore

      if (readText === testText) {
        return { status: 'granted', message: 'Clipboard read/write test passed' };
      }
      return { status: 'denied', message: 'Clipboard test failed' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  async function testFileAccessPermission(): Promise<{ status: string; message?: string }> {
    try {
      const testDir = os.tmpdir();
      const testPath = join(testDir, `permission-test-${Date.now()}.txt`);
      const testContent = `Test ${Date.now()}`;

      // Test write
      await fs.writeFile(testPath, testContent);

      // Test read
      const readContent = await fs.readFile(testPath, 'utf-8');

      // Test delete
      await fs.unlink(testPath);

      if (readContent === testContent) {
        return { status: 'granted', message: 'File access test passed' };
      }
      return { status: 'denied', message: 'File access test failed' };
    } catch (error) {
      return { status: 'denied', message: (error as Error).message };
    }
  }

  async function openSystemPreferences(permissionType?: string): Promise<{ success: boolean; message?: string }> {
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        // macOS - Open System Preferences to specific pane
        let command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy"';

        if (permissionType === 'accessibility') {
          command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"';
        } else if (permissionType === 'full-disk-access') {
          command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"';
        } else if (permissionType === 'screen-recording') {
          command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"';
        }

        await execAsync(command);
        return { success: true, message: 'Opened System Preferences' };
      } else if (platform === 'win32') {
        // Windows - Open Settings to Privacy section
        await execAsync('start ms-settings:privacy');
        return { success: true, message: 'Opened Windows Settings' };
      }

      return { success: false, message: 'Unsupported platform' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }



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
      console.log('[LocalMedia] Request:', request.url);

      const url = new URL(request.url);
      // On Windows, the path might start with / followed by drive letter (e.g. /C:/)
      // On Mac/Unix, it starts with / followed by Users
      let decodedPath = decodeURIComponent(url.pathname);

      console.log('[LocalMedia] Initial Path:', decodedPath);

      // Fix Windows path issues
      if (process.platform === 'win32') {
        if (/^\/[a-zA-Z]:/.test(decodedPath)) {
          decodedPath = decodedPath.slice(1);
        } else if (/^[a-zA-Z]\//.test(decodedPath)) {
          decodedPath = decodedPath.charAt(0) + ':' + decodedPath.slice(1);
        }
      } else {
        // Unix: Ensure it's not double-slashed at start
        decodedPath = decodedPath.replace(/^\/+/, '/');
      }

      console.log('[LocalMedia] Final Path:', decodedPath);

      // Verify file exists and get stats
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

      // Handle Range Header
      const range = request.headers.get('Range');
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        console.log(`[LocalMedia] Streaming Range: ${start}-${end}/${fileSize}`);

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
        console.log(`[LocalMedia] Streaming Full: ${fileSize}`);
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
      // Basic erro handling
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

