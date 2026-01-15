# 🔌 DevTools Plugin System - Implementation Plan

**Architecture**: Embedded Marketplace (Option 1)  
**Goal**: Transform DevTools App into a lightweight core with extensible plugin ecosystem  
**Timeline**: 8 weeks  
**Status**: 🚧 Planning Phase

---

## 📊 Executive Summary

Transform the current monolithic DevTools app into a modular architecture:
- **Core App**: ~50MB with 15 essential tools (no heavy dependencies)
- **Plugin System**: Optional heavy tools installed on-demand
- **Marketplace**: Embedded UI for browsing and installing plugins
- **Distribution**: GitHub Releases + CDN for fast downloads

### Key Metrics

```yaml
Current State:
  Total Size: ~200MB (with all dependencies)
  Startup Time: ~3-5 seconds
  Tools Included: ~25 tools (all bundled)
  
Target State:
  Core App: ~50MB (15 essential tools)
  Average Plugin: 10-100MB
  Startup Time: ~1-2 seconds (core only)
  User Choice: Install only what they need
```

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    DevTools Core App                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Core UI    │  │   Plugin     │  │  Marketplace │ │
│  │   Framework  │  │   Manager    │  │      UI      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Core Tools (15 Built-in)                  │ │
│  │  Screenshot, Color Picker, QR Code, Base64, etc.  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Plugin API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Plugin Ecosystem                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Universal   │  │    Video     │  │     PDF      │ │
│  │  Downloader  │  │    Editor    │  │    Tools     │ │
│  │   (+60MB)    │  │  (+100MB)    │  │   (+10MB)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Audio     │  │    Image     │  │   Network    │ │
│  │    Tools     │  │    Tools     │  │    Tools     │ │
│  │   (+30MB)    │  │   (+25MB)    │  │    (+5MB)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Distribution
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Plugin Distribution Layer                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  GitHub Releases (Plugin Storage)                │  │
│  │  https://github.com/devtools/plugins/releases    │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  CDN / jsDelivr (Fast Delivery)                  │  │
│  │  https://cdn.jsdelivr.net/gh/devtools/plugins@   │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Plugin Registry (Metadata)                       │  │
│  │  registry.json embedded in app                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Core Infrastructure (Week 1-2)

### 1.1 Plugin Manager Foundation

**File**: `electron/main/plugin-manager.ts`

```typescript
import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';
import axios from 'axios';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type PluginCategory = 'media' | 'document' | 'developer' | 'security' | 'network' | 'utility';
export type PluginStatus = 'not-installed' | 'installing' | 'installed' | 'updating' | 'error';

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
    this.registryUrl = 'https://raw.githubusercontent.com/devtools-app/plugin-registry/main/registry.json';
    
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
      const cachedRegistry = this.store.get('registry');
      if (!cachedRegistry) {
        // Fallback to embedded registry
        await this.loadEmbeddedRegistry();
      }
    }
  }
  
  private async loadEmbeddedRegistry(): Promise<void> {
    // Load embedded registry from app resources
    try {
      const embeddedPath = path.join(__dirname, '../../resources/plugin-registry.json');
      const data = await fs.readFile(embeddedPath, 'utf-8');
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
```

---

### 1.2 Plugin Registry Schema

