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
	},
	system: {
		getHomeDir: () => electron.ipcRenderer.invoke("get-home-dir"),
		selectFolder: () => electron.ipcRenderer.invoke("select-folder")
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
	getFolderSize: (folderPath) => electron.ipcRenderer.invoke("cleaner:get-folder-size", folderPath),
	clearSizeCache: (folderPath) => electron.ipcRenderer.invoke("cleaner:clear-size-cache", folderPath),
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
	scanBrowserData: () => electron.ipcRenderer.invoke("cleaner:scan-browser-data"),
	cleanBrowserData: (options) => electron.ipcRenderer.invoke("cleaner:clean-browser-data", options),
	getWifiNetworks: () => electron.ipcRenderer.invoke("cleaner:get-wifi-networks"),
	removeWifiNetwork: (networkName) => electron.ipcRenderer.invoke("cleaner:remove-wifi-network", networkName),
	onSpaceLensProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("cleaner:space-lens-progress", listener);
		return () => electron.ipcRenderer.removeListener("cleaner:space-lens-progress", listener);
	},
	runMaintenance: (task) => electron.ipcRenderer.invoke("cleaner:run-maintenance", task),
	getHealthStatus: () => electron.ipcRenderer.invoke("cleaner:get-health-status"),
	checkSafety: (files) => electron.ipcRenderer.invoke("cleaner:check-safety", files),
	createBackup: (files) => electron.ipcRenderer.invoke("cleaner:create-backup", files),
	listBackups: () => electron.ipcRenderer.invoke("cleaner:list-backups"),
	getBackupInfo: (backupId) => electron.ipcRenderer.invoke("cleaner:get-backup-info", backupId),
	restoreBackup: (backupId) => electron.ipcRenderer.invoke("cleaner:restore-backup", backupId),
	deleteBackup: (backupId) => electron.ipcRenderer.invoke("cleaner:delete-backup", backupId),
	startHealthMonitoring: () => electron.ipcRenderer.invoke("health-start-monitoring"),
	stopHealthMonitoring: () => electron.ipcRenderer.invoke("health-stop-monitoring"),
	updateHealthTray: (data) => electron.ipcRenderer.send("health-update-tray", data)
});
electron.contextBridge.exposeInMainWorld("appManagerAPI", {
	getInstalledApps: () => electron.ipcRenderer.invoke("app-manager:get-installed-apps"),
	getRunningProcesses: () => electron.ipcRenderer.invoke("app-manager:get-running-processes"),
	uninstallApp: (app) => electron.ipcRenderer.invoke("app-manager:uninstall-app", app),
	killProcess: (pid) => electron.ipcRenderer.invoke("app-manager:kill-process", pid)
});
electron.contextBridge.exposeInMainWorld("screenshotAPI", {
	getSources: () => electron.ipcRenderer.invoke("screenshot:get-sources"),
	captureScreen: () => electron.ipcRenderer.invoke("screenshot:capture-screen"),
	captureWindow: (sourceId) => electron.ipcRenderer.invoke("screenshot:capture-window", sourceId),
	captureArea: () => electron.ipcRenderer.invoke("screenshot:capture-area"),
	saveFile: (dataUrl, options) => electron.ipcRenderer.invoke("screenshot:save-file", dataUrl, options)
});
electron.contextBridge.exposeInMainWorld("permissionsAPI", {
	checkAll: () => electron.ipcRenderer.invoke("permissions:check-all"),
	checkAccessibility: () => electron.ipcRenderer.invoke("permissions:check-accessibility"),
	checkFullDiskAccess: () => electron.ipcRenderer.invoke("permissions:check-full-disk-access"),
	checkScreenRecording: () => electron.ipcRenderer.invoke("permissions:check-screen-recording"),
	testClipboard: () => electron.ipcRenderer.invoke("permissions:test-clipboard"),
	testFileAccess: () => electron.ipcRenderer.invoke("permissions:test-file-access"),
	openSystemPreferences: (permissionType) => electron.ipcRenderer.invoke("permissions:open-system-preferences", permissionType)
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
	sendSelection: (bounds) => electron.ipcRenderer.invoke("screenshot:area-selected", bounds),
	cancelSelection: () => electron.ipcRenderer.invoke("screenshot:area-cancelled")
});
electron.contextBridge.exposeInMainWorld("youtubeAPI", {
	getInfo: (url) => electron.ipcRenderer.invoke("youtube:getInfo", url),
	getPlaylistInfo: (url) => electron.ipcRenderer.invoke("youtube:getPlaylistInfo", url),
	download: (options) => electron.ipcRenderer.invoke("youtube:download", options),
	cancel: () => electron.ipcRenderer.invoke("youtube:cancel"),
	openFile: (filePath) => electron.ipcRenderer.invoke("youtube:openFile", filePath),
	showInFolder: (filePath) => electron.ipcRenderer.invoke("youtube:showInFolder", filePath),
	chooseFolder: () => electron.ipcRenderer.invoke("youtube:chooseFolder"),
	getHistory: () => electron.ipcRenderer.invoke("youtube:getHistory"),
	clearHistory: () => electron.ipcRenderer.invoke("youtube:clearHistory"),
	onProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("youtube:progress", listener);
		return () => electron.ipcRenderer.removeListener("youtube:progress", listener);
	}
});
