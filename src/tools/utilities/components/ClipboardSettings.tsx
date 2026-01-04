import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useClipboardStore } from '../../../store/clipboardStore';

interface ClipboardSettingsProps {
    onClose: () => void;
}

export const ClipboardSettings: React.FC<ClipboardSettingsProps> = ({ onClose }) => {
    const settings = useClipboardStore((state) => state.settings);
    const maxItems = useClipboardStore((state) => state.maxItems);
    const updateSettings = useClipboardStore((state) => state.updateSettings);
    const setMaxItems = useClipboardStore((state) => state.setMaxItems);

    const [localSettings, setLocalSettings] = useState({
        ...settings,
        ignoredApps: settings.ignoredApps || [],
        clearOnQuit: settings.clearOnQuit ?? false,
    });
    const [localMaxItems, setLocalMaxItems] = useState(maxItems);

    const handleSave = () => {
        updateSettings(localSettings);
        setMaxItems(localMaxItems);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        Clipboard Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Max Items */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Maximum History Items
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg 
                                     text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 
                                     focus:border-accent transition-all"
                            value={localMaxItems}
                            onChange={(e) => setLocalMaxItems(Number(e.target.value))}
                        >
                            <option value={50}>50 items</option>
                            <option value={100}>100 items</option>
                            <option value={200}>200 items</option>
                            <option value={500}>500 items</option>
                            <option value={1000}>1000 items (Unlimited)</option>
                        </select>
                        <p className="text-xs text-foreground-muted">
                            Older items will be automatically removed when this limit is reached
                        </p>
                    </div>

                    {/* Auto Clear Days */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Auto-clear items older than
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg 
                                     text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 
                                     focus:border-accent transition-all"
                            value={localSettings.autoClearDays}
                            onChange={(e) => setLocalSettings({ ...localSettings, autoClearDays: Number(e.target.value) })}
                        >
                            <option value={0}>Never</option>
                            <option value={1}>1 day</option>
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={90}>90 days</option>
                        </select>
                        <p className="text-xs text-foreground-muted">
                            Automatically remove items older than the selected period
                        </p>
                    </div>

                    {/* Exclude Duplicates */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                                checked={localSettings.excludeDuplicates}
                                onChange={(e) => setLocalSettings({ ...localSettings, excludeDuplicates: e.target.checked })}
                            />
                            <div>
                                <div className="text-sm font-medium text-foreground">
                                    Exclude Duplicates
                                </div>
                                <p className="text-xs text-foreground-muted">
                                    Don't save if the content is the same as the last item
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Enable Monitoring */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                                checked={localSettings.enableMonitoring}
                                onChange={(e) => setLocalSettings({ ...localSettings, enableMonitoring: e.target.checked })}
                            />
                            <div>
                                <div className="text-sm font-medium text-foreground">
                                    Enable Clipboard Monitoring
                                </div>
                                <p className="text-xs text-foreground-muted">
                                    Automatically detect and save clipboard changes (requires permission)
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Clear on Quit */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                                checked={localSettings.clearOnQuit}
                                onChange={(e) => setLocalSettings({ ...localSettings, clearOnQuit: e.target.checked })}
                            />
                            <div>
                                <div className="text-sm font-medium text-foreground">
                                    Clear Clipboard on Quit
                                </div>
                                <p className="text-xs text-foreground-muted">
                                    Automatically clear system clipboard when app quits (security feature)
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Ignored Apps */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Ignored Apps
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg 
                                         text-foreground text-sm focus:outline-none focus:ring-2 
                                         focus:ring-accent/50 focus:border-accent transition-all"
                                placeholder="Enter app name (e.g., Safari, Google Sheets)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        const appName = e.currentTarget.value.trim();
                                        if (!localSettings.ignoredApps.includes(appName)) {
                                            setLocalSettings({
                                                ...localSettings,
                                                ignoredApps: [...localSettings.ignoredApps, appName],
                                            });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <p className="text-xs text-foreground-muted">
                                Press Enter to add. Apps in this list will not trigger clipboard saves.
                            </p>
                            {localSettings.ignoredApps.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {localSettings.ignoredApps.map((app, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-foreground"
                                        >
                                            {app}
                                            <button
                                                onClick={() => {
                                                    setLocalSettings({
                                                        ...localSettings,
                                                        ignoredApps: localSettings.ignoredApps.filter((_, i) => i !== index),
                                                    });
                                                }}
                                                className="text-foreground-muted hover:text-foreground"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Settings
                    </Button>
                </div>
            </div>
        </div>
    );
};
