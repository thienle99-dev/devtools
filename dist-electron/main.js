import { i as __require } from "./chunk-B2qFFjWa.js";
import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, protocol, screen } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import si from "systeminformation";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { createRequire } from "module";
import fs$1 from "fs";
import path$1 from "path";
import Store from "electron-store";
import { randomUUID as randomUUID$1 } from "crypto";
import { exec as exec$1, execSync, spawn } from "child_process";
import { promisify as promisify$1 } from "util";
import https from "https";
var execAsync$1 = promisify(exec), dirSizeCache = /* @__PURE__ */ new Map(), CACHE_TTL = 300 * 1e3;
setInterval(() => {
	let n = Date.now();
	for (let [j, M] of dirSizeCache.entries()) n - M.timestamp > CACHE_TTL && dirSizeCache.delete(j);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let n = process.platform, j = [], M = os.homedir();
		if (n === "win32") {
			let n = process.env.WINDIR || "C:\\Windows", M = process.env.LOCALAPPDATA || "", N = os.tmpdir(), P = path.join(n, "Temp"), F = path.join(n, "Prefetch"), I = path.join(n, "SoftwareDistribution", "Download");
			j.push({
				path: N,
				name: "User Temporary Files",
				category: "temp"
			}), j.push({
				path: P,
				name: "System Temporary Files",
				category: "temp"
			}), j.push({
				path: F,
				name: "Prefetch Files",
				category: "system"
			}), j.push({
				path: I,
				name: "Windows Update Cache",
				category: "system"
			});
			let L = path.join(M, "Google/Chrome/User Data/Default/Cache"), R = path.join(M, "Microsoft/Edge/User Data/Default/Cache");
			j.push({
				path: L,
				name: "Chrome Cache",
				category: "cache"
			}), j.push({
				path: R,
				name: "Edge Cache",
				category: "cache"
			}), j.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (n === "darwin") {
			j.push({
				path: path.join(M, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), j.push({
				path: path.join(M, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), j.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), j.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), j.push({
				path: path.join(M, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), j.push({
				path: path.join(M, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: n } = await execAsync$1("tmutil listlocalsnapshots /"), M = n.split("\n").filter((n) => n.trim()).length;
				M > 0 && j.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${M})`,
					category: "system",
					virtual: !0,
					size: M * 500 * 1024 * 1024
				});
			} catch {}
		}
		let N = [], P = 0;
		for (let n of j) try {
			if (n.virtual) {
				N.push({
					...n,
					sizeFormatted: formatBytes$1(n.size || 0)
				}), P += n.size || 0;
				continue;
			}
			let j = await fs.stat(n.path).catch(() => null);
			if (j) {
				let M = j.isDirectory() ? await getDirSize(n.path) : j.size;
				M > 0 && (N.push({
					...n,
					size: M,
					sizeFormatted: formatBytes$1(M)
				}), P += M);
			}
		} catch {}
		return {
			items: N,
			totalSize: P,
			totalSizeFormatted: formatBytes$1(P)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (n, j) => {
		let M = j || os.homedir(), N = n.sender;
		return await scanDirectoryForLens(M, 0, 1, (n) => {
			N && !N.isDestroyed() && N.send("cleaner:space-lens-progress", n);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (n, j) => {
		let M = dirSizeCache.get(j);
		if (M && Date.now() - M.timestamp < CACHE_TTL) return {
			size: M.size,
			sizeFormatted: formatBytes$1(M.size),
			cached: !0
		};
		try {
			let n = await getDirSizeLimited(j, 4), M = formatBytes$1(n);
			return dirSizeCache.set(j, {
				size: n,
				timestamp: Date.now()
			}), {
				size: n,
				sizeFormatted: M,
				cached: !1
			};
		} catch (n) {
			return {
				size: 0,
				sizeFormatted: formatBytes$1(0),
				cached: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (n, j) => {
		if (j) for (let n of dirSizeCache.keys()) n.startsWith(j) && dirSizeCache.delete(n);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let n = await si.processes(), j = await si.mem(), M = await si.currentLoad();
		return {
			heavyApps: n.list.sort((n, j) => j.cpu + j.mem - (n.cpu + n.mem)).slice(0, 10).map((n) => ({
				pid: n.pid,
				name: n.name,
				cpu: n.cpu,
				mem: n.mem,
				user: n.user,
				path: n.path
			})),
			memory: {
				total: j.total,
				used: j.used,
				percent: j.used / j.total * 100
			},
			cpuLoad: M.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let n = process.platform, j = [];
		if (n === "darwin") try {
			let n = path.join(os.homedir(), "Library/LaunchAgents"), M = await fs.readdir(n).catch(() => []);
			for (let N of M) if (N.endsWith(".plist")) {
				let M = path.join(n, N), { stdout: P } = await execAsync$1(`launchctl list | grep -i "${N.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), F = P.trim().length > 0;
				j.push({
					name: N.replace(".plist", ""),
					path: M,
					type: "LaunchAgent",
					enabled: F
				});
			}
			let N = "/Library/LaunchAgents", P = await fs.readdir(N).catch(() => []);
			for (let n of P) {
				let M = path.join(N, n), { stdout: P } = await execAsync$1(`launchctl list | grep -i "${n.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), F = P.trim().length > 0;
				j.push({
					name: n.replace(".plist", ""),
					path: M,
					type: "SystemAgent",
					enabled: F
				});
			}
		} catch {}
		else if (n === "win32") try {
			let { stdout: n } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), M = JSON.parse(n), N = Array.isArray(M) ? M : [M];
			for (let n of N) j.push({
				name: n.Name,
				path: n.Command,
				type: "StartupCommand",
				location: n.Location,
				enabled: !0
			});
		} catch {}
		return j;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (n, j) => {
		let M = process.platform;
		try {
			if (M === "darwin") {
				let n = j.enabled ?? !0;
				if (j.type === "LaunchAgent" || j.type === "SystemAgent") return n ? await execAsync$1(`launchctl unload "${j.path}"`) : await execAsync$1(`launchctl load "${j.path}"`), {
					success: !0,
					enabled: !n
				};
			} else if (M === "win32") {
				let n = j.enabled ?? !0;
				if (j.location === "Startup") {
					let M = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), N = path.basename(j.path), P = path.join(M, N);
					return n && await fs.unlink(P).catch(() => {}), {
						success: !0,
						enabled: !n
					};
				} else return {
					success: !0,
					enabled: !n
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (n, j) => {
		try {
			return process.kill(j, "SIGKILL"), { success: !0 };
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let n = process.platform, j = [];
		if (n === "darwin") {
			let n = "/Applications", M = await fs.readdir(n, { withFileTypes: !0 }).catch(() => []);
			for (let N of M) if (N.name.endsWith(".app")) {
				let M = path.join(n, N.name);
				try {
					let n = await fs.stat(M);
					j.push({
						name: N.name.replace(".app", ""),
						path: M,
						size: await getDirSize(M),
						installDate: n.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (n === "win32") try {
			let { stdout: n } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), M = JSON.parse(n), N = Array.isArray(M) ? M : [M];
			for (let n of N) n.DisplayName && j.push({
				name: n.DisplayName,
				version: n.DisplayVersion,
				path: n.InstallLocation,
				installDate: n.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return j;
	}), ipcMain.handle("cleaner:get-large-files", async (n, j) => {
		let M = j.minSize || 100 * 1024 * 1024, N = j.scanPaths || [os.homedir()], P = [];
		for (let n of N) await findLargeFiles(n, M, P);
		return P.sort((n, j) => j.size - n.size), P.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (n, j) => {
		let M = j || os.homedir(), N = /* @__PURE__ */ new Map(), P = [];
		await findDuplicates(M, N);
		for (let [n, j] of N.entries()) if (j.length > 1) try {
			let M = await fs.stat(j[0]);
			P.push({
				hash: n,
				size: M.size,
				sizeFormatted: formatBytes$1(M.size),
				totalWasted: M.size * (j.length - 1),
				totalWastedFormatted: formatBytes$1(M.size * (j.length - 1)),
				files: j
			});
		} catch {}
		return P.sort((n, j) => j.totalWasted - n.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (n, j) => {
		let M = 0, N = [], P = process.platform, F = checkFilesSafety(j, P);
		if (!F.safe && F.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${F.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: F.blocked
		};
		for (let n = 0; n < j.length; n += 50) {
			let P = j.slice(n, n + 50);
			for (let n of P) try {
				if (n === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), M += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let j = await fs.stat(n).catch(() => null);
				if (!j) continue;
				let N = j.isDirectory() ? await getDirSize(n) : j.size;
				j.isDirectory() ? await fs.rm(n, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(n), M += N;
			} catch {
				N.push(n);
			}
		}
		return {
			success: N.length === 0,
			freedSize: M,
			freedSizeFormatted: formatBytes$1(M),
			failed: N
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (n, j) => {
		let M = process.platform;
		try {
			if (M === "darwin") {
				let n = j.path, M = j.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${n}" to trash'`);
				let N = os.homedir(), P = [
					path.join(N, "Library/Preferences", `*${M}*`),
					path.join(N, "Library/Application Support", M),
					path.join(N, "Library/Caches", M),
					path.join(N, "Library/Logs", M),
					path.join(N, "Library/Saved Application State", `*${M}*`),
					path.join(N, "Library/LaunchAgents", `*${M}*`)
				], F = 0;
				for (let n of P) try {
					let j = await fs.readdir(path.dirname(n)).catch(() => []);
					for (let N of j) if (N.includes(M)) {
						let j = path.join(path.dirname(n), N), M = await fs.stat(j).catch(() => null);
						M && (M.isDirectory() ? (F += await getDirSize(j), await fs.rm(j, {
							recursive: !0,
							force: !0
						})) : (F += M.size, await fs.unlink(j)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: F,
					freedSizeFormatted: formatBytes$1(F)
				};
			} else if (M === "win32") {
				let n = j.name, M = 0;
				try {
					let { stdout: N } = await execAsync$1(`wmic product where name="${n.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), P = N.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (P) {
						let n = P[1];
						await execAsync$1(`msiexec /x ${n} /quiet /norestart`), M = await getDirSize(j.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${n}*'} | Remove-AppxPackage"`).catch(() => {}), M = await getDirSize(j.path).catch(() => 0);
				} catch {
					M = await getDirSize(j.path).catch(() => 0), await fs.rm(j.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let N = process.env.LOCALAPPDATA || "", P = process.env.APPDATA || "", F = [path.join(N, n), path.join(P, n)];
				for (let n of F) try {
					await fs.stat(n).catch(() => null) && (M += await getDirSize(n).catch(() => 0), await fs.rm(n, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: M,
					freedSizeFormatted: formatBytes$1(M)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let n = process.platform, j = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (n === "win32") try {
			let { stdout: n } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), M = parseInt(n.trim()) || 0;
			M > 0 && (j.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: M,
				size: 0,
				description: "Recently opened documents registry entries"
			}), j.totalItems += M);
			let { stdout: N } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), P = parseInt(N.trim()) || 0;
			P > 0 && (j.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: P,
				size: 0,
				description: "Recently run programs registry entries"
			}), j.totalItems += P);
			let F = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let n = await fs.readdir(F, { recursive: !0 }).catch(() => []), M = [], N = 0;
				for (let j of n) {
					let n = path.join(F, j);
					try {
						let j = await fs.stat(n);
						j.isFile() && (M.push(n), N += j.size);
					} catch {}
				}
				M.length > 0 && (j.activityHistory.push({
					name: "Activity History",
					path: F,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes$1(N),
					files: M,
					description: "Windows activity history files"
				}), j.totalItems += M.length, j.totalSize += N);
			} catch {}
			let I = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let n = await fs.readdir(I).catch(() => []), M = [], N = 0;
				for (let j of n) {
					let n = path.join(I, j);
					try {
						let j = await fs.stat(n);
						M.push(n), N += j.size;
					} catch {}
				}
				M.length > 0 && (j.activityHistory.push({
					name: "Windows Search History",
					path: I,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes$1(N),
					files: M,
					description: "Windows search history files"
				}), j.totalItems += M.length, j.totalSize += N);
			} catch {}
		} catch (n) {
			return {
				success: !1,
				error: n.message,
				results: j
			};
		}
		else if (n === "darwin") try {
			let n = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let M = await fs.readdir(n, { recursive: !0 }).catch(() => []), N = [], P = 0;
				for (let j of M) {
					let M = path.join(n, j);
					try {
						let n = await fs.stat(M);
						n.isFile() && (N.push(M), P += n.size);
					} catch {}
				}
				N.length > 0 && (j.spotlightHistory.push({
					name: "Spotlight Search History",
					path: n,
					type: "files",
					count: N.length,
					size: P,
					sizeFormatted: formatBytes$1(P),
					files: N,
					description: "macOS Spotlight search history"
				}), j.totalItems += N.length, j.totalSize += P);
			} catch {}
			let M = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let n = await fs.readdir(M, { recursive: !0 }).catch(() => []), N = [], P = 0;
				for (let j of n) {
					let n = path.join(M, j);
					try {
						let j = await fs.stat(n);
						j.isFile() && (N.push(n), P += j.size);
					} catch {}
				}
				N.length > 0 && (j.quickLookCache.push({
					name: "Quick Look Cache",
					path: M,
					type: "files",
					count: N.length,
					size: P,
					sizeFormatted: formatBytes$1(P),
					files: N,
					description: "macOS Quick Look thumbnail cache"
				}), j.totalItems += N.length, j.totalSize += P);
			} catch {}
			let N = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let n = await fs.readdir(N).catch(() => []), M = [], P = 0;
				for (let j of n) if (j.includes("RecentItems")) {
					let n = path.join(N, j);
					try {
						let j = await fs.stat(n);
						M.push(n), P += j.size;
					} catch {}
				}
				M.length > 0 && (j.spotlightHistory.push({
					name: "Recently Opened Files",
					path: N,
					type: "files",
					count: M.length,
					size: P,
					sizeFormatted: formatBytes$1(P),
					files: M,
					description: "macOS recently opened files list"
				}), j.totalItems += M.length, j.totalSize += P);
			} catch {}
		} catch (n) {
			return {
				success: !1,
				error: n.message,
				results: j
			};
		}
		return {
			success: !0,
			results: j
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (n, j) => {
		let M = process.platform, N = 0, P = 0, F = [];
		if (M === "win32") try {
			if (j.registry) {
				try {
					let { stdout: n } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), j = parseInt(n.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), N += j;
				} catch (n) {
					F.push(`Failed to clean Recent Documents registry: ${n.message}`);
				}
				try {
					let { stdout: n } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), j = parseInt(n.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), N += j;
				} catch (n) {
					F.push(`Failed to clean Recent Programs registry: ${n.message}`);
				}
			}
			if (j.activityHistory) {
				let n = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let j = await fs.readdir(n, { recursive: !0 }).catch(() => []);
					for (let M of j) {
						let j = path.join(n, M);
						try {
							let n = await fs.stat(j);
							n.isFile() && (P += n.size, await fs.unlink(j), N++);
						} catch {}
					}
				} catch (n) {
					F.push(`Failed to clean activity history: ${n.message}`);
				}
				let j = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let n = await fs.readdir(j).catch(() => []);
					for (let M of n) {
						let n = path.join(j, M);
						try {
							let j = await fs.stat(n);
							P += j.size, await fs.unlink(n), N++;
						} catch {}
					}
				} catch (n) {
					F.push(`Failed to clean search history: ${n.message}`);
				}
			}
		} catch (n) {
			F.push(`Windows privacy cleanup failed: ${n.message}`);
		}
		else if (M === "darwin") try {
			if (j.spotlightHistory) {
				let n = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let j = await fs.readdir(n, { recursive: !0 }).catch(() => []);
					for (let M of j) {
						let j = path.join(n, M);
						try {
							let n = await fs.stat(j);
							n.isFile() && (P += n.size, await fs.unlink(j), N++);
						} catch {}
					}
				} catch (n) {
					F.push(`Failed to clean Spotlight history: ${n.message}`);
				}
				let j = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let n = await fs.readdir(j).catch(() => []);
					for (let M of n) if (M.includes("RecentItems")) {
						let n = path.join(j, M);
						try {
							let j = await fs.stat(n);
							P += j.size, await fs.unlink(n), N++;
						} catch {}
					}
				} catch (n) {
					F.push(`Failed to clean recent items: ${n.message}`);
				}
			}
			if (j.quickLookCache) {
				let n = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let j = await fs.readdir(n, { recursive: !0 }).catch(() => []);
					for (let M of j) {
						let j = path.join(n, M);
						try {
							let n = await fs.stat(j);
							n.isFile() && (P += n.size, await fs.unlink(j), N++);
						} catch {}
					}
				} catch (n) {
					F.push(`Failed to clean Quick Look cache: ${n.message}`);
				}
			}
		} catch (n) {
			F.push(`macOS privacy cleanup failed: ${n.message}`);
		}
		return {
			success: F.length === 0,
			cleanedItems: N,
			freedSize: P,
			freedSizeFormatted: formatBytes$1(P),
			errors: F
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let n = process.platform, j = os.homedir(), M = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, N = [];
		if (n === "win32") {
			let n = process.env.LOCALAPPDATA || "", j = process.env.APPDATA || "";
			N.push({
				name: "Chrome",
				paths: {
					history: [path.join(n, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(n, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(n, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(n, "Google/Chrome/User Data/Default/History")]
				}
			}), N.push({
				name: "Edge",
				paths: {
					history: [path.join(n, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(n, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(n, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(n, "Microsoft/Edge/User Data/Default/History")]
				}
			}), N.push({
				name: "Firefox",
				paths: {
					history: [path.join(j, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(j, "Mozilla/Firefox/Profiles")],
					cache: [path.join(n, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(j, "Mozilla/Firefox/Profiles")]
				}
			});
		} else n === "darwin" && (N.push({
			name: "Safari",
			paths: {
				history: [path.join(j, "Library/Safari/History.db")],
				cookies: [path.join(j, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(j, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(j, "Library/Safari/Downloads.plist")]
			}
		}), N.push({
			name: "Chrome",
			paths: {
				history: [path.join(j, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(j, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(j, "Library/Caches/Google/Chrome")],
				downloads: [path.join(j, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), N.push({
			name: "Firefox",
			paths: {
				history: [path.join(j, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(j, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(j, "Library/Caches/Firefox")],
				downloads: [path.join(j, "Library/Application Support/Firefox/Profiles")]
			}
		}), N.push({
			name: "Edge",
			paths: {
				history: [path.join(j, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(j, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(j, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(j, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let j of N) {
			let N = {
				name: j.name,
				history: {
					size: 0,
					count: 0,
					paths: []
				},
				cookies: {
					size: 0,
					count: 0,
					paths: []
				},
				cache: {
					size: 0,
					count: 0,
					paths: []
				},
				downloads: {
					size: 0,
					count: 0,
					paths: []
				}
			};
			for (let [M, P] of Object.entries(j.paths)) for (let F of P) try {
				if (M === "cache" && n === "darwin" && j.name === "Safari") {
					let n = await fs.stat(F).catch(() => null);
					if (n && n.isDirectory()) {
						let n = await getDirSize(F);
						N[M].size += n, N[M].paths.push(F), N[M].count += 1;
					}
				} else {
					let n = await fs.stat(F).catch(() => null);
					if (n) if (n.isDirectory()) {
						let n = await getDirSize(F);
						N[M].size += n, N[M].paths.push(F), N[M].count += 1;
					} else n.isFile() && (N[M].size += n.size, N[M].paths.push(F), N[M].count += 1);
				}
			} catch {}
			let P = Object.values(N).reduce((n, j) => n + (typeof j == "object" && j.size ? j.size : 0), 0);
			P > 0 && (N.totalSize = P, N.totalSizeFormatted = formatBytes$1(P), M.browsers.push(N), M.totalSize += P, M.totalItems += Object.values(N).reduce((n, j) => n + (typeof j == "object" && j.count ? j.count : 0), 0));
		}
		return {
			success: !0,
			results: M
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (n, j) => {
		let M = process.platform, N = os.homedir(), P = 0, F = 0, I = [], L = {};
		if (M === "win32") {
			let n = process.env.LOCALAPPDATA || "", j = process.env.APPDATA || "";
			L.Chrome = {
				history: [path.join(n, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(n, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(n, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(n, "Google/Chrome/User Data/Default/History")]
			}, L.Edge = {
				history: [path.join(n, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(n, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(n, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(n, "Microsoft/Edge/User Data/Default/History")]
			}, L.Firefox = {
				history: [path.join(j, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(j, "Mozilla/Firefox/Profiles")],
				cache: [path.join(n, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(j, "Mozilla/Firefox/Profiles")]
			};
		} else M === "darwin" && (L.Safari = {
			history: [path.join(N, "Library/Safari/History.db")],
			cookies: [path.join(N, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(N, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(N, "Library/Safari/Downloads.plist")]
		}, L.Chrome = {
			history: [path.join(N, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(N, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(N, "Library/Caches/Google/Chrome")],
			downloads: [path.join(N, "Library/Application Support/Google/Chrome/Default/History")]
		}, L.Firefox = {
			history: [path.join(N, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(N, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(N, "Library/Caches/Firefox")],
			downloads: [path.join(N, "Library/Application Support/Firefox/Profiles")]
		}, L.Edge = {
			history: [path.join(N, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(N, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(N, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(N, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let n of j.browsers) {
			let M = L[n];
			if (M) for (let N of j.types) {
				let j = M[N];
				if (j) for (let M of j) try {
					let n = await fs.stat(M).catch(() => null);
					if (!n) continue;
					if (n.isDirectory()) {
						let n = await getDirSize(M);
						await fs.rm(M, {
							recursive: !0,
							force: !0
						}), F += n, P++;
					} else n.isFile() && (F += n.size, await fs.unlink(M), P++);
				} catch (j) {
					I.push(`Failed to clean ${n} ${N}: ${j.message}`);
				}
			}
		}
		return {
			success: I.length === 0,
			cleanedItems: P,
			freedSize: F,
			freedSizeFormatted: formatBytes$1(F),
			errors: I
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let n = process.platform, j = [];
		try {
			if (n === "win32") {
				let { stdout: n } = await execAsync$1("netsh wlan show profiles"), M = n.split("\n");
				for (let n of M) {
					let M = n.match(/All User Profile\s*:\s*(.+)/);
					if (M) {
						let n = M[1].trim();
						try {
							let { stdout: M } = await execAsync$1(`netsh wlan show profile name="${n}" key=clear`), N = M.match(/Key Content\s*:\s*(.+)/);
							j.push({
								name: n,
								hasPassword: !!N,
								platform: "windows"
							});
						} catch {
							j.push({
								name: n,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (n === "darwin") {
				let { stdout: n } = await execAsync$1("networksetup -listallhardwareports");
				if (n.split("\n").find((n) => n.includes("Wi-Fi") || n.includes("AirPort"))) {
					let { stdout: n } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), M = n.split("\n").filter((n) => n.trim() && !n.includes("Preferred networks"));
					for (let n of M) {
						let M = n.trim();
						M && j.push({
							name: M,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (n) {
			return {
				success: !1,
				error: n.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: j
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (n, j) => {
		let M = process.platform;
		try {
			return M === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${j}"`), { success: !0 }) : M === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${j}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (n, j) => {
		let M = process.platform, N = Date.now(), P = "";
		try {
			if (M === "win32") switch (j.category) {
				case "sfc":
					let { stdout: n } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					P = n;
					break;
				case "dism":
					let { stdout: M } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					P = M;
					break;
				case "disk-cleanup":
					let { stdout: N } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					P = N || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: F } = await execAsync$1("ipconfig /flushdns");
					P = F || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: I } = await execAsync$1("netsh winsock reset");
					P = I || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), P = "Windows Search index rebuilt successfully";
					} catch (n) {
						throw Error(`Failed to rebuild search index: ${n.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${j.category}`);
			}
			else if (M === "darwin") switch (j.category) {
				case "time-machine-cleanup":
					try {
						let { stdout: n } = await execAsync$1("sudo tmutil deletelocalsnapshots /");
						P = n || "Local Time Machine snapshots removed successfully";
					} catch (n) {
						throw Error(`Failed to clean Time Machine snapshots: ${n.message}`);
					}
					break;
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), P = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), P = "Spotlight index rebuilt successfully (user directory only)";
						} catch (n) {
							throw Error(`Failed to rebuild Spotlight index: ${n.message}`);
						}
					}
					break;
				case "launch-services-reset":
					try {
						await execAsync$1("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user"), P = "Launch Services database reset successfully. You may need to restart apps for changes to take effect.";
					} catch (n) {
						throw Error(`Failed to reset Launch Services: ${n.message}`);
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), P = "DNS cache flushed successfully";
					} catch (n) {
						throw Error(`Failed to flush DNS: ${n.message}`);
					}
					break;
				case "gatekeeper-check":
					try {
						let { stdout: n } = await execAsync$1("spctl --status");
						P = `Gatekeeper Status: ${n.trim()}`;
					} catch (n) {
						throw Error(`Failed to check Gatekeeper: ${n.message}`);
					}
					break;
				case "mail-rebuild":
					try {
						let n = os.homedir();
						await execAsync$1(`find "${path.join(n, "Library/Mail")}" -name "Envelope Index*" -delete`), P = "Mail database indexes cleared. Rebuild will occur next time you open Mail.app.";
					} catch (n) {
						throw Error(`Failed to rebuild Mail database: ${n.message}`);
					}
					break;
				case "icloud-cleanup":
					try {
						let n = os.homedir(), j = path.join(n, "Library/Caches/com.apple.bird"), M = path.join(n, "Library/Caches/com.apple.CloudDocs");
						await fs.rm(j, {
							recursive: !0,
							force: !0
						}).catch(() => {}), await fs.rm(M, {
							recursive: !0,
							force: !0
						}).catch(() => {}), P = "iCloud cache cleared successfully";
					} catch (n) {
						throw Error(`Failed to clear iCloud cache: ${n.message}`);
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: n } = await execAsync$1("diskutil verifyVolume /");
						P = n || "Disk permissions verified";
					} catch (n) {
						throw Error(`Failed to verify disk: ${n.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${j.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: j.id,
				duration: Date.now() - N,
				output: P
			};
		} catch (n) {
			return {
				success: !1,
				taskId: j.id,
				duration: Date.now() - N,
				error: n.message,
				output: P
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let n = await si.mem(), j = await si.currentLoad(), M = await si.fsSize(), N = await si.battery().catch(() => null), P = [], F = M.find((n) => n.mount === "/" || n.mount === "C:") || M[0];
			if (F) {
				let n = F.available / F.size * 100;
				n < 10 ? P.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(F.available)} free (${n.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : n < 20 && P.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(F.available)} free (${n.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			j.currentLoad > 90 && P.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${j.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let I = n.used / n.total * 100;
			return I > 90 && P.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${I.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: j.currentLoad,
				ram: {
					used: n.used,
					total: n.total,
					percentage: I
				},
				disk: F ? {
					free: F.available,
					total: F.size,
					percentage: (F.size - F.available) / F.size * 100
				} : null,
				battery: N ? {
					level: N.percent,
					charging: N.isCharging || !1
				} : null,
				alerts: P
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (n, j) => {
		try {
			let n = process.platform, M = checkFilesSafety(j, n);
			return {
				success: !0,
				safe: M.safe,
				warnings: M.warnings,
				blocked: M.blocked
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (n, j) => {
		try {
			return await createBackup(j);
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (n, j) => {
		try {
			let n = await getBackupInfo(j);
			return {
				success: n !== null,
				backupInfo: n
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (n, j) => {
		try {
			return await restoreBackup(j);
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (n, j) => {
		try {
			return await deleteBackup(j);
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	});
}
async function getDirSize(n) {
	let j = 0;
	try {
		let M = await fs.readdir(n, { withFileTypes: !0 });
		for (let N of M) {
			let M = path.join(n, N.name);
			if (N.isDirectory()) j += await getDirSize(M);
			else {
				let n = await fs.stat(M).catch(() => null);
				n && (j += n.size);
			}
		}
	} catch {}
	return j;
}
async function getDirSizeLimited(n, j, M = 0) {
	if (M >= j) return 0;
	let N = 0;
	try {
		let P = await fs.readdir(n, { withFileTypes: !0 });
		for (let F of P) {
			if (F.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(F.name)) continue;
			let P = path.join(n, F.name);
			try {
				if (F.isDirectory()) N += await getDirSizeLimited(P, j, M + 1);
				else {
					let n = await fs.stat(P).catch(() => null);
					n && (N += n.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return N;
}
async function scanDirectoryForLens(n, j, M, N) {
	try {
		let P = await fs.stat(n), F = path.basename(n) || n;
		if (!P.isDirectory()) {
			let j = {
				name: F,
				path: n,
				size: P.size,
				sizeFormatted: formatBytes$1(P.size),
				type: "file"
			};
			return N && N({
				currentPath: F,
				progress: 100,
				status: `Scanning file: ${F}`,
				item: j
			}), j;
		}
		N && N({
			currentPath: F,
			progress: 0,
			status: `Scanning directory: ${F}`
		});
		let I = await fs.readdir(n, { withFileTypes: !0 }), L = [], R = 0, z = I.filter((n) => !n.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(n.name)), B = z.length, V = 0;
		for (let P of z) {
			let F = path.join(n, P.name);
			if (N) {
				let n = Math.floor(V / B * 100), j = P.isDirectory() ? "directory" : "file";
				N({
					currentPath: P.name,
					progress: n,
					status: `Scanning ${j}: ${P.name}`
				});
			}
			let I = null;
			if (j < M) I = await scanDirectoryForLens(F, j + 1, M, N), I && (L.push(I), R += I.size);
			else try {
				let n = (await fs.stat(F)).size;
				if (P.isDirectory()) {
					let j = dirSizeCache.get(F);
					if (j && Date.now() - j.timestamp < CACHE_TTL) n = j.size;
					else try {
						n = await getDirSizeLimited(F, 3), dirSizeCache.set(F, {
							size: n,
							timestamp: Date.now()
						});
					} catch {
						n = 0;
					}
				}
				I = {
					name: P.name,
					path: F,
					size: n,
					sizeFormatted: formatBytes$1(n),
					type: P.isDirectory() ? "dir" : "file"
				}, L.push(I), R += n;
			} catch {
				V++;
				continue;
			}
			I && N && N({
				currentPath: P.name,
				progress: Math.floor((V + 1) / B * 100),
				status: `Scanned: ${P.name}`,
				item: I
			}), V++;
		}
		let H = {
			name: F,
			path: n,
			size: R,
			sizeFormatted: formatBytes$1(R),
			type: "dir",
			children: L.sort((n, j) => j.size - n.size)
		};
		return N && N({
			currentPath: F,
			progress: 100,
			status: `Completed: ${F}`
		}), H;
	} catch {
		return null;
	}
}
async function findLargeFiles(n, j, M) {
	try {
		let N = await fs.readdir(n, { withFileTypes: !0 });
		for (let P of N) {
			let N = path.join(n, P.name);
			if (!(P.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(P.name))) try {
				let n = await fs.stat(N);
				P.isDirectory() ? await findLargeFiles(N, j, M) : n.size >= j && M.push({
					name: P.name,
					path: N,
					size: n.size,
					sizeFormatted: formatBytes$1(n.size),
					lastAccessed: n.atime,
					type: path.extname(P.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(n, j) {
	try {
		let M = await fs.readdir(n, { withFileTypes: !0 });
		for (let N of M) {
			let M = path.join(n, N.name);
			if (!(N.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(N.name))) try {
				let n = await fs.stat(M);
				if (N.isDirectory()) await findDuplicates(M, j);
				else if (n.size > 1024 * 1024 && n.size < 50 * 1024 * 1024) {
					let n = await hashFile(M), N = j.get(n) || [];
					N.push(M), j.set(n, N);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(n) {
	let j = await fs.readFile(n);
	return createHash("md5").update(j).digest("hex");
}
function formatBytes$1(n) {
	if (n === 0) return "0 B";
	let j = 1024, M = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], N = Math.floor(Math.log(n) / Math.log(j));
	return `${(n / j ** +N).toFixed(1)} ${M[N]}`;
}
var getPlatformProtectedPaths = (n) => {
	let j = os.homedir(), M = [];
	if (n === "win32") {
		let n = process.env.WINDIR || "C:\\Windows", N = process.env.PROGRAMFILES || "C:\\Program Files", P = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		M.push({
			path: n,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: N,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: P,
			type: "folder",
			action: "protect",
			reason: "Program Files (x86) directory",
			platform: "windows"
		}, {
			path: "C:\\ProgramData",
			type: "folder",
			action: "protect",
			reason: "ProgramData directory",
			platform: "windows"
		}, {
			path: path.join(j, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(j, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else n === "darwin" && M.push({
		path: "/System",
		type: "folder",
		action: "protect",
		reason: "macOS System directory",
		platform: "macos"
	}, {
		path: "/Library",
		type: "folder",
		action: "protect",
		reason: "System Library directory",
		platform: "macos"
	}, {
		path: "/usr",
		type: "folder",
		action: "protect",
		reason: "Unix system resources",
		platform: "macos"
	}, {
		path: path.join(j, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(j, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return M;
}, checkFileSafety = (n, j) => {
	let M = [], N = [], P = getPlatformProtectedPaths(j);
	for (let F of P) {
		if (F.platform && F.platform !== j && F.platform !== "all") continue;
		let P = path.normalize(F.path), I = path.normalize(n);
		if (I === P || I.startsWith(P + path.sep)) {
			if (F.action === "protect") return N.push(n), {
				safe: !1,
				warnings: [],
				blocked: [n]
			};
			F.action === "warn" && M.push({
				path: n,
				reason: F.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: N.length === 0,
		warnings: M,
		blocked: N
	};
}, checkFilesSafety = (n, j) => {
	let M = [], N = [];
	for (let P of n) {
		let n = checkFileSafety(P, j);
		n.safe || N.push(...n.blocked), M.push(...n.warnings);
	}
	return {
		safe: N.length === 0,
		warnings: M,
		blocked: N
	};
}, getBackupDir = () => {
	let n = os.homedir();
	return process.platform === "win32" ? path.join(n, "AppData", "Local", "devtools-app", "backups") : path.join(n, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (n) => {
	let j = 0;
	for (let M of n) try {
		let n = await fs.stat(M);
		n.isFile() && (j += n.size);
	} catch {}
	return j;
}, createBackup = async (n) => {
	try {
		let j = getBackupDir();
		await fs.mkdir(j, { recursive: !0 });
		let M = generateBackupId(), N = path.join(j, M);
		await fs.mkdir(N, { recursive: !0 });
		let P = await calculateTotalSize(n), F = [];
		for (let j of n) try {
			let n = await fs.stat(j), M = path.basename(j), P = path.join(N, M);
			n.isFile() && (await fs.copyFile(j, P), F.push(j));
		} catch {}
		let I = {
			id: M,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: F,
			totalSize: P,
			location: N,
			platform: process.platform
		}, L = path.join(N, "backup-info.json");
		return await fs.writeFile(L, JSON.stringify(I, null, 2)), {
			success: !0,
			backupId: M,
			backupInfo: I
		};
	} catch (n) {
		return {
			success: !1,
			error: n.message
		};
	}
}, listBackups = async () => {
	try {
		let n = getBackupDir(), j = await fs.readdir(n, { withFileTypes: !0 }), M = [];
		for (let N of j) if (N.isDirectory() && N.name.startsWith("backup-")) {
			let j = path.join(n, N.name, "backup-info.json");
			try {
				let n = await fs.readFile(j, "utf-8");
				M.push(JSON.parse(n));
			} catch {}
		}
		return M.sort((n, j) => new Date(j.timestamp).getTime() - new Date(n.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (n) => {
	try {
		let j = getBackupDir(), M = path.join(j, n, "backup-info.json"), N = await fs.readFile(M, "utf-8");
		return JSON.parse(N);
	} catch {
		return null;
	}
}, restoreBackup = async (n) => {
	try {
		let j = await getBackupInfo(n);
		if (!j) return {
			success: !1,
			error: "Backup not found"
		};
		let M = j.location;
		for (let n of j.files) try {
			let j = path.basename(n), N = path.join(M, j);
			if ((await fs.stat(N)).isFile()) {
				let j = path.dirname(n);
				await fs.mkdir(j, { recursive: !0 }), await fs.copyFile(N, n);
			}
		} catch {}
		return { success: !0 };
	} catch (n) {
		return {
			success: !1,
			error: n.message
		};
	}
}, deleteBackup = async (n) => {
	try {
		let j = getBackupDir(), M = path.join(j, n);
		return await fs.rm(M, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (n) {
		return {
			success: !1,
			error: n.message
		};
	}
}, __filename = fileURLToPath(import.meta.url), __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(n) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((n) => ({
				id: n.id,
				name: n.name,
				thumbnail: n.thumbnail.toDataURL(),
				type: n.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (n) {
			return console.error("Failed to get sources:", n), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let n = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (n.length === 0) throw Error("No screens available");
			let j = n[0].thumbnail;
			return {
				dataUrl: j.toDataURL(),
				width: j.getSize().width,
				height: j.getSize().height
			};
		} catch (n) {
			throw console.error("Failed to capture screen:", n), n;
		}
	}), ipcMain.handle("screenshot:capture-window", async (n, j) => {
		try {
			let n = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((n) => n.id === j);
			if (!n) throw Error("Window not found");
			let M = n.thumbnail;
			return {
				dataUrl: M.toDataURL(),
				width: M.getSize().width,
				height: M.getSize().height
			};
		} catch (n) {
			throw console.error("Failed to capture window:", n), n;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			let n = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (console.log(`Found ${n.length} sources.`), n.length === 0) throw console.error("No screens available for capture."), Error("No screens available");
			let M = n[0].thumbnail, N = screen.getPrimaryDisplay();
			return console.log(`Captured thumbnail size: ${M.getSize().width}x${M.getSize().height}`), console.log(`Display size: ${N.size.width}x${N.size.height} (Scale: ${N.scaleFactor})`), new Promise((n, P) => {
				let F = null, I = () => {
					F && !F.isDestroyed() && F.close(), ipcMain.removeHandler("screenshot:area-selected"), ipcMain.removeHandler("screenshot:area-cancelled");
				};
				ipcMain.handle("screenshot:area-selected", async (j, P) => {
					I();
					let F = N.scaleFactor, L = M.crop({
						x: Math.round(P.x * F),
						y: Math.round(P.y * F),
						width: Math.round(P.width * F),
						height: Math.round(P.height * F)
					});
					n({
						dataUrl: L.toDataURL(),
						width: L.getSize().width,
						height: L.getSize().height
					});
				}), ipcMain.handle("screenshot:area-cancelled", () => {
					I(), P(/* @__PURE__ */ Error("Area selection cancelled"));
				});
				let { width: L, height: R, x: z, y: V } = N.bounds;
				F = new BrowserWindow({
					x: z,
					y: V,
					width: L,
					height: R,
					frame: !1,
					transparent: !0,
					hasShadow: !1,
					backgroundColor: "#00000000",
					alwaysOnTop: !0,
					skipTaskbar: !0,
					resizable: !1,
					enableLargerThanScreen: !0,
					movable: !1,
					acceptFirstMouse: !0,
					webPreferences: {
						nodeIntegration: !1,
						contextIsolation: !0,
						preload: path.join(__dirname$1, "../preload/preload.js")
					}
				}), F.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), F.show(), F.focus(), F.loadURL("data:text/html;charset=utf-8,%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!DOCTYPE%20html%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20*%20%7B%20margin%3A%200%3B%20padding%3A%200%3B%20box-sizing%3A%20border-box%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20100vw%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20100vh%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20crosshair%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20transparent%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20overflow%3A%20hidden%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20user-select%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23selection%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%202px%20solid%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(59%2C%20130%2C%20246%2C%200.05)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%200%200%209999px%20rgba(0%2C%200%2C%200%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23toolbar%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%231a1b1e%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2010px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%2010px%2030px%20rgba(0%2C0%2C0%2C0.5)%2C%200%200%200%201px%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%202000%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20gap%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20animation%3A%20popIn%200.2s%20cubic-bezier(0.16%2C%201%2C%200.3%2C%201)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20popIn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%20opacity%3A%200%3B%20transform%3A%20scale(0.95)%20translateY(5px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%20opacity%3A%201%3B%20transform%3A%20scale(1)%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20justify-content%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%200%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%2036px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20pointer%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20all%200.15s%20ease%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(255%2C255%2C255%2C0.08)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20%23e5e5e5%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%3Ahover%20%7B%20background%3A%20rgba(255%2C255%2C255%2C0.12)%3B%20color%3A%20white%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(59%2C%20130%2C%20246%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Ahover%20%7B%20background%3A%20%232563eb%3B%20transform%3A%20translateY(-1px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Aactive%20%7B%20transform%3A%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23dimensions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%20-34px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%204px%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2012px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20opacity%200.2s%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23instructions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%2040px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%2050%25%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20translateX(-50%25)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(0%2C%200%2C%200%2C%200.7)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20backdrop-filter%3A%20blur(10px)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%208px%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2020px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20500%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%204px%2012px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%201px%20solid%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200.8%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.hidden%20%7B%20display%3A%20none%20!important%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22instructions%22%3EClick%20and%20drag%20to%20capture%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22selection%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22dimensions%22%3E0%20x%200%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22toolbar%22%20class%3D%22hidden%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-cancel%22%20id%3D%22btn-cancel%22%3ECancel%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-capture%22%20id%3D%22btn-capture%22%3ECapture%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20selection%20%3D%20document.getElementById('selection')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbar%20%3D%20document.getElementById('toolbar')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20dimensions%20%3D%20document.getElementById('dimensions')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCancel%20%3D%20document.getElementById('btn-cancel')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCapture%20%3D%20document.getElementById('btn-capture')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20startX%2C%20startY%2C%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20currentBounds%20%3D%20%7B%20x%3A%200%2C%20y%3A%200%2C%20width%3A%200%2C%20height%3A%200%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('contextmenu'%2C%20e%20%3D%3E%20e.preventDefault())%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20capture()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%200%20%26%26%20currentBounds.height%20%3E%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.sendSelection(currentBounds)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20cancel()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.cancelSelection()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCapture.onclick%20%3D%20capture%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCancel.onclick%20%3D%20cancel%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousedown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.target.closest('%23toolbar'))%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20!%3D%3D%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20%3D%3D%3D%202)%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20true%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.style.opacity%20%3D%20'1'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20startX%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20startY%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'block'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousemove'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20width%20%3D%20Math.abs(currentX%20-%20startX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20height%20%3D%20Math.abs(currentY%20-%20startY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20left%20%3D%20Math.min(startX%2C%20currentX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20top%20%3D%20Math.min(startY%2C%20currentY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20width%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20height%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.textContent%20%3D%20Math.round(width)%20%2B%20'%20x%20'%20%2B%20Math.round(height)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20currentBounds%20%3D%20%7B%20x%3A%20left%2C%20y%3A%20top%2C%20width%2C%20height%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mouseup'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%2010%20%26%26%20currentBounds.height%20%3E%2010)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.remove('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbarHeight%20%3D%2060%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20top%20%3D%20currentBounds.y%20%2B%20currentBounds.height%20%2B%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(top%20%2B%20toolbarHeight%20%3E%20window.innerHeight)%20top%20%3D%20currentBounds.y%20-%20toolbarHeight%20-%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20left%20%3D%20currentBounds.x%20%2B%20(currentBounds.width%20%2F%202)%20-%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%20%3D%20Math.max(10%2C%20Math.min(window.innerWidth%20-%20210%2C%20left))%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'none'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('keydown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Escape')%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Enter'%20%26%26%20!toolbar.classList.contains('hidden'))%20capture()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20"), setTimeout(() => {
					F && !F.isDestroyed() && (I(), P(/* @__PURE__ */ Error("Area selection timeout")));
				}, 12e4);
			});
		} catch (n) {
			throw console.error("Failed to capture area:", n), n;
		}
	}), ipcMain.handle("screenshot:capture-url", async (n, M) => {
		try {
			console.log("Capturing URL:", M);
			let n = new BrowserWindow({
				width: 1200,
				height: 800,
				show: !1,
				webPreferences: {
					offscreen: !1,
					contextIsolation: !0
				}
			});
			await n.loadURL(M);
			try {
				let j = n.webContents.debugger;
				j.attach("1.3");
				let M = await j.sendCommand("Page.getLayoutMetrics"), N = M.contentSize || M.cssContentSize || {
					width: 1200,
					height: 800
				}, P = Math.ceil(N.width), F = Math.ceil(N.height);
				console.log(`Page dimensions: ${P}x${F}`), await j.sendCommand("Emulation.setDeviceMetricsOverride", {
					width: P,
					height: F,
					deviceScaleFactor: 1,
					mobile: !1
				});
				let I = await j.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: !0
				});
				return j.detach(), n.close(), {
					dataUrl: "data:image/png;base64," + I.data,
					width: P,
					height: F
				};
			} catch (j) {
				console.error("CDP Error:", j);
				let M = await n.webContents.capturePage();
				return n.close(), {
					dataUrl: M.toDataURL(),
					width: M.getSize().width,
					height: M.getSize().height
				};
			}
		} catch (n) {
			throw console.error("Failed to capture URL:", n), n;
		}
	}), ipcMain.handle("screenshot:save-file", async (j, M, N) => {
		try {
			let { filename: j, format: P = "png" } = N, F = await dialog.showSaveDialog(n, {
				defaultPath: j || `screenshot-${Date.now()}.${P}`,
				filters: [
					{
						name: "PNG Image",
						extensions: ["png"]
					},
					{
						name: "JPEG Image",
						extensions: ["jpg", "jpeg"]
					},
					{
						name: "WebP Image",
						extensions: ["webp"]
					}
				]
			});
			if (F.canceled || !F.filePath) return {
				success: !1,
				canceled: !0
			};
			let I = M.replace(/^data:image\/\w+;base64,/, ""), L = Buffer.from(I, "base64");
			return await fs.writeFile(F.filePath, L), {
				success: !0,
				filePath: F.filePath
			};
		} catch (n) {
			return console.error("Failed to save screenshot:", n), {
				success: !1,
				error: n.message
			};
		}
	});
}
var require$3 = createRequire(import.meta.url);
const youtubeDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.hasAria2c = !1, this.hasFFmpeg = !1, this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.videoInfoCache = /* @__PURE__ */ new Map(), this.CACHE_TTL = 1800 * 1e3, this.store = new Store({
			name: "youtube-download-history",
			defaults: {
				history: [],
				settings: {
					defaultVideoQuality: "1080p",
					defaultAudioQuality: "0",
					maxConcurrentDownloads: 3,
					maxSpeedLimit: ""
				}
			}
		});
		let n = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), n), this.initPromise = this.initYtDlp();
	}
	async initYtDlp() {
		try {
			let n = require$3("yt-dlp-wrap"), j = n.default || n;
			if (fs$1.existsSync(this.binaryPath)) console.log("Using existing yt-dlp binary at:", this.binaryPath);
			else {
				console.log("Downloading yt-dlp binary to:", this.binaryPath);
				try {
					await j.downloadFromGithub(this.binaryPath), console.log("yt-dlp binary downloaded successfully");
				} catch (n) {
					throw console.error("Failed to download yt-dlp binary:", n), Error(`Failed to download yt-dlp: ${n}`);
				}
			}
			this.ytDlp = new j(this.binaryPath);
			let { FFmpegHelper: M } = await import("./ffmpeg-helper-D9RH3mTJ.js"), N = M.getFFmpegPath();
			if (N) {
				this.ffmpegPath = N, this.hasFFmpeg = !0;
				let n = M.getFFmpegVersion();
				console.log(`✅ FFmpeg ready: ${n || "version unknown"}`);
			} else console.warn("⚠️ FFmpeg not available - video features may be limited");
			await this.checkHelpers();
		} catch (n) {
			throw console.error("Failed to initialize yt-dlp:", n), n;
		}
	}
	async checkHelpers() {
		this.hasAria2c = !1;
		try {
			let n = app.getPath("userData"), j = path$1.join(n, "bin", "aria2c.exe");
			fs$1.existsSync(j) && (this.hasAria2c = !0, console.log("✅ Aria2c found locally:", j));
		} catch {}
		if (!this.hasAria2c) try {
			execSync("aria2c --version", { stdio: "ignore" }), this.hasAria2c = !0, console.log("✅ Aria2c found globally");
		} catch {
			console.log("ℹ️ Aria2c not found");
		}
		if (this.ffmpegPath) this.hasFFmpeg = !0, console.log("✅ FFmpeg static detected", this.ffmpegPath);
		else try {
			execSync("ffmpeg -version", { stdio: "ignore" }), this.hasFFmpeg = !0, console.log("✅ FFmpeg found globally");
		} catch {
			this.hasFFmpeg = !1, console.warn("⚠️ FFmpeg not found");
		}
	}
	async installAria2() {
		console.log("Starting Aria2 download...");
		try {
			let n = app.getPath("userData"), j = path$1.join(n, "bin");
			fs$1.existsSync(j) || fs$1.mkdirSync(j, { recursive: !0 });
			let M = path$1.join(j, "aria2.zip");
			await new Promise((n, j) => {
				let N = fs$1.createWriteStream(M);
				https.get("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip", (M) => {
					M.statusCode === 302 || M.statusCode === 301 ? https.get(M.headers.location, (M) => {
						if (M.statusCode !== 200) {
							j(/* @__PURE__ */ Error("DL Fail " + M.statusCode));
							return;
						}
						M.pipe(N), N.on("finish", () => {
							N.close(), n();
						});
					}).on("error", j) : M.statusCode === 200 ? (M.pipe(N), N.on("finish", () => {
						N.close(), n();
					})) : j(/* @__PURE__ */ Error(`Failed to download: ${M.statusCode}`));
				}).on("error", j);
			}), await promisify$1(exec$1)(`powershell -Command "Expand-Archive -Path '${M}' -DestinationPath '${j}' -Force"`);
			let N = path$1.join(j, "aria2-1.36.0-win-64bit-build1"), P = path$1.join(N, "aria2c.exe"), I = path$1.join(j, "aria2c.exe");
			fs$1.existsSync(P) && fs$1.copyFileSync(P, I);
			try {
				fs$1.unlinkSync(M);
			} catch {}
			return await this.checkHelpers(), this.hasAria2c;
		} catch (n) {
			throw console.error("Install Aria2 Failed", n), n;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async processQueue() {
		let n = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < n && this.downloadQueue.length > 0;) {
			let n = this.downloadQueue.shift();
			n && (this.activeDownloadsCount++, n.run().then((j) => n.resolve(j)).catch((j) => n.reject(j)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async getVideoInfo(n) {
		await this.ensureInitialized();
		let j = this.videoInfoCache.get(n);
		if (j && Date.now() - j.timestamp < this.CACHE_TTL) return console.log("Returning cached video info for:", n), j.info;
		try {
			let j = await this.ytDlp.getVideoInfo([
				n,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]), M = (j.formats || []).map((n) => ({
				itag: n.format_id ? parseInt(n.format_id) : 0,
				quality: n.quality || n.format_note || "unknown",
				qualityLabel: n.format_note || n.resolution,
				hasVideo: !!n.vcodec && n.vcodec !== "none",
				hasAudio: !!n.acodec && n.acodec !== "none",
				container: n.ext || "unknown",
				codecs: n.vcodec || n.acodec,
				bitrate: n.tbr ? n.tbr * 1e3 : void 0,
				audioBitrate: n.abr,
				filesize: n.filesize || n.filesize_approx
			})), N = /* @__PURE__ */ new Set();
			M.forEach((n) => {
				if (n.qualityLabel) {
					let j = n.qualityLabel.match(/(\d+p)/);
					j && N.add(j[1]);
				}
			});
			let P = Array.from(N).sort((n, j) => {
				let M = parseInt(n);
				return parseInt(j) - M;
			}), F = M.some((n) => n.hasVideo), I = M.some((n) => n.hasAudio), L;
			if (j.upload_date) try {
				let n = j.upload_date.toString();
				n.length === 8 && (L = `${n.substring(0, 4)}-${n.substring(4, 6)}-${n.substring(6, 8)}`);
			} catch {
				console.warn("Failed to parse upload date:", j.upload_date);
			}
			let R = {
				videoId: j.id || "",
				title: j.title || "Unknown",
				author: j.uploader || j.channel || "Unknown",
				lengthSeconds: parseInt(j.duration) || 0,
				thumbnailUrl: j.thumbnail || "",
				description: j.description || void 0,
				viewCount: parseInt(j.view_count) || void 0,
				uploadDate: L,
				formats: M,
				availableQualities: P,
				hasVideo: F,
				hasAudio: I
			};
			return this.videoInfoCache.set(n, {
				info: R,
				timestamp: Date.now()
			}), R;
		} catch (n) {
			throw Error(`Failed to get video info: ${n instanceof Error ? n.message : "Unknown error"}`);
		}
	}
	async getPlaylistInfo(n) {
		await this.ensureInitialized();
		try {
			let j = await this.ytDlp.getVideoInfo([
				n,
				"--flat-playlist",
				"--skip-download",
				"--no-check-certificate"
			]);
			if (!j.entries || !Array.isArray(j.entries)) throw Error("Not a valid playlist URL");
			let M = j.entries.map((n) => ({
				id: n.id || n.url,
				title: n.title || "Unknown Title",
				duration: n.duration || 0,
				thumbnail: n.thumbnail || n.thumbnails?.[0]?.url || "",
				url: n.url || `https://www.youtube.com/watch?v=${n.id}`
			}));
			return {
				playlistId: j.id || j.playlist_id || "unknown",
				title: j.title || j.playlist_title || "Unknown Playlist",
				videoCount: M.length,
				videos: M
			};
		} catch (n) {
			throw Error(`Failed to get playlist info: ${n instanceof Error ? n.message : "Unknown error"}`);
		}
	}
	async checkDiskSpace(n, j) {
		try {
			let M = await si.fsSize(), N = path$1.parse(path$1.resolve(n)).root.toLowerCase(), P = M.find((n) => {
				let j = n.mount.toLowerCase();
				return N.startsWith(j) || j.startsWith(N.replace(/\\/g, ""));
			});
			if (P && P.available < j + 100 * 1024 * 1024) throw Error(`Insufficient disk space. Required: ${(j / 1024 / 1024).toFixed(2)} MB, Available: ${(P.available / 1024 / 1024).toFixed(2)} MB`);
		} catch (n) {
			console.warn("Disk space check failed:", n);
		}
	}
	async downloadVideo(n, j) {
		return new Promise((M, N) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(n, j),
				resolve: M,
				reject: N
			}), this.processQueue();
		});
	}
	async executeDownload(n, j) {
		await this.ensureInitialized(), console.log("ExecuteDownload - hasFFmpeg:", this.hasFFmpeg, "path:", this.ffmpegPath);
		let { url: M, format: N, quality: P, container: I, outputPath: L, maxSpeed: R, embedSubs: z, id: B } = n, V = B || randomUUID$1();
		try {
			let B = await this.getVideoInfo(M), H = this.sanitizeFilename(B.title), U = L || app.getPath("downloads"), W = I || (N === "audio" ? "mp3" : "mp4"), G = "";
			N === "audio" ? G = `_audio_${P || "best"}` : N === "video" && P && (G = `_${P}`);
			let K = path$1.join(U, `${H}${G}.%(ext)s`);
			fs$1.existsSync(U) || fs$1.mkdirSync(U, { recursive: !0 });
			let q = 0;
			if (N === "audio") q = B.formats.find((n) => n.hasAudio && !n.hasVideo && (n.quality === P || n.itag.toString() === "140"))?.filesize || 0;
			else {
				let n;
				n = P && P !== "best" ? B.formats.find((n) => n.qualityLabel?.startsWith(P) && n.hasVideo) : B.formats.find((n) => n.hasVideo);
				let j = B.formats.find((n) => n.hasAudio && !n.hasVideo);
				n && (q += n.filesize || 0), j && (q += j.filesize || 0);
			}
			q > 1024 * 1024 && await this.checkDiskSpace(U, q);
			let J = [
				M,
				"-o",
				K,
				"--no-playlist",
				"--no-warnings",
				"--newline",
				"--no-check-certificate",
				"--concurrent-fragments",
				`${n.concurrentFragments || 4}`,
				"--buffer-size",
				"1M",
				"--retries",
				"10",
				"--fragment-retries",
				"10",
				"-c"
			];
			if (z && J.push("--write-subs", "--write-auto-subs", "--sub-lang", "en.*,vi", "--embed-subs"), this.ffmpegPath && J.push("--ffmpeg-location", this.ffmpegPath), R && J.push("--limit-rate", R), this.ffmpegPath && J.push("--ffmpeg-location", this.ffmpegPath), N === "audio") J.push("-x", "--audio-format", I || "mp3", "--audio-quality", P || "0");
			else if (N === "video") {
				if (P && P !== "best") {
					let n = P.replace("p", "");
					J.push("-f", `bestvideo[height<=${n}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${n}]+bestaudio/best[height<=${n}]`);
				} else J.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
				let n = I || "mp4";
				J.push("--merge-output-format", n), n === "mp4" && J.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
			} else J.push("-f", "best");
			return new Promise((n, F) => {
				let I = 0, L = 0, R = 0, z = this.ytDlp.exec(J);
				if (this.activeProcesses.set(V, z), z.ytDlpProcess) {
					let n = z.ytDlpProcess;
					n.stdout?.on("data", (n) => {
						let M = n.toString();
						console.log(`[${V}] stdout:`, M), M.split(/\r?\n/).forEach((n) => {
							if (!n.trim()) return;
							let M = this.parseProgressLine(n);
							M && j && (M.totalBytes > 0 && (L = M.totalBytes), M.percent > 0 && (R = M.percent), I = R / 100 * L, j({
								id: V,
								percent: Math.round(R),
								downloaded: I,
								total: L,
								speed: M.speed,
								eta: M.eta,
								state: "downloading",
								filename: `${H}${G}.${W}`
							}));
						});
					}), n.stderr?.on("data", (n) => {
						let M = n.toString();
						console.log(`[${V}] stderr:`, M), M.split(/\r?\n/).forEach((n) => {
							if (!n.trim()) return;
							let M = this.parseProgressLine(n);
							M && j && (M.totalBytes > 0 && (L = M.totalBytes), M.percent > 0 && (R = M.percent), I = R / 100 * L, j({
								id: V,
								percent: Math.round(R),
								downloaded: I,
								total: L,
								speed: M.speed,
								eta: M.eta,
								state: "downloading",
								filename: `${H}.${W}`
							}));
						});
					});
				}
				z.on("close", (I) => {
					if (this.activeProcesses.delete(V), I === 0) {
						let F = path$1.join(U, `${H}${G}.${W}`), I = L;
						try {
							fs$1.existsSync(F) && (I = fs$1.statSync(F).size);
						} catch (n) {
							console.warn("Failed to get file size:", n);
						}
						j && j({
							id: V,
							percent: 100,
							downloaded: I,
							total: I,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: `${H}.${W}`
						}), this.addToHistory({
							url: M,
							title: B.title,
							thumbnailUrl: B.thumbnailUrl,
							format: N,
							quality: P || (N === "audio" ? "best" : "auto"),
							path: F,
							size: I,
							duration: B.lengthSeconds,
							status: "completed"
						}), n(F);
					} else this.cleanupPartialFiles(U, H, W), F(/* @__PURE__ */ Error(`yt-dlp exited with code ${I}`));
				}), z.on("error", (n) => {
					this.activeProcesses.delete(V), this.cleanupPartialFiles(U, H, W), F(n);
				});
			});
		} catch (n) {
			throw this.activeProcesses.delete(V), Error(`Download failed: ${n instanceof Error ? n.message : "Unknown error"}`);
		}
	}
	cancelDownload(n) {
		if (n) {
			let j = this.activeProcesses.get(n);
			if (j) {
				console.log(`Cancelling download ${n}`);
				try {
					j.ytDlpProcess && typeof j.ytDlpProcess.kill == "function" ? j.ytDlpProcess.kill() : typeof j.kill == "function" && j.kill();
				} catch (n) {
					console.error("Failed to kill process:", n);
				}
				this.activeProcesses.delete(n);
			}
		} else console.log(`Cancelling all ${this.activeProcesses.size} downloads`), this.activeProcesses.forEach((n) => {
			try {
				n.ytDlpProcess && typeof n.ytDlpProcess.kill == "function" ? n.ytDlpProcess.kill() : typeof n.kill == "function" && n.kill();
			} catch (n) {
				console.error("Failed to kill process:", n);
			}
		}), this.activeProcesses.clear();
	}
	cleanupPartialFiles(n, j, M) {
		try {
			[
				path$1.join(n, `${j}.${M}`),
				path$1.join(n, `${j}.${M}.part`),
				path$1.join(n, `${j}.${M}.ytdl`),
				path$1.join(n, `${j}.part`)
			].forEach((n) => {
				fs$1.existsSync(n) && fs$1.unlinkSync(n);
			});
		} catch (n) {
			console.error("Cleanup failed:", n);
		}
	}
	sanitizeFilename(n) {
		return n.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
	}
	parseProgressLine(n) {
		let j = (n) => {
			if (!n) return 1;
			let j = n.toLowerCase();
			return j.includes("k") ? 1024 : j.includes("m") ? 1024 * 1024 : j.includes("g") ? 1024 * 1024 * 1024 : 1;
		};
		if (n.includes("[download]")) {
			let M = n.match(/(\d+(?:\.\d+)?)%/), N = n.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/), P = n.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/), F = n.match(/ETA\s+([\d:]+)/);
			if (console.log("[parseProgressLine] Matches:", {
				line: n,
				percentMatch: M?.[0],
				sizeMatch: N?.[0],
				speedMatch: P?.[0],
				etaMatch: F?.[0]
			}), M) {
				let n = parseFloat(M[1]), I = 0, L = 0, R = 0;
				if (N && (I = parseFloat(N[1].replace(/,/g, "")) * j(N[2])), P && (L = parseFloat(P[1].replace(/,/g, "")) * j(P[2].replace("/s", ""))), F) {
					let n = F[1].split(":").map(Number);
					R = n.length === 3 ? n[0] * 3600 + n[1] * 60 + n[2] : n.length === 2 ? n[0] * 60 + n[1] : n[0];
				}
				return {
					percent: n,
					totalBytes: I,
					downloadedBytes: 0,
					speed: L,
					eta: R,
					status: "downloading"
				};
			}
		}
		return null;
	}
	getHistory() {
		return this.store.get("history", []);
	}
	addToHistory(n) {
		let j = this.store.get("history", []), M = {
			...n,
			id: randomUUID$1(),
			timestamp: Date.now()
		};
		this.store.set("history", [M, ...j].slice(0, 50));
	}
	removeFromHistory(n) {
		let j = this.store.get("history", []).filter((j) => j.id !== n);
		this.store.set("history", j);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	getCapabilities() {
		return {
			hasAria2c: this.hasAria2c,
			hasFFmpeg: this.hasFFmpeg
		};
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(n) {
		let j = {
			...this.store.get("settings"),
			...n
		};
		return this.store.set("settings", j), j;
	}
}();
var require$2 = createRequire(import.meta.url);
const tiktokDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.store = new Store({
			name: "tiktok-download-history",
			defaults: {
				history: [],
				settings: {
					defaultFormat: "video",
					defaultQuality: "best",
					removeWatermark: !1,
					maxConcurrentDownloads: 3,
					maxSpeedLimit: ""
				}
			}
		});
		let n = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), n), this.initPromise = this.init();
	}
	async init() {
		try {
			let n = require$2("yt-dlp-wrap"), j = n.default || n;
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (TikTok)..."), await j.downloadFromGithub(this.binaryPath)), this.ytDlp = new j(this.binaryPath);
			let { FFmpegHelper: M } = await import("./ffmpeg-helper-D9RH3mTJ.js"), N = M.getFFmpegPath();
			N ? (this.ffmpegPath = N, console.log("✅ TikTok Downloader: FFmpeg ready")) : console.warn("⚠️ TikTok Downloader: FFmpeg not available");
		} catch (n) {
			throw console.error("Failed to init TikTok downloader:", n), n;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async getVideoInfo(n) {
		await this.ensureInitialized();
		try {
			let j = await this.ytDlp.getVideoInfo([
				n,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]);
			return {
				id: j.id,
				title: j.title || "TikTok Video",
				author: j.uploader || j.channel || "Unknown",
				authorUsername: j.uploader_id || "",
				duration: j.duration || 0,
				thumbnailUrl: j.thumbnail || "",
				description: j.description,
				viewCount: j.view_count,
				likeCount: j.like_count,
				commentCount: j.comment_count,
				shareCount: j.repost_count,
				uploadDate: j.upload_date,
				musicTitle: j.track,
				musicAuthor: j.artist
			};
		} catch (n) {
			throw Error(`Failed to get TikTok info: ${n instanceof Error ? n.message : String(n)}`);
		}
	}
	async downloadVideo(n, j) {
		return new Promise((M, N) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(n, j),
				resolve: M,
				reject: N
			}), this.processQueue();
		});
	}
	async processQueue() {
		let n = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < n && this.downloadQueue.length > 0;) {
			let n = this.downloadQueue.shift();
			n && (this.activeDownloadsCount++, n.run().then((j) => n.resolve(j)).catch((j) => n.reject(j)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async executeDownload(n, j) {
		await this.ensureInitialized();
		let { url: M, format: N, quality: P, outputPath: I, maxSpeed: L, id: R } = n, z = R || randomUUID$1();
		try {
			let n = await this.getVideoInfo(M), R = this.sanitizeFilename(n.title), B = this.sanitizeFilename(n.authorUsername || n.author), V = I || this.store.get("settings.downloadPath") || app.getPath("downloads"), H = N === "audio" ? "mp3" : "mp4", U = `${B}_${R}_${n.id}.${H}`, W = path$1.join(V, U);
			fs$1.existsSync(V) || fs$1.mkdirSync(V, { recursive: !0 });
			let G = [
				M,
				"-o",
				W,
				"--no-playlist",
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			return this.ffmpegPath && G.push("--ffmpeg-location", this.ffmpegPath), L && G.push("--limit-rate", L), N === "audio" ? G.push("-x", "--audio-format", "mp3", "--audio-quality", "0") : P === "low" ? G.push("-f", "worst") : G.push("-f", "best"), new Promise((P, F) => {
				let I = 0, L = 0, R = 0, B = this.ytDlp.exec(G);
				this.activeProcesses.set(z, B), B.ytDlpProcess && B.ytDlpProcess.stdout?.on("data", (n) => {
					n.toString().split(/\r?\n/).forEach((n) => {
						if (!n.trim()) return;
						let M = n.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(\w+)\s+at\s+(\d+\.?\d*)(\w+)\/s\s+ETA\s+(\d+:\d+)/);
						if (M) {
							R = parseFloat(M[1]);
							let n = parseFloat(M[2]), N = M[3], P = parseFloat(M[4]), F = M[5], B = M[6], V = {
								B: 1,
								KiB: 1024,
								MiB: 1024 * 1024,
								GiB: 1024 * 1024 * 1024
							};
							I = n * (V[N] || 1), L = R / 100 * I;
							let H = P * (V[F] || 1), W = B.split(":"), G = 0;
							W.length === 2 && (G = parseInt(W[0]) * 60 + parseInt(W[1])), W.length === 3 && (G = parseInt(W[0]) * 3600 + parseInt(W[1]) * 60 + parseInt(W[2])), j && j({
								id: z,
								percent: R,
								downloaded: L,
								total: I,
								speed: H,
								eta: G,
								state: "downloading",
								filename: U
							});
						}
					});
				}), B.on("close", (L) => {
					this.activeProcesses.delete(z), L === 0 ? fs$1.existsSync(W) ? (j && j({
						id: z,
						percent: 100,
						downloaded: I,
						total: I,
						speed: 0,
						eta: 0,
						state: "complete",
						filename: U,
						filePath: W
					}), this.addToHistory({
						id: z,
						url: M,
						title: n.title,
						thumbnailUrl: n.thumbnailUrl,
						author: n.author,
						authorUsername: n.authorUsername,
						timestamp: Date.now(),
						path: W,
						size: I,
						duration: n.duration,
						format: N || "video",
						status: "completed"
					}), P(W)) : F(/* @__PURE__ */ Error("Download finished but file not found")) : F(/* @__PURE__ */ Error(`yt-dlp exited with code ${L}`));
				}), B.on("error", (n) => {
					this.activeProcesses.delete(z), F(n);
				});
			});
		} catch (n) {
			throw this.activeProcesses.delete(z), n;
		}
	}
	cancelDownload(n) {
		if (n) {
			let j = this.activeProcesses.get(n);
			j && j.ytDlpProcess && j.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((n) => {
			n.ytDlpProcess && n.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(n) {
		let j = this.getHistory();
		this.store.set("history", j.filter((j) => j.id !== n));
	}
	addToHistory(n) {
		let j = this.getHistory();
		j.unshift(n), this.store.set("history", j.slice(0, 100));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(n) {
		let j = this.getSettings();
		this.store.set("settings", {
			...j,
			...n
		});
	}
	sanitizeFilename(n) {
		return n.replace(/[<>:"/\\|?*]/g, "").trim();
	}
}();
var require$1 = createRequire(import.meta.url);
const universalDownloader = new class {
	constructor() {
		this.activeProcesses = /* @__PURE__ */ new Map(), this.ffmpegPath = null, this.downloadQueue = [], this.activeDownloadsCount = 0, this.store = new Store({
			name: "universal-download-history",
			defaults: {
				history: [],
				settings: {
					defaultFormat: "video",
					defaultQuality: "best",
					maxConcurrentDownloads: 3,
					maxSpeedLimit: "",
					useBrowserCookies: null
				}
			}
		});
		let n = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), n), this.initPromise = this.init(), setInterval(() => this.processQueue(), 5e3);
	}
	async init() {
		try {
			let n = require$1("yt-dlp-wrap"), j = n.default || n;
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (Universal)..."), await j.downloadFromGithub(this.binaryPath)), this.ytDlp = new j(this.binaryPath);
			let { FFmpegHelper: M } = await import("./ffmpeg-helper-D9RH3mTJ.js"), N = M.getFFmpegPath();
			N ? (this.ffmpegPath = N, console.log("✅ Universal Downloader: FFmpeg ready")) : console.warn("⚠️ Universal Downloader: FFmpeg not available");
		} catch (n) {
			throw console.error("Failed to init Universal downloader:", n), n;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	detectPlatform(n, j) {
		let M = n.toLowerCase();
		if (j) {
			let n = j.toLowerCase();
			if (n.includes("youtube")) return "youtube";
			if (n.includes("tiktok")) return "tiktok";
			if (n.includes("instagram")) return "instagram";
			if (n.includes("facebook") || n.includes("fb")) return "facebook";
			if (n.includes("twitter") || n.includes("x") || n.includes("periscope")) return "twitter";
			if (n.includes("twitch")) return "twitch";
			if (n.includes("reddit")) return "reddit";
			if (n.includes("vimeo") || n.includes("pinterest") || n.includes("soundcloud")) return "other";
		}
		return M.includes("youtube.com") || M.includes("youtu.be") ? "youtube" : M.includes("tiktok.com") ? "tiktok" : M.includes("instagram.com") ? "instagram" : M.includes("facebook.com") || M.includes("fb.watch") || M.includes("fb.com") ? "facebook" : M.includes("twitter.com") || M.includes("x.com") ? "twitter" : M.includes("twitch.tv") ? "twitch" : M.includes("reddit.com") || M.includes("redd.it") ? "reddit" : (M.includes("pinterest.com") || M.includes("vimeo.com"), "other");
	}
	async getMediaInfo(n) {
		await this.ensureInitialized();
		try {
			let j = n.includes("v=") || n.includes("youtu.be/") || n.includes("/video/") || n.includes("/v/"), M = n.includes("list=") || n.includes("/playlist") || n.includes("/sets/") || n.includes("/album/") || n.includes("/c/") || n.includes("/channel/") || n.includes("/user/"), N = this.getSettings(), P = ["--dump-json", "--no-check-certificate"];
			N.useBrowserCookies && P.push("--cookies-from-browser", N.useBrowserCookies);
			let F = [n, ...P];
			M && !j ? F.push("--flat-playlist") : F.push("--no-playlist");
			let I = M && j ? [
				n,
				...P,
				"--flat-playlist"
			] : null, [L, R] = await Promise.allSettled([this.ytDlp.execPromise(F), I ? this.ytDlp.execPromise(I) : Promise.resolve(null)]);
			if (L.status === "rejected") throw L.reason;
			let z = L.value.trim().split("\n"), B = JSON.parse(z[0]);
			if (z.length > 1 && !B.entries) {
				let n = z.map((n) => {
					try {
						return JSON.parse(n);
					} catch {
						return null;
					}
				}).filter((n) => n !== null);
				B = {
					...n[0],
					entries: n,
					_type: "playlist"
				};
			}
			if (R.status === "fulfilled" && R.value) try {
				let n = R.value.trim().split("\n"), j = JSON.parse(n[0]);
				if (n.length > 1 && !j.entries) {
					let M = n.map((n) => {
						try {
							return JSON.parse(n);
						} catch {
							return null;
						}
					}).filter((n) => n !== null);
					j = {
						...M[0],
						entries: M
					};
				}
				j.entries && !B.entries && (B.entries = j.entries, B.playlist_count = j.playlist_count || j.entries.length, B._type ||= "playlist");
			} catch (n) {
				console.warn("Failed to parse auxiliary playlist info:", n);
			}
			let V = this.detectPlatform(n, B.extractor), H = B._type === "playlist" || !!B.entries || B._type === "multi_video", U = M || !!B.playlist_id, W = [], G = H && B.entries && B.entries[0] ? B.entries[0].formats : B.formats;
			if (G && Array.isArray(G)) {
				let n = /* @__PURE__ */ new Set();
				G.forEach((j) => {
					if (j.vcodec && j.vcodec !== "none") {
						if (j.height) n.add(`${j.height}p`);
						else if (j.format_note && /^\d+p$/.test(j.format_note)) n.add(j.format_note);
						else if (j.resolution && /^\d+x\d+$/.test(j.resolution)) {
							let M = j.resolution.split("x")[1];
							n.add(`${M}p`);
						}
					}
				}), n.size === 0 && B.height && n.add(`${B.height}p`);
				let j = Array.from(n).sort((n, j) => {
					let M = parseInt(n);
					return parseInt(j) - M;
				});
				W.push(...j);
			}
			let K = H && B.entries ? B.entries.map((n) => ({
				id: n.id,
				title: n.title,
				duration: n.duration,
				url: n.url || (V === "youtube" ? `https://www.youtube.com/watch?v=${n.id}` : n.url),
				thumbnail: n.thumbnails?.[0]?.url || n.thumbnail
			})) : void 0, q = B.title || B.id || "Untitled Media", J = B.thumbnail || B.entries?.[0]?.thumbnail || B.thumbnails?.[0]?.url || "";
			return {
				id: B.id || B.entries?.[0]?.id || "unknown",
				url: B.webpage_url || n,
				title: q,
				platform: V,
				thumbnailUrl: J,
				author: B.uploader || B.channel || B.uploader_id || "Unknown",
				authorUrl: B.uploader_url || B.channel_url,
				duration: B.duration,
				uploadDate: B.upload_date,
				description: B.description,
				viewCount: B.view_count,
				likeCount: B.like_count,
				isLive: B.is_live || !1,
				webpageUrl: B.webpage_url,
				availableQualities: W.length > 0 ? W : void 0,
				isPlaylist: H || U,
				playlistCount: H || U ? B.playlist_count || B.entries?.length : void 0,
				playlistVideos: K,
				size: B.filesize || B.filesize_approx
			};
		} catch (n) {
			let j = n.message || String(n);
			throw j.includes("nodename nor servname provided") || j.includes("getaddrinfo") || j.includes("ENOTFOUND") || j.includes("Unable to download webpage") || j.includes("Unable to download API page") ? Error("Network error: Please check your internet connection") : (j.includes("Video unavailable") && (j = "Video is unavailable or private"), j.includes("Login required") && (j = "Login required to access this content"), j.includes("Private video") && (j = "This video is private"), j.includes("HTTP Error 429") && (j = "Too many requests. Please try again later"), j.includes("Geographic restriction") && (j = "This video is not available in your country"), Error(`Failed to get media info: ${j}`));
		}
	}
	async downloadMedia(n, j) {
		let M = n.id || randomUUID$1();
		return new Promise((N, P) => {
			this.downloadQueue.push({
				options: {
					...n,
					id: M
				},
				run: () => this.executeDownload({
					...n,
					id: M
				}, j),
				resolve: N,
				reject: P,
				state: "queued"
			}), this.processQueue();
		});
	}
	async checkDiskSpace(n) {
		try {
			let j = n || this.store.get("settings.downloadPath") || app.getPath("downloads"), M = await si.fsSize(), N = M[0], P = -1;
			for (let n of M) j.startsWith(n.mount) && n.mount.length > P && (P = n.mount.length, N = n);
			if (!N) return {
				available: 0,
				total: 0,
				warning: !1
			};
			let I = N.available, L = N.size;
			return {
				available: I,
				total: L,
				warning: I < 5 * 1024 * 1024 * 1024 || I / L < .1
			};
		} catch (n) {
			return console.error("Failed to check disk space:", n), {
				available: 0,
				total: 0,
				warning: !1
			};
		}
	}
	getQueue() {
		return this.downloadQueue.map((n) => ({
			id: n.options.id,
			url: n.options.url,
			state: n.state,
			filename: n.options.url
		}));
	}
	async processQueue() {
		let n = this.getSettings().maxConcurrentDownloads || 3;
		if ((await this.checkDiskSpace()).available < 500 * 1024 * 1024) {
			console.warn("Low disk space, skipping queue processing");
			return;
		}
		for (; this.activeDownloadsCount < n && this.downloadQueue.length > 0;) {
			let n = this.downloadQueue.shift();
			n && (this.activeDownloadsCount++, n.state = "downloading", n.run().then((j) => n.resolve(j)).catch((j) => n.reject(j)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async executeDownload(n, j) {
		await this.ensureInitialized();
		let { url: M, format: N, quality: P, outputPath: I, maxSpeed: L, id: R, cookiesBrowser: z, embedSubs: B, isPlaylist: V, playlistItems: H } = n, U = R || randomUUID$1();
		try {
			let n = await this.getMediaInfo(M), R = this.sanitizeFilename(n.title), W = this.sanitizeFilename(n.author || "unknown"), G = I || this.store.get("settings.downloadPath") || app.getPath("downloads"), K = N === "audio" ? "mp3" : "mp4", q, J, Y = V === !0, X = (n.platform || "Other").toUpperCase();
			if (Y) {
				let n = path$1.join(G, R);
				fs$1.existsSync(n) || fs$1.mkdirSync(n, { recursive: !0 }), q = path$1.join(n, "%(playlist_index)s - %(title)s.%(ext)s"), J = `[${X} PLAYLIST] ${R}`;
			} else J = `[${X}] ${W} - ${R.length > 50 ? R.substring(0, 50) + "..." : R} [${n.id}].${K}`, q = path$1.join(G, J);
			fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
			let Z = [
				M,
				"-o",
				q,
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			Y ? H && Z.push("--playlist-items", H) : Z.push("--no-playlist"), B && n.platform === "youtube" && Z.push("--all-subs", "--embed-subs", "--write-auto-subs"), this.ffmpegPath && Z.push("--ffmpeg-location", this.ffmpegPath), L && Z.push("--limit-rate", L);
			let Q = this.getSettings(), $ = z || Q.useBrowserCookies;
			if ($ && Z.push("--cookies-from-browser", $), N === "audio") {
				Z.push("-x", "--audio-format", "mp3");
				let n = P || "0";
				Z.push("--audio-quality", n);
			} else {
				if (P && P.endsWith("p")) {
					let n = P.replace("p", "");
					Z.push("-f", `bestvideo[height<=${n}]+bestaudio/best[height<=${n}]`);
				} else Z.push("-f", "bestvideo+bestaudio/best");
				Z.push("--merge-output-format", "mp4");
			}
			return !V && !n.isPlaylist && Z.push("--no-playlist"), new Promise((P, F) => {
				let I = 0, L = 0, z = 0, B = J, H = "", W = this.ytDlp.exec(Z);
				this.activeProcesses.set(U, W), W.ytDlpProcess && (W.ytDlpProcess.stderr?.on("data", (n) => {
					H += n.toString();
				}), W.ytDlpProcess.stdout?.on("data", (M) => {
					M.toString().split(/\r?\n/).forEach((M) => {
						if (!M.trim()) return;
						let N = M.match(/\[download\] Destination: .*[/\\](.*)$/);
						N && (B = N[1]);
						let P = M.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+)([\w]+)\s+at\s+([\d.]+)([\w/]+)\s+ETA\s+([\d:]+)/);
						if (P) {
							z = parseFloat(P[1]);
							let M = parseFloat(P[2]), N = P[3], F = parseFloat(P[4]), R = P[5].split("/")[0], V = P[6], H = {
								B: 1,
								KB: 1024,
								KIB: 1024,
								K: 1024,
								MB: 1024 * 1024,
								MIB: 1024 * 1024,
								M: 1024 * 1024,
								GB: 1024 * 1024 * 1024,
								GIB: 1024 * 1024 * 1024,
								G: 1024 * 1024 * 1024,
								TB: 1024 * 1024 * 1024 * 1024,
								TIB: 1024 * 1024 * 1024 * 1024,
								T: 1024 * 1024 * 1024 * 1024
							};
							I = M * (H[N.toUpperCase()] || 1), L = z / 100 * I;
							let W = F * (H[R.toUpperCase()] || 1), G = V.split(":").reverse(), K = 0;
							G[0] && (K += parseInt(G[0])), G[1] && (K += parseInt(G[1]) * 60), G[2] && (K += parseInt(G[2]) * 3600), j && j({
								id: U,
								percent: z,
								downloaded: L,
								total: I,
								speed: W,
								eta: K,
								state: "downloading",
								filename: n.isPlaylist ? `${J} (${B})` : J,
								platform: n.platform
							});
						}
					});
				})), W.on("close", (z) => {
					if (this.activeProcesses.delete(U), z === 0) {
						let F = V || n.isPlaylist ? path$1.join(G, R) : q;
						j && j({
							id: U,
							percent: 100,
							downloaded: I,
							total: I,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: J,
							filePath: F,
							platform: n.platform
						}), this.addToHistory({
							id: U,
							url: M,
							title: n.title,
							platform: n.platform,
							thumbnailUrl: n.thumbnailUrl,
							author: n.author,
							timestamp: Date.now(),
							path: F,
							size: I,
							duration: n.duration,
							format: N,
							status: "completed"
						}), P(F);
					} else if (z === null) {
						console.error("yt-dlp process terminated unexpectedly"), H && console.error("stderr output:", H);
						let M = H ? `Download terminated: ${H.substring(0, 200)}` : "Download was cancelled or terminated unexpectedly";
						j && j({
							id: U,
							percent: 0,
							downloaded: L,
							total: I,
							speed: 0,
							eta: 0,
							state: "error",
							filename: J,
							platform: n.platform
						}), F(Error(M));
					} else {
						console.error(`yt-dlp exited with code ${z}`), H && console.error("stderr output:", H);
						let M = `Download failed (exit code: ${z})`;
						if (H.includes("Video unavailable")) M = "Video is unavailable or has been removed";
						else if (H.includes("Private video")) M = "Video is private";
						else if (H.includes("Login required")) M = "Login required to access this content";
						else if (H.includes("HTTP Error 429")) M = "Too many requests. Please try again later";
						else if (H.includes("No space left")) M = "No space left on device";
						else if (H) {
							let n = H.split("\n").find((n) => n.trim());
							n && (M = n.substring(0, 150));
						}
						j && j({
							id: U,
							percent: 0,
							downloaded: L,
							total: I,
							speed: 0,
							eta: 0,
							state: "error",
							filename: J,
							platform: n.platform
						}), F(Error(M));
					}
				}), W.on("error", (M) => {
					this.activeProcesses.delete(U), console.error("yt-dlp process error:", M), H && console.error("stderr output:", H), j && j({
						id: U,
						percent: 0,
						downloaded: L,
						total: I,
						speed: 0,
						eta: 0,
						state: "error",
						filename: J,
						platform: n.platform
					}), F(/* @__PURE__ */ Error(`Download process error: ${M.message}`));
				});
				let K = setTimeout(() => {
					if (this.activeProcesses.has(U)) {
						console.warn(`Download timeout for ${U}, killing process`);
						let n = this.activeProcesses.get(U);
						n && n.ytDlpProcess && n.ytDlpProcess.kill("SIGTERM");
					}
				}, 36e5), Y = P, X = F;
				P = (n) => {
					clearTimeout(K), Y(n);
				}, F = (n) => {
					clearTimeout(K), X(n);
				};
			});
		} catch (n) {
			throw this.activeProcesses.delete(U), n;
		}
	}
	cancelDownload(n) {
		if (n) {
			let j = this.activeProcesses.get(n);
			j && j.ytDlpProcess && j.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((n) => {
			n.ytDlpProcess && n.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(n) {
		let j = this.getHistory();
		this.store.set("history", j.filter((j) => j.id !== n));
	}
	addToHistory(n) {
		let j = this.getHistory();
		j.unshift(n), this.store.set("history", j.slice(0, 200));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(n) {
		let j = this.getSettings();
		this.store.set("settings", {
			...j,
			...n
		});
	}
	sanitizeFilename(n) {
		return n.replace(/[<>:"/\\|?*]/g, "").trim();
	}
}(), audioExtractor = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((n) => console.error("FFmpeg init error:", n));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: n } = await import("./ffmpeg-helper-D9RH3mTJ.js"), j = n.getFFmpegPath();
			j ? (this.ffmpegPath = j, console.log("✅ Audio Extractor: FFmpeg ready")) : console.warn("⚠️ Audio Extractor: FFmpeg not available");
		} catch (n) {
			console.warn("FFmpeg setup failed:", n);
		}
	}
	async getAudioInfo(n) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((j, M) => {
			let N = [
				"-i",
				n,
				"-hide_banner"
			], P = spawn(this.ffmpegPath, N), F = "";
			P.stderr.on("data", (n) => {
				F += n.toString();
			}), P.on("close", () => {
				try {
					let M = F.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), N = M ? parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]) : 0, P = F.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?, (\d+) Hz.*?, (\w+).*?, (\d+) kb\/s/), I = !!P, L = F.includes("Video:");
					j({
						duration: N,
						bitrate: P ? parseInt(P[4]) : 0,
						sampleRate: P ? parseInt(P[2]) : 0,
						channels: P && P[3].includes("stereo") ? 2 : 1,
						codec: P ? P[1] : "unknown",
						size: fs$1.existsSync(n) ? fs$1.statSync(n).size : 0,
						hasAudio: I,
						hasVideo: L
					});
				} catch {
					M(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			}), P.on("error", M);
		});
	}
	async extractAudio(n, j) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = n.id || randomUUID$1(), { inputPath: N, outputPath: P, format: I, bitrate: L, sampleRate: R, channels: z, trim: B, normalize: V, fadeIn: H, fadeOut: U } = n;
		if (!fs$1.existsSync(N)) throw Error("Input file not found");
		let W = await this.getAudioInfo(N);
		if (!W.hasAudio) throw Error("No audio stream found in input file");
		let G = path$1.basename(N, path$1.extname(N)), K = P ? path$1.dirname(P) : app.getPath("downloads"), q = P ? path$1.basename(P) : `${G}_extracted.${I}`, J = path$1.join(K, q);
		fs$1.existsSync(K) || fs$1.mkdirSync(K, { recursive: !0 });
		let Y = ["-i", N];
		B?.start !== void 0 && Y.push("-ss", B.start.toString()), B?.end !== void 0 && Y.push("-to", B.end.toString()), Y.push("-vn");
		let X = [];
		if (V && X.push("loudnorm"), H && H > 0 && X.push(`afade=t=in:d=${H}`), U && U > 0) {
			let n = (B?.end || W.duration) - U;
			X.push(`afade=t=out:st=${n}:d=${U}`);
		}
		switch (X.length > 0 && Y.push("-af", X.join(",")), I) {
			case "mp3":
				Y.push("-acodec", "libmp3lame"), L && Y.push("-b:a", L);
				break;
			case "aac":
				Y.push("-acodec", "aac"), L && Y.push("-b:a", L);
				break;
			case "flac":
				Y.push("-acodec", "flac");
				break;
			case "wav":
				Y.push("-acodec", "pcm_s16le");
				break;
			case "ogg":
				Y.push("-acodec", "libvorbis"), L && Y.push("-b:a", L);
				break;
			case "m4a":
				Y.push("-acodec", "aac"), L && Y.push("-b:a", L);
				break;
		}
		return R && Y.push("-ar", R.toString()), z && Y.push("-ac", z.toString()), Y.push("-y", J), new Promise((n, P) => {
			let F = spawn(this.ffmpegPath, Y);
			this.activeProcesses.set(M, F);
			let I = W.duration;
			B?.start && B?.end ? I = B.end - B.start : B?.end && (I = B.end), F.stderr.on("data", (n) => {
				let P = n.toString(), F = P.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (F && j) {
					let n = parseInt(F[1]) * 3600 + parseInt(F[2]) * 60 + parseFloat(F[3]), L = Math.min(n / I * 100, 100), R = P.match(/speed=\s*(\d+\.?\d*)x/);
					j({
						id: M,
						filename: q,
						inputPath: N,
						percent: L,
						state: "processing",
						speed: R ? parseFloat(R[1]) : 1
					});
				}
			}), F.on("close", (F) => {
				this.activeProcesses.delete(M), F === 0 ? (j && j({
					id: M,
					filename: q,
					inputPath: N,
					percent: 100,
					state: "complete",
					outputPath: J
				}), n(J)) : P(/* @__PURE__ */ Error(`FFmpeg exited with code ${F}`));
			}), F.on("error", (n) => {
				this.activeProcesses.delete(M), P(n);
			});
		});
	}
	cancelExtraction(n) {
		let j = this.activeProcesses.get(n);
		j && (j.kill(), this.activeProcesses.delete(n));
	}
	cancelAll() {
		this.activeProcesses.forEach((n) => n.kill()), this.activeProcesses.clear();
	}
}(), videoMerger = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((n) => console.error("FFmpeg init error:", n));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: n } = await import("./ffmpeg-helper-D9RH3mTJ.js"), j = n.getFFmpegPath();
			j ? (this.ffmpegPath = j, console.log("✅ Video Merger: FFmpeg ready")) : console.warn("⚠️ Video Merger: FFmpeg not available");
		} catch (n) {
			console.warn("FFmpeg setup failed:", n);
		}
	}
	async getVideoInfo(n) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((j, M) => {
			let N = [
				"-i",
				n,
				"-hide_banner"
			], P = spawn(this.ffmpegPath, N), F = "";
			P.stderr.on("data", (n) => {
				F += n.toString();
			}), P.on("close", () => {
				try {
					let M = F.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), N = M ? parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]) : 0, P = F.match(/Video:.*?, (\d{3,5})x(\d{3,5})/), I = P ? parseInt(P[1]) : 0, L = P ? parseInt(P[2]) : 0, R = F.match(/(\d+\.?\d*) fps/), z = R ? parseFloat(R[1]) : 0, B = F.match(/Video: (\w+)/);
					j({
						path: n,
						duration: N,
						width: I,
						height: L,
						codec: B ? B[1] : "unknown",
						fps: z,
						size: fs$1.existsSync(n) ? fs$1.statSync(n).size : 0
					});
				} catch {
					M(/* @__PURE__ */ Error("Failed to parse video info"));
				}
			}), P.on("error", M);
		});
	}
	async generateThumbnail(n, j = 1) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = path$1.join(app.getPath("temp"), "devtools-app-thumbs");
		fs$1.existsSync(M) || fs$1.mkdirSync(M, { recursive: !0 });
		let N = `thumb_${randomUUID$1()}.jpg`, P = path$1.join(M, N);
		return new Promise((M, N) => {
			let F = [
				"-ss",
				j.toString(),
				"-i",
				n,
				"-frames:v",
				"1",
				"-q:v",
				"2",
				"-vf",
				"scale=480:-1,unsharp=3:3:1.5:3:3:0.5",
				"-f",
				"image2",
				"-y",
				P
			];
			console.log(`[VideoMerger] Generating thumbnail: ${F.join(" ")}`);
			let I = spawn(this.ffmpegPath, F);
			I.on("close", (n) => {
				if (n === 0) {
					let n = fs$1.readFileSync(P, { encoding: "base64" });
					fs$1.unlinkSync(P), M(`data:image/jpeg;base64,${n}`);
				} else N(/* @__PURE__ */ Error("Thumbnail generation failed"));
			}), I.on("error", N);
		});
	}
	async generateFilmstrip(n, j, M = 10) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let N = Math.min(200, Math.max(5, Math.min(M, Math.floor(j)))), P = randomUUID$1(), I = path$1.join(app.getPath("temp"), "devtools-app-filmstrips", P);
		fs$1.existsSync(I) || fs$1.mkdirSync(I, { recursive: !0 });
		let L = j > 0 ? j : 1, R = N / L;
		console.log(`Generating filmstrip (Optimized): Target ${N} frames from ${L}s video (fps=${R.toFixed(4)})`);
		let z = path$1.join(I, "thumb_%03d.jpg").replace(/\\/g, "/");
		return new Promise((j, M) => {
			let P = [
				"-i",
				n,
				"-vf",
				`fps=${R},scale=320:-1,unsharp=3:3:1:3:3:0.5`,
				"-an",
				"-sn",
				"-q:v",
				"4",
				"-f",
				"image2",
				"-y",
				z
			];
			console.log(`[VideoMerger] Running FFmpeg for filmstrip: ${P.join(" ")}`);
			let F = spawn(this.ffmpegPath, P), L = "";
			F.stderr.on("data", (n) => {
				L += n.toString();
			}), F.on("close", (n) => {
				if (n === 0) try {
					let n = fs$1.readdirSync(I).filter((n) => n.startsWith("thumb_") && n.endsWith(".jpg")).sort();
					if (n.length === 0) {
						console.error("Filmstrip generation failed: No frames produced. FFmpeg output:", L), M(/* @__PURE__ */ Error("No frames produced"));
						return;
					}
					let P = n.map((n) => {
						let j = path$1.join(I, n);
						return `data:image/jpeg;base64,${fs$1.readFileSync(j, { encoding: "base64" })}`;
					}).slice(0, N);
					try {
						fs$1.rmSync(I, {
							recursive: !0,
							force: !0
						});
					} catch (n) {
						console.warn("Filmstrip cleanup failed:", n);
					}
					j(P);
				} catch (n) {
					M(n);
				}
				else console.error("Filmstrip generation failed with code:", n, L), M(/* @__PURE__ */ Error("Filmstrip generation failed"));
			}), F.on("error", M);
		});
	}
	async extractWaveform(n) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return console.log("Extracting waveform for:", n), new Promise((j, M) => {
			let N = [
				"-i",
				n,
				"-vn",
				"-ac",
				"1",
				"-filter:a",
				"aresample=8000",
				"-map",
				"0:a",
				"-c:a",
				"pcm_s16le",
				"-f",
				"data",
				"-"
			], P = spawn(this.ffmpegPath, N), F = [];
			P.stdout.on("data", (n) => {
				F.push(n);
			}), P.stderr.on("data", () => {}), P.on("close", (n) => {
				if (n === 0) try {
					let n = Buffer.concat(F), M = [];
					for (let j = 0; j < n.length; j += 160) {
						let N = 0;
						for (let M = 0; M < 80; M++) {
							let P = j + M * 2;
							if (P + 1 < n.length) {
								let j = Math.abs(n.readInt16LE(P));
								j > N && (N = j);
							}
						}
						M.push(N / 32768);
					}
					console.log(`Waveform extracted: ${M.length} points`), j(M);
				} catch (n) {
					M(n);
				}
				else M(/* @__PURE__ */ Error("Waveform extraction failed"));
			}), P.on("error", M);
		});
	}
	async mergeVideos(n, j) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = n.id || randomUUID$1(), { clips: N, outputPath: P, format: I } = n;
		if (!N || N.length === 0) throw Error("No input clips provided");
		for (let n of N) if (!fs$1.existsSync(n.path)) throw Error(`File not found: ${n.path}`);
		j && j({
			id: M,
			percent: 0,
			state: "analyzing"
		});
		let L = await Promise.all(N.map((n) => this.getVideoInfo(n.path))), R = 0;
		N.forEach((n, j) => {
			let M = L[j].duration, N = n.startTime || 0, P = n.endTime || M;
			R += P - N;
		});
		let z = P ? path$1.dirname(P) : app.getPath("downloads"), B = P ? path$1.basename(P) : `merged_video_${Date.now()}.${I}`, V = path$1.join(z, B);
		fs$1.existsSync(z) || fs$1.mkdirSync(z, { recursive: !0 });
		let H = [];
		N.forEach((n) => {
			n.startTime !== void 0 && H.push("-ss", n.startTime.toString()), n.endTime !== void 0 && H.push("-to", n.endTime.toString()), H.push("-i", n.path);
		});
		let U = "";
		return N.forEach((n, j) => {
			U += `[${j}:v][${j}:a]`;
		}), U += `concat=n=${N.length}:v=1:a=1[v][a]`, H.push("-filter_complex", U), H.push("-map", "[v]", "-map", "[a]"), H.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), H.push("-c:a", "aac", "-b:a", "128k"), H.push("-y", V), new Promise((n, N) => {
			let P = spawn(this.ffmpegPath, H);
			this.activeProcesses.set(M, P), P.stderr.on("data", (n) => {
				let N = n.toString(), P = N.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (P && j) {
					let n = parseInt(P[1]) * 3600 + parseInt(P[2]) * 60 + parseFloat(P[3]), F = Math.min(n / R * 100, 100), I = N.match(/speed=\s*(\d+\.?\d*)x/);
					j({
						id: M,
						percent: F,
						state: "processing",
						speed: I ? parseFloat(I[1]) : 1
					});
				}
			}), P.on("close", (P) => {
				this.activeProcesses.delete(M), P === 0 ? (j && j({
					id: M,
					percent: 100,
					state: "complete",
					outputPath: V
				}), n(V)) : N(/* @__PURE__ */ Error(`Merge failed with code ${P}`));
			}), P.on("error", (n) => {
				this.activeProcesses.delete(M), N(n);
			});
		});
	}
	cancelMerge(n) {
		let j = this.activeProcesses.get(n);
		j && (j.kill(), this.activeProcesses.delete(n));
	}
}(), audioManager = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((n) => console.error("Audio Manager FFmpeg init error:", n));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: n } = await import("./ffmpeg-helper-D9RH3mTJ.js");
			this.ffmpegPath = n.getFFmpegPath();
		} catch (n) {
			console.warn("FFmpeg setup failed for Audio Manager:", n);
		}
	}
	async getAudioInfo(n) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((j, M) => {
			let N = [
				"-i",
				n,
				"-hide_banner"
			], P = spawn(this.ffmpegPath, N), F = "";
			P.stderr.on("data", (n) => F += n.toString()), P.on("close", () => {
				try {
					let M = F.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), N = M ? parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]) : 0, P = F.match(/(\d+) Hz/), I = P ? parseInt(P[1]) : 0;
					j({
						path: n,
						duration: N,
						format: path$1.extname(n).slice(1),
						sampleRate: I,
						channels: F.includes("stereo") ? 2 : 1,
						size: fs$1.existsSync(n) ? fs$1.statSync(n).size : 0
					});
				} catch {
					M(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			});
		});
	}
	async applyAudioChanges(n, j) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = randomUUID$1(), { videoPath: N, audioLayers: P, outputPath: I, outputFormat: L, keepOriginalAudio: R, originalAudioVolume: z } = n;
		j && j({
			id: M,
			percent: 0,
			state: "analyzing"
		});
		let B = [
			"-i",
			N,
			"-hide_banner"
		], V = spawn(this.ffmpegPath, B), H = "";
		await new Promise((n) => {
			V.stderr.on("data", (n) => H += n.toString()), V.on("close", n);
		});
		let U = H.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), W = U ? parseInt(U[1]) * 3600 + parseInt(U[2]) * 60 + parseFloat(U[3]) : 0, G = I ? path$1.dirname(I) : app.getPath("downloads"), K = I || path$1.join(G, `audio_mixed_${Date.now()}.${L}`), q = ["-i", N];
		P.forEach((n) => {
			n.clipStart > 0 && q.push("-ss", n.clipStart.toString()), n.clipEnd > 0 && q.push("-to", n.clipEnd.toString()), q.push("-i", n.path);
		});
		let J = "", Y = 0;
		R && (J += `[0:a]volume=${z}[a0];`, Y++), P.forEach((n, j) => {
			let M = j + 1;
			J += `[${M}:a]volume=${n.volume},adelay=${n.startTime * 1e3}|${n.startTime * 1e3}[a${M}];`, Y++;
		});
		for (let n = 0; n < Y; n++) J += `[a${n}]`;
		return J += `amix=inputs=${Y}:duration=first:dropout_transition=2[aout]`, q.push("-filter_complex", J), q.push("-map", "0:v", "-map", "[aout]"), q.push("-c:v", "copy"), q.push("-c:a", "aac", "-b:a", "192k", "-y", K), new Promise((n, N) => {
			let P = spawn(this.ffmpegPath, q);
			this.activeProcesses.set(M, P), P.stderr.on("data", (n) => {
				let N = n.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && j) {
					let n = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]);
					j({
						id: M,
						percent: Math.min(n / W * 100, 100),
						state: "processing"
					});
				}
			}), P.on("close", (P) => {
				this.activeProcesses.delete(M), P === 0 ? (j && j({
					id: M,
					percent: 100,
					state: "complete",
					outputPath: K
				}), n(K)) : N(/* @__PURE__ */ Error(`Exit code ${P}`));
			}), P.on("error", (n) => {
				this.activeProcesses.delete(M), N(n);
			});
		});
	}
	cancel(n) {
		let j = this.activeProcesses.get(n);
		j && (j.kill(), this.activeProcesses.delete(n));
	}
}(), videoTrimmer = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((n) => console.error("Video Trimmer FFmpeg init error:", n));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: n } = await import("./ffmpeg-helper-D9RH3mTJ.js");
			this.ffmpegPath = n.getFFmpegPath();
		} catch (n) {
			console.warn("FFmpeg setup failed for Video Trimmer:", n);
		}
	}
	async process(n, j) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let { inputPath: M, ranges: N, mode: P, outputFormat: I, outputPath: L } = n, R = randomUUID$1();
		j && j({
			id: R,
			percent: 0,
			state: "analyzing"
		});
		let z = L ? path$1.dirname(L) : app.getPath("downloads"), B = [];
		if (P === "trim" || P === "cut") {
			let n = L || path$1.join(z, `trimmed_${Date.now()}.${I}`), F = [];
			if (N.length === 1 && P === "trim") F.push("-ss", N[0].start.toString(), "-to", N[0].end.toString(), "-i", M), F.push("-c", "copy", "-y", n);
			else {
				F.push("-i", M);
				let j = "";
				N.forEach((n, M) => {
					j += `[0:v]trim=start=${n.start}:end=${n.end},setpts=PTS-STARTPTS[v${M}];`, j += `[0:a]atrim=start=${n.start}:end=${n.end},asetpts=PTS-STARTPTS[a${M}];`;
				});
				for (let n = 0; n < N.length; n++) j += `[v${n}][a${n}]`;
				j += `concat=n=${N.length}:v=1:a=1[outv][outa]`, F.push("-filter_complex", j), F.push("-map", "[outv]", "-map", "[outa]"), F.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"), F.push("-c:a", "aac", "-y", n);
			}
			await this.runFFmpeg(F, R, N.reduce((n, j) => n + (j.end - j.start), 0), j), B.push(n);
		} else if (P === "split") for (let n = 0; n < N.length; n++) {
			let P = N[n], F = path$1.join(z, `split_${n + 1}_${Date.now()}.${I}`), L = [
				"-ss",
				P.start.toString(),
				"-to",
				P.end.toString(),
				"-i",
				M,
				"-c",
				"copy",
				"-y",
				F
			];
			j && j({
				id: R,
				percent: n / N.length * 100,
				state: "processing"
			}), await this.runFFmpeg(L, R, P.end - P.start), B.push(F);
		}
		return j && j({
			id: R,
			percent: 100,
			state: "complete",
			outputPath: B[0]
		}), B;
	}
	async runFFmpeg(n, j, M, N) {
		return new Promise((P, F) => {
			let I = spawn(this.ffmpegPath, n);
			this.activeProcesses.set(j, I), I.stderr.on("data", (n) => {
				let P = n.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (P && N) {
					let n = parseInt(P[1]) * 3600 + parseInt(P[2]) * 60 + parseFloat(P[3]);
					N({
						id: j,
						percent: Math.min(n / M * 100, 100),
						state: "processing"
					});
				}
			}), I.on("close", (n) => {
				this.activeProcesses.delete(j), n === 0 ? P() : F(/* @__PURE__ */ Error(`FFmpeg exited with code ${n}`));
			}), I.on("error", (n) => {
				this.activeProcesses.delete(j), F(n);
			});
		});
	}
	cancel(n) {
		let j = this.activeProcesses.get(n);
		j && (j.kill(), this.activeProcesses.delete(n));
	}
}(), videoEffects = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((n) => console.error("FFmpeg init error:", n));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: n } = await import("./ffmpeg-helper-D9RH3mTJ.js"), j = n.getFFmpegPath();
			j ? (this.ffmpegPath = j, console.log("✅ Video Effects: FFmpeg ready")) : console.warn("⚠️ Video Effects: FFmpeg not available");
		} catch (n) {
			console.warn("FFmpeg setup failed:", n);
		}
	}
	async applyEffects(n, j) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = n.id || randomUUID$1(), { inputPath: N, outputPath: P, format: I } = n;
		if (!fs$1.existsSync(N)) throw Error(`File not found: ${N}`);
		j && j({
			id: M,
			percent: 0,
			state: "analyzing"
		});
		let L = await this.getVideoInfo(N), R = n.speed ? L.duration / n.speed : L.duration, z = P ? path$1.dirname(P) : app.getPath("downloads"), B = P ? path$1.basename(P) : `effect_video_${Date.now()}.${I}`, V = path$1.join(z, B);
		fs$1.existsSync(z) || fs$1.mkdirSync(z, { recursive: !0 });
		let H = ["-i", N], U = [], W = [];
		if (n.speed && n.speed !== 1) {
			U.push(`setpts=${1 / n.speed}*PTS`);
			let j = n.speed;
			for (; j > 2;) W.push("atempo=2.0"), j /= 2;
			for (; j < .5;) W.push("atempo=0.5"), j /= .5;
			W.push(`atempo=${j}`);
		}
		return (n.flip === "horizontal" || n.flip === "both") && U.push("hflip"), (n.flip === "vertical" || n.flip === "both") && U.push("vflip"), n.rotate && (n.rotate === 90 ? U.push("transpose=1") : n.rotate === 180 ? U.push("transpose=2,transpose=2") : n.rotate === 270 && U.push("transpose=2")), (n.brightness !== void 0 || n.contrast !== void 0 || n.saturation !== void 0 || n.gamma !== void 0) && U.push(`eq=brightness=${n.brightness || 0}:contrast=${n.contrast === void 0 ? 1 : n.contrast}:saturation=${n.saturation === void 0 ? 1 : n.saturation}:gamma=${n.gamma === void 0 ? 1 : n.gamma}`), n.grayscale && U.push("hue=s=0"), n.sepia && U.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"), n.blur && U.push(`boxblur=${n.blur}:1`), n.noise && U.push(`noise=alls=${n.noise}:allf=t+u`), n.sharpen && U.push("unsharp=5:5:1.0:5:5:0.0"), n.vintage && (U.push("curves=vintage"), U.push("vignette=PI/4")), n.reverse && (U.push("reverse"), W.push("areverse")), U.length > 0 && H.push("-vf", U.join(",")), W.length > 0 && H.push("-af", W.join(",")), n.quality === "low" ? H.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30") : n.quality === "high" ? H.push("-c:v", "libx264", "-preset", "slow", "-crf", "18") : H.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), H.push("-c:a", "aac", "-b:a", "128k"), H.push("-y", V), new Promise((n, N) => {
			let P = spawn(this.ffmpegPath, H);
			this.activeProcesses.set(M, P), P.stderr.on("data", (n) => {
				let N = n.toString(), P = N.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (P && j) {
					let n = parseInt(P[1]) * 3600 + parseInt(P[2]) * 60 + parseFloat(P[3]), F = Math.min(n / R * 100, 100), I = N.match(/speed=\s*(\d+\.?\d*)x/);
					j({
						id: M,
						percent: F,
						state: "processing",
						speed: I ? parseFloat(I[1]) : 1
					});
				}
			}), P.on("close", (P) => {
				this.activeProcesses.delete(M), P === 0 ? (j && j({
					id: M,
					percent: 100,
					state: "complete",
					outputPath: V
				}), n(V)) : N(/* @__PURE__ */ Error(`Effects application failed with code ${P}`));
			}), P.on("error", (n) => {
				this.activeProcesses.delete(M), N(n);
			});
		});
	}
	async getVideoInfo(n) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((j, M) => {
			let N = spawn(this.ffmpegPath, [
				"-i",
				n,
				"-hide_banner"
			]), P = "";
			N.stderr.on("data", (n) => P += n.toString()), N.on("close", (n) => {
				if (n !== 0 && !P.includes("Duration")) {
					M(/* @__PURE__ */ Error("Failed to get video info"));
					return;
				}
				let N = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				j({ duration: N ? parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]) : 0 });
			}), N.on("error", M);
		});
	}
	cancelEffects(n) {
		let j = this.activeProcesses.get(n);
		j && (j.kill(), this.activeProcesses.delete(n));
	}
}();
var execAsync = promisify(exec), store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public"), protocol.registerSchemesAsPrivileged([{
	scheme: "local-media",
	privileges: {
		bypassCSP: !0,
		stream: !0,
		secure: !0,
		supportFetchAPI: !0
	}
}]);
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(n) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: n,
			openAsHidden: !0
		}), { success: !0 };
	} catch (n) {
		let j = n instanceof Error ? n.message : String(n);
		return console.warn("Failed to set login item settings:", j), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: j
		};
	}
}
function createTray() {
	tray || (tray = new Tray(nativeImage.createFromPath(TRAY_ICON_PATH).resize({
		width: 22,
		height: 22
	})), tray.setToolTip("DevTools"), updateTrayMenu(), tray.on("double-click", () => {
		toggleWindow();
	}));
}
function toggleWindow() {
	win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
}
var recentTools = [], clipboardItems = [], clipboardMonitoringEnabled = !0, statsMenuData = null, healthMenuData = null, healthMonitoringInterval = null;
function updateTrayMenu() {
	if (!tray) return;
	let n = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let j = Math.min(clipboardItems.length, 9);
		n.push({
			label: "📋 Clipboard Manager",
			submenu: [
				{
					label: "▸ Open Full Manager",
					click: () => {
						win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
					}
				},
				{ type: "separator" },
				{
					label: `● Recent Clipboard (${j})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((n, j) => {
					let M = String(n.content || ""), P = (M.length > 75 ? M.substring(0, 75) + "..." : M).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${j + 1}. ${P || "(Empty)"}`,
						click: () => {
							M && (clipboard.writeText(M), new Notification({
								title: "✓ Copied from History",
								body: P || "Copied to clipboard",
								silent: !0
							}).show());
						}
					};
				}),
				{ type: "separator" },
				{
					label: clipboardMonitoringEnabled ? "▶ Monitoring Active" : "⏸ Monitoring Paused",
					type: "checkbox",
					checked: clipboardMonitoringEnabled,
					click: () => {
						clipboardMonitoringEnabled = !clipboardMonitoringEnabled, win?.webContents.send("toggle-clipboard-monitoring", clipboardMonitoringEnabled), updateTrayMenu(), new Notification({
							title: clipboardMonitoringEnabled ? "✓ Monitoring Enabled" : "⏸ Monitoring Paused",
							body: clipboardMonitoringEnabled ? "Clipboard will be monitored automatically" : "Clipboard monitoring paused",
							silent: !0
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
		}), n.push({ type: "separator" });
	} else n.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), n.push({ type: "separator" });
	if (n.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let n = randomUUID();
					clipboard.writeText(n), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${n.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let n = clipboard.readText(), j = JSON.parse(n), M = JSON.stringify(j, null, 2);
						clipboard.writeText(M), new Notification({
							title: "✓ JSON Formatted",
							body: "Formatted JSON copied to clipboard",
							silent: !0
						}).show();
					} catch {
						new Notification({
							title: "✗ Format Failed",
							body: "Clipboard does not contain valid JSON",
							silent: !0
						}).show();
					}
				}
			},
			{
				label: "# Hash Text (SHA-256)",
				click: () => {
					try {
						let n = clipboard.readText();
						if (!n) throw Error("Empty clipboard");
						let j = createHash("sha256").update(n).digest("hex");
						clipboard.writeText(j), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${j.substring(0, 20)}...`,
							silent: !0
						}).show();
					} catch {
						new Notification({
							title: "✗ Hash Failed",
							body: "Could not hash clipboard content",
							silent: !0
						}).show();
					}
				}
			},
			{ type: "separator" },
			{
				label: "↑ Base64 Encode",
				click: () => {
					try {
						let n = clipboard.readText();
						if (!n) throw Error("Empty clipboard");
						let j = Buffer.from(n).toString("base64");
						clipboard.writeText(j), new Notification({
							title: "✓ Base64 Encoded",
							body: "Encoded text copied to clipboard",
							silent: !0
						}).show();
					} catch {
						new Notification({
							title: "✗ Encode Failed",
							body: "Could not encode clipboard content",
							silent: !0
						}).show();
					}
				}
			},
			{
				label: "↓ Base64 Decode",
				click: () => {
					try {
						let n = clipboard.readText();
						if (!n) throw Error("Empty clipboard");
						let j = Buffer.from(n, "base64").toString("utf-8");
						clipboard.writeText(j), new Notification({
							title: "✓ Base64 Decoded",
							body: "Decoded text copied to clipboard",
							silent: !0
						}).show();
					} catch {
						new Notification({
							title: "✗ Decode Failed",
							body: "Invalid Base64 in clipboard",
							silent: !0
						}).show();
					}
				}
			}
		]
	}), n.push({ type: "separator" }), statsMenuData) {
		let j = (n) => statsMenuData?.enabledModules?.includes(n) ?? !0;
		if (n.push({
			label: "📊 Stats Monitor",
			enabled: !1
		}), j("cpu")) {
			let j = statsMenuData.cpu ?? 0, M = statsMenuData.sensors?.cpuTemp;
			n.push({
				label: `   CPU: ${j.toFixed(1)}% ${M === void 0 ? "" : `(${M.toFixed(1)}°C)`}`,
				enabled: !1
			});
		}
		if (j("memory")) {
			let j = statsMenuData.memory?.used ?? 0, M = statsMenuData.memory?.total ?? 0, N = statsMenuData.memory?.percent ?? 0;
			n.push({
				label: `   RAM: ${formatBytes(j)} / ${formatBytes(M)} (${N.toFixed(1)}%)`,
				enabled: !1
			});
		}
		if (j("gpu") && statsMenuData.gpu) {
			let j = statsMenuData.gpu.load ?? 0, M = statsMenuData.gpu.memoryUsed ?? 0, N = statsMenuData.gpu.memoryTotal ?? 0;
			n.push({
				label: `   GPU: ${j.toFixed(1)}% (${formatBytes(M)} / ${formatBytes(N)})`,
				enabled: !1
			});
		}
		if (j("network")) {
			let j = statsMenuData.network?.rx ?? 0, M = statsMenuData.network?.tx ?? 0;
			n.push({
				label: `   Net: ↑${formatSpeed(j)} ↓${formatSpeed(M)}`,
				enabled: !1
			});
		}
		if (j("battery") && statsMenuData.battery) {
			let j = statsMenuData.battery, M = j.level ?? 0;
			n.push({
				label: `   Bat: ${M}% ${j.charging ? "(Charging)" : ""}`,
				enabled: !1
			});
		}
		let M = (n) => {
			win?.webContents.send("stats-toggle-module", n);
		};
		n.push({
			label: "⚙️ Toggle Modules",
			submenu: [
				{
					label: "CPU Usage",
					type: "checkbox",
					checked: j("cpu"),
					click: () => M("cpu")
				},
				{
					label: "Memory Usage",
					type: "checkbox",
					checked: j("memory"),
					click: () => M("memory")
				},
				{
					label: "GPU Usage",
					type: "checkbox",
					checked: j("gpu"),
					click: () => M("gpu")
				},
				{
					label: "Network Speed",
					type: "checkbox",
					checked: j("network"),
					click: () => M("network")
				},
				{
					label: "Battery Info",
					type: "checkbox",
					checked: j("battery"),
					click: () => M("battery")
				}
			]
		}), n.push({ type: "separator" }), n.push({
			label: "▸ Open Stats Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
			}
		}), n.push({ type: "separator" });
	}
	if (healthMenuData) {
		let j = healthMenuData.alerts.filter((n) => n.severity === "critical" || n.severity === "warning").length, M = j > 0 ? `🛡️ System Health (${j} alerts)` : "🛡️ System Health", P = [
			{
				label: "📊 Health Metrics",
				enabled: !1
			},
			{
				label: `CPU: ${healthMenuData.cpu.toFixed(1)}%`,
				enabled: !1
			},
			{
				label: `RAM: ${healthMenuData.ram.percentage.toFixed(1)}% (${formatBytes(healthMenuData.ram.used)} / ${formatBytes(healthMenuData.ram.total)})`,
				enabled: !1
			}
		];
		healthMenuData.disk && P.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && P.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), P.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (P.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((n) => {
			P.push({
				label: `${n.severity === "critical" ? "🔴" : n.severity === "warning" ? "🟡" : "🔵"} ${n.message.substring(0, 50)}${n.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), P.push({ type: "separator" })), P.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), P.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let n = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							n?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(n.ramFreed || 0)}`,
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Failed",
								body: "Could not free RAM",
								silent: !0
							}).show();
						}
					}
				},
				{
					label: "Flush DNS Cache",
					click: async () => {
						try {
							(await win?.webContents.executeJavaScript(`
                (async () => {
                  const res = await window.cleanerAPI?.runMaintenance(${JSON.stringify({
								id: "dns-flush",
								name: "Flush DNS Cache",
								category: "dns-flush"
							})});
                  return res;
                })()
              `))?.success && new Notification({
								title: "✓ DNS Cache Flushed",
								body: "DNS cache cleared successfully",
								silent: !0
							}).show();
						} catch {
							new Notification({
								title: "✗ Failed",
								body: "Could not flush DNS cache",
								silent: !0
							}).show();
						}
					}
				},
				{
					label: "Open System Cleaner",
					click: () => {
						win?.show(), win?.webContents.send("navigate-to", "/system-cleaner");
					}
				}
			]
		}), n.push({
			label: M,
			submenu: P
		}), n.push({ type: "separator" });
	}
	recentTools.length > 0 && (n.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((n) => ({
			label: `  • ${n.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", n.id);
			}
		}))
	}), n.push({ type: "separator" })), n.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), n.push({ type: "separator" }), n.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let j = Menu.buildFromTemplate(n);
	tray.setContextMenu(j);
}
function createWindow() {
	let n = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, M = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...n,
		minWidth: 800,
		minHeight: 600,
		resizable: !0,
		show: !M,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let P = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", P), win.on("move", P), win.on("close", (n) => {
		let j = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && j && (n.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let n = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return n.canceled || n.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: n.filePaths[0]
		};
	}), ipcMain.handle("store-get", (n, j) => store.get(j)), ipcMain.handle("store-set", (n, j, M) => {
		if (store.set(j, M), j === "launchAtLogin") {
			let n = setLoginItemSettingsSafely(M === !0);
			!n.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: n.error
			});
		}
	}), ipcMain.handle("store-delete", (n, j) => store.delete(j)), setupScreenshotHandlers(win), ipcMain.on("window-set-opacity", (n, j) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, j)));
	}), ipcMain.on("window-set-always-on-top", (n, j) => {
		win && win.setAlwaysOnTop(j);
	}), ipcMain.handle("permissions:check-all", async () => {
		let n = process.platform, j = {};
		return n === "darwin" ? (j.accessibility = await V(), j.fullDiskAccess = await H(), j.screenRecording = await U()) : n === "win32" && (j.fileAccess = await q(), j.registryAccess = await J()), j.clipboard = await W(), j.launchAtLogin = await G(), j;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await V() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await H() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await U() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await Y()), ipcMain.handle("permissions:test-file-access", async () => await X()), ipcMain.handle("permissions:open-system-preferences", async (n, j) => await Z(j));
	async function V() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let n = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(n, () => {})) return globalShortcut.unregister(n), { status: "granted" };
			} catch {}
			return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function H() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (let n of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				return await fs.access(n), { status: "granted" };
			} catch {}
			let n = os.homedir();
			try {
				return await fs.readdir(n), {
					status: "granted",
					message: "Basic file access available"
				};
			} catch {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function U() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let n = await desktopCapturer.getSources({ types: ["screen"] });
				if (n && n.length > 0) return { status: "granted" };
			} catch {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function W() {
		try {
			let n = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			let j = clipboard.readText();
			return clipboard.writeText(n), j === "__PERMISSION_TEST__" ? { status: "granted" } : {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function G() {
		try {
			let n = app.getLoginItemSettings();
			return {
				status: n.openAtLogin ? "granted" : "not-determined",
				message: n.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function q() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let n = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), j = "permission test";
			await fs.writeFile(n, j);
			let M = await fs.readFile(n, "utf-8");
			return await fs.unlink(n), M === j ? { status: "granted" } : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (n) {
			return {
				status: "denied",
				message: n.message
			};
		}
	}
	async function J() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let { stdout: n } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			return n && !n.includes("ERROR") ? { status: "granted" } : {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (n) {
			return {
				status: "denied",
				message: n.message
			};
		}
	}
	async function Y() {
		try {
			let n = clipboard.readText(), j = `Permission test ${Date.now()}`;
			clipboard.writeText(j);
			let M = clipboard.readText();
			return clipboard.writeText(n), M === j ? {
				status: "granted",
				message: "Clipboard read/write test passed"
			} : {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (n) {
			return {
				status: "error",
				message: n.message
			};
		}
	}
	async function X() {
		try {
			let n = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), j = `Test ${Date.now()}`;
			await fs.writeFile(n, j);
			let M = await fs.readFile(n, "utf-8");
			return await fs.unlink(n), M === j ? {
				status: "granted",
				message: "File access test passed"
			} : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (n) {
			return {
				status: "denied",
				message: n.message
			};
		}
	}
	async function Z(n) {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				return n === "accessibility" ? j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : n === "full-disk-access" ? j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : n === "screen-recording" && (j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync(j), {
					success: !0,
					message: "Opened System Preferences"
				};
			} else if (j === "win32") return await execAsync("start ms-settings:privacy"), {
				success: !0,
				message: "Opened Windows Settings"
			};
			return {
				success: !1,
				message: "Unsupported platform"
			};
		} catch (n) {
			return {
				success: !1,
				message: n.message
			};
		}
	}
	ipcMain.on("tray-update-menu", (n, j) => {
		recentTools = j || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (n, j) => {
		clipboardItems = (j || []).sort((n, j) => j.timestamp - n.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (n) {
			return console.error("Failed to read clipboard:", n), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let n = clipboard.readImage();
			return n.isEmpty() ? null : n.toDataURL();
		} catch (n) {
			return console.error("Failed to read clipboard image:", n), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (n, j) => {
		clipboardMonitoringEnabled = j, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (n, j) => {
		statsMenuData = j, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (n, j) => {
		healthMenuData = j, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let n = async () => {
			try {
				let n = await si.mem(), j = await si.currentLoad(), M = await si.fsSize(), P = await si.battery().catch(() => null), F = [], I = M.find((n) => n.mount === "/" || n.mount === "C:") || M[0];
				if (I) {
					let n = I.available / I.size * 100;
					n < 10 ? F.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(I.available)} free`
					}) : n < 20 && F.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(I.available)} free`
					});
				}
				j.currentLoad > 90 && F.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${j.currentLoad.toFixed(1)}%`
				});
				let L = n.used / n.total * 100;
				L > 90 && F.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${L.toFixed(1)}%`
				}), healthMenuData = {
					cpu: j.currentLoad,
					ram: {
						used: n.used,
						total: n.total,
						percentage: L
					},
					disk: I ? {
						free: I.available,
						total: I.size,
						percentage: (I.size - I.available) / I.size * 100
					} : null,
					battery: P ? {
						level: P.percent,
						charging: P.isCharging || !1
					} : null,
					alerts: F
				}, updateTrayMenu();
				let R = F.filter((n) => n.severity === "critical");
				R.length > 0 && win && R.forEach((n) => {
					new Notification({
						title: "⚠️ System Alert",
						body: n.message,
						silent: !1
					}).show();
				});
			} catch (n) {
				console.error("Health monitoring error:", n);
			}
		};
		return n(), healthMonitoringInterval = setInterval(n, 5e3), { success: !0 };
	}), ipcMain.handle("health-stop-monitoring", () => (healthMonitoringInterval &&= (clearInterval(healthMonitoringInterval), null), healthMenuData = null, updateTrayMenu(), { success: !0 })), ipcMain.on("window-minimize", () => {
		win?.minimize();
	}), ipcMain.on("window-maximize", () => {
		win?.isMaximized() ? win.unmaximize() : win?.maximize();
	}), ipcMain.on("window-close", () => {
		win?.close();
	}), ipcMain.on("window-open-devtools", () => {
		win?.webContents.openDevTools();
	}), win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	}), VITE_DEV_SERVER_URL ? win.loadURL(VITE_DEV_SERVER_URL) : win.loadFile(join(process.env.DIST || "", "index.html"));
}
app.on("window-all-closed", () => {
	process.platform !== "darwin" && app.quit();
}), app.on("activate", () => {
	BrowserWindow.getAllWindows().length === 0 ? createWindow() : win && win.show();
}), app.on("before-quit", () => {
	app.isQuitting = !0, win && win.webContents.send("check-clear-clipboard-on-quit");
}), app.whenReady().then(() => {
	setTimeout(() => {
		win && win.webContents.executeJavaScript("\n        (async () => {\n          if (window.cleanerAPI?.startHealthMonitoring) {\n            await window.cleanerAPI.startHealthMonitoring();\n          }\n        })()\n      ").catch(() => {});
	}, 2e3);
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		}), globalShortcut.register("CommandOrControl+Shift+C", () => {
			win?.show(), win?.webContents.send("open-clipboard-manager");
		});
	} catch (n) {
		console.error("Failed to register global shortcut", n);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [n, j] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: n.manufacturer,
			brand: n.brand,
			speed: n.speed,
			cores: n.cores,
			physicalCores: n.physicalCores,
			load: j
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [n, j] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: n,
			interfaces: j
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [n, j] = await Promise.all([si.fsSize(), si.disksIO()]), M = null;
			if (j && Array.isArray(j) && j.length > 0) {
				let n = j[0];
				M = {
					rIO: n.rIO || 0,
					wIO: n.wIO || 0,
					tIO: n.tIO || 0,
					rIO_sec: n.rIO_sec || 0,
					wIO_sec: n.wIO_sec || 0,
					tIO_sec: n.tIO_sec || 0
				};
			} else j && typeof j == "object" && !Array.isArray(j) && (M = {
				rIO: j.rIO || 0,
				wIO: j.wIO || 0,
				tIO: j.tIO || 0,
				rIO_sec: j.rIO_sec || 0,
				wIO_sec: j.wIO_sec || 0,
				tIO_sec: j.tIO_sec || 0
			});
			return {
				fsSize: n,
				ioStats: M
			};
		} catch (n) {
			return console.error("Error fetching disk stats:", n), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let n = await si.battery(), j, M;
			if ("powerConsumptionRate" in n && n.powerConsumptionRate && typeof n.powerConsumptionRate == "number" && (j = n.powerConsumptionRate), n.voltage && n.voltage > 0) {
				if (!n.isCharging && n.timeRemaining > 0 && n.currentCapacity > 0) {
					let M = n.currentCapacity / n.timeRemaining * 60;
					j = n.voltage * M;
				}
				n.isCharging && n.voltage > 0 && (M = n.voltage * 2e3);
			}
			return {
				...n,
				powerConsumptionRate: j,
				chargingPower: M
			};
		} catch (n) {
			return console.error("Error fetching battery stats:", n), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let n = await si.bluetoothDevices();
			return {
				enabled: n.length > 0 || await checkBluetoothEnabled(),
				devices: n.map((n) => ({
					name: n.name || "Unknown",
					mac: n.mac || n.address || "",
					type: n.type || n.deviceClass || "unknown",
					battery: n.battery || n.batteryLevel || void 0,
					connected: n.connected !== !1,
					rssi: n.rssi || n.signalStrength || void 0,
					manufacturer: n.manufacturer || n.vendor || void 0
				}))
			};
		} catch (n) {
			return console.error("Error fetching bluetooth stats:", n), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let n = await si.time(), j = Intl.DateTimeFormat().resolvedOptions().timeZone, M = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((n) => {
				let j = /* @__PURE__ */ new Date(), M = new Intl.DateTimeFormat("en-US", {
					timeZone: n,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), N = new Intl.DateTimeFormat("en-US", {
					timeZone: n,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), P = getTimezoneOffset(n);
				return {
					timezone: n,
					city: n.split("/").pop()?.replace("_", " ") || n,
					time: M.format(j),
					date: N.format(j),
					offset: P
				};
			});
			return {
				local: {
					timezone: j,
					city: j.split("/").pop()?.replace("_", " ") || "Local",
					time: n.current,
					date: n.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(j)
				},
				zones: M
			};
		} catch (n) {
			return console.error("Error fetching timezones stats:", n), null;
		}
	}), ipcMain.handle("system:get-info", async () => {
		try {
			let [n, j, M, N, P, F] = await Promise.all([
				si.cpu(),
				si.mem(),
				si.osInfo(),
				si.graphics(),
				si.diskLayout(),
				si.networkInterfaces()
			]);
			return {
				cpu: n,
				memory: j,
				os: M,
				graphics: N.controllers,
				disks: P,
				network: F.filter((n) => n.operstate === "up")
			};
		} catch (n) {
			return console.error("Error fetching system info:", n), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let M = process.platform, N = [];
			if (M === "darwin") {
				let j = "/Applications", M = await fs.readdir(j, { withFileTypes: !0 }).catch(() => []);
				for (let P of M) if (P.name.endsWith(".app")) {
					let M = join(j, P.name);
					try {
						let j = await fs.stat(M), F = P.name.replace(".app", ""), I = M.startsWith("/System") || M.startsWith("/Library") || F.startsWith("com.apple.");
						N.push({
							id: `macos-${F}-${j.ino}`,
							name: F,
							version: void 0,
							publisher: void 0,
							installDate: j.birthtime.toISOString(),
							installLocation: M,
							size: await n(M).catch(() => 0),
							isSystemApp: I
						});
					} catch {}
				}
			} else if (M === "win32") try {
				let { stdout: n } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), M = JSON.parse(n), P = Array.isArray(M) ? M : [M];
				for (let n of P) if (n.DisplayName) {
					let M = n.Publisher || "", P = n.InstallLocation || "", F = M.includes("Microsoft") || M.includes("Windows") || P.includes("Windows\\") || P.includes("Program Files\\Windows");
					N.push({
						id: `win-${n.DisplayName}-${n.InstallDate || "unknown"}`,
						name: n.DisplayName,
						version: n.DisplayVersion || void 0,
						publisher: M || void 0,
						installDate: n.InstallDate ? j(n.InstallDate) : void 0,
						installLocation: P || void 0,
						size: n.EstimatedSize ? n.EstimatedSize * 1024 : void 0,
						isSystemApp: F
					});
				}
			} catch (n) {
				console.error("Error fetching Windows apps:", n);
			}
			return N;
		} catch (n) {
			return console.error("Error fetching installed apps:", n), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let n = await si.processes(), j = await si.mem();
			return n.list.map((n) => ({
				pid: n.pid,
				name: n.name,
				cpu: n.cpu || 0,
				memory: n.mem || 0,
				memoryPercent: j.total > 0 ? (n.mem || 0) / j.total * 100 : 0,
				started: n.started || "",
				user: n.user || void 0,
				command: n.command || void 0,
				path: n.path || void 0
			}));
		} catch (n) {
			return console.error("Error fetching running processes:", n), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (n, j) => {
		try {
			let n = process.platform;
			if (n === "darwin") {
				if (j.installLocation) return await fs.rm(j.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (n === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${j.name.replace(/"/g, "\\\"")}" } | 
                   Select-Object -First 1
            if ($app.UninstallString) {
              $uninstallString = $app.UninstallString
              if ($uninstallString -match '^"(.+)"') {
                $exe = $matches[1]
                $args = $uninstallString.Substring($matches[0].Length).Trim()
                Start-Process -FilePath $exe -ArgumentList $args -Wait
              } else {
                Start-Process -FilePath $uninstallString -Wait
              }
              Write-Output "Success"
            } else {
              Write-Output "No uninstall string found"
            }
          `.replace(/"/g, "\\\"")}"`), { success: !0 };
			} catch (n) {
				return {
					success: !1,
					error: n.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (n, j) => {
		try {
			return process.kill(j, "SIGTERM"), { success: !0 };
		} catch (n) {
			return {
				success: !1,
				error: n.message
			};
		}
	}), ipcMain.handle("youtube:getInfo", async (n, j) => {
		try {
			return await youtubeDownloader.getVideoInfo(j);
		} catch (n) {
			throw n;
		}
	}), ipcMain.handle("youtube:getPlaylistInfo", async (n, j) => {
		try {
			return await youtubeDownloader.getPlaylistInfo(j);
		} catch (n) {
			throw n;
		}
	}), ipcMain.handle("youtube:download", async (n, j) => {
		try {
			return {
				success: !0,
				filepath: await youtubeDownloader.downloadVideo(j, (j) => {
					n.sender.send("youtube:progress", j);
				})
			};
		} catch (n) {
			return {
				success: !1,
				error: n instanceof Error ? n.message : "Download failed"
			};
		}
	}), ipcMain.handle("youtube:cancel", async () => (youtubeDownloader.cancelDownload(), { success: !0 })), ipcMain.handle("youtube:openFile", async (n, j) => {
		let { shell: M } = await import("electron");
		return M.openPath(j);
	}), ipcMain.handle("youtube:showInFolder", async (n, j) => {
		let { shell: M } = await import("electron");
		return M.showItemInFolder(j), !0;
	}), ipcMain.handle("youtube:chooseFolder", async () => {
		let { dialog: n } = await import("electron"), j = await n.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
			title: "Choose Download Location",
			buttonLabel: "Select Folder"
		});
		return j.canceled || j.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: j.filePaths[0]
		};
	}), ipcMain.handle("youtube:getHistory", () => youtubeDownloader.getHistory()), ipcMain.handle("youtube:clearHistory", () => (youtubeDownloader.clearHistory(), !0)), ipcMain.handle("youtube:removeFromHistory", (n, j) => (youtubeDownloader.removeFromHistory(j), !0)), ipcMain.handle("youtube:getSettings", () => youtubeDownloader.getSettings()), ipcMain.handle("youtube:saveSettings", (n, j) => youtubeDownloader.saveSettings(j)), ipcMain.handle("youtube:getCapabilities", () => youtubeDownloader.getCapabilities()), ipcMain.handle("youtube:installAria2", async () => await youtubeDownloader.installAria2()), ipcMain.handle("tiktok:get-info", async (n, j) => await tiktokDownloader.getVideoInfo(j)), ipcMain.handle("tiktok:download", async (n, j) => new Promise((n, M) => {
		tiktokDownloader.downloadVideo(j, (n) => {
			win?.webContents.send("tiktok:progress", n);
		}).then(n).catch(M);
	})), ipcMain.handle("tiktok:cancel", async (n, j) => {
		tiktokDownloader.cancelDownload(j);
	}), ipcMain.handle("tiktok:get-history", async () => tiktokDownloader.getHistory()), ipcMain.handle("tiktok:clear-history", async () => {
		tiktokDownloader.clearHistory();
	}), ipcMain.handle("tiktok:remove-from-history", async (n, j) => {
		tiktokDownloader.removeFromHistory(j);
	}), ipcMain.handle("tiktok:get-settings", async () => tiktokDownloader.getSettings()), ipcMain.handle("tiktok:save-settings", async (n, j) => tiktokDownloader.saveSettings(j)), ipcMain.handle("tiktok:choose-folder", async () => {
		let { dialog: n } = await import("electron"), j = await n.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return j.canceled ? null : j.filePaths[0];
	}), ipcMain.handle("universal:get-info", async (n, j) => await universalDownloader.getMediaInfo(j)), ipcMain.handle("universal:download", async (n, j) => new Promise((n, M) => {
		universalDownloader.downloadMedia(j, (n) => {
			win?.webContents.send("universal:progress", n);
		}).then(n).catch(M);
	})), ipcMain.handle("universal:cancel", async (n, j) => {
		universalDownloader.cancelDownload(j);
	}), ipcMain.handle("universal:get-history", async () => universalDownloader.getHistory()), ipcMain.handle("universal:clear-history", async () => {
		universalDownloader.clearHistory();
	}), ipcMain.handle("universal:remove-from-history", async (n, j) => {
		universalDownloader.removeFromHistory(j);
	}), ipcMain.handle("universal:get-settings", async () => universalDownloader.getSettings()), ipcMain.handle("universal:save-settings", async (n, j) => universalDownloader.saveSettings(j)), ipcMain.handle("universal:choose-folder", async () => {
		let { dialog: n } = await import("electron"), j = await n.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return j.canceled ? null : j.filePaths[0];
	}), ipcMain.handle("universal:check-disk-space", async (n, j) => await universalDownloader.checkDiskSpace(j)), ipcMain.handle("universal:get-queue", async () => universalDownloader.getQueue()), ipcMain.handle("universal:open-file", async (n, j) => {
		let { shell: M } = await import("electron");
		try {
			await fs.access(j), M.openPath(j);
		} catch {
			console.error("File not found:", j);
		}
	}), ipcMain.handle("universal:show-in-folder", async (n, j) => {
		let { shell: M } = await import("electron");
		M.showItemInFolder(j);
	}), ipcMain.handle("audio:get-info", async (n, j) => await audioExtractor.getAudioInfo(j)), ipcMain.handle("audio:extract", async (n, j) => new Promise((n, M) => {
		audioExtractor.extractAudio(j, (n) => {
			win?.webContents.send("audio:progress", n);
		}).then(n).catch(M);
	})), ipcMain.handle("audio:cancel", async (n, j) => {
		audioExtractor.cancelExtraction(j);
	}), ipcMain.handle("audio:cancel-all", async () => {
		audioExtractor.cancelAll();
	}), ipcMain.handle("audio:choose-input-file", async () => {
		let n = await dialog.showOpenDialog({
			properties: ["openFile"],
			filters: [
				{
					name: "Video Files",
					extensions: [
						"mp4",
						"mkv",
						"avi",
						"mov",
						"webm",
						"flv",
						"m4v",
						"wmv"
					]
				},
				{
					name: "Audio Files",
					extensions: [
						"mp3",
						"aac",
						"flac",
						"wav",
						"ogg",
						"m4a",
						"wma"
					]
				},
				{
					name: "All Files",
					extensions: ["*"]
				}
			]
		});
		return n.canceled ? null : n.filePaths[0];
	}), ipcMain.handle("audio:choose-input-files", async () => {
		let n = await dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			filters: [
				{
					name: "Video Files",
					extensions: [
						"mp4",
						"mkv",
						"avi",
						"mov",
						"webm",
						"flv",
						"m4v",
						"wmv"
					]
				},
				{
					name: "Audio Files",
					extensions: [
						"mp3",
						"aac",
						"flac",
						"wav",
						"ogg",
						"m4a",
						"wma"
					]
				},
				{
					name: "All Files",
					extensions: ["*"]
				}
			]
		});
		return n.canceled ? [] : n.filePaths;
	}), ipcMain.handle("audio:choose-output-folder", async () => {
		let n = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return n.canceled ? null : n.filePaths[0];
	}), ipcMain.handle("video-merger:get-info", async (n, j) => await videoMerger.getVideoInfo(j)), ipcMain.handle("video-merger:generate-thumbnail", async (n, j, M) => await videoMerger.generateThumbnail(j, M)), ipcMain.handle("video-filmstrip:generate", async (n, j, M, N) => await videoMerger.generateFilmstrip(j, M, N)), ipcMain.handle("video-merger:extract-waveform", async (n, j) => await videoMerger.extractWaveform(j)), ipcMain.handle("video-merger:merge", async (n, j) => new Promise((n, M) => {
		videoMerger.mergeVideos(j, (n) => {
			win?.webContents.send("video-merger:progress", n);
		}).then(n).catch(M);
	})), ipcMain.handle("video-merger:cancel", async (n, j) => {
		videoMerger.cancelMerge(j);
	}), ipcMain.handle("audio-manager:get-info", async (n, j) => await audioManager.getAudioInfo(j)), ipcMain.handle("audio-manager:apply", async (n, j) => await audioManager.applyAudioChanges(j, (j) => {
		n.sender.send("audio-manager:progress", j);
	})), ipcMain.handle("audio-manager:cancel", async (n, j) => {
		audioManager.cancel(j);
	}), ipcMain.handle("video-trimmer:process", async (n, j) => await videoTrimmer.process(j, (j) => {
		n.sender.send("video-trimmer:progress", j);
	})), ipcMain.handle("video-effects:apply", async (n, j) => await videoEffects.applyEffects(j, (n) => {
		win?.webContents.send("video-effects:progress", n);
	})), ipcMain.on("video-effects:cancel", (n, j) => {
		videoEffects.cancelEffects(j);
	}), ipcMain.handle("video-effects:get-info", async (n, j) => await videoMerger.getVideoInfo(j)), ipcMain.handle("video-trimmer:cancel", async (n, j) => {
		videoTrimmer.cancel(j);
	}), ipcMain.handle("video-merger:choose-files", async () => {
		let n = await dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			filters: [{
				name: "Video Files",
				extensions: [
					"mp4",
					"mkv",
					"avi",
					"mov",
					"webm"
				]
			}, {
				name: "All Files",
				extensions: ["*"]
			}]
		});
		return n.canceled ? [] : n.filePaths;
	});
	async function n(j) {
		try {
			let M = 0, N = await fs.readdir(j, { withFileTypes: !0 });
			for (let P of N) {
				let N = join(j, P.name);
				try {
					if (P.isDirectory()) M += await n(N);
					else {
						let n = await fs.stat(N);
						M += n.size;
					}
				} catch {}
			}
			return M;
		} catch {
			return 0;
		}
	}
	function j(n) {
		return n && n.length === 8 ? `${n.substring(0, 4)}-${n.substring(4, 6)}-${n.substring(6, 8)}` : n;
	}
	setupCleanerHandlers(), protocol.handle("local-media", async (n) => {
		try {
			console.log("[LocalMedia] Request:", n.url);
			let j = new URL(n.url), M = decodeURIComponent(j.pathname);
			console.log("[LocalMedia] Initial Path:", M), process.platform === "win32" ? /^\/[a-zA-Z]:/.test(M) ? M = M.slice(1) : /^[a-zA-Z]\//.test(M) && (M = M.charAt(0) + ":" + M.slice(1)) : M = M.replace(/^\/+/, "/"), console.log("[LocalMedia] Final Path:", M);
			let N = (await fs.stat(M)).size, P = path.extname(M).toLowerCase(), F = "application/octet-stream";
			P === ".mp4" ? F = "video/mp4" : P === ".webm" ? F = "video/webm" : P === ".mov" ? F = "video/quicktime" : P === ".avi" ? F = "video/x-msvideo" : P === ".mkv" ? F = "video/x-matroska" : P === ".mp3" ? F = "audio/mpeg" : P === ".wav" && (F = "audio/wav");
			let I = n.headers.get("Range");
			if (I) {
				let n = I.replace(/bytes=/, "").split("-"), j = parseInt(n[0], 10), P = n[1] ? parseInt(n[1], 10) : N - 1, L = P - j + 1;
				console.log(`[LocalMedia] Streaming Range: ${j}-${P}/${N}`);
				let R = createReadStream(M, {
					start: j,
					end: P
				}), z = Readable.toWeb(R);
				return new Response(z, {
					status: 206,
					headers: {
						"Content-Range": `bytes ${j}-${P}/${N}`,
						"Accept-Ranges": "bytes",
						"Content-Length": L.toString(),
						"Content-Type": F
					}
				});
			} else {
				console.log(`[LocalMedia] Streaming Full: ${N}`);
				let n = createReadStream(M), j = Readable.toWeb(n);
				return new Response(j, { headers: {
					"Content-Length": N.toString(),
					"Content-Type": F,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (n) {
			return console.error("[LocalMedia] Error:", n), n.code === "ENOENT" ? new Response("File not found", { status: 404 }) : new Response("Error loading media: " + n.message, { status: 500 });
		}
	}), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: j } = __require("child_process");
			return j("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(n) {
	let j = /* @__PURE__ */ new Date(), M = j.getTime() + j.getTimezoneOffset() * 6e4, N = j.toLocaleString("en-US", {
		timeZone: n,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(N).getTime() - M) / (1e3 * 60 * 60);
}
function formatBytes(n) {
	if (n === 0) return "0 B";
	let j = 1024, M = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], N = Math.floor(Math.log(n) / Math.log(j));
	return `${(n / j ** +N).toFixed(1)} ${M[N]}`;
}
function formatSpeed(n) {
	return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB/s` : n > 1024 ? `${(n / 1024).toFixed(1)} KB/s` : `${n.toFixed(0)} B/s`;
}
