import React from 'react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Download, Music, Video, FolderOpen, MonitorPlay, Smartphone, Tv, Box } from 'lucide-react';
import { cn } from '@utils/cn';

interface UniversalFormatSelectorProps {
    format: 'video' | 'audio';
    onFormatChange: (f: 'video' | 'audio') => void;
    downloadPath: string;
    onDownload: (quality: string) => void;
    onChooseFolder: () => void;
    availableQualities?: string[];
    duration?: number;
}

export const UniversalFormatSelector: React.FC<UniversalFormatSelectorProps> = ({
    format,
    onFormatChange,
    downloadPath,
    onDownload,
    onChooseFolder,
    availableQualities,
    duration
}) => {
    // Get recommended quality based on network speed (simplified)
    const getRecommendedQuality = (): string => {
        if (format === 'audio') return '0';

        const qualities = availableQualities || ['1080p', '720p', '480p'];
        // Prefer 1080p if available, otherwise 720p, otherwise first
        if (qualities.includes('1080p')) return '1080p';
        if (qualities.includes('720p')) return '720p';
        return qualities[0] || '720p';
    };

    // Estimate file size
    const estimateSize = (q: string): string => {
        if (!duration) return 'Unknown';

        let sizeEst = 0;
        const lengthMB = duration / 60;

        if (format === 'video') {
            const bitrateMap: Record<string, number> = {
                '4320p': 150, '2160p': 60, '1440p': 30,
                '1080p': 15, '720p': 7.5, '480p': 4,
                '360p': 2.5, '240p': 1.5, '144p': 1
            };
            sizeEst = lengthMB * (bitrateMap[q] || 5);
        } else {
            const bitrateMapApi: Record<string, number> = {
                '0': 2.5, // 320k
                '5': 1.5, // 192k
                '9': 1.0  // 128k
            };
            sizeEst = lengthMB * (bitrateMapApi[q] || 1);
        }

        return sizeEst < 1024
            ? `${sizeEst.toFixed(0)} MB`
            : `${(sizeEst / 1024).toFixed(1)} GB`;
    };

    const getQualityIcon = (q: string) => {
        if (q.includes('4320') || q.includes('2160')) return <Tv className="w-5 h-5" />;
        if (q.includes('1440') || q.includes('1080')) return <MonitorPlay className="w-5 h-5" />;
        return <Smartphone className="w-5 h-5" />;
    };

    const getQualityLabel = (q: string) => {
        const labels: Record<string, string> = {
            '4320p': '8K Ultra HD',
            '2160p': '4K Ultra HD',
            '1440p': '2K QHD',
            '1080p': 'Full HD',
            '720p': 'High Definition',
            '480p': 'Standard Definition',
            '360p': 'Low Quality',
            '240p': 'Very Low Quality',
            '144p': 'Data Saver'
        };
        return labels[q] || 'Video';
    };

    const videoQualities = availableQualities || ['1080p', '720p', '480p'];
    const audioQualities = [
        { id: '0', label: 'Best Quality', detail: '320kbps' },
        { id: '5', label: 'High Quality', detail: '192kbps' },
        { id: '9', label: 'Standard', detail: '128kbps' }
    ];

    const recommendedQuality = getRecommendedQuality();

    return (
        <div className="space-y-4">
            {/* Format Tabs */}
            <div className="bg-background/30 p-1.5 rounded-2xl border border-border-glass flex gap-1">
                <button
                    onClick={() => onFormatChange('video')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                        format === 'video'
                            ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                            : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                    )}
                >
                    <Video className="w-4 h-4" />
                    Video
                </button>
                <button
                    onClick={() => onFormatChange('audio')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                        format === 'audio'
                            ? "bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-500/20"
                            : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                    )}
                >
                    <Music className="w-4 h-4" />
                    Audio
                </button>
            </div>

            {/* Quality Selection Card */}
            <Card className="p-1 bg-glass-panel border-border-glass overflow-hidden shadow-sm">
                <div className="px-3 py-2 text-xs font-bold text-foreground-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border-glass bg-background/30">
                    <Box className="w-3.5 h-3.5 text-purple-400" />
                    Quality
                </div>

                <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {format === 'video' ? (
                        videoQualities.map((q: string) => {
                            const isRecommended = q === recommendedQuality;

                            return (
                                <div
                                    key={q}
                                    onClick={() => onDownload(q)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer",
                                        isRecommended
                                            ? "border-green-500/30 bg-green-500/5"
                                            : "border-transparent hover:bg-white/5 hover:border-white/5 bg-background/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            isRecommended
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-background-tertiary text-foreground-tertiary group-hover:bg-blue-500/10 group-hover:text-blue-400"
                                        )}>
                                            {getQualityIcon(q)}
                                        </div>
                                        <div className="text-left">
                                            <div className={cn(
                                                "text-sm font-bold flex items-center gap-2 transition-colors",
                                                isRecommended
                                                    ? "text-green-400"
                                                    : "text-foreground-primary group-hover:text-blue-400"
                                            )}>
                                                {q}
                                                {isRecommended && (
                                                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-bold uppercase rounded border border-green-500/30">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-foreground-secondary opacity-80">
                                                {getQualityLabel(q)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="text-xs font-mono font-medium text-foreground-secondary">
                                            ~{estimateSize(q)}
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded-lg transition-all shadow-sm",
                                            isRecommended
                                                ? "bg-green-500 text-white"
                                                : "bg-white/5 text-foreground-tertiary group-hover:bg-blue-500 group-hover:text-white"
                                        )}>
                                            <Download className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        audioQualities.map((opt) => {
                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => onDownload(opt.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer border-transparent hover:bg-white/5 hover:border-white/5 bg-background/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg transition-colors bg-background-tertiary text-foreground-tertiary group-hover:bg-pink-500/10 group-hover:text-pink-400">
                                            <Music className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold transition-colors text-foreground-primary group-hover:text-pink-400">
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-foreground-secondary opacity-80">
                                                {opt.detail}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="text-xs font-mono font-medium text-foreground-secondary">
                                            ~{estimateSize(opt.id)}
                                        </div>
                                        <div className="p-2 rounded-lg transition-all shadow-sm bg-white/5 text-foreground-tertiary group-hover:bg-pink-500 group-hover:text-white">
                                            <Download className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Download Path Selection */}
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
                    className="shrink-0 px-4"
                    title="Choose Folder"
                >
                    Change
                </Button>
            </div>
        </div>
    );
};
