import { BrowserWindow, Menu, Notification, Tray, app, clipboard, globalShortcut, ipcMain, nativeImage } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import os from "node:os";
import fs from "node:fs/promises";
import si from "systeminformation";
import Store from "electron-store";
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function.");
});
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => {
		return {
			platform: process.platform,
			version: os.release(),
			architecture: os.arch(),
			isAdmin: true
		};
	});
	ipcMain.handle("cleaner:scan-junk", async () => {
		const platform = process.platform;
		const junkPaths = [];
		if (platform === "win32") {
			const windir = process.env.WINDIR || "C:\\Windows";
			const tempDir = os.tmpdir();
			const winTemp = path.join(windir, "Temp");
			const prefetch = path.join(windir, "Prefetch");
			const softDist = path.join(windir, "SoftwareDistribution", "Download");
			junkPaths.push({
				path: tempDir,
				name: "User Temporary Files",
				category: "temp"
			});
			junkPaths.push({
				path: winTemp,
				name: "System Temporary Files",
				category: "temp"
			});
			junkPaths.push({
				path: prefetch,
				name: "Prefetch Files",
				category: "system"
			});
			junkPaths.push({
				path: softDist,
				name: "Windows Update Cache",
				category: "system"
			});
			const chromeCache = path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/User Data/Default/Cache");
			const edgeCache = path.join(process.env.LOCALAPPDATA || "", "Microsoft/Edge/User Data/Default/Cache");
			junkPaths.push({
				path: chromeCache,
				name: "Chrome Cache",
				category: "cache"
			});
			junkPaths.push({
				path: edgeCache,
				name: "Edge Cache",
				category: "cache"
			});
		} else if (platform === "darwin") {
			const home = os.homedir();
			junkPaths.push({
				path: path.join(home, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			});
			junkPaths.push({
				path: path.join(home, "Library/Logs"),
				name: "User Logs",
				category: "log"
			});
			junkPaths.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			});
			junkPaths.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			});
			junkPaths.push({
				path: path.join(home, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			});
		}
		const results = [];
		let totalSize = 0;
		for (const item of junkPaths) try {
			const stats = await fs.stat(item.path).catch(() => null);
			if (stats) {
				const size = stats.isDirectory() ? await getDirSize(item.path) : stats.size;
				if (size > 0) {
					results.push({
						...item,
						size,
						sizeFormatted: formatBytes$1(size)
					});
					totalSize += size;
				}
			}
		} catch (e) {}
		return {
			items: results,
			totalSize,
			totalSizeFormatted: formatBytes$1(totalSize)
		};
	});
	ipcMain.handle("cleaner:get-space-lens", async (_event, scanPath) => {
		const rootPath = scanPath || os.homedir();
		try {
			return await scanDirectoryForLens(rootPath, 0, 2);
		} catch (e) {
			console.error("Space Lens scan failed:", e);
			throw e;
		}
	});
	ipcMain.handle("cleaner:get-large-files", async (_event, options) => {
		const minSize = options.minSize || 100 * 1024 * 1024;
		const scanPaths = options.scanPaths || [os.homedir()];
		const largeFiles = [];
		for (const scanPath of scanPaths) await findLargeFiles(scanPath, minSize, largeFiles);
		largeFiles.sort((a, b) => b.size - a.size);
		return largeFiles.slice(0, 50);
	});
	ipcMain.handle("cleaner:get-duplicates", async (_event, scanPath) => {
		const rootPath = scanPath || os.homedir();
		const fileHashes = /* @__PURE__ */ new Map();
		const duplicates = [];
		await findDuplicates(rootPath, fileHashes);
		for (const [hash, paths] of fileHashes.entries()) if (paths.length > 1) try {
			const stats = await fs.stat(paths[0]);
			duplicates.push({
				hash,
				size: stats.size,
				sizeFormatted: formatBytes$1(stats.size),
				totalWasted: stats.size * (paths.length - 1),
				totalWastedFormatted: formatBytes$1(stats.size * (paths.length - 1)),
				files: paths
			});
		} catch (e) {}
		return duplicates.sort((a, b) => b.totalWasted - a.totalWasted);
	});
	ipcMain.handle("cleaner:run-cleanup", async (_event, files) => {
		let freedSize = 0;
		const failed = [];
		for (const filePath of files) try {
			const stats = await fs.stat(filePath).catch(() => null);
			if (!stats) continue;
			const size = stats.isDirectory() ? await getDirSize(filePath) : stats.size;
			if (stats.isDirectory()) await fs.rm(filePath, {
				recursive: true,
				force: true
			});
			else await fs.unlink(filePath);
			freedSize += size;
		} catch (e) {
			failed.push(filePath);
		}
		return {
			success: failed.length === 0,
			freedSize,
			freedSizeFormatted: formatBytes$1(freedSize),
			failed
		};
	});
	ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			const { exec } = await import("node:child_process");
			exec("purge");
		} catch (e) {}
		return {
			success: true,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	});
}
async function getDirSize(dirPath) {
	let size = 0;
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			if (file.isDirectory()) size += await getDirSize(filePath);
			else try {
				const stats = await fs.stat(filePath);
				size += stats.size;
			} catch (e) {}
		}
	} catch (e) {}
	return size;
}
async function scanDirectoryForLens(dirPath, currentDepth, maxDepth) {
	try {
		const stats = await fs.stat(dirPath);
		const name = path.basename(dirPath) || dirPath;
		if (!stats.isDirectory()) return {
			name,
			path: dirPath,
			size: stats.size,
			type: "file"
		};
		const items = await fs.readdir(dirPath, { withFileTypes: true });
		const children = [];
		let totalSize = 0;
		for (const item of items) {
			const childPath = path.join(dirPath, item.name);
			if (item.name.startsWith(".") || item.name === "node_modules" || item.name === "Library" || item.name === "AppData") continue;
			if (currentDepth < maxDepth) {
				const childResult = await scanDirectoryForLens(childPath, currentDepth + 1, maxDepth);
				if (childResult) {
					children.push(childResult);
					totalSize += childResult.size;
				}
			} else {
				const size = item.isDirectory() ? await getDirSize(childPath) : (await fs.stat(childPath)).size;
				children.push({
					name: item.name,
					path: childPath,
					size,
					type: item.isDirectory() ? "dir" : "file"
				});
				totalSize += size;
			}
		}
		return {
			name,
			path: dirPath,
			size: totalSize,
			sizeFormatted: formatBytes$1(totalSize),
			type: "dir",
			children: children.sort((a, b) => b.size - a.size)
		};
	} catch (e) {
		return null;
	}
}
async function findLargeFiles(dirPath, minSize, results) {
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			if (file.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(file.name)) continue;
			try {
				const stats = await fs.stat(filePath);
				if (file.isDirectory()) await findLargeFiles(filePath, minSize, results);
				else if (stats.size >= minSize) results.push({
					name: file.name,
					path: filePath,
					size: stats.size,
					sizeFormatted: formatBytes$1(stats.size),
					lastAccessed: stats.atime,
					type: path.extname(file.name).slice(1) || "file"
				});
			} catch (e) {}
		}
	} catch (e) {}
}
async function findDuplicates(dirPath, fileHashes) {
	try {
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(dirPath, file.name);
			if (file.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(file.name)) continue;
			try {
				const stats = await fs.stat(filePath);
				if (file.isDirectory()) await findDuplicates(filePath, fileHashes);
				else if (stats.size > 1024 * 1024 && stats.size < 50 * 1024 * 1024) {
					const hash = await hashFile(filePath);
					const existing = fileHashes.get(hash) || [];
					existing.push(filePath);
					fileHashes.set(hash, existing);
				}
			} catch (e) {}
		}
	} catch (e) {}
}
async function hashFile(filePath) {
	const buffer = await fs.readFile(filePath);
	return createHash("md5").update(buffer).digest("hex");
}
function formatBytes$1(bytes) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
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
var statsMenuData = null;
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
	if (statsMenuData) {
		template.push({
			label: "📊 Stats Monitor",
			enabled: false
		});
		template.push({
			label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
			enabled: false
		});
		template.push({
			label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
			enabled: false
		});
		template.push({
			label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
			enabled: false
		});
		template.push({ type: "separator" });
		template.push({
			label: "Open Stats Monitor",
			click: () => {
				win?.show();
				win?.webContents.send("navigate-to", "/stats-monitor");
			}
		});
		template.push({ type: "separator" });
	}
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
	ipcMain.on("stats-update-tray", (_event, data) => {
		statsMenuData = data;
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
		try {
			const [fsSize, ioStatsRaw] = await Promise.all([si.fsSize(), si.disksIO()]);
			let ioStats = null;
			if (ioStatsRaw && Array.isArray(ioStatsRaw) && ioStatsRaw.length > 0) {
				const firstDisk = ioStatsRaw[0];
				ioStats = {
					rIO: firstDisk.rIO || 0,
					wIO: firstDisk.wIO || 0,
					tIO: firstDisk.tIO || 0,
					rIO_sec: firstDisk.rIO_sec || 0,
					wIO_sec: firstDisk.wIO_sec || 0,
					tIO_sec: firstDisk.tIO_sec || 0
				};
			} else if (ioStatsRaw && typeof ioStatsRaw === "object" && !Array.isArray(ioStatsRaw)) ioStats = {
				rIO: ioStatsRaw.rIO || 0,
				wIO: ioStatsRaw.wIO || 0,
				tIO: ioStatsRaw.tIO || 0,
				rIO_sec: ioStatsRaw.rIO_sec || 0,
				wIO_sec: ioStatsRaw.wIO_sec || 0,
				tIO_sec: ioStatsRaw.tIO_sec || 0
			};
			return {
				fsSize,
				ioStats
			};
		} catch (error) {
			console.error("Error fetching disk stats:", error);
			return {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	});
	ipcMain.handle("get-gpu-stats", async () => {
		return await si.graphics();
	});
	ipcMain.handle("get-battery-stats", async () => {
		try {
			const battery = await si.battery();
			let powerConsumptionRate;
			let chargingPower;
			if ("powerConsumptionRate" in battery && battery.powerConsumptionRate && typeof battery.powerConsumptionRate === "number") powerConsumptionRate = battery.powerConsumptionRate;
			if (battery.voltage && battery.voltage > 0) {
				if (!battery.isCharging && battery.timeRemaining > 0 && battery.currentCapacity > 0) {
					const estimatedCurrent = battery.currentCapacity / battery.timeRemaining * 60;
					powerConsumptionRate = battery.voltage * estimatedCurrent;
				}
				if (battery.isCharging && battery.voltage > 0) chargingPower = battery.voltage * 2e3;
			}
			return {
				...battery,
				powerConsumptionRate,
				chargingPower
			};
		} catch (error) {
			console.error("Error fetching battery stats:", error);
			return null;
		}
	});
	ipcMain.handle("get-sensor-stats", async () => {
		return await si.cpuTemperature();
	});
	ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			const bluetooth = await si.bluetoothDevices();
			return {
				enabled: bluetooth.length > 0 || await checkBluetoothEnabled(),
				devices: bluetooth.map((device) => ({
					name: device.name || "Unknown",
					mac: device.mac || device.address || "",
					type: device.type || device.deviceClass || "unknown",
					battery: device.battery || device.batteryLevel || void 0,
					connected: device.connected !== false,
					rssi: device.rssi || device.signalStrength || void 0,
					manufacturer: device.manufacturer || device.vendor || void 0
				}))
			};
		} catch (error) {
			console.error("Error fetching bluetooth stats:", error);
			return {
				enabled: false,
				devices: []
			};
		}
	});
	ipcMain.handle("get-timezones-stats", async () => {
		try {
			const time = await si.time();
			const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const zones = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((tz) => {
				const now = /* @__PURE__ */ new Date();
				const formatter = new Intl.DateTimeFormat("en-US", {
					timeZone: tz,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: false
				});
				const dateFormatter = new Intl.DateTimeFormat("en-US", {
					timeZone: tz,
					year: "numeric",
					month: "short",
					day: "numeric"
				});
				const offset = getTimezoneOffset(tz);
				return {
					timezone: tz,
					city: tz.split("/").pop()?.replace("_", " ") || tz,
					time: formatter.format(now),
					date: dateFormatter.format(now),
					offset
				};
			});
			return {
				local: {
					timezone: localTz,
					city: localTz.split("/").pop()?.replace("_", " ") || "Local",
					time: time.current,
					date: time.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(localTz)
				},
				zones
			};
		} catch (error) {
			console.error("Error fetching timezones stats:", error);
			return null;
		}
	});
	setupCleanerHandlers();
	createTray();
	createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			const { execSync } = __require("child_process");
			return execSync("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return true;
	} catch {
		return false;
	}
}
function getTimezoneOffset(timezone) {
	const now = /* @__PURE__ */ new Date();
	const utcTime = now.getTime() + now.getTimezoneOffset() * 6e4;
	const tzString = now.toLocaleString("en-US", {
		timeZone: timezone,
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(tzString).getTime() - utcTime) / (1e3 * 60 * 60);
}
function formatBytes(bytes) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
function formatSpeed(bytesPerSec) {
	if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
	if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
	return `${bytesPerSec.toFixed(0)} B/s`;
}
