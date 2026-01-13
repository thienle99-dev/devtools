export type PluginCategory = 'media' | 'document' | 'developer' | 'security' | 'network' | 'utility';
export type PluginStatus = 'not-installed' | 'installing' | 'installed' | 'updating' | 'error';

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

export interface PluginProgress {
  stage: 'download' | 'verify' | 'extract' | 'dependencies' | 'validate' | 'register' | 'complete' | 'error';
  percent: number;
  message: string;
}

export interface PluginAPI {
  getAvailablePlugins: () => Promise<PluginManifest[]>;
  getInstalledPlugins: () => Promise<InstalledPlugin[]>;
  installPlugin: (pluginId: string) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  togglePlugin: (pluginId: string, active: boolean) => Promise<void>;
  onPluginProgress: (callback: (progress: PluginProgress) => void) => () => void;
  updateRegistry: () => Promise<void>;
}
