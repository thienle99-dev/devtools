import { useClipboardStore } from '../store/clipboardStore';
import { useClipboardMonitor } from '../tools/utilities/hooks/useClipboardMonitor';

/**
 * Global clipboard monitor component
 * Monitors clipboard changes when the app is open, regardless of which tool is active
 */
export const GlobalClipboardMonitor: React.FC = () => {
    const settings = useClipboardStore((state) => state.settings);

    // Enable clipboard monitoring globally with ignored apps
    useClipboardMonitor(settings.enableMonitoring, settings.ignoredApps);

    return null; // This component doesn't render anything
};
