import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    const wrappedListener = (event: any, ...args: any[]) => listener(event, ...args)
    ipcRenderer.on(channel, wrappedListener)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, wrappedListener)
    }
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other weird methods here
  process: {
    platform: process.platform,
  },
  tray: {
    updateMenu: (items: any[]) => ipcRenderer.send('tray-update-menu', items),
    updateClipboard: (items: any[]) => ipcRenderer.send('tray-update-clipboard', items),
    syncMonitoring: (enabled: boolean) => ipcRenderer.send('sync-clipboard-monitoring', enabled),
  },
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard-read-text'),
    readImage: () => ipcRenderer.invoke('clipboard-read-image'),
  },
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  }
})

contextBridge.exposeInMainWorld('statsAPI', {
  getCPUStats: () => ipcRenderer.invoke('get-cpu-stats'),
  getMemoryStats: () => ipcRenderer.invoke('get-memory-stats'),
  getNetworkStats: () => ipcRenderer.invoke('get-network-stats'),
  getDiskStats: () => ipcRenderer.invoke('get-disk-stats'),
  getGPUStats: () => ipcRenderer.invoke('get-gpu-stats'),
  getBatteryStats: () => ipcRenderer.invoke('get-battery-stats'),
  getSensorStats: () => ipcRenderer.invoke('get-sensor-stats'),
  getBluetoothStats: () => ipcRenderer.invoke('get-bluetooth-stats'),
  getTimeZonesStats: () => ipcRenderer.invoke('get-timezones-stats'),
})

contextBridge.exposeInMainWorld('cleanerAPI', {
  getPlatform: () => ipcRenderer.invoke('cleaner:get-platform'),
  scanJunk: () => ipcRenderer.invoke('cleaner:scan-junk'),
  getLargeFiles: (options: any) => ipcRenderer.invoke('cleaner:get-large-files', options),
  getDuplicates: (scanPath: string) => ipcRenderer.invoke('cleaner:get-duplicates', scanPath),
  getSpaceLens: (scanPath: string) => ipcRenderer.invoke('cleaner:get-space-lens', scanPath),
  getPerformanceData: () => ipcRenderer.invoke('cleaner:get-performance-data'),
  getStartupItems: () => ipcRenderer.invoke('cleaner:get-startup-items'),
  toggleStartupItem: (item: any) => ipcRenderer.invoke('cleaner:toggle-startup-item', item),
  killProcess: (pid: number) => ipcRenderer.invoke('cleaner:kill-process', pid),
  getInstalledApps: () => ipcRenderer.invoke('cleaner:get-installed-apps'),
  uninstallApp: (app: any) => ipcRenderer.invoke('cleaner:uninstall-app', app),
  runCleanup: (files: string[]) => ipcRenderer.invoke('cleaner:run-cleanup', files),
  freeRam: () => ipcRenderer.invoke('cleaner:free-ram'),
  scanPrivacy: () => ipcRenderer.invoke('cleaner:scan-privacy'),
  cleanPrivacy: (options: any) => ipcRenderer.invoke('cleaner:clean-privacy', options),
  onSpaceLensProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('cleaner:space-lens-progress', listener);
    return () => ipcRenderer.removeListener('cleaner:space-lens-progress', listener);
  },
})
