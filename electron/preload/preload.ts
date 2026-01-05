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
