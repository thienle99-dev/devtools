import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock Electron BEFORE importing anything that uses it
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/user/data'),
        getAppPath: vi.fn().mockReturnValue('/mock/app/path'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
    }
}));

// 2. Mock other dependencies
vi.mock('electron-store', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            get: vi.fn(),
            set: vi.fn(),
        }))
    };
});

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
    }
}));

vi.mock('fs/promises', () => ({
    default: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        unlink: vi.fn(),
        rm: vi.fn(),
        access: vi.fn(),
    }
}));

vi.mock('adm-zip', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            extractAllTo: vi.fn(),
            addFile: vi.fn(),
            writeZip: vi.fn(),
        }))
    };
});

// 3. Now import the class
import { PluginManager } from './plugin-manager';

describe('PluginManager', () => {
    let pm: PluginManager;

    beforeEach(() => {
        vi.clearAllMocks();
        pm = new PluginManager();
    });

    it('should initialize and fetch registry', async () => {
        // Mock store.get for updateRegistry check
        const storeMock = (pm as any).store;
        storeMock.get.mockReturnValue(0); // lastRegistryUpdate

        const axios = (await import('axios')).default;
        (axios.get as any).mockResolvedValue({
            data: {
                version: '1.0.0',
                lastUpdated: Date.now(),
                plugins: [
                    { id: 'p1', name: 'Plugin 1', version: '1.0.0', downloadUrl: '...', checksum: '...' }
                ]
            }
        });

        await pm.initialize();
        
        expect(axios.get).toHaveBeenCalled();
        expect(storeMock.set).toHaveBeenCalledWith('registry', expect.anything());
    });

    it('should check compatibility correctly', () => {
        const manifest: any = {
            id: 'test',
            platforms: ['win32', 'darwin', 'linux'],
            minAppVersion: '0.9.0'
        };

        // Should not throw
        expect(() => (pm as any).checkCompatibility(manifest)).not.toThrow();

        const incompatibleManifest: any = {
            id: 'test',
            platforms: ['linux'],
            minAppVersion: '2.0.0'
        };

        // Note: process.platform depends on test runner env, but we can mock it or just check version
        expect(() => (pm as any).checkCompatibility(incompatibleManifest)).toThrow();
    });
});
