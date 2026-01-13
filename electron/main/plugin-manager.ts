import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';
import axios from 'axios';

const require = createRequire(import.meta.url);

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type PluginCategory = 'media' | 'document' | 'developer' | 'security' | 'network' | 'utility';

export interface PluginManifest {
  // Identity
  id: string;                           // e.g., "universal-downloader"
  name: string;                         // Display name
  version: string;                      // Semantic version
  description: string;
  author: string;
  license: string;
  homepage?: string;
  
  // Categorization
  category: PluginCategory;
  tags: string[];
  
  // Technical
  main: string;                         // Entry point: "index.js"
  icon?: string;                        // Icon path
  
  // Size & Dependencies
  size: number;                         // Bytes
  dependencies?: {
    binary?: BinaryDependency[];        // External binaries
    npm?: string[];                     // NPM packages (bundled)
    wasm?: string[];                    // WASM modules
  };
  
  // Permissions
  permissions: {
    filesystem?: boolean;               // File system access
    network?: boolean;                  // Network requests
    shell?: boolean;                    // Shell execution
    clipboard?: boolean;                // Clipboard access
  };
  
  // Compatibility
  minAppVersion: string;                // Min DevTools version
  maxAppVersion?: string;               // Max DevTools version
  platforms: ('win32' | 'darwin' | 'linux')[];
  
  // Distribution
  downloadUrl: string;                  // Plugin package URL
  checksum: string;                     // SHA-256 hash
  
  // Metadata
  verified: boolean;                    // Official plugin
  downloads?: number;                   // Download count
  rating?: number;                      // User rating (0-5)
  screenshots?: string[];               // Screenshot URLs
  changelog?: string;                   // Changelog URL or text
}

export interface BinaryDependency {
  name: string;                         // e.g., "ffmpeg"
  version: string;                      // e.g., "6.0"
  size: number;                         // Size in bytes
  platforms: {
    win32?: { url: string; checksum: string; };
    darwin?: { url: string; checksum: string; };
    linux?: { url: string; checksum: string; };
  };
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  installPath: string;
  installedAt: number;
  active: boolean;
}

export interface PluginRegistry {
  version: string;
  lastUpdated: number;
  plugins: PluginManifest[];
}

interface PluginStoreSchema {
  installed: Record<string, InstalledPlugin>;
  registry: PluginRegistry | null;
  lastRegistryUpdate: number;
}

// ============================================================
// PLUGIN MANAGER CLASS
// ============================================================

export class PluginManager {
  private store: Store<PluginStoreSchema>;
  private pluginsDir: string;
  private binariesDir: string;
  private registryUrl: string;
  private loadedPlugins: Map<string, any> = new Map();
  
  constructor() {
    const userDataPath = app.getPath('userData');
    
    this.pluginsDir = path.join(userDataPath, 'plugins');
    this.binariesDir = path.join(userDataPath, 'binaries');
    
    // Plugin registry URL (embedded in app, can be updated)
    // Plugin registry URL (embedded in app, can be updated)
    // For now, use a stable dummy URL or point to the actual repo if it exists. 
    // Since the repo might not be public/exist yet, we'll rely on the local fallback mostly for now.
    // Ideally this should point to: 'https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json'
    this.registryUrl = 'https://raw.githubusercontent.com/devtools-app/plugins/main/registry.json';
    
    this.store = new Store<PluginStoreSchema>({
      name: 'plugin-manager',
      defaults: {
        installed: {},
        registry: null,
        lastRegistryUpdate: 0,
      },
    });
    
    this.ensureDirectories();
  }
  
  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  private async ensureDirectories() {
    await fs.mkdir(this.pluginsDir, { recursive: true });
    await fs.mkdir(this.binariesDir, { recursive: true });
  }
  
  async initialize(): Promise<void> {
    console.log('[PluginManager] Initializing...');
    
    // Load plugin registry
    await this.updateRegistry();
    
    // Load installed plugins
    await this.loadInstalledPlugins();
    
    console.log('[PluginManager] Initialized with', this.loadedPlugins.size, 'active plugins');
  }
  
  // ============================================================
  // REGISTRY MANAGEMENT
  // ============================================================
  
