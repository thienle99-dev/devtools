import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolStore } from '../../store/toolStore';
import { useClipboardStore } from '../../store/clipboardStore';
import { TOOLS } from '../../tools/registry';

export const TrayController = () => {
    const navigate = useNavigate();
    const history = useToolStore((state) => state.history);
    const clipboardItems = useClipboardStore((state) => state.items);
    const clearAll = useClipboardStore((state) => state.clearAll);

    // Sync history to Tray
    useEffect(() => {
        const recentTools = history
            .map(id => {
                const tool = TOOLS.find(t => t.id === id);
                return tool ? { id: tool.id, name: tool.name } : null;
            })
            .filter((t): t is { id: string; name: string } => t !== null)
            .slice(0, 5); // Limit to 5

        if ((window as any).ipcRenderer?.tray?.updateMenu) {
            (window as any).ipcRenderer.tray.updateMenu(recentTools);
        }
    }, [history]);

    // Sync clipboard items to Tray (9 items like Maccy)
    // Exclude images since tray can't display them
    useEffect(() => {
        const recentClipboard = clipboardItems
            .filter(item => item.type === 'text' || item.type === 'link') // Only text and links for tray (no images)
            .slice(0, 9) // Limit to 9 most recent (Maccy style)
            .map(item => ({
                id: item.id,
                content: item.content,
                timestamp: item.timestamp,
            }));

        if ((window as any).ipcRenderer?.tray?.updateClipboard) {
            (window as any).ipcRenderer.tray.updateClipboard(recentClipboard);
        }
    }, [clipboardItems]);

    // Handle navigation from Tray
    useEffect(() => {
        const handleNavigate = (_event: any, toolId: string) => {
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                navigate(tool.path);
            }
        };

        const handleOpenClipboardManager = () => {
            const tool = TOOLS.find(t => t.id === 'clipboard-manager');
            if (tool) {
                navigate(tool.path);
            }
        };

        const handleClearClipboard = () => {
            clearAll();
        };

        const removeNavigateListener = (window as any).ipcRenderer?.on('navigate-to', handleNavigate);
        const removeOpenClipboardListener = (window as any).ipcRenderer?.on('open-clipboard-manager', handleOpenClipboardManager);
        const removeClearListener = (window as any).ipcRenderer?.on('clipboard-clear-all', handleClearClipboard);

        return () => {
            if (removeNavigateListener) removeNavigateListener();
            if (removeOpenClipboardListener) removeOpenClipboardListener();
            if (removeClearListener) removeClearListener();
        };
    }, [navigate, clearAll]);

    return null;
};