**File**: `resources/plugin-registry.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": 1737619200000,
  "plugins": [
    {
      "id": "universal-downloader",
      "name": "Universal Media Downloader",
      "version": "2.0.0",
      "description": "Download media from 1000+ platforms including YouTube, TikTok, Instagram, Twitter, and more",
      "author": "DevTools Team",
      "license": "MIT",
      "homepage": "https://github.com/devtools-app/universal-downloader",
      
      "category": "media",
      "tags": ["download", "youtube", "video", "audio", "media"],
      
      "main": "index.js",
      "icon": "assets/icon.png",
      
      "size": 65536000,
      "dependencies": {
        "binary": [
          {
            "name": "yt-dlp",
            "version": "2024.12.06",
            "size": 52428800,
            "platforms": {
              "win32": {
                "url": "https://github.com/yt-dlp/yt-dlp/releases/download/2024.12.06/yt-dlp.exe",
                "checksum": "abc123..."
              },
              "darwin": {
                "url": "https://github.com/yt-dlp/yt-dlp/releases/download/2024.12.06/yt-dlp_macos",
                "checksum": "def456..."
              },
              "linux": {
                "url": "https://github.com/yt-dlp/yt-dlp/releases/download/2024.12.06/yt-dlp_linux",
                "checksum": "ghi789..."
              }
            }
          }
        ]
      },
      
      "permissions": {
        "filesystem": true,
        "network": true,
        "shell": true,
        "clipboard": false
      },
      
      "minAppVersion": "1.0.0",
      "platforms": ["win32", "darwin", "linux"],
      
      "downloadUrl": "https://github.com/devtools-app/plugins/releases/download/universal-downloader-2.0.0/plugin.zip",
      "checksum": "sha256_hash_here",
      
      "verified": true,
      "downloads": 50000,
      "rating": 4.8,
      "screenshots": [
        "https://example.com/screenshot1.png",
        "https://example.com/screenshot2.png"
      ],
      "changelog": "https://github.com/devtools-app/universal-downloader/releases/tag/v2.0.0"
    },
    
    {
      "id": "video-editor",
      "name": "Video Editor Suite",
      "version": "1.5.0",
      "description": "Trim, merge, convert videos with GPU acceleration. Supports all major video formats.",
      "author": "DevTools Team",
      "license": "MIT",
      
      "category": "media",
      "tags": ["video", "editor", "convert", "trim", "merge"],
      
      "main": "index.js",
      "icon": "assets/icon.png",
      
      "size": 104857600,
      "dependencies": {
        "binary": [
          {
            "name": "ffmpeg",
            "version": "6.0",
            "size": 83886080,
            "platforms": {
              "win32": {
                "url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
                "checksum": "xyz123..."
              },
              "darwin": {
                "url": "https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip",
                "checksum": "uvw456..."
              },
              "linux": {
                "url": "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
                "checksum": "rst789..."
              }
            }
          }
        ]
      },
      
      "permissions": {
        "filesystem": true,
        "network": false,
        "shell": true,
        "clipboard": false
      },
      
      "minAppVersion": "1.0.0",
      "platforms": ["win32", "darwin", "linux"],
      
      "downloadUrl": "https://github.com/devtools-app/plugins/releases/download/video-editor-1.5.0/plugin.zip",
      "checksum": "sha256_hash_here",
      
      "verified": true,
      "downloads": 32000,
      "rating": 4.6,
      "screenshots": [],
      "changelog": ""
    },
    
    {
      "id": "pdf-tools",
      "name": "PDF Tools",
      "version": "1.2.0",
      "description": "Merge, split, compress, and convert PDF documents",
      "author": "DevTools Team",
      "license": "MIT",
      
      "category": "document",
      "tags": ["pdf", "merge", "split", "compress"],
      
      "main": "index.js",
      "icon": "assets/icon.png",
      
      "size": 10485760,
      "dependencies": {},
      
      "permissions": {
        "filesystem": true,
        "network": false,
        "shell": false,
        "clipboard": false
      },
      
      "minAppVersion": "1.0.0",
      "platforms": ["win32", "darwin", "linux"],
      
      "downloadUrl": "https://github.com/devtools-app/plugins/releases/download/pdf-tools-1.2.0/plugin.zip",
      "checksum": "sha256_hash_here",
      
      "verified": true,
      "downloads": 28000,
      "rating": 4.7,
      "screenshots": [],
      "changelog": ""
    }
  ]
}
```

---

### 1.3 IPC Handlers

**File**: `electron/main/main.ts` (Add these handlers)

