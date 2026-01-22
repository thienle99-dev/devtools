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
	process: {
		platform: process.platform,
		versions: process.versions
	},
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
		close: () => electron.ipcRenderer.send("window-close"),
		openDevTools: () => electron.ipcRenderer.send("window-open-devtools")
	},
	system: {
		getHomeDir: () => electron.ipcRenderer.invoke("get-home-dir"),
		selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
		getInfo: () => electron.ipcRenderer.invoke("system:get-info"),
		getDiskStats: () => electron.ipcRenderer.invoke("get-disk-stats"),
		getGpuStats: () => electron.ipcRenderer.invoke("get-gpu-stats"),
		getBatteryStats: () => electron.ipcRenderer.invoke("get-battery-stats"),
		getSensorStats: () => electron.ipcRenderer.invoke("get-sensor-stats"),
		getBluetoothStats: () => electron.ipcRenderer.invoke("get-bluetooth-stats"),
		getTimezonesStats: () => electron.ipcRenderer.invoke("get-timezones-stats")
	}
});
electron.contextBridge.exposeInMainWorld("bcryptAPI", {
	hash: (text, rounds) => electron.ipcRenderer.invoke("bcrypt:hash", text, rounds),
	compare: (text, hash) => electron.ipcRenderer.invoke("bcrypt:compare", text, hash)
});
electron.contextBridge.exposeInMainWorld("zipAPI", {
	extract: (zipPath, targetPath) => electron.ipcRenderer.invoke("zip:extract", zipPath, targetPath),
	create: (sourcePath, targetPath) => electron.ipcRenderer.invoke("zip:create", sourcePath, targetPath)
});
electron.contextBridge.exposeInMainWorld("cleanerAPI", {
	getPlatform: () => electron.ipcRenderer.invoke("cleaner:get-platform"),
	scanJunk: () => electron.ipcRenderer.invoke("cleaner:scan-junk"),
	getSpaceLens: (path) => electron.ipcRenderer.invoke("cleaner:get-space-lens", path),
	getFolderSize: (path) => electron.ipcRenderer.invoke("cleaner:get-folder-size", path),
	clearSizeCache: (path) => electron.ipcRenderer.invoke("cleaner:clear-size-cache", path),
	getPerformanceData: () => electron.ipcRenderer.invoke("cleaner:get-performance-data"),
	getStartupItems: () => electron.ipcRenderer.invoke("cleaner:get-startup-items"),
	toggleStartupItem: (item) => electron.ipcRenderer.invoke("cleaner:toggle-startup-item", item),
	killProcess: (pid) => electron.ipcRenderer.invoke("cleaner:kill-process", pid),
	getInstalledApps: () => electron.ipcRenderer.invoke("cleaner:get-installed-apps"),
	getLargeFiles: (options) => electron.ipcRenderer.invoke("cleaner:get-large-files", options),
	getDuplicates: (path) => electron.ipcRenderer.invoke("cleaner:get-duplicates", path),
	runCleanup: (files) => electron.ipcRenderer.invoke("cleaner:run-cleanup", files),
	freeRam: () => electron.ipcRenderer.invoke("cleaner:free-ram"),
	uninstallApp: (app) => electron.ipcRenderer.invoke("cleaner:uninstall-app", app),
	scanPrivacy: () => electron.ipcRenderer.invoke("cleaner:scan-privacy"),
	cleanPrivacy: (options) => electron.ipcRenderer.invoke("cleaner:clean-privacy", options),
	onSpaceLensProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("cleaner:space-lens-progress", listener);
		return () => electron.ipcRenderer.removeListener("cleaner:space-lens-progress", listener);
	}
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
	captureUrl: (url) => electron.ipcRenderer.invoke("screenshot:capture-url", url),
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
electron.contextBridge.exposeInMainWorld("pluginAPI", {
	getAvailablePlugins: () => electron.ipcRenderer.invoke("plugins:get-available"),
	getInstalledPlugins: () => electron.ipcRenderer.invoke("plugins:get-installed"),
	installPlugin: (pluginId) => electron.ipcRenderer.invoke("plugins:install", pluginId),
	uninstallPlugin: (pluginId) => electron.ipcRenderer.invoke("plugins:uninstall", pluginId),
	togglePlugin: (pluginId, active) => electron.ipcRenderer.invoke("plugins:toggle", pluginId, active),
	onPluginProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("plugins:progress", listener);
		return () => electron.ipcRenderer.removeListener("plugins:progress", listener);
	},
	updateRegistry: () => electron.ipcRenderer.invoke("plugins:update-registry")
});
electron.contextBridge.exposeInMainWorld("videoCompressorAPI", {
	getInfo: (filePath) => electron.ipcRenderer.invoke("video-compressor:get-info", filePath),
	generateThumbnail: (filePath) => electron.ipcRenderer.invoke("video-compressor:generate-thumbnail", filePath),
	compress: (options) => electron.ipcRenderer.invoke("video-compressor:compress", options),
	cancel: (id) => electron.ipcRenderer.invoke("video-compressor:cancel", id),
	onProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("video-compressor:progress", listener);
		return () => electron.ipcRenderer.removeListener("video-compressor:progress", listener);
	},
	chooseInputFile: () => electron.ipcRenderer.invoke("audio:choose-input-file"),
	openFile: (path) => electron.ipcRenderer.invoke("universal:open-file", path),
	showInFolder: (path) => electron.ipcRenderer.invoke("universal:show-in-folder", path)
});
electron.contextBridge.exposeInMainWorld("downloadAPI", {
	getHistory: () => electron.ipcRenderer.invoke("download:get-history"),
	getSettings: () => electron.ipcRenderer.invoke("download:get-settings"),
	saveSettings: (settings) => electron.ipcRenderer.invoke("download:save-settings", settings),
	create: (options) => electron.ipcRenderer.invoke("download:create", options),
	start: (id) => electron.ipcRenderer.invoke("download:start", id),
	pause: (id) => electron.ipcRenderer.invoke("download:pause", id),
	resume: (id) => electron.ipcRenderer.invoke("download:resume", id),
	cancel: (id) => electron.ipcRenderer.invoke("download:cancel", id),
	verifyChecksum: (id) => electron.ipcRenderer.invoke("download:verify-checksum", id),
	openFolder: (path) => electron.ipcRenderer.invoke("download:open-folder", path),
	clearHistory: () => electron.ipcRenderer.invoke("download:clear-history"),
	reorder: (startIndex, endIndex) => electron.ipcRenderer.invoke("download:reorder", {
		startIndex,
		endIndex
	}),
	saveHistory: (history) => electron.ipcRenderer.invoke("download:save-history", history),
	onAnyProgress: (callback) => {
		const listener = (_event, progress) => callback(progress);
		electron.ipcRenderer.on("download:any-progress", listener);
		return () => electron.ipcRenderer.removeListener("download:any-progress", listener);
	},
	onStarted: (callback) => {
		const listener = (_event, task) => callback(task);
		electron.ipcRenderer.on("download:task-started", listener);
		return () => electron.ipcRenderer.removeListener("download:task-started", listener);
	},
	onCompleted: (callback) => {
		const listener = (_event, task) => callback(task);
		electron.ipcRenderer.on("download:task-completed", listener);
		return () => electron.ipcRenderer.removeListener("download:task-completed", listener);
	}
});
