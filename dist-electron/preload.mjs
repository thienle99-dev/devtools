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
	}
});
electron.contextBridge.exposeInMainWorld("statsAPI", {
	getCPUStats: () => electron.ipcRenderer.invoke("get-cpu-stats"),
	getMemoryStats: () => electron.ipcRenderer.invoke("get-memory-stats"),
	getNetworkStats: () => electron.ipcRenderer.invoke("get-network-stats")
});