```typescript
import { pluginManager } from './plugin-manager';

// Initialize plugin manager
app.whenReady().then(async () => {
  await pluginManager.initialize();
  createWindow();
});

// ============================================================
// PLUGIN IPC HANDLERS
// ============================================================

// Get available plugins from registry
ipcMain.handle('plugin:get-registry', async () => {
  return pluginManager.getRegistry();
});

// Get installed plugins
ipcMain.handle('plugin:get-installed', async () => {
  return pluginManager.getInstalledPlugins();
});

// Check if plugin is installed
ipcMain.handle('plugin:is-installed', async (_event, pluginId: string) => {
  return pluginManager.isInstalled(pluginId);
});

// Install plugin
ipcMain.handle('plugin:install', async (event, pluginId: string) => {
  await pluginManager.installPlugin(pluginId, (progress) => {
    // Send progress updates to renderer
    event.sender.send('plugin:install-progress', { pluginId, ...progress });
  });
});

// Uninstall plugin
ipcMain.handle('plugin:uninstall', async (_event, pluginId: string) => {
  await pluginManager.uninstallPlugin(pluginId);
});

// Toggle plugin active state
ipcMain.handle('plugin:toggle', async (_event, pluginId: string, active: boolean) => {
  await pluginManager.togglePlugin(pluginId, active);
});

// Update plugin registry
ipcMain.handle('plugin:update-registry', async () => {
  await pluginManager.updateRegistry(true);
});

// Get binary path (for plugins to access their dependencies)
ipcMain.handle('plugin:get-binary-path', async (_event, binaryName: string) => {
  return pluginManager.getBinaryPath(binaryName);
});
```

---

### 1.4 Preload Bridge

**File**: `electron/preload/preload.ts` (Add to window.API)

```typescript
// Plugin API
pluginAPI: {
  getRegistry: () => ipcRenderer.invoke('plugin:get-registry'),
  getInstalled: () => ipcRenderer.invoke('plugin:get-installed'),
  isInstalled: (pluginId: string) => ipcRenderer.invoke('plugin:is-installed', pluginId),
  install: (pluginId: string) => ipcRenderer.invoke('plugin:install', pluginId),
  uninstall: (pluginId: string) => ipcRenderer.invoke('plugin:uninstall', pluginId),
  toggle: (pluginId: string, active: boolean) => ipcRenderer.invoke('plugin:toggle', pluginId, active),
  updateRegistry: () => ipcRenderer.invoke('plugin:update-registry'),
  
  // Event listeners
  onInstallProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('plugin:install-progress', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('plugin:install-progress');
  },
},
```

---

### 1.5 TypeScript Definitions

**File**: `src/vite-env.d.ts` (Add interface)

```typescript
interface PluginAPI {
  getRegistry: () => Promise<PluginRegistry | null>;
  getInstalled: () => Promise<InstalledPlugin[]>;
  isInstalled: (pluginId: string) => Promise<boolean>;
  install: (pluginId: string) => Promise<void>;
  uninstall: (pluginId: string) => Promise<void>;
  toggle: (pluginId: string, active: boolean) => Promise<void>;
  updateRegistry: () => Promise<void>;
  onInstallProgress: (callback: (data: PluginInstallProgress) => void) => () => void;
}

interface Window {
  // ... existing APIs
  pluginAPI: PluginAPI;
}
```

**File**: `src/types/plugin.ts` (New file)

