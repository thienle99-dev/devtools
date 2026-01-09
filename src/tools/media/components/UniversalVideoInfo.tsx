import React from 'react';
import { Card } from '@components/ui/Card';
import { Calendar, Eye, ThumbsUp, User, ExternalLink, Play, HardDrive, Check } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { formatBytes } from '@utils/format';
import { cn } from '@utils/cn';
import type { UniversalMediaInfo } from '@/types/universal-media';
import { getPlatformName, getPlatformColor } from '../utils/platform-detector';

// Inline formatters if missing (safer)
const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatCount = (num?: number) => {
    if (num === undefined) return null;
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
};

const formatDate = (dateStr?: string) => {
    // YYYYMMDD
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    return `${d}/${m}/${y}`;
};

interface UniversalVideoInfoProps {
    info: UniversalMediaInfo;
    selectedItems?: Set<number>;
    onSelectItem?: (index: number) => void;
    onSelectAll?: (selected: boolean) => void;
}

export const UniversalVideoInfo: React.FC<UniversalVideoInfoProps> = ({
    info,
    selectedItems,
    onSelectItem,
    onSelectAll
}) => {
    const platformName = getPlatformName(info.platform);
    const platformColor = getPlatformColor(info.platform);
    const hasPlaylist = info.isPlaylist && info.playlistVideos && info.playlistVideos.length > 0;

    return (
        <Card className="p-4 bg-background/40 border-border-glass backdrop-blur-sm shadow-xl">
            <div className="flex flex-col md:flex-row gap-5">
                {/* Thumbnail */}
                <div className="relative group rounded-xl overflow-hidden md:w-64 flex-shrink-0 aspect-video bg-black/40 border border-white/10 shadow-lg">
                    {info.thumbnailUrl ? (
                        <img
                            src={info.thumbnailUrl}
                            alt={info.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-foreground-muted">
                            <Play className="w-12 h-12 opacity-50" />
                        </div>
                    )}

                    {/* Duration Badge */}
                    {info.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {formatDuration(info.duration)}
                        </div>
                    )}

                    {/* Live Badge */}
                    {info.isLive && (
                        <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded animate-pulse">
                            LIVE
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-3">
                        {/* Platform & Tag */}
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${platformColor} bg-white/5 px-2 py-0.5 rounded border border-white/5`}>
                                {platformName}
                            </span>
                            {info.uploadDate && (
                                <span className="text-xs text-foreground-muted flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(info.uploadDate)}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-lg md:text-xl leading-tight text-foreground-primary line-clamp-2" title={info.title}>
                            {info.title}
                        </h3>

                        {/* Author */}
                        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{info.author || 'Unknown Author'}</span>
                            {info.authorUrl && (
                                <a
                                    href={info.authorUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-foreground-muted hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                        {formatCount(info.viewCount) && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted" title={`${info.viewCount} views`}>
                                <Eye className="w-4 h-4" />
                                <span>{formatCount(info.viewCount)}</span>
                            </div>
                        )}
                        {formatCount(info.likeCount) && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted" title={`${info.likeCount} likes`}>
                                <ThumbsUp className="w-4 h-4" />
                                <span>{formatCount(info.likeCount)}</span>
                            </div>
                        )}
                        {info.size && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-muted" title={`Approximate size: ${formatBytes(info.size)}`}>
                                <HardDrive className="w-4 h-4" />
                                <span>{formatBytes(info.size)}</span>
                            </div>
                        )}
                        <a
                            href={info.webpageUrl || info.url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            Open Original <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Playlist Items */}
            {hasPlaylist && (
                <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground-primary">
                            Playlist Videos ({info.playlistVideos?.length})
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-foreground-tertiary mr-2">
                                {selectedItems?.size} selected
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] px-2"
                                onClick={() => onSelectAll?.(true)}
                            >
                                Select All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] px-2"
                                onClick={() => onSelectAll?.(false)}
                            >
                                Deselect All
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {info.playlistVideos?.map((video, idx) => {
                            const index = idx + 1;
                            const isSelected = selectedItems?.has(index);

                            return (
                                <div
                                    key={video.id + idx}
                                    onClick={() => onSelectItem?.(index)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer group",
                                        isSelected
                                            ? "bg-primary/10 border-primary/30"
                                            : "bg-white/5 border-transparent hover:border-white/10"
                                    )}
                                >
                                    <div className="flex-shrink-0">
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary border-primary" : "border-white/20 group-hover:border-white/40"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>

                                    <div className="w-12 aspect-video rounded bg-black/40 overflow-hidden flex-shrink-0 border border-white/5">
                                        {video.thumbnail && (
                                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs font-medium truncate",
                                            isSelected ? "text-foreground-primary" : "text-foreground-secondary"
                                        )}>
                                            <span className="opacity-50 mr-1.5 font-mono">{index}.</span>
                                            {video.title}
                                        </p>
                                        {video.duration && (
                                            <p className="text-[10px] text-foreground-muted font-mono">
                                                {formatDuration(video.duration)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100">
                                        <ExternalLink
                                            className="w-3 h-3 text-foreground-muted hover:text-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(video.url, '_blank');
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};
