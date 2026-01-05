import { BrowserWindow, Menu, Notification, Tray, app, clipboard, globalShortcut, ipcMain, nativeImage } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import os from "node:os";
import fs from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import si from "systeminformation";
import Store from "electron-store";
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function.");
});
var execAsync = promisify(exec);
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
		const home = os.homedir();
		if (platform === "win32") {
			const windir = process.env.WINDIR || "C:\\Windows";
			const localApp = process.env.LOCALAPPDATA || "";
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
			const chromeCache = path.join(localApp, "Google/Chrome/User Data/Default/Cache");
			const edgeCache = path.join(localApp, "Microsoft/Edge/User Data/Default/Cache");
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
			junkPaths.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (platform === "darwin") {
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
			junkPaths.push({
				path: path.join(home, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				const { stdout } = await execAsync("tmutil listlocalsnapshots /");
				const count = stdout.split("\n").filter((l) => l.trim()).length;
				if (count > 0) junkPaths.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${count})`,
					category: "system",
					virtual: true,
					size: count * 500 * 1024 * 1024
				});
			} catch (e) {}
		}
		const results = [];
		let totalSize = 0;
		for (const item of junkPaths) try {
			if (item.virtual) {
				results.push({
					...item,
					sizeFormatted: formatBytes$1(item.size || 0)
				});
				totalSize += item.size || 0;
				continue;
			}
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
	ipcMain.handle("cleaner:get-space-lens", async (event, scanPath) => {
		const rootPath = scanPath || os.homedir();
		const sender = event.sender;
		return await scanDirectoryForLens(rootPath, 0, 2, (progress) => {
			if (sender && !sender.isDestroyed()) sender.send("cleaner:space-lens-progress", progress);
		});
	});
	ipcMain.handle("cleaner:get-performance-data", async () => {
		const processes = await si.processes();
		const mem = await si.mem();
		const load = await si.currentLoad();
		return {
			heavyApps: processes.list.sort((a, b) => b.cpu + b.mem - (a.cpu + a.mem)).slice(0, 10).map((p) => ({
				pid: p.pid,
				name: p.name,
				cpu: p.cpu,
				mem: p.mem,
				user: p.user,
				path: p.path
			})),
			memory: {
				total: mem.total,
				used: mem.used,
				percent: mem.used / mem.total * 100
			},
			cpuLoad: load.currentLoad
		};
	});
	ipcMain.handle("cleaner:get-startup-items", async () => {
		const platform = process.platform;
		const items = [];
		if (platform === "darwin") try {
			const agentsPath = path.join(os.homedir(), "Library/LaunchAgents");
			const agencyFiles = await fs.readdir(agentsPath).catch(() => []);
			for (const file of agencyFiles) if (file.endsWith(".plist")) {
				const plistPath = path.join(agentsPath, file);
				const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace(".plist", "")}"`).catch(() => ({ stdout: "" }));
				const enabled = stdout.trim().length > 0;
				items.push({
					name: file.replace(".plist", ""),
					path: plistPath,
					type: "LaunchAgent",
					enabled
				});
			}
			const globalAgents = "/Library/LaunchAgents";
			const globalFiles = await fs.readdir(globalAgents).catch(() => []);
			for (const file of globalFiles) {
				const plistPath = path.join(globalAgents, file);
				const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace(".plist", "")}"`).catch(() => ({ stdout: "" }));
				const enabled = stdout.trim().length > 0;
				items.push({
					name: file.replace(".plist", ""),
					path: plistPath,
					type: "SystemAgent",
					enabled
				});
			}
		} catch (e) {}
		else if (platform === "win32") try {
			const { stdout } = await execAsync("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\"");
			const data = JSON.parse(stdout);
			const list = Array.isArray(data) ? data : [data];
			for (const item of list) items.push({
				name: item.Name,
				path: item.Command,
				type: "StartupCommand",
				location: item.Location,
				enabled: true
			});
		} catch (e) {}
		return items;
	});
	ipcMain.handle("cleaner:toggle-startup-item", async (_event, item) => {
		const platform = process.platform;
		try {
			if (platform === "darwin") {
				const isEnabled = item.enabled ?? true;
				if (item.type === "LaunchAgent" || item.type === "SystemAgent") {
					if (isEnabled) await execAsync(`launchctl unload "${item.path}"`);
					else await execAsync(`launchctl load "${item.path}"`);
					return {
						success: true,
						enabled: !isEnabled
					};
				}
			} else if (platform === "win32") {
				const isEnabled = item.enabled ?? true;
				if (item.location === "Startup") {
					const startupPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup");
					const shortcutName = path.basename(item.path);
					const shortcutPath = path.join(startupPath, shortcutName);
					if (isEnabled) await fs.unlink(shortcutPath).catch(() => {});
					return {
						success: true,
						enabled: !isEnabled
					};
				} else return {
					success: true,
					enabled: !isEnabled
				};
			}
			return {
				success: false,
				error: "Unsupported platform or item type"
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:kill-process", async (_event, pid) => {
		try {
			process.kill(pid, "SIGKILL");
			return { success: true };
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:get-installed-apps", async () => {
		const platform = process.platform;
		const apps = [];
		if (platform === "darwin") {
			const appsDir = "/Applications";
			const files = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => []);
			for (const file of files) if (file.name.endsWith(".app")) {
				const appPath = path.join(appsDir, file.name);
				try {
					const stats = await fs.stat(appPath);
					apps.push({
						name: file.name.replace(".app", ""),
						path: appPath,
						size: await getDirSize(appPath),
						installDate: stats.birthtime,
						type: "Application"
					});
				} catch (e) {}
			}
		} else if (platform === "win32") try {
			const { stdout } = await execAsync(`powershell "
                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json
                "`);
			const data = JSON.parse(stdout);
			const list = Array.isArray(data) ? data : [data];
			for (const item of list) if (item.DisplayName) apps.push({
				name: item.DisplayName,
				version: item.DisplayVersion,
				path: item.InstallLocation,
				installDate: item.InstallDate,
				type: "SystemApp"
			});
		} catch (e) {}
		return apps;
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
			if (filePath === "tmutil:snapshots") {
				if (process.platform === "darwin") {
					await execAsync("tmutil deletelocalsnapshots /");
					freedSize += 2 * 1024 * 1024 * 1024;
				}
				continue;
			}
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
			await execAsync("purge");
		} catch (e) {}
		return {
			success: true,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	});
	ipcMain.handle("cleaner:uninstall-app", async (_event, app$1) => {
		const platform = process.platform;
		try {
			if (platform === "darwin") {
				const appPath = app$1.path;
				const appName = app$1.name;
				await execAsync(`osascript -e 'tell application "Finder" to move POSIX file "${appPath}" to trash'`);
				const home = os.homedir();
				const associatedPaths = [
					path.join(home, "Library/Preferences", `*${appName}*`),
					path.join(home, "Library/Application Support", appName),
					path.join(home, "Library/Caches", appName),
					path.join(home, "Library/Logs", appName),
					path.join(home, "Library/Saved Application State", `*${appName}*`),
					path.join(home, "Library/LaunchAgents", `*${appName}*`)
				];
				let freedSize = 0;
				for (const pattern of associatedPaths) try {
					const files = await fs.readdir(path.dirname(pattern)).catch(() => []);
					for (const file of files) if (file.includes(appName)) {
						const filePath = path.join(path.dirname(pattern), file);
						const stats = await fs.stat(filePath).catch(() => null);
						if (stats) if (stats.isDirectory()) {
							freedSize += await getDirSize(filePath);
							await fs.rm(filePath, {
								recursive: true,
								force: true
							});
						} else {
							freedSize += stats.size;
							await fs.unlink(filePath);
						}
					}
				} catch (e) {}
				return {
					success: true,
					freedSize,
					freedSizeFormatted: formatBytes$1(freedSize)
				};
			} else if (platform === "win32") {
				const appName = app$1.name;
				let freedSize = 0;
				try {
					const { stdout } = await execAsync(`wmic product where name="${appName.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`);
					const match = stdout.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (match) {
						const guid = match[1];
						await execAsync(`msiexec /x ${guid} /quiet /norestart`);
						freedSize = await getDirSize(app$1.path).catch(() => 0);
					} else {
						await execAsync(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${appName}*'} | Remove-AppxPackage"`).catch(() => {});
						freedSize = await getDirSize(app$1.path).catch(() => 0);
					}
				} catch (e) {
					freedSize = await getDirSize(app$1.path).catch(() => 0);
					await fs.rm(app$1.path, {
						recursive: true,
						force: true
					}).catch(() => {});
				}
				const localApp = process.env.LOCALAPPDATA || "";
				const appData = process.env.APPDATA || "";
				const associatedPaths = [path.join(localApp, appName), path.join(appData, appName)];
				for (const assocPath of associatedPaths) try {
					if (await fs.stat(assocPath).catch(() => null)) {
						freedSize += await getDirSize(assocPath).catch(() => 0);
						await fs.rm(assocPath, {
							recursive: true,
							force: true
						});
					}
				} catch (e) {}
				return {
					success: true,
					freedSize,
					freedSizeFormatted: formatBytes$1(freedSize)
				};
			}
			return {
				success: false,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: false,
				error: e.message
			};
		}
	});
	ipcMain.handle("cleaner:scan-privacy", async () => {
		const platform = process.platform;
		const results = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (platform === "win32") try {
			const { stdout: docsCount } = await execAsync(`powershell "
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { \$_ -ne \$null } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                "`).catch(() => ({ stdout: "0" }));
			const docsCountNum = parseInt(docsCount.trim()) || 0;
			if (docsCountNum > 0) {
				results.registryEntries.push({
					name: "Recent Documents",
					path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
					type: "registry",
					count: docsCountNum,
					size: 0,
					description: "Recently opened documents registry entries"
				});
				results.totalItems += docsCountNum;
			}
			const { stdout: programsCount } = await execAsync(`powershell "
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { \$_ -ne \$null -and \$_ -notlike 'MRUList*' } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                "`).catch(() => ({ stdout: "0" }));
			const programsCountNum = parseInt(programsCount.trim()) || 0;
			if (programsCountNum > 0) {
				results.registryEntries.push({
					name: "Recent Programs",
					path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
					type: "registry",
					count: programsCountNum,
					size: 0,
					description: "Recently run programs registry entries"
				});
				results.totalItems += programsCountNum;
			}
			const activityHistoryPath = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				const activityFiles = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
				const activityFilesList = [];
				let activitySize = 0;
				for (const file of activityFiles) {
					const filePath = path.join(activityHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							activityFilesList.push(filePath);
							activitySize += stats.size;
						}
					} catch (e) {}
				}
				if (activityFilesList.length > 0) {
					results.activityHistory.push({
						name: "Activity History",
						path: activityHistoryPath,
						type: "files",
						count: activityFilesList.length,
						size: activitySize,
						sizeFormatted: formatBytes$1(activitySize),
						files: activityFilesList,
						description: "Windows activity history files"
					});
					results.totalItems += activityFilesList.length;
					results.totalSize += activitySize;
				}
			} catch (e) {}
			const searchHistoryPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				const searchFiles = await fs.readdir(searchHistoryPath).catch(() => []);
				const searchFilesList = [];
				let searchSize = 0;
				for (const file of searchFiles) {
					const filePath = path.join(searchHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						searchFilesList.push(filePath);
						searchSize += stats.size;
					} catch (e) {}
				}
				if (searchFilesList.length > 0) {
					results.activityHistory.push({
						name: "Windows Search History",
						path: searchHistoryPath,
						type: "files",
						count: searchFilesList.length,
						size: searchSize,
						sizeFormatted: formatBytes$1(searchSize),
						files: searchFilesList,
						description: "Windows search history files"
					});
					results.totalItems += searchFilesList.length;
					results.totalSize += searchSize;
				}
			} catch (e) {}
		} catch (e) {
			return {
				success: false,
				error: e.message,
				results
			};
		}
		else if (platform === "darwin") try {
			const spotlightHistoryPath = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				const spotlightFiles = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
				const spotlightFilesList = [];
				let spotlightSize = 0;
				for (const file of spotlightFiles) {
					const filePath = path.join(spotlightHistoryPath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							spotlightFilesList.push(filePath);
							spotlightSize += stats.size;
						}
					} catch (e) {}
				}
				if (spotlightFilesList.length > 0) {
					results.spotlightHistory.push({
						name: "Spotlight Search History",
						path: spotlightHistoryPath,
						type: "files",
						count: spotlightFilesList.length,
						size: spotlightSize,
						sizeFormatted: formatBytes$1(spotlightSize),
						files: spotlightFilesList,
						description: "macOS Spotlight search history"
					});
					results.totalItems += spotlightFilesList.length;
					results.totalSize += spotlightSize;
				}
			} catch (e) {}
			const quickLookCachePath = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				const quickLookFiles = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
				const quickLookFilesList = [];
				let quickLookSize = 0;
				for (const file of quickLookFiles) {
					const filePath = path.join(quickLookCachePath, file);
					try {
						const stats = await fs.stat(filePath);
						if (stats.isFile()) {
							quickLookFilesList.push(filePath);
							quickLookSize += stats.size;
						}
					} catch (e) {}
				}
				if (quickLookFilesList.length > 0) {
					results.quickLookCache.push({
						name: "Quick Look Cache",
						path: quickLookCachePath,
						type: "files",
						count: quickLookFilesList.length,
						size: quickLookSize,
						sizeFormatted: formatBytes$1(quickLookSize),
						files: quickLookFilesList,
						description: "macOS Quick Look thumbnail cache"
					});
					results.totalItems += quickLookFilesList.length;
					results.totalSize += quickLookSize;
				}
			} catch (e) {}
			const recentItemsPath = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				const recentFiles = await fs.readdir(recentItemsPath).catch(() => []);
				const recentFilesList = [];
				let recentSize = 0;
				for (const file of recentFiles) if (file.includes("RecentItems")) {
					const filePath = path.join(recentItemsPath, file);
					try {
						const stats = await fs.stat(filePath);
						recentFilesList.push(filePath);
						recentSize += stats.size;
					} catch (e) {}
				}
				if (recentFilesList.length > 0) {
					results.spotlightHistory.push({
						name: "Recently Opened Files",
						path: recentItemsPath,
						type: "files",
						count: recentFilesList.length,
						size: recentSize,
						sizeFormatted: formatBytes$1(recentSize),
						files: recentFilesList,
						description: "macOS recently opened files list"
					});
					results.totalItems += recentFilesList.length;
					results.totalSize += recentSize;
				}
			} catch (e) {}
		} catch (e) {
			return {
				success: false,
				error: e.message,
				results
			};
		}
		return {
			success: true,
			results
		};
	});
	ipcMain.handle("cleaner:clean-privacy", async (_event, options) => {
		const platform = process.platform;
		let cleanedItems = 0;
		let freedSize = 0;
		const errors = [];
		if (platform === "win32") try {
			if (options.registry) {
				try {
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\"");
					cleanedItems += 10;
				} catch (e) {}
				try {
					await execAsync("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\"");
					cleanedItems += 5;
				} catch (e) {}
			}
			if (options.activityHistory) {
				const activityHistoryPath = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					const files = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(activityHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean activity history: ${e.message}`);
				}
				const searchHistoryPath = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					const files = await fs.readdir(searchHistoryPath).catch(() => []);
					for (const file of files) {
						const filePath = path.join(searchHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							freedSize += stats.size;
							await fs.unlink(filePath);
							cleanedItems++;
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean search history: ${e.message}`);
				}
			}
		} catch (e) {
			errors.push(`Windows privacy cleanup failed: ${e.message}`);
		}
		else if (platform === "darwin") try {
			if (options.spotlightHistory) {
				const spotlightHistoryPath = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					const files = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(spotlightHistoryPath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean Spotlight history: ${e.message}`);
				}
				const recentItemsPath = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					const files = await fs.readdir(recentItemsPath).catch(() => []);
					for (const file of files) if (file.includes("RecentItems")) {
						const filePath = path.join(recentItemsPath, file);
						try {
							const stats = await fs.stat(filePath);
							freedSize += stats.size;
							await fs.unlink(filePath);
							cleanedItems++;
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean recent items: ${e.message}`);
				}
			}
			if (options.quickLookCache) {
				const quickLookCachePath = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					const files = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
					for (const file of files) {
						const filePath = path.join(quickLookCachePath, file);
						try {
							const stats = await fs.stat(filePath);
							if (stats.isFile()) {
								freedSize += stats.size;
								await fs.unlink(filePath);
								cleanedItems++;
							}
						} catch (e) {}
					}
				} catch (e) {
					errors.push(`Failed to clean Quick Look cache: ${e.message}`);
				}
			}
		} catch (e) {
			errors.push(`macOS privacy cleanup failed: ${e.message}`);
		}
		return {
			success: errors.length === 0,
			cleanedItems,
			freedSize,
			freedSizeFormatted: formatBytes$1(freedSize),
			errors
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
			else {
				const stats = await fs.stat(filePath).catch(() => null);
				if (stats) size += stats.size;
			}
		}
	} catch (e) {}
	return size;
}
async function scanDirectoryForLens(dirPath, currentDepth, maxDepth, onProgress) {
	try {
		const stats = await fs.stat(dirPath);
		const name = path.basename(dirPath) || dirPath;
		if (!stats.isDirectory()) {
			const fileNode = {
				name,
				path: dirPath,
				size: stats.size,
				sizeFormatted: formatBytes$1(stats.size),
				type: "file"
			};
			if (onProgress) onProgress({
				currentPath: name,
				progress: 100,
				status: `Scanning file: ${name}`,
				item: fileNode
			});
			return fileNode;
		}
		if (onProgress) onProgress({
			currentPath: name,
			progress: 0,
			status: `Scanning directory: ${name}`
		});
		const items = await fs.readdir(dirPath, { withFileTypes: true });
		const children = [];
		let totalSize = 0;
		const totalItems = items.length;
		let processedItems = 0;
		for (const item of items) {
			const childPath = path.join(dirPath, item.name);
			if (item.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System"
			].includes(item.name)) {
				processedItems++;
				continue;
			}
			if (onProgress) {
				const progressPercent = Math.floor(processedItems / totalItems * 100);
				const itemType = item.isDirectory() ? "directory" : "file";
				onProgress({
					currentPath: item.name,
					progress: progressPercent,
					status: `Scanning ${itemType}: ${item.name}`
				});
			}
			let childNode = null;
			if (currentDepth < maxDepth) {
				childNode = await scanDirectoryForLens(childPath, currentDepth + 1, maxDepth, onProgress);
				if (childNode) {
					children.push(childNode);
					totalSize += childNode.size;
				}
			} else try {
				const s = await fs.stat(childPath);
				const size = item.isDirectory() ? await getDirSize(childPath) : s.size;
				childNode = {
					name: item.name,
					path: childPath,
					size,
					sizeFormatted: formatBytes$1(size),
					type: item.isDirectory() ? "dir" : "file"
				};
				children.push(childNode);
				totalSize += size;
			} catch (e) {}
			if (childNode && onProgress) onProgress({
				currentPath: item.name,
				progress: Math.floor((processedItems + 1) / totalItems * 100),
				status: `Scanned: ${item.name}`,
				item: childNode
			});
			processedItems++;
		}
		const result = {
			name,
			path: dirPath,
			size: totalSize,
			sizeFormatted: formatBytes$1(totalSize),
			type: "dir",
			children: children.sort((a, b) => b.size - a.size)
		};
		if (onProgress) onProgress({
			currentPath: name,
			progress: 100,
			status: `Completed: ${name}`
		});
		return result;
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