  async updateRegistry(force: boolean = false): Promise<void> {
    const lastUpdate = this.store.get('lastRegistryUpdate');
    const ONE_HOUR = 60 * 60 * 1000;
    
    // Check if update needed
    if (!force && Date.now() - lastUpdate < ONE_HOUR) {
      console.log('[PluginManager] Registry is up to date');
      return;
    }
    
    try {
      console.log('[PluginManager] Fetching plugin registry...');
      const response = await axios.get<PluginRegistry>(this.registryUrl, {
        timeout: 10000,
      });
      
      this.store.set('registry', response.data);
      this.store.set('lastRegistryUpdate', Date.now());
      
      console.log('[PluginManager] Registry updated:', response.data.plugins.length, 'plugins available');
    } catch (error: any) {
      console.error('[PluginManager] Failed to update registry:', error.message);
      
      // Use cached registry if available
      // Use cached registry if available, OTHERWISE load embedded
      const cachedRegistry = this.store.get('registry');
      if (!cachedRegistry || force) {
        // Fallback to embedded registry
        await this.loadEmbeddedRegistry();
      } else {
         console.log('[PluginManager] Using cached registry');
      }
    }
  }
  
  private async loadEmbeddedRegistry(): Promise<void> {
    // Load embedded registry from app resources
    try {
      let registryPath = '';
      if (app.isPackaged) {
          registryPath = path.join(process.resourcesPath, 'plugin-registry.json');
      } else {
          // In development, assume resources is at project root
          // app.getAppPath() usually returns the directory containing package.json in dev
          registryPath = path.join(app.getAppPath(), 'resources', 'plugin-registry.json');
      }
      
      console.log('[PluginManager] Loading registry from:', registryPath);
      const data = await fs.readFile(registryPath, 'utf-8');
      const registry: PluginRegistry = JSON.parse(data);
      
      this.store.set('registry', registry);
      console.log('[PluginManager] Loaded embedded registry');
    } catch (error) {
      console.error('[PluginManager] Failed to load embedded registry:', error);
    }
  }
  
  getRegistry(): PluginRegistry | null {
    return this.store.get('registry');
  }
  
  getAvailablePlugins(): PluginManifest[] {
    const registry = this.store.get('registry');
    return registry?.plugins || [];
  }
  
  // ============================================================
  // INSTALLATION
  // ============================================================
  
  async installPlugin(
    pluginId: string,
    onProgress?: (progress: { stage: string; percent: number; message: string }) => void
  ): Promise<void> {
    console.log('[PluginManager] Installing plugin:', pluginId);
    
    // Get plugin manifest from registry
    const manifest = this.getPluginManifest(pluginId);
    if (!manifest) {
      throw new Error(`Plugin not found in registry: ${pluginId}`);
    }
    
    // Check if already installed
    const installed = this.store.get('installed');
    if (installed[pluginId]) {
      throw new Error(`Plugin already installed: ${pluginId}`);
    }
    
    // Check compatibility
    this.checkCompatibility(manifest);
    
    try {
      // Stage 1: Download plugin package
      onProgress?.({ stage: 'download', percent: 0, message: 'Downloading plugin...' });
      const pluginZipPath = await this.downloadFile(
        manifest.downloadUrl,
        path.join(app.getPath('temp'), `${pluginId}.zip`),
        (percent) => onProgress?.({ stage: 'download', percent, message: `Downloading... ${percent}%` })
      );
      
      // Stage 2: Verify checksum
      onProgress?.({ stage: 'verify', percent: 50, message: 'Verifying integrity...' });
      await this.verifyChecksum(pluginZipPath, manifest.checksum);
      
      // Stage 3: Extract plugin
      onProgress?.({ stage: 'extract', percent: 60, message: 'Extracting files...' });
      const pluginPath = path.join(this.pluginsDir, pluginId);
      await this.extractZip(pluginZipPath, pluginPath);
      
      // Stage 4: Install dependencies
      if (manifest.dependencies?.binary && manifest.dependencies.binary.length > 0) {
        onProgress?.({ stage: 'dependencies', percent: 70, message: 'Installing dependencies...' });
        await this.installBinaryDependencies(manifest.dependencies.binary, onProgress);
      }
      
      // Stage 5: Validate plugin structure
      onProgress?.({ stage: 'validate', percent: 90, message: 'Validating plugin...' });
      await this.validatePlugin(pluginPath, manifest);
      
      // Stage 6: Register plugin
      onProgress?.({ stage: 'register', percent: 95, message: 'Registering plugin...' });
      const installedPlugin: InstalledPlugin = {
        manifest,
        installPath: pluginPath,
        installedAt: Date.now(),
        active: true,
      };
      
      const updatedInstalled = { ...this.store.get('installed'), [pluginId]: installedPlugin };
      this.store.set('installed', updatedInstalled);
      
      // Stage 7: Load plugin
      onProgress?.({ stage: 'complete', percent: 100, message: 'Plugin installed successfully!' });
      await this.loadPlugin(pluginId);
      
      // Cleanup
      await fs.unlink(pluginZipPath).catch(() => {});
      
      console.log('[PluginManager] Plugin installed successfully:', pluginId);
    } catch (error: any) {
      console.error('[PluginManager] Installation failed:', error);
      
      // Cleanup on failure
      const pluginPath = path.join(this.pluginsDir, pluginId);
      await fs.rm(pluginPath, { recursive: true, force: true }).catch(() => {});
      
      throw new Error(`Installation failed: ${error.message}`);
    }
  }
  
