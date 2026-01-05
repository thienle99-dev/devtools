import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, clipboard, Notification } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { setupCleanerHandlers } from './cleaner'
import si from 'systeminformation'
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
  tray.setToolTip('DevTools 2')

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

// Keep track of tools
let recentTools: Array<{ id: string; name: string }> = [];
let clipboardItems: Array<{ id: string; content: string; timestamp: number }> = [];
let clipboardMonitoringEnabled = true;

// Stats monitor data for tray
let statsMenuData: {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  network: { rx: number; tx: number };
} | null = null;

// Health monitor data for System Cleaner tray widget
let healthMenuData: {
  cpu: number;
  ram: { used: number; total: number; percentage: number };
  disk: { free: number; total: number; percentage: number } | null;
  battery: { level: number; charging: boolean } | null;
  alerts: Array<{ type: string; severity: string; message: string }>;
} | null = null;

// Health monitoring interval
let healthMonitoringInterval: NodeJS.Timeout | null = null;

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
    { type: 'separator' }
  ];

  // === CLIPBOARD MANAGER ===
  if (clipboardItems.length > 0) {
    const displayCount = Math.min(clipboardItems.length, 9);
    template.push({
      label: '📋 Clipboard Manager',
      submenu: [
        {
          label: '▸ Open Full Manager',
          click: () => {
            win?.show();
            win?.webContents.send('navigate-to', 'clipboard-manager');
          }
        },
        { type: 'separator' },
        {
          label: `● Recent Clipboard (${displayCount})`,
          enabled: false
        },
        ...clipboardItems.slice(0, 9).map((item, index) => {
          // Ensure content is a string and handle edge cases
          const content = String(item.content || '');
          const preview = content.length > 75
            ? content.substring(0, 75) + '...'
            : content;
          const cleanPreview = preview.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

          return {
            label: `  ${index + 1}. ${cleanPreview || '(Empty)'}`,
            click: () => {
              if (content) {
                clipboard.writeText(content);
                new Notification({
                  title: '✓ Copied from History',
                  body: cleanPreview || 'Copied to clipboard',
                  silent: true
                }).show();
              }
            }
          };
        }),
        { type: 'separator' },
        {
          label: clipboardMonitoringEnabled ? '▶ Monitoring Active' : '⏸ Monitoring Paused',
          type: 'checkbox',
          checked: clipboardMonitoringEnabled,
          click: () => {
            clipboardMonitoringEnabled = !clipboardMonitoringEnabled;
            win?.webContents.send('toggle-clipboard-monitoring', clipboardMonitoringEnabled);
            updateTrayMenu();
            new Notification({
              title: clipboardMonitoringEnabled ? '✓ Monitoring Enabled' : '⏸ Monitoring Paused',
              body: clipboardMonitoringEnabled
                ? 'Clipboard will be monitored automatically'
                : 'Clipboard monitoring paused',
              silent: true
            }).show();
          }
        },
        { type: 'separator' },
        {
          label: '✕ Clear All History',
          click: () => {
            win?.webContents.send('clipboard-clear-all');
          }
        }
      ]
    });
    template.push({ type: 'separator' });
  } else {
    template.push({
      label: '📋 Clipboard Manager (Empty)',
      click: () => {
        win?.show();
        win?.webContents.send('navigate-to', 'clipboard-manager');
      }
    });
    template.push({ type: 'separator' });
  }

  // === QUICK ACTIONS ===
  template.push({
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
  });
  template.push({ type: 'separator' });

  // === STATS MONITOR ===
  if (statsMenuData) {
    template.push({
      label: '📊 Stats Monitor',
      enabled: false,
    });
    template.push({
      label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
      enabled: false,
    });
    template.push({
      label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
      enabled: false,
    });
    template.push({
      label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
      enabled: false,
    });
    template.push({ type: 'separator' });
    template.push({
      label: 'Open Stats Monitor',
      click: () => {
        win?.show();
        win?.webContents.send('navigate-to', '/stats-monitor');
      },
    });
    template.push({ type: 'separator' });
  }

  // === SYSTEM CLEANER HEALTH WIDGET ===
  if (healthMenuData) {
    const alertCount = healthMenuData.alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'warning').length;
    const healthLabel = alertCount > 0 ? `🛡️ System Health (${alertCount} alerts)` : '🛡️ System Health';
    
    const healthSubmenu: Electron.MenuItemConstructorOptions[] = [
      {
        label: '📊 Health Metrics',
        enabled: false,
      },
      {
        label: `CPU: ${healthMenuData.cpu.toFixed(1)}%`,
        enabled: false,
      },
      {
        label: `RAM: ${healthMenuData.ram.percentage.toFixed(1)}% (${formatBytes(healthMenuData.ram.used)} / ${formatBytes(healthMenuData.ram.total)})`,
        enabled: false,
      },
    ];
    
    if (healthMenuData.disk) {
      healthSubmenu.push({
        label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
        enabled: false,
      });
    }
    
    if (healthMenuData.battery) {
      healthSubmenu.push({
        label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? '(Charging)' : ''}`,
        enabled: false,
      });
    }
    
    healthSubmenu.push({ type: 'separator' });
    
    if (healthMenuData.alerts.length > 0) {
      healthSubmenu.push({
        label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
        enabled: false,
      });
      
      healthMenuData.alerts.slice(0, 5).forEach((alert: any) => {
        healthSubmenu.push({
          label: `${alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'} ${alert.message.substring(0, 50)}${alert.message.length > 50 ? '...' : ''}`,
          enabled: false,
        });
      });
      
      healthSubmenu.push({ type: 'separator' });
    }
    
    healthSubmenu.push({
      label: '▸ Open Health Monitor',
      click: () => {
        win?.show();
        win?.webContents.send('navigate-to', '/system-cleaner');
        // Navigate to health tab
        setTimeout(() => {
          win?.webContents.send('system-cleaner:switch-tab', 'health');
        }, 500);
      },
    });
    
    healthSubmenu.push({
      label: '⚡ Quick Actions',
      submenu: [
        {
          label: 'Free Up RAM',
          click: async () => {
            try {
              const result = await win?.webContents.executeJavaScript(`
                (async () => {
                  const res = await window.cleanerAPI?.freeRam();
                  return res;
                })()
              `);
              if (result?.success) {
                new Notification({
                  title: '✓ RAM Optimized',
                  body: `Freed ${formatBytes(result.ramFreed || 0)}`,
                  silent: true
                }).show();
              }
            } catch (e) {
              new Notification({
                title: '✗ Failed',
                body: 'Could not free RAM',
                silent: true
              }).show();
            }
          },
        },
        {
          label: 'Flush DNS Cache',
          click: async () => {
            try {
              const task = {
                id: 'dns-flush',
                name: 'Flush DNS Cache',
                category: 'dns-flush'
              };
              const result = await win?.webContents.executeJavaScript(`
                (async () => {
                  const res = await window.cleanerAPI?.runMaintenance(${JSON.stringify(task)});
                  return res;
                })()
              `);
              if (result?.success) {
                new Notification({
                  title: '✓ DNS Cache Flushed',
                  body: 'DNS cache cleared successfully',
                  silent: true
                }).show();
              }
            } catch (e) {
              new Notification({
                title: '✗ Failed',
                body: 'Could not flush DNS cache',
                silent: true
              }).show();
            }
          },
        },
        {
          label: 'Open System Cleaner',
          click: () => {
            win?.show();
            win?.webContents.send('navigate-to', '/system-cleaner');
          },
        },
      ],
    });
    
    template.push({
      label: healthLabel,
      submenu: healthSubmenu,
    });
    template.push({ type: 'separator' });
  }

  // === RECENT TOOLS ===
  if (recentTools.length > 0) {
    template.push({
      label: '🕐 Recent Tools',
      submenu: recentTools.map(tool => ({
        label: `  • ${tool.name}`,
        click: () => {
          win?.show();
          win?.webContents.send('navigate-to', tool.id);
        }
      }))
    });
    template.push({ type: 'separator' });
  }

  // === SETTINGS & QUIT ===
  template.push({
    label: '⚙️ Settings',
    click: () => {
      win?.show();
      win?.webContents.send('navigate-to', 'settings');
    }
  });

  template.push({ type: 'separator' });

  template.push({
    label: '✕ Quit DevTools',
    accelerator: 'CmdOrCtrl+Q',
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
    minWidth: 1200, // Increased from 900
    minHeight: 700, // Increased from 600
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

  win.on('maximize', () => {
    win?.webContents.send('window-maximized', true);
  });
  win.on('unmaximize', () => {
    win?.webContents.send('window-maximized', false);
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

  // Tray IPC
  ipcMain.on('tray-update-menu', (_event, items) => {
    recentTools = items || [];
    updateTrayMenu();
  });

  // Clipboard IPC - Ensure items are sorted and synced
  ipcMain.on('tray-update-clipboard', (_event, items) => {
    // Ensure items are sorted by timestamp (newest first) for consistency
    const sortedItems = (items || []).sort((a: any, b: any) => b.timestamp - a.timestamp);
    clipboardItems = sortedItems;
    updateTrayMenu(); // This will rebuild the menu with updated items
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

  // Sync clipboard monitoring state from renderer
  ipcMain.on('sync-clipboard-monitoring', (_event, enabled: boolean) => {
    clipboardMonitoringEnabled = enabled;
    updateTrayMenu();
  });

  // Stats monitor tray update
  ipcMain.on('stats-update-tray', (_event, data) => {
    statsMenuData = data;
    updateTrayMenu();
  });

  // Health monitor tray updates
  ipcMain.on('health-update-tray', (_event, data) => {
    healthMenuData = data;
    updateTrayMenu();
  });

  // Start health monitoring
  ipcMain.handle('health-start-monitoring', async () => {
    if (healthMonitoringInterval) {
      clearInterval(healthMonitoringInterval);
    }
    
    const updateHealth = async () => {
      try {
        const mem = await si.mem();
        const load = await si.currentLoad();
        const disk = await si.fsSize();
        const battery = await si.battery().catch(() => null);
        
        const alerts: any[] = [];
        const rootDisk = disk.find(d => d.mount === '/' || d.mount === 'C:') || disk[0];
        
        if (rootDisk) {
          const freePercent = (rootDisk.available / rootDisk.size) * 100;
          if (freePercent < 10) {
            alerts.push({
              type: 'low_space',
              severity: 'critical',
              message: `Low disk space: ${formatBytes(rootDisk.available)} free`
            });
          } else if (freePercent < 20) {
            alerts.push({
              type: 'low_space',
              severity: 'warning',
              message: `Disk space getting low: ${formatBytes(rootDisk.available)} free`
            });
          }
        }
        
        if (load.currentLoad > 90) {
          alerts.push({
            type: 'high_cpu',
            severity: 'warning',
            message: `High CPU usage: ${load.currentLoad.toFixed(1)}%`
          });
        }
        
        const memPercent = (mem.used / mem.total) * 100;
        if (memPercent > 90) {
          alerts.push({
            type: 'memory_pressure',
            severity: 'warning',
            message: `High memory usage: ${memPercent.toFixed(1)}%`
          });
        }
        
        healthMenuData = {
          cpu: load.currentLoad,
          ram: {
            used: mem.used,
            total: mem.total,
            percentage: memPercent
          },
          disk: rootDisk ? {
            free: rootDisk.available,
            total: rootDisk.size,
            percentage: ((rootDisk.size - rootDisk.available) / rootDisk.size) * 100
          } : null,
          battery: battery ? {
            level: battery.percent,
            charging: battery.isCharging || false
          } : null,
          alerts
        };
        
        updateTrayMenu();
        
        // Send notification for critical alerts
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0 && win) {
          criticalAlerts.forEach(alert => {
            new Notification({
              title: '⚠️ System Alert',
              body: alert.message,
              silent: false
            }).show();
          });
        }
      } catch (e) {
        console.error('Health monitoring error:', e);
      }
    };
    
    // Update immediately and then every 5 seconds
    updateHealth();
    healthMonitoringInterval = setInterval(updateHealth, 5000);
    
    return { success: true };
  });

  // Stop health monitoring
  ipcMain.handle('health-stop-monitoring', () => {
    if (healthMonitoringInterval) {
      clearInterval(healthMonitoringInterval);
      healthMonitoringInterval = null;
    }
    healthMenuData = null;
    updateTrayMenu();
    return { success: true };
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
  // Start health monitoring for tray widget
  setTimeout(() => {
    if (win) {
      win.webContents.executeJavaScript(`
        (async () => {
          if (window.cleanerAPI?.startHealthMonitoring) {
            await window.cleanerAPI.startHealthMonitoring();
          }
        })()
      `).catch(() => {});
    }
  }, 2000); // Wait for renderer to be ready
  
  // Register Global Shortcuts
  try {
    // Toggle window shortcut
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      toggleWindow();
    });

    // Clipboard manager shortcut (Maccy style)
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      win?.show();
      win?.webContents.send('open-clipboard-manager');
    });
  } catch (e) {
    console.error('Failed to register global shortcut', e);
  }

  // Check launch at login status on startup
  const launchAtLogin = store.get('launchAtLogin') as boolean;
  setLoginItemSettingsSafely(launchAtLogin === true);

  // System Stats IPC
  ipcMain.handle('get-cpu-stats', async () => {
    const [cpu, currentLoad] = await Promise.all([
      si.cpu(),
      si.currentLoad()
    ]);
    return {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      speed: cpu.speed,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      load: currentLoad
    };
  });

  ipcMain.handle('get-memory-stats', async () => {
    return await si.mem();
  });

  ipcMain.handle('get-network-stats', async () => {
    const [stats, interfaces] = await Promise.all([
      si.networkStats(),
      si.networkInterfaces()
    ]);
    return { stats, interfaces };
  });

  ipcMain.handle('get-disk-stats', async () => {
    try {
      const [fsSize, ioStatsRaw] = await Promise.all([
        si.fsSize(),
        si.disksIO()
      ]);
      
      // si.disksIO() returns an array, we need to aggregate or use the first disk
      let ioStats = null;
      if (ioStatsRaw && Array.isArray(ioStatsRaw) && ioStatsRaw.length > 0) {
        // Use the first disk's IO stats, or aggregate all
        const firstDisk = ioStatsRaw[0];
        ioStats = {
          rIO: firstDisk.rIO || 0,
          wIO: firstDisk.wIO || 0,
          tIO: firstDisk.tIO || 0,
          rIO_sec: firstDisk.rIO_sec || 0,
          wIO_sec: firstDisk.wIO_sec || 0,
          tIO_sec: firstDisk.tIO_sec || 0,
        };
      } else if (ioStatsRaw && typeof ioStatsRaw === 'object' && !Array.isArray(ioStatsRaw)) {
        // If it's an object (single disk)
        ioStats = {
          rIO: ioStatsRaw.rIO || 0,
          wIO: ioStatsRaw.wIO || 0,
          tIO: ioStatsRaw.tIO || 0,
          rIO_sec: ioStatsRaw.rIO_sec || 0,
          wIO_sec: ioStatsRaw.wIO_sec || 0,
          tIO_sec: ioStatsRaw.tIO_sec || 0,
        };
      }
      
      return { fsSize, ioStats };
    } catch (error) {
      console.error('Error fetching disk stats:', error);
      // Return fsSize even if ioStats fails
      const fsSize = await si.fsSize().catch(() => []);
      return { fsSize, ioStats: null };
    }
  });

  ipcMain.handle('get-gpu-stats', async () => {
    return await si.graphics();
  });

  ipcMain.handle('get-battery-stats', async () => {
    try {
      const battery = await si.battery();
      
      // Tính toán power consumption và charging power
      let powerConsumptionRate: number | undefined;
      let chargingPower: number | undefined;
      
      // Nếu systeminformation có sẵn powerConsumptionRate
      if ('powerConsumptionRate' in battery && battery.powerConsumptionRate && typeof battery.powerConsumptionRate === 'number') {
        powerConsumptionRate = battery.powerConsumptionRate;
      }
      
      // Nếu có voltage và currentCapacity, có thể ước tính
      if (battery.voltage && battery.voltage > 0) {
        // Ước tính power consumption dựa trên voltage và trạng thái
        // Power (mW) = Voltage (V) * Current (mA)
        // Nếu đang discharge, ước tính current từ capacity và time remaining
        if (!battery.isCharging && battery.timeRemaining > 0 && battery.currentCapacity > 0) {
          // Ước tính: current = (currentCapacity / timeRemaining) * 60 (mA)
          const estimatedCurrent = (battery.currentCapacity / battery.timeRemaining) * 60;
          powerConsumptionRate = battery.voltage * estimatedCurrent;
        }
        
        // Nếu đang charge, ước tính charging power
        if (battery.isCharging && battery.voltage > 0) {
          // Ước tính charging current (thường 1-3A cho laptop)
          const estimatedChargingCurrent = 2000; // 2A = 2000mA (ước tính)
          chargingPower = battery.voltage * estimatedChargingCurrent;
        }
      }
      
      return {
        ...battery,
        powerConsumptionRate,
        chargingPower,
      };
    } catch (error) {
      console.error('Error fetching battery stats:', error);
      return null;
    }
  });

  ipcMain.handle('get-sensor-stats', async () => {
    return await si.cpuTemperature();
  });

  // Bluetooth stats
  ipcMain.handle('get-bluetooth-stats', async () => {
    try {
      const bluetooth = await si.bluetoothDevices();
      return {
        enabled: bluetooth.length > 0 || await checkBluetoothEnabled(),
        devices: bluetooth.map((device: any) => ({
          name: device.name || 'Unknown',
          mac: device.mac || device.address || '',
          type: device.type || device.deviceClass || 'unknown',
          battery: device.battery || device.batteryLevel || undefined,
          connected: device.connected !== false,
          rssi: device.rssi || device.signalStrength || undefined,
          manufacturer: device.manufacturer || device.vendor || undefined,
        }))
      };
    } catch (error) {
      console.error('Error fetching bluetooth stats:', error);
      return { enabled: false, devices: [] };
    }
  });

  // Time zones stats
  ipcMain.handle('get-timezones-stats', async () => {
    try {
      const time = await si.time();
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Default time zones (có thể config từ preferences)
      const defaultZones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Asia/Shanghai',
      ];
      
      const zones = defaultZones.map(tz => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        
        const offset = getTimezoneOffset(tz);
        const cityName = tz.split('/').pop()?.replace('_', ' ') || tz;
        
        return {
          timezone: tz,
          city: cityName,
          time: formatter.format(now),
          date: dateFormatter.format(now),
          offset,
        };
      });
      
      return {
        local: {
          timezone: localTz,
          city: localTz.split('/').pop()?.replace('_', ' ') || 'Local',
          time: time.current,
          date: time.uptime ? new Date().toLocaleDateString() : '',
          offset: getTimezoneOffset(localTz),
        },
        zones,
      };
    } catch (error) {
      console.error('Error fetching timezones stats:', error);
      return null;
    }
  });

  setupCleanerHandlers();
  createTray();
  createWindow();
})

// Helper functions for bluetooth and timezones
async function checkBluetoothEnabled(): Promise<boolean> {
  try {
    // Platform-specific check
    if (process.platform === 'darwin') {
      // macOS: Check via system_profiler
      const { execSync } = require('child_process');
      const result = execSync('system_profiler SPBluetoothDataType').toString();
      return result.includes('Bluetooth: On');
    }
    // Windows/Linux: Assume enabled if devices found
    return true;
  } catch {
    return false;
  }
}

function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  // Get UTC time in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // Get time string in target timezone
  const tzString = now.toLocaleString('en-US', { 
    timeZone: timezone, 
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Parse the timezone time
  const tzDate = new Date(tzString);
  const tzTime = tzDate.getTime();
  
  // Calculate offset in hours
  const offset = (tzTime - utcTime) / (1000 * 60 * 60);
  return offset;
}

// Helper functions for formatting
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) {
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  }
  if (bytesPerSec > 1024) {
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  }
  return `${bytesPerSec.toFixed(0)} B/s`;
}
