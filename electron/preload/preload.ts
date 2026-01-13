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
  }
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
