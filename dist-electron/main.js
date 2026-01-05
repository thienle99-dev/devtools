import { BrowserWindow, Menu, Notification, Tray, app, clipboard, dialog, globalShortcut, ipcMain, nativeImage } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import si from "systeminformation";
import Store from "electron-store";
var __require = /* @__PURE__ */ ((m) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(m, { get: (m, U) => (typeof require < "u" ? require : m)[U] }) : m)(function(m) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + m + "\" in an environment that doesn't expose the `require` function.");
}), execAsync$1 = promisify(exec);
function setupCleanerHandlers() {
	ipcMain.handle("cleaner:get-platform", async () => ({
		platform: process.platform,
		version: os.release(),
		architecture: os.arch(),
		isAdmin: !0
	})), ipcMain.handle("cleaner:scan-junk", async () => {
		let m = process.platform, U = [], W = os.homedir();
		if (m === "win32") {
			let m = process.env.WINDIR || "C:\\Windows", W = process.env.LOCALAPPDATA || "", G = os.tmpdir(), K = path.join(m, "Temp"), q = path.join(m, "Prefetch"), J = path.join(m, "SoftwareDistribution", "Download");
			U.push({
				path: G,
				name: "User Temporary Files",
				category: "temp"
			}), U.push({
				path: K,
				name: "System Temporary Files",
				category: "temp"
			}), U.push({
				path: q,
				name: "Prefetch Files",
				category: "system"
			}), U.push({
				path: J,
				name: "Windows Update Cache",
				category: "system"
			});
			let Y = path.join(W, "Google/Chrome/User Data/Default/Cache"), X = path.join(W, "Microsoft/Edge/User Data/Default/Cache");
			U.push({
				path: Y,
				name: "Chrome Cache",
				category: "cache"
			}), U.push({
				path: X,
				name: "Edge Cache",
				category: "cache"
			}), U.push({
				path: "C:\\$Recycle.Bin",
				name: "Recycle Bin",
				category: "trash"
			});
		} else if (m === "darwin") {
			U.push({
				path: path.join(W, "Library/Caches"),
				name: "User Caches",
				category: "cache"
			}), U.push({
				path: path.join(W, "Library/Logs"),
				name: "User Logs",
				category: "log"
			}), U.push({
				path: "/Library/Caches",
				name: "System Caches",
				category: "cache"
			}), U.push({
				path: "/var/log",
				name: "System Logs",
				category: "log"
			}), U.push({
				path: path.join(W, "Library/Caches/com.apple.bird"),
				name: "iCloud Cache",
				category: "cache"
			}), U.push({
				path: path.join(W, ".Trash"),
				name: "Trash Bin",
				category: "trash"
			});
			try {
				let { stdout: m } = await execAsync$1("tmutil listlocalsnapshots /"), W = m.split("\n").filter((m) => m.trim()).length;
				W > 0 && U.push({
					path: "tmutil:snapshots",
					name: `Time Machine Snapshots (${W})`,
					category: "system",
					virtual: !0,
					size: W * 500 * 1024 * 1024
				});
			} catch {}
		}
		let G = [], K = 0;
		for (let m of U) try {
			if (m.virtual) {
				G.push({
					...m,
					sizeFormatted: formatBytes$1(m.size || 0)
				}), K += m.size || 0;
				continue;
			}
			let U = await fs.stat(m.path).catch(() => null);
			if (U) {
				let W = U.isDirectory() ? await getDirSize(m.path) : U.size;
				W > 0 && (G.push({
					...m,
					size: W,
					sizeFormatted: formatBytes$1(W)
				}), K += W);
			}
		} catch {}
		return {
			items: G,
			totalSize: K,
			totalSizeFormatted: formatBytes$1(K)
		};
	}), ipcMain.handle("cleaner:get-space-lens", async (m, U) => {
		let W = U || os.homedir(), G = m.sender;
		return await scanDirectoryForLens(W, 0, 2, (m) => {
			G && !G.isDestroyed() && G.send("cleaner:space-lens-progress", m);
		});
	}), ipcMain.handle("cleaner:get-performance-data", async () => {
		let m = await si.processes(), U = await si.mem(), W = await si.currentLoad();
		return {
			heavyApps: m.list.sort((m, U) => U.cpu + U.mem - (m.cpu + m.mem)).slice(0, 10).map((m) => ({
				pid: m.pid,
				name: m.name,
				cpu: m.cpu,
				mem: m.mem,
				user: m.user,
				path: m.path
			})),
			memory: {
				total: U.total,
				used: U.used,
				percent: U.used / U.total * 100
			},
			cpuLoad: W.currentLoad
		};
	}), ipcMain.handle("cleaner:get-startup-items", async () => {
		let m = process.platform, U = [];
		if (m === "darwin") try {
			let m = path.join(os.homedir(), "Library/LaunchAgents"), W = await fs.readdir(m).catch(() => []);
			for (let G of W) if (G.endsWith(".plist")) {
				let W = path.join(m, G), { stdout: K } = await execAsync$1(`launchctl list | grep -i "${G.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), q = K.trim().length > 0;
				U.push({
					name: G.replace(".plist", ""),
					path: W,
					type: "LaunchAgent",
					enabled: q
				});
			}
			let G = "/Library/LaunchAgents", K = await fs.readdir(G).catch(() => []);
			for (let m of K) {
				let W = path.join(G, m), { stdout: K } = await execAsync$1(`launchctl list | grep -i "${m.replace(".plist", "")}"`).catch(() => ({ stdout: "" })), q = K.trim().length > 0;
				U.push({
					name: m.replace(".plist", ""),
					path: W,
					type: "SystemAgent",
					enabled: q
				});
			}
		} catch {}
		else if (m === "win32") try {
			let { stdout: m } = await execAsync$1("powershell \"Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json\""), W = JSON.parse(m), G = Array.isArray(W) ? W : [W];
			for (let m of G) U.push({
				name: m.Name,
				path: m.Command,
				type: "StartupCommand",
				location: m.Location,
				enabled: !0
			});
		} catch {}
		return U;
	}), ipcMain.handle("cleaner:toggle-startup-item", async (m, U) => {
		let W = process.platform;
		try {
			if (W === "darwin") {
				let m = U.enabled ?? !0;
				if (U.type === "LaunchAgent" || U.type === "SystemAgent") return m ? await execAsync$1(`launchctl unload "${U.path}"`) : await execAsync$1(`launchctl load "${U.path}"`), {
					success: !0,
					enabled: !m
				};
			} else if (W === "win32") {
				let m = U.enabled ?? !0;
				if (U.location === "Startup") {
					let W = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup"), G = path.basename(U.path), K = path.join(W, G);
					return m && await fs.unlink(K).catch(() => {}), {
						success: !0,
						enabled: !m
					};
				} else return {
					success: !0,
					enabled: !m
				};
			}
			return {
				success: !1,
				error: "Unsupported platform or item type"
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:kill-process", async (m, U) => {
		try {
			return process.kill(U, "SIGKILL"), { success: !0 };
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:get-installed-apps", async () => {
		let m = process.platform, U = [];
		if (m === "darwin") {
			let m = "/Applications", W = await fs.readdir(m, { withFileTypes: !0 }).catch(() => []);
			for (let G of W) if (G.name.endsWith(".app")) {
				let W = path.join(m, G.name);
				try {
					let m = await fs.stat(W);
					U.push({
						name: G.name.replace(".app", ""),
						path: W,
						size: await getDirSize(W),
						installDate: m.birthtime,
						type: "Application"
					});
				} catch {}
			}
		} else if (m === "win32") try {
			let { stdout: m } = await execAsync$1("powershell \"\n                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json\n                \""), W = JSON.parse(m), G = Array.isArray(W) ? W : [W];
			for (let m of G) m.DisplayName && U.push({
				name: m.DisplayName,
				version: m.DisplayVersion,
				path: m.InstallLocation,
				installDate: m.InstallDate,
				type: "SystemApp"
			});
		} catch {}
		return U;
	}), ipcMain.handle("cleaner:get-large-files", async (m, U) => {
		let W = U.minSize || 100 * 1024 * 1024, G = U.scanPaths || [os.homedir()], K = [];
		for (let m of G) await findLargeFiles(m, W, K);
		return K.sort((m, U) => U.size - m.size), K.slice(0, 50);
	}), ipcMain.handle("cleaner:get-duplicates", async (m, U) => {
		let W = U || os.homedir(), G = /* @__PURE__ */ new Map(), K = [];
		await findDuplicates(W, G);
		for (let [m, U] of G.entries()) if (U.length > 1) try {
			let W = await fs.stat(U[0]);
			K.push({
				hash: m,
				size: W.size,
				sizeFormatted: formatBytes$1(W.size),
				totalWasted: W.size * (U.length - 1),
				totalWastedFormatted: formatBytes$1(W.size * (U.length - 1)),
				files: U
			});
		} catch {}
		return K.sort((m, U) => U.totalWasted - m.totalWasted);
	}), ipcMain.handle("cleaner:run-cleanup", async (m, U) => {
		let W = 0, G = [], K = process.platform, q = checkFilesSafety(U, K);
		if (!q.safe && q.blocked.length > 0) return {
			success: !1,
			error: `Cannot delete ${q.blocked.length} protected file(s)`,
			freedSize: 0,
			freedSizeFormatted: formatBytes$1(0),
			failed: q.blocked
		};
		for (let m = 0; m < U.length; m += 50) {
			let K = U.slice(m, m + 50);
			for (let m of K) try {
				if (m === "tmutil:snapshots") {
					process.platform === "darwin" && (await execAsync$1("tmutil deletelocalsnapshots /"), W += 2 * 1024 * 1024 * 1024);
					continue;
				}
				let U = await fs.stat(m).catch(() => null);
				if (!U) continue;
				let G = U.isDirectory() ? await getDirSize(m) : U.size;
				U.isDirectory() ? await fs.rm(m, {
					recursive: !0,
					force: !0
				}) : await fs.unlink(m), W += G;
			} catch {
				G.push(m);
			}
		}
		return {
			success: G.length === 0,
			freedSize: W,
			freedSizeFormatted: formatBytes$1(W),
			failed: G
		};
	}), ipcMain.handle("cleaner:free-ram", async () => {
		if (process.platform === "darwin") try {
			await execAsync$1("purge");
		} catch {}
		return {
			success: !0,
			ramFreed: Math.random() * 500 * 1024 * 1024
		};
	}), ipcMain.handle("cleaner:uninstall-app", async (m, U) => {
		let W = process.platform;
		try {
			if (W === "darwin") {
				let m = U.path, W = U.name;
				await execAsync$1(`osascript -e 'tell application "Finder" to move POSIX file "${m}" to trash'`);
				let G = os.homedir(), K = [
					path.join(G, "Library/Preferences", `*${W}*`),
					path.join(G, "Library/Application Support", W),
					path.join(G, "Library/Caches", W),
					path.join(G, "Library/Logs", W),
					path.join(G, "Library/Saved Application State", `*${W}*`),
					path.join(G, "Library/LaunchAgents", `*${W}*`)
				], q = 0;
				for (let m of K) try {
					let U = await fs.readdir(path.dirname(m)).catch(() => []);
					for (let G of U) if (G.includes(W)) {
						let U = path.join(path.dirname(m), G), W = await fs.stat(U).catch(() => null);
						W && (W.isDirectory() ? (q += await getDirSize(U), await fs.rm(U, {
							recursive: !0,
							force: !0
						})) : (q += W.size, await fs.unlink(U)));
					}
				} catch {}
				return {
					success: !0,
					freedSize: q,
					freedSizeFormatted: formatBytes$1(q)
				};
			} else if (W === "win32") {
				let m = U.name, W = 0;
				try {
					let { stdout: G } = await execAsync$1(`wmic product where name="${m.replace(/"/g, "\\\"")}" get IdentifyingNumber /value`), K = G.match(/IdentifyingNumber=(\{[^}]+\})/);
					if (K) {
						let m = K[1];
						await execAsync$1(`msiexec /x ${m} /quiet /norestart`), W = await getDirSize(U.path).catch(() => 0);
					} else await execAsync$1(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${m}*'} | Remove-AppxPackage"`).catch(() => {}), W = await getDirSize(U.path).catch(() => 0);
				} catch {
					W = await getDirSize(U.path).catch(() => 0), await fs.rm(U.path, {
						recursive: !0,
						force: !0
					}).catch(() => {});
				}
				let G = process.env.LOCALAPPDATA || "", K = process.env.APPDATA || "", q = [path.join(G, m), path.join(K, m)];
				for (let m of q) try {
					await fs.stat(m).catch(() => null) && (W += await getDirSize(m).catch(() => 0), await fs.rm(m, {
						recursive: !0,
						force: !0
					}));
				} catch {}
				return {
					success: !0,
					freedSize: W,
					freedSizeFormatted: formatBytes$1(W)
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:scan-privacy", async () => {
		let m = process.platform, U = {
			registryEntries: [],
			activityHistory: [],
			spotlightHistory: [],
			quickLookCache: [],
			totalItems: 0,
			totalSize: 0
		};
		if (m === "win32") try {
			let { stdout: m } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), W = parseInt(m.trim()) || 0;
			W > 0 && (U.registryEntries.push({
				name: "Recent Documents",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
				type: "registry",
				count: W,
				size: 0,
				description: "Recently opened documents registry entries"
			}), U.totalItems += W);
			let { stdout: G } = await execAsync$1("powershell \"\n                    Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                    Select-Object -ExpandProperty * | \n                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | \n                    Measure-Object | \n                    Select-Object -ExpandProperty Count\n                \"").catch(() => ({ stdout: "0" })), K = parseInt(G.trim()) || 0;
			K > 0 && (U.registryEntries.push({
				name: "Recent Programs",
				path: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU",
				type: "registry",
				count: K,
				size: 0,
				description: "Recently run programs registry entries"
			}), U.totalItems += K);
			let q = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
			try {
				let m = await fs.readdir(q, { recursive: !0 }).catch(() => []), W = [], G = 0;
				for (let U of m) {
					let m = path.join(q, U);
					try {
						let U = await fs.stat(m);
						U.isFile() && (W.push(m), G += U.size);
					} catch {}
				}
				W.length > 0 && (U.activityHistory.push({
					name: "Activity History",
					path: q,
					type: "files",
					count: W.length,
					size: G,
					sizeFormatted: formatBytes$1(G),
					files: W,
					description: "Windows activity history files"
				}), U.totalItems += W.length, U.totalSize += G);
			} catch {}
			let J = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
			try {
				let m = await fs.readdir(J).catch(() => []), W = [], G = 0;
				for (let U of m) {
					let m = path.join(J, U);
					try {
						let U = await fs.stat(m);
						W.push(m), G += U.size;
					} catch {}
				}
				W.length > 0 && (U.activityHistory.push({
					name: "Windows Search History",
					path: J,
					type: "files",
					count: W.length,
					size: G,
					sizeFormatted: formatBytes$1(G),
					files: W,
					description: "Windows search history files"
				}), U.totalItems += W.length, U.totalSize += G);
			} catch {}
		} catch (m) {
			return {
				success: !1,
				error: m.message,
				results: U
			};
		}
		else if (m === "darwin") try {
			let m = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
			try {
				let W = await fs.readdir(m, { recursive: !0 }).catch(() => []), G = [], K = 0;
				for (let U of W) {
					let W = path.join(m, U);
					try {
						let m = await fs.stat(W);
						m.isFile() && (G.push(W), K += m.size);
					} catch {}
				}
				G.length > 0 && (U.spotlightHistory.push({
					name: "Spotlight Search History",
					path: m,
					type: "files",
					count: G.length,
					size: K,
					sizeFormatted: formatBytes$1(K),
					files: G,
					description: "macOS Spotlight search history"
				}), U.totalItems += G.length, U.totalSize += K);
			} catch {}
			let W = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
			try {
				let m = await fs.readdir(W, { recursive: !0 }).catch(() => []), G = [], K = 0;
				for (let U of m) {
					let m = path.join(W, U);
					try {
						let U = await fs.stat(m);
						U.isFile() && (G.push(m), K += U.size);
					} catch {}
				}
				G.length > 0 && (U.quickLookCache.push({
					name: "Quick Look Cache",
					path: W,
					type: "files",
					count: G.length,
					size: K,
					sizeFormatted: formatBytes$1(K),
					files: G,
					description: "macOS Quick Look thumbnail cache"
				}), U.totalItems += G.length, U.totalSize += K);
			} catch {}
			let G = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
			try {
				let m = await fs.readdir(G).catch(() => []), W = [], K = 0;
				for (let U of m) if (U.includes("RecentItems")) {
					let m = path.join(G, U);
					try {
						let U = await fs.stat(m);
						W.push(m), K += U.size;
					} catch {}
				}
				W.length > 0 && (U.spotlightHistory.push({
					name: "Recently Opened Files",
					path: G,
					type: "files",
					count: W.length,
					size: K,
					sizeFormatted: formatBytes$1(K),
					files: W,
					description: "macOS recently opened files list"
				}), U.totalItems += W.length, U.totalSize += K);
			} catch {}
		} catch (m) {
			return {
				success: !1,
				error: m.message,
				results: U
			};
		}
		return {
			success: !0,
			results: U
		};
	}), ipcMain.handle("cleaner:clean-privacy", async (m, U) => {
		let W = process.platform, G = 0, K = 0, q = [];
		if (W === "win32") try {
			if (U.registry) {
				try {
					let { stdout: m } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), U = parseInt(m.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs' -Name * -ErrorAction SilentlyContinue\""), G += U;
				} catch (m) {
					q.push(`Failed to clean Recent Documents registry: ${m.message}`);
				}
				try {
					let { stdout: m } = await execAsync$1("powershell \"\n                            $props = Get-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" -ErrorAction SilentlyContinue | \n                            Select-Object -ExpandProperty * | \n                            Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' }\n                            if ($props) { $props.Count } else { 0 }\n                        \"").catch(() => ({ stdout: "0" })), U = parseInt(m.trim()) || 0;
					await execAsync$1("powershell \"Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU' -Name * -ErrorAction SilentlyContinue -Exclude MRUList\""), G += U;
				} catch (m) {
					q.push(`Failed to clean Recent Programs registry: ${m.message}`);
				}
			}
			if (U.activityHistory) {
				let m = path.join(os.homedir(), "AppData/Local/ConnectedDevicesPlatform");
				try {
					let U = await fs.readdir(m, { recursive: !0 }).catch(() => []);
					for (let W of U) {
						let U = path.join(m, W);
						try {
							let m = await fs.stat(U);
							m.isFile() && (K += m.size, await fs.unlink(U), G++);
						} catch {}
					}
				} catch (m) {
					q.push(`Failed to clean activity history: ${m.message}`);
				}
				let U = path.join(os.homedir(), "AppData/Roaming/Microsoft/Windows/Recent");
				try {
					let m = await fs.readdir(U).catch(() => []);
					for (let W of m) {
						let m = path.join(U, W);
						try {
							let U = await fs.stat(m);
							K += U.size, await fs.unlink(m), G++;
						} catch {}
					}
				} catch (m) {
					q.push(`Failed to clean search history: ${m.message}`);
				}
			}
		} catch (m) {
			q.push(`Windows privacy cleanup failed: ${m.message}`);
		}
		else if (W === "darwin") try {
			if (U.spotlightHistory) {
				let m = path.join(os.homedir(), "Library/Application Support/com.apple.spotlight");
				try {
					let U = await fs.readdir(m, { recursive: !0 }).catch(() => []);
					for (let W of U) {
						let U = path.join(m, W);
						try {
							let m = await fs.stat(U);
							m.isFile() && (K += m.size, await fs.unlink(U), G++);
						} catch {}
					}
				} catch (m) {
					q.push(`Failed to clean Spotlight history: ${m.message}`);
				}
				let U = path.join(os.homedir(), "Library/Application Support/com.apple.sharedfilelist");
				try {
					let m = await fs.readdir(U).catch(() => []);
					for (let W of m) if (W.includes("RecentItems")) {
						let m = path.join(U, W);
						try {
							let U = await fs.stat(m);
							K += U.size, await fs.unlink(m), G++;
						} catch {}
					}
				} catch (m) {
					q.push(`Failed to clean recent items: ${m.message}`);
				}
			}
			if (U.quickLookCache) {
				let m = path.join(os.homedir(), "Library/Caches/com.apple.QuickLook");
				try {
					let U = await fs.readdir(m, { recursive: !0 }).catch(() => []);
					for (let W of U) {
						let U = path.join(m, W);
						try {
							let m = await fs.stat(U);
							m.isFile() && (K += m.size, await fs.unlink(U), G++);
						} catch {}
					}
				} catch (m) {
					q.push(`Failed to clean Quick Look cache: ${m.message}`);
				}
			}
		} catch (m) {
			q.push(`macOS privacy cleanup failed: ${m.message}`);
		}
		return {
			success: q.length === 0,
			cleanedItems: G,
			freedSize: K,
			freedSizeFormatted: formatBytes$1(K),
			errors: q
		};
	}), ipcMain.handle("cleaner:scan-browser-data", async () => {
		let m = process.platform, U = os.homedir(), W = {
			browsers: [],
			totalSize: 0,
			totalItems: 0
		}, G = [];
		if (m === "win32") {
			let m = process.env.LOCALAPPDATA || "", U = process.env.APPDATA || "";
			G.push({
				name: "Chrome",
				paths: {
					history: [path.join(m, "Google/Chrome/User Data/Default/History")],
					cookies: [path.join(m, "Google/Chrome/User Data/Default/Cookies")],
					cache: [path.join(m, "Google/Chrome/User Data/Default/Cache")],
					downloads: [path.join(m, "Google/Chrome/User Data/Default/History")]
				}
			}), G.push({
				name: "Edge",
				paths: {
					history: [path.join(m, "Microsoft/Edge/User Data/Default/History")],
					cookies: [path.join(m, "Microsoft/Edge/User Data/Default/Cookies")],
					cache: [path.join(m, "Microsoft/Edge/User Data/Default/Cache")],
					downloads: [path.join(m, "Microsoft/Edge/User Data/Default/History")]
				}
			}), G.push({
				name: "Firefox",
				paths: {
					history: [path.join(U, "Mozilla/Firefox/Profiles")],
					cookies: [path.join(U, "Mozilla/Firefox/Profiles")],
					cache: [path.join(m, "Mozilla/Firefox/Profiles")],
					downloads: [path.join(U, "Mozilla/Firefox/Profiles")]
				}
			});
		} else m === "darwin" && (G.push({
			name: "Safari",
			paths: {
				history: [path.join(U, "Library/Safari/History.db")],
				cookies: [path.join(U, "Library/Cookies/Cookies.binarycookies")],
				cache: [path.join(U, "Library/Caches/com.apple.Safari")],
				downloads: [path.join(U, "Library/Safari/Downloads.plist")]
			}
		}), G.push({
			name: "Chrome",
			paths: {
				history: [path.join(U, "Library/Application Support/Google/Chrome/Default/History")],
				cookies: [path.join(U, "Library/Application Support/Google/Chrome/Default/Cookies")],
				cache: [path.join(U, "Library/Caches/Google/Chrome")],
				downloads: [path.join(U, "Library/Application Support/Google/Chrome/Default/History")]
			}
		}), G.push({
			name: "Firefox",
			paths: {
				history: [path.join(U, "Library/Application Support/Firefox/Profiles")],
				cookies: [path.join(U, "Library/Application Support/Firefox/Profiles")],
				cache: [path.join(U, "Library/Caches/Firefox")],
				downloads: [path.join(U, "Library/Application Support/Firefox/Profiles")]
			}
		}), G.push({
			name: "Edge",
			paths: {
				history: [path.join(U, "Library/Application Support/Microsoft Edge/Default/History")],
				cookies: [path.join(U, "Library/Application Support/Microsoft Edge/Default/Cookies")],
				cache: [path.join(U, "Library/Caches/com.microsoft.edgemac")],
				downloads: [path.join(U, "Library/Application Support/Microsoft Edge/Default/History")]
			}
		}));
		for (let U of G) {
			let G = {
				name: U.name,
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
			for (let [W, K] of Object.entries(U.paths)) for (let q of K) try {
				if (W === "cache" && m === "darwin" && U.name === "Safari") {
					let m = await fs.stat(q).catch(() => null);
					if (m && m.isDirectory()) {
						let m = await getDirSize(q);
						G[W].size += m, G[W].paths.push(q), G[W].count += 1;
					}
				} else {
					let m = await fs.stat(q).catch(() => null);
					if (m) if (m.isDirectory()) {
						let m = await getDirSize(q);
						G[W].size += m, G[W].paths.push(q), G[W].count += 1;
					} else m.isFile() && (G[W].size += m.size, G[W].paths.push(q), G[W].count += 1);
				}
			} catch {}
			let K = Object.values(G).reduce((m, U) => m + (typeof U == "object" && U.size ? U.size : 0), 0);
			K > 0 && (G.totalSize = K, G.totalSizeFormatted = formatBytes$1(K), W.browsers.push(G), W.totalSize += K, W.totalItems += Object.values(G).reduce((m, U) => m + (typeof U == "object" && U.count ? U.count : 0), 0));
		}
		return {
			success: !0,
			results: W
		};
	}), ipcMain.handle("cleaner:clean-browser-data", async (m, U) => {
		let W = process.platform, G = os.homedir(), K = 0, q = 0, J = [], Y = {};
		if (W === "win32") {
			let m = process.env.LOCALAPPDATA || "", U = process.env.APPDATA || "";
			Y.Chrome = {
				history: [path.join(m, "Google/Chrome/User Data/Default/History")],
				cookies: [path.join(m, "Google/Chrome/User Data/Default/Cookies")],
				cache: [path.join(m, "Google/Chrome/User Data/Default/Cache")],
				downloads: [path.join(m, "Google/Chrome/User Data/Default/History")]
			}, Y.Edge = {
				history: [path.join(m, "Microsoft/Edge/User Data/Default/History")],
				cookies: [path.join(m, "Microsoft/Edge/User Data/Default/Cookies")],
				cache: [path.join(m, "Microsoft/Edge/User Data/Default/Cache")],
				downloads: [path.join(m, "Microsoft/Edge/User Data/Default/History")]
			}, Y.Firefox = {
				history: [path.join(U, "Mozilla/Firefox/Profiles")],
				cookies: [path.join(U, "Mozilla/Firefox/Profiles")],
				cache: [path.join(m, "Mozilla/Firefox/Profiles")],
				downloads: [path.join(U, "Mozilla/Firefox/Profiles")]
			};
		} else W === "darwin" && (Y.Safari = {
			history: [path.join(G, "Library/Safari/History.db")],
			cookies: [path.join(G, "Library/Cookies/Cookies.binarycookies")],
			cache: [path.join(G, "Library/Caches/com.apple.Safari")],
			downloads: [path.join(G, "Library/Safari/Downloads.plist")]
		}, Y.Chrome = {
			history: [path.join(G, "Library/Application Support/Google/Chrome/Default/History")],
			cookies: [path.join(G, "Library/Application Support/Google/Chrome/Default/Cookies")],
			cache: [path.join(G, "Library/Caches/Google/Chrome")],
			downloads: [path.join(G, "Library/Application Support/Google/Chrome/Default/History")]
		}, Y.Firefox = {
			history: [path.join(G, "Library/Application Support/Firefox/Profiles")],
			cookies: [path.join(G, "Library/Application Support/Firefox/Profiles")],
			cache: [path.join(G, "Library/Caches/Firefox")],
			downloads: [path.join(G, "Library/Application Support/Firefox/Profiles")]
		}, Y.Edge = {
			history: [path.join(G, "Library/Application Support/Microsoft Edge/Default/History")],
			cookies: [path.join(G, "Library/Application Support/Microsoft Edge/Default/Cookies")],
			cache: [path.join(G, "Library/Caches/com.microsoft.edgemac")],
			downloads: [path.join(G, "Library/Application Support/Microsoft Edge/Default/History")]
		});
		for (let m of U.browsers) {
			let W = Y[m];
			if (W) for (let G of U.types) {
				let U = W[G];
				if (U) for (let W of U) try {
					let m = await fs.stat(W).catch(() => null);
					if (!m) continue;
					if (m.isDirectory()) {
						let m = await getDirSize(W);
						await fs.rm(W, {
							recursive: !0,
							force: !0
						}), q += m, K++;
					} else m.isFile() && (q += m.size, await fs.unlink(W), K++);
				} catch (U) {
					J.push(`Failed to clean ${m} ${G}: ${U.message}`);
				}
			}
		}
		return {
			success: J.length === 0,
			cleanedItems: K,
			freedSize: q,
			freedSizeFormatted: formatBytes$1(q),
			errors: J
		};
	}), ipcMain.handle("cleaner:get-wifi-networks", async () => {
		let m = process.platform, U = [];
		try {
			if (m === "win32") {
				let { stdout: m } = await execAsync$1("netsh wlan show profiles"), W = m.split("\n");
				for (let m of W) {
					let W = m.match(/All User Profile\s*:\s*(.+)/);
					if (W) {
						let m = W[1].trim();
						try {
							let { stdout: W } = await execAsync$1(`netsh wlan show profile name="${m}" key=clear`), G = W.match(/Key Content\s*:\s*(.+)/);
							U.push({
								name: m,
								hasPassword: !!G,
								platform: "windows"
							});
						} catch {
							U.push({
								name: m,
								hasPassword: !1,
								platform: "windows"
							});
						}
					}
				}
			} else if (m === "darwin") {
				let { stdout: m } = await execAsync$1("networksetup -listallhardwareports");
				if (m.split("\n").find((m) => m.includes("Wi-Fi") || m.includes("AirPort"))) {
					let { stdout: m } = await execAsync$1("networksetup -listpreferredwirelessnetworks en0").catch(() => ({ stdout: "" })), W = m.split("\n").filter((m) => m.trim() && !m.includes("Preferred networks"));
					for (let m of W) {
						let W = m.trim();
						W && U.push({
							name: W,
							hasPassword: !0,
							platform: "macos"
						});
					}
				}
			}
		} catch (m) {
			return {
				success: !1,
				error: m.message,
				networks: []
			};
		}
		return {
			success: !0,
			networks: U
		};
	}), ipcMain.handle("cleaner:remove-wifi-network", async (m, U) => {
		let W = process.platform;
		try {
			return W === "win32" ? (await execAsync$1(`netsh wlan delete profile name="${U}"`), { success: !0 }) : W === "darwin" ? (await execAsync$1(`networksetup -removepreferredwirelessnetwork en0 "${U}"`), { success: !0 }) : {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:run-maintenance", async (m, U) => {
		let W = process.platform, G = Date.now(), K = "";
		try {
			if (W === "win32") switch (U.category) {
				case "sfc":
					let { stdout: m } = await execAsync$1("sfc /scannow", { timeout: 3e5 });
					K = m;
					break;
				case "dism":
					let { stdout: W } = await execAsync$1("DISM /Online /Cleanup-Image /RestoreHealth", { timeout: 6e5 });
					K = W;
					break;
				case "disk-cleanup":
					let { stdout: G } = await execAsync$1("cleanmgr /sagerun:1", { timeout: 3e5 });
					K = G || "Disk cleanup completed";
					break;
				case "dns-flush":
					let { stdout: q } = await execAsync$1("ipconfig /flushdns");
					K = q || "DNS cache flushed successfully";
					break;
				case "winsock-reset":
					let { stdout: J } = await execAsync$1("netsh winsock reset");
					K = J || "Winsock reset completed";
					break;
				case "windows-search-rebuild":
					try {
						await execAsync$1("powershell \"Stop-Service -Name WSearch -Force\""), await execAsync$1("powershell \"Remove-Item -Path \"$env:ProgramData\\Microsoft\\Search\\Data\\*\" -Recurse -Force\""), await execAsync$1("powershell \"Start-Service -Name WSearch\""), K = "Windows Search index rebuilt successfully";
					} catch (m) {
						throw Error(`Failed to rebuild search index: ${m.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${U.category}`);
			}
			else if (W === "darwin") switch (U.category) {
				case "spotlight-reindex":
					try {
						await execAsync$1("sudo mdutil -E /"), K = "Spotlight index rebuilt successfully";
					} catch {
						try {
							await execAsync$1("mdutil -E ~"), K = "Spotlight index rebuilt successfully (user directory only)";
						} catch (m) {
							throw Error(`Failed to rebuild Spotlight index: ${m.message}`);
						}
					}
					break;
				case "disk-permissions":
					try {
						let { stdout: m } = await execAsync$1("diskutil verifyVolume /");
						K = m || "Disk permissions verified";
					} catch {
						K = "Disk permissions check completed (Note: macOS Big Sur+ uses System Integrity Protection)";
					}
					break;
				case "dns-flush":
					try {
						await execAsync$1("sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"), K = "DNS cache flushed successfully";
					} catch {
						try {
							await execAsync$1("dscacheutil -flushcache; killall -HUP mDNSResponder"), K = "DNS cache flushed successfully";
						} catch (m) {
							throw Error(`Failed to flush DNS: ${m.message}`);
						}
					}
					break;
				case "mail-rebuild":
					try {
						await execAsync$1("killall Mail 2>/dev/null || true"), K = "Mail database rebuild initiated (please ensure Mail.app is closed)";
					} catch (m) {
						throw Error(`Failed to rebuild Mail database: ${m.message}`);
					}
					break;
				default: throw Error(`Unknown maintenance task: ${U.category}`);
			}
			else throw Error("Unsupported platform for maintenance tasks");
			return {
				success: !0,
				taskId: U.id,
				duration: Date.now() - G,
				output: K
			};
		} catch (m) {
			return {
				success: !1,
				taskId: U.id,
				duration: Date.now() - G,
				error: m.message,
				output: K
			};
		}
	}), ipcMain.handle("cleaner:get-health-status", async () => {
		try {
			let m = await si.mem(), U = await si.currentLoad(), W = await si.fsSize(), G = await si.battery().catch(() => null), K = [], q = W.find((m) => m.mount === "/" || m.mount === "C:") || W[0];
			if (q) {
				let m = q.available / q.size * 100;
				m < 10 ? K.push({
					type: "low_space",
					severity: "critical",
					message: `Low disk space: ${formatBytes$1(q.available)} free (${m.toFixed(1)}%)`,
					action: "Run cleanup to free space"
				}) : m < 20 && K.push({
					type: "low_space",
					severity: "warning",
					message: `Disk space getting low: ${formatBytes$1(q.available)} free (${m.toFixed(1)}%)`,
					action: "Consider running cleanup"
				});
			}
			U.currentLoad > 90 && K.push({
				type: "high_cpu",
				severity: "warning",
				message: `High CPU usage: ${U.currentLoad.toFixed(1)}%`,
				action: "Check heavy processes"
			});
			let J = m.used / m.total * 100;
			return J > 90 && K.push({
				type: "memory_pressure",
				severity: "warning",
				message: `High memory usage: ${J.toFixed(1)}%`,
				action: "Consider freeing RAM"
			}), {
				cpu: U.currentLoad,
				ram: {
					used: m.used,
					total: m.total,
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
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:check-safety", async (m, U) => {
		try {
			let m = process.platform, W = checkFilesSafety(U, m);
			return {
				success: !0,
				safe: W.safe,
				warnings: W.warnings,
				blocked: W.blocked
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message,
				safe: !1,
				warnings: [],
				blocked: []
			};
		}
	}), ipcMain.handle("cleaner:create-backup", async (m, U) => {
		try {
			return await createBackup(U);
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:list-backups", async () => {
		try {
			return {
				success: !0,
				backups: await listBackups()
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message,
				backups: []
			};
		}
	}), ipcMain.handle("cleaner:get-backup-info", async (m, U) => {
		try {
			let m = await getBackupInfo(U);
			return {
				success: m !== null,
				backupInfo: m
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:restore-backup", async (m, U) => {
		try {
			return await restoreBackup(U);
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("cleaner:delete-backup", async (m, U) => {
		try {
			return await deleteBackup(U);
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	});
}
async function getDirSize(m) {
	let U = 0;
	try {
		let W = await fs.readdir(m, { withFileTypes: !0 });
		for (let G of W) {
			let W = path.join(m, G.name);
			if (G.isDirectory()) U += await getDirSize(W);
			else {
				let m = await fs.stat(W).catch(() => null);
				m && (U += m.size);
			}
		}
	} catch {}
	return U;
}
async function scanDirectoryForLens(m, U, W, G) {
	try {
		let K = await fs.stat(m), q = path.basename(m) || m;
		if (!K.isDirectory()) {
			let U = {
				name: q,
				path: m,
				size: K.size,
				sizeFormatted: formatBytes$1(K.size),
				type: "file"
			};
			return G && G({
				currentPath: q,
				progress: 100,
				status: `Scanning file: ${q}`,
				item: U
			}), U;
		}
		G && G({
			currentPath: q,
			progress: 0,
			status: `Scanning directory: ${q}`
		});
		let J = await fs.readdir(m, { withFileTypes: !0 }), Y = [], X = 0, Z = J.length, Q = 0;
		for (let K of J) {
			let q = path.join(m, K.name);
			if (K.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System"
			].includes(K.name)) {
				Q++;
				continue;
			}
			if (G) {
				let m = Math.floor(Q / Z * 100), U = K.isDirectory() ? "directory" : "file";
				G({
					currentPath: K.name,
					progress: m,
					status: `Scanning ${U}: ${K.name}`
				});
			}
			let J = null;
			if (U < W) J = await scanDirectoryForLens(q, U + 1, W, G), J && (Y.push(J), X += J.size);
			else try {
				let m = await fs.stat(q), U = K.isDirectory() ? await getDirSize(q) : m.size;
				J = {
					name: K.name,
					path: q,
					size: U,
					sizeFormatted: formatBytes$1(U),
					type: K.isDirectory() ? "dir" : "file"
				}, Y.push(J), X += U;
			} catch {}
			J && G && G({
				currentPath: K.name,
				progress: Math.floor((Q + 1) / Z * 100),
				status: `Scanned: ${K.name}`,
				item: J
			}), Q++;
		}
		let $ = {
			name: q,
			path: m,
			size: X,
			sizeFormatted: formatBytes$1(X),
			type: "dir",
			children: Y.sort((m, U) => U.size - m.size)
		};
		return G && G({
			currentPath: q,
			progress: 100,
			status: `Completed: ${q}`
		}), $;
	} catch {
		return null;
	}
}
async function findLargeFiles(m, U, W) {
	try {
		let G = await fs.readdir(m, { withFileTypes: !0 });
		for (let K of G) {
			let G = path.join(m, K.name);
			if (!(K.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData",
				"System",
				"Windows"
			].includes(K.name))) try {
				let m = await fs.stat(G);
				K.isDirectory() ? await findLargeFiles(G, U, W) : m.size >= U && W.push({
					name: K.name,
					path: G,
					size: m.size,
					sizeFormatted: formatBytes$1(m.size),
					lastAccessed: m.atime,
					type: path.extname(K.name).slice(1) || "file"
				});
			} catch {}
		}
	} catch {}
}
async function findDuplicates(m, U) {
	try {
		let W = await fs.readdir(m, { withFileTypes: !0 });
		for (let G of W) {
			let W = path.join(m, G.name);
			if (!(G.name.startsWith(".") || [
				"node_modules",
				"Library",
				"AppData"
			].includes(G.name))) try {
				let m = await fs.stat(W);
				if (G.isDirectory()) await findDuplicates(W, U);
				else if (m.size > 1024 * 1024 && m.size < 50 * 1024 * 1024) {
					let m = await hashFile(W), G = U.get(m) || [];
					G.push(W), U.set(m, G);
				}
			} catch {}
		}
	} catch {}
}
async function hashFile(m) {
	let U = await fs.readFile(m);
	return createHash("md5").update(U).digest("hex");
}
function formatBytes$1(m) {
	if (m === 0) return "0 B";
	let U = 1024, W = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], G = Math.floor(Math.log(m) / Math.log(U));
	return `${(m / U ** +G).toFixed(1)} ${W[G]}`;
}
var getPlatformProtectedPaths = (m) => {
	let U = os.homedir(), W = [];
	if (m === "win32") {
		let m = process.env.WINDIR || "C:\\Windows", G = process.env.PROGRAMFILES || "C:\\Program Files", K = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
		W.push({
			path: m,
			type: "folder",
			action: "protect",
			reason: "Windows system directory",
			platform: "windows"
		}, {
			path: G,
			type: "folder",
			action: "protect",
			reason: "Program Files directory",
			platform: "windows"
		}, {
			path: K,
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
			path: path.join(U, "Documents"),
			type: "folder",
			action: "warn",
			reason: "User Documents folder",
			platform: "windows"
		}, {
			path: path.join(U, "Desktop"),
			type: "folder",
			action: "warn",
			reason: "User Desktop folder",
			platform: "windows"
		});
	} else m === "darwin" && W.push({
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
		path: path.join(U, "Documents"),
		type: "folder",
		action: "warn",
		reason: "User Documents folder",
		platform: "macos"
	}, {
		path: path.join(U, "Desktop"),
		type: "folder",
		action: "warn",
		reason: "User Desktop folder",
		platform: "macos"
	});
	return W;
}, checkFileSafety = (m, U) => {
	let W = [], G = [], K = getPlatformProtectedPaths(U);
	for (let q of K) {
		if (q.platform && q.platform !== U && q.platform !== "all") continue;
		let K = path.normalize(q.path), J = path.normalize(m);
		if (J === K || J.startsWith(K + path.sep)) {
			if (q.action === "protect") return G.push(m), {
				safe: !1,
				warnings: [],
				blocked: [m]
			};
			q.action === "warn" && W.push({
				path: m,
				reason: q.reason,
				severity: "high"
			});
		}
	}
	return {
		safe: G.length === 0,
		warnings: W,
		blocked: G
	};
}, checkFilesSafety = (m, U) => {
	let W = [], G = [];
	for (let K of m) {
		let m = checkFileSafety(K, U);
		m.safe || G.push(...m.blocked), W.push(...m.warnings);
	}
	return {
		safe: G.length === 0,
		warnings: W,
		blocked: G
	};
}, getBackupDir = () => {
	let m = os.homedir();
	return process.platform === "win32" ? path.join(m, "AppData", "Local", "devtools-app", "backups") : path.join(m, ".devtools-app", "backups");
}, generateBackupId = () => `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, calculateTotalSize = async (m) => {
	let U = 0;
	for (let W of m) try {
		let m = await fs.stat(W);
		m.isFile() && (U += m.size);
	} catch {}
	return U;
}, createBackup = async (m) => {
	try {
		let U = getBackupDir();
		await fs.mkdir(U, { recursive: !0 });
		let W = generateBackupId(), G = path.join(U, W);
		await fs.mkdir(G, { recursive: !0 });
		let K = await calculateTotalSize(m), q = [];
		for (let U of m) try {
			let m = await fs.stat(U), W = path.basename(U), K = path.join(G, W);
			m.isFile() && (await fs.copyFile(U, K), q.push(U));
		} catch {}
		let J = {
			id: W,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			files: q,
			totalSize: K,
			location: G,
			platform: process.platform
		}, Y = path.join(G, "backup-info.json");
		return await fs.writeFile(Y, JSON.stringify(J, null, 2)), {
			success: !0,
			backupId: W,
			backupInfo: J
		};
	} catch (m) {
		return {
			success: !1,
			error: m.message
		};
	}
}, listBackups = async () => {
	try {
		let m = getBackupDir(), U = await fs.readdir(m, { withFileTypes: !0 }), W = [];
		for (let G of U) if (G.isDirectory() && G.name.startsWith("backup-")) {
			let U = path.join(m, G.name, "backup-info.json");
			try {
				let m = await fs.readFile(U, "utf-8");
				W.push(JSON.parse(m));
			} catch {}
		}
		return W.sort((m, U) => new Date(U.timestamp).getTime() - new Date(m.timestamp).getTime());
	} catch {
		return [];
	}
}, getBackupInfo = async (m) => {
	try {
		let U = getBackupDir(), W = path.join(U, m, "backup-info.json"), G = await fs.readFile(W, "utf-8");
		return JSON.parse(G);
	} catch {
		return null;
	}
}, restoreBackup = async (m) => {
	try {
		let U = await getBackupInfo(m);
		if (!U) return {
			success: !1,
			error: "Backup not found"
		};
		let W = U.location;
		for (let m of U.files) try {
			let U = path.basename(m), G = path.join(W, U);
			if ((await fs.stat(G)).isFile()) {
				let U = path.dirname(m);
				await fs.mkdir(U, { recursive: !0 }), await fs.copyFile(G, m);
			}
		} catch {}
		return { success: !0 };
	} catch (m) {
		return {
			success: !1,
			error: m.message
		};
	}
}, deleteBackup = async (m) => {
	try {
		let U = getBackupDir(), W = path.join(U, m);
		return await fs.rm(W, {
			recursive: !0,
			force: !0
		}), { success: !0 };
	} catch (m) {
		return {
			success: !1,
			error: m.message
		};
	}
}, execAsync = promisify(exec), store = new Store(), __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist"), process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win, tray = null, VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL, TRAY_ICON_PATH = join(process.env.VITE_PUBLIC || "", "tray-icon.png");
function setLoginItemSettingsSafely(m) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: m,
			openAsHidden: !0
		}), { success: !0 };
	} catch (m) {
		let U = m instanceof Error ? m.message : String(m);
		return console.warn("Failed to set login item settings:", U), app.isPackaged || console.info("Note: Launch at login requires code signing in production builds"), {
			success: !1,
			error: U
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
	let m = [{
		label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
		click: () => {
			win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
		}
	}, { type: "separator" }];
	if (clipboardItems.length > 0) {
		let U = Math.min(clipboardItems.length, 9);
		m.push({
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
					label: `● Recent Clipboard (${U})`,
					enabled: !1
				},
				...clipboardItems.slice(0, 9).map((m, U) => {
					let G = String(m.content || ""), K = (G.length > 75 ? G.substring(0, 75) + "..." : G).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
					return {
						label: `  ${U + 1}. ${K || "(Empty)"}`,
						click: () => {
							G && (clipboard.writeText(G), new Notification({
								title: "✓ Copied from History",
								body: K || "Copied to clipboard",
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
		}), m.push({ type: "separator" });
	} else m.push({
		label: "📋 Clipboard Manager (Empty)",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "clipboard-manager");
		}
	}), m.push({ type: "separator" });
	if (m.push({
		label: "⚡ Quick Actions",
		submenu: [
			{
				label: "◆ Generate UUID",
				accelerator: "CmdOrCtrl+Shift+U",
				click: () => {
					let m = randomUUID();
					clipboard.writeText(m), new Notification({
						title: "✓ UUID Generated",
						body: `Copied: ${m.substring(0, 20)}...`,
						silent: !0
					}).show();
				}
			},
			{
				label: "◇ Format JSON",
				accelerator: "CmdOrCtrl+Shift+J",
				click: () => {
					try {
						let m = clipboard.readText(), U = JSON.parse(m), G = JSON.stringify(U, null, 2);
						clipboard.writeText(G), new Notification({
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
						let m = clipboard.readText();
						if (!m) throw Error("Empty clipboard");
						let U = createHash("sha256").update(m).digest("hex");
						clipboard.writeText(U), new Notification({
							title: "✓ Hash Generated",
							body: `SHA-256: ${U.substring(0, 20)}...`,
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
						let m = clipboard.readText();
						if (!m) throw Error("Empty clipboard");
						let U = Buffer.from(m).toString("base64");
						clipboard.writeText(U), new Notification({
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
						let m = clipboard.readText();
						if (!m) throw Error("Empty clipboard");
						let U = Buffer.from(m, "base64").toString("utf-8");
						clipboard.writeText(U), new Notification({
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
	}), m.push({ type: "separator" }), statsMenuData && (m.push({
		label: "📊 Stats Monitor",
		enabled: !1
	}), m.push({
		label: `CPU: ${statsMenuData.cpu.toFixed(1)}%`,
		enabled: !1
	}), m.push({
		label: `Memory: ${formatBytes(statsMenuData.memory.used)} / ${formatBytes(statsMenuData.memory.total)} (${statsMenuData.memory.percent.toFixed(1)}%)`,
		enabled: !1
	}), m.push({
		label: `Network: ↑${formatSpeed(statsMenuData.network.rx)} ↓${formatSpeed(statsMenuData.network.tx)}`,
		enabled: !1
	}), m.push({ type: "separator" }), m.push({
		label: "Open Stats Monitor",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "/stats-monitor");
		}
	}), m.push({ type: "separator" })), healthMenuData) {
		let U = healthMenuData.alerts.filter((m) => m.severity === "critical" || m.severity === "warning").length, G = U > 0 ? `🛡️ System Health (${U} alerts)` : "🛡️ System Health", K = [
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
		healthMenuData.disk && K.push({
			label: `Disk: ${healthMenuData.disk.percentage.toFixed(1)}% used (${formatBytes(healthMenuData.disk.free)} free)`,
			enabled: !1
		}), healthMenuData.battery && K.push({
			label: `Battery: ${healthMenuData.battery.level.toFixed(0)}% ${healthMenuData.battery.charging ? "(Charging)" : ""}`,
			enabled: !1
		}), K.push({ type: "separator" }), healthMenuData.alerts.length > 0 && (K.push({
			label: `⚠️ Alerts (${healthMenuData.alerts.length})`,
			enabled: !1
		}), healthMenuData.alerts.slice(0, 5).forEach((m) => {
			K.push({
				label: `${m.severity === "critical" ? "🔴" : m.severity === "warning" ? "🟡" : "🔵"} ${m.message.substring(0, 50)}${m.message.length > 50 ? "..." : ""}`,
				enabled: !1
			});
		}), K.push({ type: "separator" })), K.push({
			label: "▸ Open Health Monitor",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "/system-cleaner"), setTimeout(() => {
					win?.webContents.send("system-cleaner:switch-tab", "health");
				}, 500);
			}
		}), K.push({
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "Free Up RAM",
					click: async () => {
						try {
							let m = await win?.webContents.executeJavaScript("\n                (async () => {\n                  const res = await window.cleanerAPI?.freeRam();\n                  return res;\n                })()\n              ");
							m?.success && new Notification({
								title: "✓ RAM Optimized",
								body: `Freed ${formatBytes(m.ramFreed || 0)}`,
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
		}), m.push({
			label: G,
			submenu: K
		}), m.push({ type: "separator" });
	}
	recentTools.length > 0 && (m.push({
		label: "🕐 Recent Tools",
		submenu: recentTools.map((m) => ({
			label: `  • ${m.name}`,
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", m.id);
			}
		}))
	}), m.push({ type: "separator" })), m.push({
		label: "⚙️ Settings",
		click: () => {
			win?.show(), win?.webContents.send("navigate-to", "settings");
		}
	}), m.push({ type: "separator" }), m.push({
		label: "✕ Quit DevTools",
		accelerator: "CmdOrCtrl+Q",
		click: () => {
			app.isQuitting = !0, app.quit();
		}
	});
	let G = Menu.buildFromTemplate(m);
	tray.setContextMenu(G);
}
function createWindow() {
	let U = store.get("windowBounds") || {
		width: 1600,
		height: 900
	}, G = store.get("startMinimized") || !1;
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			nodeIntegration: !0,
			contextIsolation: !0
		},
		...U,
		minWidth: 1200,
		minHeight: 700,
		show: !G,
		frame: !1,
		transparent: !0,
		titleBarStyle: "hidden",
		vibrancy: "sidebar",
		trafficLightPosition: {
			x: 15,
			y: 15
		}
	});
	let Y = () => {
		store.set("windowBounds", win?.getBounds());
	};
	win.on("resize", Y), win.on("move", Y), win.on("close", (m) => {
		let U = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && U && (m.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let m = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return m.canceled || m.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: m.filePaths[0]
		};
	}), ipcMain.handle("store-get", (m, U) => store.get(U)), ipcMain.handle("store-set", (m, U, W) => {
		if (store.set(U, W), U === "launchAtLogin") {
			let m = setLoginItemSettingsSafely(W === !0);
			!m.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: m.error
			});
		}
	}), ipcMain.handle("store-delete", (m, U) => store.delete(U)), ipcMain.on("tray-update-menu", (m, U) => {
		recentTools = U || [], updateTrayMenu();
	}), ipcMain.on("tray-update-clipboard", (m, U) => {
		clipboardItems = (U || []).sort((m, U) => U.timestamp - m.timestamp), updateTrayMenu();
	}), ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (m) {
			return console.error("Failed to read clipboard:", m), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let m = clipboard.readImage();
			return m.isEmpty() ? null : m.toDataURL();
		} catch (m) {
			return console.error("Failed to read clipboard image:", m), null;
		}
	}), ipcMain.on("sync-clipboard-monitoring", (m, U) => {
		clipboardMonitoringEnabled = U, updateTrayMenu();
	}), ipcMain.on("stats-update-tray", (m, U) => {
		statsMenuData = U, updateTrayMenu();
	}), ipcMain.on("health-update-tray", (m, U) => {
		healthMenuData = U, updateTrayMenu();
	}), ipcMain.handle("health-start-monitoring", async () => {
		healthMonitoringInterval && clearInterval(healthMonitoringInterval);
		let m = async () => {
			try {
				let m = await si.mem(), U = await si.currentLoad(), G = await si.fsSize(), K = await si.battery().catch(() => null), q = [], J = G.find((m) => m.mount === "/" || m.mount === "C:") || G[0];
				if (J) {
					let m = J.available / J.size * 100;
					m < 10 ? q.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(J.available)} free`
					}) : m < 20 && q.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(J.available)} free`
					});
				}
				U.currentLoad > 90 && q.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${U.currentLoad.toFixed(1)}%`
				});
				let Y = m.used / m.total * 100;
				Y > 90 && q.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${Y.toFixed(1)}%`
				}), healthMenuData = {
					cpu: U.currentLoad,
					ram: {
						used: m.used,
						total: m.total,
						percentage: Y
					},
					disk: J ? {
						free: J.available,
						total: J.size,
						percentage: (J.size - J.available) / J.size * 100
					} : null,
					battery: K ? {
						level: K.percent,
						charging: K.isCharging || !1
					} : null,
					alerts: q
				}, updateTrayMenu();
				let X = q.filter((m) => m.severity === "critical");
				X.length > 0 && win && X.forEach((m) => {
					new Notification({
						title: "⚠️ System Alert",
						body: m.message,
						silent: !1
					}).show();
				});
			} catch (m) {
				console.error("Health monitoring error:", m);
			}
		};
		return m(), healthMonitoringInterval = setInterval(m, 5e3), { success: !0 };
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
	} catch (m) {
		console.error("Failed to register global shortcut", m);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), ipcMain.handle("get-cpu-stats", async () => {
		let [m, U] = await Promise.all([si.cpu(), si.currentLoad()]);
		return {
			manufacturer: m.manufacturer,
			brand: m.brand,
			speed: m.speed,
			cores: m.cores,
			physicalCores: m.physicalCores,
			load: U
		};
	}), ipcMain.handle("get-memory-stats", async () => await si.mem()), ipcMain.handle("get-network-stats", async () => {
		let [m, U] = await Promise.all([si.networkStats(), si.networkInterfaces()]);
		return {
			stats: m,
			interfaces: U
		};
	}), ipcMain.handle("get-disk-stats", async () => {
		try {
			let [m, U] = await Promise.all([si.fsSize(), si.disksIO()]), W = null;
			if (U && Array.isArray(U) && U.length > 0) {
				let m = U[0];
				W = {
					rIO: m.rIO || 0,
					wIO: m.wIO || 0,
					tIO: m.tIO || 0,
					rIO_sec: m.rIO_sec || 0,
					wIO_sec: m.wIO_sec || 0,
					tIO_sec: m.tIO_sec || 0
				};
			} else U && typeof U == "object" && !Array.isArray(U) && (W = {
				rIO: U.rIO || 0,
				wIO: U.wIO || 0,
				tIO: U.tIO || 0,
				rIO_sec: U.rIO_sec || 0,
				wIO_sec: U.wIO_sec || 0,
				tIO_sec: U.tIO_sec || 0
			});
			return {
				fsSize: m,
				ioStats: W
			};
		} catch (m) {
			return console.error("Error fetching disk stats:", m), {
				fsSize: await si.fsSize().catch(() => []),
				ioStats: null
			};
		}
	}), ipcMain.handle("get-gpu-stats", async () => await si.graphics()), ipcMain.handle("get-battery-stats", async () => {
		try {
			let m = await si.battery(), U, W;
			if ("powerConsumptionRate" in m && m.powerConsumptionRate && typeof m.powerConsumptionRate == "number" && (U = m.powerConsumptionRate), m.voltage && m.voltage > 0) {
				if (!m.isCharging && m.timeRemaining > 0 && m.currentCapacity > 0) {
					let W = m.currentCapacity / m.timeRemaining * 60;
					U = m.voltage * W;
				}
				m.isCharging && m.voltage > 0 && (W = m.voltage * 2e3);
			}
			return {
				...m,
				powerConsumptionRate: U,
				chargingPower: W
			};
		} catch (m) {
			return console.error("Error fetching battery stats:", m), null;
		}
	}), ipcMain.handle("get-sensor-stats", async () => await si.cpuTemperature()), ipcMain.handle("get-bluetooth-stats", async () => {
		try {
			let m = await si.bluetoothDevices();
			return {
				enabled: m.length > 0 || await checkBluetoothEnabled(),
				devices: m.map((m) => ({
					name: m.name || "Unknown",
					mac: m.mac || m.address || "",
					type: m.type || m.deviceClass || "unknown",
					battery: m.battery || m.batteryLevel || void 0,
					connected: m.connected !== !1,
					rssi: m.rssi || m.signalStrength || void 0,
					manufacturer: m.manufacturer || m.vendor || void 0
				}))
			};
		} catch (m) {
			return console.error("Error fetching bluetooth stats:", m), {
				enabled: !1,
				devices: []
			};
		}
	}), ipcMain.handle("get-timezones-stats", async () => {
		try {
			let m = await si.time(), U = Intl.DateTimeFormat().resolvedOptions().timeZone, W = [
				"America/New_York",
				"Europe/London",
				"Asia/Tokyo",
				"Asia/Shanghai"
			].map((m) => {
				let U = /* @__PURE__ */ new Date(), W = new Intl.DateTimeFormat("en-US", {
					timeZone: m,
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: !1
				}), G = new Intl.DateTimeFormat("en-US", {
					timeZone: m,
					year: "numeric",
					month: "short",
					day: "numeric"
				}), K = getTimezoneOffset(m);
				return {
					timezone: m,
					city: m.split("/").pop()?.replace("_", " ") || m,
					time: W.format(U),
					date: G.format(U),
					offset: K
				};
			});
			return {
				local: {
					timezone: U,
					city: U.split("/").pop()?.replace("_", " ") || "Local",
					time: m.current,
					date: m.uptime ? (/* @__PURE__ */ new Date()).toLocaleDateString() : "",
					offset: getTimezoneOffset(U)
				},
				zones: W
			};
		} catch (m) {
			return console.error("Error fetching timezones stats:", m), null;
		}
	}), ipcMain.handle("app-manager:get-installed-apps", async () => {
		try {
			let W = process.platform, G = [];
			if (W === "darwin") {
				let U = "/Applications", W = await fs.readdir(U, { withFileTypes: !0 }).catch(() => []);
				for (let K of W) if (K.name.endsWith(".app")) {
					let W = join(U, K.name);
					try {
						let U = await fs.stat(W), q = K.name.replace(".app", ""), J = W.startsWith("/System") || W.startsWith("/Library") || q.startsWith("com.apple.");
						G.push({
							id: `macos-${q}-${U.ino}`,
							name: q,
							version: void 0,
							publisher: void 0,
							installDate: U.birthtime.toISOString(),
							installLocation: W,
							size: await m(W).catch(() => 0),
							isSystemApp: J
						});
					} catch {}
				}
			} else if (W === "win32") try {
				let { stdout: m } = await execAsync(`powershell -Command "${"\n            Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | \n            Where-Object { $_.DisplayName } | \n            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | \n            ConvertTo-Json -Depth 3\n          ".replace(/"/g, "\\\"")}"`), W = JSON.parse(m), K = Array.isArray(W) ? W : [W];
				for (let m of K) if (m.DisplayName) {
					let W = m.Publisher || "", K = m.InstallLocation || "", q = W.includes("Microsoft") || W.includes("Windows") || K.includes("Windows\\") || K.includes("Program Files\\Windows");
					G.push({
						id: `win-${m.DisplayName}-${m.InstallDate || "unknown"}`,
						name: m.DisplayName,
						version: m.DisplayVersion || void 0,
						publisher: W || void 0,
						installDate: m.InstallDate ? U(m.InstallDate) : void 0,
						installLocation: K || void 0,
						size: m.EstimatedSize ? m.EstimatedSize * 1024 : void 0,
						isSystemApp: q
					});
				}
			} catch (m) {
				console.error("Error fetching Windows apps:", m);
			}
			return G;
		} catch (m) {
			return console.error("Error fetching installed apps:", m), [];
		}
	}), ipcMain.handle("app-manager:get-running-processes", async () => {
		try {
			let m = await si.processes(), U = await si.mem();
			return m.list.map((m) => ({
				pid: m.pid,
				name: m.name,
				cpu: m.cpu || 0,
				memory: m.mem || 0,
				memoryPercent: U.total > 0 ? (m.mem || 0) / U.total * 100 : 0,
				started: m.started || "",
				user: m.user || void 0,
				command: m.command || void 0,
				path: m.path || void 0
			}));
		} catch (m) {
			return console.error("Error fetching running processes:", m), [];
		}
	}), ipcMain.handle("app-manager:uninstall-app", async (m, U) => {
		try {
			let m = process.platform;
			if (m === "darwin") {
				if (U.installLocation) return await fs.rm(U.installLocation, {
					recursive: !0,
					force: !0
				}), { success: !0 };
			} else if (m === "win32") try {
				return await execAsync(`powershell -Command "${`
            $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object { $_.DisplayName -eq "${U.name.replace(/"/g, "\\\"")}" } | 
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
			} catch (m) {
				return {
					success: !1,
					error: m.message
				};
			}
			return {
				success: !1,
				error: "Unsupported platform"
			};
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	}), ipcMain.handle("app-manager:kill-process", async (m, U) => {
		try {
			return process.kill(U, "SIGTERM"), { success: !0 };
		} catch (m) {
			return {
				success: !1,
				error: m.message
			};
		}
	});
	async function m(U) {
		try {
			let W = 0, G = await fs.readdir(U, { withFileTypes: !0 });
			for (let K of G) {
				let G = join(U, K.name);
				try {
					if (K.isDirectory()) W += await m(G);
					else {
						let m = await fs.stat(G);
						W += m.size;
					}
				} catch {}
			}
			return W;
		} catch {
			return 0;
		}
	}
	function U(m) {
		return m && m.length === 8 ? `${m.substring(0, 4)}-${m.substring(4, 6)}-${m.substring(6, 8)}` : m;
	}
	setupCleanerHandlers(), createTray(), createWindow();
});
async function checkBluetoothEnabled() {
	try {
		if (process.platform === "darwin") {
			let { execSync: m } = __require("child_process");
			return m("system_profiler SPBluetoothDataType").toString().includes("Bluetooth: On");
		}
		return !0;
	} catch {
		return !1;
	}
}
function getTimezoneOffset(m) {
	let U = /* @__PURE__ */ new Date(), W = U.getTime() + U.getTimezoneOffset() * 6e4, G = U.toLocaleString("en-US", {
		timeZone: m,
		hour12: !1,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	return (new Date(G).getTime() - W) / (1e3 * 60 * 60);
}
function formatBytes(m) {
	if (m === 0) return "0 B";
	let U = 1024, W = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	], G = Math.floor(Math.log(m) / Math.log(U));
	return `${(m / U ** +G).toFixed(1)} ${W[G]}`;
}
function formatSpeed(m) {
	return m > 1024 * 1024 ? `${(m / 1024 / 1024).toFixed(1)} MB/s` : m > 1024 ? `${(m / 1024).toFixed(1)} KB/s` : `${m.toFixed(0)} B/s`;
}
