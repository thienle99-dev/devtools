import React from 'react';
import { CheckSquare, Square, Play, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatDuration } from '../../../utils/format';

interface PlaylistViewProps {
    playlistInfo: {
        playlistId: string;
        title: string;
        videoCount: number;
        videos: Array<{
            id: string;
            title: string;
            duration: number;
            thumbnail: string;
            url: string;
        }>;
    };
    selectedVideos: Set<string>;
    onToggleVideo: (videoId: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDownloadSelected: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
    playlistInfo,
    selectedVideos,
    onToggleVideo,
    onSelectAll,
    onDeselectAll,
    onDownloadSelected,
}) => {
    const selectedCount = selectedVideos.size;
    const totalDuration = playlistInfo.videos
        .filter(v => selectedVideos.has(v.id))
        .reduce((sum, v) => sum + v.duration, 0);

    return (
        <Card className="p-6">
            {/* Playlist Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-foreground-primary flex items-center gap-2">
                            <Play className="w-5 h-5 text-red-400" />
                            {playlistInfo.title}
                        </h3>
                        <p className="text-sm text-foreground-secondary mt-1">
                            {playlistInfo.videoCount} videos in playlist
                        </p>
                    </div>
                </div>

                {/* Selection Controls */}
                <div className="flex items-center justify-between p-3 bg-background-secondary/50 rounded-lg border border-border-glass">
                    <div className="flex gap-2">
                        <Button
                            onClick={onSelectAll}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                            Select All
                        </Button>
                        <Button
                            onClick={onDeselectAll}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            <Square className="w-3.5 h-3.5 mr-1.5" />
                            Deselect All
                        </Button>
                    </div>
                    <div className="text-sm text-foreground-secondary">
                        <span className="font-medium text-blue-400">{selectedCount}</span>
                        <span className="mx-1">/</span>
                        <span>{playlistInfo.videoCount}</span>
                        <span className="mx-2">•</span>
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {formatDuration(totalDuration)}
                    </div>
                </div>
            </div>

            {/* Video List */}
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {playlistInfo.videos.map((video, index) => {
                    const isSelected = selectedVideos.has(video.id);
                    return (
                        <div
                            key={video.id}
                            onClick={() => onToggleVideo(video.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                    ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                                    : 'bg-background-secondary/30 border-border-glass hover:bg-background-secondary/50'
                            }`}
                        >
                            {/* Checkbox */}
                            <div className="flex-shrink-0">
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Square className="w-5 h-5 text-foreground-secondary" />
                                )}
                            </div>

                            {/* Index */}
                            <div className="flex-shrink-0 w-8 text-center">
                                <span className="text-sm font-mono text-foreground-secondary">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                                <img
                                    src={video.thumbnail || 'https://via.placeholder.com/120x68?text=No+Thumbnail'}
                                    alt={video.title}
                                    className="w-20 h-12 object-cover rounded border border-border-glass"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x68?text=No+Thumbnail';
                                    }}
                                />
                            </div>

                            {/* Video Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground-primary truncate">
                                    {video.title}
                                </h4>
                                <p className="text-xs text-foreground-secondary mt-0.5">
                                    {formatDuration(video.duration)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-6 border-t border-border-glass">
                <Button
                    onClick={onDownloadSelected}
                    disabled={selectedCount === 0}
                    className="w-full"
                    size="lg"
                >
                    <Play className="w-4 h-4 mr-2" />
                    Download {selectedCount} Selected Video{selectedCount !== 1 ? 's' : ''}
                </Button>
            </div>
        </Card>
    );
};
