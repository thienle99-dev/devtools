let electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args) {
		const [channel, listener] = args;
		const wrappedListener = (event, ...args$1) => listener(event, ...args$1);
		electron.ipcRenderer.on(channel, wrappedListener);
		return () => {
			electron.ipcRenderer.removeListener(channel, wrappedListener);
		};
	},
	off(...args) {
		const [channel, ...omit] = args;
		return electron.ipcRenderer.off(channel, ...omit);
	},
	send(...args) {
		const [channel, ...omit] = args;
		return electron.ipcRenderer.send(channel, ...omit);
	},
	invoke(...args) {
		const [channel, ...omit] = args;
		return electron.ipcRenderer.invoke(channel, ...omit);
	},
	process: { platform: process.platform },
	tray: {
		updateMenu: (items) => electron.ipcRenderer.send("tray-update-menu", items),
		updateClipboard: (items) => electron.ipcRenderer.send("tray-update-clipboard", items),
		syncMonitoring: (enabled) => electron.ipcRenderer.send("sync-clipboard-monitoring", enabled)
	},
	clipboard: {
		readText: () => electron.ipcRenderer.invoke("clipboard-read-text"),
		readImage: () => electron.ipcRenderer.invoke("clipboard-read-image")
	},
	window: {
		minimize: () => electron.ipcRenderer.send("window-minimize"),
		maximize: () => electron.ipcRenderer.send("window-maximize"),
		close: () => electron.ipcRenderer.send("window-close")
	}
});
electron.contextBridge.exposeInMainWorld("statsAPI", {
	getCPUStats: () => electron.ipcRenderer.invoke("get-cpu-stats"),
	getMemoryStats: () => electron.ipcRenderer.invoke("get-memory-stats"),
	getNetworkStats: () => electron.ipcRenderer.invoke("get-network-stats"),
	getDiskStats: () => electron.ipcRenderer.invoke("get-disk-stats"),
	getGPUStats: () => electron.ipcRenderer.invoke("get-gpu-stats"),
	getBatteryStats: () => electron.ipcRenderer.invoke("get-battery-stats"),
	getSensorStats: () => electron.ipcRenderer.invoke("get-sensor-stats"),
	getBluetoothStats: () => electron.ipcRenderer.invoke("get-bluetooth-stats"),
	getTimeZonesStats: () => electron.ipcRenderer.invoke("get-timezones-stats")
});
electron.contextBridge.exposeInMainWorld("cleanerAPI", {
	getPlatform: () => electron.ipcRenderer.invoke("cleaner:get-platform"),
	scanJunk: () => electron.ipcRenderer.invoke("cleaner:scan-junk"),
	getLargeFiles: (options) => electron.ipcRenderer.invoke("cleaner:get-large-files", options),
	getDuplicates: (scanPath) => electron.ipcRenderer.invoke("cleaner:get-duplicates", scanPath),
	getSpaceLens: (scanPath) => electron.ipcRenderer.invoke("cleaner:get-space-lens", scanPath),
	getPerformanceData: () => electron.ipcRenderer.invoke("cleaner:get-performance-data"),
	getStartupItems: () => electron.ipcRenderer.invoke("cleaner:get-startup-items"),
	toggleStartupItem: (item) => electron.ipcRenderer.invoke("cleaner:toggle-startup-item", item),
	killProcess: (pid) => electron.ipcRenderer.invoke("cleaner:kill-process", pid),
	getInstalledApps: () => electron.ipcRenderer.invoke("cleaner:get-installed-apps"),
	uninstallApp: (app) => electron.ipcRenderer.invoke("cleaner:uninstall-app", app),
	runCleanup: (files) => electron.ipcRenderer.invoke("cleaner:run-cleanup", files),
	freeRam: () => electron.ipcRenderer.invoke("cleaner:free-ram"),
	scanPrivacy: () => electron.ipcRenderer.invoke("cleaner:scan-privacy"),
	cleanPrivacy: (options) => electron.ipcRenderer.invoke("cleaner:clean-privacy", options),
	onSpaceLensProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("cleaner:space-lens-progress", listener);
		return () => electron.ipcRenderer.removeListener("cleaner:space-lens-progress", listener);
	},
	runMaintenance: (task) => electron.ipcRenderer.invoke("cleaner:run-maintenance", task),
	getHealthStatus: () => electron.ipcRenderer.invoke("cleaner:get-health-status")
});
