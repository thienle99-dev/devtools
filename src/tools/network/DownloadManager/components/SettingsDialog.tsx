import React, { useState } from 'react';
import { Folder, Zap, Layers, PlayCircle, Link } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
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
    onSave,
}) => {
    const [downloadPath, setDownloadPath] = useState(settings.downloadPath);
    const [maxConcurrent, setMaxConcurrent] = useState(settings.maxConcurrentDownloads);
    const [segments, setSegments] = useState(settings.segmentsPerDownload);
    const [autoStart, setAutoStart] = useState(settings.autoStart);
    const [monitorClipboard, setMonitorClipboard] = useState(settings.monitorClipboard);
    const [autoUnzip, setAutoUnzip] = useState(settings.autoUnzip);
    const [autoOpenFolder, setAutoOpenFolder] = useState(settings.autoOpenFolder);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            downloadPath,
            maxConcurrentDownloads: Number(maxConcurrent),
            segmentsPerDownload: Number(segments),
            autoStart,
            monitorClipboard,
            autoUnzip,
            autoOpenFolder
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Download Settings"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Download Path */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1">
                            Default Download Path
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="/Users/me/Downloads"
                                value={downloadPath}
                                onChange={(e) => setDownloadPath(e.target.value)}
                                icon={Folder}
                                fullWidth
                                className="h-11 bg-glass-input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Max Concurrent */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1">
                                Max Concurrent
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                value={maxConcurrent}
                                onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                                icon={Layers}
                                fullWidth
                                className="h-11 bg-glass-input"
                            />
                        </div>

                        {/* Segments */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1">
                                Segments per file
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="64"
                                value={segments}
                                onChange={(e) => setSegments(Number(e.target.value))}
                                icon={Zap}
                                fullWidth
                                className="h-11 bg-glass-input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-foreground-primary/5 rounded-xl border border-border-glass">
                            <input
                                type="checkbox"
                                id="autoStart"
                                checked={autoStart}
                                onChange={(e) => setAutoStart(e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass bg-bg-glass-panel text-blue-500 focus:ring-blue-500/20"
                            />
                            <label htmlFor="autoStart" className="text-[11px] font-black uppercase tracking-wider text-foreground-primary cursor-pointer flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-blue-400" />
                                Auto Start
                            </label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-foreground-primary/5 rounded-xl border border-border-glass">
                            <input
                                type="checkbox"
                                id="monitorClipboard"
                                checked={monitorClipboard}
                                onChange={(e) => setMonitorClipboard(e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass bg-bg-glass-panel text-blue-500 focus:ring-blue-500/20"
                            />
                            <label htmlFor="monitorClipboard" className="text-[11px] font-black uppercase tracking-wider text-foreground-primary cursor-pointer flex items-center gap-2">
                                <Link className="w-4 h-4 text-blue-400" />
                                Clipboard Monitor
                            </label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-foreground-primary/5 rounded-xl border border-border-glass">
                            <input
                                type="checkbox"
                                id="autoOpenFolder"
                                checked={autoOpenFolder}
                                onChange={(e) => setAutoOpenFolder(e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass bg-bg-glass-panel text-blue-500 focus:ring-blue-500/20"
                            />
                            <label htmlFor="autoOpenFolder" className="text-[11px] font-black uppercase tracking-wider text-foreground-primary cursor-pointer flex items-center gap-2">
                                <Folder className="w-4 h-4 text-emerald-400" />
                                Auto Open Folder
                            </label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-foreground-primary/5 rounded-xl border border-border-glass">
                            <input
                                type="checkbox"
                                id="autoUnzip"
                                checked={autoUnzip}
                                onChange={(e) => setAutoUnzip(e.target.checked)}
                                className="w-4 h-4 rounded border-border-glass bg-bg-glass-panel text-blue-500 focus:ring-blue-500/20"
                            />
                            <label htmlFor="autoUnzip" className="text-[11px] font-black uppercase tracking-wider text-foreground-primary cursor-pointer flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-400" />
                                Auto Unzip
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/5 pt-6">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
