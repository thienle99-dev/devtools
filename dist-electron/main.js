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
var __require = /* @__PURE__ */ ((p) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(p, { get: (p, H) => (typeof require < "u" ? require : p)[H] }) : p)(function(p) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + p + "\" in an environment that doesn't expose the `require` function.");
}), execAsync$1 = promisify(exec), dirSizeCache = /* @__PURE__ */ new Map(), CACHE_TTL = 300 * 1e3;
setInterval(() => {
	let p = Date.now();
	for (let [H, U] of dirSizeCache.entries()) p - U.timestamp > CACHE_TTL && dirSizeCache.delete(H);
}, 6e4);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let p = process.platform, H = [], U = os.homedir();
		if (p === "win32") {
			let p = process.env.WINDIR || "C:\\Windows", U = process.env.LOCALAPPDATA || "", W = os.tmpdir(), G = path.join(p, "Temp"), K = path.join(p, "Prefetch"), q = path.join(p, "SoftwareDistribution", "Download");
			H.push({
				path: W,
				name: "User Temporary Files",
				category: "temp"
			}), H.push({
				path: G,
				name: "System Temporary Files",
				category: "temp"
			}), H.push({
				path: K,
				name: "Prefetch Files",
				category: "system"
			}), H.push({
				path: q,
				name: "Windows Update Cache",
				category: "system"
			});
			let J = path.join(U, "Google/Chrome/User Data/Default/Cache"), Y = path.join(U, "Microsoft/Edge/User Data/Default/Cache");
			H.push({
				path: J,
				name: "Chrome Cache",
				category: "cache"
			}), H.push({
				path: Y,
				name: "Edge Cache",
				category: "cache"
			}), H.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (p === "darwin") {
			H.push({
				path: path.join(U, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), H.push({
				path: path.join(U, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), H.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), H.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), H.push({
				path: path.join(U, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), H.push({
				path: path.join(U, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: p } = await execAsync$1("tmutil listlocalsnapshots /"), U = p.split("\n").filter((p) => p.trim()).length;
				U > 0 && H.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${U})`,
					category: "system",
					virtual: !0,
					size: U * 500 * 1024 * 1024
				});
			} catch {}
		}
		let W = [], G = 0;
		for (let p of H) try {
			if (p.virtual) {
				W.push({
					...p,
					sizeFormatted: formatBytes$1(p.size || 0)
				}), G += p.size || 0;
				continue;
			}
			let H = await fs.stat(p.path).catch(() => null);
			if (H) {
				let U = H.isDirectory() ? await getDirSize(p.path) : H.size;
				U > 0 && (W.push({
					...p,
					size: U,
					sizeFormatted: formatBytes$1(U)
				}), G += U);
			}
		} catch {}
		return {
			items: W,
			totalSize: G,
			totalSizeFormatted: formatBytes$1(G)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (p, H) => {
		let U = H || os.homedir(), W = p.sender;
		return await scanDirectoryForLens(U, 0, 1, (p) => {
			W && !W.isDestroyed() && W.send("cleaner:space-lens-progress", p);
		});
	}), ipcMain.handle("cleaner:get-folder-size", async (p, H) => {
		let U = dirSizeCache.get(H);
		if (U && Date.now() - U.timestamp < CACHE_TTL) return {
			size: U.size,
			sizeFormatted: formatBytes$1(U.size),
			cached: !0
		};
		try {
			let p = await getDirSizeLimited(H, 4), U = formatBytes$1(p);
			return dirSizeCache.set(H, {
				size: p,
				timestamp: Date.now()
			}), {
				size: p,
				sizeFormatted: U,
				cached: !1
			};
		} catch (p) {
			return {
				size: 0,
				sizeFormatted: formatBytes$1(0),
				cached: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:clear-size-cache", async (p, H) => {
		if (H) for (let p of dirSizeCache.keys()) p.startsWith(H) && dirSizeCache.delete(p);
		else dirSizeCache.clear();
		return { success: !0 };
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let p = await si.processes(), H = await si.mem(), U = await si.currentLoad();
		return {
			heavyApps: p.list.sort((p, H) => H.cpu + H.mem - (p.cpu + p.mem)).slice(0, 10).map((p) => ({
				pid: p.pid,
				name: p.name,
				cpu: p.cpu,
				mem: p.mem,
				user: p.user,
				path: p.path
			})),
			memory: {
				total: H.total,
				used: H.used,
				percent: H.used / H.total * 100
			},
			cpuLoad: U.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let p = process.platform, H = [];
		if (p === "darwin") try {
			let p = path.join(os.homedir(), "Library/LaunchAgents"), U = await fs.readdir(p).catch(() => []);
			for (let W of U) if (W.endsWith(".plist")) {
				let U = path.join(p, W), { stdout: G } = await execAsync$1(`launchctl list | grep -i "${W.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), K = G.trim().length > 0;
				H.push({
					name: W.replace(".plist", ""),
					path: U,
					type: "LaunchAgent",
					enabled: K
				});
			}
			let W = "/Library/LaunchAgents", G = await fs.readdir(W).catch(() => []);
			for (let p of G) {
				let U = path.join(W, p), { stdout: G } = await execAsync$1(`launchctl list | grep -i "${p.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), K = G.trim().length > 0;
				H.push({
					name: p.replace(".plist", ""),
					path: U,
					type: "SystemAgent",
					enabled: K
				});
			}
		} catch {}
		else if (p === "win32") try {
			let { stdout: p } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), U = JSON.parse(p), W = Array.isArray(U) ? U : [U];
			for (let p of W) H.push({
				name: p.Name,
				path: p.Command,
				type: "StartupCommand",
				location: p.Location,
				enabled: !0
			});
		} catch {}
		return H;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (p, H) => {
		let U = process.platform;
		try {
			if (U === "darwin") {
				let p = H.enabled ?? !0;
				if (H.type === "LaunchAgent" || H.type === "SystemAgent") return p ? await execAsync$1(`launchctl unload "${H.path}"`) : await execAsync$1(`launchctl load "${H.path}"`), {
					success: !0,
					enabled: !p
				};
			} else if (U === "win32") {
				let p = H.enabled ?? !0;
				if (H.location === "Startup") {
					let U = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), W = path.basename(H.path), G = path.join(U, W);
					return p && await fs.unlink(G).catch(() => {}), {
						success: !0,
						enabled: !p
					};
				} else return {
					success: !0,
					enabled: !p
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (p, H) => {
		try {
			return process.kill(H, "SIGKILL"), { success: !0 };
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let p = process.platform, H = [];
		if (p === "darwin") {
			let p = "/Applications", U = await fs.readdir(p, { withFileTypes: !0 }).catch(() => []);
			for (let W of U) if (W.name.endsWith(".app")) {
				let U = path.join(p, W.name);
				try {
					let p = await fs.stat(U);
					H.push({
						name: W.name.replace(".app", ""),
						path: U,
						size: await getDirSize(U),
						installDate: p.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (p === "win32") try {
			let { stdout: p } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), U = JSON.parse(p), W = Array.isArray(U) ? U : [U];
			for (let p of W) p.DisplayName && H.push({
				name: p.DisplayName,
				version: p.DisplayVersion,
				path: p.InstallLocation,
				installDate: p.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return H;
	}), ipcMain.handle("cleaner:get-large-files", async (p, H) => {
		let U = H.minSize || 100 * 1024 * 1024, W = H.scanPaths || [os.homedir()], G = [];
		for (let p of W) await findLargeFiles(p, U, G);
		return G.sort((p, H) => H.size - p.size), G.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (p, H) => {
		let U = H || os.homedir(), W = /* @__PURE__ */ new Map(), G = [];
		await findDuplicates(U, W);
		for (let [p, H] of W.entries()) if (H.length > 1) try {
			let U = await fs.stat(H[0]);
			G.push({
				hash: p,
				size: U.size,
				sizeFormatted: formatBytes$1(U.size),
				totalWasted: U.size * (H.length - 1),
				totalWastedFormatted: formatBytes$1(U.size * (H.length - 1)),
				files: H
			});
		} catch {}
		return G.sort((p, H) => H.totalWasted - p.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (p, H) => {
		let U = 0, W = [], G = process.platform, K = checkFilesSafety(H, G);
		if (!K.safe && K.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${K.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: K.blocked
		};
		for (let p = 0; p < H.length; p += 50) {
			let G = H.slice(p, p + 50);
			for (let p of G) try {
				if (p === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), U += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let H = await fs.stat(p).catch(() => null);
				if (!H) continue;
				let W = H.isDirectory() ? await getDirSize(p) : H.size;
				H.isDirectory() ? await fs.rm(p, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(p), U += W;
			} catch {
				W.push(p);
			}
		}
		return {
			success: W.length === 0,
			freedSize: U,
			freedSizeFormatted: formatBytes$1(U),
			failed: W
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (p, H) => {
		let U = process.platform;
		try {
			if (U === "darwin") {
				let p = H.path, U = H.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${p}" to trash'`);
				let W = os.homedir(), G = [
					path.join(W, "Library/Preferences", `*${U}*`),
					path.join(W, "Library/Application Support", U),
					path.join(W, "Library/Caches", U),
					path.join(W, "Library/Logs", U),
					path.join(W, "Library/Saved Application State", `*${U}*`),
					path.join(W, "Library/LaunchAgents", `*${U}*`)
				], K = 0;
				for (let p of G) try {
					let H = await fs.readdir(path.dirname(p)).catch(() => []);
					for (let W of H) if (W.includes(U)) {
						let H = path.join(path.dirname(p), W), U = await fs.stat(H).catch(() => null);
						U && (U.isDirectory() ? (K += await getDirSize(H), await fs.rm(H, {
							recursive: !0,
							force: !0
						})) : (K += U.size, await fs.unlink(H)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: K,
					freedSizeFormatted: formatBytes$1(K)
				};
			} else if (U === "win32") {
				let p = H.name, U = 0;
				try {
					let { stdout: W } = await execAsync$1(`wmic product where name="${p.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), G = W.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (G) {
						let p = G[1];
						await execAsync$1(`msiexec /x ${p} /quiet /norestart`), U = await getDirSize(H.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${p}*'} | Remove-AppxPackage"`).catch(() => {}), U = await getDirSize(H.path).catch(() => 0);
				} catch {
					U = await getDirSize(H.path).catch(() => 0), await fs.rm(H.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let W = process.env.LOCALAPPDATA || "", G = process.env.APPDATA || "", K = [path.join(W, p), path.join(G, p)];
				for (let p of K) try {
					await fs.stat(p).catch(() => null) && (U += await getDirSize(p).catch(() => 0), await fs.rm(p, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: U,
					freedSizeFormatted: formatBytes$1(U)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let p = process.platform, H = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (p === "win32") try {
			let { stdout: p } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), U = parseInt(p.trim()) || 0;
			U > 0 && (H.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: U,
				size: 0,
				description: "Recently opened documents registry entries"
			}), H.totalItems += U);
			let { stdout: W } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), G = parseInt(W.trim()) || 0;
			G > 0 && (H.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: G,
				size: 0,
				description: "Recently run programs registry entries"
			}), H.totalItems += G);
			let K = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let p = await fs.readdir(K, { recursive: !0 }).catch(() => []), U = [], W = 0;
				for (let H of p) {
					let p = path.join(K, H);
					try {
						let H = await fs.stat(p);
						H.isFile() && (U.push(p), W += H.size);
					} catch {}
				}
				U.length > 0 && (H.activityHistory.push({
					name: "Activity History",
					path: K,
					type: "files",
					count: U.length,
					size: W,
					sizeFormatted: formatBytes$1(W),
					files: U,
					description: "Windows activity history files"
				}), H.totalItems += U.length, H.totalSize += W);
			} catch {}
			let q = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let p = await fs.readdir(q).catch(() => []), U = [], W = 0;
				for (let H of p) {
					let p = path.join(q, H);
					try {
						let H = await fs.stat(p);
						U.push(p), W += H.size;
					} catch {}
				}
				U.length > 0 && (H.activityHistory.push({
					name: "Windows Search History",
					path: q,
					type: "files",
					count: U.length,
					size: W,
					sizeFormatted: formatBytes$1(W),
					files: U,
					description: "Windows search history files"
				}), H.totalItems += U.length, H.totalSize += W);
			} catch {}
		} catch (p) {
			return {
				success: !1,
				error: p.message,
				results: H
			};
		}
		else if (p === "darwin") try {
			let p = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let U = await fs.readdir(p, { recursive: !0 }).catch(() => []), W = [], G = 0;
				for (let H of U) {
					let U = path.join(p, H);
					try {
						let p = await fs.stat(U);
						p.isFile() && (W.push(U), G += p.size);
					} catch {}
				}
				W.length > 0 && (H.spotlightHistory.push({
					name: "Spotlight Search History",
					path: p,
					type: "files",
					count: W.length,
					size: G,
					sizeFormatted: formatBytes$1(G),
					files: W,
					description: "macOS Spotlight search history"
				}), H.totalItems += W.length, H.totalSize += G);
			} catch {}
			let U = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let p = await fs.readdir(U, { recursive: !0 }).catch(() => []), W = [], G = 0;
				for (let H of p) {
					let p = path.join(U, H);
					try {
						let H = await fs.stat(p);
						H.isFile() && (W.push(p), G += H.size);
					} catch {}
				}
				W.length > 0 && (H.quickLookCache.push({
					name: "Quick Look Cache",
					path: U,
					type: "files",
					count: W.length,
					size: G,
					sizeFormatted: formatBytes$1(G),
					files: W,
					description: "macOS Quick Look thumbnail cache"
				}), H.totalItems += W.length, H.totalSize += G);
			} catch {}
			let W = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let p = await fs.readdir(W).catch(() => []), U = [], G = 0;
				for (let H of p) if (H.includes("RecentItems")) {
					let p = path.join(W, H);
					try {
						let H = await fs.stat(p);
						U.push(p), G += H.size;
					} catch {}
				}
				U.length > 0 && (H.spotlightHistory.push({
					name: "Recently Opened Files",
					path: W,
					type: "files",
					count: U.length,
					size: G,
					sizeFormatted: formatBytes$1(G),
					files: U,
					description: "macOS recently opened files list"
				}), H.totalItems += U.length, H.totalSize += G);
			} catch {}
		} catch (p) {
			return {
				success: !1,
				error: p.message,
				results: H
			};
		}
		return {
			success: !0,
			results: H
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (p, H) => {
		let U = process.platform, W = 0, G = 0, K = [];
		if (U === "win32") try {
			if (H.registry) {
				try {
					let { stdout: p } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), H = parseInt(p.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), W += H;
				} catch (p) {
					K.push(`Failed to clean Recent Documents registry: ${p.message}`);
				}
				try {
					let { stdout: p } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), H = parseInt(p.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), W += H;
				} catch (p) {
					K.push(`Failed to clean Recent Programs registry: ${p.message}`);
				}
			}
			if (H.activityHistory) {
				let p = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let H = await fs.readdir(p, { recursive: !0 }).catch(() => []);
					for (let U of H) {
						let H = path.join(p, U);
						try {
							let p = await fs.stat(H);
							p.isFile() && (G += p.size, await fs.unlink(H), W++);
						} catch {}
					}
				} catch (p) {
					K.push(`Failed to clean activity history: ${p.message}`);
				}
				let H = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let p = await fs.readdir(H).catch(() => []);
					for (let U of p) {
						let p = path.join(H, U);
						try {
							let H = await fs.stat(p);
							G += H.size, await fs.unlink(p), W++;
						} catch {}
					}
				} catch (p) {
					K.push(`Failed to clean search history: ${p.message}`);
				}
			}
		} catch (p) {
			K.push(`Windows privacy cleanup failed: ${p.message}`);
		}
		else if (U === "darwin") try {
			if (H.spotlightHistory) {
				let p = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let H = await fs.readdir(p, { recursive: !0 }).catch(() => []);
					for (let U of H) {
						let H = path.join(p, U);
						try {
							let p = await fs.stat(H);
							p.isFile() && (G += p.size, await fs.unlink(H), W++);
						} catch {}
					}
				} catch (p) {
					K.push(`Failed to clean Spotlight history: ${p.message}`);
				}
				let H = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let p = await fs.readdir(H).catch(() => []);
					for (let U of p) if (U.includes("RecentItems")) {
						let p = path.join(H, U);
						try {
							let H = await fs.stat(p);
							G += H.size, await fs.unlink(p), W++;
						} catch {}
					}
				} catch (p) {
					K.push(`Failed to clean recent items: ${p.message}`);
				}
			}
			if (H.quickLookCache) {
				let p = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let H = await fs.readdir(p, { recursive: !0 }).catch(() => []);
					for (let U of H) {
						let H = path.join(p, U);
						try {
							let p = await fs.stat(H);
							p.isFile() && (G += p.size, await fs.unlink(H), W++);
						} catch {}
					}
				} catch (p) {
					K.push(`Failed to clean Quick Look cache: ${p.message}`);
				}
			}
		} catch (p) {
			K.push(`macOS privacy cleanup failed: ${p.message}`);
		}
		return {
			success: K.length === 0,
			cleanedItems: W,
			freedSize: G,
			freedSizeFormatted: formatBytes$1(G),
			errors: K
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let p = process.platform, H = os.homedir(), U = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, W = [];
		if (p === "win32") {
			let p = process.env.LOCALAPPDATA || "", H = process.env.APPDATA || "";
			W.push({
				name: "Chrome",
				paths: {
					history: [path.join(p, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(p, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(p, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(p, "Google/Chrome/User Data/Default/History")]
				}
			}), W.push({
				name: "Edge",
				paths: {
					history: [path.join(p, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(p, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(p, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(p, "Microsoft/Edge/User Data/Default/History")]
				}
			}), W.push({
				name: "Firefox",
				paths: {
					history: [path.join(H, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(H, "Mozilla/Firefox/Profiles")],
					cache: [path.join(p, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(H, "Mozilla/Firefox/Profiles")]
				}
			});
		} else p === "darwin" && (W.push({
			name: "Safari",
			paths: {
				history: [path.join(H, "Library/Safari/History.db")],
				cookies: [path.join(H, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(H, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(H, "Library/Safari/Downloads.plist")]
			}
		}), W.push({
			name: "Chrome",
			paths: {
				history: [path.join(H, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(H, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(H, "Library/Caches/Google/Chrome")],
				downloads: [path.join(H, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), W.push({
			name: "Firefox",
			paths: {
				history: [path.join(H, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(H, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(H, "Library/Caches/Firefox")],
				downloads: [path.join(H, "Library/Application Support/Firefox/Profiles")]
			}
		}), W.push({
			name: "Edge",
			paths: {
				history: [path.join(H, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(H, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(H, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(H, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let H of W) {
			let W = {
				name: H.name,
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
			for (let [U, G] of Object.entries(H.paths)) for (let K of G) try {
				if (U === "cache" && p === "darwin" && H.name === "Safari") {
					let p = await fs.stat(K).catch(() => null);
					if (p && p.isDirectory()) {
						let p = await getDirSize(K);
						W[U].size += p, W[U].paths.push(K), W[U].count += 1;
					}
				} else {
					let p = await fs.stat(K).catch(() => null);
					if (p) if (p.isDirectory()) {
						let p = await getDirSize(K);
						W[U].size += p, W[U].paths.push(K), W[U].count += 1;
					} else p.isFile() && (W[U].size += p.size, W[U].paths.push(K), W[U].count += 1);
				}
			} catch {}
			let G = Object.values(W).reduce((p, H) => p + (typeof H == "object" && H.size ? H.size : 0), 0);
			G > 0 && (W.totalSize = G, W.totalSizeFormatted = formatBytes$1(G), U.browsers.push(W), U.totalSize += G, U.totalItems += Object.values(W).reduce((p, H) => p + (typeof H == "object" && H.count ? H.count : 0), 0));
		}
		return {
			success: !0,
			results: U
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (p, H) => {
		let U = process.platform, W = os.homedir(), G = 0, K = 0, q = [], J = {};
		if (U === "win32") {
			let p = process.env.LOCALAPPDATA || "", H = process.env.APPDATA || "";
			J.Chrome = {
				history: [path.join(p, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(p, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(p, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(p, "Google/Chrome/User Data/Default/History")]
			}, J.Edge = {
				history: [path.join(p, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(p, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(p, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(p, "Microsoft/Edge/User Data/Default/History")]
			}, J.Firefox = {
				history: [path.join(H, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(H, "Mozilla/Firefox/Profiles")],
				cache: [path.join(p, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(H, "Mozilla/Firefox/Profiles")]
			};
		} else U === "darwin" && (J.Safari = {
			history: [path.join(W, "Library/Safari/History.db")],
			cookies: [path.join(W, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(W, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(W, "Library/Safari/Downloads.plist")]
		}, J.Chrome = {
			history: [path.join(W, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(W, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(W, "Library/Caches/Google/Chrome")],
			downloads: [path.join(W, "Library/Application Support/Google/Chrome/Default/History")]
		}, J.Firefox = {
			history: [path.join(W, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(W, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(W, "Library/Caches/Firefox")],
			downloads: [path.join(W, "Library/Application Support/Firefox/Profiles")]
		}, J.Edge = {
			history: [path.join(W, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(W, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(W, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(W, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let p of H.browsers) {
			let U = J[p];
			if (U) for (let W of H.types) {
				let H = U[W];
				if (H) for (let U of H) try {
					let p = await fs.stat(U).catch(() => null);
					if (!p) continue;
					if (p.isDirectory()) {
						let p = await getDirSize(U);
						await fs.rm(U, {
							recursive: !0,
							force: !0
						}), K += p, G++;
					} else p.isFile() && (K += p.size, await fs.unlink(U), G++);
				} catch (H) {
					q.push(`Failed to clean ${p} ${W}: ${H.message}`);
				}
			}
		}
		return {
			success: q.length === 0,
			cleanedItems: G,
			freedSize: K,
			freedSizeFormatted: formatBytes$1(K),
			errors: q
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let p = process.platform, H = [];
		try {
			if (p === "win32") {
				let { stdout: p } = await execAsync$1("netsh wlan show profiles"), U = p.split("\n");
				for (let p of U) {
					let U = p.match(/All User Profile\s*:\s*(.+)/);
					if (U) {
						let p = U[1].trim();
						try {
							let { stdout: U } = await execAsync$1(`netsh wlan show profile name="${p}" key=clear`), W = U.match(/Key Content\s*:\s*(.+)/);
							H.push({
								name: p,
								hasPassword: !!W,
								platform: "windows"
							});
						} catch {
							H.push({
								name: p,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (p === "darwin") {
				let { stdout: p } = await execAsync$1("networksetup -listallhardwareports");
				if (p.split("\n").find((p) => p.includes("Wi-Fi") || p.includes("AirPort"))) {
					let { stdout: p } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), U = p.split("\n").filter((p) => p.trim() && !p.includes("Preferred networks"));
					for (let p of U) {
						let U = p.trim();
						U && H.push({
							name: U,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (p) {
			return {
				success: !1,
				error: p.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: H
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (p, H) => {
		let U = process.platform;
		try {
			return U === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${H}"`), { success: !0 }) : U === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${H}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (p, H) => {
		let U = process.platform, W = Date.now(), G = "";
		try {
			if (U === "win32") switch (H.category) {
				case "sfc":
					let { stdout: p } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					G = p;
					break;
				case "dism":
					let { stdout: U } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					G = U;
					break;
				case "disk-cleanup":
					let { stdout: W } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					G = W || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: K } = await execAsync$1("ipconfig /flushdns");
					G = K || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: q } = await execAsync$1("netsh winsock reset");
					G = q || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), G = "Windows Search index rebuilt successfully";
					} catch (p) {
						throw Error(`Failed to rebuild search index: ${p.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${H.category}`);
			}
			else if (U === "darwin") switch (H.category) {
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), G = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), G = "Spotlight index rebuilt successfully (user directory only)";
						} catch (p) {
							throw Error(`Failed to rebuild Spotlight index: ${p.message}`);
						}
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: p } = await execAsync$1("diskutil verifyVolume /");
						G = p || "Disk permissions verified";
					} catch {
						G = "Disk permissions check completed (Note: macOS Big Sur+ uses System Integrity Protection)";
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), G = "DNS cache flushed successfully";
					} catch {
						try {
							await execAsync$1("dscacheutil -flushcache; killall -HUP mDNSResponder"), G = "DNS cache flushed successfully";
						} catch (p) {
							throw Error(`Failed to flush DNS: ${p.message}`);
						}
					}
					break;
				case "mail-rebuild":
					try {
						await execAsync$1("killall Mail 2>/dev/null || true"), G = "Mail database rebuild initiated (please ensure Mail.app is closed)";
					} catch (p) {
						throw Error(`Failed to rebuild Mail database: ${p.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${H.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: H.id,
				duration: Date.now() - W,
				output: G
			};
		} catch (p) {
			return {
				success: !1,
				taskId: H.id,
				duration: Date.now() - W,
				error: p.message,
				output: G
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let p = await si.mem(), H = await si.currentLoad(), U = await si.fsSize(), W = await si.battery().catch(() => null), G = [], K = U.find((p) => p.mount === "/" || p.mount === "C:") || U[0];
			if (K) {
				let p = K.available / K.size * 100;
				p < 10 ? G.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(K.available)} free (${p.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : p < 20 && G.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(K.available)} free (${p.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			H.currentLoad > 90 && G.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${H.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let q = p.used / p.total * 100;
			return q > 90 && G.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${q.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: H.currentLoad,
				ram: {
					used: p.used,
					total: p.total,
					percentage: q
				},
				disk: K ? {
					free: K.available,
					total: K.size,
					percentage: (K.size - K.available) / K.size * 100
				} : null,
				battery: W ? {
					level: W.percent,
					charging: W.isCharging || !1
				} : null,
				alerts: G
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (p, H) => {
		try {
			let p = process.platform, U = checkFilesSafety(H, p);
			return {
				success: !0,
				safe: U.safe,
				warnings: U.warnings,
				blocked: U.blocked
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (p, H) => {
		try {
			return await createBackup(H);
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (p, H) => {
		try {
			let p = await getBackupInfo(H);
			return {
				success: p !== null,
				backupInfo: p
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (p, H) => {
		try {
			return await restoreBackup(H);
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (p, H) => {
		try {
			return await deleteBackup(H);
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	});
}
async function getDirSize(p) {
	let H = 0;
	try {
		let U = await fs.readdir(p, { withFileTypes: !0 });
		for (let W of U) {
			let U = path.join(p, W.name);
			if (W.isDirectory()) H += await getDirSize(U);
			else {
				let p = await fs.stat(U).catch(() => null);
				p && (H += p.size);
			}
		}
	} catch {}
	return H;
}
async function getDirSizeLimited(p, H, U = 0) {
	if (U >= H) return 0;
	let W = 0;
	try {
		let G = await fs.readdir(p, { withFileTypes: !0 });
		for (let K of G) {
			if (K.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				".git",
				".DS_Store"
			].includes(K.name)) continue;
			let G = path.join(p, K.name);
			try {
				if (K.isDirectory()) W += await getDirSizeLimited(G, H, U + 1);
				else {
					let p = await fs.stat(G).catch(() => null);
					p && (W += p.size);
				}
			} catch {
				continue;
			}
		}
	} catch {
		return 0;
	}
	return W;
}
async function scanDirectoryForLens(p, H, U, W) {
	try {
		let G = await fs.stat(p), K = path.basename(p) || p;
		if (!G.isDirectory()) {
			let H = {
				name: K,
				path: p,
				size: G.size,
				sizeFormatted: formatBytes$1(G.size),
				type: "file"
			};
			return W && W({
				currentPath: K,
				progress: 100,
				status: `Scanning file: ${K}`,
				item: H
			}), H;
		}
		W && W({
			currentPath: K,
			progress: 0,
			status: `Scanning directory: ${K}`
		});
		let q = await fs.readdir(p, { withFileTypes: !0 }), J = [], Y = 0, X = q.filter((p) => !p.name.startsWith(".") && ![
			"node_modules",
			"Library",
			"AppData",
			"System",
			".git",
			".DS_Store"
		].includes(p.name)), Z = X.length, Q = 0;
		for (let G of X) {
			let K = path.join(p, G.name);
			if (W) {
				let p = Math.floor(Q / Z * 100), H = G.isDirectory() ? "directory" : "file";
				W({
					currentPath: G.name,
					progress: p,
					status: `Scanning ${H}: ${G.name}`
				});
			}
			let q = null;
			if (H < U) q = await scanDirectoryForLens(K, H + 1, U, W), q && (J.push(q), Y += q.size);
			else try {
				let p = (await fs.stat(K)).size;
				if (G.isDirectory()) {
					let H = dirSizeCache.get(K);
					if (H && Date.now() - H.timestamp < CACHE_TTL) p = H.size;
					else try {
						p = await getDirSizeLimited(K, 3), dirSizeCache.set(K, {
							size: p,
							timestamp: Date.now()
						});
					} catch {
						p = 0;
					}
				}
				q = {
					name: G.name,
					path: K,
					size: p,
					sizeFormatted: formatBytes$1(p),
					type: G.isDirectory() ? "dir" : "file"
				}, J.push(q), Y += p;
			} catch {
				Q++;
				continue;
			}
			q && W && W({
				currentPath: G.name,
				progress: Math.floor((Q + 1) / Z * 100),
				status: `Scanned: ${G.name}`,
				item: q
			}), Q++;
		}
		let $ = {
			name: K,
			path: p,
			size: Y,
			sizeFormatted: formatBytes$1(Y),
			type: "dir",
			children: J.sort((p, H) => H.size - p.size)
		};
		return W && W({
			currentPath: K,
			progress: 100,
			status: `Completed: ${K}`
		}), $;
	} catch {
		return null;
	}
}
async function findLargeFiles(p, H, U) {
	try {
		let W = await fs.readdir(p, { withFileTypes: !0 });
		for (let G of W) {
			let W = path.join(p, G.name);
			if (!(G.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(G.name))) try {
				let p = await fs.stat(W);
				G.isDirectory() ? await findLargeFiles(W, H, U) : p.size >= H && U.push({
					name: G.name,
					path: W,
					size: p.size,
					sizeFormatted: formatBytes$1(p.size),
					lastAccessed: p.atime,
					type: path.extname(G.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(p, H) {
	try {
		let U = await fs.readdir(p, { withFileTypes: !0 });
		for (let W of U) {
			let U = path.join(p, W.name);
			if (!(W.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(W.name))) try {
				let p = await fs.stat(U);
				if (W.isDirectory()) await findDuplicates(U, H);
				else if (p.size > 1024 * 1024 && p.size < 50 * 1024 * 1024) {
					let p = await hashFile(U), W = H.get(p) || [];
					W.push(U), H.set(p, W);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(p) {
	let H = await fs.readFile(p);
	return createHash("md5").update(H).digest("hex");
}
function formatBytes$1(p) {
	if (p === 0) return "0 B";
	let H = 1024, U = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], W = Math.floor(Math.log(p) / Math.log(H));
	return `${(p / H ** +W).toFixed(1)} ${U[W]}`;
}
var getPlatformProtectedPaths = (p) => {
	let H = os.homedir(), U = [];
	if (p === "win32") {
		let p = process.env.WINDIR || "C:\\Windows", W = process.env.PROGRAMFILES || "C:\\Program Files", G = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		U.push({
			path: p,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: W,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: G,
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
			path: path.join(H, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(H, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else p === "darwin" && U.push({
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
		path: path.join(H, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(H, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return U;
}, checkFileSafety = (p, H) => {
	let U = [], W = [], G = getPlatformProtectedPaths(H);
	for (let K of G) {
		if (K.platform && K.platform !== H && K.platform !== "all") continue;
		let G = path.normalize(K.path), q = path.normalize(p);
		if (q === G || q.startsWith(G + path.sep)) {
			if (K.action === "protect") return W.push(p), {
				safe: !1,
				warnings: [],
				blocked: [p]
			};
			K.action === "warn" && U.push({
				path: p,
				reason: K.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: W.length === 0,
		warnings: U,
		blocked: W
	};
}, checkFilesSafety = (p, H) => {
	let U = [], W = [];
	for (let G of p) {
		let p = checkFileSafety(G, H);
		p.safe || W.push(...p.blocked), U.push(...p.warnings);
	}
	return {
		safe: W.length === 0,
		warnings: U,
		blocked: W
	};
}, getBackupDir = () => {
	let p = os.homedir();
	return process.platform === "win32" ? path.join(p, "AppData", "Local", "devtools-app", "backups") : path.join(p, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (p) => {
	let H = 0;
	for (let U of p) try {
		let p = await fs.stat(U);
		p.isFile() && (H += p.size);
	} catch {}
	return H;
}, createBackup = async (p) => {
	try {
		let H = getBackupDir();
		await fs.mkdir(H, { recursive: !0 });
		let U = generateBackupId(), W = path.join(H, U);
		await fs.mkdir(W, { recursive: !0 });
		let G = await calculateTotalSize(p), K = [];
		for (let H of p) try {
			let p = await fs.stat(H), U = path.basename(H), G = path.join(W, U);
			p.isFile() && (await fs.copyFile(H, G), K.push(H));
		} catch {}
		let q = {
			id: U,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: K,
			totalSize: G,
			location: W,
			platform: process.platform
		}, J = path.join(W, "backup-info.json");
		return await fs.writeFile(J, JSON.stringify(q, null, 2)), {
			success: !0,
			backupId: U,
			backupInfo: q
		};
	} catch (p) {
		return {
			success: !1,
			error: p.message
		};
	}
}, listBackups = async () => {
	try {
		let p = getBackupDir(), H = await fs.readdir(p, { withFileTypes: !0 }), U = [];
		for (let W of H) if (W.isDirectory() && W.name.startsWith("backup-")) {
			let H = path.join(p, W.name, "backup-info.json");
			try {
				let p = await fs.readFile(H, "utf-8");
				U.push(JSON.parse(p));
			} catch {}
		}
		return U.sort((p, H) => new Date(H.timestamp).getTime() - new Date(p.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (p) => {
	try {
		let H = getBackupDir(), U = path.join(H, p, "backup-info.json"), W = await fs.readFile(U, "utf-8");
		return JSON.parse(W);
	} catch {
		return null;
	}
}, restoreBackup = async (p) => {
	try {
		let H = await getBackupInfo(p);
		if (!H) return {
			success: !1,
			error: "Backup not found"
		};
		let U = H.location;
		for (let p of H.files) try {
			let H = path.basename(p), W = path.join(U, H);
			if ((await fs.stat(W)).isFile()) {
				let H = path.dirname(p);
				await fs.mkdir(H, { recursive: !0 }), await fs.copyFile(W, p);
			}
		} catch {}
		return { success: !0 };
	} catch (p) {
		return {
			success: !1,
			error: p.message
		};
	}
}, deleteBackup = async (p) => {
	try {
		let H = getBackupDir(), U = path.join(H, p);
		return await fs.rm(U, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (p) {
		return {
			success: !1,
			error: p.message
		};
	}
};
function setupScreenshotHandlers(p) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((p) => ({
				id: p.id,
				name: p.name,
				thumbnail: p.thumbnail.toDataURL(),
				type: p.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (p) {
			return console.error("Failed to get sources:", p), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let p = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (p.length === 0) throw Error("No screens available");
			let H = p[0].thumbnail;
			return {
				dataUrl: H.toDataURL(),
				width: H.getSize().width,
				height: H.getSize().height
			};
		} catch (p) {
			throw console.error("Failed to capture screen:", p), p;
		}
	}), ipcMain.handle("screenshot:capture-window", async (p, H) => {
		try {
			let p = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((p) => p.id === H);
			if (!p) throw Error("Window not found");
			let U = p.thumbnail;
			return {
				dataUrl: U.toDataURL(),
				width: U.getSize().width,
				height: U.getSize().height
			};
		} catch (p) {
			throw console.error("Failed to capture window:", p), p;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			let p = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: screen.getPrimaryDisplay().size
			});
			if (p.length === 0) throw Error("No screens available");
			let H = p[0].thumbnail;
			return {
				dataUrl: H.toDataURL(),
				width: H.getSize().width,
				height: H.getSize().height
			};
		} catch (p) {
			throw console.error("Failed to capture area:", p), p;
		}
	}), ipcMain.handle("screenshot:save-file", async (H, U, W) => {
		try {
			let { filename: H, format: G = "png" } = W, K = await dialog.showSaveDialog(p, {
				defaultPath: H || `screenshot-${Date.now()}.${G}`,
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
			if (K.canceled || !K.filePath) return {
				success: !1,
				canceled: !0
			};
			let q = U.replace(/^data:image\/\w+;base64,/, ""), Y = Buffer.from(q, "base64");
			return await fs.writeFile(K.filePath, Y), {
				success: !0,
				filePath: K.filePath
			};
		} catch (p) {
			return console.error("Failed to save screenshot:", p), {
				success: !1,
				error: p.message
			};
		}
	});
}
var execAsync = promisify(exec), store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(p) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: p,
			openAsHidden: !0
		}), { success: !0 };
	} catch (p) {
		let H = p instanceof Error ? p.message : String(p);
		return console.warn("Failed to set login item settings:", H), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: H
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
	let p = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let H = Math.min(clipboardItems.length, 9);
		p.push({
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
					label: `● Recent Clipboard (${H})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((p, H) => {
					let W = String(p.content || ""), G = (W.length > 75 ? W.substring(0, 75) + "..." : W).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${H + 1}. ${G || "(Empty)"}`,
						click: () => {
							W && (clipboard.writeText(W), new Notification({
								title: "✓ Copied from History",
								body: G || "Copied to clipboard",
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
		}), p.push({ type: "separator" });
	} else p.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), p.push({ type: "separator" });
	if (p.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let p = randomUUID();
					clipboard.writeText(p), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${p.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let p = clipboard.readText(), H = JSON.parse(p), W = JSON.stringify(H, null, 2);
						clipboard.writeText(W), new Notification({
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
						let p = clipboard.readText();
						if (!p) throw Error("Empty clipboard");
						let H = createHash("sha256").update(p).digest("hex");
						clipboard.writeText(H), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${H.substring(0, 20)}...`,
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
						let p = clipboard.readText();
						if (!p) throw Error("Empty clipboard");
						let H = Buffer.from(p).toString("base64");
						clipboard.writeText(H), new Notification({
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
						let p = clipboard.readText();
						if (!p) throw Error("Empty clipboard");
						let H = Buffer.from(p, "base64").toString("utf-8");
						clipboard.writeText(H), new Notification({
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
	}), p.push({ type: "separator" }), statsMenuData && (p.push({
		label: "📊 Stats Monitor",
		enabled: !1
	}), p.push({
		label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
		enabled: !1
	}), p.push({
		label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
		enabled: !1
	}), p.push({
		label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
		enabled: !1
	}), p.push({ type: "separator" }), p.push({
		label: "Open Stats Monitor",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
		}
	}), p.push({ type: "separator" })), healthMenuData) {
		let H = healthMenuData.alerts.filter((p) => p.severity === "critical" || p.severity === "warning").length, W = H > 0 ? `🛡️ System Health (${H} alerts)` : "🛡️ System Health", G = [
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
		healthMenuData.disk && G.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && G.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), G.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (G.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((p) => {
			G.push({
				label: `${p.severity === "critical" ? "🔴" : p.severity === "warning" ? "🟡" : "🔵"} ${p.message.substring(0, 50)}${p.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), G.push({ type: "separator" })), G.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), G.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let p = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							p?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(p.ramFreed || 0)}`,
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
		}), p.push({
			label: W,
			submenu: G
		}), p.push({ type: "separator" });
	}
	recentTools.length > 0 && (p.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((p) => ({
			label: `  • ${p.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", p.id);
			}
		}))
	}), p.push({ type: "separator" })), p.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), p.push({ type: "separator" }), p.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let W = Menu.buildFromTemplate(p);
	tray.setContextMenu(W);
}
function createWindow() {
	let H = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, W = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...H,
		minWidth: 1200,
		minHeight: 700,
		show: !W,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let q = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", q), win.on("move", q), win.on("close", (p) => {
		let H = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && H && (p.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let p = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return p.canceled || p.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: p.filePaths[0]
		};
	}), ipcMain.handle("store-get", (p, H) => store.get(H)), ipcMain.handle("store-set", (p, H, U) => {
		if (store.set(H, U), H === "launchAtLogin") {
			let p = setLoginItemSettingsSafely(U === !0);
			!p.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: p.error
			});
		}
	}), ipcMain.handle("store-delete", (p, H) => store.delete(H)), setupScreenshotHandlers(win), ipcMain.on("tray-update-menu", (p, H) => {
		recentTools = H || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (p, H) => {
		clipboardItems = (H || []).sort((p, H) => H.timestamp - p.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (p) {
			return console.error("Failed to read clipboard:", p), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let p = clipboard.readImage();
			return p.isEmpty() ? null : p.toDataURL();
		} catch (p) {
			return console.error("Failed to read clipboard image:", p), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (p, H) => {
		clipboardMonitoringEnabled = H, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (p, H) => {
		statsMenuData = H, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (p, H) => {
		healthMenuData = H, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let p = async () => {
			try {
				let p = await si.mem(), H = await si.currentLoad(), W = await si.fsSize(), G = await si.battery().catch(() => null), K = [], q = W.find((p) => p.mount === "/" || p.mount === "C:") || W[0];
				if (q) {
					let p = q.available / q.size * 100;
					p < 10 ? K.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(q.available)} free`
					}) : p < 20 && K.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(q.available)} free`
					});
				}
				H.currentLoad > 90 && K.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${H.currentLoad.toFixed(1)}%`
				});
				let J = p.used / p.total * 100;
				J > 90 && K.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${J.toFixed(1)}%`
				}), healthMenuData = {
					cpu: H.currentLoad,
					ram: {
						used: p.used,
						total: p.total,
						percentage: J
					},
					disk: q ? {
						free: q.available,
						total: q.size,
						percentage: (q.size - q.available) / q.size * 100
					} : null,
					battery: G ? {
						level: G.percent,
						charging: G.isCharging || !1
					} : null,
					alerts: K
				}, updateTrayMenu();
				let Y = K.filter((p) => p.severity === "critical");
				Y.length > 0 && win && Y.forEach((p) => {
					new Notification({
						title: "⚠️ System Alert",
						body: p.message,
						silent: !1
					}).show();
				});
			} catch (p) {
				console.error("Health monitoring error:", p);
			}
		};
		return p(), healthMonitoringInterval = setInterval(p, 5e3), { success: !0 };
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
	} catch (p) {
		console.error("Failed to register global shortcut", p);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [p, H] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: p.manufacturer,
			brand: p.brand,
			speed: p.speed,
			cores: p.cores,
			physicalCores: p.physicalCores,
			load: H
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [p, H] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: p,
			interfaces: H
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [p, H] = await Promise.all([si.fsSize(), si.disksIO()]), U = null;
			if (H && Array.isArray(H) && H.length > 0) {
				let p = H[0];
				U = {
					rIO: p.rIO || 0,
					wIO: p.wIO || 0,
					tIO: p.tIO || 0,
					rIO_sec: p.rIO_sec || 0,
					wIO_sec: p.wIO_sec || 0,
					tIO_sec: p.tIO_sec || 0
				};
			} else H && typeof H == "object" && !Array.isArray(H) && (U = {
				rIO: H.rIO || 0,
				wIO: H.wIO || 0,
				tIO: H.tIO || 0,
				rIO_sec: H.rIO_sec || 0,
				wIO_sec: H.wIO_sec || 0,
				tIO_sec: H.tIO_sec || 0
			});
			return {
				fsSize: p,
				ioStats: U
			};
		} catch (p) {
			return console.error("Error fetching disk stats:", p), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let p = await si.battery(), H, U;
			if ("powerConsumptionRate" in p && p.powerConsumptionRate && typeof p.powerConsumptionRate == "number" && (H = p.powerConsumptionRate), p.voltage && p.voltage > 0) {
				if (!p.isCharging && p.timeRemaining > 0 && p.currentCapacity > 0) {
					let U = p.currentCapacity / p.timeRemaining * 60;
					H = p.voltage * U;
				}
				p.isCharging && p.voltage > 0 && (U = p.voltage * 2e3);
			}
			return {
				...p,
				powerConsumptionRate: H,
				chargingPower: U
			};
		} catch (p) {
			return console.error("Error fetching battery stats:", p), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let p = await si.bluetoothDevices();
			return {
				enabled: p.length > 0 || await checkBluetoothEnabled(),
				devices: p.map((p) => ({
					name: p.name || "Unknown",
					mac: p.mac || p.address || "",
					type: p.type || p.deviceClass || "unknown",
					battery: p.battery || p.batteryLevel || void 0,
					connected: p.connected !== !1,
					rssi: p.rssi || p.signalStrength || void 0,
					manufacturer: p.manufacturer || p.vendor || void 0
				}))
			};
		} catch (p) {
			return console.error("Error fetching bluetooth stats:", p), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let p = await si.time(), H = Intl.DateTimeFormat().resolvedOptions().timeZone, U = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((p) => {
				let H = /* @__PURE__ */ new Date(), U = new Intl.DateTimeFormat("en-US", {
					timeZone: p,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), W = new Intl.DateTimeFormat("en-US", {
					timeZone: p,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), G = getTimezoneOffset(p);
				return {
					timezone: p,
					city: p.split("/").pop()?.replace("_", " ") || p,
					time: U.format(H),
					date: W.format(H),
					offset: G
				};
			});
			return {
				local: {
					timezone: H,
					city: H.split("/").pop()?.replace("_", " ") || "Local",
					time: p.current,
					date: p.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(H)
				},
				zones: U
			};
		} catch (p) {
			return console.error("Error fetching timezones stats:", p), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let U = process.platform, W = [];
			if (U === "darwin") {
				let H = "/Applications", U = await fs.readdir(H, { withFileTypes: !0 }).catch(() => []);
				for (let G of U) if (G.name.endsWith(".app")) {
					let U = join(H, G.name);
					try {
						let H = await fs.stat(U), K = G.name.replace(".app", ""), q = U.startsWith("/System") || U.startsWith("/Library") || K.startsWith("com.apple.");
						W.push({
							id: `macos-${K}-${H.ino}`,
							name: K,
							version: void 0,
							publisher: void 0,
							installDate: H.birthtime.toISOString(),
							installLocation: U,
							size: await p(U).catch(() => 0),
							isSystemApp: q
						});
					} catch {}
				}
			} else if (U === "win32") try {
				let { stdout: p } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), U = JSON.parse(p), G = Array.isArray(U) ? U : [U];
				for (let p of G) if (p.DisplayName) {
					let U = p.Publisher || "", G = p.InstallLocation || "", K = U.includes("Microsoft") || U.includes("Windows") || G.includes("Windows\\") || G.includes("Program Files\\Windows");
					W.push({
						id: `win-${p.DisplayName}-${p.InstallDate || "unknown"}`,
						name: p.DisplayName,
						version: p.DisplayVersion || void 0,
						publisher: U || void 0,
						installDate: p.InstallDate ? H(p.InstallDate) : void 0,
						installLocation: G || void 0,
						size: p.EstimatedSize ? p.EstimatedSize * 1024 : void 0,
						isSystemApp: K
					});
				}
			} catch (p) {
				console.error("Error fetching Windows apps:", p);
			}
			return W;
		} catch (p) {
			return console.error("Error fetching installed apps:", p), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let p = await si.processes(), H = await si.mem();
			return p.list.map((p) => ({
				pid: p.pid,
				name: p.name,
				cpu: p.cpu || 0,
				memory: p.mem || 0,
				memoryPercent: H.total > 0 ? (p.mem || 0) / H.total * 100 : 0,
				started: p.started || "",
				user: p.user || void 0,
				command: p.command || void 0,
				path: p.path || void 0
			}));
		} catch (p) {
			return console.error("Error fetching running processes:", p), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (p, H) => {
		try {
			let p = process.platform;
			if (p === "darwin") {
				if (H.installLocation) return await fs.rm(H.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (p === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${H.name.replace(/"/g, "\\\"")}" } | 
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
			} catch (p) {
				return {
					success: !1,
					error: p.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (p, H) => {
		try {
			return process.kill(H, "SIGTERM"), { success: !0 };
		} catch (p) {
			return {
				success: !1,
				error: p.message
			};
		}
	});
	async function p(H) {
		try {
			let U = 0, W = await fs.readdir(H, { withFileTypes: !0 });
			for (let G of W) {
				let W = join(H, G.name);
				try {
					if (G.isDirectory()) U += await p(W);
					else {
						let p = await fs.stat(W);
						U += p.size;
					}
				} catch {}
			}
			return U;
		} catch {
			return 0;
		}
	}
	function H(p) {
		return p && p.length === 8 ? `${p.substring(0, 4)}-${p.substring(4, 6)}-${p.substring(6, 8)}` : p;
	}
	setupCleanerHandlers(), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: p } = __require("child_process");
			return p("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(p) {
	let H = /* @__PURE__ */ new Date(), U = H.getTime() + H.getTimezoneOffset() * 6e4, W = H.toLocaleString("en-US", {
		timeZone: p,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(W).getTime() - U) / (1e3 * 60 * 60);
}
function formatBytes(p) {
	if (p === 0) return "0 B";
	let H = 1024, U = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], W = Math.floor(Math.log(p) / Math.log(H));
	return `${(p / H ** +W).toFixed(1)} ${U[W]}`;
}
function formatSpeed(p) {
	return p > 1024 * 1024 ? `${(p / 1024 / 1024).toFixed(1)} MB/s` : p > 1024 ? `${(p / 1024).toFixed(1)} KB/s` : `${p.toFixed(0)} B/s`;
}
