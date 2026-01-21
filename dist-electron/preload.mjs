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
		getInfo: () => electron.ipcRenderer.invoke("system:get-info")
	}
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
