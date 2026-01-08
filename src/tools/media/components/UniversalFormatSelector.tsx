import React from 'react';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Download, Music, Video, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';

interface UniversalFormatSelectorProps {
    format: 'video' | 'audio';
    onFormatChange: (f: 'video' | 'audio') => void;
    quality: 'best' | 'medium' | 'low';
    onQualityChange: (q: 'best' | 'medium' | 'low') => void;
    downloadPath: string;
    onDownload: () => void;
    onChooseFolder: () => void;
    loading?: boolean;
}

export const UniversalFormatSelector: React.FC<UniversalFormatSelectorProps> = ({
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
            {/* Format Selection */}
            <div>
                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2 block">Format</label>
                <div className="bg-background/30 p-1 rounded-lg border border-white/5 flex gap-1">
                    <button
                        onClick={() => onFormatChange('video')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                            format === 'video' 
                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Video className="w-4 h-4" />
                        Video
                    </button>
                    <button
                        onClick={() => onFormatChange('audio')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                            format === 'audio' 
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Music className="w-4 h-4" />
                        Audio
                    </button>
                </div>
            </div>

            {/* Quality Selection */}
            {format === 'video' && (
                <div className="space-y-2">
                    <Select
                        label="Quality Preference"
                        value={quality}
                        onChange={(e) => onQualityChange(e.target.value as any)}
                        options={[
                            { value: 'best', label: 'Best Available (Max)' },
                            { value: 'medium', label: 'Medium (720p/Standard)' },
                            { value: 'low', label: 'Data Saver (Lowest)' }
                        ]}
                        fullWidth
                    />
                     <p className="text-[10px] text-foreground-tertiary">
                        *Actual quality depends on source availability
                    </p>
                </div>
            )}

            {/* Download Button zone */}
            <div className="pt-2 space-y-3">
                 <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <FolderOpen className="w-4 h-4 text-foreground-muted" />
                        </div>
                        <input 
                            type="text" 
                            value={downloadPath || 'Downloads'}
                            readOnly
                            className="w-full bg-background/30 border border-border-glass rounded-lg py-2.5 pl-10 pr-3 text-xs text-foreground-secondary cursor-default focus:outline-none"
                            placeholder="Default downloads folder"
                        />
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={onChooseFolder}
                        className="shrink-0"
                        title="Choose Folder"
                    >
                        Change
                    </Button>
                </div>

                <Button 
                    variant="primary" 
                    onClick={onDownload} 
                    disabled={loading} 
                    className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" />
                            Download Now
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
