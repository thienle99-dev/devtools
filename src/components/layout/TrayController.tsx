import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolStore } from '../../store/toolStore';
import { TOOLS } from '../../tools/registry';

export const TrayController = () => {
    const navigate = useNavigate();
    const history = useToolStore((state) => state.history);

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

    // Handle navigation from Tray
    useEffect(() => {
        const handleNavigate = (_event: any, toolId: string) => {
            const tool = TOOLS.find(t => t.id === toolId);
            if (tool) {
                navigate(tool.path);
            }
        };

        const removeListener = (window as any).ipcRenderer?.on('navigate-to', handleNavigate);

        return () => {
            if (removeListener) removeListener();
        };
    }, [navigate]);

    return null;
};
