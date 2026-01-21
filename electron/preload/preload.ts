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
    versions: process.versions,
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
    openDevTools: () => ipcRenderer.send('window-open-devtools'),
  },
  system: {
    getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getInfo: () => ipcRenderer.invoke('system:get-info'),
    getDiskStats: () => ipcRenderer.invoke('get-disk-stats'),
    getGpuStats: () => ipcRenderer.invoke('get-gpu-stats'),
    getBatteryStats: () => ipcRenderer.invoke('get-battery-stats'),
    getSensorStats: () => ipcRenderer.invoke('get-sensor-stats'),
    getBluetoothStats: () => ipcRenderer.invoke('get-bluetooth-stats'),
    getTimezonesStats: () => ipcRenderer.invoke('get-timezones-stats'),
  }
})

contextBridge.exposeInMainWorld('bcryptAPI', {
  hash: (text: string, rounds?: number) => ipcRenderer.invoke('bcrypt:hash', text, rounds),
  compare: (text: string, hash: string) => ipcRenderer.invoke('bcrypt:compare', text, hash),
})

contextBridge.exposeInMainWorld('zipAPI', {
  extract: (zipPath: string, targetPath: string) => ipcRenderer.invoke('zip:extract', zipPath, targetPath),
  create: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('zip:create', sourcePath, targetPath),
})

contextBridge.exposeInMainWorld('cleanerAPI', {
  getPlatform: () => ipcRenderer.invoke('cleaner:get-platform'),
  scanJunk: () => ipcRenderer.invoke('cleaner:scan-junk'),
  getSpaceLens: (path: string) => ipcRenderer.invoke('cleaner:get-space-lens', path),
  getFolderSize: (path: string) => ipcRenderer.invoke('cleaner:get-folder-size', path),
  clearSizeCache: (path?: string) => ipcRenderer.invoke('cleaner:clear-size-cache', path),
  getPerformanceData: () => ipcRenderer.invoke('cleaner:get-performance-data'),
  getStartupItems: () => ipcRenderer.invoke('cleaner:get-startup-items'),
  toggleStartupItem: (item: any) => ipcRenderer.invoke('cleaner:toggle-startup-item', item),
  killProcess: (pid: number) => ipcRenderer.invoke('cleaner:kill-process', pid),
  getInstalledApps: () => ipcRenderer.invoke('cleaner:get-installed-apps'),
  getLargeFiles: (options: any) => ipcRenderer.invoke('cleaner:get-large-files', options),
  getDuplicates: (path: string) => ipcRenderer.invoke('cleaner:get-duplicates', path),
  runCleanup: (files: string[]) => ipcRenderer.invoke('cleaner:run-cleanup', files),
  freeRam: () => ipcRenderer.invoke('cleaner:free-ram'),
  uninstallApp: (app: any) => ipcRenderer.invoke('cleaner:uninstall-app', app),
  scanPrivacy: () => ipcRenderer.invoke('cleaner:scan-privacy'),
  cleanPrivacy: (options: any) => ipcRenderer.invoke('cleaner:clean-privacy', options),
  onSpaceLensProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('cleaner:space-lens-progress', listener);
    return () => ipcRenderer.removeListener('cleaner:space-lens-progress', listener);
  }
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
contextBridge.exposeInMainWorld('pluginAPI', {
  getAvailablePlugins: () => ipcRenderer.invoke('plugins:get-available'),
  getInstalledPlugins: () => ipcRenderer.invoke('plugins:get-installed'),
  installPlugin: (pluginId: string) => ipcRenderer.invoke('plugins:install', pluginId),
  uninstallPlugin: (pluginId: string) => ipcRenderer.invoke('plugins:uninstall', pluginId),
  togglePlugin: (pluginId: string, active: boolean) => ipcRenderer.invoke('plugins:toggle', pluginId, active),
  onPluginProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('plugins:progress', listener);
    return () => ipcRenderer.removeListener('plugins:progress', listener);
  },
  updateRegistry: () => ipcRenderer.invoke('plugins:update-registry'),
})

contextBridge.exposeInMainWorld('videoCompressorAPI', {
  getInfo: (filePath: string) => ipcRenderer.invoke('video-compressor:get-info', filePath),
  generateThumbnail: (filePath: string) => ipcRenderer.invoke('video-compressor:generate-thumbnail', filePath),
  compress: (options: any) => ipcRenderer.invoke('video-compressor:compress', options),
  cancel: (id: string) => ipcRenderer.invoke('video-compressor:cancel', id),
  onProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('video-compressor:progress', listener);
    return () => ipcRenderer.removeListener('video-compressor:progress', listener);
  },
  chooseInputFile: () => ipcRenderer.invoke('audio:choose-input-file'),
  openFile: (path: string) => ipcRenderer.invoke('universal:open-file', path),
  showInFolder: (path: string) => ipcRenderer.invoke('universal:show-in-folder', path),
})

contextBridge.exposeInMainWorld('downloadAPI', {
  getHistory: () => ipcRenderer.invoke('download:get-history'),
  getSettings: () => ipcRenderer.invoke('download:get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('download:save-settings', settings),
  create: (options: any) => ipcRenderer.invoke('download:create', options),
  start: (id: string) => ipcRenderer.invoke('download:start', id),
  pause: (id: string) => ipcRenderer.invoke('download:pause', id),
  resume: (id: string) => ipcRenderer.invoke('download:resume', id),
  cancel: (id: string) => ipcRenderer.invoke('download:cancel', id),
  verifyChecksum: (id: string) => ipcRenderer.invoke('download:verify-checksum', id),
  openFolder: (path: string) => ipcRenderer.invoke('download:open-folder', path),
  clearHistory: () => ipcRenderer.invoke('download:clear-history'),
  reorder: (startIndex: number, endIndex: number) => ipcRenderer.invoke('download:reorder', { startIndex, endIndex }),
  saveHistory: (history: any[]) => ipcRenderer.invoke('download:save-history', history),

  // Events
  onAnyProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('download:any-progress', listener);
    return () => ipcRenderer.removeListener('download:any-progress', listener);
  },
  onStarted: (callback: (task: any) => void) => {
    const listener = (_event: any, task: any) => callback(task);
    ipcRenderer.on('download:task-started', listener);
    return () => ipcRenderer.removeListener('download:task-started', listener);
  },
  onCompleted: (callback: (task: any) => void) => {
    const listener = (_event: any, task: any) => callback(task);
    ipcRenderer.on('download:task-completed', listener);
    return () => ipcRenderer.removeListener('download:task-completed', listener);
  }
})