  // ============================================================
  // UNINSTALLATION
  // ============================================================
  
  async uninstallPlugin(pluginId: string): Promise<void> {
    console.log('[PluginManager] Uninstalling plugin:', pluginId);
    
    const installed = this.store.get('installed');
    const plugin = installed[pluginId];
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }
    
    try {
      // Unload plugin
      this.unloadPlugin(pluginId);
      
      // Remove plugin files
      await fs.rm(plugin.installPath, { recursive: true, force: true });
      
      // Cleanup dependencies (if not used by other plugins)
      if (plugin.manifest.dependencies?.binary) {
        await this.cleanupDependencies(plugin.manifest.dependencies.binary);
      }
      
      // Remove from store
      const { [pluginId]: removed, ...remaining } = installed;
      this.store.set('installed', remaining);
      
      console.log('[PluginManager] Plugin uninstalled:', pluginId);
    } catch (error: any) {
      console.error('[PluginManager] Uninstallation failed:', error);
      throw new Error(`Uninstallation failed: ${error.message}`);
    }
  }
  
  // ============================================================
  // PLUGIN LOADING
  // ============================================================
  
  private async loadInstalledPlugins(): Promise<void> {
    const installed = this.store.get('installed');
    
    for (const [pluginId, plugin] of Object.entries(installed)) {
      if (plugin.active) {
        try {
          await this.loadPlugin(pluginId);
        } catch (error: any) {
          console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error.message);
        }
      }
    }
  }
  
  private async loadPlugin(pluginId: string): Promise<void> {
    const installed = this.store.get('installed');
    const plugin = installed[pluginId];
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }
    
    try {
      const mainPath = path.join(plugin.installPath, plugin.manifest.main);
      
      // Dynamic import (require for now, can be ES modules later)
      const pluginModule = require(mainPath);
      
      // Call plugin initialization if available
      if (pluginModule.activate) {
        await pluginModule.activate();
      }
      
      this.loadedPlugins.set(pluginId, pluginModule);
      console.log('[PluginManager] Plugin loaded:', pluginId);
    } catch (error: any) {
      console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  private unloadPlugin(pluginId: string): void {
    const pluginModule = this.loadedPlugins.get(pluginId);
    
    if (pluginModule?.deactivate) {
      try {
        pluginModule.deactivate();
      } catch (error: any) {
        console.error(`[PluginManager] Error during plugin deactivation:`, error);
      }
    }
    
    this.loadedPlugins.delete(pluginId);
    console.log('[PluginManager] Plugin unloaded:', pluginId);
  }
  
  // ============================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================
  
  private async installBinaryDependencies(
    dependencies: BinaryDependency[],
    onProgress?: (progress: { stage: string; percent: number; message: string }) => void
  ): Promise<void> {
    const platform = process.platform as 'win32' | 'darwin' | 'linux';
    
    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];
      const platformInfo = dep.platforms[platform];
      
      if (!platformInfo) {
        console.warn(`[PluginManager] Binary ${dep.name} not available for ${platform}`);
        continue;
      }
      
      const binaryPath = path.join(this.binariesDir, dep.name);
      
      // Check if already installed
      if (await this.fileExists(binaryPath)) {
        console.log(`[PluginManager] Binary ${dep.name} already exists`);
        continue;
      }
      
      const basePercent = 70 + (i / dependencies.length) * 20;
      onProgress?.({ 
        stage: 'dependencies', 
        percent: basePercent, 
        message: `Installing ${dep.name}...` 
      });
      
      // Download binary
      const tempPath = path.join(app.getPath('temp'), `${dep.name}.zip`);
      await this.downloadFile(platformInfo.url, tempPath);
      
      // Verify checksum
      await this.verifyChecksum(tempPath, platformInfo.checksum);
      
      // Extract
      await this.extractZip(tempPath, this.binariesDir);
      
      // Make executable (Unix systems)
      if (platform !== 'win32') {
        await fs.chmod(binaryPath, 0o755);
      }
      
      // Cleanup
      await fs.unlink(tempPath).catch(() => {});
      
      console.log(`[PluginManager] Binary installed: ${dep.name}`);
    }
  }
  
  private async cleanupDependencies(dependencies: BinaryDependency[]): Promise<void> {
    // Check if any other installed plugin uses these dependencies
    const installed = this.store.get('installed');
    
    for (const dep of dependencies) {
      let inUse = false;
      
      for (const plugin of Object.values(installed)) {
        if (plugin.manifest.dependencies?.binary?.some(d => d.name === dep.name)) {
          inUse = true;
          break;
        }
      }
      
      if (!inUse) {
        const binaryPath = path.join(this.binariesDir, dep.name);
        await fs.rm(binaryPath, { force: true, recursive: true }).catch(() => {});
        console.log(`[PluginManager] Removed unused binary: ${dep.name}`);
      }
    }
  }
  
  // ============================================================
  // UTILITY METHODS
  // ============================================================
  
  private getPluginManifest(pluginId: string): PluginManifest | null {
    const registry = this.store.get('registry');
    return registry?.plugins.find(p => p.id === pluginId) || null;
  }
  
  private checkCompatibility(manifest: PluginManifest): void {
    // Check platform
    if (!manifest.platforms.includes(process.platform as any)) {
      throw new Error(`Plugin not compatible with ${process.platform}`);
    }
    
    // Check app version (simplified - should use semver)
    const appVersion = app.getVersion();
    if (appVersion < manifest.minAppVersion) {
      throw new Error(`Plugin requires app version ${manifest.minAppVersion} or higher`);
    }
  }
  
  private async downloadFile(
    url: string, 
    destination: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 300000, // 5 minutes
    });
    
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    
    const writer = require('fs').createWriteStream(destination);
    
    response.data.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      const percent = Math.round((downloadedSize / totalSize) * 100);
      onProgress?.(percent);
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destination));
      writer.on('error', reject);
    });
  }
  
  private async verifyChecksum(filePath: string, expectedChecksum: string): Promise<void> {
    const fileBuffer = await fs.readFile(filePath);
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    
    if (hash !== expectedChecksum) {
      throw new Error('Checksum verification failed - file may be corrupted');
    }
  }
  
  private async extractZip(zipPath: string, destination: string): Promise<void> {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(destination, true);
  }
  
  private async validatePlugin(pluginPath: string, manifest: PluginManifest): Promise<void> {
    // Check main entry point exists
    const mainPath = path.join(pluginPath, manifest.main);
    const mainExists = await this.fileExists(mainPath);
    
    if (!mainExists) {
      throw new Error(`Plugin main file not found: ${manifest.main}`);
    }
    
    // Check manifest.json exists
    const manifestPath = path.join(pluginPath, 'manifest.json');
    const manifestExists = await this.fileExists(manifestPath);
    
    if (!manifestExists) {
      throw new Error('Plugin manifest.json not found');
    }
  }
  
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  // ============================================================
  // PUBLIC API
  // ============================================================
  
  getInstalledPlugins(): InstalledPlugin[] {
    const installed = this.store.get('installed');
    return Object.values(installed);
  }
  
  isInstalled(pluginId: string): boolean {
    const installed = this.store.get('installed');
    return pluginId in installed;
  }
  
  getPlugin(pluginId: string): any {
    return this.loadedPlugins.get(pluginId);
  }
  
  getBinaryPath(binaryName: string): string {
    return path.join(this.binariesDir, binaryName);
  }
  
  async togglePlugin(pluginId: string, active: boolean): Promise<void> {
    const installed = this.store.get('installed');
    const plugin = installed[pluginId];
    
    if (!plugin) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }
    
    if (active && !plugin.active) {
      await this.loadPlugin(pluginId);
    } else if (!active && plugin.active) {
      this.unloadPlugin(pluginId);
    }
    
    plugin.active = active;
    this.store.set('installed', installed);
  }
}

// Singleton instance
export const pluginManager = new PluginManager();
