import { BrowserWindow, Menu, Notification, Tray, app, clipboard, desktopCapturer, dialog, globalShortcut, ipcMain, nativeImage, protocol, screen } from "electron";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import Store from "electron-store";
import path$1 from "path";
import fs$1 from "fs/promises";
import { createHash as createHash$1 } from "crypto";
import { createRequire } from "module";
import AdmZip from "adm-zip";
import axios from "axios";
var require = createRequire(import.meta.url);
var PluginManager = class {
	constructor() {
		this.loadedPlugins = /* @__PURE__ */ new Map();
		const userDataPath = app.getPath("userData");
		this.pluginsDir = path$1.join(userDataPath, "plugins");
		this.binariesDir = path$1.join(userDataPath, "binaries");
		this.registryUrl = "https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json";
		this.store = new Store({
			name: "plugin-manager",
			defaults: {
				installed: {},
				registry: null,
				lastRegistryUpdate: 0
			}
		});
		this.ensureDirectories();
	}
	async ensureDirectories() {
		await fs$1.mkdir(this.pluginsDir, { recursive: true });
		await fs$1.mkdir(this.binariesDir, { recursive: true });
	}
	async initialize() {
		console.log("[PluginManager] Initializing...");
		await this.updateRegistry();
		await this.loadInstalledPlugins();
		console.log("[PluginManager] Initialized with", this.loadedPlugins.size, "active plugins");
	}
	async updateRegistry(force = false) {
		const lastUpdate = this.store.get("lastRegistryUpdate");
		if (!force && Date.now() - lastUpdate < 3600 * 1e3) {
			console.log("[PluginManager] Registry is up to date");
			return;
		}
		try {
			console.log("[PluginManager] Fetching plugin registry...");
			const response = await axios.get(this.registryUrl, { timeout: 1e4 });
			this.store.set("registry", response.data);
			this.store.set("lastRegistryUpdate", Date.now());
			console.log("[PluginManager] Registry updated:", response.data.plugins.length, "plugins available");
		} catch (error) {
			console.error("[PluginManager] Failed to update registry:", error.message);
			if (!this.store.get("registry") || force) await this.loadEmbeddedRegistry();
			else console.log("[PluginManager] Using cached registry");
		}
	}
	async loadEmbeddedRegistry() {
		try {
			let registryPath = "";
			if (app.isPackaged) registryPath = path$1.join(process.resourcesPath, "plugin-registry.json");
			else registryPath = path$1.join(app.getAppPath(), "resources", "plugin-registry.json");
			console.log("[PluginManager] Loading registry from:", registryPath);
			const data = await fs$1.readFile(registryPath, "utf-8");
			const registry = JSON.parse(data);
			this.store.set("registry", registry);
			console.log("[PluginManager] Loaded embedded registry");
		} catch (error) {
			console.error("[PluginManager] Failed to load embedded registry:", error);
		}
	}
	getRegistry() {
		return this.store.get("registry");
	}
	getAvailablePlugins() {
		return this.store.get("registry")?.plugins || [];
	}
	async installPlugin(pluginId, onProgress) {
		console.log("[PluginManager] Installing plugin:", pluginId);
		const manifest = this.getPluginManifest(pluginId);
		if (!manifest) throw new Error(`Plugin not found in registry: ${pluginId}`);
		if (this.store.get("installed")[pluginId]) throw new Error(`Plugin already installed: ${pluginId}`);
		this.checkCompatibility(manifest);
		try {
			onProgress?.({
				stage: "download",
				percent: 0,
				message: "Downloading plugin..."
			});
			const pluginZipPath = await this.downloadFile(manifest.downloadUrl, path$1.join(app.getPath("temp"), `${pluginId}.zip`), (percent) => onProgress?.({
				stage: "download",
				percent,
				message: `Downloading... ${percent}%`
			}));
			onProgress?.({
				stage: "verify",
				percent: 50,
				message: "Verifying integrity..."
			});
			await this.verifyChecksum(pluginZipPath, manifest.checksum);
			onProgress?.({
				stage: "extract",
				percent: 60,
				message: "Extracting files..."
			});
			const pluginPath = path$1.join(this.pluginsDir, pluginId);
			await this.extractZip(pluginZipPath, pluginPath);
			if (manifest.dependencies?.binary && manifest.dependencies.binary.length > 0) {
				onProgress?.({
					stage: "dependencies",
					percent: 70,
					message: "Installing dependencies..."
				});
				await this.installBinaryDependencies(manifest.dependencies.binary, onProgress);
			}
			onProgress?.({
				stage: "validate",
				percent: 90,
				message: "Validating plugin..."
			});
			await this.validatePlugin(pluginPath, manifest);
			onProgress?.({
				stage: "register",
				percent: 95,
				message: "Registering plugin..."
			});
			const installedPlugin = {
				manifest,
				installPath: pluginPath,
				installedAt: Date.now(),
				active: true
			};
			const updatedInstalled = {
				...this.store.get("installed"),
				[pluginId]: installedPlugin
			};
			this.store.set("installed", updatedInstalled);
			onProgress?.({
				stage: "complete",
				percent: 100,
				message: "Plugin installed successfully!"
			});
			await this.loadPlugin(pluginId);
			await fs$1.unlink(pluginZipPath).catch(() => {});
			console.log("[PluginManager] Plugin installed successfully:", pluginId);
		} catch (error) {
			console.error("[PluginManager] Installation failed:", error);
			const pluginPath = path$1.join(this.pluginsDir, pluginId);
			await fs$1.rm(pluginPath, {
				recursive: true,
				force: true
			}).catch(() => {});
			throw new Error(`Installation failed: ${error.message}`);
		}
	}
	async uninstallPlugin(pluginId) {
		console.log("[PluginManager] Uninstalling plugin:", pluginId);
		const installed = this.store.get("installed");
		const plugin = installed[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		try {
			this.unloadPlugin(pluginId);
			await fs$1.rm(plugin.installPath, {
				recursive: true,
				force: true
			});
			if (plugin.manifest.dependencies?.binary) await this.cleanupDependencies(plugin.manifest.dependencies.binary);
			const { [pluginId]: removed, ...remaining } = installed;
			this.store.set("installed", remaining);
			console.log("[PluginManager] Plugin uninstalled:", pluginId);
		} catch (error) {
			console.error("[PluginManager] Uninstallation failed:", error);
			throw new Error(`Uninstallation failed: ${error.message}`);
		}
	}
	async loadInstalledPlugins() {
		const installed = this.store.get("installed");
		for (const [pluginId, plugin] of Object.entries(installed)) if (plugin.active) try {
			await this.loadPlugin(pluginId);
		} catch (error) {
			console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error.message);
		}
	}
	async loadPlugin(pluginId) {
		const plugin = this.store.get("installed")[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		try {
			const pluginModule = require(path$1.join(plugin.installPath, plugin.manifest.main));
			if (pluginModule.activate) await pluginModule.activate();
			this.loadedPlugins.set(pluginId, pluginModule);
			console.log("[PluginManager] Plugin loaded:", pluginId);
		} catch (error) {
			console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
			throw error;
		}
	}
	unloadPlugin(pluginId) {
		const pluginModule = this.loadedPlugins.get(pluginId);
		if (pluginModule?.deactivate) try {
			pluginModule.deactivate();
		} catch (error) {
			console.error(`[PluginManager] Error during plugin deactivation:`, error);
		}
		this.loadedPlugins.delete(pluginId);
		console.log("[PluginManager] Plugin unloaded:", pluginId);
	}
	async installBinaryDependencies(dependencies, onProgress) {
		const platform = process.platform;
		for (let i = 0; i < dependencies.length; i++) {
			const dep = dependencies[i];
			const platformInfo = dep.platforms[platform];
			if (!platformInfo) {
				console.warn(`[PluginManager] Binary ${dep.name} not available for ${platform}`);
				continue;
			}
			const binaryPath = path$1.join(this.binariesDir, dep.name);
			if (await this.fileExists(binaryPath)) {
				console.log(`[PluginManager] Binary ${dep.name} already exists`);
				continue;
			}
			const basePercent = 70 + i / dependencies.length * 20;
			onProgress?.({
				stage: "dependencies",
				percent: basePercent,
				message: `Installing ${dep.name}...`
			});
			const tempPath = path$1.join(app.getPath("temp"), `${dep.name}.zip`);
			await this.downloadFile(platformInfo.url, tempPath);
			await this.verifyChecksum(tempPath, platformInfo.checksum);
			await this.extractZip(tempPath, this.binariesDir);
			if (platform !== "win32") await fs$1.chmod(binaryPath, 493);
			await fs$1.unlink(tempPath).catch(() => {});
			console.log(`[PluginManager] Binary installed: ${dep.name}`);
		}
	}
	async cleanupDependencies(dependencies) {
		const installed = this.store.get("installed");
		for (const dep of dependencies) {
			let inUse = false;
			for (const plugin of Object.values(installed)) if (plugin.manifest.dependencies?.binary?.some((d) => d.name === dep.name)) {
				inUse = true;
				break;
			}
			if (!inUse) {
				const binaryPath = path$1.join(this.binariesDir, dep.name);
				await fs$1.rm(binaryPath, {
					force: true,
					recursive: true
				}).catch(() => {});
				console.log(`[PluginManager] Removed unused binary: ${dep.name}`);
			}
		}
	}
	getPluginManifest(pluginId) {
		return this.store.get("registry")?.plugins.find((p) => p.id === pluginId) || null;
	}
	checkCompatibility(manifest) {
		if (!manifest.platforms.includes(process.platform)) throw new Error(`Plugin not compatible with ${process.platform}`);
		if (app.getVersion() < manifest.minAppVersion) throw new Error(`Plugin requires app version ${manifest.minAppVersion} or higher`);
	}
	async downloadFile(url, destination, onProgress) {
		const response = await axios({
			method: "GET",
			url,
			responseType: "stream",
			timeout: 3e5
		});
		const totalSize = parseInt(response.headers["content-length"], 10);
		let downloadedSize = 0;
		const writer = require("fs").createWriteStream(destination);
		response.data.on("data", (chunk) => {
			downloadedSize += chunk.length;
			const percent = Math.round(downloadedSize / totalSize * 100);
			onProgress?.(percent);
		});
		response.data.pipe(writer);
		return new Promise((resolve, reject) => {
			writer.on("finish", () => resolve(destination));
			writer.on("error", reject);
		});
	}
	async verifyChecksum(filePath, expectedChecksum) {
		const fileBuffer = await fs$1.readFile(filePath);
		if (createHash$1("sha256").update(fileBuffer).digest("hex") !== expectedChecksum) throw new Error("Checksum verification failed - file may be corrupted");
	}
	async extractZip(zipPath, destination) {
		new AdmZip(zipPath).extractAllTo(destination, true);
	}
	async validatePlugin(pluginPath, manifest) {
		const mainPath = path$1.join(pluginPath, manifest.main);
		if (!await this.fileExists(mainPath)) throw new Error(`Plugin main file not found: ${manifest.main}`);
		const manifestPath = path$1.join(pluginPath, "manifest.json");
		if (!await this.fileExists(manifestPath)) throw new Error("Plugin manifest.json not found");
	}
	async fileExists(filePath) {
		try {
			await fs$1.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
	getInstalledPlugins() {
		const installed = this.store.get("installed");
		return Object.values(installed);
	}
	isInstalled(pluginId) {
		return pluginId in this.store.get("installed");
	}
	getPlugin(pluginId) {
		return this.loadedPlugins.get(pluginId);
	}
	getBinaryPath(binaryName) {
		return path$1.join(this.binariesDir, binaryName);
	}
	async togglePlugin(pluginId, active) {
		const installed = this.store.get("installed");
		const plugin = installed[pluginId];
		if (!plugin) throw new Error(`Plugin not installed: ${pluginId}`);
		if (active && !plugin.active) await this.loadPlugin(pluginId);
		else if (!active && plugin.active) this.unloadPlugin(pluginId);
		plugin.active = active;
		this.store.set("installed", installed);
	}
};
const pluginManager = new PluginManager();
var __filename = fileURLToPath(import.meta.url);
var __dirname$1 = path.dirname(__filename);
function setupScreenshotHandlers(win$1) {
	ipcMain.handle("screenshot:get-sources", async () => {
		try {
			return (await desktopCapturer.getSources({
				types: ["window", "screen"],
				thumbnailSize: {
					width: 300,
					height: 200
				}
			})).map((source) => ({
				id: source.id,
				name: source.name,
				thumbnail: source.thumbnail.toDataURL(),
				type: source.id.startsWith("screen") ? "screen" : "window"
			}));
		} catch (error) {
			console.error("Failed to get sources:", error);
			return [];
		}
	});
	ipcMain.handle("screenshot:capture-screen", async () => {
		try {
			const display = screen.getPrimaryDisplay();
			const scaleFactor = display.scaleFactor || 1;
			const size = {
				width: Math.ceil(display.size.width * scaleFactor),
				height: Math.ceil(display.size.height * scaleFactor)
			};
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: size
			});
			if (sources.length === 0) throw new Error("No screens available");
			const image = sources[0].thumbnail;
			return {
				dataUrl: image.toDataURL(),
				width: image.getSize().width,
				height: image.getSize().height
			};
		} catch (error) {
			console.error("Failed to capture screen:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-window", async (_event, sourceId) => {
		try {
			const source = (await desktopCapturer.getSources({
				types: ["window"],
				thumbnailSize: {
					width: 1920,
					height: 1080
				}
			})).find((s) => s.id === sourceId);
			if (!source) throw new Error("Window not found");
			const image = source.thumbnail;
			return {
				dataUrl: image.toDataURL(),
				width: image.getSize().width,
				height: image.getSize().height
			};
		} catch (error) {
			console.error("Failed to capture window:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-area", async () => {
		try {
			console.log("Capturing screen for area selection...");
			const display = screen.getPrimaryDisplay();
			const scaleFactor = display.scaleFactor || 1;
			const size = {
				width: Math.ceil(display.size.width * scaleFactor),
				height: Math.ceil(display.size.height * scaleFactor)
			};
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: size
			});
			console.log(`Found ${sources.length} sources.`);
			if (sources.length === 0) {
				console.error("No screens available for capture.");
				throw new Error("No screens available");
			}
			const fullScreenImage = sources[0].thumbnail;
			console.log(`Captured thumbnail size: ${fullScreenImage.getSize().width}x${fullScreenImage.getSize().height}`);
			console.log(`Display size: ${display.size.width}x${display.size.height} (Scale: ${display.scaleFactor})`);
			return new Promise((resolve, reject) => {
				let selectionWindow = null;
				const cleanup = () => {
					if (selectionWindow && !selectionWindow.isDestroyed()) selectionWindow.close();
					ipcMain.removeHandler("screenshot:area-selected");
					ipcMain.removeHandler("screenshot:area-cancelled");
				};
				ipcMain.handle("screenshot:area-selected", async (_event, bounds) => {
					cleanup();
					const scaleFactor$1 = display.scaleFactor;
					const croppedImage = fullScreenImage.crop({
						x: Math.round(bounds.x * scaleFactor$1),
						y: Math.round(bounds.y * scaleFactor$1),
						width: Math.round(bounds.width * scaleFactor$1),
						height: Math.round(bounds.height * scaleFactor$1)
					});
					resolve({
						dataUrl: croppedImage.toDataURL(),
						width: croppedImage.getSize().width,
						height: croppedImage.getSize().height
					});
				});
				ipcMain.handle("screenshot:area-cancelled", () => {
					cleanup();
					reject(/* @__PURE__ */ new Error("Area selection cancelled"));
				});
				const { width, height, x, y } = display.bounds;
				selectionWindow = new BrowserWindow({
					x,
					y,
					width,
					height,
					frame: false,
					transparent: true,
					hasShadow: false,
					backgroundColor: "#00000000",
					alwaysOnTop: true,
					skipTaskbar: true,
					resizable: false,
					enableLargerThanScreen: true,
					movable: false,
					acceptFirstMouse: true,
					webPreferences: {
						nodeIntegration: false,
						contextIsolation: true,
						preload: path.join(__dirname$1, "preload.mjs")
					}
				});
				selectionWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
				selectionWindow.show();
				selectionWindow.focus();
				selectionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                width: 100vw;
                                height: 100vh;
                                cursor: crosshair;
                                background: transparent;
                                overflow: hidden;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                user-select: none;
                            }
                            #selection {
                                position: absolute;
                                border: 2px solid #3b82f6;
                                background: rgba(59, 130, 246, 0.05);
                                display: none;
                                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
                                z-index: 100;
                                pointer-events: none;
                            }
                            #toolbar {
                                position: absolute;
                                display: none;
                                background: #1a1b1e;
                                padding: 6px;
                                border-radius: 10px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
                                z-index: 2000;
                                display: flex;
                                gap: 8px;
                                align-items: center;
                                pointer-events: auto;
                                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                            }
                            @keyframes popIn {
                                from { opacity: 0; transform: scale(0.95) translateY(5px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                            .btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 0 16px;
                                height: 36px;
                                border-radius: 8px;
                                border: none;
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.15s ease;
                                color: white;
                            }
                            .btn-cancel {
                                background: rgba(255,255,255,0.08);
                                color: #e5e5e5;
                            }
                            .btn-cancel:hover { background: rgba(255,255,255,0.12); color: white; }
                            .btn-capture {
                                background: #3b82f6;
                                color: white;
                                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                            }
                            .btn-capture:hover { background: #2563eb; transform: translateY(-1px); }
                            .btn-capture:active { transform: translateY(0); }
                            #dimensions {
                                position: absolute;
                                top: -34px;
                                left: 0;
                                background: #3b82f6;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                opacity: 0;
                                transition: opacity 0.2s;
                            }
                            #instructions {
                                position: absolute;
                                top: 40px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: rgba(0, 0, 0, 0.7);
                                backdrop-filter: blur(10px);
                                color: white;
                                padding: 8px 16px;
                                border-radius: 20px;
                                font-size: 13px;
                                font-weight: 500;
                                pointer-events: none;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                border: 1px solid rgba(255,255,255,0.1);
                                opacity: 0.8;
                            }
                            .hidden { display: none !important; }
                        </style>
                    </head>
                    <body>
                        <div id="instructions">Click and drag to capture</div>
                        <div id="selection">
                            <div id="dimensions">0 x 0</div>
                        </div>
                        <div id="toolbar" class="hidden">
                            <button class="btn btn-cancel" id="btn-cancel">Cancel</button>
                            <button class="btn btn-capture" id="btn-capture">Capture</button>
                        </div>
                        <script>
                            const selection = document.getElementById('selection');
                            const toolbar = document.getElementById('toolbar');
                            const dimensions = document.getElementById('dimensions');
                            const btnCancel = document.getElementById('btn-cancel');
                            const btnCapture = document.getElementById('btn-capture');
                            
                            let startX, startY, isDrawing = false;
                            let currentBounds = { x: 0, y: 0, width: 0, height: 0 };
                            
                            document.addEventListener('contextmenu', e => e.preventDefault());

                            function capture() {
                                if (!window.electronAPI) {
                                    alert('Error: Electron API not available. Preload script missed?');
                                    return;
                                }
                                if (currentBounds.width > 0 && currentBounds.height > 0) {
                                    window.electronAPI.sendSelection(currentBounds);
                                }
                            }
                            
                            function cancel() {
                                if (window.electronAPI) {
                                    window.electronAPI.cancelSelection();
                                } else {
                                    // If API is missing, we can't notify main process, but we can try to close window via window.close() if not sandboxed?
                                    // But contextIsolation is on.
                                    alert('Error: Electron API not available. Cannot cancel properly.');
                                }
                            }

                            btnCapture.onclick = capture;
                            btnCancel.onclick = cancel;

                            document.addEventListener('mousedown', (e) => {
                                if (e.target.closest('#toolbar')) return;
                                if (e.button !== 0) {
                                    if (e.button === 2) cancel();
                                    return;
                                }
                                isDrawing = true;
                                startX = e.clientX;
                                startY = e.clientY;
                                toolbar.classList.add('hidden');
                                dimensions.style.opacity = '1';
                                selection.style.left = startX + 'px';
                                selection.style.top = startY + 'px';
                                selection.style.width = '0px';
                                selection.style.height = '0px';
                                selection.style.display = 'block';
                            });

                            document.addEventListener('mousemove', (e) => {
                                if (!isDrawing) return;
                                const currentX = e.clientX;
                                const currentY = e.clientY;
                                const width = Math.abs(currentX - startX);
                                const height = Math.abs(currentY - startY);
                                const left = Math.min(startX, currentX);
                                const top = Math.min(startY, currentY);
                                selection.style.left = left + 'px';
                                selection.style.top = top + 'px';
                                selection.style.width = width + 'px';
                                selection.style.height = height + 'px';
                                dimensions.textContent = Math.round(width) + ' x ' + Math.round(height);
                                currentBounds = { x: left, y: top, width, height };
                            });

                            document.addEventListener('mouseup', (e) => {
                                if (!isDrawing) return;
                                isDrawing = false;
                                if (currentBounds.width > 10 && currentBounds.height > 10) {
                                    toolbar.classList.remove('hidden');
                                    const toolbarHeight = 60;
                                    let top = currentBounds.y + currentBounds.height + 10;
                                    if (top + toolbarHeight > window.innerHeight) top = currentBounds.y - toolbarHeight - 10;
                                    let left = currentBounds.x + (currentBounds.width / 2) - 100;
                                    left = Math.max(10, Math.min(window.innerWidth - 210, left));
                                    toolbar.style.top = top + 'px';
                                    toolbar.style.left = left + 'px';
                                } else {
                                    selection.style.display = 'none';
                                    toolbar.classList.add('hidden');
                                }
                            });

                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Escape') cancel();
                                if (e.key === 'Enter' && !toolbar.classList.contains('hidden')) capture();
                            });
                        <\/script>
                    </body>
                    </html>
                `)}`);
				setTimeout(() => {
					if (selectionWindow && !selectionWindow.isDestroyed()) {
						cleanup();
						reject(/* @__PURE__ */ new Error("Area selection timeout"));
					}
				}, 12e4);
			});
		} catch (error) {
			console.error("Failed to capture area:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:capture-url", async (_event, url) => {
		try {
			console.log("Capturing URL:", url);
			const win$2 = new BrowserWindow({
				width: 1200,
				height: 800,
				show: false,
				webPreferences: {
					offscreen: false,
					contextIsolation: true
				}
			});
			await win$2.loadURL(url);
			try {
				const dbg = win$2.webContents.debugger;
				dbg.attach("1.3");
				const layout = await dbg.sendCommand("Page.getLayoutMetrics");
				const contentSize = layout.contentSize || layout.cssContentSize || {
					width: 1200,
					height: 800
				};
				const width = Math.ceil(contentSize.width);
				const height = Math.ceil(contentSize.height);
				console.log(`Page dimensions: ${width}x${height}`);
				await dbg.sendCommand("Emulation.setDeviceMetricsOverride", {
					width,
					height,
					deviceScaleFactor: 1,
					mobile: false
				});
				const result = await dbg.sendCommand("Page.captureScreenshot", {
					format: "png",
					captureBeyondViewport: true
				});
				dbg.detach();
				win$2.close();
				return {
					dataUrl: "data:image/png;base64," + result.data,
					width,
					height
				};
			} catch (cdpError) {
				console.error("CDP Error:", cdpError);
				const img = await win$2.webContents.capturePage();
				win$2.close();
				return {
					dataUrl: img.toDataURL(),
					width: img.getSize().width,
					height: img.getSize().height
				};
			}
		} catch (error) {
			console.error("Failed to capture URL:", error);
			throw error;
		}
	});
	ipcMain.handle("screenshot:save-file", async (_event, dataUrl, options) => {
		try {
			const { filename, format = "png" } = options;
			const result = await dialog.showSaveDialog(win$1, {
				defaultPath: filename || `screenshot-${Date.now()}.${format}`,
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
			if (result.canceled || !result.filePath) return {
				success: false,
				canceled: true
			};
			const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
			const buffer = Buffer.from(base64Data, "base64");
			await fs.writeFile(result.filePath, buffer);
			return {
				success: true,
				filePath: result.filePath
			};
		} catch (error) {
			console.error("Failed to save screenshot:", error);
			return {
				success: false,
				error: error.message
			};
		}
	});
}
var execAsync = promisify(exec);
var store = new Store();
var __dirname = dirname(fileURLToPath(import.meta.url));
process.env.DIST = join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
protocol.registerSchemesAsPrivileged([{
	scheme: "local-media",
	privileges: {
		bypassCSP: true,
		stream: true,
		secure: true,
		supportFetchAPI: true
	}
}]);
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
	tray.setToolTip("DevTools");
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
function updateTrayMenu() {
	if (!tray) return;
	const template = [
		{
			label: win?.isVisible() ? "▼ Hide Window" : "▲ Show Window",
			click: () => {
				if (win) {
					if (win.isVisible()) win.hide();
					else win.show();
					updateTrayMenu();
				}
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
		},
		{ type: "separator" },
		{
			label: "⚙️ Settings",
			click: () => {
				win?.show();
				win?.webContents.send("navigate-to", "settings");
			}
		},
		{ type: "separator" },
		{
			label: "✕ Quit DevTools",
			accelerator: "CmdOrCtrl+Q",
			click: () => {
				app.isQuitting = true;
				app.quit();
			}
		}
	];
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
		minWidth: 800,
		minHeight: 600,
		resizable: true,
		show: !startMinimized,
		frame: false,
		transparent: process.platform === "darwin",
		backgroundColor: "#050505",
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
	ipcMain.handle("get-home-dir", () => {
		return os.homedir();
	});
	ipcMain.handle("select-folder", async () => {
		const result = await dialog.showOpenDialog(win, {
			properties: ["openDirectory"],
			title: "Select Folder to Scan"
		});
		if (result.canceled || result.filePaths.length === 0) return {
			canceled: true,
			path: null
		};
		return {
			canceled: false,
			path: result.filePaths[0]
		};
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
	setupScreenshotHandlers(win);
	ipcMain.on("window-set-opacity", (_event, opacity) => {
		if (win) win.setOpacity(Math.max(.5, Math.min(1, opacity)));
	});
	ipcMain.on("window-set-always-on-top", (_event, alwaysOnTop) => {
		if (win) win.setAlwaysOnTop(alwaysOnTop);
	});
	ipcMain.handle("permissions:check-all", async () => {
		const platform = process.platform;
		const results = {};
		if (platform === "darwin") {
			results.accessibility = await checkAccessibilityPermission();
			results.fullDiskAccess = await checkFullDiskAccessPermission();
			results.screenRecording = await checkScreenRecordingPermission();
		} else if (platform === "win32") {
			results.fileAccess = await checkFileAccessPermission();
			results.registryAccess = await checkRegistryAccessPermission();
		}
		results.clipboard = await checkClipboardPermission();
		results.launchAtLogin = await checkLaunchAtLoginPermission();
		return results;
	});
	ipcMain.handle("permissions:check-accessibility", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkAccessibilityPermission();
	});
	ipcMain.handle("permissions:check-full-disk-access", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkFullDiskAccessPermission();
	});
	ipcMain.handle("permissions:check-screen-recording", async () => {
		if (process.platform !== "darwin") return {
			status: "not-applicable",
			message: "Only available on macOS"
		};
		return await checkScreenRecordingPermission();
	});
	ipcMain.handle("permissions:test-clipboard", async () => {
		return await testClipboardPermission();
	});
	ipcMain.handle("permissions:test-file-access", async () => {
		return await testFileAccessPermission();
	});
	ipcMain.handle("permissions:open-system-preferences", async (_event, permissionType) => {
		return await openSystemPreferences(permissionType);
	});
	async function checkAccessibilityPermission() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				const testShortcut = "CommandOrControl+Shift+TestPermission";
				if (globalShortcut.register(testShortcut, () => {})) {
					globalShortcut.unregister(testShortcut);
					return { status: "granted" };
				}
			} catch (e) {}
			if (globalShortcut.isRegistered("CommandOrControl+Shift+D")) return { status: "granted" };
			return {
				status: "not-determined",
				message: "Unable to determine status. Try testing."
			};
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function checkFullDiskAccessPermission() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			for (const testPath of [
				"/Library/Application Support",
				"/System/Library",
				"/private/var/db"
			]) try {
				await fs.access(testPath);
				return { status: "granted" };
			} catch (e) {}
			const homeDir = os.homedir();
			try {
				await fs.readdir(homeDir);
				return {
					status: "granted",
					message: "Basic file access available"
				};
			} catch (e) {
				return {
					status: "denied",
					message: "Cannot access protected directories"
				};
			}
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function checkScreenRecordingPermission() {
		if (process.platform !== "darwin") return { status: "not-applicable" };
		try {
			try {
				const sources = await desktopCapturer.getSources({ types: ["screen"] });
				if (sources && sources.length > 0) return { status: "granted" };
			} catch (e) {}
			return {
				status: "not-determined",
				message: "Unable to determine. Try testing screenshot feature."
			};
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function checkClipboardPermission() {
		try {
			const originalText = clipboard.readText();
			clipboard.writeText("__PERMISSION_TEST__");
			const written = clipboard.readText();
			clipboard.writeText(originalText);
			if (written === "__PERMISSION_TEST__") return { status: "granted" };
			return {
				status: "denied",
				message: "Clipboard access failed"
			};
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function checkLaunchAtLoginPermission() {
		try {
			const loginItemSettings = app.getLoginItemSettings();
			return {
				status: loginItemSettings.openAtLogin ? "granted" : "not-determined",
				message: loginItemSettings.openAtLogin ? "Launch at login is enabled" : "Launch at login is not enabled"
			};
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function checkFileAccessPermission() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			const testPath = join(os.tmpdir(), `permission-test-${Date.now()}.txt`);
			const testContent = "permission test";
			await fs.writeFile(testPath, testContent);
			const readContent = await fs.readFile(testPath, "utf-8");
			await fs.unlink(testPath);
			if (readContent === testContent) return { status: "granted" };
			return {
				status: "denied",
				message: "File access test failed"
			};
		} catch (error) {
			return {
				status: "denied",
				message: error.message
			};
		}
	}
	async function checkRegistryAccessPermission() {
		if (process.platform !== "win32") return { status: "not-applicable" };
		try {
			const { stdout } = await execAsync("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\" /v ProgramFilesDir 2>&1");
			if (stdout && !stdout.includes("ERROR")) return { status: "granted" };
			return {
				status: "denied",
				message: "Registry access test failed"
			};
		} catch (error) {
			return {
				status: "denied",
				message: error.message
			};
		}
	}
	async function testClipboardPermission() {
		try {
			const originalText = clipboard.readText();
			const testText = `Permission test ${Date.now()}`;
			clipboard.writeText(testText);
			const readText = clipboard.readText();
			clipboard.writeText(originalText);
			if (readText === testText) return {
				status: "granted",
				message: "Clipboard read/write test passed"
			};
			return {
				status: "denied",
				message: "Clipboard test failed"
			};
		} catch (error) {
			return {
				status: "error",
				message: error.message
			};
		}
	}
	async function testFileAccessPermission() {
		try {
			const testPath = join(os.tmpdir(), `permission-test-${Date.now()}.txt`);
			const testContent = `Test ${Date.now()}`;
			await fs.writeFile(testPath, testContent);
			const readContent = await fs.readFile(testPath, "utf-8");
			await fs.unlink(testPath);
			if (readContent === testContent) return {
				status: "granted",
				message: "File access test passed"
			};
			return {
				status: "denied",
				message: "File access test failed"
			};
		} catch (error) {
			return {
				status: "denied",
				message: error.message
			};
		}
	}
	async function openSystemPreferences(permissionType) {
		const platform = process.platform;
		try {
			if (platform === "darwin") {
				let command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy\"";
				if (permissionType === "accessibility") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility\"";
				else if (permissionType === "full-disk-access") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles\"";
				else if (permissionType === "screen-recording") command = "open \"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture\"";
				await execAsync(command);
				return {
					success: true,
					message: "Opened System Preferences"
				};
			} else if (platform === "win32") {
				await execAsync("start ms-settings:privacy");
				return {
					success: true,
					message: "Opened Windows Settings"
				};
			}
			return {
				success: false,
				message: "Unsupported platform"
			};
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	}
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
	ipcMain.on("health-update-tray", (_event, data) => {
		healthMenuData = data;
		updateTrayMenu();
	});
	ipcMain.handle("health-start-monitoring", async () => {
		if (healthMonitoringInterval) clearInterval(healthMonitoringInterval);
		const updateHealth = async () => {
			try {
				const mem = await si.mem();
				const load = await si.currentLoad();
				const disk = await si.fsSize();
				const battery = await si.battery().catch(() => null);
				const alerts = [];
				const rootDisk = disk.find((d) => d.mount === "/" || d.mount === "C:") || disk[0];
				if (rootDisk) {
					const freePercent = rootDisk.available / rootDisk.size * 100;
					if (freePercent < 10) alerts.push({
						type: "low_space",
						severity: "critical",
						message: `Low disk space: ${formatBytes(rootDisk.available)} free`
					});
					else if (freePercent < 20) alerts.push({
						type: "low_space",
						severity: "warning",
						message: `Disk space getting low: ${formatBytes(rootDisk.available)} free`
					});
				}
				if (load.currentLoad > 90) alerts.push({
					type: "high_cpu",
					severity: "warning",
					message: `High CPU usage: ${load.currentLoad.toFixed(1)}%`
				});
				const memPercent = mem.used / mem.total * 100;
				if (memPercent > 90) alerts.push({
					type: "memory_pressure",
					severity: "warning",
					message: `High memory usage: ${memPercent.toFixed(1)}%`
				});
				healthMenuData = {
					cpu: load.currentLoad,
					ram: {
						used: mem.used,
						total: mem.total,
						percentage: memPercent
					},
					disk: rootDisk ? {
						free: rootDisk.available,
						total: rootDisk.size,
						percentage: (rootDisk.size - rootDisk.available) / rootDisk.size * 100
					} : null,
					battery: battery ? {
						level: battery.percent,
						charging: battery.isCharging || false
					} : null,
					alerts
				};
				updateTrayMenu();
				const criticalAlerts = alerts.filter((a) => a.severity === "critical");
				if (criticalAlerts.length > 0 && win) criticalAlerts.forEach((alert) => {
					new Notification({
						title: "⚠️ System Alert",
						body: alert.message,
						silent: false
					}).show();
				});
			} catch (e) {
				console.error("Health monitoring error:", e);
			}
		};
		updateHealth();
		healthMonitoringInterval = setInterval(updateHealth, 5e3);
		return { success: true };
	});
	ipcMain.handle("health-stop-monitoring", () => {
		if (healthMonitoringInterval) {
			clearInterval(healthMonitoringInterval);
			healthMonitoringInterval = null;
		}
		healthMenuData = null;
		updateTrayMenu();
		return { success: true };
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
	ipcMain.on("window-open-devtools", () => {
		win?.webContents.openDevTools();
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
	try {
		const pendingCount = universalDownloader.prepareForShutdown();
		console.log(`💾 Saved ${pendingCount} pending downloads before quit`);
	} catch (error) {
		console.error("Failed to save download state:", error);
	}
	if (win) win.webContents.send("check-clear-clipboard-on-quit");
});
app.whenReady().then(() => {
	setTimeout(() => {
		if (win) win.webContents.executeJavaScript(`
        (async () => {
          if (window.cleanerAPI?.startHealthMonitoring) {
            await window.cleanerAPI.startHealthMonitoring();
          }
        })()
      `).catch(() => {});
	}, 2e3);
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
	pluginManager.initialize().catch(console.error);
	ipcMain.handle("plugins:get-available", () => {
		return pluginManager.getAvailablePlugins();
	});
	ipcMain.handle("plugins:get-installed", () => {
		return pluginManager.getInstalledPlugins();
	});
	ipcMain.handle("plugins:install", async (event, pluginId) => {
		await pluginManager.installPlugin(pluginId, (progress) => {
			event.sender.send("plugins:progress", progress);
		});
	});
	ipcMain.handle("plugins:uninstall", async (_event, pluginId) => {
		await pluginManager.uninstallPlugin(pluginId);
	});
	ipcMain.handle("plugins:toggle", async (_event, pluginId, active) => {
		await pluginManager.togglePlugin(pluginId, active);
	});
	ipcMain.handle("plugins:update-registry", async () => {
		await pluginManager.updateRegistry(true);
	});
	protocol.handle("local-media", async (request) => {
		try {
			console.log("[LocalMedia] Request:", request.url);
			const url = new URL(request.url);
			let decodedPath = decodeURIComponent(url.pathname);
			console.log("[LocalMedia] Initial Path:", decodedPath);
			if (process.platform === "win32") {
				if (/^\/[a-zA-Z]:/.test(decodedPath)) decodedPath = decodedPath.slice(1);
				else if (/^[a-zA-Z]\//.test(decodedPath)) decodedPath = decodedPath.charAt(0) + ":" + decodedPath.slice(1);
			} else decodedPath = decodedPath.replace(/^\/+/, "/");
			console.log("[LocalMedia] Final Path:", decodedPath);
			const fileSize = (await fs.stat(decodedPath)).size;
			const ext = path.extname(decodedPath).toLowerCase();
			let mimeType = "application/octet-stream";
			if (ext === ".mp4") mimeType = "video/mp4";
			else if (ext === ".webm") mimeType = "video/webm";
			else if (ext === ".mov") mimeType = "video/quicktime";
			else if (ext === ".avi") mimeType = "video/x-msvideo";
			else if (ext === ".mkv") mimeType = "video/x-matroska";
			else if (ext === ".mp3") mimeType = "audio/mpeg";
			else if (ext === ".wav") mimeType = "audio/wav";
			const range = request.headers.get("Range");
			if (range) {
				const parts = range.replace(/bytes=/, "").split("-");
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
				const chunksize = end - start + 1;
				console.log(`[LocalMedia] Streaming Range: ${start}-${end}/${fileSize}`);
				const nodeStream = createReadStream(decodedPath, {
					start,
					end
				});
				const webStream = Readable.toWeb(nodeStream);
				return new Response(webStream, {
					status: 206,
					headers: {
						"Content-Range": `bytes ${start}-${end}/${fileSize}`,
						"Accept-Ranges": "bytes",
						"Content-Length": chunksize.toString(),
						"Content-Type": mimeType
					}
				});
			} else {
				console.log(`[LocalMedia] Streaming Full: ${fileSize}`);
				const nodeStream = createReadStream(decodedPath);
				const webStream = Readable.toWeb(nodeStream);
				return new Response(webStream, { headers: {
					"Content-Length": fileSize.toString(),
					"Content-Type": mimeType,
					"Accept-Ranges": "bytes"
				} });
			}
		} catch (e) {
			console.error("[LocalMedia] Error:", e);
			if (e.code === "ENOENT") return new Response("File not found", { status: 404 });
			return new Response("Error loading media: " + e.message, { status: 500 });
		}
	});
	if (process.platform === "win32") app.setAppUserModelId("com.devtools.app");
	createTray();
	createWindow();
});
