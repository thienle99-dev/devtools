/**
 * Hook to detect the current platform
 */
export const usePlatform = () => {
    const ipcRenderer = (window as any).ipcRenderer;
    const platform = ipcRenderer?.process?.platform || 'unknown';

    return {
        platform,
        isMac: platform === 'darwin',
        isWindows: platform === 'win32',
        isLinux: platform === 'linux',
    };
};
