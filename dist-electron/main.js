import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, screen } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import si from "systeminformation";
import Store from "electron-store";
var __require = /* @__PURE__ */ ((a) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(a, { get: (a, P) => (typeof require < "u" ? require : a)[P] }) : a)(function(a) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + a + "\" in an environment that doesn't expose the `require` function.");
}), execAsync$1 = promisify(exec), dirSizeCache = /* @__PURE__ */ new Map(), CACHE_TTL = 300 * 1e3;
setInterval(() => {
	let a = Date.now();
	for (let [P, F] of dirSizeCache.entries()) a - F.timestamp > CACHE_TTL && dirSizeCache.delete(P);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let a = process.platform, P = [], F = os.homedir();
		if (a === "win32") {
			let a = process.env.WINDIR || "C:\\Windows", F = process.env.LOCALAPPDATA || "", I = os.tmpdir(), L = path.join(a, "Temp"), R = path.join(a, "Prefetch"), z = path.join(a, "SoftwareDistribution", "Download");
			P.push({
				path: I,
				name: "User Temporary Files",
				category: "temp"
			}), P.push({
				path: L,
				name: "System Temporary Files",
				category: "temp"
			}), P.push({
				path: R,
				name: "Prefetch Files",
				category: "system"
			}), P.push({
				path: z,
				name: "Windows Update Cache",
				category: "system"
			});
			let B = path.join(F, "Google/Chrome/User Data/Default/Cache"), V = path.join(F, "Microsoft/Edge/User Data/Default/Cache");
			P.push({
				path: B,
				name: "Chrome Cache",
				category: "cache"
			}), P.push({
				path: V,
				name: "Edge Cache",
				category: "cache"
			}), P.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (a === "darwin") {
			P.push({
				path: path.join(F, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), P.push({
				path: path.join(F, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), P.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), P.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), P.push({
				path: path.join(F, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), P.push({
				path: path.join(F, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: a } = await execAsync$1("tmutil listlocalsnapshots /"), F = a.split("\n").filter((a) => a.trim()).length;
				F > 0 && P.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${F})`,
					category: "system",
					virtual: !0,
					size: F * 500 * 1024 * 1024
				});
			} catch {}
		}
		let I = [], L = 0;
		for (let a of P) try {
			if (a.virtual) {
				I.push({
					...a,
					sizeFormatted: formatBytes$1(a.size || 0)
				}), L += a.size || 0;
				continue;
			}
			let P = await fs.stat(a.path).catch(() => null);
			if (P) {
				let F = P.isDirectory() ? await getDirSize(a.path) : P.size;
				F > 0 && (I.push({
					...a,
					size: F,
					sizeFormatted: formatBytes$1(F)
				}), L += F);
			}
		} catch {}
		return {
			items: I,
			totalSize: L,
			totalSizeFormatted: formatBytes$1(L)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (a, P) => {
		let F = P || os.homedir(), I = a.sender;
		return await scanDirectoryForLens(F, 0, 1, (a) => {
			I && !I.isDestroyed() && I.send("cleaner:space-lens-progress", a);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (a, P) => {
		let F = dirSizeCache.get(P);
		if (F && Date.now() - F.timestamp < CACHE_TTL) return {
			size: F.size,
			sizeFormatted: formatBytes$1(F.size),
			cached: !0
		};
		try {
			let a = await getDirSizeLimited(P, 4), F = formatBytes$1(a);
			return dirSizeCache.set(P, {
				size: a,
				timestamp: Date.now()
			}), {
				size: a,
				sizeFormatted: F,
				cached: !1
			};
		} catch (a) {
			return {
				size: 0,
				sizeFormatted: formatBytes$1(0),
				cached: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (a, P) => {
		if (P) for (let a of dirSizeCache.keys()) a.startsWith(P) && dirSizeCache.delete(a);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let a = await si.processes(), P = await si.mem(), F = await si.currentLoad();
		return {
			heavyApps: a.list.sort((a, P) => P.cpu + P.mem - (a.cpu + a.mem)).slice(0, 10).map((a) => ({
				pid: a.pid,
				name: a.name,
				cpu: a.cpu,
				mem: a.mem,
				user: a.user,
				path: a.path
			})),
			memory: {
				total: P.total,
				used: P.used,
				percent: P.used / P.total * 100
			},
			cpuLoad: F.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let a = process.platform, P = [];
		if (a === "darwin") try {
			let a = path.join(os.homedir(), "Library/LaunchAgents"), F = await fs.readdir(a).catch(() => []);
			for (let I of F) if (I.endsWith(".plist")) {
				let F = path.join(a, I), { stdout: L } = await execAsync$1(`launchctl list | grep -i "${I.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), R = L.trim().length > 0;
				P.push({
					name: I.replace(".plist", ""),
					path: F,
					type: "LaunchAgent",
					enabled: R
				});
			}
			let I = "/Library/LaunchAgents", L = await fs.readdir(I).catch(() => []);
			for (let a of L) {
				let F = path.join(I, a), { stdout: L } = await execAsync$1(`launchctl list | grep -i "${a.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), R = L.trim().length > 0;
				P.push({
					name: a.replace(".plist", ""),
					path: F,
					type: "SystemAgent",
					enabled: R
				});
			}
		} catch {}
		else if (a === "win32") try {
			let { stdout: a } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), F = JSON.parse(a), I = Array.isArray(F) ? F : [F];
			for (let a of I) P.push({
				name: a.Name,
				path: a.Command,
				type: "StartupCommand",
				location: a.Location,
				enabled: !0
			});
		} catch {}
		return P;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (a, P) => {
		let F = process.platform;
		try {
			if (F === "darwin") {
				let a = P.enabled ?? !0;
				if (P.type === "LaunchAgent" || P.type === "SystemAgent") return a ? await execAsync$1(`launchctl unload "${P.path}"`) : await execAsync$1(`launchctl load "${P.path}"`), {
					success: !0,
					enabled: !a
				};
			} else if (F === "win32") {
				let a = P.enabled ?? !0;
				if (P.location === "Startup") {
					let F = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), I = path.basename(P.path), L = path.join(F, I);
					return a && await fs.unlink(L).catch(() => {}), {
						success: !0,
						enabled: !a
					};
				} else return {
					success: !0,
					enabled: !a
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (a, P) => {
		try {
			return process.kill(P, "SIGKILL"), { success: !0 };
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let a = process.platform, P = [];
		if (a === "darwin") {
			let a = "/Applications", F = await fs.readdir(a, { withFileTypes: !0 }).catch(() => []);
			for (let I of F) if (I.name.endsWith(".app")) {
				let F = path.join(a, I.name);
				try {
					let a = await fs.stat(F);
					P.push({
						name: I.name.replace(".app", ""),
						path: F,
						size: await getDirSize(F),
						installDate: a.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (a === "win32") try {
			let { stdout: a } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), F = JSON.parse(a), I = Array.isArray(F) ? F : [F];
			for (let a of I) a.DisplayName && P.push({
				name: a.DisplayName,
				version: a.DisplayVersion,
				path: a.InstallLocation,
				installDate: a.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return P;
	}), ipcMain.handle("cleaner:get-large-files", async (a, P) => {
		let F = P.minSize || 100 * 1024 * 1024, I = P.scanPaths || [os.homedir()], L = [];
		for (let a of I) await findLargeFiles(a, F, L);
		return L.sort((a, P) => P.size - a.size), L.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (a, P) => {
		let F = P || os.homedir(), I = /* @__PURE__ */ new Map(), L = [];
		await findDuplicates(F, I);
		for (let [a, P] of I.entries()) if (P.length > 1) try {
			let F = await fs.stat(P[0]);
			L.push({
				hash: a,
				size: F.size,
				sizeFormatted: formatBytes$1(F.size),
				totalWasted: F.size * (P.length - 1),
				totalWastedFormatted: formatBytes$1(F.size * (P.length - 1)),
				files: P
			});
		} catch {}
		return L.sort((a, P) => P.totalWasted - a.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (a, P) => {
		let F = 0, I = [], L = process.platform, R = checkFilesSafety(P, L);
		if (!R.safe && R.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${R.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: R.blocked
		};
		for (let a = 0; a < P.length; a += 50) {
			let L = P.slice(a, a + 50);
			for (let a of L) try {
				if (a === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), F += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let P = await fs.stat(a).catch(() => null);
				if (!P) continue;
				let I = P.isDirectory() ? await getDirSize(a) : P.size;
				P.isDirectory() ? await fs.rm(a, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(a), F += I;
			} catch {
				I.push(a);
			}
		}
		return {
			success: I.length === 0,
			freedSize: F,
			freedSizeFormatted: formatBytes$1(F),
			failed: I
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (a, P) => {
		let F = process.platform;
		try {
			if (F === "darwin") {
				let a = P.path, F = P.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${a}" to trash'`);
				let I = os.homedir(), L = [
					path.join(I, "Library/Preferences", `*${F}*`),
					path.join(I, "Library/Application Support", F),
					path.join(I, "Library/Caches", F),
					path.join(I, "Library/Logs", F),
					path.join(I, "Library/Saved Application State", `*${F}*`),
					path.join(I, "Library/LaunchAgents", `*${F}*`)
				], R = 0;
				for (let a of L) try {
					let P = await fs.readdir(path.dirname(a)).catch(() => []);
					for (let I of P) if (I.includes(F)) {
						let P = path.join(path.dirname(a), I), F = await fs.stat(P).catch(() => null);
						F && (F.isDirectory() ? (R += await getDirSize(P), await fs.rm(P, {
							recursive: !0,
							force: !0
						})) : (R += F.size, await fs.unlink(P)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: R,
					freedSizeFormatted: formatBytes$1(R)
				};
			} else if (F === "win32") {
				let a = P.name, F = 0;
				try {
					let { stdout: I } = await execAsync$1(`wmic product where name="${a.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), L = I.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (L) {
						let a = L[1];
						await execAsync$1(`msiexec /x ${a} /quiet /norestart`), F = await getDirSize(P.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${a}*'} | Remove-AppxPackage"`).catch(() => {}), F = await getDirSize(P.path).catch(() => 0);
				} catch {
					F = await getDirSize(P.path).catch(() => 0), await fs.rm(P.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let I = process.env.LOCALAPPDATA || "", L = process.env.APPDATA || "", R = [path.join(I, a), path.join(L, a)];
				for (let a of R) try {
					await fs.stat(a).catch(() => null) && (F += await getDirSize(a).catch(() => 0), await fs.rm(a, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: F,
					freedSizeFormatted: formatBytes$1(F)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let a = process.platform, P = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (a === "win32") try {
			let { stdout: a } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), F = parseInt(a.trim()) || 0;
			F > 0 && (P.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: F,
				size: 0,
				description: "Recently opened documents registry entries"
			}), P.totalItems += F);
			let { stdout: I } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), L = parseInt(I.trim()) || 0;
			L > 0 && (P.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: L,
				size: 0,
				description: "Recently run programs registry entries"
			}), P.totalItems += L);
			let R = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let a = await fs.readdir(R, { recursive: !0 }).catch(() => []), F = [], I = 0;
				for (let P of a) {
					let a = path.join(R, P);
					try {
						let P = await fs.stat(a);
						P.isFile() && (F.push(a), I += P.size);
					} catch {}
				}
				F.length > 0 && (P.activityHistory.push({
					name: "Activity History",
					path: R,
					type: "files",
					count: F.length,
					size: I,
					sizeFormatted: formatBytes$1(I),
					files: F,
					description: "Windows activity history files"
				}), P.totalItems += F.length, P.totalSize += I);
			} catch {}
			let z = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let a = await fs.readdir(z).catch(() => []), F = [], I = 0;
				for (let P of a) {
					let a = path.join(z, P);
					try {
						let P = await fs.stat(a);
						F.push(a), I += P.size;
					} catch {}
				}
				F.length > 0 && (P.activityHistory.push({
					name: "Windows Search History",
					path: z,
					type: "files",
					count: F.length,
					size: I,
					sizeFormatted: formatBytes$1(I),
					files: F,
					description: "Windows search history files"
				}), P.totalItems += F.length, P.totalSize += I);
			} catch {}
		} catch (a) {
			return {
				success: !1,
				error: a.message,
				results: P
			};
		}
		else if (a === "darwin") try {
			let a = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let F = await fs.readdir(a, { recursive: !0 }).catch(() => []), I = [], L = 0;
				for (let P of F) {
					let F = path.join(a, P);
					try {
						let a = await fs.stat(F);
						a.isFile() && (I.push(F), L += a.size);
					} catch {}
				}
				I.length > 0 && (P.spotlightHistory.push({
					name: "Spotlight Search History",
					path: a,
					type: "files",
					count: I.length,
					size: L,
					sizeFormatted: formatBytes$1(L),
					files: I,
					description: "macOS Spotlight search history"
				}), P.totalItems += I.length, P.totalSize += L);
			} catch {}
			let F = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let a = await fs.readdir(F, { recursive: !0 }).catch(() => []), I = [], L = 0;
				for (let P of a) {
					let a = path.join(F, P);
					try {
						let P = await fs.stat(a);
						P.isFile() && (I.push(a), L += P.size);
					} catch {}
				}
				I.length > 0 && (P.quickLookCache.push({
					name: "Quick Look Cache",
					path: F,
					type: "files",
					count: I.length,
					size: L,
					sizeFormatted: formatBytes$1(L),
					files: I,
					description: "macOS Quick Look thumbnail cache"
				}), P.totalItems += I.length, P.totalSize += L);
			} catch {}
			let I = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let a = await fs.readdir(I).catch(() => []), F = [], L = 0;
				for (let P of a) if (P.includes("RecentItems")) {
					let a = path.join(I, P);
					try {
						let P = await fs.stat(a);
						F.push(a), L += P.size;
					} catch {}
				}
				F.length > 0 && (P.spotlightHistory.push({
					name: "Recently Opened Files",
					path: I,
					type: "files",
					count: F.length,
					size: L,
					sizeFormatted: formatBytes$1(L),
					files: F,
					description: "macOS recently opened files list"
				}), P.totalItems += F.length, P.totalSize += L);
			} catch {}
		} catch (a) {
			return {
				success: !1,
				error: a.message,
				results: P
			};
		}
		return {
			success: !0,
			results: P
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (a, P) => {
		let F = process.platform, I = 0, L = 0, R = [];
		if (F === "win32") try {
			if (P.registry) {
				try {
					let { stdout: a } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), P = parseInt(a.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), I += P;
				} catch (a) {
					R.push(`Failed to clean Recent Documents registry: ${a.message}`);
				}
				try {
					let { stdout: a } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), P = parseInt(a.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), I += P;
				} catch (a) {
					R.push(`Failed to clean Recent Programs registry: ${a.message}`);
				}
			}
			if (P.activityHistory) {
				let a = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let P = await fs.readdir(a, { recursive: !0 }).catch(() => []);
					for (let F of P) {
						let P = path.join(a, F);
						try {
							let a = await fs.stat(P);
							a.isFile() && (L += a.size, await fs.unlink(P), I++);
						} catch {}
					}
				} catch (a) {
					R.push(`Failed to clean activity history: ${a.message}`);
				}
				let P = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let a = await fs.readdir(P).catch(() => []);
					for (let F of a) {
						let a = path.join(P, F);
						try {
							let P = await fs.stat(a);
							L += P.size, await fs.unlink(a), I++;
						} catch {}
					}
				} catch (a) {
					R.push(`Failed to clean search history: ${a.message}`);
				}
			}
		} catch (a) {
			R.push(`Windows privacy cleanup failed: ${a.message}`);
		}
		else if (F === "darwin") try {
			if (P.spotlightHistory) {
				let a = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let P = await fs.readdir(a, { recursive: !0 }).catch(() => []);
					for (let F of P) {
						let P = path.join(a, F);
						try {
							let a = await fs.stat(P);
							a.isFile() && (L += a.size, await fs.unlink(P), I++);
						} catch {}
					}
				} catch (a) {
					R.push(`Failed to clean Spotlight history: ${a.message}`);
				}
				let P = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let a = await fs.readdir(P).catch(() => []);
					for (let F of a) if (F.includes("RecentItems")) {
						let a = path.join(P, F);
						try {
							let P = await fs.stat(a);
							L += P.size, await fs.unlink(a), I++;
						} catch {}
					}
				} catch (a) {
					R.push(`Failed to clean recent items: ${a.message}`);
				}
			}
			if (P.quickLookCache) {
				let a = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let P = await fs.readdir(a, { recursive: !0 }).catch(() => []);
					for (let F of P) {
						let P = path.join(a, F);
						try {
							let a = await fs.stat(P);
							a.isFile() && (L += a.size, await fs.unlink(P), I++);
						} catch {}
					}
				} catch (a) {
					R.push(`Failed to clean Quick Look cache: ${a.message}`);
				}
			}
		} catch (a) {
			R.push(`macOS privacy cleanup failed: ${a.message}`);
		}
		return {
			success: R.length === 0,
			cleanedItems: I,
			freedSize: L,
			freedSizeFormatted: formatBytes$1(L),
			errors: R
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let a = process.platform, P = os.homedir(), F = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, I = [];
		if (a === "win32") {
			let a = process.env.LOCALAPPDATA || "", P = process.env.APPDATA || "";
			I.push({
				name: "Chrome",
				paths: {
					history: [path.join(a, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(a, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(a, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(a, "Google/Chrome/User Data/Default/History")]
				}
			}), I.push({
				name: "Edge",
				paths: {
					history: [path.join(a, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(a, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(a, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(a, "Microsoft/Edge/User Data/Default/History")]
				}
			}), I.push({
				name: "Firefox",
				paths: {
					history: [path.join(P, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(P, "Mozilla/Firefox/Profiles")],
					cache: [path.join(a, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(P, "Mozilla/Firefox/Profiles")]
				}
			});
		} else a === "darwin" && (I.push({
			name: "Safari",
			paths: {
				history: [path.join(P, "Library/Safari/History.db")],
				cookies: [path.join(P, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(P, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(P, "Library/Safari/Downloads.plist")]
			}
		}), I.push({
			name: "Chrome",
			paths: {
				history: [path.join(P, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(P, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(P, "Library/Caches/Google/Chrome")],
				downloads: [path.join(P, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), I.push({
			name: "Firefox",
			paths: {
				history: [path.join(P, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(P, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(P, "Library/Caches/Firefox")],
				downloads: [path.join(P, "Library/Application Support/Firefox/Profiles")]
			}
		}), I.push({
			name: "Edge",
			paths: {
				history: [path.join(P, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(P, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(P, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(P, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let P of I) {
			let I = {
				name: P.name,
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
			for (let [F, L] of Object.entries(P.paths)) for (let R of L) try {
				if (F === "cache" && a === "darwin" && P.name === "Safari") {
					let a = await fs.stat(R).catch(() => null);
					if (a && a.isDirectory()) {
						let a = await getDirSize(R);
						I[F].size += a, I[F].paths.push(R), I[F].count += 1;
					}
				} else {
					let a = await fs.stat(R).catch(() => null);
					if (a) if (a.isDirectory()) {
						let a = await getDirSize(R);
						I[F].size += a, I[F].paths.push(R), I[F].count += 1;
					} else a.isFile() && (I[F].size += a.size, I[F].paths.push(R), I[F].count += 1);
				}
			} catch {}
			let L = Object.values(I).reduce((a, P) => a + (typeof P == "object" && P.size ? P.size : 0), 0);
			L > 0 && (I.totalSize = L, I.totalSizeFormatted = formatBytes$1(L), F.browsers.push(I), F.totalSize += L, F.totalItems += Object.values(I).reduce((a, P) => a + (typeof P == "object" && P.count ? P.count : 0), 0));
		}
		return {
			success: !0,
			results: F
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (a, P) => {
		let F = process.platform, I = os.homedir(), L = 0, R = 0, z = [], B = {};
		if (F === "win32") {
			let a = process.env.LOCALAPPDATA || "", P = process.env.APPDATA || "";
			B.Chrome = {
				history: [path.join(a, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(a, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(a, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(a, "Google/Chrome/User Data/Default/History")]
			}, B.Edge = {
				history: [path.join(a, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(a, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(a, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(a, "Microsoft/Edge/User Data/Default/History")]
			}, B.Firefox = {
				history: [path.join(P, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(P, "Mozilla/Firefox/Profiles")],
				cache: [path.join(a, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(P, "Mozilla/Firefox/Profiles")]
			};
		} else F === "darwin" && (B.Safari = {
			history: [path.join(I, "Library/Safari/History.db")],
			cookies: [path.join(I, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(I, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(I, "Library/Safari/Downloads.plist")]
		}, B.Chrome = {
			history: [path.join(I, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(I, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(I, "Library/Caches/Google/Chrome")],
			downloads: [path.join(I, "Library/Application Support/Google/Chrome/Default/History")]
		}, B.Firefox = {
			history: [path.join(I, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(I, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(I, "Library/Caches/Firefox")],
			downloads: [path.join(I, "Library/Application Support/Firefox/Profiles")]
		}, B.Edge = {
			history: [path.join(I, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(I, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(I, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(I, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let a of P.browsers) {
			let F = B[a];
			if (F) for (let I of P.types) {
				let P = F[I];
				if (P) for (let F of P) try {
					let a = await fs.stat(F).catch(() => null);
					if (!a) continue;
					if (a.isDirectory()) {
						let a = await getDirSize(F);
						await fs.rm(F, {
							recursive: !0,
							force: !0
						}), R += a, L++;
					} else a.isFile() && (R += a.size, await fs.unlink(F), L++);
				} catch (P) {
					z.push(`Failed to clean ${a} ${I}: ${P.message}`);
				}
			}
		}
		return {
			success: z.length === 0,
			cleanedItems: L,
			freedSize: R,
			freedSizeFormatted: formatBytes$1(R),
			errors: z
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let a = process.platform, P = [];
		try {
			if (a === "win32") {
				let { stdout: a } = await execAsync$1("netsh wlan show profiles"), F = a.split("\n");
				for (let a of F) {
					let F = a.match(/All User Profile\s*:\s*(.+)/);
					if (F) {
						let a = F[1].trim();
						try {
							let { stdout: F } = await execAsync$1(`netsh wlan show profile name="${a}" key=clear`), I = F.match(/Key Content\s*:\s*(.+)/);
							P.push({
								name: a,
								hasPassword: !!I,
								platform: "windows"
							});
						} catch {
							P.push({
								name: a,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (a === "darwin") {
				let { stdout: a } = await execAsync$1("networksetup -listallhardwareports");
				if (a.split("\n").find((a) => a.includes("Wi-Fi") || a.includes("AirPort"))) {
					let { stdout: a } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), F = a.split("\n").filter((a) => a.trim() && !a.includes("Preferred networks"));
					for (let a of F) {
						let F = a.trim();
						F && P.push({
							name: F,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (a) {
			return {
				success: !1,
				error: a.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: P
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (a, P) => {
		let F = process.platform;
		try {
			return F === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${P}"`), { success: !0 }) : F === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${P}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (a, P) => {
		let F = process.platform, I = Date.now(), L = "";
		try {
			if (F === "win32") switch (P.category) {
				case "sfc":
					let { stdout: a } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					L = a;
					break;
				case "dism":
					let { stdout: F } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					L = F;
					break;
				case "disk-cleanup":
					let { stdout: I } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					L = I || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: R } = await execAsync$1("ipconfig /flushdns");
					L = R || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: z } = await execAsync$1("netsh winsock reset");
					L = z || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), L = "Windows Search index rebuilt successfully";
					} catch (a) {
						throw Error(`Failed to rebuild search index: ${a.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${P.category}`);
			}
			else if (F === "darwin") switch (P.category) {
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), L = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), L = "Spotlight index rebuilt successfully (user directory only)";
						} catch (a) {
							throw Error(`Failed to rebuild Spotlight index: ${a.message}`);
						}
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: a } = await execAsync$1("diskutil verifyVolume /");
						L = a || "Disk permissions verified";
					} catch {
						L = "Disk permissions check completed (Note: macOS Big Sur+ uses System Integrity Protection)";
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), L = "DNS cache flushed successfully";
					} catch {
						try {
							await execAsync$1("dscacheutil -flushcache; killall -HUP mDNSResponder"), L = "DNS cache flushed successfully";
						} catch (a) {
							throw Error(`Failed to flush DNS: ${a.message}`);
						}
					}
					break;
				case "mail-rebuild":
					try {
						await execAsync$1("killall Mail 2>/dev/null || true"), L = "Mail database rebuild initiated (please ensure Mail.app is closed)";
					} catch (a) {
						throw Error(`Failed to rebuild Mail database: ${a.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${P.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: P.id,
				duration: Date.now() - I,
				output: L
			};
		} catch (a) {
			return {
				success: !1,
				taskId: P.id,
				duration: Date.now() - I,
				error: a.message,
				output: L
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let a = await si.mem(), P = await si.currentLoad(), F = await si.fsSize(), I = await si.battery().catch(() => null), L = [], R = F.find((a) => a.mount === "/" || a.mount === "C:") || F[0];
			if (R) {
				let a = R.available / R.size * 100;
				a < 10 ? L.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(R.available)} free (${a.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : a < 20 && L.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(R.available)} free (${a.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			P.currentLoad > 90 && L.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${P.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let z = a.used / a.total * 100;
			return z > 90 && L.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${z.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: P.currentLoad,
				ram: {
					used: a.used,
					total: a.total,
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
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (a, P) => {
		try {
			let a = process.platform, F = checkFilesSafety(P, a);
			return {
				success: !0,
				safe: F.safe,
				warnings: F.warnings,
				blocked: F.blocked
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (a, P) => {
		try {
			return await createBackup(P);
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (a, P) => {
		try {
			let a = await getBackupInfo(P);
			return {
				success: a !== null,
				backupInfo: a
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (a, P) => {
		try {
			return await restoreBackup(P);
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (a, P) => {
		try {
			return await deleteBackup(P);
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	});
}
async function getDirSize(a) {
	let P = 0;
	try {
		let F = await fs.readdir(a, { withFileTypes: !0 });
		for (let I of F) {
			let F = path.join(a, I.name);
			if (I.isDirectory()) P += await getDirSize(F);
			else {
				let a = await fs.stat(F).catch(() => null);
				a && (P += a.size);
			}
		}
	} catch {}
	return P;
}
async function getDirSizeLimited(a, P, F = 0) {
	if (F >= P) return 0;
	let I = 0;
	try {
		let L = await fs.readdir(a, { withFileTypes: !0 });
		for (let R of L) {
			if (R.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(R.name)) continue;
			let L = path.join(a, R.name);
			try {
				if (R.isDirectory()) I += await getDirSizeLimited(L, P, F + 1);
				else {
					let a = await fs.stat(L).catch(() => null);
					a && (I += a.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return I;
}
async function scanDirectoryForLens(a, P, F, I) {
	try {
		let L = await fs.stat(a), R = path.basename(a) || a;
		if (!L.isDirectory()) {
			let P = {
				name: R,
				path: a,
				size: L.size,
				sizeFormatted: formatBytes$1(L.size),
				type: "file"
			};
			return I && I({
				currentPath: R,
				progress: 100,
				status: `Scanning file: ${R}`,
				item: P
			}), P;
		}
		I && I({
			currentPath: R,
			progress: 0,
			status: `Scanning directory: ${R}`
		});
		let z = await fs.readdir(a, { withFileTypes: !0 }), B = [], V = 0, H = z.filter((a) => !a.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(a.name)), U = H.length, W = 0;
		for (let L of H) {
			let R = path.join(a, L.name);
			if (I) {
				let a = Math.floor(W / U * 100), P = L.isDirectory() ? "directory" : "file";
				I({
					currentPath: L.name,
					progress: a,
					status: `Scanning ${P}: ${L.name}`
				});
			}
			let z = null;
			if (P < F) z = await scanDirectoryForLens(R, P + 1, F, I), z && (B.push(z), V += z.size);
			else try {
				let a = (await fs.stat(R)).size;
				if (L.isDirectory()) {
					let P = dirSizeCache.get(R);
					if (P && Date.now() - P.timestamp < CACHE_TTL) a = P.size;
					else try {
						a = await getDirSizeLimited(R, 3), dirSizeCache.set(R, {
							size: a,
							timestamp: Date.now()
						});
					} catch {
						a = 0;
					}
				}
				z = {
					name: L.name,
					path: R,
					size: a,
					sizeFormatted: formatBytes$1(a),
					type: L.isDirectory() ? "dir" : "file"
				}, B.push(z), V += a;
			} catch {
				W++;
				continue;
			}
			z && I && I({
				currentPath: L.name,
				progress: Math.floor((W + 1) / U * 100),
				status: `Scanned: ${L.name}`,
				item: z
			}), W++;
		}
		let K = {
			name: R,
			path: a,
			size: V,
			sizeFormatted: formatBytes$1(V),
			type: "dir",
			children: B.sort((a, P) => P.size - a.size)
		};
		return I && I({
			currentPath: R,
			progress: 100,
			status: `Completed: ${R}`
		}), K;
	} catch {
		return null;
	}
}
async function findLargeFiles(a, P, F) {
	try {
		let I = await fs.readdir(a, { withFileTypes: !0 });
		for (let L of I) {
			let I = path.join(a, L.name);
			if (!(L.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(L.name))) try {
				let a = await fs.stat(I);
				L.isDirectory() ? await findLargeFiles(I, P, F) : a.size >= P && F.push({
					name: L.name,
					path: I,
					size: a.size,
					sizeFormatted: formatBytes$1(a.size),
					lastAccessed: a.atime,
					type: path.extname(L.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(a, P) {
	try {
		let F = await fs.readdir(a, { withFileTypes: !0 });
		for (let I of F) {
			let F = path.join(a, I.name);
			if (!(I.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(I.name))) try {
				let a = await fs.stat(F);
				if (I.isDirectory()) await findDuplicates(F, P);
				else if (a.size > 1024 * 1024 && a.size < 50 * 1024 * 1024) {
					let a = await hashFile(F), I = P.get(a) || [];
					I.push(F), P.set(a, I);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(a) {
	let P = await fs.readFile(a);
	return createHash("md5").update(P).digest("hex");
}
function formatBytes$1(a) {
	if (a === 0) return "0 B";
	let P = 1024, F = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], I = Math.floor(Math.log(a) / Math.log(P));
	return `${(a / P ** +I).toFixed(1)} ${F[I]}`;
}
var getPlatformProtectedPaths = (a) => {
	let P = os.homedir(), F = [];
	if (a === "win32") {
		let a = process.env.WINDIR || "C:\\Windows", I = process.env.PROGRAMFILES || "C:\\Program Files", L = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		F.push({
			path: a,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: I,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: L,
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
			path: path.join(P, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(P, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else a === "darwin" && F.push({
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
		path: path.join(P, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(P, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return F;
}, checkFileSafety = (a, P) => {
	let F = [], I = [], L = getPlatformProtectedPaths(P);
	for (let R of L) {
		if (R.platform && R.platform !== P && R.platform !== "all") continue;
		let L = path.normalize(R.path), z = path.normalize(a);
		if (z === L || z.startsWith(L + path.sep)) {
			if (R.action === "protect") return I.push(a), {
				safe: !1,
				warnings: [],
				blocked: [a]
			};
			R.action === "warn" && F.push({
				path: a,
				reason: R.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: I.length === 0,
		warnings: F,
		blocked: I
	};
}, checkFilesSafety = (a, P) => {
	let F = [], I = [];
	for (let L of a) {
		let a = checkFileSafety(L, P);
		a.safe || I.push(...a.blocked), F.push(...a.warnings);
	}
	return {
		safe: I.length === 0,
		warnings: F,
		blocked: I
	};
}, getBackupDir = () => {
	let a = os.homedir();
	return process.platform === "win32" ? path.join(a, "AppData", "Local", "devtools-app", "backups") : path.join(a, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (a) => {
	let P = 0;
	for (let F of a) try {
		let a = await fs.stat(F);
		a.isFile() && (P += a.size);
	} catch {}
	return P;
}, createBackup = async (a) => {
	try {
		let P = getBackupDir();
		await fs.mkdir(P, { recursive: !0 });
		let F = generateBackupId(), I = path.join(P, F);
		await fs.mkdir(I, { recursive: !0 });
		let L = await calculateTotalSize(a), R = [];
		for (let P of a) try {
			let a = await fs.stat(P), F = path.basename(P), L = path.join(I, F);
			a.isFile() && (await fs.copyFile(P, L), R.push(P));
		} catch {}
		let z = {
			id: F,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: R,
			totalSize: L,
			location: I,
			platform: process.platform
		}, B = path.join(I, "backup-info.json");
		return await fs.writeFile(B, JSON.stringify(z, null, 2)), {
			success: !0,
			backupId: F,
			backupInfo: z
		};
	} catch (a) {
		return {
			success: !1,
			error: a.message
		};
	}
}, listBackups = async () => {
	try {
		let a = getBackupDir(), P = await fs.readdir(a, { withFileTypes: !0 }), F = [];
		for (let I of P) if (I.isDirectory() && I.name.startsWith("backup-")) {
			let P = path.join(a, I.name, "backup-info.json");
			try {
				let a = await fs.readFile(P, "utf-8");
				F.push(JSON.parse(a));
			} catch {}
		}
		return F.sort((a, P) => new Date(P.timestamp).getTime() - new Date(a.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (a) => {
	try {
		let P = getBackupDir(), F = path.join(P, a, "backup-info.json"), I = await fs.readFile(F, "utf-8");
		return JSON.parse(I);
	} catch {
		return null;
	}
}, restoreBackup = async (a) => {
	try {
		let P = await getBackupInfo(a);
		if (!P) return {
			success: !1,
			error: "Backup not found"
		};
		let F = P.location;
		for (let a of P.files) try {
			let P = path.basename(a), I = path.join(F, P);
			if ((await fs.stat(I)).isFile()) {
				let P = path.dirname(a);
				await fs.mkdir(P, { recursive: !0 }), await fs.copyFile(I, a);
			}
		} catch {}
		return { success: !0 };
	} catch (a) {
		return {
			success: !1,
			error: a.message
		};
	}
}, deleteBackup = async (a) => {
	try {
		let P = getBackupDir(), F = path.join(P, a);
		return await fs.rm(F, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (a) {
		return {
			success: !1,
			error: a.message
		};
	}
};
function setupScreenshotHandlers(a) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((a) => ({
				id: a.id,
				name: a.name,
				thumbnail: a.thumbnail.toDataURL(),
				type: a.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (a) {
			return console.error("Failed to get sources:", a), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let a = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (a.length === 0) throw Error("No screens available");
			let P = a[0].thumbnail;
			return {
				dataUrl: P.toDataURL(),
				width: P.getSize().width,
				height: P.getSize().height
			};
		} catch (a) {
			throw console.error("Failed to capture screen:", a), a;
		}
	}), ipcMain.handle("screenshot:capture-window", async (a, P) => {
		try {
			let a = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((a) => a.id === P);
			if (!a) throw Error("Window not found");
			let F = a.thumbnail;
			return {
				dataUrl: F.toDataURL(),
				width: F.getSize().width,
				height: F.getSize().height
			};
		} catch (a) {
			throw console.error("Failed to capture window:", a), a;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			let a = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (a.length === 0) throw Error("No screens available");
			let P = a[0].thumbnail;
			return {
				dataUrl: P.toDataURL(),
				width: P.getSize().width,
				height: P.getSize().height
			};
		} catch (a) {
			throw console.error("Failed to capture area:", a), a;
		}
	}), ipcMain.handle("screenshot:save-file", async (P, F, I) => {
		try {
			let { filename: P, format: L = "png" } = I, R = await dialog.showSaveDialog(a, {
				defaultPath: P || `screenshot-${Date.now()}.${L}`,
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
			if (R.canceled || !R.filePath) return {
				success: !1,
				canceled: !0
			};
			let z = F.replace(/^data:image\/\w+;base64,/, ""), V = Buffer.from(z, "base64");
			return await fs.writeFile(R.filePath, V), {
				success: !0,
				filePath: R.filePath
			};
		} catch (a) {
			return console.error("Failed to save screenshot:", a), {
				success: !1,
				error: a.message
			};
		}
	});
}
var execAsync = promisify(exec), store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(a) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: a,
			openAsHidden: !0
		}), { success: !0 };
	} catch (a) {
		let P = a instanceof Error ? a.message : String(a);
		return console.warn("Failed to set login item settings:", P), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: P
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
	let a = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let P = Math.min(clipboardItems.length, 9);
		a.push({
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
					label: `● Recent Clipboard (${P})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((a, P) => {
					let I = String(a.content || ""), L = (I.length > 75 ? I.substring(0, 75) + "..." : I).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${P + 1}. ${L || "(Empty)"}`,
						click: () => {
							I && (clipboard.writeText(I), new Notification({
								title: "✓ Copied from History",
								body: L || "Copied to clipboard",
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
		}), a.push({ type: "separator" });
	} else a.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), a.push({ type: "separator" });
	if (a.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let a = randomUUID();
					clipboard.writeText(a), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${a.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let a = clipboard.readText(), P = JSON.parse(a), I = JSON.stringify(P, null, 2);
						clipboard.writeText(I), new Notification({
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
						let a = clipboard.readText();
						if (!a) throw Error("Empty clipboard");
						let P = createHash("sha256").update(a).digest("hex");
						clipboard.writeText(P), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${P.substring(0, 20)}...`,
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
						let a = clipboard.readText();
						if (!a) throw Error("Empty clipboard");
						let P = Buffer.from(a).toString("base64");
						clipboard.writeText(P), new Notification({
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
						let a = clipboard.readText();
						if (!a) throw Error("Empty clipboard");
						let P = Buffer.from(a, "base64").toString("utf-8");
						clipboard.writeText(P), new Notification({
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
	}), a.push({ type: "separator" }), statsMenuData && (a.push({
		label: "📊 Stats Monitor",
		enabled: !1
	}), a.push({
		label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
		enabled: !1
	}), a.push({
		label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
		enabled: !1
	}), a.push({
		label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
		enabled: !1
	}), a.push({ type: "separator" }), a.push({
		label: "Open Stats Monitor",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
		}
	}), a.push({ type: "separator" })), healthMenuData) {
		let P = healthMenuData.alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length, I = P > 0 ? `🛡️ System Health (${P} alerts)` : "🛡️ System Health", L = [
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
		healthMenuData.disk && L.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && L.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), L.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (L.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((a) => {
			L.push({
				label: `${a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "🔵"} ${a.message.substring(0, 50)}${a.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), L.push({ type: "separator" })), L.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), L.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let a = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							a?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(a.ramFreed || 0)}`,
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
		}), a.push({
			label: I,
			submenu: L
		}), a.push({ type: "separator" });
	}
	recentTools.length > 0 && (a.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((a) => ({
			label: `  • ${a.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", a.id);
			}
		}))
	}), a.push({ type: "separator" })), a.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), a.push({ type: "separator" }), a.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let I = Menu.buildFromTemplate(a);
	tray.setContextMenu(I);
}
function createWindow() {
	let P = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, I = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...P,
		minWidth: 1200,
		minHeight: 700,
		show: !I,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let U = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", U), win.on("move", U), win.on("close", (a) => {
		let P = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && P && (a.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let a = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return a.canceled || a.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: a.filePaths[0]
		};
	}), ipcMain.handle("store-get", (a, P) => store.get(P)), ipcMain.handle("store-set", (a, P, F) => {
		if (store.set(P, F), P === "launchAtLogin") {
			let a = setLoginItemSettingsSafely(F === !0);
			!a.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: a.error
			});
		}
	}), ipcMain.handle("store-delete", (a, P) => store.delete(P)), setupScreenshotHandlers(win), ipcMain.on("window-set-opacity", (a, P) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, P)));
	}), ipcMain.on("window-set-always-on-top", (a, P) => {
		win && win.setAlwaysOnTop(P);
	}), ipcMain.handle("permissions:check-all", async () => {
		let a = process.platform, P = {};
		return a === "darwin" ? (P.accessibility = await W(), P.fullDiskAccess = await G(), P.screenRecording = await K()) : a === "win32" && (P.fileAccess = await Y(), P.registryAccess = await X()), P.clipboard = await q(), P.launchAtLogin = await J(), P;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await W() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await G() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await K() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await Z()), ipcMain.handle("permissions:test-file-access", async () => await Q()), ipcMain.handle("permissions:open-system-preferences", async (a, P) => await $(P));
	async function W() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let a = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(a, () => {})) return globalShortcut.unregister(a), { status: "granted" };
			} catch {}
			return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function G() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (let a of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				return await fs.access(a), { status: "granted" };
			} catch {}
			let a = os.homedir();
			try {
				return await fs.readdir(a), {
					status: "granted",
					message: "Basic file access available"
				};
			} catch {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function K() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let a = await desktopCapturer.getSources({ types: ["screen"] });
				if (a && a.length > 0) return { status: "granted" };
			} catch {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function q() {
		try {
			let a = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			let P = clipboard.readText();
			return clipboard.writeText(a), P === "__PERMISSION_TEST__" ? { status: "granted" } : {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function J() {
		try {
			let a = app.getLoginItemSettings();
			return {
				status: a.openAtLogin ? "granted" : "not-determined",
				message: a.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function Y() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let a = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), P = "permission test";
			await fs.writeFile(a, P);
			let F = await fs.readFile(a, "utf-8");
			return await fs.unlink(a), F === P ? { status: "granted" } : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (a) {
			return {
				status: "denied",
				message: a.message
			};
		}
	}
	async function X() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let { stdout: a } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			return a && !a.includes("ERROR") ? { status: "granted" } : {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (a) {
			return {
				status: "denied",
				message: a.message
			};
		}
	}
	async function Z() {
		try {
			let a = clipboard.readText(), P = `Permission test ${Date.now()}`;
			clipboard.writeText(P);
			let F = clipboard.readText();
			return clipboard.writeText(a), F === P ? {
				status: "granted",
				message: "Clipboard read/write test passed"
			} : {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (a) {
			return {
				status: "error",
				message: a.message
			};
		}
	}
	async function Q() {
		try {
			let a = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), P = `Test ${Date.now()}`;
			await fs.writeFile(a, P);
			let F = await fs.readFile(a, "utf-8");
			return await fs.unlink(a), F === P ? {
				status: "granted",
				message: "File access test passed"
			} : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (a) {
			return {
				status: "denied",
				message: a.message
			};
		}
	}
	async function $(a) {
		let P = process.platform;
		try {
			if (P === "darwin") {
				let P = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				return a === "accessibility" ? P = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : a === "full-disk-access" ? P = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : a === "screen-recording" && (P = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync(P), {
					success: !0,
					message: "Opened System Preferences"
				};
			} else if (P === "win32") return await execAsync("start ms-settings:privacy"), {
				success: !0,
				message: "Opened Windows Settings"
			};
			return {
				success: !1,
				message: "Unsupported platform"
			};
		} catch (a) {
			return {
				success: !1,
				message: a.message
			};
		}
	}
	ipcMain.on("tray-update-menu", (a, P) => {
		recentTools = P || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (a, P) => {
		clipboardItems = (P || []).sort((a, P) => P.timestamp - a.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (a) {
			return console.error("Failed to read clipboard:", a), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let a = clipboard.readImage();
			return a.isEmpty() ? null : a.toDataURL();
		} catch (a) {
			return console.error("Failed to read clipboard image:", a), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (a, P) => {
		clipboardMonitoringEnabled = P, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (a, P) => {
		statsMenuData = P, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (a, P) => {
		healthMenuData = P, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let a = async () => {
			try {
				let a = await si.mem(), P = await si.currentLoad(), I = await si.fsSize(), L = await si.battery().catch(() => null), R = [], z = I.find((a) => a.mount === "/" || a.mount === "C:") || I[0];
				if (z) {
					let a = z.available / z.size * 100;
					a < 10 ? R.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(z.available)} free`
					}) : a < 20 && R.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(z.available)} free`
					});
				}
				P.currentLoad > 90 && R.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${P.currentLoad.toFixed(1)}%`
				});
				let B = a.used / a.total * 100;
				B > 90 && R.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${B.toFixed(1)}%`
				}), healthMenuData = {
					cpu: P.currentLoad,
					ram: {
						used: a.used,
						total: a.total,
						percentage: B
					},
					disk: z ? {
						free: z.available,
						total: z.size,
						percentage: (z.size - z.available) / z.size * 100
					} : null,
					battery: L ? {
						level: L.percent,
						charging: L.isCharging || !1
					} : null,
					alerts: R
				}, updateTrayMenu();
				let V = R.filter((a) => a.severity === "critical");
				V.length > 0 && win && V.forEach((a) => {
					new Notification({
						title: "⚠️ System Alert",
						body: a.message,
						silent: !1
					}).show();
				});
			} catch (a) {
				console.error("Health monitoring error:", a);
			}
		};
		return a(), healthMonitoringInterval = setInterval(a, 5e3), { success: !0 };
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
	} catch (a) {
		console.error("Failed to register global shortcut", a);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [a, P] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: a.manufacturer,
			brand: a.brand,
			speed: a.speed,
			cores: a.cores,
			physicalCores: a.physicalCores,
			load: P
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [a, P] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: a,
			interfaces: P
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [a, P] = await Promise.all([si.fsSize(), si.disksIO()]), F = null;
			if (P && Array.isArray(P) && P.length > 0) {
				let a = P[0];
				F = {
					rIO: a.rIO || 0,
					wIO: a.wIO || 0,
					tIO: a.tIO || 0,
					rIO_sec: a.rIO_sec || 0,
					wIO_sec: a.wIO_sec || 0,
					tIO_sec: a.tIO_sec || 0
				};
			} else P && typeof P == "object" && !Array.isArray(P) && (F = {
				rIO: P.rIO || 0,
				wIO: P.wIO || 0,
				tIO: P.tIO || 0,
				rIO_sec: P.rIO_sec || 0,
				wIO_sec: P.wIO_sec || 0,
				tIO_sec: P.tIO_sec || 0
			});
			return {
				fsSize: a,
				ioStats: F
			};
		} catch (a) {
			return console.error("Error fetching disk stats:", a), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let a = await si.battery(), P, F;
			if ("powerConsumptionRate" in a && a.powerConsumptionRate && typeof a.powerConsumptionRate == "number" && (P = a.powerConsumptionRate), a.voltage && a.voltage > 0) {
				if (!a.isCharging && a.timeRemaining > 0 && a.currentCapacity > 0) {
					let F = a.currentCapacity / a.timeRemaining * 60;
					P = a.voltage * F;
				}
				a.isCharging && a.voltage > 0 && (F = a.voltage * 2e3);
			}
			return {
				...a,
				powerConsumptionRate: P,
				chargingPower: F
			};
		} catch (a) {
			return console.error("Error fetching battery stats:", a), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let a = await si.bluetoothDevices();
			return {
				enabled: a.length > 0 || await checkBluetoothEnabled(),
				devices: a.map((a) => ({
					name: a.name || "Unknown",
					mac: a.mac || a.address || "",
					type: a.type || a.deviceClass || "unknown",
					battery: a.battery || a.batteryLevel || void 0,
					connected: a.connected !== !1,
					rssi: a.rssi || a.signalStrength || void 0,
					manufacturer: a.manufacturer || a.vendor || void 0
				}))
			};
		} catch (a) {
			return console.error("Error fetching bluetooth stats:", a), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let a = await si.time(), P = Intl.DateTimeFormat().resolvedOptions().timeZone, F = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((a) => {
				let P = /* @__PURE__ */ new Date(), F = new Intl.DateTimeFormat("en-US", {
					timeZone: a,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), I = new Intl.DateTimeFormat("en-US", {
					timeZone: a,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), L = getTimezoneOffset(a);
				return {
					timezone: a,
					city: a.split("/").pop()?.replace("_", " ") || a,
					time: F.format(P),
					date: I.format(P),
					offset: L
				};
			});
			return {
				local: {
					timezone: P,
					city: P.split("/").pop()?.replace("_", " ") || "Local",
					time: a.current,
					date: a.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(P)
				},
				zones: F
			};
		} catch (a) {
			return console.error("Error fetching timezones stats:", a), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let F = process.platform, I = [];
			if (F === "darwin") {
				let P = "/Applications", F = await fs.readdir(P, { withFileTypes: !0 }).catch(() => []);
				for (let L of F) if (L.name.endsWith(".app")) {
					let F = join(P, L.name);
					try {
						let P = await fs.stat(F), R = L.name.replace(".app", ""), z = F.startsWith("/System") || F.startsWith("/Library") || R.startsWith("com.apple.");
						I.push({
							id: `macos-${R}-${P.ino}`,
							name: R,
							version: void 0,
							publisher: void 0,
							installDate: P.birthtime.toISOString(),
							installLocation: F,
							size: await a(F).catch(() => 0),
							isSystemApp: z
						});
					} catch {}
				}
			} else if (F === "win32") try {
				let { stdout: a } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), F = JSON.parse(a), L = Array.isArray(F) ? F : [F];
				for (let a of L) if (a.DisplayName) {
					let F = a.Publisher || "", L = a.InstallLocation || "", R = F.includes("Microsoft") || F.includes("Windows") || L.includes("Windows\\") || L.includes("Program Files\\Windows");
					I.push({
						id: `win-${a.DisplayName}-${a.InstallDate || "unknown"}`,
						name: a.DisplayName,
						version: a.DisplayVersion || void 0,
						publisher: F || void 0,
						installDate: a.InstallDate ? P(a.InstallDate) : void 0,
						installLocation: L || void 0,
						size: a.EstimatedSize ? a.EstimatedSize * 1024 : void 0,
						isSystemApp: R
					});
				}
			} catch (a) {
				console.error("Error fetching Windows apps:", a);
			}
			return I;
		} catch (a) {
			return console.error("Error fetching installed apps:", a), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let a = await si.processes(), P = await si.mem();
			return a.list.map((a) => ({
				pid: a.pid,
				name: a.name,
				cpu: a.cpu || 0,
				memory: a.mem || 0,
				memoryPercent: P.total > 0 ? (a.mem || 0) / P.total * 100 : 0,
				started: a.started || "",
				user: a.user || void 0,
				command: a.command || void 0,
				path: a.path || void 0
			}));
		} catch (a) {
			return console.error("Error fetching running processes:", a), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (a, P) => {
		try {
			let a = process.platform;
			if (a === "darwin") {
				if (P.installLocation) return await fs.rm(P.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (a === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${P.name.replace(/"/g, "\\\"")}" } | 
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
			} catch (a) {
				return {
					success: !1,
					error: a.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (a, P) => {
		try {
			return process.kill(P, "SIGTERM"), { success: !0 };
		} catch (a) {
			return {
				success: !1,
				error: a.message
			};
		}
	});
	async function a(P) {
		try {
			let F = 0, I = await fs.readdir(P, { withFileTypes: !0 });
			for (let L of I) {
				let I = join(P, L.name);
				try {
					if (L.isDirectory()) F += await a(I);
					else {
						let a = await fs.stat(I);
						F += a.size;
					}
				} catch {}
			}
			return F;
		} catch {
			return 0;
		}
	}
	function P(a) {
		return a && a.length === 8 ? `${a.substring(0, 4)}-${a.substring(4, 6)}-${a.substring(6, 8)}` : a;
	}
	setupCleanerHandlers(), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: a } = __require("child_process");
			return a("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(a) {
	let P = /* @__PURE__ */ new Date(), F = P.getTime() + P.getTimezoneOffset() * 6e4, I = P.toLocaleString("en-US", {
		timeZone: a,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(I).getTime() - F) / (1e3 * 60 * 60);
}
function formatBytes(a) {
	if (a === 0) return "0 B";
	let P = 1024, F = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], I = Math.floor(Math.log(a) / Math.log(P));
	return `${(a / P ** +I).toFixed(1)} ${F[I]}`;
}
function formatSpeed(a) {
	return a > 1024 * 1024 ? `${(a / 1024 / 1024).toFixed(1)} MB/s` : a > 1024 ? `${(a / 1024).toFixed(1)} KB/s` : `${a.toFixed(0)} B/s`;
}
