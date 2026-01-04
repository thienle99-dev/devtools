import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import Store from 'electron-store'

const store = new Store()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

let win: BrowserWindow | null
let tray: Tray | null = null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || '', 'tray-icon.png')

function createTray() {
  if (tray) return

  const icon = nativeImage.createFromPath(TRAY_ICON_PATH)
  // Resize if needed, 16x16 or 22x22 usually best for tray
  // icon.resize({ width: 16, height: 16 })

  tray = new Tray(icon.resize({ width: 22, height: 22 }))
  tray.setToolTip('DevTools 2')

  updateTrayMenu()

  tray.on('double-click', () => {
    if (win) {
      if (win.isVisible()) win.hide()
      else win.show()
    }
  })
}

// Keep track of tools
let recentTools: Array<{ id: string; name: string }> = [];

function updateTrayMenu() {
  if (!tray) return

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: win?.isVisible() ? 'Hide Window' : 'Show Window',
      click: () => {
        if (win) {
          if (win.isVisible()) win.hide()
          else win.show()
          updateTrayMenu()
        }
      }
    },
    { type: 'separator' }
  ];

  if (recentTools.length > 0) {
    template.push({ label: 'Recent Tools', enabled: false });
    recentTools.forEach(tool => {
      template.push({
        label: tool.name,
        click: () => {
          win?.show();
          win?.webContents.send('navigate-to', tool.id);
        }
      });
    });
    template.push({ type: 'separator' });
  }

  template.push({
    label: 'Quit',
    click: () => {
      (app as any).isQuitting = true;
      app.quit()
    }
  });

  const contextMenu = Menu.buildFromTemplate(template)
  tray.setContextMenu(contextMenu)
}

function createWindow() {
  const windowBounds = store.get('windowBounds') as { width: number; height: number; x?: number; y?: number } || {
    width: 1200,
    height: 800,
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
    minWidth: 900,
    minHeight: 600,
    show: !startMinimized, // Respect startMinimized
    // Frameless and transparent for custom UI
    frame: false,
    transparent: true,
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


  // Handle Store IPC
  ipcMain.handle('store-get', (_event, key) => store.get(key))
  ipcMain.handle('store-set', (_event, key, value) => store.set(key, value))
  ipcMain.handle('store-delete', (_event, key) => store.delete(key))

  // Tray IPC
  ipcMain.on('tray-update-menu', (_event, items) => {
    recentTools = items || [];
    updateTrayMenu();
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
});

app.whenReady().then(() => {
  createTray();
  createWindow();
})
