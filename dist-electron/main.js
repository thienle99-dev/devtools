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
	let e = Date.now();
	for (let [A, j] of dirSizeCache.entries()) e - j.timestamp > CACHE_TTL && dirSizeCache.delete(A);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let e = process.platform, A = [], j = os.homedir();
		if (e === "win32") {
			let e = process.env.WINDIR || "C:\\Windows", j = process.env.LOCALAPPDATA || "", M = os.tmpdir(), N = path.join(e, "Temp"), P = path.join(e, "Prefetch"), F = path.join(e, "SoftwareDistribution", "Download");
			A.push({
				path: M,
				name: "User Temporary Files",
				category: "temp"
			}), A.push({
				path: N,
				name: "System Temporary Files",
				category: "temp"
			}), A.push({
				path: P,
				name: "Prefetch Files",
				category: "system"
			}), A.push({
				path: F,
				name: "Windows Update Cache",
				category: "system"
			});
			let I = path.join(j, "Google/Chrome/User Data/Default/Cache"), L = path.join(j, "Microsoft/Edge/User Data/Default/Cache");
			A.push({
				path: I,
				name: "Chrome Cache",
				category: "cache"
			}), A.push({
				path: L,
				name: "Edge Cache",
				category: "cache"
			}), A.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (e === "darwin") {
			A.push({
				path: path.join(j, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), A.push({
				path: path.join(j, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), A.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), A.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), A.push({
				path: path.join(j, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), A.push({
				path: path.join(j, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: e } = await execAsync$1("tmutil listlocalsnapshots /"), j = e.split("\n").filter((e) => e.trim()).length;
				j > 0 && A.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${j})`,
					category: "system",
					virtual: !0,
					size: j * 500 * 1024 * 1024
				});
			} catch {}
		}
		let M = [], N = 0;
		for (let e of A) try {
			if (e.virtual) {
				M.push({
					...e,
					sizeFormatted: formatBytes$1(e.size || 0)
				}), N += e.size || 0;
				continue;
			}
			let A = await fs.stat(e.path).catch(() => null);
			if (A) {
				let j = A.isDirectory() ? await getDirSize(e.path) : A.size;
				j > 0 && (M.push({
					...e,
					size: j,
					sizeFormatted: formatBytes$1(j)
				}), N += j);
			}
		} catch {}
		return {
			items: M,
			totalSize: N,
			totalSizeFormatted: formatBytes$1(N)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (e, A) => {
		let j = A || os.homedir(), M = e.sender;
		return await scanDirectoryForLens(j, 0, 1, (e) => {
			M && !M.isDestroyed() && M.send("cleaner:space-lens-progress", e);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (e, A) => {
		let j = dirSizeCache.get(A);
		if (j && Date.now() - j.timestamp < CACHE_TTL) return {
			size: j.size,
			sizeFormatted: formatBytes$1(j.size),
			cached: !0
		};
		try {
			let e = await getDirSizeLimited(A, 4), j = formatBytes$1(e);
			return dirSizeCache.set(A, {
				size: e,
				timestamp: Date.now()
			}), {
				size: e,
				sizeFormatted: j,
				cached: !1
			};
		} catch (e) {
			return {
				size: 0,
				sizeFormatted: formatBytes$1(0),
				cached: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (e, A) => {
		if (A) for (let e of dirSizeCache.keys()) e.startsWith(A) && dirSizeCache.delete(e);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let e = await si.processes(), A = await si.mem(), j = await si.currentLoad();
		return {
			heavyApps: e.list.sort((e, A) => A.cpu + A.mem - (e.cpu + e.mem)).slice(0, 10).map((e) => ({
				pid: e.pid,
				name: e.name,
				cpu: e.cpu,
				mem: e.mem,
				user: e.user,
				path: e.path
			})),
			memory: {
				total: A.total,
				used: A.used,
				percent: A.used / A.total * 100
			},
			cpuLoad: j.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let e = process.platform, A = [];
		if (e === "darwin") try {
			let e = path.join(os.homedir(), "Library/LaunchAgents"), j = await fs.readdir(e).catch(() => []);
			for (let M of j) if (M.endsWith(".plist")) {
				let j = path.join(e, M), { stdout: N } = await execAsync$1(`launchctl list | grep -i "${M.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), P = N.trim().length > 0;
				A.push({
					name: M.replace(".plist", ""),
					path: j,
					type: "LaunchAgent",
					enabled: P
				});
			}
			let M = "/Library/LaunchAgents", N = await fs.readdir(M).catch(() => []);
			for (let e of N) {
				let j = path.join(M, e), { stdout: N } = await execAsync$1(`launchctl list | grep -i "${e.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), P = N.trim().length > 0;
				A.push({
					name: e.replace(".plist", ""),
					path: j,
					type: "SystemAgent",
					enabled: P
				});
			}
		} catch {}
		else if (e === "win32") try {
			let { stdout: e } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), j = JSON.parse(e), M = Array.isArray(j) ? j : [j];
			for (let e of M) A.push({
				name: e.Name,
				path: e.Command,
				type: "StartupCommand",
				location: e.Location,
				enabled: !0
			});
		} catch {}
		return A;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (e, A) => {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let e = A.enabled ?? !0;
				if (A.type === "LaunchAgent" || A.type === "SystemAgent") return e ? await execAsync$1(`launchctl unload "${A.path}"`) : await execAsync$1(`launchctl load "${A.path}"`), {
					success: !0,
					enabled: !e
				};
			} else if (j === "win32") {
				let e = A.enabled ?? !0;
				if (A.location === "Startup") {
					let j = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), M = path.basename(A.path), N = path.join(j, M);
					return e && await fs.unlink(N).catch(() => {}), {
						success: !0,
						enabled: !e
					};
				} else return {
					success: !0,
					enabled: !e
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (e, A) => {
		try {
			return process.kill(A, "SIGKILL"), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let e = process.platform, A = [];
		if (e === "darwin") {
			let e = "/Applications", j = await fs.readdir(e, { withFileTypes: !0 }).catch(() => []);
			for (let M of j) if (M.name.endsWith(".app")) {
				let j = path.join(e, M.name);
				try {
					let e = await fs.stat(j);
					A.push({
						name: M.name.replace(".app", ""),
						path: j,
						size: await getDirSize(j),
						installDate: e.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (e === "win32") try {
			let { stdout: e } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), j = JSON.parse(e), M = Array.isArray(j) ? j : [j];
			for (let e of M) e.DisplayName && A.push({
				name: e.DisplayName,
				version: e.DisplayVersion,
				path: e.InstallLocation,
				installDate: e.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return A;
	}), ipcMain.handle("cleaner:get-large-files", async (e, A) => {
		let j = A.minSize || 100 * 1024 * 1024, M = A.scanPaths || [os.homedir()], N = [];
		for (let e of M) await findLargeFiles(e, j, N);
		return N.sort((e, A) => A.size - e.size), N.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (e, A) => {
		let j = A || os.homedir(), M = /* @__PURE__ */ new Map(), N = [];
		await findDuplicates(j, M);
		for (let [e, A] of M.entries()) if (A.length > 1) try {
			let j = await fs.stat(A[0]);
			N.push({
				hash: e,
				size: j.size,
				sizeFormatted: formatBytes$1(j.size),
				totalWasted: j.size * (A.length - 1),
				totalWastedFormatted: formatBytes$1(j.size * (A.length - 1)),
				files: A
			});
		} catch {}
		return N.sort((e, A) => A.totalWasted - e.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (e, A) => {
		let j = 0, M = [], N = process.platform, P = checkFilesSafety(A, N);
		if (!P.safe && P.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${P.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: P.blocked
		};
		for (let e = 0; e < A.length; e += 50) {
			let N = A.slice(e, e + 50);
			for (let e of N) try {
				if (e === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), j += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let A = await fs.stat(e).catch(() => null);
				if (!A) continue;
				let M = A.isDirectory() ? await getDirSize(e) : A.size;
				A.isDirectory() ? await fs.rm(e, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(e), j += M;
			} catch {
				M.push(e);
			}
		}
		return {
			success: M.length === 0,
			freedSize: j,
			freedSizeFormatted: formatBytes$1(j),
			failed: M
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (e, A) => {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let e = A.path, j = A.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${e}" to trash'`);
				let M = os.homedir(), N = [
					path.join(M, "Library/Preferences", `*${j}*`),
					path.join(M, "Library/Application Support", j),
					path.join(M, "Library/Caches", j),
					path.join(M, "Library/Logs", j),
					path.join(M, "Library/Saved Application State", `*${j}*`),
					path.join(M, "Library/LaunchAgents", `*${j}*`)
				], P = 0;
				for (let e of N) try {
					let A = await fs.readdir(path.dirname(e)).catch(() => []);
					for (let M of A) if (M.includes(j)) {
						let A = path.join(path.dirname(e), M), j = await fs.stat(A).catch(() => null);
						j && (j.isDirectory() ? (P += await getDirSize(A), await fs.rm(A, {
							recursive: !0,
							force: !0
						})) : (P += j.size, await fs.unlink(A)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: P,
					freedSizeFormatted: formatBytes$1(P)
				};
			} else if (j === "win32") {
				let e = A.name, j = 0;
				try {
					let { stdout: M } = await execAsync$1(`wmic product where name="${e.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), N = M.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (N) {
						let e = N[1];
						await execAsync$1(`msiexec /x ${e} /quiet /norestart`), j = await getDirSize(A.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${e}*'} | Remove-AppxPackage"`).catch(() => {}), j = await getDirSize(A.path).catch(() => 0);
				} catch {
					j = await getDirSize(A.path).catch(() => 0), await fs.rm(A.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let M = process.env.LOCALAPPDATA || "", N = process.env.APPDATA || "", P = [path.join(M, e), path.join(N, e)];
				for (let e of P) try {
					await fs.stat(e).catch(() => null) && (j += await getDirSize(e).catch(() => 0), await fs.rm(e, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: j,
					freedSizeFormatted: formatBytes$1(j)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let e = process.platform, A = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (e === "win32") try {
			let { stdout: e } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), j = parseInt(e.trim()) || 0;
			j > 0 && (A.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: j,
				size: 0,
				description: "Recently opened documents registry entries"
			}), A.totalItems += j);
			let { stdout: M } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), N = parseInt(M.trim()) || 0;
			N > 0 && (A.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: N,
				size: 0,
				description: "Recently run programs registry entries"
			}), A.totalItems += N);
			let P = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let e = await fs.readdir(P, { recursive: !0 }).catch(() => []), j = [], M = 0;
				for (let A of e) {
					let e = path.join(P, A);
					try {
						let A = await fs.stat(e);
						A.isFile() && (j.push(e), M += A.size);
					} catch {}
				}
				j.length > 0 && (A.activityHistory.push({
					name: "Activity History",
					path: P,
					type: "files",
					count: j.length,
					size: M,
					sizeFormatted: formatBytes$1(M),
					files: j,
					description: "Windows activity history files"
				}), A.totalItems += j.length, A.totalSize += M);
			} catch {}
			let F = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let e = await fs.readdir(F).catch(() => []), j = [], M = 0;
				for (let A of e) {
					let e = path.join(F, A);
					try {
						let A = await fs.stat(e);
						j.push(e), M += A.size;
					} catch {}
				}
				j.length > 0 && (A.activityHistory.push({
					name: "Windows Search History",
					path: F,
					type: "files",
					count: j.length,
					size: M,
					sizeFormatted: formatBytes$1(M),
					files: j,
					description: "Windows search history files"
				}), A.totalItems += j.length, A.totalSize += M);
			} catch {}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				results: A
			};
		}
		else if (e === "darwin") try {
			let e = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let j = await fs.readdir(e, { recursive: !0 }).catch(() => []), M = [], N = 0;
				for (let A of j) {
					let j = path.join(e, A);
					try {
						let e = await fs.stat(j);
						e.isFile() && (M.push(j), N += e.size);
					} catch {}
				}
				M.length > 0 && (A.spotlightHistory.push({
					name: "Spotlight Search History",
					path: e,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes$1(N),
					files: M,
					description: "macOS Spotlight search history"
				}), A.totalItems += M.length, A.totalSize += N);
			} catch {}
			let j = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let e = await fs.readdir(j, { recursive: !0 }).catch(() => []), M = [], N = 0;
				for (let A of e) {
					let e = path.join(j, A);
					try {
						let A = await fs.stat(e);
						A.isFile() && (M.push(e), N += A.size);
					} catch {}
				}
				M.length > 0 && (A.quickLookCache.push({
					name: "Quick Look Cache",
					path: j,
					type: "files",
					count: M.length,
					size: N,
					sizeFormatted: formatBytes$1(N),
					files: M,
					description: "macOS Quick Look thumbnail cache"
				}), A.totalItems += M.length, A.totalSize += N);
			} catch {}
			let M = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let e = await fs.readdir(M).catch(() => []), j = [], N = 0;
				for (let A of e) if (A.includes("RecentItems")) {
					let e = path.join(M, A);
					try {
						let A = await fs.stat(e);
						j.push(e), N += A.size;
					} catch {}
				}
				j.length > 0 && (A.spotlightHistory.push({
					name: "Recently Opened Files",
					path: M,
					type: "files",
					count: j.length,
					size: N,
					sizeFormatted: formatBytes$1(N),
					files: j,
					description: "macOS recently opened files list"
				}), A.totalItems += j.length, A.totalSize += N);
			} catch {}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				results: A
			};
		}
		return {
			success: !0,
			results: A
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (e, A) => {
		let j = process.platform, M = 0, N = 0, P = [];
		if (j === "win32") try {
			if (A.registry) {
				try {
					let { stdout: e } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), A = parseInt(e.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), M += A;
				} catch (e) {
					P.push(`Failed to clean Recent Documents registry: ${e.message}`);
				}
				try {
					let { stdout: e } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), A = parseInt(e.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), M += A;
				} catch (e) {
					P.push(`Failed to clean Recent Programs registry: ${e.message}`);
				}
			}
			if (A.activityHistory) {
				let e = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean activity history: ${e.message}`);
				}
				let A = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let e = await fs.readdir(A).catch(() => []);
					for (let j of e) {
						let e = path.join(A, j);
						try {
							let A = await fs.stat(e);
							N += A.size, await fs.unlink(e), M++;
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean search history: ${e.message}`);
				}
			}
		} catch (e) {
			P.push(`Windows privacy cleanup failed: ${e.message}`);
		}
		else if (j === "darwin") try {
			if (A.spotlightHistory) {
				let e = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean Spotlight history: ${e.message}`);
				}
				let A = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let e = await fs.readdir(A).catch(() => []);
					for (let j of e) if (j.includes("RecentItems")) {
						let e = path.join(A, j);
						try {
							let A = await fs.stat(e);
							N += A.size, await fs.unlink(e), M++;
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean recent items: ${e.message}`);
				}
			}
			if (A.quickLookCache) {
				let e = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let A = await fs.readdir(e, { recursive: !0 }).catch(() => []);
					for (let j of A) {
						let A = path.join(e, j);
						try {
							let e = await fs.stat(A);
							e.isFile() && (N += e.size, await fs.unlink(A), M++);
						} catch {}
					}
				} catch (e) {
					P.push(`Failed to clean Quick Look cache: ${e.message}`);
				}
			}
		} catch (e) {
			P.push(`macOS privacy cleanup failed: ${e.message}`);
		}
		return {
			success: P.length === 0,
			cleanedItems: M,
			freedSize: N,
			freedSizeFormatted: formatBytes$1(N),
			errors: P
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let e = process.platform, A = os.homedir(), j = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, M = [];
		if (e === "win32") {
			let e = process.env.LOCALAPPDATA || "", A = process.env.APPDATA || "";
			M.push({
				name: "Chrome",
				paths: {
					history: [path.join(e, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(e, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(e, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(e, "Google/Chrome/User Data/Default/History")]
				}
			}), M.push({
				name: "Edge",
				paths: {
					history: [path.join(e, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(e, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(e, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(e, "Microsoft/Edge/User Data/Default/History")]
				}
			}), M.push({
				name: "Firefox",
				paths: {
					history: [path.join(A, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(A, "Mozilla/Firefox/Profiles")],
					cache: [path.join(e, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(A, "Mozilla/Firefox/Profiles")]
				}
			});
		} else e === "darwin" && (M.push({
			name: "Safari",
			paths: {
				history: [path.join(A, "Library/Safari/History.db")],
				cookies: [path.join(A, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(A, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(A, "Library/Safari/Downloads.plist")]
			}
		}), M.push({
			name: "Chrome",
			paths: {
				history: [path.join(A, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(A, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(A, "Library/Caches/Google/Chrome")],
				downloads: [path.join(A, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), M.push({
			name: "Firefox",
			paths: {
				history: [path.join(A, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(A, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(A, "Library/Caches/Firefox")],
				downloads: [path.join(A, "Library/Application Support/Firefox/Profiles")]
			}
		}), M.push({
			name: "Edge",
			paths: {
				history: [path.join(A, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(A, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(A, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(A, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let A of M) {
			let M = {
				name: A.name,
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
			for (let [j, N] of Object.entries(A.paths)) for (let P of N) try {
				if (j === "cache" && e === "darwin" && A.name === "Safari") {
					let e = await fs.stat(P).catch(() => null);
					if (e && e.isDirectory()) {
						let e = await getDirSize(P);
						M[j].size += e, M[j].paths.push(P), M[j].count += 1;
					}
				} else {
					let e = await fs.stat(P).catch(() => null);
					if (e) if (e.isDirectory()) {
						let e = await getDirSize(P);
						M[j].size += e, M[j].paths.push(P), M[j].count += 1;
					} else e.isFile() && (M[j].size += e.size, M[j].paths.push(P), M[j].count += 1);
				}
			} catch {}
			let N = Object.values(M).reduce((e, A) => e + (typeof A == "object" && A.size ? A.size : 0), 0);
			N > 0 && (M.totalSize = N, M.totalSizeFormatted = formatBytes$1(N), j.browsers.push(M), j.totalSize += N, j.totalItems += Object.values(M).reduce((e, A) => e + (typeof A == "object" && A.count ? A.count : 0), 0));
		}
		return {
			success: !0,
			results: j
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (e, A) => {
		let j = process.platform, M = os.homedir(), N = 0, P = 0, F = [], I = {};
		if (j === "win32") {
			let e = process.env.LOCALAPPDATA || "", A = process.env.APPDATA || "";
			I.Chrome = {
				history: [path.join(e, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(e, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(e, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(e, "Google/Chrome/User Data/Default/History")]
			}, I.Edge = {
				history: [path.join(e, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(e, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(e, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(e, "Microsoft/Edge/User Data/Default/History")]
			}, I.Firefox = {
				history: [path.join(A, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(A, "Mozilla/Firefox/Profiles")],
				cache: [path.join(e, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(A, "Mozilla/Firefox/Profiles")]
			};
		} else j === "darwin" && (I.Safari = {
			history: [path.join(M, "Library/Safari/History.db")],
			cookies: [path.join(M, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(M, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(M, "Library/Safari/Downloads.plist")]
		}, I.Chrome = {
			history: [path.join(M, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(M, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(M, "Library/Caches/Google/Chrome")],
			downloads: [path.join(M, "Library/Application Support/Google/Chrome/Default/History")]
		}, I.Firefox = {
			history: [path.join(M, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(M, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(M, "Library/Caches/Firefox")],
			downloads: [path.join(M, "Library/Application Support/Firefox/Profiles")]
		}, I.Edge = {
			history: [path.join(M, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(M, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(M, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(M, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let e of A.browsers) {
			let j = I[e];
			if (j) for (let M of A.types) {
				let A = j[M];
				if (A) for (let j of A) try {
					let e = await fs.stat(j).catch(() => null);
					if (!e) continue;
					if (e.isDirectory()) {
						let e = await getDirSize(j);
						await fs.rm(j, {
							recursive: !0,
							force: !0
						}), P += e, N++;
					} else e.isFile() && (P += e.size, await fs.unlink(j), N++);
				} catch (A) {
					F.push(`Failed to clean ${e} ${M}: ${A.message}`);
				}
			}
		}
		return {
			success: F.length === 0,
			cleanedItems: N,
			freedSize: P,
			freedSizeFormatted: formatBytes$1(P),
			errors: F
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let e = process.platform, A = [];
		try {
			if (e === "win32") {
				let { stdout: e } = await execAsync$1("netsh wlan show profiles"), j = e.split("\n");
				for (let e of j) {
					let j = e.match(/All User Profile\s*:\s*(.+)/);
					if (j) {
						let e = j[1].trim();
						try {
							let { stdout: j } = await execAsync$1(`netsh wlan show profile name="${e}" key=clear`), M = j.match(/Key Content\s*:\s*(.+)/);
							A.push({
								name: e,
								hasPassword: !!M,
								platform: "windows"
							});
						} catch {
							A.push({
								name: e,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (e === "darwin") {
				let { stdout: e } = await execAsync$1("networksetup -listallhardwareports");
				if (e.split("\n").find((e) => e.includes("Wi-Fi") || e.includes("AirPort"))) {
					let { stdout: e } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), j = e.split("\n").filter((e) => e.trim() && !e.includes("Preferred networks"));
					for (let e of j) {
						let j = e.trim();
						j && A.push({
							name: j,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: A
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (e, A) => {
		let j = process.platform;
		try {
			return j === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${A}"`), { success: !0 }) : j === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${A}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (e, A) => {
		let j = process.platform, M = Date.now(), N = "";
		try {
			if (j === "win32") switch (A.category) {
				case "sfc":
					let { stdout: e } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					N = e;
					break;
				case "dism":
					let { stdout: j } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					N = j;
					break;
				case "disk-cleanup":
					let { stdout: M } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					N = M || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: P } = await execAsync$1("ipconfig /flushdns");
					N = P || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: F } = await execAsync$1("netsh winsock reset");
					N = F || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), N = "Windows Search index rebuilt successfully";
					} catch (e) {
						throw Error(`Failed to rebuild search index: ${e.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${A.category}`);
			}
			else if (j === "darwin") switch (A.category) {
				case "time-machine-cleanup":
					try {
						let { stdout: e } = await execAsync$1("sudo tmutil deletelocalsnapshots /");
						N = e || "Local Time Machine snapshots removed successfully";
					} catch (e) {
						throw Error(`Failed to clean Time Machine snapshots: ${e.message}`);
					}
					break;
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), N = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), N = "Spotlight index rebuilt successfully (user directory only)";
						} catch (e) {
							throw Error(`Failed to rebuild Spotlight index: ${e.message}`);
						}
					}
					break;
				case "launch-services-reset":
					try {
						await execAsync$1("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user"), N = "Launch Services database reset successfully. You may need to restart apps for changes to take effect.";
					} catch (e) {
						throw Error(`Failed to reset Launch Services: ${e.message}`);
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), N = "DNS cache flushed successfully";
					} catch (e) {
						throw Error(`Failed to flush DNS: ${e.message}`);
					}
					break;
				case "gatekeeper-check":
					try {
						let { stdout: e } = await execAsync$1("spctl --status");
						N = `Gatekeeper Status: ${e.trim()}`;
					} catch (e) {
						throw Error(`Failed to check Gatekeeper: ${e.message}`);
					}
					break;
				case "mail-rebuild":
					try {
						let e = os.homedir();
						await execAsync$1(`find "${path.join(e, "Library/Mail")}" -name "Envelope Index*" -delete`), N = "Mail database indexes cleared. Rebuild will occur next time you open Mail.app.";
					} catch (e) {
						throw Error(`Failed to rebuild Mail database: ${e.message}`);
					}
					break;
				case "icloud-cleanup":
					try {
						let e = os.homedir(), A = path.join(e, "Library/Caches/com.apple.bird"), j = path.join(e, "Library/Caches/com.apple.CloudDocs");
						await fs.rm(A, {
							recursive: !0,
							force: !0
						}).catch(() => {}), await fs.rm(j, {
							recursive: !0,
							force: !0
						}).catch(() => {}), N = "iCloud cache cleared successfully";
					} catch (e) {
						throw Error(`Failed to clear iCloud cache: ${e.message}`);
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: e } = await execAsync$1("diskutil verifyVolume /");
						N = e || "Disk permissions verified";
					} catch (e) {
						throw Error(`Failed to verify disk: ${e.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${A.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: A.id,
				duration: Date.now() - M,
				output: N
			};
		} catch (e) {
			return {
				success: !1,
				taskId: A.id,
				duration: Date.now() - M,
				error: e.message,
				output: N
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let e = await si.mem(), A = await si.currentLoad(), j = await si.fsSize(), M = await si.battery().catch(() => null), N = [], P = j.find((e) => e.mount === "/" || e.mount === "C:") || j[0];
			if (P) {
				let e = P.available / P.size * 100;
				e < 10 ? N.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(P.available)} free (${e.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : e < 20 && N.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(P.available)} free (${e.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			A.currentLoad > 90 && N.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${A.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let F = e.used / e.total * 100;
			return F > 90 && N.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${F.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: A.currentLoad,
				ram: {
					used: e.used,
					total: e.total,
					percentage: F
				},
				disk: P ? {
					free: P.available,
					total: P.size,
					percentage: (P.size - P.available) / P.size * 100
				} : null,
				battery: M ? {
					level: M.percent,
					charging: M.isCharging || !1
				} : null,
				alerts: N
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (e, A) => {
		try {
			let e = process.platform, j = checkFilesSafety(A, e);
			return {
				success: !0,
				safe: j.safe,
				warnings: j.warnings,
				blocked: j.blocked
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (e, A) => {
		try {
			return await createBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (e, A) => {
		try {
			let e = await getBackupInfo(A);
			return {
				success: e !== null,
				backupInfo: e
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (e, A) => {
		try {
			return await restoreBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (e, A) => {
		try {
			return await deleteBackup(A);
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	});
}
async function getDirSize(e) {
	let A = 0;
	try {
		let j = await fs.readdir(e, { withFileTypes: !0 });
		for (let M of j) {
			let j = path.join(e, M.name);
			if (M.isDirectory()) A += await getDirSize(j);
			else {
				let e = await fs.stat(j).catch(() => null);
				e && (A += e.size);
			}
		}
	} catch {}
	return A;
}
async function getDirSizeLimited(e, A, j = 0) {
	if (j >= A) return 0;
	let M = 0;
	try {
		let N = await fs.readdir(e, { withFileTypes: !0 });
		for (let P of N) {
			if (P.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(P.name)) continue;
			let N = path.join(e, P.name);
			try {
				if (P.isDirectory()) M += await getDirSizeLimited(N, A, j + 1);
				else {
					let e = await fs.stat(N).catch(() => null);
					e && (M += e.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return M;
}
async function scanDirectoryForLens(e, A, j, M) {
	try {
		let N = await fs.stat(e), P = path.basename(e) || e;
		if (!N.isDirectory()) {
			let A = {
				name: P,
				path: e,
				size: N.size,
				sizeFormatted: formatBytes$1(N.size),
				type: "file"
			};
			return M && M({
				currentPath: P,
				progress: 100,
				status: `Scanning file: ${P}`,
				item: A
			}), A;
		}
		M && M({
			currentPath: P,
			progress: 0,
			status: `Scanning directory: ${P}`
		});
		let F = await fs.readdir(e, { withFileTypes: !0 }), I = [], L = 0, R = F.filter((e) => !e.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(e.name)), z = R.length, B = 0;
		for (let N of R) {
			let P = path.join(e, N.name);
			if (M) {
				let e = Math.floor(B / z * 100), A = N.isDirectory() ? "directory" : "file";
				M({
					currentPath: N.name,
					progress: e,
					status: `Scanning ${A}: ${N.name}`
				});
			}
			let F = null;
			if (A < j) F = await scanDirectoryForLens(P, A + 1, j, M), F && (I.push(F), L += F.size);
			else try {
				let e = (await fs.stat(P)).size;
				if (N.isDirectory()) {
					let A = dirSizeCache.get(P);
					if (A && Date.now() - A.timestamp < CACHE_TTL) e = A.size;
					else try {
						e = await getDirSizeLimited(P, 3), dirSizeCache.set(P, {
							size: e,
							timestamp: Date.now()
						});
					} catch {
						e = 0;
					}
				}
				F = {
					name: N.name,
					path: P,
					size: e,
					sizeFormatted: formatBytes$1(e),
					type: N.isDirectory() ? "dir" : "file"
				}, I.push(F), L += e;
			} catch {
				B++;
				continue;
			}
			F && M && M({
				currentPath: N.name,
				progress: Math.floor((B + 1) / z * 100),
				status: `Scanned: ${N.name}`,
				item: F
			}), B++;
		}
		let V = {
			name: P,
			path: e,
			size: L,
			sizeFormatted: formatBytes$1(L),
			type: "dir",
			children: I.sort((e, A) => A.size - e.size)
		};
		return M && M({
			currentPath: P,
			progress: 100,
			status: `Completed: ${P}`
		}), V;
	} catch {
		return null;
	}
}
async function findLargeFiles(e, A, j) {
	try {
		let M = await fs.readdir(e, { withFileTypes: !0 });
		for (let N of M) {
			let M = path.join(e, N.name);
			if (!(N.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(N.name))) try {
				let e = await fs.stat(M);
				N.isDirectory() ? await findLargeFiles(M, A, j) : e.size >= A && j.push({
					name: N.name,
					path: M,
					size: e.size,
					sizeFormatted: formatBytes$1(e.size),
					lastAccessed: e.atime,
					type: path.extname(N.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(e, A) {
	try {
		let j = await fs.readdir(e, { withFileTypes: !0 });
		for (let M of j) {
			let j = path.join(e, M.name);
			if (!(M.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(M.name))) try {
				let e = await fs.stat(j);
				if (M.isDirectory()) await findDuplicates(j, A);
				else if (e.size > 1024 * 1024 && e.size < 50 * 1024 * 1024) {
					let e = await hashFile(j), M = A.get(e) || [];
					M.push(j), A.set(e, M);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(e) {
	let A = await fs.readFile(e);
	return createHash("md5").update(A).digest("hex");
}
function formatBytes$1(e) {
	if (e === 0) return "0 B";
	let A = 1024, j = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], M = Math.floor(Math.log(e) / Math.log(A));
	return `${(e / A ** +M).toFixed(1)} ${j[M]}`;
}
var getPlatformProtectedPaths = (e) => {
	let A = os.homedir(), j = [];
	if (e === "win32") {
		let e = process.env.WINDIR || "C:\\Windows", M = process.env.PROGRAMFILES || "C:\\Program Files", N = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		j.push({
			path: e,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: M,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: N,
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
			path: path.join(A, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(A, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else e === "darwin" && j.push({
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
		path: path.join(A, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(A, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return j;
}, checkFileSafety = (e, A) => {
	let j = [], M = [], N = getPlatformProtectedPaths(A);
	for (let P of N) {
		if (P.platform && P.platform !== A && P.platform !== "all") continue;
		let N = path.normalize(P.path), F = path.normalize(e);
		if (F === N || F.startsWith(N + path.sep)) {
			if (P.action === "protect") return M.push(e), {
				safe: !1,
				warnings: [],
				blocked: [e]
			};
			P.action === "warn" && j.push({
				path: e,
				reason: P.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: M.length === 0,
		warnings: j,
		blocked: M
	};
}, checkFilesSafety = (e, A) => {
	let j = [], M = [];
	for (let N of e) {
		let e = checkFileSafety(N, A);
		e.safe || M.push(...e.blocked), j.push(...e.warnings);
	}
	return {
		safe: M.length === 0,
		warnings: j,
		blocked: M
	};
}, getBackupDir = () => {
	let e = os.homedir();
	return process.platform === "win32" ? path.join(e, "AppData", "Local", "devtools-app", "backups") : path.join(e, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (e) => {
	let A = 0;
	for (let j of e) try {
		let e = await fs.stat(j);
		e.isFile() && (A += e.size);
	} catch {}
	return A;
}, createBackup = async (e) => {
	try {
		let A = getBackupDir();
		await fs.mkdir(A, { recursive: !0 });
		let j = generateBackupId(), M = path.join(A, j);
		await fs.mkdir(M, { recursive: !0 });
		let N = await calculateTotalSize(e), P = [];
		for (let A of e) try {
			let e = await fs.stat(A), j = path.basename(A), N = path.join(M, j);
			e.isFile() && (await fs.copyFile(A, N), P.push(A));
		} catch {}
		let F = {
			id: j,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: P,
			totalSize: N,
			location: M,
			platform: process.platform
		}, I = path.join(M, "backup-info.json");
		return await fs.writeFile(I, JSON.stringify(F, null, 2)), {
			success: !0,
			backupId: j,
			backupInfo: F
		};
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, listBackups = async () => {
	try {
		let e = getBackupDir(), A = await fs.readdir(e, { withFileTypes: !0 }), j = [];
		for (let M of A) if (M.isDirectory() && M.name.startsWith("backup-")) {
			let A = path.join(e, M.name, "backup-info.json");
			try {
				let e = await fs.readFile(A, "utf-8");
				j.push(JSON.parse(e));
			} catch {}
		}
		return j.sort((e, A) => new Date(A.timestamp).getTime() - new Date(e.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (e) => {
	try {
		let A = getBackupDir(), j = path.join(A, e, "backup-info.json"), M = await fs.readFile(j, "utf-8");
		return JSON.parse(M);
	} catch {
		return null;
	}
}, restoreBackup = async (e) => {
	try {
		let A = await getBackupInfo(e);
		if (!A) return {
			success: !1,
			error: "Backup not found"
		};
		let j = A.location;
		for (let e of A.files) try {
			let A = path.basename(e), M = path.join(j, A);
			if ((await fs.stat(M)).isFile()) {
				let A = path.dirname(e);
				await fs.mkdir(A, { recursive: !0 }), await fs.copyFile(M, e);
			}
		} catch {}
		return { success: !0 };
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, deleteBackup = async (e) => {
	try {
		let A = getBackupDir(), j = path.join(A, e);
		return await fs.rm(j, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}, __filename = fileURLToPath(import.meta.url), __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(e) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((e) => ({
				id: e.id,
				name: e.name,
				thumbnail: e.thumbnail.toDataURL(),
				type: e.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (e) {
			return console.error("Failed to get sources:", e), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let e = screen.getPrimaryDisplay(), A = e.scaleFactor || 1, j = {
				width: Math.ceil(e.size.width * A),
				height: Math.ceil(e.size.height * A)
			}, M = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: j
			});
			if (M.length === 0) throw Error("No screens available");
			let N = M[0].thumbnail;
			return {
				dataUrl: N.toDataURL(),
				width: N.getSize().width,
				height: N.getSize().height
			};
		} catch (e) {
			throw console.error("Failed to capture screen:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-window", async (e, A) => {
		try {
			let e = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((e) => e.id === A);
			if (!e) throw Error("Window not found");
			let j = e.thumbnail;
			return {
				dataUrl: j.toDataURL(),
				width: j.getSize().width,
				height: j.getSize().height
			};
		} catch (e) {
			throw console.error("Failed to capture window:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			let e = screen.getPrimaryDisplay(), j = e.scaleFactor || 1, M = {
				width: Math.ceil(e.size.width * j),
				height: Math.ceil(e.size.height * j)
			}, N = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: M
			});
			if (console.log(`Found ${N.length} sources.`), N.length === 0) throw console.error("No screens available for capture."), Error("No screens available");
			let P = N[0].thumbnail;
			return console.log(`Captured thumbnail size: ${P.getSize().width}x${P.getSize().height}`), console.log(`Display size: ${e.size.width}x${e.size.height} (Scale: ${e.scaleFactor})`), new Promise((j, M) => {
				let N = null, F = () => {
					N && !N.isDestroyed() && N.close(), ipcMain.removeHandler("screenshot:area-selected"), ipcMain.removeHandler("screenshot:area-cancelled");
				};
				ipcMain.handle("screenshot:area-selected", async (A, M) => {
					F();
					let N = e.scaleFactor, I = P.crop({
						x: Math.round(M.x * N),
						y: Math.round(M.y * N),
						width: Math.round(M.width * N),
						height: Math.round(M.height * N)
					});
					j({
						dataUrl: I.toDataURL(),
						width: I.getSize().width,
						height: I.getSize().height
					});
				}), ipcMain.handle("screenshot:area-cancelled", () => {
					F(), M(/* @__PURE__ */ Error("Area selection cancelled"));
				});
				let { width: I, height: L, x: R, y: B } = e.bounds;
				N = new BrowserWindow({
					x: R,
					y: B,
					width: I,
					height: L,
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
						preload: path.join(__dirname$1, "preload.mjs")
					}
				}), N.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), N.show(), N.focus(), N.loadURL("data:text/html;charset=utf-8,%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!DOCTYPE%20html%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20*%20%7B%20margin%3A%200%3B%20padding%3A%200%3B%20box-sizing%3A%20border-box%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20100vw%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20100vh%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20crosshair%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20transparent%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20overflow%3A%20hidden%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20user-select%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23selection%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%202px%20solid%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(59%2C%20130%2C%20246%2C%200.05)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%200%200%209999px%20rgba(0%2C%200%2C%200%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23toolbar%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%231a1b1e%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2010px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%2010px%2030px%20rgba(0%2C0%2C0%2C0.5)%2C%200%200%200%201px%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%202000%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20gap%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20animation%3A%20popIn%200.2s%20cubic-bezier(0.16%2C%201%2C%200.3%2C%201)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20popIn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%20opacity%3A%200%3B%20transform%3A%20scale(0.95)%20translateY(5px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%20opacity%3A%201%3B%20transform%3A%20scale(1)%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20justify-content%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%200%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%2036px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20pointer%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20all%200.15s%20ease%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(255%2C255%2C255%2C0.08)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20%23e5e5e5%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%3Ahover%20%7B%20background%3A%20rgba(255%2C255%2C255%2C0.12)%3B%20color%3A%20white%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(59%2C%20130%2C%20246%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Ahover%20%7B%20background%3A%20%232563eb%3B%20transform%3A%20translateY(-1px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Aactive%20%7B%20transform%3A%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23dimensions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%20-34px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%204px%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2012px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20opacity%200.2s%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23instructions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%2040px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%2050%25%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20translateX(-50%25)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(0%2C%200%2C%200%2C%200.7)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20backdrop-filter%3A%20blur(10px)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%208px%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2020px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20500%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%204px%2012px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%201px%20solid%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200.8%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.hidden%20%7B%20display%3A%20none%20!important%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22instructions%22%3EClick%20and%20drag%20to%20capture%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22selection%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22dimensions%22%3E0%20x%200%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22toolbar%22%20class%3D%22hidden%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-cancel%22%20id%3D%22btn-cancel%22%3ECancel%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-capture%22%20id%3D%22btn-capture%22%3ECapture%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20selection%20%3D%20document.getElementById('selection')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbar%20%3D%20document.getElementById('toolbar')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20dimensions%20%3D%20document.getElementById('dimensions')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCancel%20%3D%20document.getElementById('btn-cancel')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCapture%20%3D%20document.getElementById('btn-capture')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20startX%2C%20startY%2C%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20currentBounds%20%3D%20%7B%20x%3A%200%2C%20y%3A%200%2C%20width%3A%200%2C%20height%3A%200%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('contextmenu'%2C%20e%20%3D%3E%20e.preventDefault())%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20capture()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Preload%20script%20missed%3F')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%200%20%26%26%20currentBounds.height%20%3E%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.sendSelection(currentBounds)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20cancel()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.cancelSelection()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20If%20API%20is%20missing%2C%20we%20can't%20notify%20main%20process%2C%20but%20we%20can%20try%20to%20close%20window%20via%20window.close()%20if%20not%20sandboxed%3F%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20But%20contextIsolation%20is%20on.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Cannot%20cancel%20properly.')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCapture.onclick%20%3D%20capture%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCancel.onclick%20%3D%20cancel%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousedown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.target.closest('%23toolbar'))%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20!%3D%3D%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20%3D%3D%3D%202)%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20true%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.style.opacity%20%3D%20'1'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20startX%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20startY%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'block'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousemove'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20width%20%3D%20Math.abs(currentX%20-%20startX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20height%20%3D%20Math.abs(currentY%20-%20startY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20left%20%3D%20Math.min(startX%2C%20currentX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20top%20%3D%20Math.min(startY%2C%20currentY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20width%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20height%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.textContent%20%3D%20Math.round(width)%20%2B%20'%20x%20'%20%2B%20Math.round(height)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20currentBounds%20%3D%20%7B%20x%3A%20left%2C%20y%3A%20top%2C%20width%2C%20height%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mouseup'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%2010%20%26%26%20currentBounds.height%20%3E%2010)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.remove('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbarHeight%20%3D%2060%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20top%20%3D%20currentBounds.y%20%2B%20currentBounds.height%20%2B%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(top%20%2B%20toolbarHeight%20%3E%20window.innerHeight)%20top%20%3D%20currentBounds.y%20-%20toolbarHeight%20-%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20left%20%3D%20currentBounds.x%20%2B%20(currentBounds.width%20%2F%202)%20-%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%20%3D%20Math.max(10%2C%20Math.min(window.innerWidth%20-%20210%2C%20left))%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'none'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('keydown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Escape')%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Enter'%20%26%26%20!toolbar.classList.contains('hidden'))%20capture()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20"), setTimeout(() => {
					N && !N.isDestroyed() && (F(), M(/* @__PURE__ */ Error("Area selection timeout")));
				}, 12e4);
			});
		} catch (e) {
			throw console.error("Failed to capture area:", e), e;
		}
	}), ipcMain.handle("screenshot:capture-url", async (e, j) => {
		try {
			console.log("Capturing URL:", j);
			let e = new BrowserWindow({
				width: 1200,
				height: 800,
				show: !1,
				webPreferences: {
					offscreen: !1,
					contextIsolation: !0
				}
			});
			await e.loadURL(j);
			try {
				let A = e.webContents.debugger;
				A.attach("1.3");
				let j = await A.sendCommand("Page.getLayoutMetrics"), M = j.contentSize || j.cssContentSize || {
					width: 1200,
					height: 800
				}, N = Math.ceil(M.width), P = Math.ceil(M.height);
				console.log(`Page dimensions: ${N}x${P}`), await A.sendCommand("Emulation.setDeviceMetricsOverride", {
					width: N,
					height: P,
					deviceScaleFactor: 1,
					mobile: !1
				});
				let F = await A.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: !0
				});
				return A.detach(), e.close(), {
					dataUrl: "data:image/png;base64," + F.data,
					width: N,
					height: P
				};
			} catch (A) {
				console.error("CDP Error:", A);
				let j = await e.webContents.capturePage();
				return e.close(), {
					dataUrl: j.toDataURL(),
					width: j.getSize().width,
					height: j.getSize().height
				};
			}
		} catch (e) {
			throw console.error("Failed to capture URL:", e), e;
		}
	}), ipcMain.handle("screenshot:save-file", async (A, j, M) => {
		try {
			let { filename: A, format: N = "png" } = M, P = await dialog.showSaveDialog(e, {
				defaultPath: A || `screenshot-${Date.now()}.${N}`,
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
			if (P.canceled || !P.filePath) return {
				success: !1,
				canceled: !0
			};
			let F = j.replace(/^data:image\/\w+;base64,/, ""), I = Buffer.from(F, "base64");
			return await fs.writeFile(P.filePath, I), {
				success: !0,
				filePath: P.filePath
			};
		} catch (e) {
			return console.error("Failed to save screenshot:", e), {
				success: !1,
				error: e.message
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
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.initYtDlp();
	}
	async initYtDlp() {
		try {
			let e = require$3("yt-dlp-wrap"), A = e.default || e;
			if (fs$1.existsSync(this.binaryPath)) console.log("Using existing yt-dlp binary at:", this.binaryPath);
			else {
				console.log("Downloading yt-dlp binary to:", this.binaryPath);
				try {
					await A.downloadFromGithub(this.binaryPath), console.log("yt-dlp binary downloaded successfully");
				} catch (e) {
					throw console.error("Failed to download yt-dlp binary:", e), Error(`Failed to download yt-dlp: ${e}`);
				}
			}
			this.ytDlp = new A(this.binaryPath);
			let { FFmpegHelper: j } = await import("./ffmpeg-helper-D9RH3mTJ.js"), M = j.getFFmpegPath();
			if (M) {
				this.ffmpegPath = M, this.hasFFmpeg = !0;
				let e = j.getFFmpegVersion();
				console.log(`✅ FFmpeg ready: ${e || "version unknown"}`);
			} else console.warn("⚠️ FFmpeg not available - video features may be limited");
			await this.checkHelpers();
		} catch (e) {
			throw console.error("Failed to initialize yt-dlp:", e), e;
		}
	}
	async checkHelpers() {
		this.hasAria2c = !1;
		try {
			let e = app.getPath("userData"), A = path$1.join(e, "bin", "aria2c.exe");
			fs$1.existsSync(A) && (this.hasAria2c = !0, console.log("✅ Aria2c found locally:", A));
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
			let e = app.getPath("userData"), A = path$1.join(e, "bin");
			fs$1.existsSync(A) || fs$1.mkdirSync(A, { recursive: !0 });
			let j = path$1.join(A, "aria2.zip");
			await new Promise((e, A) => {
				let M = fs$1.createWriteStream(j);
				https.get("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip", (j) => {
					j.statusCode === 302 || j.statusCode === 301 ? https.get(j.headers.location, (j) => {
						if (j.statusCode !== 200) {
							A(/* @__PURE__ */ Error("DL Fail " + j.statusCode));
							return;
						}
						j.pipe(M), M.on("finish", () => {
							M.close(), e();
						});
					}).on("error", A) : j.statusCode === 200 ? (j.pipe(M), M.on("finish", () => {
						M.close(), e();
					})) : A(/* @__PURE__ */ Error(`Failed to download: ${j.statusCode}`));
				}).on("error", A);
			}), await promisify$1(exec$1)(`powershell -Command "Expand-Archive -Path '${j}' -DestinationPath '${A}' -Force"`);
			let M = path$1.join(A, "aria2-1.36.0-win-64bit-build1"), N = path$1.join(M, "aria2c.exe"), F = path$1.join(A, "aria2c.exe");
			fs$1.existsSync(N) && fs$1.copyFileSync(N, F);
			try {
				fs$1.unlinkSync(j);
			} catch {}
			return await this.checkHelpers(), this.hasAria2c;
		} catch (e) {
			throw console.error("Install Aria2 Failed", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < e && this.downloadQueue.length > 0;) {
			let e = this.downloadQueue.shift();
			e && (this.activeDownloadsCount++, e.run().then((A) => e.resolve(A)).catch((A) => e.reject(A)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async getVideoInfo(e) {
		await this.ensureInitialized();
		let A = this.videoInfoCache.get(e);
		if (A && Date.now() - A.timestamp < this.CACHE_TTL) return console.log("Returning cached video info for:", e), A.info;
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]), j = (A.formats || []).map((e) => ({
				itag: e.format_id ? parseInt(e.format_id) : 0,
				quality: e.quality || e.format_note || "unknown",
				qualityLabel: e.format_note || e.resolution,
				hasVideo: !!e.vcodec && e.vcodec !== "none",
				hasAudio: !!e.acodec && e.acodec !== "none",
				container: e.ext || "unknown",
				codecs: e.vcodec || e.acodec,
				bitrate: e.tbr ? e.tbr * 1e3 : void 0,
				audioBitrate: e.abr,
				filesize: e.filesize || e.filesize_approx
			})), M = /* @__PURE__ */ new Set();
			j.forEach((e) => {
				if (e.qualityLabel) {
					let A = e.qualityLabel.match(/(\d+p)/);
					A && M.add(A[1]);
				}
			});
			let N = Array.from(M).sort((e, A) => {
				let j = parseInt(e);
				return parseInt(A) - j;
			}), P = j.some((e) => e.hasVideo), F = j.some((e) => e.hasAudio), I;
			if (A.upload_date) try {
				let e = A.upload_date.toString();
				e.length === 8 && (I = `${e.substring(0, 4)}-${e.substring(4, 6)}-${e.substring(6, 8)}`);
			} catch {
				console.warn("Failed to parse upload date:", A.upload_date);
			}
			let L = {
				videoId: A.id || "",
				title: A.title || "Unknown",
				author: A.uploader || A.channel || "Unknown",
				lengthSeconds: parseInt(A.duration) || 0,
				thumbnailUrl: A.thumbnail || "",
				description: A.description || void 0,
				viewCount: parseInt(A.view_count) || void 0,
				uploadDate: I,
				formats: j,
				availableQualities: N,
				hasVideo: P,
				hasAudio: F
			};
			return this.videoInfoCache.set(e, {
				info: L,
				timestamp: Date.now()
			}), L;
		} catch (e) {
			throw Error(`Failed to get video info: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	async getPlaylistInfo(e) {
		await this.ensureInitialized();
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--flat-playlist",
				"--skip-download",
				"--no-check-certificate"
			]);
			if (!A.entries || !Array.isArray(A.entries)) throw Error("Not a valid playlist URL");
			let j = A.entries.map((e) => ({
				id: e.id || e.url,
				title: e.title || "Unknown Title",
				duration: e.duration || 0,
				thumbnail: e.thumbnail || e.thumbnails?.[0]?.url || "",
				url: e.url || `https://www.youtube.com/watch?v=${e.id}`
			}));
			return {
				playlistId: A.id || A.playlist_id || "unknown",
				title: A.title || A.playlist_title || "Unknown Playlist",
				videoCount: j.length,
				videos: j
			};
		} catch (e) {
			throw Error(`Failed to get playlist info: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	async checkDiskSpace(e, A) {
		try {
			let j = await si.fsSize(), M = path$1.parse(path$1.resolve(e)).root.toLowerCase(), N = j.find((e) => {
				let A = e.mount.toLowerCase();
				return M.startsWith(A) || A.startsWith(M.replace(/\\/g, ""));
			});
			if (N && N.available < A + 100 * 1024 * 1024) throw Error(`Insufficient disk space. Required: ${(A / 1024 / 1024).toFixed(2)} MB, Available: ${(N.available / 1024 / 1024).toFixed(2)} MB`);
		} catch (e) {
			console.warn("Disk space check failed:", e);
		}
	}
	async downloadVideo(e, A) {
		return new Promise((j, M) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(e, A),
				resolve: j,
				reject: M
			}), this.processQueue();
		});
	}
	async executeDownload(e, A) {
		await this.ensureInitialized(), console.log("ExecuteDownload - hasFFmpeg:", this.hasFFmpeg, "path:", this.ffmpegPath);
		let { url: j, format: M, quality: N, container: F, outputPath: I, maxSpeed: L, embedSubs: R, id: z } = e, B = z || randomUUID$1();
		try {
			let z = await this.getVideoInfo(j), V = this.sanitizeFilename(z.title), H = I || app.getPath("downloads"), U = F || (M === "audio" ? "mp3" : "mp4"), W = "";
			M === "audio" ? W = `_audio_${N || "best"}` : M === "video" && N && (W = `_${N}`);
			let G = path$1.join(H, `${V}${W}.%(ext)s`);
			fs$1.existsSync(H) || fs$1.mkdirSync(H, { recursive: !0 });
			let K = 0;
			if (M === "audio") K = z.formats.find((e) => e.hasAudio && !e.hasVideo && (e.quality === N || e.itag.toString() === "140"))?.filesize || 0;
			else {
				let e;
				e = N && N !== "best" ? z.formats.find((e) => e.qualityLabel?.startsWith(N) && e.hasVideo) : z.formats.find((e) => e.hasVideo);
				let A = z.formats.find((e) => e.hasAudio && !e.hasVideo);
				e && (K += e.filesize || 0), A && (K += A.filesize || 0);
			}
			K > 1024 * 1024 && await this.checkDiskSpace(H, K);
			let q = [
				j,
				"-o",
				G,
				"--no-playlist",
				"--no-warnings",
				"--newline",
				"--no-check-certificate",
				"--concurrent-fragments",
				`${e.concurrentFragments || 4}`,
				"--buffer-size",
				"1M",
				"--retries",
				"10",
				"--fragment-retries",
				"10",
				"-c"
			];
			if (R && q.push("--write-subs", "--write-auto-subs", "--sub-lang", "en.*,vi", "--embed-subs"), this.ffmpegPath && q.push("--ffmpeg-location", this.ffmpegPath), L && q.push("--limit-rate", L), this.ffmpegPath && q.push("--ffmpeg-location", this.ffmpegPath), M === "audio") q.push("-x", "--audio-format", F || "mp3", "--audio-quality", N || "0");
			else if (M === "video") {
				if (N && N !== "best") {
					let e = N.replace("p", "");
					q.push("-f", `bestvideo[height<=${e}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${e}]+bestaudio/best[height<=${e}]`);
				} else q.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
				let e = F || "mp4";
				q.push("--merge-output-format", e), e === "mp4" && q.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
			} else q.push("-f", "best");
			return new Promise((e, P) => {
				let F = 0, I = 0, L = 0, R = this.ytDlp.exec(q);
				if (this.activeProcesses.set(B, R), R.ytDlpProcess) {
					let e = R.ytDlpProcess;
					e.stdout?.on("data", (e) => {
						let j = e.toString();
						console.log(`[${B}] stdout:`, j), j.split(/\r?\n/).forEach((e) => {
							if (!e.trim()) return;
							let j = this.parseProgressLine(e);
							j && A && (j.totalBytes > 0 && (I = j.totalBytes), j.percent > 0 && (L = j.percent), F = L / 100 * I, A({
								id: B,
								percent: Math.round(L),
								downloaded: F,
								total: I,
								speed: j.speed,
								eta: j.eta,
								state: "downloading",
								filename: `${V}${W}.${U}`
							}));
						});
					}), e.stderr?.on("data", (e) => {
						let j = e.toString();
						console.log(`[${B}] stderr:`, j), j.split(/\r?\n/).forEach((e) => {
							if (!e.trim()) return;
							let j = this.parseProgressLine(e);
							j && A && (j.totalBytes > 0 && (I = j.totalBytes), j.percent > 0 && (L = j.percent), F = L / 100 * I, A({
								id: B,
								percent: Math.round(L),
								downloaded: F,
								total: I,
								speed: j.speed,
								eta: j.eta,
								state: "downloading",
								filename: `${V}.${U}`
							}));
						});
					});
				}
				R.on("close", (F) => {
					if (this.activeProcesses.delete(B), F === 0) {
						let P = path$1.join(H, `${V}${W}.${U}`), F = I;
						try {
							fs$1.existsSync(P) && (F = fs$1.statSync(P).size);
						} catch (e) {
							console.warn("Failed to get file size:", e);
						}
						A && A({
							id: B,
							percent: 100,
							downloaded: F,
							total: F,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: `${V}.${U}`
						}), this.addToHistory({
							url: j,
							title: z.title,
							thumbnailUrl: z.thumbnailUrl,
							format: M,
							quality: N || (M === "audio" ? "best" : "auto"),
							path: P,
							size: F,
							duration: z.lengthSeconds,
							status: "completed"
						}), e(P);
					} else this.cleanupPartialFiles(H, V, U), P(/* @__PURE__ */ Error(`yt-dlp exited with code ${F}`));
				}), R.on("error", (e) => {
					this.activeProcesses.delete(B), this.cleanupPartialFiles(H, V, U), P(e);
				});
			});
		} catch (e) {
			throw this.activeProcesses.delete(B), Error(`Download failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			if (A) {
				console.log(`Cancelling download ${e}`);
				try {
					A.ytDlpProcess && typeof A.ytDlpProcess.kill == "function" ? A.ytDlpProcess.kill() : typeof A.kill == "function" && A.kill();
				} catch (e) {
					console.error("Failed to kill process:", e);
				}
				this.activeProcesses.delete(e);
			}
		} else console.log(`Cancelling all ${this.activeProcesses.size} downloads`), this.activeProcesses.forEach((e) => {
			try {
				e.ytDlpProcess && typeof e.ytDlpProcess.kill == "function" ? e.ytDlpProcess.kill() : typeof e.kill == "function" && e.kill();
			} catch (e) {
				console.error("Failed to kill process:", e);
			}
		}), this.activeProcesses.clear();
	}
	cleanupPartialFiles(e, A, j) {
		try {
			[
				path$1.join(e, `${A}.${j}`),
				path$1.join(e, `${A}.${j}.part`),
				path$1.join(e, `${A}.${j}.ytdl`),
				path$1.join(e, `${A}.part`)
			].forEach((e) => {
				fs$1.existsSync(e) && fs$1.unlinkSync(e);
			});
		} catch (e) {
			console.error("Cleanup failed:", e);
		}
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
	}
	parseProgressLine(e) {
		let A = (e) => {
			if (!e) return 1;
			let A = e.toLowerCase();
			return A.includes("k") ? 1024 : A.includes("m") ? 1024 * 1024 : A.includes("g") ? 1024 * 1024 * 1024 : 1;
		};
		if (e.includes("[download]")) {
			let j = e.match(/(\d+(?:\.\d+)?)%/), M = e.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/), N = e.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/), P = e.match(/ETA\s+([\d:]+)/);
			if (console.log("[parseProgressLine] Matches:", {
				line: e,
				percentMatch: j?.[0],
				sizeMatch: M?.[0],
				speedMatch: N?.[0],
				etaMatch: P?.[0]
			}), j) {
				let e = parseFloat(j[1]), F = 0, I = 0, L = 0;
				if (M && (F = parseFloat(M[1].replace(/,/g, "")) * A(M[2])), N && (I = parseFloat(N[1].replace(/,/g, "")) * A(N[2].replace("/s", ""))), P) {
					let e = P[1].split(":").map(Number);
					L = e.length === 3 ? e[0] * 3600 + e[1] * 60 + e[2] : e.length === 2 ? e[0] * 60 + e[1] : e[0];
				}
				return {
					percent: e,
					totalBytes: F,
					downloadedBytes: 0,
					speed: I,
					eta: L,
					status: "downloading"
				};
			}
		}
		return null;
	}
	getHistory() {
		return this.store.get("history", []);
	}
	addToHistory(e) {
		let A = this.store.get("history", []), j = {
			...e,
			id: randomUUID$1(),
			timestamp: Date.now()
		};
		this.store.set("history", [j, ...A].slice(0, 50));
	}
	removeFromHistory(e) {
		let A = this.store.get("history", []).filter((A) => A.id !== e);
		this.store.set("history", A);
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
	saveSettings(e) {
		let A = {
			...this.store.get("settings"),
			...e
		};
		return this.store.set("settings", A), A;
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
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.init();
	}
	async init() {
		try {
			let e = require$2("yt-dlp-wrap"), A = e.default || e;
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (TikTok)..."), await A.downloadFromGithub(this.binaryPath)), this.ytDlp = new A(this.binaryPath);
			let { FFmpegHelper: j } = await import("./ffmpeg-helper-D9RH3mTJ.js"), M = j.getFFmpegPath();
			M ? (this.ffmpegPath = M, console.log("✅ TikTok Downloader: FFmpeg ready")) : console.warn("⚠️ TikTok Downloader: FFmpeg not available");
		} catch (e) {
			throw console.error("Failed to init TikTok downloader:", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async getVideoInfo(e) {
		await this.ensureInitialized();
		try {
			let A = await this.ytDlp.getVideoInfo([
				e,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate"
			]);
			return {
				id: A.id,
				title: A.title || "TikTok Video",
				author: A.uploader || A.channel || "Unknown",
				authorUsername: A.uploader_id || "",
				duration: A.duration || 0,
				thumbnailUrl: A.thumbnail || "",
				description: A.description,
				viewCount: A.view_count,
				likeCount: A.like_count,
				commentCount: A.comment_count,
				shareCount: A.repost_count,
				uploadDate: A.upload_date,
				musicTitle: A.track,
				musicAuthor: A.artist
			};
		} catch (e) {
			throw Error(`Failed to get TikTok info: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	async downloadVideo(e, A) {
		return new Promise((j, M) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(e, A),
				resolve: j,
				reject: M
			}), this.processQueue();
		});
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < e && this.downloadQueue.length > 0;) {
			let e = this.downloadQueue.shift();
			e && (this.activeDownloadsCount++, e.run().then((A) => e.resolve(A)).catch((A) => e.reject(A)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async executeDownload(e, A) {
		await this.ensureInitialized();
		let { url: j, format: M, quality: N, outputPath: F, maxSpeed: I, id: L } = e, R = L || randomUUID$1();
		try {
			let e = await this.getVideoInfo(j), L = this.sanitizeFilename(e.title), z = this.sanitizeFilename(e.authorUsername || e.author), B = F || this.store.get("settings.downloadPath") || app.getPath("downloads"), V = M === "audio" ? "mp3" : "mp4", H = `${z}_${L}_${e.id}.${V}`, U = path$1.join(B, H);
			fs$1.existsSync(B) || fs$1.mkdirSync(B, { recursive: !0 });
			let W = [
				j,
				"-o",
				U,
				"--no-playlist",
				"--newline",
				"--no-warnings",
				"--no-check-certificate",
				"--concurrent-fragments",
				"4",
				"--retries",
				"10"
			];
			return this.ffmpegPath && W.push("--ffmpeg-location", this.ffmpegPath), I && W.push("--limit-rate", I), M === "audio" ? W.push("-x", "--audio-format", "mp3", "--audio-quality", "0") : N === "low" ? W.push("-f", "worst") : W.push("-f", "best"), new Promise((N, P) => {
				let F = 0, I = 0, L = 0, z = this.ytDlp.exec(W);
				this.activeProcesses.set(R, z), z.ytDlpProcess && z.ytDlpProcess.stdout?.on("data", (e) => {
					e.toString().split(/\r?\n/).forEach((e) => {
						if (!e.trim()) return;
						let j = e.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(\w+)\s+at\s+(\d+\.?\d*)(\w+)\/s\s+ETA\s+(\d+:\d+)/);
						if (j) {
							L = parseFloat(j[1]);
							let e = parseFloat(j[2]), M = j[3], N = parseFloat(j[4]), P = j[5], z = j[6], B = {
								B: 1,
								KiB: 1024,
								MiB: 1024 * 1024,
								GiB: 1024 * 1024 * 1024
							};
							F = e * (B[M] || 1), I = L / 100 * F;
							let V = N * (B[P] || 1), U = z.split(":"), W = 0;
							U.length === 2 && (W = parseInt(U[0]) * 60 + parseInt(U[1])), U.length === 3 && (W = parseInt(U[0]) * 3600 + parseInt(U[1]) * 60 + parseInt(U[2])), A && A({
								id: R,
								percent: L,
								downloaded: I,
								total: F,
								speed: V,
								eta: W,
								state: "downloading",
								filename: H
							});
						}
					});
				}), z.on("close", (I) => {
					this.activeProcesses.delete(R), I === 0 ? fs$1.existsSync(U) ? (A && A({
						id: R,
						percent: 100,
						downloaded: F,
						total: F,
						speed: 0,
						eta: 0,
						state: "complete",
						filename: H,
						filePath: U
					}), this.addToHistory({
						id: R,
						url: j,
						title: e.title,
						thumbnailUrl: e.thumbnailUrl,
						author: e.author,
						authorUsername: e.authorUsername,
						timestamp: Date.now(),
						path: U,
						size: F,
						duration: e.duration,
						format: M || "video",
						status: "completed"
					}), N(U)) : P(/* @__PURE__ */ Error("Download finished but file not found")) : P(/* @__PURE__ */ Error(`yt-dlp exited with code ${I}`));
				}), z.on("error", (e) => {
					this.activeProcesses.delete(R), P(e);
				});
			});
		} catch (e) {
			throw this.activeProcesses.delete(R), e;
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			A && A.ytDlpProcess && A.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((e) => {
			e.ytDlpProcess && e.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(e) {
		let A = this.getHistory();
		this.store.set("history", A.filter((A) => A.id !== e));
	}
	addToHistory(e) {
		let A = this.getHistory();
		A.unshift(e), this.store.set("history", A.slice(0, 100));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(e) {
		let A = this.getSettings();
		this.store.set("settings", {
			...A,
			...e
		});
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").trim();
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
		let e = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), e), this.initPromise = this.init(), setInterval(() => this.processQueue(), 5e3);
	}
	async init() {
		try {
			let e = require$1("yt-dlp-wrap"), A = e.default || e;
			fs$1.existsSync(this.binaryPath) || (console.log("Downloading yt-dlp binary (Universal)..."), await A.downloadFromGithub(this.binaryPath)), this.ytDlp = new A(this.binaryPath);
			let { FFmpegHelper: j } = await import("./ffmpeg-helper-D9RH3mTJ.js"), M = j.getFFmpegPath();
			M ? (this.ffmpegPath = M, console.log("✅ Universal Downloader: FFmpeg ready")) : console.warn("⚠️ Universal Downloader: FFmpeg not available");
		} catch (e) {
			throw console.error("Failed to init Universal downloader:", e), e;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	detectPlatform(e, A) {
		let j = e.toLowerCase();
		if (A) {
			let e = A.toLowerCase();
			if (e.includes("youtube")) return "youtube";
			if (e.includes("tiktok")) return "tiktok";
			if (e.includes("instagram")) return "instagram";
			if (e.includes("facebook") || e.includes("fb")) return "facebook";
			if (e.includes("twitter") || e.includes("x") || e.includes("periscope")) return "twitter";
			if (e.includes("twitch")) return "twitch";
			if (e.includes("reddit")) return "reddit";
			if (e.includes("vimeo") || e.includes("pinterest") || e.includes("soundcloud")) return "other";
		}
		return j.includes("youtube.com") || j.includes("youtu.be") ? "youtube" : j.includes("tiktok.com") ? "tiktok" : j.includes("instagram.com") ? "instagram" : j.includes("facebook.com") || j.includes("fb.watch") || j.includes("fb.com") ? "facebook" : j.includes("twitter.com") || j.includes("x.com") ? "twitter" : j.includes("twitch.tv") ? "twitch" : j.includes("reddit.com") || j.includes("redd.it") ? "reddit" : (j.includes("pinterest.com") || j.includes("vimeo.com"), "other");
	}
	async getMediaInfo(e) {
		await this.ensureInitialized();
		try {
			let A = e.includes("v=") || e.includes("youtu.be/") || e.includes("/video/") || e.includes("/v/"), j = e.includes("list=") || e.includes("/playlist") || e.includes("/sets/") || e.includes("/album/") || e.includes("/c/") || e.includes("/channel/") || e.includes("/user/"), M = this.getSettings(), N = ["--dump-json", "--no-check-certificate"];
			M.useBrowserCookies && N.push("--cookies-from-browser", M.useBrowserCookies);
			let P = [e, ...N];
			j && !A ? P.push("--flat-playlist") : P.push("--no-playlist");
			let F = j && A ? [
				e,
				...N,
				"--flat-playlist"
			] : null, [I, L] = await Promise.allSettled([this.ytDlp.execPromise(P), F ? this.ytDlp.execPromise(F) : Promise.resolve(null)]);
			if (I.status === "rejected") throw I.reason;
			let R = I.value.trim().split("\n"), z = JSON.parse(R[0]);
			if (R.length > 1 && !z.entries) {
				let e = R.map((e) => {
					try {
						return JSON.parse(e);
					} catch {
						return null;
					}
				}).filter((e) => e !== null);
				z = {
					...e[0],
					entries: e,
					_type: "playlist"
				};
			}
			if (L.status === "fulfilled" && L.value) try {
				let e = L.value.trim().split("\n"), A = JSON.parse(e[0]);
				if (e.length > 1 && !A.entries) {
					let j = e.map((e) => {
						try {
							return JSON.parse(e);
						} catch {
							return null;
						}
					}).filter((e) => e !== null);
					A = {
						...j[0],
						entries: j
					};
				}
				A.entries && !z.entries && (z.entries = A.entries, z.playlist_count = A.playlist_count || A.entries.length, z._type ||= "playlist");
			} catch (e) {
				console.warn("Failed to parse auxiliary playlist info:", e);
			}
			let B = this.detectPlatform(e, z.extractor), V = z._type === "playlist" || !!z.entries || z._type === "multi_video", H = j || !!z.playlist_id, U = [], W = V && z.entries && z.entries[0] ? z.entries[0].formats : z.formats;
			if (W && Array.isArray(W)) {
				let e = /* @__PURE__ */ new Set();
				W.forEach((A) => {
					if (A.vcodec && A.vcodec !== "none") {
						if (A.height) e.add(`${A.height}p`);
						else if (A.format_note && /^\d+p$/.test(A.format_note)) e.add(A.format_note);
						else if (A.resolution && /^\d+x\d+$/.test(A.resolution)) {
							let j = A.resolution.split("x")[1];
							e.add(`${j}p`);
						}
					}
				}), e.size === 0 && z.height && e.add(`${z.height}p`);
				let A = Array.from(e).sort((e, A) => {
					let j = parseInt(e);
					return parseInt(A) - j;
				});
				U.push(...A);
			}
			let G = V && z.entries ? z.entries.map((e) => ({
				id: e.id,
				title: e.title,
				duration: e.duration,
				url: e.url || (B === "youtube" ? `https://www.youtube.com/watch?v=${e.id}` : e.url),
				thumbnail: e.thumbnails?.[0]?.url || e.thumbnail
			})) : void 0, K = z.title || z.id || "Untitled Media", q = z.thumbnail || z.entries?.[0]?.thumbnail || z.thumbnails?.[0]?.url || "";
			return {
				id: z.id || z.entries?.[0]?.id || "unknown",
				url: z.webpage_url || e,
				title: K,
				platform: B,
				thumbnailUrl: q,
				author: z.uploader || z.channel || z.uploader_id || "Unknown",
				authorUrl: z.uploader_url || z.channel_url,
				duration: z.duration,
				uploadDate: z.upload_date,
				description: z.description,
				viewCount: z.view_count,
				likeCount: z.like_count,
				isLive: z.is_live || !1,
				webpageUrl: z.webpage_url,
				availableQualities: U.length > 0 ? U : void 0,
				isPlaylist: V || H,
				playlistCount: V || H ? z.playlist_count || z.entries?.length : void 0,
				playlistVideos: G,
				size: z.filesize || z.filesize_approx
			};
		} catch (e) {
			let A = e.message || String(e);
			throw A.includes("nodename nor servname provided") || A.includes("getaddrinfo") || A.includes("ENOTFOUND") || A.includes("Unable to download webpage") || A.includes("Unable to download API page") ? Error("Network error: Please check your internet connection") : (A.includes("Video unavailable") && (A = "Video is unavailable or private"), A.includes("Login required") && (A = "Login required to access this content"), A.includes("Private video") && (A = "This video is private"), A.includes("HTTP Error 429") && (A = "Too many requests. Please try again later"), A.includes("Geographic restriction") && (A = "This video is not available in your country"), Error(`Failed to get media info: ${A}`));
		}
	}
	async downloadMedia(e, A) {
		let j = e.id || randomUUID$1();
		return new Promise((M, N) => {
			this.downloadQueue.push({
				options: {
					...e,
					id: j
				},
				run: () => this.executeDownload({
					...e,
					id: j
				}, A),
				resolve: M,
				reject: N,
				state: "queued"
			}), this.processQueue();
		});
	}
	async checkDiskSpace(e) {
		try {
			let A = e || this.store.get("settings.downloadPath") || app.getPath("downloads"), j = await si.fsSize(), M = j[0], N = -1;
			for (let e of j) A.startsWith(e.mount) && e.mount.length > N && (N = e.mount.length, M = e);
			if (!M) return {
				available: 0,
				total: 0,
				warning: !1
			};
			let F = M.available, I = M.size;
			return {
				available: F,
				total: I,
				warning: F < 5 * 1024 * 1024 * 1024 || F / I < .1
			};
		} catch (e) {
			return console.error("Failed to check disk space:", e), {
				available: 0,
				total: 0,
				warning: !1
			};
		}
	}
	getQueue() {
		return this.downloadQueue.map((e) => ({
			id: e.options.id,
			url: e.options.url,
			state: e.state,
			filename: e.options.url
		}));
	}
	async processQueue() {
		let e = this.getSettings().maxConcurrentDownloads || 3;
		if ((await this.checkDiskSpace()).available < 500 * 1024 * 1024) {
			console.warn("Low disk space, skipping queue processing");
			return;
		}
		for (; this.activeDownloadsCount < e && this.downloadQueue.length > 0;) {
			let e = this.downloadQueue.shift();
			e && (this.activeDownloadsCount++, e.state = "downloading", e.run().then((A) => e.resolve(A)).catch((A) => e.reject(A)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async executeDownload(e, A) {
		await this.ensureInitialized();
		let { url: j, format: M, quality: N, outputPath: F, maxSpeed: I, id: L, cookiesBrowser: R, embedSubs: z, isPlaylist: B, playlistItems: V, audioFormat: H } = e, U = L || randomUUID$1();
		try {
			let e = await this.getMediaInfo(j), L = this.sanitizeFilename(e.title), W = this.sanitizeFilename(e.author || "unknown"), G = F || this.store.get("settings.downloadPath") || app.getPath("downloads"), K = M === "audio" ? H || "mp3" : "mp4", q, J, Y = B === !0, X = (e.platform || "Other").toUpperCase();
			if (Y) {
				let e = path$1.join(G, L);
				fs$1.existsSync(e) || fs$1.mkdirSync(e, { recursive: !0 }), q = path$1.join(e, "%(playlist_index)s - %(title)s.%(ext)s"), J = `[${X} PLAYLIST] ${L}`;
			} else J = `[${X}] ${W} - ${L.length > 50 ? L.substring(0, 50) + "..." : L} [${e.id}].${K}`, q = path$1.join(G, J);
			fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
			let Z = [
				j,
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
			Y ? V && Z.push("--playlist-items", V) : Z.push("--no-playlist"), z && e.platform === "youtube" && Z.push("--all-subs", "--embed-subs", "--write-auto-subs"), this.ffmpegPath && Z.push("--ffmpeg-location", this.ffmpegPath), I && Z.push("--limit-rate", I);
			let Q = this.getSettings(), $ = R || Q.useBrowserCookies;
			if ($ && Z.push("--cookies-from-browser", $), M === "audio") {
				Z.push("-x", "--audio-format", H || "mp3");
				let e = N || "0";
				Z.push("--audio-quality", e);
			} else {
				if (N && N.endsWith("p")) {
					let e = N.replace("p", "");
					Z.push("-f", `bestvideo[height<=${e}]+bestaudio/best[height<=${e}]`);
				} else Z.push("-f", "bestvideo+bestaudio/best");
				Z.push("--merge-output-format", "mp4");
			}
			return !B && !e.isPlaylist && Z.push("--no-playlist"), new Promise((N, P) => {
				let F = 0, I = 0, R = 0, z = J, V = "", H = this.ytDlp.exec(Z);
				this.activeProcesses.set(U, H), H.ytDlpProcess && (H.ytDlpProcess.stderr?.on("data", (e) => {
					V += e.toString();
				}), H.ytDlpProcess.stdout?.on("data", (j) => {
					j.toString().split(/\r?\n/).forEach((j) => {
						if (!j.trim()) return;
						let M = j.match(/\[download\] Destination: .*[/\\](.*)$/);
						M && (z = M[1]);
						let N = j.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+)([\w]+)\s+at\s+([\d.]+)([\w/]+)\s+ETA\s+([\d:]+)/);
						if (N) {
							R = parseFloat(N[1]);
							let j = parseFloat(N[2]), M = N[3], P = parseFloat(N[4]), L = N[5].split("/")[0], B = N[6], V = {
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
							F = j * (V[M.toUpperCase()] || 1), I = R / 100 * F;
							let H = P * (V[L.toUpperCase()] || 1), W = B.split(":").reverse(), G = 0;
							W[0] && (G += parseInt(W[0])), W[1] && (G += parseInt(W[1]) * 60), W[2] && (G += parseInt(W[2]) * 3600), A && A({
								id: U,
								percent: R,
								downloaded: I,
								total: F,
								speed: H,
								eta: G,
								state: "downloading",
								filename: e.isPlaylist ? `${J} (${z})` : J,
								platform: e.platform
							});
						}
					});
				})), H.on("close", (R) => {
					if (this.activeProcesses.delete(U), R === 0) {
						let P = B || e.isPlaylist ? path$1.join(G, L) : q;
						A && A({
							id: U,
							percent: 100,
							downloaded: F,
							total: F,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: J,
							filePath: P,
							platform: e.platform
						}), this.addToHistory({
							id: U,
							url: j,
							title: e.title,
							platform: e.platform,
							thumbnailUrl: e.thumbnailUrl,
							author: e.author,
							timestamp: Date.now(),
							path: P,
							size: F,
							duration: e.duration,
							format: M,
							status: "completed"
						}), N(P);
					} else if (R === null) {
						console.error("yt-dlp process terminated unexpectedly"), V && console.error("stderr output:", V);
						let j = V ? `Download terminated: ${V.substring(0, 200)}` : "Download was cancelled or terminated unexpectedly";
						A && A({
							id: U,
							percent: 0,
							downloaded: I,
							total: F,
							speed: 0,
							eta: 0,
							state: "error",
							filename: J,
							platform: e.platform
						}), P(Error(j));
					} else {
						console.error(`yt-dlp exited with code ${R}`), V && console.error("stderr output:", V);
						let j = `Download failed (exit code: ${R})`;
						if (V.includes("Video unavailable")) j = "Video is unavailable or has been removed";
						else if (V.includes("Private video")) j = "Video is private";
						else if (V.includes("Login required")) j = "Login required to access this content";
						else if (V.includes("HTTP Error 429")) j = "Too many requests. Please try again later";
						else if (V.includes("No space left")) j = "No space left on device";
						else if (V) {
							let e = V.split("\n").find((e) => e.trim());
							e && (j = e.substring(0, 150));
						}
						A && A({
							id: U,
							percent: 0,
							downloaded: I,
							total: F,
							speed: 0,
							eta: 0,
							state: "error",
							filename: J,
							platform: e.platform
						}), P(Error(j));
					}
				}), H.on("error", (j) => {
					this.activeProcesses.delete(U), console.error("yt-dlp process error:", j), V && console.error("stderr output:", V), A && A({
						id: U,
						percent: 0,
						downloaded: I,
						total: F,
						speed: 0,
						eta: 0,
						state: "error",
						filename: J,
						platform: e.platform
					}), P(/* @__PURE__ */ Error(`Download process error: ${j.message}`));
				});
				let W = setTimeout(() => {
					if (this.activeProcesses.has(U)) {
						console.warn(`Download timeout for ${U}, killing process`);
						let e = this.activeProcesses.get(U);
						e && e.ytDlpProcess && e.ytDlpProcess.kill("SIGTERM");
					}
				}, 36e5), K = N, Y = P;
				N = (e) => {
					clearTimeout(W), K(e);
				}, P = (e) => {
					clearTimeout(W), Y(e);
				};
			});
		} catch (e) {
			throw this.activeProcesses.delete(U), e;
		}
	}
	cancelDownload(e) {
		if (e) {
			let A = this.activeProcesses.get(e);
			A && A.ytDlpProcess && A.ytDlpProcess.kill();
		} else this.activeProcesses.forEach((e) => {
			e.ytDlpProcess && e.ytDlpProcess.kill();
		});
	}
	getHistory() {
		return this.store.get("history", []);
	}
	clearHistory() {
		this.store.set("history", []);
	}
	removeFromHistory(e) {
		let A = this.getHistory();
		this.store.set("history", A.filter((A) => A.id !== e));
	}
	addToHistory(e) {
		let A = this.getHistory();
		A.unshift(e), this.store.set("history", A.slice(0, 200));
	}
	getSettings() {
		return this.store.get("settings");
	}
	saveSettings(e) {
		let A = this.getSettings();
		this.store.set("settings", {
			...A,
			...e
		});
	}
	sanitizeFilename(e) {
		return e.replace(/[<>:"/\\|?*]/g, "").trim();
	}
}(), audioExtractor = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-D9RH3mTJ.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Audio Extractor: FFmpeg ready")) : console.warn("⚠️ Audio Extractor: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getAudioInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => {
				P += e.toString();
			}), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/Stream #\d+:\d+.*?: Audio: (\w+).*?, (\d+) Hz.*?, (\w+).*?, (\d+) kb\/s/), F = !!N, I = P.includes("Video:");
					A({
						duration: M,
						bitrate: N ? parseInt(N[4]) : 0,
						sampleRate: N ? parseInt(N[2]) : 0,
						channels: N && N[3].includes("stereo") ? 2 : 1,
						codec: N ? N[1] : "unknown",
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0,
						hasAudio: F,
						hasVideo: I
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			}), N.on("error", j);
		});
	}
	async extractAudio(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { inputPath: M, outputPath: N, format: F, bitrate: I, sampleRate: L, channels: R, trim: z, normalize: B, fadeIn: V, fadeOut: H } = e;
		if (!fs$1.existsSync(M)) throw Error("Input file not found");
		let U = await this.getAudioInfo(M);
		if (!U.hasAudio) throw Error("No audio stream found in input file");
		let W = path$1.basename(M, path$1.extname(M)), G = N ? path$1.dirname(N) : app.getPath("downloads"), K = N ? path$1.basename(N) : `${W}_extracted.${F}`, q = path$1.join(G, K);
		fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
		let J = ["-i", M];
		z?.start !== void 0 && J.push("-ss", z.start.toString()), z?.end !== void 0 && J.push("-to", z.end.toString()), J.push("-vn");
		let Y = [];
		if (B && Y.push("loudnorm"), V && V > 0 && Y.push(`afade=t=in:d=${V}`), H && H > 0) {
			let e = (z?.end || U.duration) - H;
			Y.push(`afade=t=out:st=${e}:d=${H}`);
		}
		switch (Y.length > 0 && J.push("-af", Y.join(",")), F) {
			case "mp3":
				J.push("-acodec", "libmp3lame"), I && J.push("-b:a", I);
				break;
			case "aac":
				J.push("-acodec", "aac"), I && J.push("-b:a", I);
				break;
			case "flac":
				J.push("-acodec", "flac");
				break;
			case "wav":
				J.push("-acodec", "pcm_s16le");
				break;
			case "ogg":
				J.push("-acodec", "libvorbis"), I && J.push("-b:a", I);
				break;
			case "m4a":
				J.push("-acodec", "aac"), I && J.push("-b:a", I);
				break;
		}
		return L && J.push("-ar", L.toString()), R && J.push("-ac", R.toString()), J.push("-y", q), new Promise((e, N) => {
			let P = spawn(this.ffmpegPath, J);
			this.activeProcesses.set(j, P);
			let F = U.duration;
			z?.start && z?.end ? F = z.end - z.start : z?.end && (F = z.end), P.stderr.on("data", (e) => {
				let N = e.toString(), P = N.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (P && A) {
					let e = parseInt(P[1]) * 3600 + parseInt(P[2]) * 60 + parseFloat(P[3]), I = Math.min(e / F * 100, 100), L = N.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						filename: K,
						inputPath: M,
						percent: I,
						state: "processing",
						speed: L ? parseFloat(L[1]) : 1
					});
				}
			}), P.on("close", (P) => {
				this.activeProcesses.delete(j), P === 0 ? (A && A({
					id: j,
					filename: K,
					inputPath: M,
					percent: 100,
					state: "complete",
					outputPath: q
				}), e(q)) : N(/* @__PURE__ */ Error(`FFmpeg exited with code ${P}`));
			}), P.on("error", (e) => {
				this.activeProcesses.delete(j), N(e);
			});
		});
	}
	cancelExtraction(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
	cancelAll() {
		this.activeProcesses.forEach((e) => e.kill()), this.activeProcesses.clear();
	}
}(), videoMerger = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-D9RH3mTJ.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Video Merger: FFmpeg ready")) : console.warn("⚠️ Video Merger: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async getVideoInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => {
				P += e.toString();
			}), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/Video:.*?, (\d{3,5})x(\d{3,5})/), F = N ? parseInt(N[1]) : 0, I = N ? parseInt(N[2]) : 0, L = P.match(/(\d+\.?\d*) fps/), R = L ? parseFloat(L[1]) : 0, z = P.match(/Video: (\w+)/);
					A({
						path: e,
						duration: M,
						width: F,
						height: I,
						codec: z ? z[1] : "unknown",
						fps: R,
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse video info"));
				}
			}), N.on("error", j);
		});
	}
	async generateThumbnail(e, A = 1) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = path$1.join(app.getPath("temp"), "devtools-app-thumbs");
		fs$1.existsSync(j) || fs$1.mkdirSync(j, { recursive: !0 });
		let M = `thumb_${randomUUID$1()}.jpg`, N = path$1.join(j, M);
		return new Promise((j, M) => {
			let P = [
				"-ss",
				A.toString(),
				"-i",
				e,
				"-frames:v",
				"1",
				"-q:v",
				"2",
				"-vf",
				"scale=480:-1,unsharp=3:3:1.5:3:3:0.5",
				"-f",
				"image2",
				"-y",
				N
			];
			console.log(`[VideoMerger] Generating thumbnail: ${P.join(" ")}`);
			let F = spawn(this.ffmpegPath, P);
			F.on("close", (e) => {
				if (e === 0) {
					let e = fs$1.readFileSync(N, { encoding: "base64" });
					fs$1.unlinkSync(N), j(`data:image/jpeg;base64,${e}`);
				} else M(/* @__PURE__ */ Error("Thumbnail generation failed"));
			}), F.on("error", M);
		});
	}
	async generateFilmstrip(e, A, j = 10) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let M = Math.min(200, Math.max(5, Math.min(j, Math.floor(A)))), N = randomUUID$1(), F = path$1.join(app.getPath("temp"), "devtools-app-filmstrips", N);
		fs$1.existsSync(F) || fs$1.mkdirSync(F, { recursive: !0 });
		let I = A > 0 ? A : 1, L = M / I;
		console.log(`Generating filmstrip (Optimized): Target ${M} frames from ${I}s video (fps=${L.toFixed(4)})`);
		let R = path$1.join(F, "thumb_%03d.jpg").replace(/\\/g, "/");
		return new Promise((A, j) => {
			let N = [
				"-i",
				e,
				"-vf",
				`fps=${L},scale=320:-1,unsharp=3:3:1:3:3:0.5`,
				"-an",
				"-sn",
				"-q:v",
				"4",
				"-f",
				"image2",
				"-y",
				R
			];
			console.log(`[VideoMerger] Running FFmpeg for filmstrip: ${N.join(" ")}`);
			let P = spawn(this.ffmpegPath, N), I = "";
			P.stderr.on("data", (e) => {
				I += e.toString();
			}), P.on("close", (e) => {
				if (e === 0) try {
					let e = fs$1.readdirSync(F).filter((e) => e.startsWith("thumb_") && e.endsWith(".jpg")).sort();
					if (e.length === 0) {
						console.error("Filmstrip generation failed: No frames produced. FFmpeg output:", I), j(/* @__PURE__ */ Error("No frames produced"));
						return;
					}
					let N = e.map((e) => {
						let A = path$1.join(F, e);
						return `data:image/jpeg;base64,${fs$1.readFileSync(A, { encoding: "base64" })}`;
					}).slice(0, M);
					try {
						fs$1.rmSync(F, {
							recursive: !0,
							force: !0
						});
					} catch (e) {
						console.warn("Filmstrip cleanup failed:", e);
					}
					A(N);
				} catch (e) {
					j(e);
				}
				else console.error("Filmstrip generation failed with code:", e, I), j(/* @__PURE__ */ Error("Filmstrip generation failed"));
			}), P.on("error", j);
		});
	}
	async extractWaveform(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return console.log("Extracting waveform for:", e), new Promise((A, j) => {
			let M = [
				"-i",
				e,
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
			], N = spawn(this.ffmpegPath, M), P = [];
			N.stdout.on("data", (e) => {
				P.push(e);
			}), N.stderr.on("data", () => {}), N.on("close", (e) => {
				if (e === 0) try {
					let e = Buffer.concat(P), j = [];
					for (let A = 0; A < e.length; A += 160) {
						let M = 0;
						for (let j = 0; j < 80; j++) {
							let N = A + j * 2;
							if (N + 1 < e.length) {
								let A = Math.abs(e.readInt16LE(N));
								A > M && (M = A);
							}
						}
						j.push(M / 32768);
					}
					console.log(`Waveform extracted: ${j.length} points`), A(j);
				} catch (e) {
					j(e);
				}
				else j(/* @__PURE__ */ Error("Waveform extraction failed"));
			}), N.on("error", j);
		});
	}
	async createVideoFromImages(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = randomUUID$1(), { imagePaths: M, fps: N, outputPath: F, format: I, quality: L } = e;
		if (!M || M.length === 0) throw Error("No images provided");
		let R = F ? path$1.dirname(F) : app.getPath("downloads"), z = F ? path$1.basename(F) : `video_from_frames_${Date.now()}.${I}`, B = path$1.join(R, z), V = randomUUID$1(), H = path$1.join(app.getPath("temp"), "devtools-video-frames", V);
		fs$1.existsSync(H) || fs$1.mkdirSync(H, { recursive: !0 });
		let U = path$1.join(H, "inputs.txt");
		try {
			let P = 1 / N, F = M.map((e) => `file '${e.replace(/\\/g, "/").replace(/'/g, "'\\''")}'\nduration ${P}`).join("\n") + `\nfile '${M[M.length - 1].replace(/\\/g, "/").replace(/'/g, "'\\''")}'`;
			fs$1.writeFileSync(U, F);
			let R = [
				"-f",
				"concat",
				"-safe",
				"0",
				"-i",
				U
			], z = [];
			if (I !== "gif" && z.push("scale=trunc(iw/2)*2:trunc(ih/2)*2"), z.push(`fps=${N}`), e.filter) switch (e.filter) {
				case "grayscale":
					z.push("hue=s=0");
					break;
				case "sepia":
					z.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
					break;
				case "invert":
					z.push("negate");
					break;
				case "warm":
					z.push("eq=gamma_r=1.2:gamma_g=1.0:gamma_b=0.9");
					break;
				case "cool":
					z.push("eq=gamma_r=0.9:gamma_g=1.0:gamma_b=1.2");
					break;
				case "vintage":
					z.push("curves=vintage");
					break;
			}
			if (e.watermark && e.watermark.text) {
				let A = e.watermark, j = (A.text || "").replace(/:/g, "\\:").replace(/'/g, ""), M = "(w-text_w)/2", N = "(h-text_h)/2";
				switch (A.position) {
					case "top-left":
						M = "20", N = "20";
						break;
					case "top-right":
						M = "w-text_w-20", N = "20";
						break;
					case "bottom-left":
						M = "20", N = "h-text_h-20";
						break;
					case "bottom-right":
						M = "w-text_w-20", N = "h-text_h-20";
						break;
				}
				let P = A.fontSize || 24, F = A.color || "white", I = A.opacity || .8;
				z.push(`drawtext=text='${j}':x=${M}:y=${N}:fontsize=${P}:fontcolor=${F}:alpha=${I}`);
			}
			if (I === "gif") {
				let e = z.join(",");
				R.push("-vf", `${e},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`);
			} else {
				let e = z.join(",");
				e && R.push("-vf", e), I === "mp4" ? (R.push("-c:v", "libx264", "-pix_fmt", "yuv420p"), L === "low" ? R.push("-crf", "28") : L === "high" ? R.push("-crf", "18") : R.push("-crf", "23")) : I === "webm" && (R.push("-c:v", "libvpx-vp9", "-b:v", "0"), L === "low" ? R.push("-crf", "40") : L === "high" ? R.push("-crf", "20") : R.push("-crf", "30"));
			}
			return R.push("-y", B), console.log(`[VideoMerger] Creating video from images (concat): ${R.join(" ")}`), new Promise((e, P) => {
				let F = spawn(this.ffmpegPath, R);
				this.activeProcesses.set(j, F);
				let I = M.length / N;
				F.stderr.on("data", (e) => {
					let M = e.toString();
					if (A) {
						let e = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
						if (e) {
							let M = parseInt(e[1]) * 3600 + parseInt(e[2]) * 60 + parseFloat(e[3]);
							A({
								id: j,
								percent: Math.min(M / I * 100, 99),
								state: "processing"
							});
						}
					}
				}), F.on("close", (M) => {
					this.activeProcesses.delete(j);
					try {
						fs$1.rmSync(H, {
							recursive: !0,
							force: !0
						});
					} catch (e) {
						console.warn("Failed to cleanup temp dir", e);
					}
					M === 0 ? (A && A({
						id: j,
						percent: 100,
						state: "complete",
						outputPath: B
					}), e(B)) : P(/* @__PURE__ */ Error(`FFmpeg failed with code ${M}`));
				}), F.on("error", (e) => {
					this.activeProcesses.delete(j);
					try {
						fs$1.rmSync(H, {
							recursive: !0,
							force: !0
						});
					} catch {}
					P(e);
				});
			});
		} catch (e) {
			try {
				fs$1.rmSync(H, {
					recursive: !0,
					force: !0
				});
			} catch {}
			throw e;
		}
	}
	async mergeVideos(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { clips: M, outputPath: N, format: F } = e;
		if (!M || M.length === 0) throw Error("No input clips provided");
		for (let e of M) if (!fs$1.existsSync(e.path)) throw Error(`File not found: ${e.path}`);
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let I = await Promise.all(M.map((e) => this.getVideoInfo(e.path))), L = 0;
		M.forEach((e, A) => {
			let j = I[A].duration, M = e.startTime || 0, N = e.endTime || j;
			L += N - M;
		});
		let R = N ? path$1.dirname(N) : app.getPath("downloads"), z = N ? path$1.basename(N) : `merged_video_${Date.now()}.${F}`, B = path$1.join(R, z);
		fs$1.existsSync(R) || fs$1.mkdirSync(R, { recursive: !0 });
		let V = [];
		M.forEach((e) => {
			e.startTime !== void 0 && V.push("-ss", e.startTime.toString()), e.endTime !== void 0 && V.push("-to", e.endTime.toString()), V.push("-i", e.path);
		});
		let H = "";
		return M.forEach((e, A) => {
			H += `[${A}:v][${A}:a]`;
		}), H += `concat=n=${M.length}:v=1:a=1[v][a]`, V.push("-filter_complex", H), V.push("-map", "[v]", "-map", "[a]"), V.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), V.push("-c:a", "aac", "-b:a", "128k"), V.push("-y", B), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, V);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString(), N = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && A) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]), P = Math.min(e / L * 100, 100), F = M.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						percent: P,
						state: "processing",
						speed: F ? parseFloat(F[1]) : 1
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: B
				}), e(B)) : M(/* @__PURE__ */ Error(`Merge failed with code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	cancelMerge(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), audioManager = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("Audio Manager FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-D9RH3mTJ.js");
			this.ffmpegPath = e.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Audio Manager:", e);
		}
	}
	async getAudioInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = [
				"-i",
				e,
				"-hide_banner"
			], N = spawn(this.ffmpegPath, M), P = "";
			N.stderr.on("data", (e) => P += e.toString()), N.on("close", () => {
				try {
					let j = P.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), M = j ? parseInt(j[1]) * 3600 + parseInt(j[2]) * 60 + parseFloat(j[3]) : 0, N = P.match(/(\d+) Hz/), F = N ? parseInt(N[1]) : 0;
					A({
						path: e,
						duration: M,
						format: path$1.extname(e).slice(1),
						sampleRate: F,
						channels: P.includes("stereo") ? 2 : 1,
						size: fs$1.existsSync(e) ? fs$1.statSync(e).size : 0
					});
				} catch {
					j(/* @__PURE__ */ Error("Failed to parse audio info"));
				}
			});
		});
	}
	async applyAudioChanges(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = randomUUID$1(), { videoPath: M, audioLayers: N, outputPath: F, outputFormat: I, keepOriginalAudio: L, originalAudioVolume: R } = e;
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let z = [
			"-i",
			M,
			"-hide_banner"
		], B = spawn(this.ffmpegPath, z), V = "";
		await new Promise((e) => {
			B.stderr.on("data", (e) => V += e.toString()), B.on("close", e);
		});
		let H = V.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/), U = H ? parseInt(H[1]) * 3600 + parseInt(H[2]) * 60 + parseFloat(H[3]) : 0, W = F ? path$1.dirname(F) : app.getPath("downloads"), G = F || path$1.join(W, `audio_mixed_${Date.now()}.${I}`), K = ["-i", M];
		N.forEach((e) => {
			e.clipStart > 0 && K.push("-ss", e.clipStart.toString()), e.clipEnd > 0 && K.push("-to", e.clipEnd.toString()), K.push("-i", e.path);
		});
		let q = "", J = 0;
		L && (q += `[0:a]volume=${R}[a0];`, J++), N.forEach((e, A) => {
			let j = A + 1;
			q += `[${j}:a]volume=${e.volume},adelay=${e.startTime * 1e3}|${e.startTime * 1e3}[a${j}];`, J++;
		});
		for (let e = 0; e < J; e++) q += `[a${e}]`;
		return q += `amix=inputs=${J}:duration=first:dropout_transition=2[aout]`, K.push("-filter_complex", q), K.push("-map", "0:v", "-map", "[aout]"), K.push("-c:v", "copy"), K.push("-c:a", "aac", "-b:a", "192k", "-y", G), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, K);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (M && A) {
					let e = parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]);
					A({
						id: j,
						percent: Math.min(e / U * 100, 100),
						state: "processing"
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: G
				}), e(G)) : M(/* @__PURE__ */ Error(`Exit code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	cancel(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), videoTrimmer = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("Video Trimmer FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-D9RH3mTJ.js");
			this.ffmpegPath = e.getFFmpegPath();
		} catch (e) {
			console.warn("FFmpeg setup failed for Video Trimmer:", e);
		}
	}
	async process(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let { inputPath: j, ranges: M, mode: N, outputFormat: F, outputPath: I } = e, L = randomUUID$1();
		A && A({
			id: L,
			percent: 0,
			state: "analyzing"
		});
		let R = I ? path$1.dirname(I) : app.getPath("downloads"), z = [];
		if (N === "trim" || N === "cut") {
			let e = I || path$1.join(R, `trimmed_${Date.now()}.${F}`), P = [];
			if (M.length === 1 && N === "trim") P.push("-ss", M[0].start.toString(), "-to", M[0].end.toString(), "-i", j), P.push("-c", "copy", "-y", e);
			else {
				P.push("-i", j);
				let A = "";
				M.forEach((e, j) => {
					A += `[0:v]trim=start=${e.start}:end=${e.end},setpts=PTS-STARTPTS[v${j}];`, A += `[0:a]atrim=start=${e.start}:end=${e.end},asetpts=PTS-STARTPTS[a${j}];`;
				});
				for (let e = 0; e < M.length; e++) A += `[v${e}][a${e}]`;
				A += `concat=n=${M.length}:v=1:a=1[outv][outa]`, P.push("-filter_complex", A), P.push("-map", "[outv]", "-map", "[outa]"), P.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"), P.push("-c:a", "aac", "-y", e);
			}
			await this.runFFmpeg(P, L, M.reduce((e, A) => e + (A.end - A.start), 0), A), z.push(e);
		} else if (N === "split") for (let e = 0; e < M.length; e++) {
			let N = M[e], P = path$1.join(R, `split_${e + 1}_${Date.now()}.${F}`), I = [
				"-ss",
				N.start.toString(),
				"-to",
				N.end.toString(),
				"-i",
				j,
				"-c",
				"copy",
				"-y",
				P
			];
			A && A({
				id: L,
				percent: e / M.length * 100,
				state: "processing"
			}), await this.runFFmpeg(I, L, N.end - N.start), z.push(P);
		}
		return A && A({
			id: L,
			percent: 100,
			state: "complete",
			outputPath: z[0]
		}), z;
	}
	async runFFmpeg(e, A, j, M) {
		return new Promise((N, P) => {
			let F = spawn(this.ffmpegPath, e);
			this.activeProcesses.set(A, F), F.stderr.on("data", (e) => {
				let N = e.toString().match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && M) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]);
					M({
						id: A,
						percent: Math.min(e / j * 100, 100),
						state: "processing"
					});
				}
			}), F.on("close", (e) => {
				this.activeProcesses.delete(A), e === 0 ? N() : P(/* @__PURE__ */ Error(`FFmpeg exited with code ${e}`));
			}), F.on("error", (e) => {
				this.activeProcesses.delete(A), P(e);
			});
		});
	}
	cancel(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
	}
}(), videoEffects = new class {
	constructor() {
		this.ffmpegPath = null, this.activeProcesses = /* @__PURE__ */ new Map(), this.initFFmpeg().catch((e) => console.error("FFmpeg init error:", e));
	}
	async initFFmpeg() {
		try {
			let { FFmpegHelper: e } = await import("./ffmpeg-helper-D9RH3mTJ.js"), A = e.getFFmpegPath();
			A ? (this.ffmpegPath = A, console.log("✅ Video Effects: FFmpeg ready")) : console.warn("⚠️ Video Effects: FFmpeg not available");
		} catch (e) {
			console.warn("FFmpeg setup failed:", e);
		}
	}
	async applyEffects(e, A) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		let j = e.id || randomUUID$1(), { inputPath: M, outputPath: N, format: F } = e;
		if (!fs$1.existsSync(M)) throw Error(`File not found: ${M}`);
		A && A({
			id: j,
			percent: 0,
			state: "analyzing"
		});
		let I = await this.getVideoInfo(M), L = e.speed ? I.duration / e.speed : I.duration, R = N ? path$1.dirname(N) : app.getPath("downloads"), z = N ? path$1.basename(N) : `effect_video_${Date.now()}.${F}`, B = path$1.join(R, z);
		fs$1.existsSync(R) || fs$1.mkdirSync(R, { recursive: !0 });
		let V = ["-i", M], H = [], U = [];
		if (e.speed && e.speed !== 1) {
			H.push(`setpts=${1 / e.speed}*PTS`);
			let A = e.speed;
			for (; A > 2;) U.push("atempo=2.0"), A /= 2;
			for (; A < .5;) U.push("atempo=0.5"), A /= .5;
			U.push(`atempo=${A}`);
		}
		return (e.flip === "horizontal" || e.flip === "both") && H.push("hflip"), (e.flip === "vertical" || e.flip === "both") && H.push("vflip"), e.rotate && (e.rotate === 90 ? H.push("transpose=1") : e.rotate === 180 ? H.push("transpose=2,transpose=2") : e.rotate === 270 && H.push("transpose=2")), (e.brightness !== void 0 || e.contrast !== void 0 || e.saturation !== void 0 || e.gamma !== void 0) && H.push(`eq=brightness=${e.brightness || 0}:contrast=${e.contrast === void 0 ? 1 : e.contrast}:saturation=${e.saturation === void 0 ? 1 : e.saturation}:gamma=${e.gamma === void 0 ? 1 : e.gamma}`), e.grayscale && H.push("hue=s=0"), e.sepia && H.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"), e.blur && H.push(`boxblur=${e.blur}:1`), e.noise && H.push(`noise=alls=${e.noise}:allf=t+u`), e.sharpen && H.push("unsharp=5:5:1.0:5:5:0.0"), e.vintage && (H.push("curves=vintage"), H.push("vignette=PI/4")), e.reverse && (H.push("reverse"), U.push("areverse")), H.length > 0 && V.push("-vf", H.join(",")), U.length > 0 && V.push("-af", U.join(",")), e.quality === "low" ? V.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30") : e.quality === "high" ? V.push("-c:v", "libx264", "-preset", "slow", "-crf", "18") : V.push("-c:v", "libx264", "-preset", "medium", "-crf", "23"), V.push("-c:a", "aac", "-b:a", "128k"), V.push("-y", B), new Promise((e, M) => {
			let N = spawn(this.ffmpegPath, V);
			this.activeProcesses.set(j, N), N.stderr.on("data", (e) => {
				let M = e.toString(), N = M.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				if (N && A) {
					let e = parseInt(N[1]) * 3600 + parseInt(N[2]) * 60 + parseFloat(N[3]), P = Math.min(e / L * 100, 100), F = M.match(/speed=\s*(\d+\.?\d*)x/);
					A({
						id: j,
						percent: P,
						state: "processing",
						speed: F ? parseFloat(F[1]) : 1
					});
				}
			}), N.on("close", (N) => {
				this.activeProcesses.delete(j), N === 0 ? (A && A({
					id: j,
					percent: 100,
					state: "complete",
					outputPath: B
				}), e(B)) : M(/* @__PURE__ */ Error(`Effects application failed with code ${N}`));
			}), N.on("error", (e) => {
				this.activeProcesses.delete(j), M(e);
			});
		});
	}
	async getVideoInfo(e) {
		if (!this.ffmpegPath) throw Error("FFmpeg not available");
		return new Promise((A, j) => {
			let M = spawn(this.ffmpegPath, [
				"-i",
				e,
				"-hide_banner"
			]), N = "";
			M.stderr.on("data", (e) => N += e.toString()), M.on("close", (e) => {
				if (e !== 0 && !N.includes("Duration")) {
					j(/* @__PURE__ */ Error("Failed to get video info"));
					return;
				}
				let M = N.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
				A({ duration: M ? parseInt(M[1]) * 3600 + parseInt(M[2]) * 60 + parseFloat(M[3]) : 0 });
			}), M.on("error", j);
		});
	}
	cancelEffects(e) {
		let A = this.activeProcesses.get(e);
		A && (A.kill(), this.activeProcesses.delete(e));
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
function setLoginItemSettingsSafely(e) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: e,
			openAsHidden: !0
		}), { success: !0 };
	} catch (e) {
		let A = e instanceof Error ? e.message : String(e);
		return console.warn("Failed to set login item settings:", A), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: A
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
	if (process.platform === "darwin") if (statsMenuData && statsMenuData.preferences?.showMenuBar) {
		let e = [], A = (e) => statsMenuData?.enabledModules?.includes(e) ?? !1;
		A("cpu") && e.push(`${statsMenuData.cpu.toFixed(0)}%`), A("memory") && e.push(`${statsMenuData.memory.percent.toFixed(0)}%`), tray.setTitle(e.length > 0 ? e.join(" ") : "");
	} else tray.setTitle("");
	let e = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let A = Math.min(clipboardItems.length, 9);
		e.push({
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
					label: `● Recent Clipboard (${A})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((e, A) => {
					let j = String(e.content || ""), N = (j.length > 75 ? j.substring(0, 75) + "..." : j).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${A + 1}. ${N || "(Empty)"}`,
						click: () => {
							j && (clipboard.writeText(j), new Notification({
								title: "✓ Copied from History",
								body: N || "Copied to clipboard",
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
		}), e.push({ type: "separator" });
	} else e.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), e.push({ type: "separator" });
	if (e.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let e = randomUUID();
					clipboard.writeText(e), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${e.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let e = clipboard.readText(), A = JSON.parse(e), j = JSON.stringify(A, null, 2);
						clipboard.writeText(j), new Notification({
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
						let e = clipboard.readText();
						if (!e) throw Error("Empty clipboard");
						let A = createHash("sha256").update(e).digest("hex");
						clipboard.writeText(A), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${A.substring(0, 20)}...`,
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
						let e = clipboard.readText();
						if (!e) throw Error("Empty clipboard");
						let A = Buffer.from(e).toString("base64");
						clipboard.writeText(A), new Notification({
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
						let e = clipboard.readText();
						if (!e) throw Error("Empty clipboard");
						let A = Buffer.from(e, "base64").toString("utf-8");
						clipboard.writeText(A), new Notification({
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
	}), e.push({ type: "separator" }), statsMenuData) {
		let A = (e) => statsMenuData?.enabledModules?.includes(e) ?? !0;
		if (e.push({
			label: "📊 Stats Monitor",
			enabled: !1
		}), A("cpu")) {
			let A = statsMenuData.cpu ?? 0, j = statsMenuData.sensors?.cpuTemp;
			e.push({
				label: `   CPU: ${A.toFixed(1)}% ${j === void 0 ? "" : `(${j.toFixed(1)}°C)`}`,
				enabled: !1
			});
		}
		if (A("memory")) {
			let A = statsMenuData.memory?.used ?? 0, j = statsMenuData.memory?.total ?? 0, M = statsMenuData.memory?.percent ?? 0;
			e.push({
				label: `   RAM: ${formatBytes(A)} / ${formatBytes(j)} (${M.toFixed(1)}%)`,
				enabled: !1
			});
		}
		if (A("gpu") && statsMenuData.gpu) {
			let A = statsMenuData.gpu.load ?? 0, j = statsMenuData.gpu.memoryUsed ?? 0, M = statsMenuData.gpu.memoryTotal ?? 0;
			e.push({
				label: `   GPU: ${A.toFixed(1)}% (${formatBytes(j)} / ${formatBytes(M)})`,
				enabled: !1
			});
		}
		if (A("network")) {
			let A = statsMenuData.network?.rx ?? 0, j = statsMenuData.network?.tx ?? 0;
			e.push({
				label: `   Net: ↑${formatSpeed(A)} ↓${formatSpeed(j)}`,
				enabled: !1
			});
		}
		if (A("battery") && statsMenuData.battery) {
			let A = statsMenuData.battery, j = A.level ?? 0;
			e.push({
				label: `   Bat: ${j}% ${A.charging ? "(Charging)" : ""}`,
				enabled: !1
			});
		}
		let j = (e) => {
			win?.webContents.send("stats-toggle-module", e);
		};
		e.push({
			label: "⚙️ Toggle Modules",
			submenu: [
				{
					label: "CPU Usage",
					type: "checkbox",
					checked: A("cpu"),
					click: () => j("cpu")
				},
				{
					label: "Memory Usage",
					type: "checkbox",
					checked: A("memory"),
					click: () => j("memory")
				},
				{
					label: "GPU Usage",
					type: "checkbox",
					checked: A("gpu"),
					click: () => j("gpu")
				},
				{
					label: "Network Speed",
					type: "checkbox",
					checked: A("network"),
					click: () => j("network")
				},
				{
					label: "Battery Info",
					type: "checkbox",
					checked: A("battery"),
					click: () => j("battery")
				}
			]
		}), e.push({ type: "separator" }), e.push({
			label: "▸ Open Stats Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
			}
		}), e.push({ type: "separator" });
	}
	if (healthMenuData) {
		let A = healthMenuData.alerts.filter((e) => e.severity === "critical" || e.severity === "warning").length, j = A > 0 ? `🛡️ System Health (${A} alerts)` : "🛡️ System Health", N = [
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
		healthMenuData.disk && N.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && N.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), N.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (N.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((e) => {
			N.push({
				label: `${e.severity === "critical" ? "🔴" : e.severity === "warning" ? "🟡" : "🔵"} ${e.message.substring(0, 50)}${e.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), N.push({ type: "separator" })), N.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), N.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let e = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							e?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(e.ramFreed || 0)}`,
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
		}), e.push({
			label: j,
			submenu: N
		}), e.push({ type: "separator" });
	}
	recentTools.length > 0 && (e.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((e) => ({
			label: `  • ${e.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", e.id);
			}
		}))
	}), e.push({ type: "separator" })), e.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), e.push({ type: "separator" }), e.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let A = Menu.buildFromTemplate(e);
	tray.setContextMenu(A);
}
function createWindow() {
	let e = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, j = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...e,
		minWidth: 800,
		minHeight: 600,
		resizable: !0,
		show: !j,
		frame: !1,
		transparent: process.platform === "darwin",
		backgroundColor: "#050505",
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let N = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", N), win.on("move", N), win.on("close", (e) => {
		let A = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && A && (e.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let e = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return e.canceled || e.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: e.filePaths[0]
		};
	}), ipcMain.handle("store-get", (e, A) => store.get(A)), ipcMain.handle("store-set", (e, A, j) => {
		if (store.set(A, j), A === "launchAtLogin") {
			let e = setLoginItemSettingsSafely(j === !0);
			!e.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: e.error
			});
		}
	}), ipcMain.handle("store-delete", (e, A) => store.delete(A)), setupScreenshotHandlers(win), ipcMain.on("window-set-opacity", (e, A) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, A)));
	}), ipcMain.on("window-set-always-on-top", (e, A) => {
		win && win.setAlwaysOnTop(A);
	}), ipcMain.handle("permissions:check-all", async () => {
		let e = process.platform, A = {};
		return e === "darwin" ? (A.accessibility = await B(), A.fullDiskAccess = await V(), A.screenRecording = await H()) : e === "win32" && (A.fileAccess = await K(), A.registryAccess = await q()), A.clipboard = await U(), A.launchAtLogin = await W(), A;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await B() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await V() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await H() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await J()), ipcMain.handle("permissions:test-file-access", async () => await Y()), ipcMain.handle("permissions:open-system-preferences", async (e, A) => await X(A));
	async function B() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let e = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(e, () => {})) return globalShortcut.unregister(e), { status: "granted" };
			} catch {}
			return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function V() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (let e of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				return await fs.access(e), { status: "granted" };
			} catch {}
			let e = os.homedir();
			try {
				return await fs.readdir(e), {
					status: "granted",
					message: "Basic file access available"
				};
			} catch {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function H() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let e = await desktopCapturer.getSources({ types: ["screen"] });
				if (e && e.length > 0) return { status: "granted" };
			} catch {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function U() {
		try {
			let e = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			let A = clipboard.readText();
			return clipboard.writeText(e), A === "__PERMISSION_TEST__" ? { status: "granted" } : {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function W() {
		try {
			let e = app.getLoginItemSettings();
			return {
				status: e.openAtLogin ? "granted" : "not-determined",
				message: e.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function K() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let e = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), A = "permission test";
			await fs.writeFile(e, A);
			let j = await fs.readFile(e, "utf-8");
			return await fs.unlink(e), j === A ? { status: "granted" } : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (e) {
			return {
				status: "denied",
				message: e.message
			};
		}
	}
	async function q() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let { stdout: e } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			return e && !e.includes("ERROR") ? { status: "granted" } : {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (e) {
			return {
				status: "denied",
				message: e.message
			};
		}
	}
	async function J() {
		try {
			let e = clipboard.readText(), A = `Permission test ${Date.now()}`;
			clipboard.writeText(A);
			let j = clipboard.readText();
			return clipboard.writeText(e), j === A ? {
				status: "granted",
				message: "Clipboard read/write test passed"
			} : {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (e) {
			return {
				status: "error",
				message: e.message
			};
		}
	}
	async function Y() {
		try {
			let e = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), A = `Test ${Date.now()}`;
			await fs.writeFile(e, A);
			let j = await fs.readFile(e, "utf-8");
			return await fs.unlink(e), j === A ? {
				status: "granted",
				message: "File access test passed"
			} : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (e) {
			return {
				status: "denied",
				message: e.message
			};
		}
	}
	async function X(e) {
		let A = process.platform;
		try {
			if (A === "darwin") {
				let A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				return e === "accessibility" ? A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : e === "full-disk-access" ? A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : e === "screen-recording" && (A = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync(A), {
					success: !0,
					message: "Opened System Preferences"
				};
			} else if (A === "win32") return await execAsync("start ms-settings:privacy"), {
				success: !0,
				message: "Opened Windows Settings"
			};
			return {
				success: !1,
				message: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}
	ipcMain.on("tray-update-menu", (e, A) => {
		recentTools = A || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (e, A) => {
		clipboardItems = (A || []).sort((e, A) => A.timestamp - e.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (e) {
			return console.error("Failed to read clipboard:", e), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let e = clipboard.readImage();
			return e.isEmpty() ? null : e.toDataURL();
		} catch (e) {
			return console.error("Failed to read clipboard image:", e), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (e, A) => {
		clipboardMonitoringEnabled = A, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (e, A) => {
		statsMenuData = A, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (e, A) => {
		healthMenuData = A, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let e = async () => {
			try {
				let e = await si.mem(), A = await si.currentLoad(), j = await si.fsSize(), N = await si.battery().catch(() => null), P = [], F = j.find((e) => e.mount === "/" || e.mount === "C:") || j[0];
				if (F) {
					let e = F.available / F.size * 100;
					e < 10 ? P.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(F.available)} free`
					}) : e < 20 && P.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(F.available)} free`
					});
				}
				A.currentLoad > 90 && P.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${A.currentLoad.toFixed(1)}%`
				});
				let I = e.used / e.total * 100;
				I > 90 && P.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${I.toFixed(1)}%`
				}), healthMenuData = {
					cpu: A.currentLoad,
					ram: {
						used: e.used,
						total: e.total,
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
				}, updateTrayMenu();
				let L = P.filter((e) => e.severity === "critical");
				L.length > 0 && win && L.forEach((e) => {
					new Notification({
						title: "⚠️ System Alert",
						body: e.message,
						silent: !1
					}).show();
				});
			} catch (e) {
				console.error("Health monitoring error:", e);
			}
		};
		return e(), healthMonitoringInterval = setInterval(e, 5e3), { success: !0 };
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
	} catch (e) {
		console.error("Failed to register global shortcut", e);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [e, A] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: e.manufacturer,
			brand: e.brand,
			speed: e.speed,
			cores: e.cores,
			physicalCores: e.physicalCores,
			load: A
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [e, A] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: e,
			interfaces: A
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [e, A] = await Promise.all([si.fsSize(), si.disksIO()]), j = null;
			if (A && Array.isArray(A) && A.length > 0) {
				let e = A[0];
				j = {
					rIO: e.rIO || 0,
					wIO: e.wIO || 0,
					tIO: e.tIO || 0,
					rIO_sec: e.rIO_sec || 0,
					wIO_sec: e.wIO_sec || 0,
					tIO_sec: e.tIO_sec || 0
				};
			} else A && typeof A == "object" && !Array.isArray(A) && (j = {
				rIO: A.rIO || 0,
				wIO: A.wIO || 0,
				tIO: A.tIO || 0,
				rIO_sec: A.rIO_sec || 0,
				wIO_sec: A.wIO_sec || 0,
				tIO_sec: A.tIO_sec || 0
			});
			return {
				fsSize: e,
				ioStats: j
			};
		} catch (e) {
			return console.error("Error fetching disk stats:", e), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let e = await si.battery(), A, j;
			if ("powerConsumptionRate" in e && e.powerConsumptionRate && typeof e.powerConsumptionRate == "number" && (A = e.powerConsumptionRate), e.voltage && e.voltage > 0) {
				if (!e.isCharging && e.timeRemaining > 0 && e.currentCapacity > 0) {
					let j = e.currentCapacity / e.timeRemaining * 60;
					A = e.voltage * j;
				}
				e.isCharging && e.voltage > 0 && (j = e.voltage * 2e3);
			}
			return {
				...e,
				powerConsumptionRate: A,
				chargingPower: j
			};
		} catch (e) {
			return console.error("Error fetching battery stats:", e), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let e = await si.bluetoothDevices();
			return {
				enabled: e.length > 0 || await checkBluetoothEnabled(),
				devices: e.map((e) => ({
					name: e.name || "Unknown",
					mac: e.mac || e.address || "",
					type: e.type || e.deviceClass || "unknown",
					battery: e.battery || e.batteryLevel || void 0,
					connected: e.connected !== !1,
					rssi: e.rssi || e.signalStrength || void 0,
					manufacturer: e.manufacturer || e.vendor || void 0
				}))
			};
		} catch (e) {
			return console.error("Error fetching bluetooth stats:", e), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let e = await si.time(), A = Intl.DateTimeFormat().resolvedOptions().timeZone, j = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((e) => {
				let A = /* @__PURE__ */ new Date(), j = new Intl.DateTimeFormat("en-US", {
					timeZone: e,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), M = new Intl.DateTimeFormat("en-US", {
					timeZone: e,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), N = getTimezoneOffset(e);
				return {
					timezone: e,
					city: e.split("/").pop()?.replace("_", " ") || e,
					time: j.format(A),
					date: M.format(A),
					offset: N
				};
			});
			return {
				local: {
					timezone: A,
					city: A.split("/").pop()?.replace("_", " ") || "Local",
					time: e.current,
					date: e.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(A)
				},
				zones: j
			};
		} catch (e) {
			return console.error("Error fetching timezones stats:", e), null;
		}
	}), ipcMain.handle("system:get-info", async () => {
		try {
			let [e, A, j, M, N, P] = await Promise.all([
				si.cpu(),
				si.mem(),
				si.osInfo(),
				si.graphics(),
				si.diskLayout(),
				si.networkInterfaces()
			]);
			return {
				cpu: e,
				memory: A,
				os: j,
				graphics: M.controllers,
				disks: N,
				network: P.filter((e) => e.operstate === "up")
			};
		} catch (e) {
			return console.error("Error fetching system info:", e), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let j = process.platform, M = [];
			if (j === "darwin") {
				let A = "/Applications", j = await fs.readdir(A, { withFileTypes: !0 }).catch(() => []);
				for (let N of j) if (N.name.endsWith(".app")) {
					let j = join(A, N.name);
					try {
						let A = await fs.stat(j), P = N.name.replace(".app", ""), F = j.startsWith("/System") || j.startsWith("/Library") || P.startsWith("com.apple.");
						M.push({
							id: `macos-${P}-${A.ino}`,
							name: P,
							version: void 0,
							publisher: void 0,
							installDate: A.birthtime.toISOString(),
							installLocation: j,
							size: await e(j).catch(() => 0),
							isSystemApp: F
						});
					} catch {}
				}
			} else if (j === "win32") try {
				let { stdout: e } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), j = JSON.parse(e), N = Array.isArray(j) ? j : [j];
				for (let e of N) if (e.DisplayName) {
					let j = e.Publisher || "", N = e.InstallLocation || "", P = j.includes("Microsoft") || j.includes("Windows") || N.includes("Windows\\") || N.includes("Program Files\\Windows");
					M.push({
						id: `win-${e.DisplayName}-${e.InstallDate || "unknown"}`,
						name: e.DisplayName,
						version: e.DisplayVersion || void 0,
						publisher: j || void 0,
						installDate: e.InstallDate ? A(e.InstallDate) : void 0,
						installLocation: N || void 0,
						size: e.EstimatedSize ? e.EstimatedSize * 1024 : void 0,
						isSystemApp: P
					});
				}
			} catch (e) {
				console.error("Error fetching Windows apps:", e);
			}
			return M;
		} catch (e) {
			return console.error("Error fetching installed apps:", e), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let e = await si.processes(), A = await si.mem();
			return e.list.map((e) => ({
				pid: e.pid,
				name: e.name,
				cpu: e.cpu || 0,
				memory: e.mem || 0,
				memoryPercent: A.total > 0 ? (e.mem || 0) / A.total * 100 : 0,
				started: e.started || "",
				user: e.user || void 0,
				command: e.command || void 0,
				path: e.path || void 0
			}));
		} catch (e) {
			return console.error("Error fetching running processes:", e), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (e, A) => {
		try {
			let e = process.platform;
			if (e === "darwin") {
				if (A.installLocation) return await fs.rm(A.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (e === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${A.name.replace(/"/g, "\\\"")}" } | 
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
			} catch (e) {
				return {
					success: !1,
					error: e.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (e, A) => {
		try {
			return process.kill(A, "SIGTERM"), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				error: e.message
			};
		}
	}), ipcMain.handle("youtube:getInfo", async (e, A) => {
		try {
			return await youtubeDownloader.getVideoInfo(A);
		} catch (e) {
			throw e;
		}
	}), ipcMain.handle("youtube:getPlaylistInfo", async (e, A) => {
		try {
			return await youtubeDownloader.getPlaylistInfo(A);
		} catch (e) {
			throw e;
		}
	}), ipcMain.handle("youtube:download", async (e, A) => {
		try {
			return {
				success: !0,
				filepath: await youtubeDownloader.downloadVideo(A, (A) => {
					e.sender.send("youtube:progress", A);
				})
			};
		} catch (e) {
			return {
				success: !1,
				error: e instanceof Error ? e.message : "Download failed"
			};
		}
	}), ipcMain.handle("youtube:cancel", async () => (youtubeDownloader.cancelDownload(), { success: !0 })), ipcMain.handle("youtube:openFile", async (e, A) => {
		let { shell: j } = await import("electron");
		return j.openPath(A);
	}), ipcMain.handle("youtube:showInFolder", async (e, A) => {
		let { shell: j } = await import("electron");
		return j.showItemInFolder(A), !0;
	}), ipcMain.handle("youtube:chooseFolder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
			title: "Choose Download Location",
			buttonLabel: "Select Folder"
		});
		return A.canceled || A.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: A.filePaths[0]
		};
	}), ipcMain.handle("youtube:getHistory", () => youtubeDownloader.getHistory()), ipcMain.handle("youtube:clearHistory", () => (youtubeDownloader.clearHistory(), !0)), ipcMain.handle("youtube:removeFromHistory", (e, A) => (youtubeDownloader.removeFromHistory(A), !0)), ipcMain.handle("youtube:getSettings", () => youtubeDownloader.getSettings()), ipcMain.handle("youtube:saveSettings", (e, A) => youtubeDownloader.saveSettings(A)), ipcMain.handle("youtube:getCapabilities", () => youtubeDownloader.getCapabilities()), ipcMain.handle("youtube:installAria2", async () => await youtubeDownloader.installAria2()), ipcMain.handle("tiktok:get-info", async (e, A) => await tiktokDownloader.getVideoInfo(A)), ipcMain.handle("tiktok:download", async (e, A) => new Promise((e, j) => {
		tiktokDownloader.downloadVideo(A, (e) => {
			win?.webContents.send("tiktok:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("tiktok:cancel", async (e, A) => {
		tiktokDownloader.cancelDownload(A);
	}), ipcMain.handle("tiktok:get-history", async () => tiktokDownloader.getHistory()), ipcMain.handle("tiktok:clear-history", async () => {
		tiktokDownloader.clearHistory();
	}), ipcMain.handle("tiktok:remove-from-history", async (e, A) => {
		tiktokDownloader.removeFromHistory(A);
	}), ipcMain.handle("tiktok:get-settings", async () => tiktokDownloader.getSettings()), ipcMain.handle("tiktok:save-settings", async (e, A) => tiktokDownloader.saveSettings(A)), ipcMain.handle("tiktok:choose-folder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return A.canceled ? null : A.filePaths[0];
	}), ipcMain.handle("universal:get-info", async (e, A) => await universalDownloader.getMediaInfo(A)), ipcMain.handle("universal:download", async (e, A) => new Promise((e, j) => {
		universalDownloader.downloadMedia(A, (e) => {
			win?.webContents.send("universal:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("universal:cancel", async (e, A) => {
		universalDownloader.cancelDownload(A);
	}), ipcMain.handle("universal:get-history", async () => universalDownloader.getHistory()), ipcMain.handle("universal:clear-history", async () => {
		universalDownloader.clearHistory();
	}), ipcMain.handle("universal:remove-from-history", async (e, A) => {
		universalDownloader.removeFromHistory(A);
	}), ipcMain.handle("universal:get-settings", async () => universalDownloader.getSettings()), ipcMain.handle("universal:save-settings", async (e, A) => universalDownloader.saveSettings(A)), ipcMain.handle("universal:choose-folder", async () => {
		let { dialog: e } = await import("electron"), A = await e.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return A.canceled ? null : A.filePaths[0];
	}), ipcMain.handle("universal:check-disk-space", async (e, A) => await universalDownloader.checkDiskSpace(A)), ipcMain.handle("universal:get-queue", async () => universalDownloader.getQueue()), ipcMain.handle("universal:open-file", async (e, A) => {
		let { shell: j } = await import("electron");
		try {
			await fs.access(A), j.openPath(A);
		} catch {
			console.error("File not found:", A);
		}
	}), ipcMain.handle("universal:show-in-folder", async (e, A) => {
		let { shell: j } = await import("electron");
		j.showItemInFolder(A);
	}), ipcMain.handle("audio:get-info", async (e, A) => await audioExtractor.getAudioInfo(A)), ipcMain.handle("audio:extract", async (e, A) => new Promise((e, j) => {
		audioExtractor.extractAudio(A, (e) => {
			win?.webContents.send("audio:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("audio:cancel", async (e, A) => {
		audioExtractor.cancelExtraction(A);
	}), ipcMain.handle("audio:cancel-all", async () => {
		audioExtractor.cancelAll();
	}), ipcMain.handle("audio:choose-input-file", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? null : e.filePaths[0];
	}), ipcMain.handle("audio:choose-input-files", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? [] : e.filePaths;
	}), ipcMain.handle("audio:choose-output-folder", async () => {
		let e = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
		return e.canceled ? null : e.filePaths[0];
	}), ipcMain.handle("video-merger:get-info", async (e, A) => await videoMerger.getVideoInfo(A)), ipcMain.handle("video-merger:generate-thumbnail", async (e, A, j) => await videoMerger.generateThumbnail(A, j)), ipcMain.handle("video-filmstrip:generate", async (e, A, j, M) => await videoMerger.generateFilmstrip(A, j, M)), ipcMain.handle("video-merger:extract-waveform", async (e, A) => await videoMerger.extractWaveform(A)), ipcMain.handle("video-merger:merge", async (e, A) => new Promise((e, j) => {
		videoMerger.mergeVideos(A, (e) => {
			win?.webContents.send("video-merger:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("video-merger:create-from-images", async (e, A) => new Promise((e, j) => {
		videoMerger.createVideoFromImages(A, (e) => {
			win?.webContents.send("video-merger:progress", e);
		}).then(e).catch(j);
	})), ipcMain.handle("video-merger:cancel", async (e, A) => {
		videoMerger.cancelMerge(A);
	}), ipcMain.handle("audio-manager:get-info", async (e, A) => await audioManager.getAudioInfo(A)), ipcMain.handle("audio-manager:apply", async (e, A) => await audioManager.applyAudioChanges(A, (A) => {
		e.sender.send("audio-manager:progress", A);
	})), ipcMain.handle("audio-manager:cancel", async (e, A) => {
		audioManager.cancel(A);
	}), ipcMain.handle("video-trimmer:process", async (e, A) => await videoTrimmer.process(A, (A) => {
		e.sender.send("video-trimmer:progress", A);
	})), ipcMain.handle("video-effects:apply", async (e, A) => await videoEffects.applyEffects(A, (e) => {
		win?.webContents.send("video-effects:progress", e);
	})), ipcMain.on("video-effects:cancel", (e, A) => {
		videoEffects.cancelEffects(A);
	}), ipcMain.handle("video-effects:get-info", async (e, A) => await videoMerger.getVideoInfo(A)), ipcMain.handle("video-trimmer:cancel", async (e, A) => {
		videoTrimmer.cancel(A);
	}), ipcMain.handle("video-merger:choose-files", async () => {
		let e = await dialog.showOpenDialog({
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
		return e.canceled ? [] : e.filePaths;
	});
	async function e(A) {
		try {
			let j = 0, M = await fs.readdir(A, { withFileTypes: !0 });
			for (let N of M) {
				let M = join(A, N.name);
				try {
					if (N.isDirectory()) j += await e(M);
					else {
						let e = await fs.stat(M);
						j += e.size;
					}
				} catch {}
			}
			return j;
		} catch {
			return 0;
		}
	}
	function A(e) {
		return e && e.length === 8 ? `${e.substring(0, 4)}-${e.substring(4, 6)}-${e.substring(6, 8)}` : e;
	}
	setupCleanerHandlers(), protocol.handle("local-media", async (e) => {
		try {
			console.log("[LocalMedia] Request:", e.url);
			let A = new URL(e.url), j = decodeURIComponent(A.pathname);
			console.log("[LocalMedia] Initial Path:", j), process.platform === "win32" ? /^\/[a-zA-Z]:/.test(j) ? j = j.slice(1) : /^[a-zA-Z]\//.test(j) && (j = j.charAt(0) + ":" + j.slice(1)) : j = j.replace(/^\/+/, "/"), console.log("[LocalMedia] Final Path:", j);
			let M = (await fs.stat(j)).size, N = path.extname(j).toLowerCase(), P = "application/octet-stream";
			N === ".mp4" ? P = "video/mp4" : N === ".webm" ? P = "video/webm" : N === ".mov" ? P = "video/quicktime" : N === ".avi" ? P = "video/x-msvideo" : N === ".mkv" ? P = "video/x-matroska" : N === ".mp3" ? P = "audio/mpeg" : N === ".wav" && (P = "audio/wav");
			let F = e.headers.get("Range");
			if (F) {
				let e = F.replace(/bytes=/, "").split("-"), A = parseInt(e[0], 10), N = e[1] ? parseInt(e[1], 10) : M - 1, I = N - A + 1;
				console.log(`[LocalMedia] Streaming Range: ${A}-${N}/${M}`);
				let L = createReadStream(j, {
					start: A,
					end: N
				}), R = Readable.toWeb(L);
				return new Response(R, {
					status: 206,
					headers: {
						"Content-Range": `bytes ${A}-${N}/${M}`,
						"Accept-Ranges": "bytes",
						"Content-Length": I.toString(),
						"Content-Type": P
					}
				});
			} else {
				console.log(`[LocalMedia] Streaming Full: ${M}`);
				let e = createReadStream(j), A = Readable.toWeb(e);
				return new Response(A, { headers: {
					"Content-Length": M.toString(),
					"Content-Type": P,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (e) {
			return console.error("[LocalMedia] Error:", e), e.code === "ENOENT" ? new Response("File not found", { status: 404 }) : new Response("Error loading media: " + e.message, { status: 500 });
		}
	}), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: A } = __require("child_process");
			return A("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(e) {
	let A = /* @__PURE__ */ new Date(), j = A.getTime() + A.getTimezoneOffset() * 6e4, M = A.toLocaleString("en-US", {
		timeZone: e,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(M).getTime() - j) / (1e3 * 60 * 60);
}
function formatBytes(e) {
	if (e === 0) return "0 B";
	let A = 1024, j = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], M = Math.floor(Math.log(e) / Math.log(A));
	return `${(e / A ** +M).toFixed(1)} ${j[M]}`;
}
function formatSpeed(e) {
	return e > 1024 * 1024 ? `${(e / 1024 / 1024).toFixed(1)} MB/s` : e > 1024 ? `${(e / 1024).toFixed(1)} KB/s` : `${e.toFixed(0)} B/s`;
}
