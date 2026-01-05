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
	getSensorStats: () => electron.ipcRenderer.invoke("get-sensor-stats")
});
