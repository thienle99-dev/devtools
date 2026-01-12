import React from 'react';
import { PlayCircle, User, Clock, Eye, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { formatDuration, formatCompactNumber, formatDate } from '@utils/format';

interface VideoInfoProps {
    videoId: string;
    title: string;
    author: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    uploadDate?: string;
}

export const VideoInfo: React.FC<VideoInfoProps> = ({
    title,
    author,
    lengthSeconds,
    thumbnailUrl,
    viewCount,
    uploadDate,
}) => {



    return (
        <Card className="p-4 bg-gradient-to-br from-red-500/5 to-pink-500/5 border-red-500/20">
            <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-background-tertiary border border-border-glass">
                    {thumbnailUrl ? (
                        <>
                            <img
                                src={thumbnailUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
                                {formatDuration(lengthSeconds)}
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="w-8 h-8 text-foreground-muted" />
                        </div>
                    )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground-primary mb-2 line-clamp-2">
                        {title}
                    </h3>

                    <div className="space-y-1.5">
                        {/* Author */}
                        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{author}</span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{formatDuration(lengthSeconds)}</span>
                        </div>

                        {/* View Count */}
                        {viewCount !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{formatCompactNumber(viewCount)} views</span>
                            </div>
                        )}

                        {/* Upload Date */}
                        {uploadDate && (
                            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{formatDate(uploadDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

