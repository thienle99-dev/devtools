import { BrowserWindow, Menu, Notification, Tray, app, clipboard, globalShortcut, ipcMain, nativeImage } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import si from "systeminformation";
import Store from "electron-store";
var store = new Store();
var __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win;
var tray = null;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(openAtLogin) {
	try {
		app.setLoginItemSettings({
			openAtLogin,
			openAsHidden: true
		});
		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.warn("Failed to set login item settings:", errorMessage);
		if (!app.isPackaged) console.info("Note: Launch at login requires code signing in production builds");
		return {
			success: false,
			error: errorMessage
		};
	}
}
function createTray() {
	if (tray) return;
	tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH).resize({
		width: 22,
		height: 22
	}));
	tray.setToolTip("DevTools 2");
	updateTrayMenu();
	tray.on("double-click", () => {
		toggleWindow();
	});
}
function toggleWindow() {
	if (win) {
		if (win.isVisible()) win.hide();
		else win.show();
		updateTrayMenu();
	}
}
var recentTools = [];
var clipboardItems = [];
var clipboardMonitoringEnabled = true;
function updateTrayMenu() {
	if (!tray) return;
	const template = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			if (win) {
				if (win.isVisible()) win.hide();
				else win.show();
				updateTrayMenu();
			}
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		const displayCount = Math.min(clipboardItems.length, 9);
		template.push({
			label: "📋 Clipboard Manager",
			submenu: [
				{
					label: "▸ Open Full Manager",
					click: () => {
						win?.show();
						win?.webContents.send("navigate-to", "clipboard-manager");
					}
				},
				{ type: "separator" },
				{
					label: `● Recent Clipboard (${displayCount})`,
					enabled: false
				},
				...clipboardItems.slice(0, 9).map((item, index) => {
					const content = String(item.content || "");
					const cleanPreview = (content.length > 75 ? content.substring(0, 75) + "..." : content).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${index + 1}. ${cleanPreview || "(Empty)"}`,
						click: () => {
							if (content) {
								clipboard.writeText(content);
								new Notification({
									title: "✓ Copied from History",
									body: cleanPreview || "Copied to clipboard",
									silent: true
								}).show();
							}
						}
					};
				}),
				{ type: "separator" },
				{
					label: clipboardMonitoringEnabled ? "▶ Monitoring Active" : "⏸ Monitoring Paused",
					type: "checkbox",
					checked: clipboardMonitoringEnabled,
					click: () => {
						clipboardMonitoringEnabled = !clipboardMonitoringEnabled;
						win?.webContents.send("toggle-clipboard-monitoring", clipboardMonitoringEnabled);
						updateTrayMenu();
						new Notification({
							title: clipboardMonitoringEnabled ? "✓ Monitoring Enabled" : "⏸ Monitoring Paused",
							body: clipboardMonitoringEnabled ? "Clipboard will be monitored automatically" : "Clipboard monitoring paused",
							silent: true
						}).show();
					}
				},
				{ type: "separator" },
				{
					label: "✕ Clear All History",
					click: () => {
						win?.webContents.send("clipboard-clear-all");
					}
				}
			]
		});
		template.push({ type: "separator" });
	} else {
		template.push({
			label: "📋 Clipboard Manager (Empty)",
			click: () => {
				win?.show();
				win?.webContents.send("navigate-to", "clipboard-manager");
			}
		});
		template.push({ type: "separator" });
	}
	template.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					const uuid = randomUUID();
					clipboard.writeText(uuid);
					new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${uuid.substring(0, 20)}...`,
						silent: true
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						const text = clipboard.readText();
						const json = JSON.parse(text);
						const formatted = JSON.stringify(json, null, 2);
						clipboard.writeText(formatted);
						new Notification({
							title: "✓ JSON Formatted",
							body: "Formatted JSON copied to clipboard",
							silent: true
						}).show();
					} catch (e) {
						new Notification({
							title: "✗ Format Failed",
							body: "Clipboard does not contain valid JSON",
							silent: true
						}).show();
					}
				}
			},
			{
				label: "# Hash Text (SHA-256)",
				click: () => {
					try {
						const text = clipboard.readText();
						if (!text) throw new Error("Empty clipboard");
						const hash = createHash("sha256").update(text).digest("hex");
						clipboard.writeText(hash);
						new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${hash.substring(0, 20)}...`,
							silent: true
						}).show();
					} catch (e) {
						new Notification({
							title: "✗ Hash Failed",
							body: "Could not hash clipboard content",
							silent: true
						}).show();
					}
				}
			},
			{ type: "separator" },
			{
				label: "↑ Base64 Encode",
				click: () => {
					try {
						const text = clipboard.readText();
						if (!text) throw new Error("Empty clipboard");
						const encoded = Buffer.from(text).toString("base64");
						clipboard.writeText(encoded);
						new Notification({
							title: "✓ Base64 Encoded",
							body: "Encoded text copied to clipboard",
							silent: true
						}).show();
					} catch (e) {
						new Notification({
							title: "✗ Encode Failed",
							body: "Could not encode clipboard content",
							silent: true
						}).show();
					}
				}
			},
			{
				label: "↓ Base64 Decode",
				click: () => {
					try {
						const text = clipboard.readText();
						if (!text) throw new Error("Empty clipboard");
						const decoded = Buffer.from(text, "base64").toString("utf-8");
						clipboard.writeText(decoded);
						new Notification({
							title: "✓ Base64 Decoded",
							body: "Decoded text copied to clipboard",
							silent: true
						}).show();
					} catch (e) {
						new Notification({
							title: "✗ Decode Failed",
							body: "Invalid Base64 in clipboard",
							silent: true
						}).show();
					}
				}
			}
		]
	});
	template.push({ type: "separator" });
	if (recentTools.length > 0) {
		template.push({
			label: "🕐 Recent Tools",
			submenu: recentTools.map((tool) => ({
				label: `  • ${tool.name}`,
				click: () => {
					win?.show();
					win?.webContents.send("navigate-to", tool.id);
				}
			}))
		});
		template.push({ type: "separator" });
	}
	template.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show();
			win?.webContents.send("navigate-to", "settings");
		}
	});
	template.push({ type: "separator" });
	template.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = true;
			app.quit();
		}
	});
	const contextMenu = Menu.buildFromTemplate(template);
	tray.setContextMenu(contextMenu);
}
function createWindow() {
	const windowBounds = store.get("windowBounds") || {
		width: 1600,
		height: 900
	};
	const startMinimized = store.get("startMinimized") || false;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: true,
			contextIsolation: true
		},
		...windowBounds,
		minWidth: 1200,
		minHeight: 700,
		show: !startMinimized,
		frame: false,
		transparent: true,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	const saveBounds = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", saveBounds);
	win.on("move", saveBounds);
	win.on("close", (event) => {
		const minimizeToTray = store.get("minimizeToTray") ?? true;
		if (!app.isQuitting && minimizeToTray) {
			event.preventDefault();
			win?.hide();
			updateTrayMenu();
		}
		return false;
	});
	win.on("show", updateTrayMenu);
	win.on("hide", updateTrayMenu);
	win.on("maximize", () => {
		win?.webContents.send("window-maximized", true);
	});
	win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", false);
	});
	ipcMain.handle("store-get", (_event, key) => store.get(key));
	ipcMain.handle("store-set", (_event, key, value) => {
		store.set(key, value);
		if (key === "launchAtLogin") {
			const result = setLoginItemSettingsSafely(value === true);
			if (!result.success && win) win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: result.error
			});
		}
	});
	ipcMain.handle("store-delete", (_event, key) => store.delete(key));
	ipcMain.on("tray-update-menu", (_event, items) => {
		recentTools = items || [];
		updateTrayMenu();
	});
	ipcMain.on("tray-update-clipboard", (_event, items) => {
		clipboardItems = (items || []).sort((a, b) => b.timestamp - a.timestamp);
		updateTrayMenu();
	});
	ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (error) {
			console.error("Failed to read clipboard:", error);
			return "";
		}
	});
	ipcMain.handle("clipboard-read-image", async () => {
		try {
			const image = clipboard.readImage();
			if (image.isEmpty()) return null;
			return image.toDataURL();
		} catch (error) {
			console.error("Failed to read clipboard image:", error);
			return null;
		}
	});
	ipcMain.on("sync-clipboard-monitoring", (_event, enabled) => {
		clipboardMonitoringEnabled = enabled;
		updateTrayMenu();
	});
	ipcMain.on("window-minimize", () => {
		win?.minimize();
	});
	ipcMain.on("window-maximize", () => {
		if (win?.isMaximized()) win.unmaximize();
		else win?.maximize();
	});
	ipcMain.on("window-close", () => {
		win?.close();
	});
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(join(process.env.DIST || "", "index.html"));
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
	else if (win) win.show();
});
app.on("before-quit", () => {
	app.isQuitting = true;
	if (win) win.webContents.send("check-clear-clipboard-on-quit");
});
app.whenReady().then(() => {
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		});
		globalShortcut.register("CommandOrControl+Shift+C", () => {
			win?.show();
			win?.webContents.send("open-clipboard-manager");
		});
	} catch (e) {
		console.error("Failed to register global shortcut", e);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === true);
	ipcMain.handle("get-cpu-stats", async () => {
		const [cpu, currentLoad] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: cpu.manufacturer,
			brand: cpu.brand,
			speed: cpu.speed,
			cores: cpu.cores,
			physicalCores: cpu.physicalCores,
			load: currentLoad
		};
	});
	ipcMain.handle("get-memory-stats", async () => {
		return await si.mem();
	});
	ipcMain.handle("get-network-stats", async () => {
		const [stats, interfaces] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats,
			interfaces
		};
	});
	ipcMain.handle("get-disk-stats", async () => {
		const [fsSize, ioStats] = await Promise.all([si.fsSize(), si.disksIO()]);
		return {
			fsSize,
			ioStats
		};
	});
	ipcMain.handle("get-gpu-stats", async () => {
		return await si.graphics();
	});
	ipcMain.handle("get-battery-stats", async () => {
		return await si.battery();
	});
	ipcMain.handle("get-sensor-stats", async () => {
		return await si.cpuTemperature();
	});
	createTray();
	createWindow();
});
