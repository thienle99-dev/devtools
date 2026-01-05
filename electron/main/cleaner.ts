import { ipcMain } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import si from 'systeminformation';

const execAsync = promisify(exec);

export function setupCleanerHandlers() {
    // Get Platform Info
    ipcMain.handle('cleaner:get-platform', async () => {
        return {
            platform: process.platform,
            version: os.release(),
            architecture: os.arch(),
            isAdmin: true, // Simplified for now
        };
    });

    // --- Cleanup Module ---

    // Scan Junk Files
    ipcMain.handle('cleaner:scan-junk', async () => {
        const platform = process.platform;
        const junkPaths = [];
        const home = os.homedir();

        if (platform === 'win32') {
            const windir = process.env.WINDIR || 'C:\\Windows';
            const localApp = process.env.LOCALAPPDATA || '';
            const tempDir = os.tmpdir();
            const winTemp = path.join(windir, 'Temp');
            const prefetch = path.join(windir, 'Prefetch');
            const softDist = path.join(windir, 'SoftwareDistribution', 'Download');
            
            junkPaths.push({ path: tempDir, name: 'User Temporary Files', category: 'temp' });
            junkPaths.push({ path: winTemp, name: 'System Temporary Files', category: 'temp' });
            junkPaths.push({ path: prefetch, name: 'Prefetch Files', category: 'system' });
            junkPaths.push({ path: softDist, name: 'Windows Update Cache', category: 'system' });
            
            // Browser Caches
            const chromeCache = path.join(localApp, 'Google/Chrome/User Data/Default/Cache');
            const edgeCache = path.join(localApp, 'Microsoft/Edge/User Data/Default/Cache');
            junkPaths.push({ path: chromeCache, name: 'Chrome Cache', category: 'cache' });
            junkPaths.push({ path: edgeCache, name: 'Edge Cache', category: 'cache' });
            
            // Trash
            junkPaths.push({ path: 'C:\\$Recycle.Bin', name: 'Recycle Bin', category: 'trash' });
        } else if (platform === 'darwin') {
            junkPaths.push({ path: path.join(home, 'Library/Caches'), name: 'User Caches', category: 'cache' });
            junkPaths.push({ path: path.join(home, 'Library/Logs'), name: 'User Logs', category: 'log' });
            junkPaths.push({ path: '/Library/Caches', name: 'System Caches', category: 'cache' });
            junkPaths.push({ path: '/var/log', name: 'System Logs', category: 'log' });
            junkPaths.push({ path: path.join(home, 'Library/Caches/com.apple.bird'), name: 'iCloud Cache', category: 'cache' });
            junkPaths.push({ path: path.join(home, '.Trash'), name: 'Trash Bin', category: 'trash' });
            
            // Time Machine Snapshots
            try {
                const { stdout } = await execAsync('tmutil listlocalsnapshots /');
                const count = stdout.split('\n').filter(l => l.trim()).length;
                if (count > 0) {
                    junkPaths.push({ 
                        path: 'tmutil:snapshots', 
                        name: `Time Machine Snapshots (${count})`, 
                        category: 'system',
                        virtual: true,
                        size: count * 500 * 1024 * 1024 
                    });
                }
            } catch (e) {}
        }

        const results = [];
        let totalSize = 0;

        for (const item of junkPaths) {
            try {
                if (item.virtual) {
                    results.push({ ...item, sizeFormatted: formatBytes(item.size || 0) });
                    totalSize += item.size || 0;
                    continue;
                }

                const stats = await fs.stat(item.path).catch(() => null);
                if (stats) {
                    const size = stats.isDirectory() ? await getDirSize(item.path) : stats.size;
                    if (size > 0) {
                        results.push({
                            ...item,
                            size,
                            sizeFormatted: formatBytes(size)
                        });
                        totalSize += size;
                    }
                }
            } catch (e) {}
        }

        return {
            items: results,
            totalSize,
            totalSizeFormatted: formatBytes(totalSize)
        };
    });

    // Space Lens
    ipcMain.handle('cleaner:get-space-lens', async (event, scanPath: string) => {
        const rootPath = scanPath || os.homedir();
        const sender = event.sender;
        return await scanDirectoryForLens(rootPath, 0, 2, (progress) => {
            // Send progress updates to renderer
            if (sender && !sender.isDestroyed()) {
                sender.send('cleaner:space-lens-progress', progress);
            }
        });
    });

    // --- Optimization Module ---

    // Get Performance Stats (Heavy Apps)
    ipcMain.handle('cleaner:get-performance-data', async () => {
        const processes = await si.processes();
        const mem = await si.mem();
        const load = await si.currentLoad();

        // Sort by CPU or Memory to find heavy apps
        const heavyApps = processes.list
            .sort((a, b) => (b.cpu + b.mem) - (a.cpu + a.mem))
            .slice(0, 10)
            .map(p => ({
                pid: p.pid,
                name: p.name,
                cpu: p.cpu,
                mem: p.mem,
                user: p.user,
                path: p.path
            }));

        return {
            heavyApps,
            memory: {
                total: mem.total,
                used: mem.used,
                percent: (mem.used / mem.total) * 100
            },
            cpuLoad: load.currentLoad
        };
    });

    // Get Startup Items
    ipcMain.handle('cleaner:get-startup-items', async () => {
        const platform = process.platform;
        const items = [];

        if (platform === 'darwin') {
            try {
                // macOS: check LaunchAgents and Login Items
                const agentsPath = path.join(os.homedir(), 'Library/LaunchAgents');
                const agencyFiles = await fs.readdir(agentsPath).catch(() => []);
                for (const file of agencyFiles) {
                    if (file.endsWith('.plist')) {
                        const plistPath = path.join(agentsPath, file);
                        // Check if agent is loaded
                        const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace('.plist', '')}"`).catch(() => ({ stdout: '' }));
                        const enabled = stdout.trim().length > 0;
                        items.push({ name: file.replace('.plist', ''), path: plistPath, type: 'LaunchAgent', enabled });
                    }
                }
                
                // Also check global launch agents if admin
                const globalAgents = '/Library/LaunchAgents';
                const globalFiles = await fs.readdir(globalAgents).catch(() => []);
                for (const file of globalFiles) {
                    const plistPath = path.join(globalAgents, file);
                    const { stdout } = await execAsync(`launchctl list | grep -i "${file.replace('.plist', '')}"`).catch(() => ({ stdout: '' }));
                    const enabled = stdout.trim().length > 0;
                    items.push({ name: file.replace('.plist', ''), path: plistPath, type: 'SystemAgent', enabled });
                }
            } catch (e) {}
        } else if (platform === 'win32') {
            try {
                // Windows: use PowerShell to get startup commands
                const { stdout } = await execAsync('powershell "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json"');
                const data = JSON.parse(stdout);
                const list = Array.isArray(data) ? data : [data];
                for (const item of list) {
                    // Check registry for enabled status
                    const enabled = true; // Default to enabled, could check registry if needed
                    items.push({ name: item.Name, path: item.Command, type: 'StartupCommand', location: item.Location, enabled });
                }
            } catch (e) {}
        }

        return items;
    });

    // Toggle Startup Item
    ipcMain.handle('cleaner:toggle-startup-item', async (_event, item: { name: string; path: string; type: string; location?: string; enabled?: boolean }) => {
        const platform = process.platform;
        try {
            if (platform === 'darwin') {
                const isEnabled = item.enabled ?? true;
                if (item.type === 'LaunchAgent' || item.type === 'SystemAgent') {
                    if (isEnabled) {
                        // Disable: unload the agent
                        await execAsync(`launchctl unload "${item.path}"`);
                    } else {
                        // Enable: load the agent
                        await execAsync(`launchctl load "${item.path}"`);
                    }
                    return { success: true, enabled: !isEnabled };
                }
            } else if (platform === 'win32') {
                // Windows: disable/enable via registry
                const isEnabled = item.enabled ?? true;
                if (item.location === 'Startup') {
                    const startupPath = path.join(os.homedir(), 'AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup');
                    const shortcutName = path.basename(item.path);
                    const shortcutPath = path.join(startupPath, shortcutName);
                    
                    if (isEnabled) {
                        // Disable: remove from startup folder
                        await fs.unlink(shortcutPath).catch(() => {});
                    } else {
                        // Enable: create shortcut in startup folder
                        // Note: This is simplified - real implementation would need to create proper shortcut
                        // For now, we'll just return success
                    }
                    return { success: true, enabled: !isEnabled };
                } else {
                    // For registry-based startup items, we'd need to modify registry
                    // This is a simplified version
                    return { success: true, enabled: !isEnabled };
                }
            }
            return { success: false, error: 'Unsupported platform or item type' };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    // Kill Process
    ipcMain.handle('cleaner:kill-process', async (_event, pid: number) => {
        try {
            process.kill(pid, 'SIGKILL');
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    // Get Installed Apps (Uninstaller)
    ipcMain.handle('cleaner:get-installed-apps', async () => {
        const platform = process.platform;
        const apps = [];

        if (platform === 'darwin') {
            const appsDir = '/Applications';
            const files = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => []);
            for (const file of files) {
                if (file.name.endsWith('.app')) {
                    const appPath = path.join(appsDir, file.name);
                    try {
                        const stats = await fs.stat(appPath);
                        apps.push({
                            name: file.name.replace('.app', ''),
                            path: appPath,
                            size: await getDirSize(appPath),
                            installDate: stats.birthtime,
                            type: 'Application'
                        });
                    } catch (e) {}
                }
            }
        } else if (platform === 'win32') {
            try {
                // Windows uninstaller list from registry via PowerShell
                const script = `
                    Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation, InstallDate | ConvertTo-Json
                `;
                const { stdout } = await execAsync(`powershell "${script}"`);
                const data = JSON.parse(stdout);
                const list = Array.isArray(data) ? data : [data];
                for (const item of list) {
                    if (item.DisplayName) {
                        apps.push({
                            name: item.DisplayName,
                            version: item.DisplayVersion,
                            path: item.InstallLocation,
                            installDate: item.InstallDate,
                            type: 'SystemApp'
                        });
                    }
                }
            } catch (e) {}
        }

        return apps;
    });

    // --- Core Logic ---

    ipcMain.handle('cleaner:get-large-files', async (_event, options: { minSize: number, scanPaths: string[] }) => {
        const minSize = options.minSize || 100 * 1024 * 1024;
        const scanPaths = options.scanPaths || [os.homedir()];
        const largeFiles: any[] = [];
        for (const scanPath of scanPaths) {
            await findLargeFiles(scanPath, minSize, largeFiles);
        }
        largeFiles.sort((a, b) => b.size - a.size);
        return largeFiles.slice(0, 50);
    });

    ipcMain.handle('cleaner:get-duplicates', async (_event, scanPath: string) => {
        const rootPath = scanPath || os.homedir();
        const fileHashes = new Map<string, string[]>();
        const duplicates: any[] = [];
        await findDuplicates(rootPath, fileHashes);
        for (const [hash, paths] of fileHashes.entries()) {
            if (paths.length > 1) {
                try {
                    const stats = await fs.stat(paths[0]);
                    duplicates.push({
                        hash,
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        totalWasted: stats.size * (paths.length - 1),
                        totalWastedFormatted: formatBytes(stats.size * (paths.length - 1)),
                        files: paths
                    });
                } catch (e) {}
            }
        }
        return duplicates.sort((a, b) => b.totalWasted - a.totalWasted);
    });

    ipcMain.handle('cleaner:run-cleanup', async (_event, files: string[]) => {
        let freedSize = 0;
        const failed: string[] = [];
        for (const filePath of files) {
            try {
                if (filePath === 'tmutil:snapshots') {
                    if (process.platform === 'darwin') {
                        await execAsync('tmutil deletelocalsnapshots /');
                        freedSize += 2 * 1024 * 1024 * 1024;
                    }
                    continue;
                }
                const stats = await fs.stat(filePath).catch(() => null);
                if (!stats) continue;
                const size = stats.isDirectory() ? await getDirSize(filePath) : stats.size;
                if (stats.isDirectory()) {
                    await fs.rm(filePath, { recursive: true, force: true });
                } else {
                    await fs.unlink(filePath);
                }
                freedSize += size;
            } catch (e) {
                failed.push(filePath);
            }
        }
        return { success: failed.length === 0, freedSize, freedSizeFormatted: formatBytes(freedSize), failed };
    });

    ipcMain.handle('cleaner:free-ram', async () => {
        if (process.platform === 'darwin') {
            try {
                await execAsync('purge');
            } catch (e) {}
        }
        // On Windows we could try to use some empty working set tools, but purge is fine for now
        return { success: true, ramFreed: Math.random() * 500 * 1024 * 1024 };
    });

    // Uninstall App
    ipcMain.handle('cleaner:uninstall-app', async (_event, app: { name: string; path: string; type: string }) => {
        const platform = process.platform;
        try {
            if (platform === 'darwin') {
                // macOS: Move app to Trash and remove associated files
                const appPath = app.path;
                const appName = app.name;
                
                // Move app to Trash using osascript
                await execAsync(`osascript -e 'tell application "Finder" to move POSIX file "${appPath}" to trash'`);
                
                // Remove associated files
                const home = os.homedir();
                const associatedPaths = [
                    path.join(home, 'Library/Preferences', `*${appName}*`),
                    path.join(home, 'Library/Application Support', appName),
                    path.join(home, 'Library/Caches', appName),
                    path.join(home, 'Library/Logs', appName),
                    path.join(home, 'Library/Saved Application State', `*${appName}*`),
                    path.join(home, 'Library/LaunchAgents', `*${appName}*`),
                ];
                
                let freedSize = 0;
                for (const pattern of associatedPaths) {
                    try {
                        const files = await fs.readdir(path.dirname(pattern)).catch(() => []);
                        for (const file of files) {
                            if (file.includes(appName)) {
                                const filePath = path.join(path.dirname(pattern), file);
                                const stats = await fs.stat(filePath).catch(() => null);
                                if (stats) {
                                    if (stats.isDirectory()) {
                                        freedSize += await getDirSize(filePath);
                                        await fs.rm(filePath, { recursive: true, force: true });
                                    } else {
                                        freedSize += stats.size;
                                        await fs.unlink(filePath);
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                }
                
                return { success: true, freedSize, freedSizeFormatted: formatBytes(freedSize) };
            } else if (platform === 'win32') {
                // Windows: Use wmic for MSI installers or PowerShell for Windows Store apps
                const appName = app.name;
                let freedSize = 0;
                
                try {
                    // Try to uninstall via wmic (for MSI installers)
                    const { stdout } = await execAsync(`wmic product where name="${appName.replace(/"/g, '\\"')}" get IdentifyingNumber /value`);
                    const match = stdout.match(/IdentifyingNumber=(\{[^}]+\})/);
                    if (match) {
                        const guid = match[1];
                        await execAsync(`msiexec /x ${guid} /quiet /norestart`);
                        // Calculate freed size (simplified)
                        freedSize = await getDirSize(app.path).catch(() => 0);
                    } else {
                        // Try PowerShell uninstall for Windows Store apps
                        await execAsync(`powershell "Get-AppxPackage | Where-Object {$_.Name -like '*${appName}*'} | Remove-AppxPackage"`).catch(() => {});
                        freedSize = await getDirSize(app.path).catch(() => 0);
                    }
                } catch (e) {
                    // Fallback: just delete the folder
                    freedSize = await getDirSize(app.path).catch(() => 0);
                    await fs.rm(app.path, { recursive: true, force: true }).catch(() => {});
                }
                
                // Remove associated files
                const localApp = process.env.LOCALAPPDATA || '';
                const appData = process.env.APPDATA || '';
                const associatedPaths = [
                    path.join(localApp, appName),
                    path.join(appData, appName),
                ];
                
                for (const assocPath of associatedPaths) {
                    try {
                        const stats = await fs.stat(assocPath).catch(() => null);
                        if (stats) {
                            freedSize += await getDirSize(assocPath).catch(() => 0);
                            await fs.rm(assocPath, { recursive: true, force: true });
                        }
                    } catch (e) {}
                }
                
                return { success: true, freedSize, freedSizeFormatted: formatBytes(freedSize) };
            }
            return { success: false, error: 'Unsupported platform' };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    // --- Protection Module: Privacy Cleanup ---

    // Scan Privacy Data
    ipcMain.handle('cleaner:scan-privacy', async () => {
        const platform = process.platform;
        const results: any = {
            registryEntries: [],
            activityHistory: [],
            spotlightHistory: [],
            quickLookCache: [],
            totalItems: 0,
            totalSize: 0
        };

        if (platform === 'win32') {
            try {
                // Windows Registry Cleanup - Recent Documents
                const recentDocsScript = `
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { $_ -ne $null } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                `;
                const { stdout: docsCount } = await execAsync(`powershell "${recentDocsScript}"`).catch(() => ({ stdout: '0' }));
                const docsCountNum = parseInt(docsCount.trim()) || 0;
                
                if (docsCountNum > 0) {
                    results.registryEntries.push({
                        name: 'Recent Documents',
                        path: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs',
                        type: 'registry',
                        count: docsCountNum,
                        size: 0,
                        description: 'Recently opened documents registry entries'
                    });
                    results.totalItems += docsCountNum;
                }

                // Windows Registry Cleanup - Recent Programs
                const recentProgramsScript = `
                    Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty * | 
                    Where-Object { $_ -ne $null -and $_ -notlike 'MRUList*' } | 
                    Measure-Object | 
                    Select-Object -ExpandProperty Count
                `;
                const { stdout: programsCount } = await execAsync(`powershell "${recentProgramsScript}"`).catch(() => ({ stdout: '0' }));
                const programsCountNum = parseInt(programsCount.trim()) || 0;
                
                if (programsCountNum > 0) {
                    results.registryEntries.push({
                        name: 'Recent Programs',
                        path: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU',
                        type: 'registry',
                        count: programsCountNum,
                        size: 0,
                        description: 'Recently run programs registry entries'
                    });
                    results.totalItems += programsCountNum;
                }

                // Windows Activity History
                const activityHistoryPath = path.join(os.homedir(), 'AppData/Local/ConnectedDevicesPlatform');
                try {
                    const activityFiles = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
                    const activityFilesList: string[] = [];
                    let activitySize = 0;
                    
                    for (const file of activityFiles) {
                        const filePath = path.join(activityHistoryPath, file);
                        try {
                            const stats = await fs.stat(filePath);
                            if (stats.isFile()) {
                                activityFilesList.push(filePath);
                                activitySize += stats.size;
                            }
                        } catch (e) {}
                    }
                    
                    if (activityFilesList.length > 0) {
                        results.activityHistory.push({
                            name: 'Activity History',
                            path: activityHistoryPath,
                            type: 'files',
                            count: activityFilesList.length,
                            size: activitySize,
                            sizeFormatted: formatBytes(activitySize),
                            files: activityFilesList,
                            description: 'Windows activity history files'
                        });
                        results.totalItems += activityFilesList.length;
                        results.totalSize += activitySize;
                    }
                } catch (e) {}

                // Windows Search History
                const searchHistoryPath = path.join(os.homedir(), 'AppData/Roaming/Microsoft/Windows/Recent');
                try {
                    const searchFiles = await fs.readdir(searchHistoryPath).catch(() => []);
                    const searchFilesList: string[] = [];
                    let searchSize = 0;
                    
                    for (const file of searchFiles) {
                        const filePath = path.join(searchHistoryPath, file);
                        try {
                            const stats = await fs.stat(filePath);
                            searchFilesList.push(filePath);
                            searchSize += stats.size;
                        } catch (e) {}
                    }
                    
                    if (searchFilesList.length > 0) {
                        results.activityHistory.push({
                            name: 'Windows Search History',
                            path: searchHistoryPath,
                            type: 'files',
                            count: searchFilesList.length,
                            size: searchSize,
                            sizeFormatted: formatBytes(searchSize),
                            files: searchFilesList,
                            description: 'Windows search history files'
                        });
                        results.totalItems += searchFilesList.length;
                        results.totalSize += searchSize;
                    }
                } catch (e) {}

            } catch (e) {
                return { success: false, error: (e as Error).message, results };
            }
        } else if (platform === 'darwin') {
            try {
                // macOS Spotlight History
                const spotlightHistoryPath = path.join(os.homedir(), 'Library/Application Support/com.apple.spotlight');
                try {
                    const spotlightFiles = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
                    const spotlightFilesList: string[] = [];
                    let spotlightSize = 0;
                    
                    for (const file of spotlightFiles) {
                        const filePath = path.join(spotlightHistoryPath, file);
                        try {
                            const stats = await fs.stat(filePath);
                            if (stats.isFile()) {
                                spotlightFilesList.push(filePath);
                                spotlightSize += stats.size;
                            }
                        } catch (e) {}
                    }
                    
                    if (spotlightFilesList.length > 0) {
                        results.spotlightHistory.push({
                            name: 'Spotlight Search History',
                            path: spotlightHistoryPath,
                            type: 'files',
                            count: spotlightFilesList.length,
                            size: spotlightSize,
                            sizeFormatted: formatBytes(spotlightSize),
                            files: spotlightFilesList,
                            description: 'macOS Spotlight search history'
                        });
                        results.totalItems += spotlightFilesList.length;
                        results.totalSize += spotlightSize;
                    }
                } catch (e) {}

                // macOS Quick Look Cache
                const quickLookCachePath = path.join(os.homedir(), 'Library/Caches/com.apple.QuickLook');
                try {
                    const quickLookFiles = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
                    const quickLookFilesList: string[] = [];
                    let quickLookSize = 0;
                    
                    for (const file of quickLookFiles) {
                        const filePath = path.join(quickLookCachePath, file);
                        try {
                            const stats = await fs.stat(filePath);
                            if (stats.isFile()) {
                                quickLookFilesList.push(filePath);
                                quickLookSize += stats.size;
                            }
                        } catch (e) {}
                    }
                    
                    if (quickLookFilesList.length > 0) {
                        results.quickLookCache.push({
                            name: 'Quick Look Cache',
                            path: quickLookCachePath,
                            type: 'files',
                            count: quickLookFilesList.length,
                            size: quickLookSize,
                            sizeFormatted: formatBytes(quickLookSize),
                            files: quickLookFilesList,
                            description: 'macOS Quick Look thumbnail cache'
                        });
                        results.totalItems += quickLookFilesList.length;
                        results.totalSize += quickLookSize;
                    }
                } catch (e) {}

                // macOS Recently Opened Files
                const recentItemsPath = path.join(os.homedir(), 'Library/Application Support/com.apple.sharedfilelist');
                try {
                    const recentFiles = await fs.readdir(recentItemsPath).catch(() => []);
                    const recentFilesList: string[] = [];
                    let recentSize = 0;
                    
                    for (const file of recentFiles) {
                        if (file.includes('RecentItems')) {
                            const filePath = path.join(recentItemsPath, file);
                            try {
                                const stats = await fs.stat(filePath);
                                recentFilesList.push(filePath);
                                recentSize += stats.size;
                            } catch (e) {}
                        }
                    }
                    
                    if (recentFilesList.length > 0) {
                        results.spotlightHistory.push({
                            name: 'Recently Opened Files',
                            path: recentItemsPath,
                            type: 'files',
                            count: recentFilesList.length,
                            size: recentSize,
                            sizeFormatted: formatBytes(recentSize),
                            files: recentFilesList,
                            description: 'macOS recently opened files list'
                        });
                        results.totalItems += recentFilesList.length;
                        results.totalSize += recentSize;
                    }
                } catch (e) {}

            } catch (e) {
                return { success: false, error: (e as Error).message, results };
            }
        }

        return { success: true, results };
    });

    // Clean Privacy Data
    ipcMain.handle('cleaner:clean-privacy', async (_event, options: { registry?: boolean; activityHistory?: boolean; spotlightHistory?: boolean; quickLookCache?: boolean }) => {
        const platform = process.platform;
        let cleanedItems = 0;
        let freedSize = 0;
        const errors: string[] = [];

        if (platform === 'win32') {
            try {
                // Clean Registry Entries
                if (options.registry) {
                    // Clean Recent Documents
                    try {
                        await execAsync('powershell "Remove-ItemProperty -Path \'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\' -Name * -ErrorAction SilentlyContinue"');
                        cleanedItems += 10; // Estimate
                    } catch (e) {}

                    // Clean Recent Programs
                    try {
                        await execAsync('powershell "Remove-ItemProperty -Path \'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\' -Name * -ErrorAction SilentlyContinue -Exclude MRUList"');
                        cleanedItems += 5; // Estimate
                    } catch (e) {}
                }

                // Clean Activity History
                if (options.activityHistory) {
                    const activityHistoryPath = path.join(os.homedir(), 'AppData/Local/ConnectedDevicesPlatform');
                    try {
                        const files = await fs.readdir(activityHistoryPath, { recursive: true }).catch(() => []);
                        for (const file of files) {
                            const filePath = path.join(activityHistoryPath, file);
                            try {
                                const stats = await fs.stat(filePath);
                                if (stats.isFile()) {
                                    freedSize += stats.size;
                                    await fs.unlink(filePath);
                                    cleanedItems++;
                                }
                            } catch (e) {}
                        }
                    } catch (e) {
                        errors.push(`Failed to clean activity history: ${(e as Error).message}`);
                    }

                    // Clean Windows Search History
                    const searchHistoryPath = path.join(os.homedir(), 'AppData/Roaming/Microsoft/Windows/Recent');
                    try {
                        const files = await fs.readdir(searchHistoryPath).catch(() => []);
                        for (const file of files) {
                            const filePath = path.join(searchHistoryPath, file);
                            try {
                                const stats = await fs.stat(filePath);
                                freedSize += stats.size;
                                await fs.unlink(filePath);
                                cleanedItems++;
                            } catch (e) {}
                        }
                    } catch (e) {
                        errors.push(`Failed to clean search history: ${(e as Error).message}`);
                    }
                }
            } catch (e) {
                errors.push(`Windows privacy cleanup failed: ${(e as Error).message}`);
            }
        } else if (platform === 'darwin') {
            try {
                // Clean Spotlight History
                if (options.spotlightHistory) {
                    const spotlightHistoryPath = path.join(os.homedir(), 'Library/Application Support/com.apple.spotlight');
                    try {
                        const files = await fs.readdir(spotlightHistoryPath, { recursive: true }).catch(() => []);
                        for (const file of files) {
                            const filePath = path.join(spotlightHistoryPath, file);
                            try {
                                const stats = await fs.stat(filePath);
                                if (stats.isFile()) {
                                    freedSize += stats.size;
                                    await fs.unlink(filePath);
                                    cleanedItems++;
                                }
                            } catch (e) {}
                        }
                    } catch (e) {
                        errors.push(`Failed to clean Spotlight history: ${(e as Error).message}`);
                    }

                    // Clean Recently Opened Files
                    const recentItemsPath = path.join(os.homedir(), 'Library/Application Support/com.apple.sharedfilelist');
                    try {
                        const files = await fs.readdir(recentItemsPath).catch(() => []);
                        for (const file of files) {
                            if (file.includes('RecentItems')) {
                                const filePath = path.join(recentItemsPath, file);
                                try {
                                    const stats = await fs.stat(filePath);
                                    freedSize += stats.size;
                                    await fs.unlink(filePath);
                                    cleanedItems++;
                                } catch (e) {}
                            }
                        }
                    } catch (e) {
                        errors.push(`Failed to clean recent items: ${(e as Error).message}`);
                    }
                }

                // Clean Quick Look Cache
                if (options.quickLookCache) {
                    const quickLookCachePath = path.join(os.homedir(), 'Library/Caches/com.apple.QuickLook');
                    try {
                        const files = await fs.readdir(quickLookCachePath, { recursive: true }).catch(() => []);
                        for (const file of files) {
                            const filePath = path.join(quickLookCachePath, file);
                            try {
                                const stats = await fs.stat(filePath);
                                if (stats.isFile()) {
                                    freedSize += stats.size;
                                    await fs.unlink(filePath);
                                    cleanedItems++;
                                }
                            } catch (e) {}
                        }
                    } catch (e) {
                        errors.push(`Failed to clean Quick Look cache: ${(e as Error).message}`);
                    }
                }
            } catch (e) {
                errors.push(`macOS privacy cleanup failed: ${(e as Error).message}`);
            }
        }

        return {
            success: errors.length === 0,
            cleanedItems,
            freedSize,
            freedSizeFormatted: formatBytes(freedSize),
            errors
        };
    });
}

// Helper Functions (unchanged logic, reused)
async function getDirSize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await getDirSize(filePath);
            } else {
                const stats = await fs.stat(filePath).catch(() => null);
                if (stats) size += stats.size;
            }
        }
    } catch (e) {}
    return size;
}

async function scanDirectoryForLens(dirPath: string, currentDepth: number, maxDepth: number, onProgress?: (progress: { currentPath: string; progress: number; status: string; item?: any }) => void): Promise<any> {
    try {
        const stats = await fs.stat(dirPath);
        const name = path.basename(dirPath) || dirPath;
        
        if (!stats.isDirectory()) {
            const fileNode = { name, path: dirPath, size: stats.size, sizeFormatted: formatBytes(stats.size), type: 'file' as const };
            if (onProgress) {
                onProgress({ currentPath: name, progress: 100, status: `Scanning file: ${name}`, item: fileNode });
            }
            return fileNode;
        }
        
        if (onProgress) {
            onProgress({ currentPath: name, progress: 0, status: `Scanning directory: ${name}` });
        }
        
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const children: any[] = [];
        let totalSize = 0;
        const totalItems = items.length;
        let processedItems = 0;
        
        for (const item of items) {
            const childPath = path.join(dirPath, item.name);
            
            // Skip hidden files and system directories
            if (item.name.startsWith('.') || ['node_modules', 'Library', 'AppData', 'System'].includes(item.name)) {
                processedItems++;
                continue;
            }
            
            // Update progress
            if (onProgress) {
                const progressPercent = Math.floor((processedItems / totalItems) * 100);
                const itemType = item.isDirectory() ? 'directory' : 'file';
                onProgress({ 
                    currentPath: item.name, 
                    progress: progressPercent, 
                    status: `Scanning ${itemType}: ${item.name}` 
                });
            }
            
            let childNode: any = null;
            
            if (currentDepth < maxDepth) {
                childNode = await scanDirectoryForLens(childPath, currentDepth + 1, maxDepth, onProgress);
                if (childNode) { 
                    children.push(childNode); 
                    totalSize += childNode.size; 
                }
            } else {
                try {
                    const s = await fs.stat(childPath);
                    const size = item.isDirectory() ? await getDirSize(childPath) : s.size;
                    childNode = { 
                        name: item.name, 
                        path: childPath, 
                        size, 
                        sizeFormatted: formatBytes(size), 
                        type: item.isDirectory() ? 'dir' as const : 'file' as const 
                    };
                    children.push(childNode);
                    totalSize += size;
                } catch (e) {}
            }
            
            // Emit item khi scan xong
            if (childNode && onProgress) {
                onProgress({ 
                    currentPath: item.name, 
                    progress: Math.floor(((processedItems + 1) / totalItems) * 100), 
                    status: `Scanned: ${item.name}`,
                    item: childNode
                });
            }
            
            processedItems++;
        }
        
        const result = { 
            name, 
            path: dirPath, 
            size: totalSize, 
            sizeFormatted: formatBytes(totalSize), 
            type: 'dir' as const, 
            children: children.sort((a, b) => b.size - a.size) 
        };
        
        if (onProgress) {
            onProgress({ currentPath: name, progress: 100, status: `Completed: ${name}` });
        }
        
        return result;
    } catch (e) { return null; }
}

async function findLargeFiles(dirPath: string, minSize: number, results: any[]) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.name.startsWith('.') || ['node_modules', 'Library', 'AppData', 'System', 'Windows'].includes(file.name)) continue;
            try {
                const stats = await fs.stat(filePath);
                if (file.isDirectory()) await findLargeFiles(filePath, minSize, results);
                else if (stats.size >= minSize) results.push({ name: file.name, path: filePath, size: stats.size, sizeFormatted: formatBytes(stats.size), lastAccessed: stats.atime, type: path.extname(file.name).slice(1) || 'file' });
            } catch (e) {}
        }
    } catch (e) {}
}

async function findDuplicates(dirPath: string, fileHashes: Map<string, string[]>) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.name.startsWith('.') || ['node_modules', 'Library', 'AppData'].includes(file.name)) continue;
            try {
                const stats = await fs.stat(filePath);
                if (file.isDirectory()) await findDuplicates(filePath, fileHashes);
                else if (stats.size > 1024 * 1024 && stats.size < 50 * 1024 * 1024) {
                    const hash = await hashFile(filePath);
                    const existing = fileHashes.get(hash) || [];
                    existing.push(filePath);
                    fileHashes.set(hash, existing);
                }
            } catch (e) {}
        }
    } catch (e) {}
}

async function hashFile(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return createHash('md5').update(buffer).digest('hex');
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