```typescript
export type PluginCategory = 'media' | 'document' | 'developer' | 'security' | 'network' | 'utility';
export type PluginStatus = 'not-installed' | 'installing' | 'installed' | 'updating' | 'error';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  category: PluginCategory;
  tags: string[];
  main: string;
  icon?: string;
  size: number;
  dependencies?: {
    binary?: BinaryDependency[];
    npm?: string[];
    wasm?: string[];
  };
  permissions: {
    filesystem?: boolean;
    network?: boolean;
    shell?: boolean;
    clipboard?: boolean;
  };
  minAppVersion: string;
  maxAppVersion?: string;
  platforms: ('win32' | 'darwin' | 'linux')[];
  downloadUrl: string;
  checksum: string;
  verified: boolean;
  downloads?: number;
  rating?: number;
  screenshots?: string[];
  changelog?: string;
}

export interface BinaryDependency {
  name: string;
  version: string;
  size: number;
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

export interface PluginInstallProgress {
  pluginId: string;
  stage: 'download' | 'verify' | 'extract' | 'dependencies' | 'validate' | 'register' | 'complete';
  percent: number;
  message: string;
}
```

---

## 📱 Phase 2: Marketplace UI (Week 3-4)

### 2.1 Plugin Marketplace Component

**File**: `src/tools/plugins/PluginMarketplace.tsx`

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, CheckCircle, Star, Package } from 'lucide-react';
import { PluginManifest, InstalledPlugin, PluginCategory } from '@/types/plugin';
import { ToolPane } from '@components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { toast } from 'sonner';
import { PluginCard } from './components/PluginCard';
import { PluginDetailModal } from './components/PluginDetailModal';
import { InstallProgressModal } from './components/InstallProgressModal';

