import { ipcMain, app, globalShortcut, desktopCapturer, clipboard } from 'electron';
import si from 'systeminformation';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';


const execAsync = promisify(exec);

export function setupSystemHandlers() {

    // ========== Disk Stats ==========
    ipcMain.handle('get-disk-stats', async () => {
        try {
            const [fsSize, ioStatsRaw] = await Promise.all([
                si.fsSize(),
                si.disksIO()
            ]);

            // si.disksIO() returns an array, we need to aggregate or use the first disk
            let ioStats = null;
            if (ioStatsRaw && Array.isArray(ioStatsRaw) && ioStatsRaw.length > 0) {
                // Use the first disk's IO stats, or aggregate all
                const firstDisk = ioStatsRaw[0];
                ioStats = {
                    rIO: firstDisk.rIO || 0,
                    wIO: firstDisk.wIO || 0,
                    tIO: firstDisk.tIO || 0,
                    rIO_sec: firstDisk.rIO_sec || 0,
                    wIO_sec: firstDisk.wIO_sec || 0,
                    tIO_sec: firstDisk.tIO_sec || 0,
                };
            } else if (ioStatsRaw && typeof ioStatsRaw === 'object' && !Array.isArray(ioStatsRaw)) {
                // If it's an object (single disk)
                // @ts-ignore
                const obj = ioStatsRaw as any;
                ioStats = {
                    rIO: obj.rIO || 0,
                    wIO: obj.wIO || 0,
                    tIO: obj.tIO || 0,
                    rIO_sec: obj.rIO_sec || 0,
                    wIO_sec: obj.wIO_sec || 0,
                    tIO_sec: obj.tIO_sec || 0,
                };
            }

            return { fsSize, ioStats };
        } catch (error) {
            console.error('Error fetching disk stats:', error);
            // Return fsSize even if ioStats fails
            const fsSize = await si.fsSize().catch(() => []);
            return { fsSize, ioStats: null };
        }
    });

    // ========== Other Stats ==========
    ipcMain.handle('get-gpu-stats', async () => {
        return await si.graphics();
    });

    ipcMain.handle('get-battery-stats', async () => {
        try {
            const battery = await si.battery();
            let powerConsumptionRate: number | undefined;
            let chargingPower: number | undefined;

            // @ts-ignore
            if ('powerConsumptionRate' in battery && battery.powerConsumptionRate && typeof battery.powerConsumptionRate === 'number') {
                // @ts-ignore
                powerConsumptionRate = battery.powerConsumptionRate;
            }

            if (battery.voltage && battery.voltage > 0) {
                if (!battery.isCharging && battery.timeRemaining > 0 && battery.currentCapacity > 0) {
                    const estimatedCurrent = (battery.currentCapacity / battery.timeRemaining) * 60;
                    powerConsumptionRate = battery.voltage * estimatedCurrent;
                }
                if (battery.isCharging && battery.voltage > 0) {
                    const estimatedChargingCurrent = 2000;
                    chargingPower = battery.voltage * estimatedChargingCurrent;
                }
            }

            return {
                ...battery,
                powerConsumptionRate,
                chargingPower,
            };
        } catch (error) {
            console.error('Error fetching battery stats:', error);
            return null;
        }
    });

    ipcMain.handle('get-sensor-stats', async () => {
        return await si.cpuTemperature();
    });

    // ========== Bluetooth ==========
    ipcMain.handle('get-bluetooth-stats', async () => {
        try {
            const bluetooth = await si.bluetoothDevices();
            return {
                enabled: bluetooth.length > 0 || await checkBluetoothEnabled(),
                devices: bluetooth.map((device: any) => ({
                    name: device.name || 'Unknown',
                    mac: device.mac || device.address || '',
                    type: device.type || device.deviceClass || 'unknown',
                    battery: device.battery || device.batteryLevel || undefined,
                    connected: device.connected !== false,
                    rssi: device.rssi || device.signalStrength || undefined,
                    manufacturer: device.manufacturer || device.vendor || undefined,
                }))
            };
        } catch (error) {
            console.error('Error fetching bluetooth stats:', error);
            return { enabled: false, devices: [] };
        }
    });

    // ========== Timezones ==========
    ipcMain.handle('get-timezones-stats', async () => {
        try {
            const time = await si.time();
            const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const defaultZones = [
                'America/New_York',
                'Europe/London',
                'Asia/Tokyo',
                'Asia/Shanghai',
            ];

            const zones = defaultZones.map(tz => {
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                });
                const dateFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });

                const offset = getTimezoneOffset(tz);
                const cityName = tz.split('/').pop()?.replace('_', ' ') || tz;

                return {
                    timezone: tz,
                    city: cityName,
                    time: formatter.format(now),
                    date: dateFormatter.format(now),
                    offset,
                };
            });

            return {
                local: {
                    timezone: localTz,
                    city: localTz.split('/').pop()?.replace('_', ' ') || 'Local',
                    time: time.current,
                    date: time.uptime ? new Date().toLocaleDateString() : '',
                    offset: getTimezoneOffset(localTz),
                },
                zones,
            };
        } catch (error) {
            console.error('Error fetching timezones stats:', error);
            return null;
        }
    });

    // ========== System Info ==========
    ipcMain.handle('system:get-info', async () => {
        try {
            const [cpu, mem, os, graphics, disk, net] = await Promise.all([
                si.cpu(),
                si.mem(),
                si.osInfo(),
                si.graphics(),
                si.diskLayout(),
                si.networkInterfaces()
            ]);

            return {
                cpu,
                memory: mem,
                os,
                graphics: graphics.controllers,
                disks: disk,
                network: net.filter(n => n.operstate === 'up')
            };
        } catch (error) {
            console.error('Error fetching system info:', error);
            return null;
        }
    });

    // ========== Permissions Handlers ==========

    // Check all permissions
    ipcMain.handle('permissions:check-all', async () => {
        const platform = process.platform;
        const results: Record<string, any> = {};

        if (platform === 'darwin') {
            results.accessibility = await checkAccessibilityPermission();
            results.fullDiskAccess = await checkFullDiskAccessPermission();
            results.screenRecording = await checkScreenRecordingPermission();
        } else if (platform === 'win32') {
            results.fileAccess = await checkFileAccessPermission();
            results.registryAccess = await checkRegistryAccessPermission();
        }

        results.clipboard = await checkClipboardPermission();
        results.launchAtLogin = await checkLaunchAtLoginPermission();

        return results;
    });

    ipcMain.handle('permissions:check-accessibility', async () => {
        if (process.platform !== 'darwin') return { status: 'not-applicable', message: 'Only available on macOS' };
        return await checkAccessibilityPermission();
    });

    ipcMain.handle('permissions:check-full-disk-access', async () => {
        if (process.platform !== 'darwin') return { status: 'not-applicable', message: 'Only available on macOS' };
        return await checkFullDiskAccessPermission();
    });

    ipcMain.handle('permissions:check-screen-recording', async () => {
        if (process.platform !== 'darwin') return { status: 'not-applicable', message: 'Only available on macOS' };
        return await checkScreenRecordingPermission();
    });

    ipcMain.handle('permissions:test-clipboard', async () => {
        return await testClipboardPermission();
    });

    ipcMain.handle('permissions:test-file-access', async () => {
        return await testFileAccessPermission();
    });

    ipcMain.handle('permissions:open-system-preferences', async (_event, permissionType?: string) => {
        return await openSystemPreferences(permissionType);
    });

    // ========== App Manager ==========
    ipcMain.handle('app-manager:get-installed-apps', async () => {
        try {
            const platform = process.platform;
            const apps: any[] = [];

            if (platform === 'darwin') {
                const appsDir = '/Applications';
                const files = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => []);
                for (const file of files) {
                    if (file.name.endsWith('.app')) {
                        const appPath = join(appsDir, file.name);
                        try {
                            const stats = await fs.stat(appPath);
                            const appName = file.name.replace('.app', '');
                            const isSystemApp = appPath.startsWith('/System') ||
                                appPath.startsWith('/Library') ||
                                appName.startsWith('com.apple.');

                            apps.push({
                                id: `macos-${appName}-${stats.ino}`,
                                name: appName,
                                version: undefined,
                                publisher: undefined,
                                installDate: stats.birthtime.toISOString(),
                                installLocation: appPath,
                                size: await getDirSize(appPath).catch(() => 0),
                                isSystemApp,
                            });
                        } catch (e) {
                            // Skip errors
                        }
                    }
                }
            } else if (platform === 'win32') {
                try {
                    const script = `
                        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                        Where-Object { $_.DisplayName } | 
                        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize | 
                        ConvertTo-Json -Depth 3
                    `;
                    const { stdout } = await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
                    const data = JSON.parse(stdout);
                    const list = Array.isArray(data) ? data : [data];

                    for (const item of list) {
                        if (item.DisplayName) {
                            const publisher = item.Publisher || '';
                            const installLocation = item.InstallLocation || '';
                            const isSystemApp = publisher.includes('Microsoft') ||
                                publisher.includes('Windows') ||
                                installLocation.includes('Windows\\') ||
                                installLocation.includes('Program Files\\Windows');

                            apps.push({
                                id: `win-${item.DisplayName}-${item.InstallDate || 'unknown'}`,
                                name: item.DisplayName,
                                version: item.DisplayVersion || undefined,
                                publisher: publisher || undefined,
                                installDate: item.InstallDate ? formatWindowsDate(item.InstallDate) : undefined,
                                installLocation: installLocation || undefined,
                                size: item.EstimatedSize ? item.EstimatedSize * 1024 : undefined, // KB to bytes
                                isSystemApp,
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error fetching Windows apps:', e);
                }
            }

            return apps;
        } catch (error) {
            console.error('Error fetching installed apps:', error);
            return [];
        }
    });

    ipcMain.handle('app-manager:get-running-processes', async () => {
        try {
            const processes = await si.processes();
            const memInfo = await si.mem();

            return processes.list.map((proc: any) => ({
                pid: proc.pid,
                name: proc.name,
                cpu: proc.cpu || 0,
                memory: proc.mem || 0,
                memoryPercent: memInfo.total > 0 ? ((proc.mem || 0) / memInfo.total) * 100 : 0,
                started: proc.started || '',
                user: proc.user || undefined,
                command: proc.command || undefined,
                path: proc.path || undefined,
            }));
        } catch (error) {
            console.error('Error fetching running processes:', error);
            return [];
        }
    });

    ipcMain.handle('app-manager:uninstall-app', async (_event, app: any) => {
        try {
            const platform = process.platform;
            if (platform === 'darwin') {
                if (app.installLocation) {
                    await fs.rm(app.installLocation, { recursive: true, force: true });
                    return { success: true };
                }
            } else if (platform === 'win32') {
                try {
                    const script = `
                        $app = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                               Where-Object { $_.DisplayName -eq "${app.name.replace(/"/g, '\\"')}" } | 
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
                    `;
                    await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
                    return { success: true };
                } catch (e) {
                    return { success: false, error: (e as Error).message };
                }
            }
            return { success: false, error: 'Unsupported platform' };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('app-manager:kill-process', async (_event, pid: number) => {
        try {
            process.kill(pid, 'SIGTERM');
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });
}

// ========== Helpers ==========

async function checkBluetoothEnabled() {
    // Placeholder - implement platform specific check if needed
    // In main.ts this might have been a stub or imported
    return true;
}

function getTimezoneOffset(timeZone: string): string {
    const now = new Date();
    const tzString = now.toLocaleString('en-US', { timeZone });
    const localString = now.toLocaleString('en-US');
    const diff = (new Date(tzString).getTime() - new Date(localString).getTime()) / 60000;
    const hours = Math.floor(diff / 60);
    const minutes = Math.abs(diff % 60);
    return `GMT${hours >= 0 ? '+' : ''}${hours}:${minutes.toString().padStart(2, '0')}`;
}

export async function getDirSize(dirPath: string): Promise<number> {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        let size = 0;
        for (const file of files) {
            const filePath = join(dirPath, file.name);
            if (file.isDirectory()) {
                size += await getDirSize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                size += stats.size;
            }
        }
        return size;
    } catch {
        return 0;
    }
}

function formatWindowsDate(dateString: string): string {
    // Basic formatting for Windows registry date, e.g. "20230520"
    if (!dateString || dateString.length !== 8) return dateString;
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

// Permission Helpers
async function checkAccessibilityPermission() {
    if (process.platform !== 'darwin') return { status: 'not-applicable' };
    try {
        try {
            const testShortcut = 'CommandOrControl+Shift+TestPermission';
            const registered = globalShortcut.register(testShortcut, () => { });
            if (registered) {
                globalShortcut.unregister(testShortcut);
                return { status: 'granted' };
            }
        } catch (e) {
            // ignore
        }
        const existingShortcuts = globalShortcut.isRegistered('CommandOrControl+Shift+D');
        if (existingShortcuts) return { status: 'granted' };
        return { status: 'not-determined', message: 'Unable to determine status. Try testing.' };
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function checkFullDiskAccessPermission() {
    if (process.platform !== 'darwin') return { status: 'not-applicable' };
    try {
        const protectedPaths = ['/Library/Application Support', '/System/Library', '/private/var/db'];
        for (const testPath of protectedPaths) {
            try {
                await fs.access(testPath);
                return { status: 'granted' };
            } catch (e) { }
        }
        const homeDir = os.homedir();
        try {
            await fs.readdir(homeDir);
            return { status: 'granted', message: 'Basic file access available' };
        } catch (e) {
            return { status: 'denied', message: 'Cannot access protected directories' };
        }
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function checkScreenRecordingPermission() {
    if (process.platform !== 'darwin') return { status: 'not-applicable' };
    try {
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen'] });
            if (sources && sources.length > 0) return { status: 'granted' };
        } catch (e) { }
        return { status: 'not-determined', message: 'Unable to determine. Try testing screenshot feature.' };
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function checkClipboardPermission() {
    try {
        const originalText = clipboard.readText();
        clipboard.writeText('__PERMISSION_TEST__');
        const written = clipboard.readText();
        clipboard.writeText(originalText);
        if (written === '__PERMISSION_TEST__') return { status: 'granted' };
        return { status: 'denied', message: 'Clipboard access failed' };
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function checkLaunchAtLoginPermission() {
    try {
        const loginItemSettings = app.getLoginItemSettings();
        return {
            status: loginItemSettings.openAtLogin ? 'granted' : 'not-determined',
            message: loginItemSettings.openAtLogin ? 'Launch at login is enabled' : 'Launch at login is not enabled'
        };
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function checkFileAccessPermission() {
    if (process.platform !== 'win32') return { status: 'not-applicable' };
    try {
        const testPath = join(os.tmpdir(), `permission-test-${Date.now()}.txt`);
        const testContent = 'permission test';
        await fs.writeFile(testPath, testContent);
        const readContent = await fs.readFile(testPath, 'utf-8');
        await fs.unlink(testPath);
        if (readContent === testContent) return { status: 'granted' };
        return { status: 'denied', message: 'File access test failed' };
    } catch (error) {
        return { status: 'denied', message: (error as Error).message };
    }
}

async function checkRegistryAccessPermission() {
    if (process.platform !== 'win32') return { status: 'not-applicable' };
    try {
        const { stdout } = await execAsync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion" /v ProgramFilesDir 2>&1');
        if (stdout && !stdout.includes('ERROR')) return { status: 'granted' };
        return { status: 'denied', message: 'Registry access test failed' };
    } catch (error) {
        return { status: 'denied', message: (error as Error).message };
    }
}

async function testClipboardPermission() {
    try {
        const originalText = clipboard.readText();
        const testText = `Permission test ${Date.now()}`;
        clipboard.writeText(testText);
        const readText = clipboard.readText();
        clipboard.writeText(originalText);
        if (readText === testText) return { status: 'granted', message: 'Clipboard read/write test passed' };
        return { status: 'denied', message: 'Clipboard test failed' };
    } catch (error) {
        return { status: 'error', message: (error as Error).message };
    }
}

async function testFileAccessPermission() {
    try {
        const testDir = os.tmpdir();
        const testPath = join(testDir, `permission-test-${Date.now()}.txt`);
        const testContent = `Test ${Date.now()}`;
        await fs.writeFile(testPath, testContent);
        const readContent = await fs.readFile(testPath, 'utf-8');
        await fs.unlink(testPath);
        if (readContent === testContent) return { status: 'granted', message: 'File access test passed' };
        return { status: 'denied', message: 'File access test failed' };
    } catch (error) {
        return { status: 'denied', message: (error as Error).message };
    }
}

async function openSystemPreferences(permissionType?: string) {
    const platform = process.platform;
    try {
        if (platform === 'darwin') {
            let command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy"';
            if (permissionType === 'accessibility') {
                command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"';
            } else if (permissionType === 'full-disk-access') {
                command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"';
            } else if (permissionType === 'screen-recording') {
                command = 'open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"';
            }
            await execAsync(command);
            return { success: true, message: 'Opened System Preferences' };
        } else if (platform === 'win32') {
            await execAsync('start ms-settings:privacy');
            return { success: true, message: 'Opened Windows Settings' };
        }
        return { success: false, message: 'Unsupported platform' };
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}
