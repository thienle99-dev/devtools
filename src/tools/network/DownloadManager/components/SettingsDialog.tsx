import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { X, Save, Settings } from 'lucide-react';
import type { DownloadSettings } from '@/types/network/download';

interface DownloadSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: DownloadSettings;
    onSave: (settings: Partial<DownloadSettings>) => void;
}

export const DownloadSettingsDialog: React.FC<DownloadSettingsDialogProps> = ({
    isOpen,
    onClose,
    settings,
    onSave
}) => {
    const [localSettings, setLocalSettings] = useState<DownloadSettings>(settings);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-glass-panel border border-border-glass rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-foreground-tertiary hover:text-foreground-primary"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    Download Settings
                </h2>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Max Concurrent Downloads</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={localSettings.maxConcurrentDownloads || 3}
                                onChange={e => setLocalSettings({ ...localSettings, maxConcurrentDownloads: parseInt(e.target.value) })}
                                className="w-20 bg-background-depth-1 border border-border-glass rounded-lg px-3 py-1.5 text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Download Path</label>
                            <div className="text-xs text-foreground-tertiary truncate max-w-[200px]">
                                {localSettings.downloadPath}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="monitorClipboard"
                                checked={localSettings.monitorClipboard}
                                onChange={e => setLocalSettings({ ...localSettings, monitorClipboard: e.target.checked })}
                                className="rounded border-border-glass bg-background-depth-1 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="monitorClipboard" className="text-sm font-medium">Monitor Clipboard for URLs</label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="enableSounds"
                                checked={localSettings.enableSounds}
                                onChange={e => setLocalSettings({ ...localSettings, enableSounds: e.target.checked })}
                                className="rounded border-border-glass bg-background-depth-1 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="enableSounds" className="text-sm font-medium">Enable Sound Effects</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border-glass">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
