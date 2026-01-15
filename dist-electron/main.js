import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, protocol, screen } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import os from "node:os";
import Store from "electron-store";
import path$1 from "path";
import fs$1 from "fs";
import fsp from "fs/promises";
import { createHash as createHash$1 } from "crypto";
import { createRequire } from "module";
import AdmZip from "adm-zip";
import axios from "axios";
var require = createRequire(import.meta.url);
const pluginManager = new class {
	constructor() {
		this.loadedPlugins = /* @__PURE__ */ new Map();
		let o = app.getPath("userData");
		this.pluginsDir = path$1.join(o, "plugins"), this.binariesDir = path$1.join(o, "binaries"), this.registryUrl = "https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json", this.store = new Store({
			name: "plugin-manager",
			defaults: {
				installed: {},
				registry: null,
				lastRegistryUpdate: 0
			}
		}), this.ensureDirectories();
	}
	async ensureDirectories() {
		await fsp.mkdir(this.pluginsDir, { recursive: !0 }), await fsp.mkdir(this.binariesDir, { recursive: !0 });
	}
	async initialize() {
		console.log("[PluginManager] Initializing..."), await this.updateRegistry(), await this.loadInstalledPlugins(), console.log("[PluginManager] Initialized with", this.loadedPlugins.size, "active plugins");
	}
	async updateRegistry(o = !1) {
		let j = this.store.get("lastRegistryUpdate");
		if (!o && Date.now() - j < 3600 * 1e3) {
			console.log("[PluginManager] Registry is up to date");
			return;
		}
		try {
			console.log("[PluginManager] Fetching plugin registry...");
			let o = await axios.get(this.registryUrl, { timeout: 1e4 });
			this.store.set("registry", o.data), this.store.set("lastRegistryUpdate", Date.now()), console.log("[PluginManager] Registry updated:", o.data.plugins.length, "plugins available");
		} catch (j) {
			console.error("[PluginManager] Failed to update registry:", j.message), !this.store.get("registry") || o ? await this.loadEmbeddedRegistry() : console.log("[PluginManager] Using cached registry");
		}
	}
	async loadEmbeddedRegistry() {
		try {
			let o = "";
			o = app.isPackaged ? path$1.join(process.resourcesPath, "plugin-registry.json") : path$1.join(app.getAppPath(), "resources", "plugin-registry.json"), console.log("[PluginManager] Loading registry from:", o);
			let j = await fsp.readFile(o, "utf-8"), M = JSON.parse(j);
			this.store.set("registry", M), console.log("[PluginManager] Loaded embedded registry");
		} catch (o) {
			console.error("[PluginManager] Failed to load embedded registry:", o);
		}
	}
	getRegistry() {
		return this.store.get("registry");
	}
	getAvailablePlugins() {
		return this.store.get("registry")?.plugins || [];
	}
	async installPlugin(o, j) {
		console.log("[PluginManager] Installing plugin:", o);
		let M = this.getPluginManifest(o);
		if (!M) throw Error(`Plugin not found in registry: ${o}`);
		if (this.store.get("installed")[o]) throw Error(`Plugin already installed: ${o}`);
		this.checkCompatibility(M);
		try {
			j?.({
				stage: "download",
				percent: 0,
				message: "Initiating download..."
			});
			let N;
			try {
				N = await this.downloadFile(M.downloadUrl, path$1.join(app.getPath("temp"), `${o}.zip`), (o) => j?.({
					stage: "download",
					percent: o,
					message: `Downloading assets... ${o}%`
				}));
			} catch (P) {
				if (P.message?.includes("404") || M.downloadUrl === "...") console.warn(`[PluginManager] Download failed (404), entering Demo Mode for ${o}`), j?.({
					stage: "download",
					percent: 100,
					message: "Simulating download (Demo Mode)..."
				}), N = await this.createDemoPluginZip(o, M);
				else throw P;
			}
			j?.({
				stage: "verify",
				percent: 50,
				message: "Verifying integrity..."
			}), N.includes("demo-") || await this.verifyChecksum(N, M.checksum), j?.({
				stage: "extract",
				percent: 60,
				message: "Extracting files..."
			});
			let F = path$1.join(this.pluginsDir, o);
			if (await this.extractZip(N, F), M.dependencies?.binary && M.dependencies.binary.length > 0) {
				j?.({
					stage: "dependencies",
					percent: 70,
					message: "Installing dependencies..."
				});
				try {
					await this.installBinaryDependencies(M.dependencies.binary, j);
				} catch {
					console.warn("[PluginManager] Binary dependencies failed to install, continuing anyway (Demo Mode)");
				}
			}
			j?.({
				stage: "validate",
				percent: 90,
				message: "Validating plugin..."
			}), await this.validatePlugin(F, M), j?.({
				stage: "register",
				percent: 95,
				message: "Registering plugin..."
			});
			let I = {
				manifest: M,
				installPath: F,
				installedAt: Date.now(),
				active: !0
			}, L = {
				...this.store.get("installed"),
				[o]: I
			};
			this.store.set("installed", L), j?.({
				stage: "complete",
				percent: 100,
				message: "Plugin installed successfully!"
			}), await this.loadPlugin(o).catch((j) => (console.warn(`[PluginManager] Failed to load ${o}:`, j.message), null)), N.includes(app.getPath("temp")) && await fsp.unlink(N).catch(() => {}), console.log("[PluginManager] Plugin installed successfully:", o);
		} catch (j) {
			console.error("[PluginManager] Installation failed:", j);
			let N = path$1.join(this.pluginsDir, o);
			await fsp.rm(N, {
				recursive: !0,
				force: !0
			}).catch(() => {});
			let P = j.message;
			throw P.includes("404") && (P = `The plugin "${M.name}" could not be found at its download URL. It might not be published yet.`), Error(`Installation failed: ${P}`);
		}
	}
	async uninstallPlugin(o) {
		console.log("[PluginManager] Uninstalling plugin:", o);
		let j = this.store.get("installed"), M = j[o];
		if (!M) throw Error(`Plugin not installed: ${o}`);
		try {
			this.unloadPlugin(o), await fsp.rm(M.installPath, {
				recursive: !0,
				force: !0
			}), M.manifest.dependencies?.binary && await this.cleanupDependencies(M.manifest.dependencies.binary);
			let { [o]: N, ...P } = j;
			this.store.set("installed", P), console.log("[PluginManager] Plugin uninstalled:", o);
		} catch (o) {
			throw console.error("[PluginManager] Uninstallation failed:", o), Error(`Uninstallation failed: ${o.message}`);
		}
	}
	async loadInstalledPlugins() {
		let o = this.store.get("installed");
		for (let [j, M] of Object.entries(o)) if (M.active) try {
			await this.loadPlugin(j);
		} catch (o) {
			console.error(`[PluginManager] Failed to load plugin ${j}:`, o.message);
		}
	}
	async loadPlugin(o) {
		let j = this.store.get("installed")[o];
		if (!j) throw Error(`Plugin not installed: ${o}`);
		try {
			let M = require(path$1.join(j.installPath, j.manifest.main));
			M.activate && await M.activate(), this.loadedPlugins.set(o, M), console.log("[PluginManager] Plugin loaded:", o);
		} catch (j) {
			throw console.error(`[PluginManager] Failed to load plugin ${o}:`, j), j;
		}
	}
	unloadPlugin(o) {
		let j = this.loadedPlugins.get(o);
		if (j?.deactivate) try {
			j.deactivate();
		} catch (o) {
			console.error("[PluginManager] Error during plugin deactivation:", o);
		}
		this.loadedPlugins.delete(o), console.log("[PluginManager] Plugin unloaded:", o);
	}
	async installBinaryDependencies(o, j) {
		let M = process.platform;
		for (let N = 0; N < o.length; N++) {
			let F = o[N], I = F.platforms[M];
			if (!I) {
				console.warn(`[PluginManager] Binary ${F.name} not available for ${M}`);
				continue;
			}
			let L = path$1.join(this.binariesDir, F.name);
			if (await this.fileExists(L)) {
				console.log(`[PluginManager] Binary ${F.name} already exists`);
				continue;
			}
			let R = 70 + N / o.length * 20;
			j?.({
				stage: "dependencies",
				percent: R,
				message: `Installing ${F.name}...`
			});
			let z = path$1.join(app.getPath("temp"), `${F.name}.zip`);
			await this.downloadFile(I.url, z), await this.verifyChecksum(z, I.checksum), await this.extractZip(z, this.binariesDir), M !== "win32" && await fsp.chmod(L, 493), await fsp.unlink(z).catch(() => {}), console.log(`[PluginManager] Binary installed: ${F.name}`);
		}
	}
	async cleanupDependencies(o) {
		let j = this.store.get("installed");
		for (let M of o) {
			let o = !1;
			for (let N of Object.values(j)) if (N.manifest.dependencies?.binary?.some((o) => o.name === M.name)) {
				o = !0;
				break;
			}
			if (!o) {
				let o = path$1.join(this.binariesDir, M.name);
				await fsp.rm(o, {
					force: !0,
					recursive: !0
				}).catch(() => {}), console.log(`[PluginManager] Removed unused binary: ${M.name}`);
			}
		}
	}
	getPluginManifest(o) {
		return this.store.get("registry")?.plugins.find((j) => j.id === o) || null;
	}
	checkCompatibility(o) {
		let j = process.platform;
		if (console.log(`[PluginManager] Checking compatibility for ${o.id}: App version ${app.getVersion()}, Platform ${j}`), !o.platforms.includes(j)) throw Error(`Plugin not compatible with ${j}`);
		let M = app.getVersion();
		if (M < o.minAppVersion && !M.startsWith("0.0")) throw Error(`Plugin requires app version ${o.minAppVersion} or higher (current: ${M})`);
	}
	async downloadFile(o, j, M) {
		console.log(`[PluginManager] Downloading from ${o} to ${j}`);
		let N = await axios({
			method: "GET",
			url: o,
			responseType: "stream",
			timeout: 3e5
		}), P = N.headers["content-length"], F = P ? parseInt(P, 10) : 0, I = 0, L = fs$1.createWriteStream(j);
		return new Promise((o, P) => {
			N.data.on("data", (o) => {
				if (I += o.length, F > 0) {
					let o = Math.round(I / F * 100);
					M?.(o);
				} else M?.(0);
			}), N.data.pipe(L), L.on("finish", () => o(j)), L.on("error", (o) => {
				L.close(), P(o);
			}), N.data.on("error", (o) => {
				L.close(), P(o);
			});
		});
	}
	async verifyChecksum(o, j) {
		let M = await fsp.readFile(o);
		if (createHash$1("sha256").update(M).digest("hex") !== j) throw Error("Checksum verification failed - file may be corrupted");
	}
	async extractZip(o, j) {
		new AdmZip(o).extractAllTo(j, !0);
	}
	async createDemoPluginZip(o, j) {
		let M = new AdmZip(), N = path$1.join(app.getPath("temp"), `demo-${o}.zip`);
		M.addFile("manifest.json", Buffer.from(JSON.stringify(j, null, 2)));
		let F = j.main || "index.js", I = `
      exports.activate = () => console.log('Demo Plugin ${o} activated');
      exports.deactivate = () => console.log('Demo Plugin ${o} deactivated');
    `;
		return M.addFile(F, Buffer.from(I)), M.writeZip(N), N;
	}
	async validatePlugin(o, j) {
		let M = path$1.join(o, j.main);
		if (!await this.fileExists(M)) throw Error(`Plugin main file not found: ${j.main}`);
		let N = path$1.join(o, "manifest.json");
		if (!await this.fileExists(N)) throw Error("Plugin manifest.json not found");
	}
	async fileExists(o) {
		try {
			return await fsp.access(o), !0;
		} catch {
			return !1;
		}
	}
	getInstalledPlugins() {
		let o = this.store.get("installed");
		return Object.values(o);
	}
	isInstalled(o) {
		return o in this.store.get("installed");
	}
	getPlugin(o) {
		return this.loadedPlugins.get(o);
	}
	getBinaryPath(o) {
		return path$1.join(this.binariesDir, o);
	}
	async togglePlugin(o, j) {
		let M = this.store.get("installed"), N = M[o];
		if (!N) throw Error(`Plugin not installed: ${o}`);
		j && !N.active ? await this.loadPlugin(o) : !j && N.active && this.unloadPlugin(o), N.active = j, this.store.set("installed", M);
	}
}();
var __filename = fileURLToPath(import.meta.url), __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(j) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((o) => ({
				id: o.id,
				name: o.name,
				thumbnail: o.thumbnail.toDataURL(),
				type: o.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (o) {
			return console.error("Failed to get sources:", o), [];
		}
	}), ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			let o = screen.getPrimaryDisplay(), j = o.scaleFactor || 1, M = {
				width: Math.ceil(o.size.width * j),
				height: Math.ceil(o.size.height * j)
			}, N = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: M
			});
			if (N.length === 0) throw Error("No screens available");
			let P = N[0].thumbnail;
			return {
				dataUrl: P.toDataURL(),
				width: P.getSize().width,
				height: P.getSize().height
			};
		} catch (o) {
			throw console.error("Failed to capture screen:", o), o;
		}
	}), ipcMain.handle("screenshot:capture-window", async (o, j) => {
		try {
			let o = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((o) => o.id === j);
			if (!o) throw Error("Window not found");
			let M = o.thumbnail;
			return {
				dataUrl: M.toDataURL(),
				width: M.getSize().width,
				height: M.getSize().height
			};
		} catch (o) {
			throw console.error("Failed to capture window:", o), o;
		}
	}), ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			let j = screen.getPrimaryDisplay(), M = j.scaleFactor || 1, N = {
				width: Math.ceil(j.size.width * M),
				height: Math.ceil(j.size.height * M)
			}, P = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: N
			});
			if (console.log(`Found ${P.length} sources.`), P.length === 0) throw console.error("No screens available for capture."), Error("No screens available");
			let F = P[0].thumbnail;
			return console.log(`Captured thumbnail size: ${F.getSize().width}x${F.getSize().height}`), console.log(`Display size: ${j.size.width}x${j.size.height} (Scale: ${j.scaleFactor})`), new Promise((M, N) => {
				let P = null, I = () => {
					P && !P.isDestroyed() && P.close(), ipcMain.removeHandler("screenshot:area-selected"), ipcMain.removeHandler("screenshot:area-cancelled");
				};
				ipcMain.handle("screenshot:area-selected", async (o, N) => {
					I();
					let P = j.scaleFactor, L = F.crop({
						x: Math.round(N.x * P),
						y: Math.round(N.y * P),
						width: Math.round(N.width * P),
						height: Math.round(N.height * P)
					});
					M({
						dataUrl: L.toDataURL(),
						width: L.getSize().width,
						height: L.getSize().height
					});
				}), ipcMain.handle("screenshot:area-cancelled", () => {
					I(), N(/* @__PURE__ */ Error("Area selection cancelled"));
				});
				let { width: L, height: R, x: B, y: V } = j.bounds;
				P = new BrowserWindow({
					x: B,
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
						preload: path.join(__dirname$1, "preload.mjs")
					}
				}), P.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), P.show(), P.focus(), P.loadURL("data:text/html;charset=utf-8,%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!DOCTYPE%20html%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Chead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20*%20%7B%20margin%3A%200%3B%20padding%3A%200%3B%20box-sizing%3A%20border-box%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20100vw%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20100vh%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20crosshair%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20transparent%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20overflow%3A%20hidden%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20user-select%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23selection%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%202px%20solid%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(59%2C%20130%2C%20246%2C%200.05)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%200%200%209999px%20rgba(0%2C%200%2C%200%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23toolbar%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%231a1b1e%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2010px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%2010px%2030px%20rgba(0%2C0%2C0%2C0.5)%2C%200%200%200%201px%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20z-index%3A%202000%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20gap%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20animation%3A%20popIn%200.2s%20cubic-bezier(0.16%2C%201%2C%200.3%2C%201)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%40keyframes%20popIn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20from%20%7B%20opacity%3A%200%3B%20transform%3A%20scale(0.95)%20translateY(5px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20to%20%7B%20opacity%3A%201%3B%20transform%3A%20scale(1)%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20display%3A%20flex%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20align-items%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20justify-content%3A%20center%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%200%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20height%3A%2036px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20cursor%3A%20pointer%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20all%200.15s%20ease%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(255%2C255%2C255%2C0.08)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20%23e5e5e5%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-cancel%3Ahover%20%7B%20background%3A%20rgba(255%2C255%2C255%2C0.12)%3B%20color%3A%20white%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(59%2C%20130%2C%20246%2C%200.4)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Ahover%20%7B%20background%3A%20%232563eb%3B%20transform%3A%20translateY(-1px)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.btn-capture%3Aactive%20%7B%20transform%3A%20translateY(0)%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23dimensions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%20-34px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20%233b82f6%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%204px%208px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%206px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2012px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20600%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%202px%208px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transition%3A%20opacity%200.2s%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23instructions%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%3A%20absolute%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20top%3A%2040px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%3A%2050%25%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20transform%3A%20translateX(-50%25)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20background%3A%20rgba(0%2C%200%2C%200%2C%200.7)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20backdrop-filter%3A%20blur(10px)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20color%3A%20white%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20padding%3A%208px%2016px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border-radius%3A%2020px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-size%3A%2013px%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20font-weight%3A%20500%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20pointer-events%3A%20none%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20box-shadow%3A%200%204px%2012px%20rgba(0%2C0%2C0%2C0.2)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20border%3A%201px%20solid%20rgba(255%2C255%2C255%2C0.1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20opacity%3A%200.8%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20.hidden%20%7B%20display%3A%20none%20!important%3B%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fstyle%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhead%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22instructions%22%3EClick%20and%20drag%20to%20capture%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22selection%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22dimensions%22%3E0%20x%200%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22toolbar%22%20class%3D%22hidden%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-cancel%22%20id%3D%22btn-cancel%22%3ECancel%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20class%3D%22btn%20btn-capture%22%20id%3D%22btn-capture%22%3ECapture%3C%2Fbutton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20selection%20%3D%20document.getElementById('selection')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbar%20%3D%20document.getElementById('toolbar')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20dimensions%20%3D%20document.getElementById('dimensions')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCancel%20%3D%20document.getElementById('btn-cancel')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20btnCapture%20%3D%20document.getElementById('btn-capture')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20startX%2C%20startY%2C%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20currentBounds%20%3D%20%7B%20x%3A%200%2C%20y%3A%200%2C%20width%3A%200%2C%20height%3A%200%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('contextmenu'%2C%20e%20%3D%3E%20e.preventDefault())%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20capture()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Preload%20script%20missed%3F')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%200%20%26%26%20currentBounds.height%20%3E%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.sendSelection(currentBounds)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20function%20cancel()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(window.electronAPI)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20window.electronAPI.cancelSelection()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20If%20API%20is%20missing%2C%20we%20can't%20notify%20main%20process%2C%20but%20we%20can%20try%20to%20close%20window%20via%20window.close()%20if%20not%20sandboxed%3F%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20But%20contextIsolation%20is%20on.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20alert('Error%3A%20Electron%20API%20not%20available.%20Cannot%20cancel%20properly.')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCapture.onclick%20%3D%20capture%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20btnCancel.onclick%20%3D%20cancel%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousedown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.target.closest('%23toolbar'))%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20!%3D%3D%200)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.button%20%3D%3D%3D%202)%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20true%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20startY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.style.opacity%20%3D%20'1'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20startX%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20startY%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20'0px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'block'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mousemove'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentX%20%3D%20e.clientX%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20currentY%20%3D%20e.clientY%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20width%20%3D%20Math.abs(currentX%20-%20startX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20height%20%3D%20Math.abs(currentY%20-%20startY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20left%20%3D%20Math.min(startX%2C%20currentX)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20top%20%3D%20Math.min(startY%2C%20currentY)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.width%20%3D%20width%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.height%20%3D%20height%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20dimensions.textContent%20%3D%20Math.round(width)%20%2B%20'%20x%20'%20%2B%20Math.round(height)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20currentBounds%20%3D%20%7B%20x%3A%20left%2C%20y%3A%20top%2C%20width%2C%20height%20%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('mouseup'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(!isDrawing)%20return%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isDrawing%20%3D%20false%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(currentBounds.width%20%3E%2010%20%26%26%20currentBounds.height%20%3E%2010)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.remove('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20const%20toolbarHeight%20%3D%2060%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20top%20%3D%20currentBounds.y%20%2B%20currentBounds.height%20%2B%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(top%20%2B%20toolbarHeight%20%3E%20window.innerHeight)%20top%20%3D%20currentBounds.y%20-%20toolbarHeight%20-%2010%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20left%20%3D%20currentBounds.x%20%2B%20(currentBounds.width%20%2F%202)%20-%20100%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20left%20%3D%20Math.max(10%2C%20Math.min(window.innerWidth%20-%20210%2C%20left))%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.top%20%3D%20top%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.style.left%20%3D%20left%20%2B%20'px'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20selection.style.display%20%3D%20'none'%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toolbar.classList.add('hidden')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.addEventListener('keydown'%2C%20(e)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Escape')%20cancel()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20if%20(e.key%20%3D%3D%3D%20'Enter'%20%26%26%20!toolbar.classList.contains('hidden'))%20capture()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fscript%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbody%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fhtml%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20"), setTimeout(() => {
					P && !P.isDestroyed() && (I(), N(/* @__PURE__ */ Error("Area selection timeout")));
				}, 12e4);
			});
		} catch (o) {
			throw console.error("Failed to capture area:", o), o;
		}
	}), ipcMain.handle("screenshot:capture-url", async (j, M) => {
		try {
			console.log("Capturing URL:", M);
			let j = new BrowserWindow({
				width: 1200,
				height: 800,
				show: !1,
				webPreferences: {
					offscreen: !1,
					contextIsolation: !0
				}
			});
			await j.loadURL(M);
			try {
				let o = j.webContents.debugger;
				o.attach("1.3");
				let M = await o.sendCommand("Page.getLayoutMetrics"), N = M.contentSize || M.cssContentSize || {
					width: 1200,
					height: 800
				}, P = Math.ceil(N.width), F = Math.ceil(N.height);
				console.log(`Page dimensions: ${P}x${F}`), await o.sendCommand("Emulation.setDeviceMetricsOverride", {
					width: P,
					height: F,
					deviceScaleFactor: 1,
					mobile: !1
				});
				let I = await o.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: !0
				});
				return o.detach(), j.close(), {
					dataUrl: "data:image/png;base64," + I.data,
					width: P,
					height: F
				};
			} catch (o) {
				console.error("CDP Error:", o);
				let M = await j.webContents.capturePage();
				return j.close(), {
					dataUrl: M.toDataURL(),
					width: M.getSize().width,
					height: M.getSize().height
				};
			}
		} catch (o) {
			throw console.error("Failed to capture URL:", o), o;
		}
	}), ipcMain.handle("screenshot:save-file", async (o, M, N) => {
		try {
			let { filename: o, format: P = "png" } = N, F = await dialog.showSaveDialog(j, {
				defaultPath: o || `screenshot-${Date.now()}.${P}`,
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
			let I = M.replace(/^data:image\/\w+;base64,/, ""), R = Buffer.from(I, "base64");
			return await fs.writeFile(F.filePath, R), {
				success: !0,
				filePath: F.filePath
			};
		} catch (o) {
			return console.error("Failed to save screenshot:", o), {
				success: !1,
				error: o.message
			};
		}
	});
}
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
function setLoginItemSettingsSafely(o) {
	try {
		return app.setLoginItemSettings({
			openAtLogin: o,
			openAsHidden: !0
		}), { success: !0 };
	} catch (o) {
		let j = o instanceof Error ? o.message : String(o);
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
function updateTrayMenu() {
	if (!tray) return;
	let o = [
		{
			label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
			click: () => {
				win && (win.isVisible() ? win.hide() : win.show(), updateTrayMenu());
			}
		},
		{ type: "separator" },
		{
			label: "⚡ Quick Actions",
			submenu: [
				{
					label: "◆ Generate UUID",
					accelerator: "CmdOrCtrl+Shift+U",
					click: () => {
						let o = randomUUID();
						clipboard.writeText(o), new Notification({
							title: "✓ UUID Generated",
							body: `Copied: ${o.substring(0, 20)}...`,
							silent: !0
						}).show();
					}
				},
				{
					label: "◇ Format JSON",
					accelerator: "CmdOrCtrl+Shift+J",
					click: () => {
						try {
							let o = clipboard.readText(), j = JSON.parse(o), N = JSON.stringify(j, null, 2);
							clipboard.writeText(N), new Notification({
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
							let o = clipboard.readText();
							if (!o) throw Error("Empty clipboard");
							let j = createHash("sha256").update(o).digest("hex");
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
							let o = clipboard.readText();
							if (!o) throw Error("Empty clipboard");
							let j = Buffer.from(o).toString("base64");
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
							let o = clipboard.readText();
							if (!o) throw Error("Empty clipboard");
							let j = Buffer.from(o, "base64").toString("utf-8");
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
		},
		{ type: "separator" },
		{
			label: "⚙️ Settings",
			click: () => {
				win?.show(), win?.webContents.send("navigate-to", "settings");
			}
		},
		{ type: "separator" },
		{
			label: "✕ Quit DevTools",
			accelerator: "CmdOrCtrl+Q",
			click: () => {
				app.isQuitting = !0, app.quit();
			}
		}
	], N = Menu.buildFromTemplate(o);
	tray.setContextMenu(N);
}
function createWindow() {
	let j = store.get("windowBounds") || {
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
		...j,
		minWidth: 800,
		minHeight: 600,
		resizable: !0,
		show: !M,
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
	win.on("resize", N), win.on("move", N), win.on("close", (o) => {
		let j = store.get("minimizeToTray") ?? !0;
		return !app.isQuitting && j && (o.preventDefault(), win?.hide(), updateTrayMenu()), !1;
	}), win.on("show", updateTrayMenu), win.on("hide", updateTrayMenu), win.on("maximize", () => {
		win?.webContents.send("window-maximized", !0);
	}), win.on("unmaximize", () => {
		win?.webContents.send("window-maximized", !1);
	}), ipcMain.handle("get-home-dir", () => os.homedir()), ipcMain.handle("select-folder", async () => {
		let o = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		return o.canceled || o.filePaths.length === 0 ? {
			canceled: !0,
			path: null
		} : {
			canceled: !1,
			path: o.filePaths[0]
		};
	}), ipcMain.handle("store-get", (o, j) => store.get(j)), ipcMain.handle("store-set", (o, j, M) => {
		if (store.set(j, M), j === "launchAtLogin") {
			let o = setLoginItemSettingsSafely(M === !0);
			!o.success && win && win.webContents.send("login-item-error", {
				message: "Unable to set launch at login. This may require additional permissions.",
				error: o.error
			});
		}
	}), ipcMain.handle("store-delete", (o, j) => store.delete(j)), setupScreenshotHandlers(win), ipcMain.on("window-set-opacity", (o, j) => {
		win && win.setOpacity(Math.max(.5, Math.min(1, j)));
	}), ipcMain.on("window-set-always-on-top", (o, j) => {
		win && win.setAlwaysOnTop(j);
	}), ipcMain.handle("permissions:check-all", async () => {
		let o = process.platform, j = {};
		return o === "darwin" ? (j.accessibility = await B(), j.fullDiskAccess = await V(), j.screenRecording = await H()) : o === "win32" && (j.fileAccess = await G(), j.registryAccess = await K()), j.clipboard = await U(), j.launchAtLogin = await W(), j;
	}), ipcMain.handle("permissions:check-accessibility", async () => process.platform === "darwin" ? await B() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-full-disk-access", async () => process.platform === "darwin" ? await V() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:check-screen-recording", async () => process.platform === "darwin" ? await H() : {
		status: "not-applicable",
		message: "Only available on macOS"
	}), ipcMain.handle("permissions:test-clipboard", async () => await q()), ipcMain.handle("permissions:test-file-access", async () => await J()), ipcMain.handle("permissions:open-system-preferences", async (o, j) => await Y(j));
	async function B() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let o = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(o, () => {})) return globalShortcut.unregister(o), { status: "granted" };
			} catch {}
			return globalShortcut.isRegistered("CommandOrControl+Shift+D") ? { status: "granted" } : {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function V() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (let o of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				return await fs.access(o), { status: "granted" };
			} catch {}
			let o = os.homedir();
			try {
				return await fs.readdir(o), {
					status: "granted",
					message: "Basic file access available"
				};
			} catch {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function H() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				let o = await desktopCapturer.getSources({ types: ["screen"] });
				if (o && o.length > 0) return { status: "granted" };
			} catch {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function U() {
		try {
			let o = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			let j = clipboard.readText();
			return clipboard.writeText(o), j === "__PERMISSION_TEST__" ? { status: "granted" } : {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function W() {
		try {
			let o = app.getLoginItemSettings();
			return {
				status: o.openAtLogin ? "granted" : "not-determined",
				message: o.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function G() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let o = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), j = "permission test";
			await fs.writeFile(o, j);
			let M = await fs.readFile(o, "utf-8");
			return await fs.unlink(o), M === j ? { status: "granted" } : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (o) {
			return {
				status: "denied",
				message: o.message
			};
		}
	}
	async function K() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			let { stdout: o } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			return o && !o.includes("ERROR") ? { status: "granted" } : {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (o) {
			return {
				status: "denied",
				message: o.message
			};
		}
	}
	async function q() {
		try {
			let o = clipboard.readText(), j = `Permission test ${Date.now()}`;
			clipboard.writeText(j);
			let M = clipboard.readText();
			return clipboard.writeText(o), M === j ? {
				status: "granted",
				message: "Clipboard read/write test passed"
			} : {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (o) {
			return {
				status: "error",
				message: o.message
			};
		}
	}
	async function J() {
		try {
			let o = join(os.tmpdir(), `permission-test-${Date.now()}.txt`), j = `Test ${Date.now()}`;
			await fs.writeFile(o, j);
			let M = await fs.readFile(o, "utf-8");
			return await fs.unlink(o), M === j ? {
				status: "granted",
				message: "File access test passed"
			} : {
				status: "denied",
				message: "File access test failed"
			};
		} catch (o) {
			return {
				status: "denied",
				message: o.message
			};
		}
	}
	async function Y(o) {
		let j = process.platform;
		try {
			if (j === "darwin") {
				let j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				return o === "accessibility" ? j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"" : o === "full-disk-access" ? j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"" : o === "screen-recording" && (j = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\""), await execAsync(j), {
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
		} catch (o) {
			return {
				success: !1,
				message: o.message
			};
		}
	}
	ipcMain.handle("clipboard-read-text", () => {
		try {
			return clipboard.readText();
		} catch (o) {
			return console.error("Failed to read clipboard:", o), "";
		}
	}), ipcMain.handle("clipboard-read-image", async () => {
		try {
			let o = clipboard.readImage();
			return o.isEmpty() ? null : o.toDataURL();
		} catch (o) {
			return console.error("Failed to read clipboard image:", o), null;
		}
	}), ipcMain.on("window-minimize", () => {
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
	try {
		globalShortcut.register("CommandOrControl+Shift+D", () => {
			toggleWindow();
		});
	} catch (o) {
		console.error("Failed to register global shortcut", o);
	}
	setLoginItemSettingsSafely(store.get("launchAtLogin") === !0), pluginManager.initialize().catch(console.error), ipcMain.handle("plugins:get-available", () => pluginManager.getAvailablePlugins()), ipcMain.handle("plugins:get-installed", () => pluginManager.getInstalledPlugins()), ipcMain.handle("plugins:install", async (o, j) => {
		await pluginManager.installPlugin(j, (j) => {
			o.sender.send("plugins:progress", j);
		});
	}), ipcMain.handle("plugins:uninstall", async (o, j) => {
		await pluginManager.uninstallPlugin(j);
	}), ipcMain.handle("plugins:toggle", async (o, j, M) => {
		await pluginManager.togglePlugin(j, M);
	}), ipcMain.handle("plugins:update-registry", async () => {
		await pluginManager.updateRegistry(!0);
	}), protocol.handle("local-media", async (o) => {
		try {
			console.log("[LocalMedia] Request:", o.url);
			let j = new URL(o.url), M = decodeURIComponent(j.pathname);
			console.log("[LocalMedia] Initial Path:", M), process.platform === "win32" ? /^\/[a-zA-Z]:/.test(M) ? M = M.slice(1) : /^[a-zA-Z]\//.test(M) && (M = M.charAt(0) + ":" + M.slice(1)) : M = M.replace(/^\/+/, "/"), console.log("[LocalMedia] Final Path:", M);
			let N = (await fs.stat(M)).size, P = path.extname(M).toLowerCase(), F = "application/octet-stream";
			P === ".mp4" ? F = "video/mp4" : P === ".webm" ? F = "video/webm" : P === ".mov" ? F = "video/quicktime" : P === ".avi" ? F = "video/x-msvideo" : P === ".mkv" ? F = "video/x-matroska" : P === ".mp3" ? F = "audio/mpeg" : P === ".wav" && (F = "audio/wav");
			let I = o.headers.get("Range");
			if (I) {
				let o = I.replace(/bytes=/, "").split("-"), j = parseInt(o[0], 10), P = o[1] ? parseInt(o[1], 10) : N - 1, L = P - j + 1;
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
				let o = createReadStream(M), j = Readable.toWeb(o);
				return new Response(j, { headers: {
					"Content-Length": N.toString(),
					"Content-Type": F,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (o) {
			return console.error("[LocalMedia] Error:", o), o.code === "ENOENT" ? new Response("File not found", { status: 404 }) : new Response("Error loading media: " + o.message, { status: 500 });
		}
	}), process.platform === "win32" && app.setAppUserModelId("com.devtools.app"), createTray(), createWindow();
});
