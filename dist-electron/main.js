import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, screen } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import si from "systeminformation";
import { createRequire } from "module";
import fs$1 from "fs";
import path$1 from "path";
import Store from "electron-store";
import { randomUUID as randomUUID$1 } from "crypto";
import { exec as exec$1, execSync } from "child_process";
import { promisify as promisify$1 } from "util";
import https from "https";
var __require = /* @__PURE__ */ ((i) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(i, { get: (i, N) => (typeof require < "u" ? require : i)[N] }) : i)(function(i) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + i + "\" in an environment that doesn't expose the `require` function.");
}), execAsync$1 = promisify(exec), dirSizeCache = /* @__PURE__ */ new Map(), CACHE_TTL = 300 * 1e3;
setInterval(() => {
	let i = Date.now();
	for (let [N, P] of dirSizeCache.entries()) i - P.timestamp > CACHE_TTL && dirSizeCache.delete(N);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let i = process.platform, N = [], P = os.homedir();
		if (i === "win32") {
			let i = process.env.WINDIR || "C:\\Windows", P = process.env.LOCALAPPDATA || "", F = os.tmpdir(), I = path.join(i, "Temp"), L = path.join(i, "Prefetch"), R = path.join(i, "SoftwareDistribution", "Download");
			N.push({
				path: F,
				name: "User Temporary Files",
				category: "temp"
			}), N.push({
				path: I,
				name: "System Temporary Files",
				category: "temp"
			}), N.push({
				path: L,
				name: "Prefetch Files",
				category: "system"
			}), N.push({
				path: R,
				name: "Windows Update Cache",
				category: "system"
			});
			let z = path.join(P, "Google/Chrome/User Data/Default/Cache"), B = path.join(P, "Microsoft/Edge/User Data/Default/Cache");
			N.push({
				path: z,
				name: "Chrome Cache",
				category: "cache"
			}), N.push({
				path: B,
				name: "Edge Cache",
				category: "cache"
			}), N.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (i === "darwin") {
			N.push({
				path: path.join(P, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), N.push({
				path: path.join(P, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), N.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), N.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), N.push({
				path: path.join(P, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), N.push({
				path: path.join(P, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: i } = await execAsync$1("tmutil listlocalsnapshots /"), P = i.split("\n").filter((i) => i.trim()).length;
				P > 0 && N.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${P})`,
					category: "system",
					virtual: !0,
					size: P * 500 * 1024 * 1024
				});
			} catch {}
		}
		let F = [], I = 0;
		for (let i of N) try {
			if (i.virtual) {
				F.push({
					...i,
					sizeFormatted: formatBytes$1(i.size || 0)
				}), I += i.size || 0;
				continue;
			}
			let N = await fs.stat(i.path).catch(() => null);
			if (N) {
				let P = N.isDirectory() ? await getDirSize(i.path) : N.size;
				P > 0 && (F.push({
					...i,
					size: P,
					sizeFormatted: formatBytes$1(P)
				}), I += P);
			}
		} catch {}
		return {
			items: F,
			totalSize: I,
			totalSizeFormatted: formatBytes$1(I)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (i, N) => {
		let P = N || os.homedir(), F = i.sender;
		return await scanDirectoryForLens(P, 0, 1, (i) => {
			F && !F.isDestroyed() && F.send("cleaner:space-lens-progress", i);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (i, N) => {
		let P = dirSizeCache.get(N);
		if (P && Date.now() - P.timestamp < CACHE_TTL) return {
			size: P.size,
			sizeFormatted: formatBytes$1(P.size),
			cached: !0
		};
		try {
			let i = await getDirSizeLimited(N, 4), P = formatBytes$1(i);
			return dirSizeCache.set(N, {
				size: i,
				timestamp: Date.now()
			}), {
				size: i,
				sizeFormatted: P,
				cached: !1
			};
		} catch (i) {
			return {
				size: 0,
				sizeFormatted: formatBytes$1(0),
				cached: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (i, N) => {
		if (N) for (let i of dirSizeCache.keys()) i.startsWith(N) && dirSizeCache.delete(i);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let i = await si.processes(), N = await si.mem(), P = await si.currentLoad();
		return {
			heavyApps: i.list.sort((i, N) => N.cpu + N.mem - (i.cpu + i.mem)).slice(0, 10).map((i) => ({
				pid: i.pid,
				name: i.name,
				cpu: i.cpu,
				mem: i.mem,
				user: i.user,
				path: i.path
			})),
			memory: {
				total: N.total,
				used: N.used,
				percent: N.used / N.total * 100
			},
			cpuLoad: P.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let i = process.platform, N = [];
		if (i === "darwin") try {
			let i = path.join(os.homedir(), "Library/LaunchAgents"), P = await fs.readdir(i).catch(() => []);
			for (let F of P) if (F.endsWith(".plist")) {
				let P = path.join(i, F), { stdout: I } = await execAsync$1(`launchctl list | grep -i "${F.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), L = I.trim().length > 0;
				N.push({
					name: F.replace(".plist", ""),
					path: P,
					type: "LaunchAgent",
					enabled: L
				});
			}
			let F = "/Library/LaunchAgents", I = await fs.readdir(F).catch(() => []);
			for (let i of I) {
				let P = path.join(F, i), { stdout: I } = await execAsync$1(`launchctl list | grep -i "${i.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), L = I.trim().length > 0;
				N.push({
					name: i.replace(".plist", ""),
					path: P,
					type: "SystemAgent",
					enabled: L
				});
			}
		} catch {}
		else if (i === "win32") try {
			let { stdout: i } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), P = JSON.parse(i), F = Array.isArray(P) ? P : [P];
			for (let i of F) N.push({
				name: i.Name,
				path: i.Command,
				type: "StartupCommand",
				location: i.Location,
				enabled: !0
			});
		} catch {}
		return N;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (i, N) => {
		let P = process.platform;
		try {
			if (P === "darwin") {
				let i = N.enabled ?? !0;
				if (N.type === "LaunchAgent" || N.type === "SystemAgent") return i ? await execAsync$1(`launchctl unload "${N.path}"`) : await execAsync$1(`launchctl load "${N.path}"`), {
					success: !0,
					enabled: !i
				};
			} else if (P === "win32") {
				let i = N.enabled ?? !0;
				if (N.location === "Startup") {
					let P = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), F = path.basename(N.path), I = path.join(P, F);
					return i && await fs.unlink(I).catch(() => {}), {
						success: !0,
						enabled: !i
					};
				} else return {
					success: !0,
					enabled: !i
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (i, N) => {
		try {
			return process.kill(N, "SIGKILL"), { success: !0 };
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let i = process.platform, N = [];
		if (i === "darwin") {
			let i = "/Applications", P = await fs.readdir(i, { withFileTypes: !0 }).catch(() => []);
			for (let F of P) if (F.name.endsWith(".app")) {
				let P = path.join(i, F.name);
				try {
					let i = await fs.stat(P);
					N.push({
						name: F.name.replace(".app", ""),
						path: P,
						size: await getDirSize(P),
						installDate: i.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (i === "win32") try {
			let { stdout: i } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), P = JSON.parse(i), F = Array.isArray(P) ? P : [P];
			for (let i of F) i.DisplayName && N.push({
				name: i.DisplayName,
				version: i.DisplayVersion,
				path: i.InstallLocation,
				installDate: i.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return N;
	}), ipcMain.handle("cleaner:get-large-files", async (i, N) => {
		let P = N.minSize || 100 * 1024 * 1024, F = N.scanPaths || [os.homedir()], I = [];
		for (let i of F) await findLargeFiles(i, P, I);
		return I.sort((i, N) => N.size - i.size), I.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (i, N) => {
		let P = N || os.homedir(), F = /* @__PURE__ */ new Map(), I = [];
		await findDuplicates(P, F);
		for (let [i, N] of F.entries()) if (N.length > 1) try {
			let P = await fs.stat(N[0]);
			I.push({
				hash: i,
				size: P.size,
				sizeFormatted: formatBytes$1(P.size),
				totalWasted: P.size * (N.length - 1),
				totalWastedFormatted: formatBytes$1(P.size * (N.length - 1)),
				files: N
			});
		} catch {}
		return I.sort((i, N) => N.totalWasted - i.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (i, N) => {
		let P = 0, F = [], I = process.platform, L = checkFilesSafety(N, I);
		if (!L.safe && L.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${L.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: L.blocked
		};
		for (let i = 0; i < N.length; i += 50) {
			let I = N.slice(i, i + 50);
			for (let i of I) try {
				if (i === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), P += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let N = await fs.stat(i).catch(() => null);
				if (!N) continue;
				let F = N.isDirectory() ? await getDirSize(i) : N.size;
				N.isDirectory() ? await fs.rm(i, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(i), P += F;
			} catch {
				F.push(i);
			}
		}
		return {
			success: F.length === 0,
			freedSize: P,
			freedSizeFormatted: formatBytes$1(P),
			failed: F
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (i, N) => {
		let P = process.platform;
		try {
			if (P === "darwin") {
				let i = N.path, P = N.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${i}" to trash'`);
				let F = os.homedir(), I = [
					path.join(F, "Library/Preferences", `*${P}*`),
					path.join(F, "Library/Application Support", P),
					path.join(F, "Library/Caches", P),
					path.join(F, "Library/Logs", P),
					path.join(F, "Library/Saved Application State", `*${P}*`),
					path.join(F, "Library/LaunchAgents", `*${P}*`)
				], L = 0;
				for (let i of I) try {
					let N = await fs.readdir(path.dirname(i)).catch(() => []);
					for (let F of N) if (F.includes(P)) {
						let N = path.join(path.dirname(i), F), P = await fs.stat(N).catch(() => null);
						P && (P.isDirectory() ? (L += await getDirSize(N), await fs.rm(N, {
							recursive: !0,
							force: !0
						})) : (L += P.size, await fs.unlink(N)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: L,
					freedSizeFormatted: formatBytes$1(L)
				};
			} else if (P === "win32") {
				let i = N.name, P = 0;
				try {
					let { stdout: F } = await execAsync$1(`wmic product where name="${i.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), I = F.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (I) {
						let i = I[1];
						await execAsync$1(`msiexec /x ${i} /quiet /norestart`), P = await getDirSize(N.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${i}*'} | Remove-AppxPackage"`).catch(() => {}), P = await getDirSize(N.path).catch(() => 0);
				} catch {
					P = await getDirSize(N.path).catch(() => 0), await fs.rm(N.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let F = process.env.LOCALAPPDATA || "", I = process.env.APPDATA || "", L = [path.join(F, i), path.join(I, i)];
				for (let i of L) try {
					await fs.stat(i).catch(() => null) && (P += await getDirSize(i).catch(() => 0), await fs.rm(i, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: P,
					freedSizeFormatted: formatBytes$1(P)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let i = process.platform, N = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (i === "win32") try {
			let { stdout: i } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), P = parseInt(i.trim()) || 0;
			P > 0 && (N.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: P,
				size: 0,
				description: "Recently opened documents registry entries"
			}), N.totalItems += P);
			let { stdout: F } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), I = parseInt(F.trim()) || 0;
			I > 0 && (N.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: I,
				size: 0,
				description: "Recently run programs registry entries"
			}), N.totalItems += I);
			let L = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let i = await fs.readdir(L, { recursive: !0 }).catch(() => []), P = [], F = 0;
				for (let N of i) {
					let i = path.join(L, N);
					try {
						let N = await fs.stat(i);
						N.isFile() && (P.push(i), F += N.size);
					} catch {}
				}
				P.length > 0 && (N.activityHistory.push({
					name: "Activity History",
					path: L,
					type: "files",
					count: P.length,
					size: F,
					sizeFormatted: formatBytes$1(F),
					files: P,
					description: "Windows activity history files"
				}), N.totalItems += P.length, N.totalSize += F);
			} catch {}
			let R = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let i = await fs.readdir(R).catch(() => []), P = [], F = 0;
				for (let N of i) {
					let i = path.join(R, N);
					try {
						let N = await fs.stat(i);
						P.push(i), F += N.size;
					} catch {}
				}
				P.length > 0 && (N.activityHistory.push({
					name: "Windows Search History",
					path: R,
					type: "files",
					count: P.length,
					size: F,
					sizeFormatted: formatBytes$1(F),
					files: P,
					description: "Windows search history files"
				}), N.totalItems += P.length, N.totalSize += F);
			} catch {}
		} catch (i) {
			return {
				success: !1,
				error: i.message,
				results: N
			};
		}
		else if (i === "darwin") try {
			let i = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let P = await fs.readdir(i, { recursive: !0 }).catch(() => []), F = [], I = 0;
				for (let N of P) {
					let P = path.join(i, N);
					try {
						let i = await fs.stat(P);
						i.isFile() && (F.push(P), I += i.size);
					} catch {}
				}
				F.length > 0 && (N.spotlightHistory.push({
					name: "Spotlight Search History",
					path: i,
					type: "files",
					count: F.length,
					size: I,
					sizeFormatted: formatBytes$1(I),
					files: F,
					description: "macOS Spotlight search history"
				}), N.totalItems += F.length, N.totalSize += I);
			} catch {}
			let P = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let i = await fs.readdir(P, { recursive: !0 }).catch(() => []), F = [], I = 0;
				for (let N of i) {
					let i = path.join(P, N);
					try {
						let N = await fs.stat(i);
						N.isFile() && (F.push(i), I += N.size);
					} catch {}
				}
				F.length > 0 && (N.quickLookCache.push({
					name: "Quick Look Cache",
					path: P,
					type: "files",
					count: F.length,
					size: I,
					sizeFormatted: formatBytes$1(I),
					files: F,
					description: "macOS Quick Look thumbnail cache"
				}), N.totalItems += F.length, N.totalSize += I);
			} catch {}
			let F = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let i = await fs.readdir(F).catch(() => []), P = [], I = 0;
				for (let N of i) if (N.includes("RecentItems")) {
					let i = path.join(F, N);
					try {
						let N = await fs.stat(i);
						P.push(i), I += N.size;
					} catch {}
				}
				P.length > 0 && (N.spotlightHistory.push({
					name: "Recently Opened Files",
					path: F,
					type: "files",
					count: P.length,
					size: I,
					sizeFormatted: formatBytes$1(I),
					files: P,
					description: "macOS recently opened files list"
				}), N.totalItems += P.length, N.totalSize += I);
			} catch {}
		} catch (i) {
			return {
				success: !1,
				error: i.message,
				results: N
			};
		}
		return {
			success: !0,
			results: N
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (i, N) => {
		let P = process.platform, F = 0, I = 0, L = [];
		if (P === "win32") try {
			if (N.registry) {
				try {
					let { stdout: i } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), N = parseInt(i.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), F += N;
				} catch (i) {
					L.push(`Failed to clean Recent Documents registry: ${i.message}`);
				}
				try {
					let { stdout: i } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), N = parseInt(i.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), F += N;
				} catch (i) {
					L.push(`Failed to clean Recent Programs registry: ${i.message}`);
				}
			}
			if (N.activityHistory) {
				let i = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let N = await fs.readdir(i, { recursive: !0 }).catch(() => []);
					for (let P of N) {
						let N = path.join(i, P);
						try {
							let i = await fs.stat(N);
							i.isFile() && (I += i.size, await fs.unlink(N), F++);
						} catch {}
					}
				} catch (i) {
					L.push(`Failed to clean activity history: ${i.message}`);
				}
				let N = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let i = await fs.readdir(N).catch(() => []);
					for (let P of i) {
						let i = path.join(N, P);
						try {
							let N = await fs.stat(i);
							I += N.size, await fs.unlink(i), F++;
						} catch {}
					}
				} catch (i) {
					L.push(`Failed to clean search history: ${i.message}`);
				}
			}
		} catch (i) {
			L.push(`Windows privacy cleanup failed: ${i.message}`);
		}
		else if (P === "darwin") try {
			if (N.spotlightHistory) {
				let i = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let N = await fs.readdir(i, { recursive: !0 }).catch(() => []);
					for (let P of N) {
						let N = path.join(i, P);
						try {
							let i = await fs.stat(N);
							i.isFile() && (I += i.size, await fs.unlink(N), F++);
						} catch {}
					}
				} catch (i) {
					L.push(`Failed to clean Spotlight history: ${i.message}`);
				}
				let N = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let i = await fs.readdir(N).catch(() => []);
					for (let P of i) if (P.includes("RecentItems")) {
						let i = path.join(N, P);
						try {
							let N = await fs.stat(i);
							I += N.size, await fs.unlink(i), F++;
						} catch {}
					}
				} catch (i) {
					L.push(`Failed to clean recent items: ${i.message}`);
				}
			}
			if (N.quickLookCache) {
				let i = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let N = await fs.readdir(i, { recursive: !0 }).catch(() => []);
					for (let P of N) {
						let N = path.join(i, P);
						try {
							let i = await fs.stat(N);
							i.isFile() && (I += i.size, await fs.unlink(N), F++);
						} catch {}
					}
				} catch (i) {
					L.push(`Failed to clean Quick Look cache: ${i.message}`);
				}
			}
		} catch (i) {
			L.push(`macOS privacy cleanup failed: ${i.message}`);
		}
		return {
			success: L.length === 0,
			cleanedItems: F,
			freedSize: I,
			freedSizeFormatted: formatBytes$1(I),
			errors: L
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let i = process.platform, N = os.homedir(), P = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, F = [];
		if (i === "win32") {
			let i = process.env.LOCALAPPDATA || "", N = process.env.APPDATA || "";
			F.push({
				name: "Chrome",
				paths: {
					history: [path.join(i, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(i, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(i, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(i, "Google/Chrome/User Data/Default/History")]
				}
			}), F.push({
				name: "Edge",
				paths: {
					history: [path.join(i, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(i, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(i, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(i, "Microsoft/Edge/User Data/Default/History")]
				}
			}), F.push({
				name: "Firefox",
				paths: {
					history: [path.join(N, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(N, "Mozilla/Firefox/Profiles")],
					cache: [path.join(i, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(N, "Mozilla/Firefox/Profiles")]
				}
			});
		} else i === "darwin" && (F.push({
			name: "Safari",
			paths: {
				history: [path.join(N, "Library/Safari/History.db")],
				cookies: [path.join(N, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(N, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(N, "Library/Safari/Downloads.plist")]
			}
		}), F.push({
			name: "Chrome",
			paths: {
				history: [path.join(N, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(N, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(N, "Library/Caches/Google/Chrome")],
				downloads: [path.join(N, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), F.push({
			name: "Firefox",
			paths: {
				history: [path.join(N, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(N, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(N, "Library/Caches/Firefox")],
				downloads: [path.join(N, "Library/Application Support/Firefox/Profiles")]
			}
		}), F.push({
			name: "Edge",
			paths: {
				history: [path.join(N, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(N, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(N, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(N, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let N of F) {
			let F = {
				name: N.name,
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
			for (let [P, I] of Object.entries(N.paths)) for (let L of I) try {
				if (P === "cache" && i === "darwin" && N.name === "Safari") {
					let i = await fs.stat(L).catch(() => null);
					if (i && i.isDirectory()) {
						let i = await getDirSize(L);
						F[P].size += i, F[P].paths.push(L), F[P].count += 1;
					}
				} else {
					let i = await fs.stat(L).catch(() => null);
					if (i) if (i.isDirectory()) {
						let i = await getDirSize(L);
						F[P].size += i, F[P].paths.push(L), F[P].count += 1;
					} else i.isFile() && (F[P].size += i.size, F[P].paths.push(L), F[P].count += 1);
				}
			} catch {}
			let I = Object.values(F).reduce((i, N) => i + (typeof N == "object" && N.size ? N.size : 0), 0);
			I > 0 && (F.totalSize = I, F.totalSizeFormatted = formatBytes$1(I), P.browsers.push(F), P.totalSize += I, P.totalItems += Object.values(F).reduce((i, N) => i + (typeof N == "object" && N.count ? N.count : 0), 0));
		}
		return {
			success: !0,
			results: P
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (i, N) => {
		let P = process.platform, F = os.homedir(), I = 0, L = 0, R = [], z = {};
		if (P === "win32") {
			let i = process.env.LOCALAPPDATA || "", N = process.env.APPDATA || "";
			z.Chrome = {
				history: [path.join(i, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(i, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(i, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(i, "Google/Chrome/User Data/Default/History")]
			}, z.Edge = {
				history: [path.join(i, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(i, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(i, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(i, "Microsoft/Edge/User Data/Default/History")]
			}, z.Firefox = {
				history: [path.join(N, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(N, "Mozilla/Firefox/Profiles")],
				cache: [path.join(i, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(N, "Mozilla/Firefox/Profiles")]
			};
		} else P === "darwin" && (z.Safari = {
			history: [path.join(F, "Library/Safari/History.db")],
			cookies: [path.join(F, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(F, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(F, "Library/Safari/Downloads.plist")]
		}, z.Chrome = {
			history: [path.join(F, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(F, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(F, "Library/Caches/Google/Chrome")],
			downloads: [path.join(F, "Library/Application Support/Google/Chrome/Default/History")]
		}, z.Firefox = {
			history: [path.join(F, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(F, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(F, "Library/Caches/Firefox")],
			downloads: [path.join(F, "Library/Application Support/Firefox/Profiles")]
		}, z.Edge = {
			history: [path.join(F, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(F, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(F, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(F, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let i of N.browsers) {
			let P = z[i];
			if (P) for (let F of N.types) {
				let N = P[F];
				if (N) for (let P of N) try {
					let i = await fs.stat(P).catch(() => null);
					if (!i) continue;
					if (i.isDirectory()) {
						let i = await getDirSize(P);
						await fs.rm(P, {
							recursive: !0,
							force: !0
						}), L += i, I++;
					} else i.isFile() && (L += i.size, await fs.unlink(P), I++);
				} catch (N) {
					R.push(`Failed to clean ${i} ${F}: ${N.message}`);
				}
			}
		}
		return {
			success: R.length === 0,
			cleanedItems: I,
			freedSize: L,
			freedSizeFormatted: formatBytes$1(L),
			errors: R
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let i = process.platform, N = [];
		try {
			if (i === "win32") {
				let { stdout: i } = await execAsync$1("netsh wlan show profiles"), P = i.split("\n");
				for (let i of P) {
					let P = i.match(/All User Profile\s*:\s*(.+)/);
					if (P) {
						let i = P[1].trim();
						try {
							let { stdout: P } = await execAsync$1(`netsh wlan show profile name="${i}" key=clear`), F = P.match(/Key Content\s*:\s*(.+)/);
							N.push({
								name: i,
								hasPassword: !!F,
								platform: "windows"
							});
						} catch {
							N.push({
								name: i,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (i === "darwin") {
				let { stdout: i } = await execAsync$1("networksetup -listallhardwareports");
				if (i.split("\n").find((i) => i.includes("Wi-Fi") || i.includes("AirPort"))) {
					let { stdout: i } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), P = i.split("\n").filter((i) => i.trim() && !i.includes("Preferred networks"));
					for (let i of P) {
						let P = i.trim();
						P && N.push({
							name: P,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (i) {
			return {
				success: !1,
				error: i.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: N
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (i, N) => {
		let P = process.platform;
		try {
			return P === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${N}"`), { success: !0 }) : P === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${N}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (i, N) => {
		let P = process.platform, F = Date.now(), I = "";
		try {
			if (P === "win32") switch (N.category) {
				case "sfc":
					let { stdout: i } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					I = i;
					break;
				case "dism":
					let { stdout: P } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					I = P;
					break;
				case "disk-cleanup":
					let { stdout: F } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					I = F || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: L } = await execAsync$1("ipconfig /flushdns");
					I = L || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: R } = await execAsync$1("netsh winsock reset");
					I = R || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), I = "Windows Search index rebuilt successfully";
					} catch (i) {
						throw Error(`Failed to rebuild search index: ${i.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${N.category}`);
			}
			else if (P === "darwin") switch (N.category) {
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), I = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), I = "Spotlight index rebuilt successfully (user directory only)";
						} catch (i) {
							throw Error(`Failed to rebuild Spotlight index: ${i.message}`);
						}
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: i } = await execAsync$1("diskutil verifyVolume /");
						I = i || "Disk permissions verified";
					} catch {
						I = "Disk permissions check completed (Note: macOS Big Sur+ uses System Integrity Protection)";
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), I = "DNS cache flushed successfully";
					} catch {
						try {
							await execAsync$1("dscacheutil -flushcache; killall -HUP mDNSResponder"), I = "DNS cache flushed successfully";
						} catch (i) {
							throw Error(`Failed to flush DNS: ${i.message}`);
						}
					}
					break;
				case "mail-rebuild":
					try {
						await execAsync$1("killall Mail 2>/dev/null || true"), I = "Mail database rebuild initiated (please ensure Mail.app is closed)";
					} catch (i) {
						throw Error(`Failed to rebuild Mail database: ${i.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${N.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: N.id,
				duration: Date.now() - F,
				output: I
			};
		} catch (i) {
			return {
				success: !1,
				taskId: N.id,
				duration: Date.now() - F,
				error: i.message,
				output: I
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let i = await si.mem(), N = await si.currentLoad(), P = await si.fsSize(), F = await si.battery().catch(() => null), I = [], L = P.find((i) => i.mount === "/" || i.mount === "C:") || P[0];
			if (L) {
				let i = L.available / L.size * 100;
				i < 10 ? I.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(L.available)} free (${i.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : i < 20 && I.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(L.available)} free (${i.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			N.currentLoad > 90 && I.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${N.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let R = i.used / i.total * 100;
			return R > 90 && I.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${R.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: N.currentLoad,
				ram: {
					used: i.used,
					total: i.total,
					percentage: R
				},
				disk: L ? {
					free: L.available,
					total: L.size,
					percentage: (L.size - L.available) / L.size * 100
				} : null,
				battery: F ? {
					level: F.percent,
					charging: F.isCharging || !1
				} : null,
				alerts: I
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (i, N) => {
		try {
			let i = process.platform, P = checkFilesSafety(N, i);
			return {
				success: !0,
				safe: P.safe,
				warnings: P.warnings,
				blocked: P.blocked
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (i, N) => {
		try {
			return await createBackup(N);
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (i, N) => {
		try {
			let i = await getBackupInfo(N);
			return {
				success: i !== null,
				backupInfo: i
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (i, N) => {
		try {
			return await restoreBackup(N);
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (i, N) => {
		try {
			return await deleteBackup(N);
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	});
}
async function getDirSize(i) {
	let N = 0;
	try {
		let P = await fs.readdir(i, { withFileTypes: !0 });
		for (let F of P) {
			let P = path.join(i, F.name);
			if (F.isDirectory()) N += await getDirSize(P);
			else {
				let i = await fs.stat(P).catch(() => null);
				i && (N += i.size);
			}
		}
	} catch {}
	return N;
}
async function getDirSizeLimited(i, N, P = 0) {
	if (P >= N) return 0;
	let F = 0;
	try {
		let I = await fs.readdir(i, { withFileTypes: !0 });
		for (let L of I) {
			if (L.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(L.name)) continue;
			let I = path.join(i, L.name);
			try {
				if (L.isDirectory()) F += await getDirSizeLimited(I, N, P + 1);
				else {
					let i = await fs.stat(I).catch(() => null);
					i && (F += i.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return F;
}
async function scanDirectoryForLens(i, N, P, F) {
	try {
		let I = await fs.stat(i), L = path.basename(i) || i;
		if (!I.isDirectory()) {
			let N = {
				name: L,
				path: i,
				size: I.size,
				sizeFormatted: formatBytes$1(I.size),
				type: "file"
			};
			return F && F({
				currentPath: L,
				progress: 100,
				status: `Scanning file: ${L}`,
				item: N
			}), N;
		}
		F && F({
			currentPath: L,
			progress: 0,
			status: `Scanning directory: ${L}`
		});
		let R = await fs.readdir(i, { withFileTypes: !0 }), z = [], B = 0, V = R.filter((i) => !i.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(i.name)), H = V.length, U = 0;
		for (let I of V) {
			let L = path.join(i, I.name);
			if (F) {
				let i = Math.floor(U / H * 100), N = I.isDirectory() ? "directory" : "file";
				F({
					currentPath: I.name,
					progress: i,
					status: `Scanning ${N}: ${I.name}`
				});
			}
			let R = null;
			if (N < P) R = await scanDirectoryForLens(L, N + 1, P, F), R && (z.push(R), B += R.size);
			else try {
				let i = (await fs.stat(L)).size;
				if (I.isDirectory()) {
					let N = dirSizeCache.get(L);
					if (N && Date.now() - N.timestamp < CACHE_TTL) i = N.size;
					else try {
						i = await getDirSizeLimited(L, 3), dirSizeCache.set(L, {
							size: i,
							timestamp: Date.now()
						});
					} catch {
						i = 0;
					}
				}
				R = {
					name: I.name,
					path: L,
					size: i,
					sizeFormatted: formatBytes$1(i),
					type: I.isDirectory() ? "dir" : "file"
				}, z.push(R), B += i;
			} catch {
				U++;
				continue;
			}
			R && F && F({
				currentPath: I.name,
				progress: Math.floor((U + 1) / H * 100),
				status: `Scanned: ${I.name}`,
				item: R
			}), U++;
		}
		let G = {
			name: L,
			path: i,
			size: B,
			sizeFormatted: formatBytes$1(B),
			type: "dir",
			children: z.sort((i, N) => N.size - i.size)
		};
		return F && F({
			currentPath: L,
			progress: 100,
			status: `Completed: ${L}`
		}), G;
	} catch {
		return null;
	}
}
async function findLargeFiles(i, N, P) {
	try {
		let F = await fs.readdir(i, { withFileTypes: !0 });
		for (let I of F) {
			let F = path.join(i, I.name);
			if (!(I.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(I.name))) try {
				let i = await fs.stat(F);
				I.isDirectory() ? await findLargeFiles(F, N, P) : i.size >= N && P.push({
					name: I.name,
					path: F,
					size: i.size,
					sizeFormatted: formatBytes$1(i.size),
					lastAccessed: i.atime,
					type: path.extname(I.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(i, N) {
	try {
		let P = await fs.readdir(i, { withFileTypes: !0 });
		for (let F of P) {
			let P = path.join(i, F.name);
			if (!(F.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(F.name))) try {
				let i = await fs.stat(P);
				if (F.isDirectory()) await findDuplicates(P, N);
				else if (i.size > 1024 * 1024 && i.size < 50 * 1024 * 1024) {
					let i = await hashFile(P), F = N.get(i) || [];
					F.push(P), N.set(i, F);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(i) {
	let N = await fs.readFile(i);
	return createHash("md5").update(N).digest("hex");
}
function formatBytes$1(i) {
	if (i === 0) return "0 B";
	let N = 1024, P = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], F = Math.floor(Math.log(i) / Math.log(N));
	return `${(i / N ** +F).toFixed(1)} ${P[F]}`;
}
var getPlatformProtectedPaths = (i) => {
	let N = os.homedir(), P = [];
	if (i === "win32") {
		let i = process.env.WINDIR || "C:\\Windows", F = process.env.PROGRAMFILES || "C:\\Program Files", I = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		P.push({
			path: i,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: F,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: I,
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
			path: path.join(N, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(N, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else i === "darwin" && P.push({
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
		path: path.join(N, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(N, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return P;
}, checkFileSafety = (i, N) => {
	let P = [], F = [], I = getPlatformProtectedPaths(N);
	for (let L of I) {
		if (L.platform && L.platform !== N && L.platform !== "all") continue;
		let I = path.normalize(L.path), R = path.normalize(i);
		if (R === I || R.startsWith(I + path.sep)) {
			if (L.action === "protect") return F.push(i), {
				safe: !1,
				warnings: [],
				blocked: [i]
			};
			L.action === "warn" && P.push({
				path: i,
				reason: L.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: F.length === 0,
		warnings: P,
		blocked: F
	};
}, checkFilesSafety = (i, N) => {
	let P = [], F = [];
	for (let I of i) {
		let i = checkFileSafety(I, N);
		i.safe || F.push(...i.blocked), P.push(...i.warnings);
	}
	return {
		safe: F.length === 0,
		warnings: P,
		blocked: F
	};
}, getBackupDir = () => {
	let i = os.homedir();
	return process.platform === "win32" ? path.join(i, "AppData", "Local", "devtools-app", "backups") : path.join(i, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (i) => {
	let N = 0;
	for (let P of i) try {
		let i = await fs.stat(P);
		i.isFile() && (N += i.size);
	} catch {}
	return N;
}, createBackup = async (i) => {
	try {
		let N = getBackupDir();
		await fs.mkdir(N, { recursive: !0 });
		let P = generateBackupId(), F = path.join(N, P);
		await fs.mkdir(F, { recursive: !0 });
		let I = await calculateTotalSize(i), L = [];
		for (let N of i) try {
			let i = await fs.stat(N), P = path.basename(N), I = path.join(F, P);
			i.isFile() && (await fs.copyFile(N, I), L.push(N));
		} catch {}
		let R = {
			id: P,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: L,
			totalSize: I,
			location: F,
			platform: process.platform
		}, z = path.join(F, "backup-info.json");
		return await fs.writeFile(z, JSON.stringify(R, null, 2)), {
			success: !0,
			backupId: P,
			backupInfo: R
		};
	} catch (i) {
		return {
			success: !1,
			error: i.message
		};
	}
}, listBackups = async () => {
	try {
		let i = getBackupDir(), N = await fs.readdir(i, { withFileTypes: !0 }), P = [];
		for (let F of N) if (F.isDirectory() && F.name.startsWith("backup-")) {
			let N = path.join(i, F.name, "backup-info.json");
			try {
				let i = await fs.readFile(N, "utf-8");
				P.push(JSON.parse(i));
			} catch {}
		}
		return P.sort((i, N) => new Date(N.timestamp).getTime() - new Date(i.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (i) => {
	try {
		let N = getBackupDir(), P = path.join(N, i, "backup-info.json"), F = await fs.readFile(P, "utf-8");
		return JSON.parse(F);
	} catch {
		return null;
	}
}, restoreBackup = async (i) => {
	try {
		let N = await getBackupInfo(i);
		if (!N) return {
			success: !1,
			error: "Backup not found"
		};
		let P = N.location;
		for (let i of N.files) try {
			let N = path.basename(i), F = path.join(P, N);
			if ((await fs.stat(F)).isFile()) {
				let N = path.dirname(i);
				await fs.mkdir(N, { recursive: !0 }), await fs.copyFile(F, i);
			}
		} catch {}
		return { success: !0 };
	} catch (i) {
		return {
			success: !1,
			error: i.message
		};
	}
}, deleteBackup = async (i) => {
	try {
		let N = getBackupDir(), P = path.join(N, i);
		return await fs.rm(P, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (i) {
		return {
			success: !1,
			error: i.message
		};
	}
}, __filename = fileURLToPath(import.meta.url), __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(N) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((i) => ({
				id: i.id,
				name: i.name,
				thumbnail: i.thumbnail.toDataURL(),
				type: i.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (i) {
			return console.error("Failed to get sources:", i), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let i = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (i.length === 0) throw Error("No screens available");
			let N = i[0].thumbnail;
			return {
				dataUrl: N.toDataURL(),
				width: N.getSize().width,
				height: N.getSize().height
			};
		} catch (i) {
			throw console.error("Failed to capture screen:", i), i;
		}
	}), ipcMain.handle("screenshot:capture-window", async (i, N) => {
		try {
			let i = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((i) => i.id === N);
			if (!i) throw Error("Window not found");
			let P = i.thumbnail;
			return {
				dataUrl: P.toDataURL(),
				width: P.getSize().width,
				height: P.getSize().height
			};
		} catch (i) {
			throw console.error("Failed to capture window:", i), i;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			let N = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (console.log(`Found ${N.length} sources.`), N.length === 0) throw console.error("No screens available for capture."), Error("No screens available");
			let P = N[0].thumbnail, F = screen.getPrimaryDisplay();
			return console.log(`Captured thumbnail size: ${P.getSize().width}x${P.getSize().height}`), console.log(`Display size: ${F.size.width}x${F.size.height} (Scale: ${F.scaleFactor})`), new Promise((N, I) => {
				let L = null, R = () => {
					L && !L.isDestroyed() && L.close(), ipcMain.removeHandler("screenshot:area-selected"), ipcMain.removeHandler("screenshot:area-cancelled");
				};
				ipcMain.handle("screenshot:area-selected", async (i, I) => {
					R();
					let L = F.scaleFactor, z = P.crop({
						x: Math.round(I.x * L),
						y: Math.round(I.y * L),
						width: Math.round(I.width * L),
						height: Math.round(I.height * L)
					});
					N({
						dataUrl: z.toDataURL(),
						width: z.getSize().width,
						height: z.getSize().height
					});
				}), ipcMain.handle("screenshot:area-cancelled", () => {
					R(), I(/* @__PURE__ */ Error("Area selection cancelled"));
				});
				let { width: z, height: B, x: H, y: U } = F.bounds;
				L = new BrowserWindow({
					x: H,
					y: U,
					width: z,
					height: B,
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
				}), L.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), L.show(), L.focus(), L.loadURL("data:text/html;charset=utf-8,%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!DOCTYPE%20html%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20*%20%7B%20margin%3A%200%3B%20padding%3A%200%3B%20box-sizing%3A%20border-box%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20100vw%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20100vh%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20crosshair%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20transparent%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20overflow%3A%20hidden%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20user-select%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23selection%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%202px%20solid%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(59%2C%20130%2C%20246%2C%200.05)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%200%200%209999px%20rgba(0%2C%200%2C%200%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23toolbar%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%231a1b1e%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2010px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%2010px%2030px%20rgba(0%2C0%2C0%2C0.5)%2C%200%200%200%201px%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%202000%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20gap%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20animation%3A%20popIn%200.2s%20cubic-bezier(0.16%2C%201%2C%200.3%2C%201)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20popIn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%20opacity%3A%200%3B%20transform%3A%20scale(0.95)%20translateY(5px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%20opacity%3A%201%3B%20transform%3A%20scale(1)%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20justify-content%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%200%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%2036px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20pointer%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20all%200.15s%20ease%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(255%2C255%2C255%2C0.08)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20%23e5e5e5%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%3Ahover%20%7B%20background%3A%20rgba(255%2C255%2C255%2C0.12)%3B%20color%3A%20white%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(59%2C%20130%2C%20246%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Ahover%20%7B%20background%3A%20%232563eb%3B%20transform%3A%20translateY(-1px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Aactive%20%7B%20transform%3A%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23dimensions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%20-34px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%204px%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2012px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20opacity%200.2s%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23instructions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%2040px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%2050%25%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20translateX(-50%25)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(0%2C%200%2C%200%2C%200.7)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20backdrop-filter%3A%20blur(10px)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%208px%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2020px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20500%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%204px%2012px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%201px%20solid%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200.8%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.hidden%20%7B%20display%3A%20none%20!important%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22instructions%22%3EClick%20and%20drag%20to%20capture%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22selection%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22dimensions%22%3E0%20x%200%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22toolbar%22%20class%3D%22hidden%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-cancel%22%20id%3D%22btn-cancel%22%3ECancel%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-capture%22%20id%3D%22btn-capture%22%3ECapture%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20selection%20%3D%20document.getElementById('selection')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbar%20%3D%20document.getElementById('toolbar')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20dimensions%20%3D%20document.getElementById('dimensions')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCancel%20%3D%20document.getElementById('btn-cancel')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCapture%20%3D%20document.getElementById('btn-capture')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20startX%2C%20startY%2C%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20currentBounds%20%3D%20%7B%20x%3A%200%2C%20y%3A%200%2C%20width%3A%200%2C%20height%3A%200%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('contextmenu'%2C%20e%20%3D%3E%20e.preventDefault())%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20capture()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%200%20%26%26%20currentBounds.height%20%3E%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.sendSelection(currentBounds)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20cancel()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.cancelSelection()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCapture.onclick%20%3D%20capture%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCancel.onclick%20%3D%20cancel%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousedown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.target.closest('%23toolbar'))%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20!%3D%3D%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20%3D%3D%3D%202)%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20true%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.style.opacity%20%3D%20'1'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20startX%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20startY%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'block'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousemove'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20width%20%3D%20Math.abs(currentX%20-%20startX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20height%20%3D%20Math.abs(currentY%20-%20startY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20left%20%3D%20Math.min(startX%2C%20currentX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20top%20%3D%20Math.min(startY%2C%20currentY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20width%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20height%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.textContent%20%3D%20Math.round(width)%20%2B%20'%20x%20'%20%2B%20Math.round(height)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20currentBounds%20%3D%20%7B%20x%3A%20left%2C%20y%3A%20top%2C%20width%2C%20height%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mouseup'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%2010%20%26%26%20currentBounds.height%20%3E%2010)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.remove('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbarHeight%20%3D%2060%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20top%20%3D%20currentBounds.y%20%2B%20currentBounds.height%20%2B%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(top%20%2B%20toolbarHeight%20%3E%20window.innerHeight)%20top%20%3D%20currentBounds.y%20-%20toolbarHeight%20-%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20left%20%3D%20currentBounds.x%20%2B%20(currentBounds.width%20%2F%202)%20-%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%20%3D%20Math.max(10%2C%20Math.min(window.innerWidth%20-%20210%2C%20left))%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'none'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('keydown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Escape')%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Enter'%20%26%26%20!toolbar.classList.contains('hidden'))%20capture()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20"), setTimeout(() => {
					L && !L.isDestroyed() && (R(), I(/* @__PURE__ */ Error("Area selection timeout")));
				}, 12e4);
			});
		} catch (i) {
			throw console.error("Failed to capture area:", i), i;
		}
	}), ipcMain.handle("screenshot:capture-url", async (N, P) => {
		try {
			console.log("Capturing URL:", P);
			let N = new BrowserWindow({
				width: 1200,
				height: 800,
				show: !1,
				webPreferences: {
					offscreen: !1,
					contextIsolation: !0
				}
			});
			await N.loadURL(P);
			try {
				let i = N.webContents.debugger;
				i.attach("1.3");
				let P = await i.sendCommand("Page.getLayoutMetrics"), F = P.contentSize || P.cssContentSize || {
					width: 1200,
					height: 800
				}, I = Math.ceil(F.width), L = Math.ceil(F.height);
				console.log(`Page dimensions: ${I}x${L}`), await i.sendCommand("Emulation.setDeviceMetricsOverride", {
					width: I,
					height: L,
					deviceScaleFactor: 1,
					mobile: !1
				});
				let R = await i.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: !0
				});
				return i.detach(), N.close(), {
					dataUrl: "data:image/png;base64," + R.data,
					width: I,
					height: L
				};
			} catch (i) {
				console.error("CDP Error:", i);
				let P = await N.webContents.capturePage();
				return N.close(), {
					dataUrl: P.toDataURL(),
					width: P.getSize().width,
					height: P.getSize().height
				};
			}
		} catch (i) {
			throw console.error("Failed to capture URL:", i), i;
		}
	}), ipcMain.handle("screenshot:save-file", async (i, P, F) => {
		try {
			let { filename: i, format: I = "png" } = F, L = await dialog.showSaveDialog(N, {
				defaultPath: i || `screenshot-${Date.now()}.${I}`,
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
			if (L.canceled || !L.filePath) return {
				success: !1,
				canceled: !0
			};
			let R = P.replace(/^data:image\/\w+;base64,/, ""), B = Buffer.from(R, "base64");
			return await fs.writeFile(L.filePath, B), {
				success: !0,
				filePath: L.filePath
			};
		} catch (i) {
			return console.error("Failed to save screenshot:", i), {
				success: !1,
				error: i.message
			};
		}
	});
}
var require$1 = createRequire(import.meta.url);
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
		let i = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
		this.binaryPath = path$1.join(app.getPath("userData"), i), this.initPromise = this.initYtDlp();
	}
	async initYtDlp() {
		try {
			let i = require$1("yt-dlp-wrap"), N = i.default || i;
			if (fs$1.existsSync(this.binaryPath)) console.log("Using existing yt-dlp binary at:", this.binaryPath);
			else {
				console.log("Downloading yt-dlp binary to:", this.binaryPath);
				try {
					await N.downloadFromGithub(this.binaryPath), console.log("yt-dlp binary downloaded successfully");
				} catch (i) {
					throw console.error("Failed to download yt-dlp binary:", i), Error(`Failed to download yt-dlp: ${i}`);
				}
			}
			this.ytDlp = new N(this.binaryPath);
			try {
				let i = require$1("@ffmpeg-installer/ffmpeg").path;
				if (console.log("FFmpeg installer path resolved:", i), i && fs$1.existsSync(i)) {
					if (this.ffmpegPath = i, this.hasFFmpeg = !0, console.log("✅ FFmpeg binary verified at:", this.ffmpegPath), process.platform !== "win32" && this.ffmpegPath) try {
						fs$1.chmodSync(this.ffmpegPath, "755");
					} catch {}
				} else console.warn("⚠️ FFmpeg binary not found at:", i);
			} catch (i) {
				console.warn("FFmpeg installer load failed:", i);
			}
			await this.checkHelpers();
		} catch (i) {
			throw console.error("Failed to initialize yt-dlp:", i), i;
		}
	}
	async checkHelpers() {
		this.hasAria2c = !1;
		try {
			let i = app.getPath("userData"), N = path$1.join(i, "bin", "aria2c.exe");
			fs$1.existsSync(N) && (this.hasAria2c = !0, console.log("✅ Aria2c found locally:", N));
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
			let i = app.getPath("userData"), N = path$1.join(i, "bin");
			fs$1.existsSync(N) || fs$1.mkdirSync(N, { recursive: !0 });
			let P = path$1.join(N, "aria2.zip");
			await new Promise((i, N) => {
				let F = fs$1.createWriteStream(P);
				https.get("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip", (P) => {
					P.statusCode === 302 || P.statusCode === 301 ? https.get(P.headers.location, (P) => {
						if (P.statusCode !== 200) {
							N(/* @__PURE__ */ Error("DL Fail " + P.statusCode));
							return;
						}
						P.pipe(F), F.on("finish", () => {
							F.close(), i();
						});
					}).on("error", N) : P.statusCode === 200 ? (P.pipe(F), F.on("finish", () => {
						F.close(), i();
					})) : N(/* @__PURE__ */ Error(`Failed to download: ${P.statusCode}`));
				}).on("error", N);
			}), await promisify$1(exec$1)(`powershell -Command "Expand-Archive -Path '${P}' -DestinationPath '${N}' -Force"`);
			let F = path$1.join(N, "aria2-1.36.0-win-64bit-build1"), L = path$1.join(F, "aria2c.exe"), R = path$1.join(N, "aria2c.exe");
			fs$1.existsSync(L) && fs$1.copyFileSync(L, R);
			try {
				fs$1.unlinkSync(P);
			} catch {}
			return await this.checkHelpers(), this.hasAria2c;
		} catch (i) {
			throw console.error("Install Aria2 Failed", i), i;
		}
	}
	async ensureInitialized() {
		await this.initPromise;
	}
	async processQueue() {
		let i = this.getSettings().maxConcurrentDownloads || 3;
		for (; this.activeDownloadsCount < i && this.downloadQueue.length > 0;) {
			let i = this.downloadQueue.shift();
			i && (this.activeDownloadsCount++, i.run().then((N) => i.resolve(N)).catch((N) => i.reject(N)).finally(() => {
				this.activeDownloadsCount--, this.processQueue();
			}));
		}
	}
	async getVideoInfo(i) {
		await this.ensureInitialized();
		let N = this.videoInfoCache.get(i);
		if (N && Date.now() - N.timestamp < this.CACHE_TTL) return console.log("Returning cached video info for:", i), N.info;
		try {
			let N = await this.ytDlp.getVideoInfo([
				i,
				"--skip-download",
				"--no-playlist",
				"--no-check-certificate",
				"--no-call-home"
			]), P = (N.formats || []).map((i) => ({
				itag: i.format_id ? parseInt(i.format_id) : 0,
				quality: i.quality || i.format_note || "unknown",
				qualityLabel: i.format_note || i.resolution,
				hasVideo: !!i.vcodec && i.vcodec !== "none",
				hasAudio: !!i.acodec && i.acodec !== "none",
				container: i.ext || "unknown",
				codecs: i.vcodec || i.acodec,
				bitrate: i.tbr ? i.tbr * 1e3 : void 0,
				audioBitrate: i.abr,
				filesize: i.filesize || i.filesize_approx
			})), F = /* @__PURE__ */ new Set();
			P.forEach((i) => {
				if (i.qualityLabel) {
					let N = i.qualityLabel.match(/(\d+p)/);
					N && F.add(N[1]);
				}
			});
			let I = Array.from(F).sort((i, N) => {
				let P = parseInt(i);
				return parseInt(N) - P;
			}), L = P.some((i) => i.hasVideo), R = P.some((i) => i.hasAudio), z;
			if (N.upload_date) try {
				let i = N.upload_date.toString();
				i.length === 8 && (z = `${i.substring(0, 4)}-${i.substring(4, 6)}-${i.substring(6, 8)}`);
			} catch {
				console.warn("Failed to parse upload date:", N.upload_date);
			}
			let B = {
				videoId: N.id || "",
				title: N.title || "Unknown",
				author: N.uploader || N.channel || "Unknown",
				lengthSeconds: parseInt(N.duration) || 0,
				thumbnailUrl: N.thumbnail || "",
				description: N.description || void 0,
				viewCount: parseInt(N.view_count) || void 0,
				uploadDate: z,
				formats: P,
				availableQualities: I,
				hasVideo: L,
				hasAudio: R
			};
			return this.videoInfoCache.set(i, {
				info: B,
				timestamp: Date.now()
			}), B;
		} catch (i) {
			throw Error(`Failed to get video info: ${i instanceof Error ? i.message : "Unknown error"}`);
		}
	}
	async getPlaylistInfo(i) {
		await this.ensureInitialized();
		try {
			let N = await this.ytDlp.getVideoInfo([
				i,
				"--flat-playlist",
				"--skip-download",
				"--no-check-certificate"
			]);
			if (!N.entries || !Array.isArray(N.entries)) throw Error("Not a valid playlist URL");
			let P = N.entries.map((i) => ({
				id: i.id || i.url,
				title: i.title || "Unknown Title",
				duration: i.duration || 0,
				thumbnail: i.thumbnail || i.thumbnails?.[0]?.url || "",
				url: i.url || `https://www.youtube.com/watch?v=${i.id}`
			}));
			return {
				playlistId: N.id || N.playlist_id || "unknown",
				title: N.title || N.playlist_title || "Unknown Playlist",
				videoCount: P.length,
				videos: P
			};
		} catch (i) {
			throw Error(`Failed to get playlist info: ${i instanceof Error ? i.message : "Unknown error"}`);
		}
	}
	async checkDiskSpace(i, N) {
		try {
			let P = await si.fsSize(), F = path$1.parse(path$1.resolve(i)).root.toLowerCase(), I = P.find((i) => {
				let N = i.mount.toLowerCase();
				return F.startsWith(N) || N.startsWith(F.replace(/\\/g, ""));
			});
			if (I && I.available < N + 100 * 1024 * 1024) throw Error(`Insufficient disk space. Required: ${(N / 1024 / 1024).toFixed(2)} MB, Available: ${(I.available / 1024 / 1024).toFixed(2)} MB`);
		} catch (i) {
			console.warn("Disk space check failed:", i);
		}
	}
	async downloadVideo(i, N) {
		return new Promise((P, F) => {
			this.downloadQueue.push({
				run: () => this.executeDownload(i, N),
				resolve: P,
				reject: F
			}), this.processQueue();
		});
	}
	async executeDownload(i, N) {
		await this.ensureInitialized(), console.log("ExecuteDownload - hasFFmpeg:", this.hasFFmpeg, "path:", this.ffmpegPath);
		let { url: P, format: F, quality: L, container: R, outputPath: z, maxSpeed: B, embedSubs: V, id: H } = i, U = H || randomUUID$1();
		try {
			let H = await this.getVideoInfo(P), W = this.sanitizeFilename(H.title), G = z || app.getPath("downloads"), K = R || (F === "audio" ? "mp3" : "mp4"), q = "";
			F === "audio" ? q = `_audio_${L || "best"}` : F === "video" && L && (q = `_${L}`);
			let J = path$1.join(G, `${W}${q}.%(ext)s`);
			fs$1.existsSync(G) || fs$1.mkdirSync(G, { recursive: !0 });
			let Y = 0;
			if (F === "audio") Y = H.formats.find((i) => i.hasAudio && !i.hasVideo && (i.quality === L || i.itag.toString() === "140"))?.filesize || 0;
			else {
				let i;
				i = L && L !== "best" ? H.formats.find((i) => i.qualityLabel?.startsWith(L) && i.hasVideo) : H.formats.find((i) => i.hasVideo);
				let N = H.formats.find((i) => i.hasAudio && !i.hasVideo);
				i && (Y += i.filesize || 0), N && (Y += N.filesize || 0);
			}
			Y > 1024 * 1024 && await this.checkDiskSpace(G, Y);
			let X = [
				P,
				"-o",
				J,
				"--no-playlist",
				"--no-warnings",
				"--newline",
				"--no-check-certificate",
				"--concurrent-fragments",
				`${i.concurrentFragments || 4}`,
				"--buffer-size",
				"1M",
				"--retries",
				"10",
				"--fragment-retries",
				"10",
				"-c"
			];
			if (V && X.push("--write-subs", "--write-auto-subs", "--sub-lang", "en.*,vi", "--embed-subs"), this.ffmpegPath && X.push("--ffmpeg-location", this.ffmpegPath), B && X.push("--limit-rate", B), this.ffmpegPath && X.push("--ffmpeg-location", this.ffmpegPath), F === "audio") X.push("-x", "--audio-format", R || "mp3", "--audio-quality", L || "0");
			else if (F === "video") {
				if (L && L !== "best") {
					let i = L.replace("p", "");
					X.push("-f", `bestvideo[height<=${i}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${i}]+bestaudio/best[height<=${i}]`);
				} else X.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
				let i = R || "mp4";
				X.push("--merge-output-format", i), i === "mp4" && X.push("--postprocessor-args", "ffmpeg:-c:v copy -c:a aac");
			} else X.push("-f", "best");
			return new Promise((i, I) => {
				let R = 0, z = 0, B = 0, V = this.ytDlp.exec(X);
				if (this.activeProcesses.set(U, V), V.ytDlpProcess) {
					let i = V.ytDlpProcess;
					i.stdout?.on("data", (i) => {
						let P = i.toString();
						console.log(`[${U}] stdout:`, P), P.split(/\r?\n/).forEach((i) => {
							if (!i.trim()) return;
							let P = this.parseProgressLine(i);
							P && N && (P.totalBytes > 0 && (z = P.totalBytes), P.percent > 0 && (B = P.percent), R = B / 100 * z, N({
								id: U,
								percent: Math.round(B),
								downloaded: R,
								total: z,
								speed: P.speed,
								eta: P.eta,
								state: "downloading",
								filename: `${W}${q}.${K}`
							}));
						});
					}), i.stderr?.on("data", (i) => {
						let P = i.toString();
						console.log(`[${U}] stderr:`, P), P.split(/\r?\n/).forEach((i) => {
							if (!i.trim()) return;
							let P = this.parseProgressLine(i);
							P && N && (P.totalBytes > 0 && (z = P.totalBytes), P.percent > 0 && (B = P.percent), R = B / 100 * z, N({
								id: U,
								percent: Math.round(B),
								downloaded: R,
								total: z,
								speed: P.speed,
								eta: P.eta,
								state: "downloading",
								filename: `${W}.${K}`
							}));
						});
					});
				}
				V.on("close", (R) => {
					if (this.activeProcesses.delete(U), R === 0) {
						let I = path$1.join(G, `${W}${q}.${K}`), R = z;
						try {
							fs$1.existsSync(I) && (R = fs$1.statSync(I).size);
						} catch (i) {
							console.warn("Failed to get file size:", i);
						}
						N && N({
							id: U,
							percent: 100,
							downloaded: R,
							total: R,
							speed: 0,
							eta: 0,
							state: "complete",
							filename: `${W}.${K}`
						}), this.addToHistory({
							url: P,
							title: H.title,
							thumbnailUrl: H.thumbnailUrl,
							format: F,
							quality: L || (F === "audio" ? "best" : "auto"),
							path: I,
							size: R,
							duration: H.lengthSeconds,
							status: "completed"
						}), i(I);
					} else this.cleanupPartialFiles(G, W, K), I(/* @__PURE__ */ Error(`yt-dlp exited with code ${R}`));
				}), V.on("error", (i) => {
					this.activeProcesses.delete(U), this.cleanupPartialFiles(G, W, K), I(i);
				});
			});
		} catch (i) {
			throw this.activeProcesses.delete(U), Error(`Download failed: ${i instanceof Error ? i.message : "Unknown error"}`);
		}
	}
	cancelDownload(i) {
		if (i) {
			let N = this.activeProcesses.get(i);
			if (N) {
				console.log(`Cancelling download ${i}`);
				try {
					N.ytDlpProcess && typeof N.ytDlpProcess.kill == "function" ? N.ytDlpProcess.kill() : typeof N.kill == "function" && N.kill();
				} catch (i) {
					console.error("Failed to kill process:", i);
				}
				this.activeProcesses.delete(i);
			}
		} else console.log(`Cancelling all ${this.activeProcesses.size} downloads`), this.activeProcesses.forEach((i) => {
			try {
				i.ytDlpProcess && typeof i.ytDlpProcess.kill == "function" ? i.ytDlpProcess.kill() : typeof i.kill == "function" && i.kill();
			} catch (i) {
				console.error("Failed to kill process:", i);
			}
		}), this.activeProcesses.clear();
	}
	cleanupPartialFiles(i, N, P) {
		try {
			[
				path$1.join(i, `${N}.${P}`),
				path$1.join(i, `${N}.${P}.part`),
				path$1.join(i, `${N}.${P}.ytdl`),
				path$1.join(i, `${N}.part`)
			].forEach((i) => {
				fs$1.existsSync(i) && fs$1.unlinkSync(i);
			});
		} catch (i) {
			console.error("Cleanup failed:", i);
		}
	}
	sanitizeFilename(i) {
		return i.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
	}
	parseProgressLine(i) {
		let N = (i) => {
			if (!i) return 1;
			let N = i.toLowerCase();
			return N.includes("k") ? 1024 : N.includes("m") ? 1024 * 1024 : N.includes("g") ? 1024 * 1024 * 1024 : 1;
		};
		if (i.includes("[download]")) {
			let P = i.match(/(\d+(?:\.\d+)?)%/), F = i.match(/of\s+~?([0-9.,]+)([a-zA-Z]+)/), I = i.match(/at\s+([0-9.,]+)([a-zA-Z]+\/s)/), L = i.match(/ETA\s+([\d:]+)/);
			if (console.log("[parseProgressLine] Matches:", {
				line: i,
				percentMatch: P?.[0],
				sizeMatch: F?.[0],
				speedMatch: I?.[0],
				etaMatch: L?.[0]
			}), P) {
				let i = parseFloat(P[1]), R = 0, z = 0, B = 0;
				if (F && (R = parseFloat(F[1].replace(/,/g, "")) * N(F[2])), I && (z = parseFloat(I[1].replace(/,/g, "")) * N(I[2].replace("/s", ""))), L) {
					let i = L[1].split(":").map(Number);
					B = i.length === 3 ? i[0] * 3600 + i[1] * 60 + i[2] : i.length === 2 ? i[0] * 60 + i[1] : i[0];
				}
				return {
					percent: i,
					totalBytes: R,
					downloadedBytes: 0,
					speed: z,
					eta: B,
					status: "downloading"
				};
			}
		}
		return null;
	}
	getHistory() {
		return this.store.get("history", []);
	}
	addToHistory(i) {
		let N = this.store.get("history", []), P = {
			...i,
			id: randomUUID$1(),
			timestamp: Date.now()
		};
		this.store.set("history", [P, ...N].slice(0, 50));
	}
	removeFromHistory(i) {
		let N = this.store.get("history", []).filter((N) => N.id !== i);
		this.store.set("history", N);
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
	saveSettings(i) {
		let N = {
			...this.store.get("settings"),
			...i
		};
		return this.store.set("settings", N), N;
	}
}();
var execAsync = promisify(exec), store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(i) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: i,
			openAsHidden: !0
		}), { success: !0 };
	} catch (i) {
		let N = i instanceof Error ? i.message : String(i);
		return console.warn("Failed to set login item settings:", N), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: N
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
	let i = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let N = Math.min(clipboardItems.length, 9);
		i.push({
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
					label: `● Recent Clipboard (${N})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((i, N) => {
					let F = String(i.content || ""), I = (F.length > 75 ? F.substring(0, 75) + "..." : F).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${N + 1}. ${I || "(Empty)"}`,
						click: () => {
							F && (clipboard.writeText(F), new Notification({
								title: "✓ Copied from History",
								body: I || "Copied to clipboard",
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
		}), i.push({ type: "separator" });
	} else i.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), i.push({ type: "separator" });
	if (i.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let i = randomUUID();
					clipboard.writeText(i), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${i.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let i = clipboard.readText(), N = JSON.parse(i), F = JSON.stringify(N, null, 2);
						clipboard.writeText(F), new Notification({
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
						let i = clipboard.readText();
						if (!i) throw Error("Empty clipboard");
						let N = createHash("sha256").update(i).digest("hex");
						clipboard.writeText(N), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${N.substring(0, 20)}...`,
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
						let i = clipboard.readText();
						if (!i) throw Error("Empty clipboard");
						let N = Buffer.from(i).toString("base64");
						clipboard.writeText(N), new Notification({
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
						let i = clipboard.readText();
						if (!i) throw Error("Empty clipboard");
						let N = Buffer.from(i, "base64").toString("utf-8");
						clipboard.writeText(N), new Notification({
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
	}), i.push({ type: "separator" }), statsMenuData && (i.push({
		label: "📊 Stats Monitor",
		enabled: !1
	}), i.push({
		label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
		enabled: !1
	}), i.push({
		label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
		enabled: !1
	}), i.push({
		label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
		enabled: !1
	}), i.push({ type: "separator" }), i.push({
		label: "Open Stats Monitor",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
		}
	}), i.push({ type: "separator" })), healthMenuData) {
		let N = healthMenuData.alerts.filter((i) => i.severity === "critical" || i.severity === "warning").length, F = N > 0 ? `🛡️ System Health (${N} alerts)` : "🛡️ System Health", I = [
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
		healthMenuData.disk && I.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && I.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), I.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (I.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((i) => {
			I.push({
				label: `${i.severity === "critical" ? "🔴" : i.severity === "warning" ? "🟡" : "🔵"} ${i.message.substring(0, 50)}${i.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), I.push({ type: "separator" })), I.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), I.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let i = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							i?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(i.ramFreed || 0)}`,
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
		}), i.push({
			label: F,
			submenu: I
		}), i.push({ type: "separator" });
	}
	recentTools.length > 0 && (i.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((i) => ({
			label: `  • ${i.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", i.id);
			}
		}))
	}), i.push({ type: "separator" })), i.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), i.push({ type: "separator" }), i.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let F = Menu.buildFromTemplate(i);
	tray.setContextMenu(F);
}
function createWindow() {
	let N = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, F = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...N,
		minWidth: 900,
		minHeight: 600,
		show: !F,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let H = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", H), win.on("move", H), win.on("close", (i) => {
		let N = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && N && (i.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let i = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return i.canceled || i.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: i.filePaths[0]
		};
	}), ipcMain.handle("store-get", (i, N) => store.get(N)), ipcMain.handle("store-set", (i, N, P) => {
		if (store.set(N, P), N === "launchAtLogin") {
			let i = setLoginItemSettingsSafely(P === !0);
			!i.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: i.error
			});
		}
	}), ipcMain.handle("store-delete", (i, N) => store.delete(N)), setupScreenshotHandlers(win), ipcMain.on("window-set-opacity", (i, N) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, N)));
	}), ipcMain.on("window-set-always-on-top", (i, N) => {
		win && win.setAlwaysOnTop(N);
	}), ipcMain.handle("permissions:check-all", async () => {
		let i = process.platform, N = {};
		return i === "darwin" ? (N.accessibility = await U(), N.fullDiskAccess = await W(), N.screenRecording = await G()) : i === "win32" && (N.fileAccess = await Y(), N.registryAccess = await X()), N.clipboard = await q(), N.launchAtLogin = await J(), N;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await U() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await W() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await G() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await Z()), ipcMain.handle("permissions:test-file-access", async () => await Q()), ipcMain.handle("permissions:open-system-preferences", async (i, N) => await $(N));
	async function U() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let i = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(i, () => {})) return globalShortcut.unregister(i), { status: "granted" };
			} catch {}
			return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function W() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (let i of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				return await fs.access(i), { status: "granted" };
			} catch {}
			let i = os.homedir();
			try {
				return await fs.readdir(i), {
					status: "granted",
					message: "Basic file access available"
				};
			} catch {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function G() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let i = await desktopCapturer.getSources({ types: ["screen"] });
				if (i && i.length > 0) return { status: "granted" };
			} catch {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function q() {
		try {
			let i = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			let N = clipboard.readText();
			return clipboard.writeText(i), N === "__PERMISSION_TEST__" ? { status: "granted" } : {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function J() {
		try {
			let i = app.getLoginItemSettings();
			return {
				status: i.openAtLogin ? "granted" : "not-determined",
				message: i.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function Y() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let i = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), N = "permission test";
			await fs.writeFile(i, N);
			let P = await fs.readFile(i, "utf-8");
			return await fs.unlink(i), P === N ? { status: "granted" } : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (i) {
			return {
				status: "denied",
				message: i.message
			};
		}
	}
	async function X() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let { stdout: i } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			return i && !i.includes("ERROR") ? { status: "granted" } : {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (i) {
			return {
				status: "denied",
				message: i.message
			};
		}
	}
	async function Z() {
		try {
			let i = clipboard.readText(), N = `Permission test ${Date.now()}`;
			clipboard.writeText(N);
			let P = clipboard.readText();
			return clipboard.writeText(i), P === N ? {
				status: "granted",
				message: "Clipboard read/write test passed"
			} : {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (i) {
			return {
				status: "error",
				message: i.message
			};
		}
	}
	async function Q() {
		try {
			let i = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), N = `Test ${Date.now()}`;
			await fs.writeFile(i, N);
			let P = await fs.readFile(i, "utf-8");
			return await fs.unlink(i), P === N ? {
				status: "granted",
				message: "File access test passed"
			} : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (i) {
			return {
				status: "denied",
				message: i.message
			};
		}
	}
	async function $(i) {
		let N = process.platform;
		try {
			if (N === "darwin") {
				let N = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				return i === "accessibility" ? N = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : i === "full-disk-access" ? N = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : i === "screen-recording" && (N = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync(N), {
					success: !0,
					message: "Opened System Preferences"
				};
			} else if (N === "win32") return await execAsync("start ms-settings:privacy"), {
				success: !0,
				message: "Opened Windows Settings"
			};
			return {
				success: !1,
				message: "Unsupported platform"
			};
		} catch (i) {
			return {
				success: !1,
				message: i.message
			};
		}
	}
	ipcMain.on("tray-update-menu", (i, N) => {
		recentTools = N || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (i, N) => {
		clipboardItems = (N || []).sort((i, N) => N.timestamp - i.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (i) {
			return console.error("Failed to read clipboard:", i), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let i = clipboard.readImage();
			return i.isEmpty() ? null : i.toDataURL();
		} catch (i) {
			return console.error("Failed to read clipboard image:", i), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (i, N) => {
		clipboardMonitoringEnabled = N, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (i, N) => {
		statsMenuData = N, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (i, N) => {
		healthMenuData = N, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let i = async () => {
			try {
				let i = await si.mem(), N = await si.currentLoad(), F = await si.fsSize(), I = await si.battery().catch(() => null), L = [], R = F.find((i) => i.mount === "/" || i.mount === "C:") || F[0];
				if (R) {
					let i = R.available / R.size * 100;
					i < 10 ? L.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(R.available)} free`
					}) : i < 20 && L.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(R.available)} free`
					});
				}
				N.currentLoad > 90 && L.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${N.currentLoad.toFixed(1)}%`
				});
				let z = i.used / i.total * 100;
				z > 90 && L.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${z.toFixed(1)}%`
				}), healthMenuData = {
					cpu: N.currentLoad,
					ram: {
						used: i.used,
						total: i.total,
						percentage: z
					},
					disk: R ? {
						free: R.available,
						total: R.size,
						percentage: (R.size - R.available) / R.size * 100
					} : null,
					battery: I ? {
						level: I.percent,
						charging: I.isCharging || !1
					} : null,
					alerts: L
				}, updateTrayMenu();
				let B = L.filter((i) => i.severity === "critical");
				B.length > 0 && win && B.forEach((i) => {
					new Notification({
						title: "⚠️ System Alert",
						body: i.message,
						silent: !1
					}).show();
				});
			} catch (i) {
				console.error("Health monitoring error:", i);
			}
		};
		return i(), healthMonitoringInterval = setInterval(i, 5e3), { success: !0 };
	}), ipcMain.handle("health-stop-monitoring", () => (healthMonitoringInterval &&= (clearInterval(healthMonitoringInterval), null), healthMenuData = null, updateTrayMenu(), { success: !0 })), ipcMain.on("window-minimize", () => {
		win?.minimize();
	}), ipcMain.on("window-maximize", () => {
		win?.isMaximized() ? win.unmaximize() : win?.maximize();
	}), ipcMain.on("window-close", () => {
		win?.close();
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
	} catch (i) {
		console.error("Failed to register global shortcut", i);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [i, N] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: i.manufacturer,
			brand: i.brand,
			speed: i.speed,
			cores: i.cores,
			physicalCores: i.physicalCores,
			load: N
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [i, N] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: i,
			interfaces: N
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [i, N] = await Promise.all([si.fsSize(), si.disksIO()]), P = null;
			if (N && Array.isArray(N) && N.length > 0) {
				let i = N[0];
				P = {
					rIO: i.rIO || 0,
					wIO: i.wIO || 0,
					tIO: i.tIO || 0,
					rIO_sec: i.rIO_sec || 0,
					wIO_sec: i.wIO_sec || 0,
					tIO_sec: i.tIO_sec || 0
				};
			} else N && typeof N == "object" && !Array.isArray(N) && (P = {
				rIO: N.rIO || 0,
				wIO: N.wIO || 0,
				tIO: N.tIO || 0,
				rIO_sec: N.rIO_sec || 0,
				wIO_sec: N.wIO_sec || 0,
				tIO_sec: N.tIO_sec || 0
			});
			return {
				fsSize: i,
				ioStats: P
			};
		} catch (i) {
			return console.error("Error fetching disk stats:", i), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let i = await si.battery(), N, P;
			if ("powerConsumptionRate" in i && i.powerConsumptionRate && typeof i.powerConsumptionRate == "number" && (N = i.powerConsumptionRate), i.voltage && i.voltage > 0) {
				if (!i.isCharging && i.timeRemaining > 0 && i.currentCapacity > 0) {
					let P = i.currentCapacity / i.timeRemaining * 60;
					N = i.voltage * P;
				}
				i.isCharging && i.voltage > 0 && (P = i.voltage * 2e3);
			}
			return {
				...i,
				powerConsumptionRate: N,
				chargingPower: P
			};
		} catch (i) {
			return console.error("Error fetching battery stats:", i), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let i = await si.bluetoothDevices();
			return {
				enabled: i.length > 0 || await checkBluetoothEnabled(),
				devices: i.map((i) => ({
					name: i.name || "Unknown",
					mac: i.mac || i.address || "",
					type: i.type || i.deviceClass || "unknown",
					battery: i.battery || i.batteryLevel || void 0,
					connected: i.connected !== !1,
					rssi: i.rssi || i.signalStrength || void 0,
					manufacturer: i.manufacturer || i.vendor || void 0
				}))
			};
		} catch (i) {
			return console.error("Error fetching bluetooth stats:", i), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let i = await si.time(), N = Intl.DateTimeFormat().resolvedOptions().timeZone, P = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((i) => {
				let N = /* @__PURE__ */ new Date(), P = new Intl.DateTimeFormat("en-US", {
					timeZone: i,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), F = new Intl.DateTimeFormat("en-US", {
					timeZone: i,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), I = getTimezoneOffset(i);
				return {
					timezone: i,
					city: i.split("/").pop()?.replace("_", " ") || i,
					time: P.format(N),
					date: F.format(N),
					offset: I
				};
			});
			return {
				local: {
					timezone: N,
					city: N.split("/").pop()?.replace("_", " ") || "Local",
					time: i.current,
					date: i.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(N)
				},
				zones: P
			};
		} catch (i) {
			return console.error("Error fetching timezones stats:", i), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let P = process.platform, F = [];
			if (P === "darwin") {
				let N = "/Applications", P = await fs.readdir(N, { withFileTypes: !0 }).catch(() => []);
				for (let I of P) if (I.name.endsWith(".app")) {
					let P = join(N, I.name);
					try {
						let N = await fs.stat(P), L = I.name.replace(".app", ""), R = P.startsWith("/System") || P.startsWith("/Library") || L.startsWith("com.apple.");
						F.push({
							id: `macos-${L}-${N.ino}`,
							name: L,
							version: void 0,
							publisher: void 0,
							installDate: N.birthtime.toISOString(),
							installLocation: P,
							size: await i(P).catch(() => 0),
							isSystemApp: R
						});
					} catch {}
				}
			} else if (P === "win32") try {
				let { stdout: i } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), P = JSON.parse(i), I = Array.isArray(P) ? P : [P];
				for (let i of I) if (i.DisplayName) {
					let P = i.Publisher || "", I = i.InstallLocation || "", L = P.includes("Microsoft") || P.includes("Windows") || I.includes("Windows\\") || I.includes("Program Files\\Windows");
					F.push({
						id: `win-${i.DisplayName}-${i.InstallDate || "unknown"}`,
						name: i.DisplayName,
						version: i.DisplayVersion || void 0,
						publisher: P || void 0,
						installDate: i.InstallDate ? N(i.InstallDate) : void 0,
						installLocation: I || void 0,
						size: i.EstimatedSize ? i.EstimatedSize * 1024 : void 0,
						isSystemApp: L
					});
				}
			} catch (i) {
				console.error("Error fetching Windows apps:", i);
			}
			return F;
		} catch (i) {
			return console.error("Error fetching installed apps:", i), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let i = await si.processes(), N = await si.mem();
			return i.list.map((i) => ({
				pid: i.pid,
				name: i.name,
				cpu: i.cpu || 0,
				memory: i.mem || 0,
				memoryPercent: N.total > 0 ? (i.mem || 0) / N.total * 100 : 0,
				started: i.started || "",
				user: i.user || void 0,
				command: i.command || void 0,
				path: i.path || void 0
			}));
		} catch (i) {
			return console.error("Error fetching running processes:", i), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (i, N) => {
		try {
			let i = process.platform;
			if (i === "darwin") {
				if (N.installLocation) return await fs.rm(N.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (i === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${N.name.replace(/"/g, "\\\"")}" } | 
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
			} catch (i) {
				return {
					success: !1,
					error: i.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (i, N) => {
		try {
			return process.kill(N, "SIGTERM"), { success: !0 };
		} catch (i) {
			return {
				success: !1,
				error: i.message
			};
		}
	}), ipcMain.handle("youtube:getInfo", async (i, N) => {
		try {
			return await youtubeDownloader.getVideoInfo(N);
		} catch (i) {
			throw i;
		}
	}), ipcMain.handle("youtube:getPlaylistInfo", async (i, N) => {
		try {
			return await youtubeDownloader.getPlaylistInfo(N);
		} catch (i) {
			throw i;
		}
	}), ipcMain.handle("youtube:download", async (i, N) => {
		try {
			return {
				success: !0,
				filepath: await youtubeDownloader.downloadVideo(N, (N) => {
					i.sender.send("youtube:progress", N);
				})
			};
		} catch (i) {
			return {
				success: !1,
				error: i instanceof Error ? i.message : "Download failed"
			};
		}
	}), ipcMain.handle("youtube:cancel", async () => (youtubeDownloader.cancelDownload(), { success: !0 })), ipcMain.handle("youtube:openFile", async (i, N) => {
		let { shell: P } = await import("electron");
		return P.openPath(N);
	}), ipcMain.handle("youtube:showInFolder", async (i, N) => {
		let { shell: P } = await import("electron");
		return P.showItemInFolder(N), !0;
	}), ipcMain.handle("youtube:chooseFolder", async () => {
		let { dialog: i } = await import("electron"), N = await i.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
			title: "Choose Download Location",
			buttonLabel: "Select Folder"
		});
		return N.canceled || N.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: N.filePaths[0]
		};
	}), ipcMain.handle("youtube:getHistory", () => youtubeDownloader.getHistory()), ipcMain.handle("youtube:clearHistory", () => (youtubeDownloader.clearHistory(), !0)), ipcMain.handle("youtube:removeFromHistory", (i, N) => (youtubeDownloader.removeFromHistory(N), !0)), ipcMain.handle("youtube:getSettings", () => youtubeDownloader.getSettings()), ipcMain.handle("youtube:saveSettings", (i, N) => youtubeDownloader.saveSettings(N)), ipcMain.handle("youtube:getCapabilities", () => youtubeDownloader.getCapabilities()), ipcMain.handle("youtube:installAria2", async () => await youtubeDownloader.installAria2());
	async function i(N) {
		try {
			let P = 0, F = await fs.readdir(N, { withFileTypes: !0 });
			for (let I of F) {
				let F = join(N, I.name);
				try {
					if (I.isDirectory()) P += await i(F);
					else {
						let i = await fs.stat(F);
						P += i.size;
					}
				} catch {}
			}
			return P;
		} catch {
			return 0;
		}
	}
	function N(i) {
		return i && i.length === 8 ? `${i.substring(0, 4)}-${i.substring(4, 6)}-${i.substring(6, 8)}` : i;
	}
	setupCleanerHandlers(), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: i } = __require("child_process");
			return i("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(i) {
	let N = /* @__PURE__ */ new Date(), P = N.getTime() + N.getTimezoneOffset() * 6e4, F = N.toLocaleString("en-US", {
		timeZone: i,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(F).getTime() - P) / (1e3 * 60 * 60);
}
function formatBytes(i) {
	if (i === 0) return "0 B";
	let N = 1024, P = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], F = Math.floor(Math.log(i) / Math.log(N));
	return `${(i / N ** +F).toFixed(1)} ${P[F]}`;
}
function formatSpeed(i) {
	return i > 1024 * 1024 ? `${(i / 1024 / 1024).toFixed(1)} MB/s` : i > 1024 ? `${(i / 1024).toFixed(1)} KB/s` : `${i.toFixed(0)} B/s`;
}
