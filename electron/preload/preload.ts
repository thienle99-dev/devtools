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
  },
  system: {
    getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
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
  getFolderSize: (folderPath: string) => ipcRenderer.invoke('cleaner:get-folder-size', folderPath),
  clearSizeCache: (folderPath?: string) => ipcRenderer.invoke('cleaner:clear-size-cache', folderPath),
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
  scanBrowserData: () => ipcRenderer.invoke('cleaner:scan-browser-data'),
  cleanBrowserData: (options: any) => ipcRenderer.invoke('cleaner:clean-browser-data', options),
  getWifiNetworks: () => ipcRenderer.invoke('cleaner:get-wifi-networks'),
  removeWifiNetwork: (networkName: string) => ipcRenderer.invoke('cleaner:remove-wifi-network', networkName),
  onSpaceLensProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('cleaner:space-lens-progress', listener);
    return () => ipcRenderer.removeListener('cleaner:space-lens-progress', listener);
  },
  runMaintenance: (task: any) => ipcRenderer.invoke('cleaner:run-maintenance', task),
  getHealthStatus: () => ipcRenderer.invoke('cleaner:get-health-status'),
  checkSafety: (files: string[]) => ipcRenderer.invoke('cleaner:check-safety', files),
  createBackup: (files: string[]) => ipcRenderer.invoke('cleaner:create-backup', files),
  listBackups: () => ipcRenderer.invoke('cleaner:list-backups'),
  getBackupInfo: (backupId: string) => ipcRenderer.invoke('cleaner:get-backup-info', backupId),
  restoreBackup: (backupId: string) => ipcRenderer.invoke('cleaner:restore-backup', backupId),
  deleteBackup: (backupId: string) => ipcRenderer.invoke('cleaner:delete-backup', backupId),
  startHealthMonitoring: () => ipcRenderer.invoke('health-start-monitoring'),
  stopHealthMonitoring: () => ipcRenderer.invoke('health-stop-monitoring'),
  updateHealthTray: (data: any) => ipcRenderer.send('health-update-tray', data),
})

contextBridge.exposeInMainWorld('appManagerAPI', {
  getInstalledApps: () => ipcRenderer.invoke('app-manager:get-installed-apps'),
  getRunningProcesses: () => ipcRenderer.invoke('app-manager:get-running-processes'),
  uninstallApp: (app: any) => ipcRenderer.invoke('app-manager:uninstall-app', app),
  killProcess: (pid: number) => ipcRenderer.invoke('app-manager:kill-process', pid),
})

contextBridge.exposeInMainWorld('screenshotAPI', {
  getSources: () => ipcRenderer.invoke('screenshot:get-sources'),
  captureScreen: () => ipcRenderer.invoke('screenshot:capture-screen'),
  captureWindow: (sourceId: string) => ipcRenderer.invoke('screenshot:capture-window', sourceId),
  captureArea: () => ipcRenderer.invoke('screenshot:capture-area'),
  captureUrl: (url: string) => ipcRenderer.invoke('screenshot:capture-url', url),
  saveFile: (dataUrl: string, options: { filename?: string; format?: string }) =>
    ipcRenderer.invoke('screenshot:save-file', dataUrl, options),
})

contextBridge.exposeInMainWorld('permissionsAPI', {
  checkAll: () => ipcRenderer.invoke('permissions:check-all'),
  checkAccessibility: () => ipcRenderer.invoke('permissions:check-accessibility'),
  checkFullDiskAccess: () => ipcRenderer.invoke('permissions:check-full-disk-access'),
  checkScreenRecording: () => ipcRenderer.invoke('permissions:check-screen-recording'),
  testClipboard: () => ipcRenderer.invoke('permissions:test-clipboard'),
  testFileAccess: () => ipcRenderer.invoke('permissions:test-file-access'),
  openSystemPreferences: (permissionType?: string) => ipcRenderer.invoke('permissions:open-system-preferences', permissionType),
})

// API for screenshot area selection overlay
contextBridge.exposeInMainWorld('electronAPI', {
  sendSelection: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('screenshot:area-selected', bounds),
  cancelSelection: () =>
    ipcRenderer.invoke('screenshot:area-cancelled'),
})

// YouTube Downloader API
contextBridge.exposeInMainWorld('youtubeAPI', {
  getInfo: (url: string) => ipcRenderer.invoke('youtube:getInfo', url),
  getPlaylistInfo: (url: string) => ipcRenderer.invoke('youtube:getPlaylistInfo', url),
  download: (options: any) => ipcRenderer.invoke('youtube:download', options),
  cancel: () => ipcRenderer.invoke('youtube:cancel'),
  openFile: (filePath: string) => ipcRenderer.invoke('youtube:openFile', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('youtube:showInFolder', filePath),
  chooseFolder: () => ipcRenderer.invoke('youtube:chooseFolder'),
  getHistory: () => ipcRenderer.invoke('youtube:getHistory'),
  clearHistory: () => ipcRenderer.invoke('youtube:clearHistory'),
  removeFromHistory: (id: string) => ipcRenderer.invoke('youtube:removeFromHistory', id),
  getSettings: () => ipcRenderer.invoke('youtube:getSettings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('youtube:saveSettings', settings),
  getCapabilities: () => ipcRenderer.invoke('youtube:getCapabilities'),
  installAria2: () => ipcRenderer.invoke('youtube:installAria2'),
  onProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('youtube:progress', listener);
    return () => ipcRenderer.removeListener('youtube:progress', listener);
  }
})



