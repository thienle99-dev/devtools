import React from 'react';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Download, Music, Video, RefreshCw, FolderOpen } from 'lucide-react';
import { cn } from '@utils/cn';

interface TikTokFormatSelectorProps {
    format: 'video' | 'audio';
    onFormatChange: (format: 'video' | 'audio') => void;
    quality: 'best' | 'medium' | 'low';
    onQualityChange: (quality: 'best' | 'medium' | 'low') => void;
    removeWatermark: boolean; // Keep for future use or display
    downloadPath?: string;
    onDownload: () => void;
    onChooseFolder?: () => void;
    loading?: boolean;
}

export const TikTokFormatSelector: React.FC<TikTokFormatSelectorProps> = ({
    format,
    onFormatChange,
    quality,
    onQualityChange,
    downloadPath,
    onDownload,
    onChooseFolder,
    loading
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-bg-glass rounded-xl p-1 p-y-2 border border-border-glass flex gap-1">
                <button
                    onClick={() => onFormatChange('video')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        format === 'video'
                            ? "bg-primary/20 text-primary shadow-sm"
                            : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                    )}
                >
                    <Video className="w-4 h-4" />
                    Video
                </button>
                <button
                    onClick={() => onFormatChange('audio')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                        format === 'audio'
                            ? "bg-pink-500/20 text-pink-500 shadow-sm"
                            : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                    )}
                >
                    <Music className="w-4 h-4" />
                    Audio
                </button>
            </div>

            <div className="space-y-4">
                {format === 'video' && (
                    <Select
                        label="Quality"
                        value={quality}
                        onChange={(e) => onQualityChange(e.target.value as any)}
                        options={[
                            { label: 'Best Available', value: 'best' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'Low (Data Saver)', value: 'low' },
                        ]}
                        fullWidth
                    />
                )}

                <div className="border-t border-border-glass pt-4 mt-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 mb-2 block">Download Location</label>
                    <div className="flex gap-2">
                         <div className="flex-1 px-3 py-2 bg-input-bg border border-input-border rounded-lg text-xs font-mono text-foreground-secondary truncate flex items-center" title={downloadPath}>
                            {downloadPath || 'Downloads Folder'}
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={onChooseFolder}
                            className="shrink-0"
                            title="Choose Folder"
                        >
                            <FolderOpen className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <Button
                    variant="primary"
                    onClick={onDownload}
                    disabled={loading}
                    className={cn(
                        "w-full h-12 text-base font-bold shadow-lg shadow-primary/10 transition-all",
                        loading ? "opacity-80" : "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" />
                            Download {format === 'video' ? 'Video' : 'Audio'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
