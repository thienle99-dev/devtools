import { create } from 'zustand';

export type PermissionStatus = 'granted' | 'denied' | 'not-determined' | 'not-applicable' | 'error' | 'loading';

export interface PermissionInfo {
    status: PermissionStatus;
    message?: string;
    lastChecked?: number;
}

interface PermissionsStore {
    permissions: {
        // macOS
        accessibility?: PermissionInfo;
        fullDiskAccess?: PermissionInfo;
        screenRecording?: PermissionInfo;
        // Windows
        fileAccess?: PermissionInfo;
        registryAccess?: PermissionInfo;
        // Common
        clipboard?: PermissionInfo;
        launchAtLogin?: PermissionInfo;
    };
    
    // Actions
    setPermission: (key: string, info: PermissionInfo) => void;
    setPermissions: (permissions: Record<string, PermissionInfo>) => void;
    checkAllPermissions: () => Promise<void>;
    checkPermission: (key: string) => Promise<void>;
    testPermission: (key: string) => Promise<void>;
    openSystemPreferences: (permissionType?: string) => Promise<void>;
    isLoading: boolean;
}

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
    permissions: {},
    isLoading: false,

    setPermission: (key, info) => set((state) => ({
        permissions: {
            ...state.permissions,
            [key]: {
                ...info,
                lastChecked: Date.now(),
            },
        },
    })),

    setPermissions: (permissions) => set((state) => {
        const now = Date.now();
        const updated: Record<string, PermissionInfo> = {};
        
        for (const [key, info] of Object.entries(permissions)) {
            updated[key] = {
                ...info,
                lastChecked: now,
            };
        }

        return {
            permissions: {
                ...state.permissions,
                ...updated,
            },
        };
    }),

    checkAllPermissions: async () => {
        set({ isLoading: true });
        try {
            if ((window as any).permissionsAPI?.checkAll) {
                const results = await (window as any).permissionsAPI.checkAll();
                get().setPermissions(results);
            }
        } catch (error) {
            console.error('Failed to check permissions:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    checkPermission: async (key: string) => {
        set((state) => ({
            permissions: {
                ...state.permissions,
                [key]: { status: 'loading' },
            },
        }));

        try {
            let result: PermissionInfo;
            
            if ((window as any).permissionsAPI) {
                const api = (window as any).permissionsAPI;
                
                switch (key) {
                    case 'accessibility':
                        result = await api.checkAccessibility();
                        break;
                    case 'fullDiskAccess':
                        result = await api.checkFullDiskAccess();
                        break;
                    case 'screenRecording':
                        result = await api.checkScreenRecording();
                        break;
                    case 'clipboard':
                        result = await api.testClipboard();
                        break;
                    case 'fileAccess':
                        result = await api.testFileAccess();
                        break;
                    default:
                        result = { status: 'error', message: 'Unknown permission' };
                }
            } else {
                result = { status: 'error', message: 'Permissions API not available' };
            }

            get().setPermission(key, result);
        } catch (error) {
            get().setPermission(key, {
                status: 'error',
                message: (error as Error).message,
            });
        }
    },

    testPermission: async (key: string) => {
        set((state) => ({
            permissions: {
                ...state.permissions,
                [key]: { ...state.permissions[key as keyof typeof state.permissions], status: 'loading' },
            },
        }));

        try {
            let result: PermissionInfo;
            
            if ((window as any).permissionsAPI) {
                const api = (window as any).permissionsAPI;
                
                switch (key) {
                    case 'clipboard':
                        result = await api.testClipboard();
                        break;
                    case 'fileAccess':
                        result = await api.testFileAccess();
                        break;
                    default:
                        // For other permissions, just check status
                        await get().checkPermission(key);
                        return;
                }
            } else {
                result = { status: 'error', message: 'Permissions API not available' };
            }

            get().setPermission(key, result);
        } catch (error) {
            get().setPermission(key, {
                status: 'error',
                message: (error as Error).message,
            });
        }
    },

    openSystemPreferences: async (permissionType?: string) => {
        try {
            if ((window as any).permissionsAPI?.openSystemPreferences) {
                const result = await (window as any).permissionsAPI.openSystemPreferences(permissionType);
                if (result.success) {
                    // Refresh permissions after a delay to allow user to grant them
                    setTimeout(() => {
                        get().checkAllPermissions();
                    }, 2000);
                }
                return result;
            }
        } catch (error) {
            console.error('Failed to open system preferences:', error);
        }
    },
}));