export default function PluginMarketplace() {
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [installProgress, setInstallProgress] = useState<{ pluginId: string; stage: string; percent: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load plugins on mount
  useEffect(() => {
    loadPlugins();
    
    // Listen for install progress
    const cleanup = window.pluginAPI.onInstallProgress((data) => {
      setInstallProgress(data);
      
      if (data.stage === 'complete') {
        setTimeout(() => {
          setInstallProgress(null);
          loadPlugins(); // Refresh list
        }, 2000);
      }
    });
    
    return cleanup;
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const [registry, installed] = await Promise.all([
        window.pluginAPI.getRegistry(),
        window.pluginAPI.getInstalled(),
      ]);
      
      setAvailablePlugins(registry?.plugins || []);
      setInstalledPlugins(installed);
    } catch (error: any) {
      toast.error('Failed to load plugins', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (pluginId: string) => {
    try {
      toast.info('Starting installation...', { description: 'Please wait' });
      await window.pluginAPI.install(pluginId);
      toast.success('Plugin installed successfully!');
    } catch (error: any) {
      toast.error('Installation failed', { description: error.message });
      setInstallProgress(null);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      toast.info('Uninstalling plugin...', { description: 'Please wait' });
      await window.pluginAPI.uninstall(pluginId);
      toast.success('Plugin uninstalled');
      await loadPlugins();
    } catch (error: any) {
      toast.error('Uninstallation failed', { description: error.message });
    }
  };

  const handleRefresh = async () => {
    try {
      toast.info('Updating plugin registry...', { description: 'Please wait' });
      await window.pluginAPI.updateRegistry();
      await loadPlugins();
      toast.success('Registry updated');
    } catch (error: any) {
      toast.error('Update failed', { description: error.message });
    }
  };

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    return availablePlugins.filter(plugin => {
      const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [availablePlugins, searchQuery, selectedCategory]);

  // Get install status
  const getInstallStatus = (pluginId: string) => {
    return installedPlugins.find(p => p.manifest.id === pluginId);
  };

  const categories: { value: PluginCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📦' },
    { value: 'media', label: 'Media', icon: '🎬' },
    { value: 'document', label: 'Documents', icon: '📄' },
    { value: 'developer', label: 'Developer', icon: '⚙️' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'network', label: 'Network', icon: '🌐' },
    { value: 'utility', label: 'Utility', icon: '🛠️' },
  ];

  return (
    <ToolPane 
      title="Plugin Marketplace" 
      description="Extend your DevTools with powerful plugins"
      icon={Package}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search & Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="pl-10"
            />
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Update Registry
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                ${selectedCategory === cat.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-glass-panel hover:bg-glass-panel-hover text-foreground-secondary'
                }
              `}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-glass-panel p-4 rounded-xl">
          <div className="text-2xl font-bold text-foreground-primary">{availablePlugins.length}</div>
          <div className="text-sm text-foreground-secondary">Available</div>
        </div>
        <div className="bg-glass-panel p-4 rounded-xl">
          <div className="text-2xl font-bold text-primary">{installedPlugins.length}</div>
          <div className="text-sm text-foreground-secondary">Installed</div>
        </div>
        <div className="bg-glass-panel p-4 rounded-xl">
          <div className="text-2xl font-bold text-foreground-primary">
            {filteredPlugins.reduce((acc, p) => acc + (p.downloads || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-foreground-secondary">Total Downloads</div>
        </div>
      </div>

      {/* Plugin Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading plugins...</p>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-foreground-tertiary mx-auto mb-4" />
          <p className="text-foreground-secondary">No plugins found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map(plugin => {
            const installed = getInstallStatus(plugin.id);
            return (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                installed={!!installed}
                onInstall={() => handleInstall(plugin.id)}
                onUninstall={() => handleUninstall(plugin.id)}
                onViewDetails={() => setSelectedPlugin(plugin)}
              />
            );
          })}
        </div>
      )}

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <PluginDetailModal
          plugin={selectedPlugin}
          installed={!!getInstallStatus(selectedPlugin.id)}
          onClose={() => setSelectedPlugin(null)}
          onInstall={() => handleInstall(selectedPlugin.id)}
          onUninstall={() => handleUninstall(selectedPlugin.id)}
        />
      )}

      {/* Install Progress Modal */}
      {installProgress && (
        <InstallProgressModal
          pluginId={installProgress.pluginId}
          stage={installProgress.stage}
          percent={installProgress.percent}
          message={installProgress.message}
        />
      )}
    </ToolPane>
  );
}
```

---

### 2.2 Plugin Card Component

**File**: `src/tools/plugins/components/PluginCard.tsx`

```typescript
import React from 'react';
import { Download, CheckCircle, Star, Info, Trash2 } from 'lucide-react';
import { PluginManifest } from '@/types/plugin';
import { Button } from '@components/ui/Button';
import { formatBytes } from '@utils/format';

interface PluginCardProps {
  plugin: PluginManifest;
  installed: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onViewDetails: () => void;
}

export function PluginCard({ plugin, installed, onInstall, onUninstall, onViewDetails }: PluginCardProps) {
  const categoryIcons: Record<string, string> = {
    media: '🎬',
    document: '📄',
    developer: '⚙️',
    security: '🔒',
    network: '🌐',
    utility: '🛠️',
  };

  return (
    <div className="bg-glass-panel border border-border-glass rounded-xl p-5 hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          {categoryIcons[plugin.category] || '📦'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground-primary truncate">
              {plugin.name}
            </h3>
            {plugin.verified && (
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-foreground-tertiary">v{plugin.version}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground-secondary mb-4 line-clamp-2 min-h-[2.5rem]">
        {plugin.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-foreground-tertiary mb-4">
        {plugin.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span>{plugin.rating.toFixed(1)}</span>
          </div>
        )}
        {plugin.downloads !== undefined && (
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span>{(plugin.downloads / 1000).toFixed(1)}k</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>📦</span>
          <span>{formatBytes(plugin.size)}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {plugin.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
          >
            {tag}
          </span>
        ))}
        {plugin.tags.length > 3 && (
          <span className="px-2 py-1 text-xs text-foreground-tertiary">
            +{plugin.tags.length - 3}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {installed ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onUninstall}
              className="flex-1 text-red-400 border-red-400/30 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Uninstall
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="px-3"
            >
              <Info className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={onInstall}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="px-3"
            >
              <Info className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### 2.3 Install Progress Modal

**File**: `src/tools/plugins/components/InstallProgressModal.tsx`

```typescript
import React from 'react';
import { Loader2, CheckCircle, Download, Shield, Package, Cog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/Dialog';

interface InstallProgressModalProps {
  pluginId: string;
  stage: string;
  percent: number;
  message: string;
}

export function InstallProgressModal({ pluginId, stage, percent, message }: InstallProgressModalProps) {
  const stageIcons: Record<string, React.ReactNode> = {
    download: <Download className="w-6 h-6" />,
    verify: <Shield className="w-6 h-6" />,
    extract: <Package className="w-6 h-6" />,
    dependencies: <Cog className="w-6 h-6" />,
    validate: <Shield className="w-6 h-6" />,
    register: <Package className="w-6 h-6" />,
    complete: <CheckCircle className="w-6 h-6" />,
  };

  const isComplete = stage === 'complete';

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Installing Plugin</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isComplete 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-primary/20 text-primary animate-pulse'
              }
            `}>
              {isComplete ? stageIcons[stage] : <Loader2 className="w-6 h-6 animate-spin" />}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-glass-panel rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-sm text-foreground-secondary mb-1">{message}</p>
            <p className="text-xs text-foreground-tertiary">{percent}%</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔄 Phase 3: Core Tool Migration (Week 5-6)

### 3.1 Identify Core vs Plugin Tools

**Core Tools** (Stay in main app - 15 tools):

```typescript
// src/tools/index.ts
export const CORE_TOOLS = [
  // Text & Data
  'base64',
  'json-formatter',
  'url-encoder',
  'timestamp-converter',
  'text-diff',
  
  // Utilities
  'screenshot',
  'color-picker',
  'qr-code',
  'uuid-generator',
  'random-generator',
  
  // Security
  'hash-generator',
  'password-generator',
  'jwt-decoder',
  
  // Developer
  'regex-tester',
  'json-validator',
];

// These will be migrated to plugins
export const PLUGIN_TOOLS = [
  'universal-downloader',  // → Plugin (+ yt-dlp)
  'video-editor',          // → Plugin (+ FFmpeg)
  'audio-converter',       // → Plugin (+ FFmpeg WASM)
  'image-converter',       // → Plugin (+ ImageMagick WASM)
  'pdf-tools',             // → Plugin
  // ... all other heavy tools
];
```

---

### 3.2 Convert Universal Downloader to Plugin

**Structure**:

```
plugins/universal-downloader/
├── manifest.json
├── index.js (entry point)
├── universal-downloader.js (backend logic)
├── UniversalDownloader.tsx (UI component)
├── components/
│   ├── DownloadProgress.tsx
│   ├── QueueManager.tsx
│   └── ...
├── assets/
│   └── icon.png
└── package.json
```

**File**: `plugins/universal-downloader/manifest.json`

```json
{
  "id": "universal-downloader",
  "name": "Universal Media Downloader",
  "version": "2.0.0",
  "description": "Download media from 1000+ platforms",
  "author": "DevTools Team",
  "license": "MIT",
  
  "category": "media",
  "tags": ["download", "youtube", "video", "audio", "media"],
  
  "main": "index.js",
  "icon": "assets/icon.png",
  
  "size": 65536000,
  "dependencies": {
    "binary": [
      {
        "name": "yt-dlp",
        "version": "2024.12.06",
        "size": 52428800,
        "platforms": {
          "win32": {
            "url": "https://github.com/yt-dlp/yt-dlp/releases/download/2024.12.06/yt-dlp.exe",
            "checksum": "..."
          }
        }
      }
    ]
  },
  
  "permissions": {
    "filesystem": true,
    "network": true,
    "shell": true
  },
  
  "minAppVersion": "1.0.0",
  "platforms": ["win32", "darwin", "linux"]
}
```

**File**: `plugins/universal-downloader/index.js`

```javascript
const { ipcMain } = require('electron');
const UniversalDownloaderService = require('./universal-downloader');

let service = null;

// Plugin lifecycle
module.exports = {
  async activate() {
    console.log('[Universal Downloader] Activating plugin...');
    
    // Get yt-dlp binary path from plugin manager
    const ytdlpPath = await global.pluginManager.getBinaryPath('yt-dlp');
    
    // Initialize service
    service = new UniversalDownloaderService(ytdlpPath);
    await service.initialize();
    
    // Register IPC handlers
    ipcMain.handle('universal:get-info', async (_event, url) => {
      return service.getMediaInfo(url);
    });
    
    ipcMain.handle('universal:download', async (event, url, options) => {
      const downloadId = await service.downloadMedia(url, options, (progress) => {
        event.sender.send('universal:progress', progress);
      });
      return downloadId;
    });
    
    // ... other handlers
    
    console.log('[Universal Downloader] Plugin activated');
  },
  
  deactivate() {
    console.log('[Universal Downloader] Deactivating plugin...');
    
    // Cleanup service
    if (service) {
      service.cleanup();
    }
    
    // Remove IPC handlers
    ipcMain.removeHandler('universal:get-info');
    ipcMain.removeHandler('universal:download');
    // ... remove others
    
    console.log('[Universal Downloader] Plugin deactivated');
  },
};
```

---

### 3.3 Plugin Packaging Script

**File**: `scripts/build-plugin.js`

```javascript
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function buildPlugin(pluginDir) {
  console.log(`Building plugin: ${pluginDir}`);
  
  const manifestPath = path.join(pluginDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // Create zip
  const zip = new AdmZip();
  zip.addLocalFolder(pluginDir);
  
  const outputPath = path.join(__dirname, '../dist/plugins', `${manifest.id}-${manifest.version}.zip`);
  zip.writeZip(outputPath);
  
  // Calculate checksum
  const buffer = fs.readFileSync(outputPath);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  
  console.log(`Plugin built: ${outputPath}`);
  console.log(`Checksum: ${checksum}`);
  console.log(`Size: ${buffer.length} bytes`);
  
  return {
    manifest,
    checksum,
    size: buffer.length,
    path: outputPath,
  };
}

// Build all plugins
const pluginsDir = path.join(__dirname, '../plugins');
const plugins = fs.readdirSync(pluginsDir);

Promise.all(plugins.map(p => buildPlugin(path.join(pluginsDir, p))))
  .then(results => {
    console.log('\nAll plugins built successfully!');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
```

---

## 🚀 Phase 4: Testing & Deployment (Week 7-8)

### 4.1 Testing Plan

```yaml
Unit Tests:
  - PluginManager.installPlugin()
  - PluginManager.uninstallPlugin()
  - PluginManager.loadPlugin()
  - Dependency management
  - Checksum verification

Integration Tests:
  - Install plugin from marketplace
  - Uninstall plugin
  - Plugin lifecycle (activate/deactivate)
  - Binary dependency installation
  - Registry updates

UI Tests:
  - Marketplace browsing
  - Search & filter
  - Plugin installation flow
  - Progress indicators
  - Error handling

End-to-End Tests:
  - First-time user experience
  - Install → Use → Uninstall workflow
  - Multiple plugin management
  - Update scenarios
```

---

### 4.2 Deployment Checklist

```markdown
## Pre-Release
- [ ] Build all plugins
- [ ] Generate checksums
- [ ] Upload plugin packages to GitHub Releases
- [ ] Update plugin registry JSON
- [ ] Upload registry to CDN
- [ ] Test registry updates
- [ ] Verify download speeds

## Release
- [ ] Increment app version
- [ ] Update changelog
- [ ] Build app with embedded registry
- [ ] Create GitHub release
- [ ] Upload app binaries
- [ ] Test auto-update

## Post-Release
- [ ] Monitor error logs
- [ ] Track plugin installations
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Plan next plugins
```

---

### 4.3 Rollout Strategy

**Phase 1 (Week 1-2): Beta Release**
```
- Release to 10% of users
- Monitor installation success rate
- Collect feedback
- Fix critical issues
```

**Phase 2 (Week 3-4): Gradual Rollout**
```
- Increase to 50% of users
- Monitor performance metrics
- Optimize download speeds
- Add more plugins
```

**Phase 3 (Week 5-6): Full Release**
```
- Release to 100% of users
- Announce plugin marketplace
- Create plugin development docs
- Open for community plugins
```

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)

```yaml
App Performance:
  Initial App Size: < 60MB (target: 50MB)
  Startup Time: < 2 seconds
  Memory Usage (Core): < 150MB

Plugin Performance:
  Average Install Time: < 30 seconds
  Install Success Rate: > 95%
  Plugin Load Time: < 1 second

User Engagement:
  Plugin Install Rate: > 60% of users
  Average Plugins Installed: 2-3 per user
  Plugin Retention: > 80% after 7 days

Marketplace:
  Registry Update Success: > 99%
  Download Speed: > 5 MB/s
  Plugin Discovery: < 5 seconds to find
```

---

## 🛠️ Development Tools

### Required Dependencies

```json
{
  "dependencies": {
    "electron-store": "^8.1.0",
    "axios": "^1.6.2",
    "adm-zip": "^0.5.10"
  },
  "devDependencies": {
    "@types/adm-zip": "^0.5.5"
  }
}
```

---

## 📚 Future Enhancements

### Phase 5+ (Future)

```yaml
Q1 2026:
  - Community plugin submissions
  - Plugin ratings & reviews
  - Automatic plugin updates
  - Plugin settings UI
  - Plugin permissions manager

Q2 2026:
  - Premium plugins
  - Plugin bundles
  - Developer API documentation
  - Plugin development CLI
  - Plugin testing framework

Q3 2026:
  - Plugin marketplace v2
  - AI-powered plugin recommendations
  - Cross-platform sync
  - Enterprise plugin management
  - Plugin analytics dashboard
```

---

## 🎯 Next Steps

### Immediate Actions (This Week)

1. **Install Dependencies**
   ```bash
   npm install electron-store axios adm-zip
   npm install -D @types/adm-zip
   ```

2. **Create Directory Structure**
   ```bash
   mkdir -p electron/main
   mkdir -p resources
   mkdir -p plugins
   mkdir -p src/tools/plugins/components
   mkdir -p src/types
   ```

3. **Implement Core Files**
   - [ ] `electron/main/plugin-manager.ts`
   - [ ] `resources/plugin-registry.json`
   - [ ] `src/types/plugin.ts`
   - [ ] Add IPC handlers to `main.ts`
   - [ ] Add preload bridge to `preload.ts`

4. **Build Marketplace UI**
   - [ ] `src/tools/plugins/PluginMarketplace.tsx`
   - [ ] `src/tools/plugins/components/PluginCard.tsx`
   - [ ] `src/tools/plugins/components/InstallProgressModal.tsx`

5. **Test Basic Flow**
   - [ ] Load registry
   - [ ] Display plugins
   - [ ] Mock installation
   - [ ] Verify UI updates

---

## 📋 Summary

This implementation plan transforms DevTools App into a **lightweight, extensible platform**:

**Week 1-2**: Plugin Manager infrastructure  
**Week 3-4**: Marketplace UI & UX  
**Week 5-6**: Migrate existing tools to plugins  
**Week 7-8**: Testing, deployment, and rollout  

**Key Benefits**:
- ✅ Core app reduced from ~200MB to ~50MB
- ✅ Users install only what they need
- ✅ Faster startup and better performance
- ✅ Easy to add new plugins
- ✅ Community can contribute
- ✅ Better maintainability

**Next**: Switch to agent mode and start implementing! 🚀
