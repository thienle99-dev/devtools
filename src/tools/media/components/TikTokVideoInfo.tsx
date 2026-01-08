import React from 'react';
import { Card } from '@components/ui/Card';
import { Play, Heart, MessageCircle, Share2, Music, Calendar } from 'lucide-react';
import { formatCount, formatDuration } from '../utils/tiktok-helpers';
import type { TikTokVideoInfo as TikTokVideoInfoType } from '@/types/tiktok';

interface TikTokVideoInfoProps {
    info: TikTokVideoInfoType;
}

export const TikTokVideoInfo: React.FC<TikTokVideoInfoProps> = ({ info }) => {
    return (
        <Card className="p-4 bg-background/40 border-border-glass backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Thumbnail */}
                <div className="relative group rounded-lg overflow-hidden md:w-48 flex-shrink-0 aspect-[9/16] bg-black/20">
                    <img 
                        src={info.thumbnailUrl} 
                        alt={info.title} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                        <Play className="nav-icon text-white drop-shadow-lg w-8 h-8 opacity-80 group-hover:opacity-100" fill="currentColor" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                        {formatDuration(info.duration)}
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <h3 className="font-bold text-lg line-clamp-2" title={info.title}>{info.title}</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <span className="font-medium text-foreground">@{info.authorUsername}</span>
                        {info.author && <span className="text-xs opacity-70">({info.author})</span>}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-2">
                        {info.viewCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary" title="Views">
                                <Play className="w-3.5 h-3.5" />
                                <span>{formatCount(info.viewCount)}</span>
                            </div>
                        )}
                        {info.likeCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary" title="Likes">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{formatCount(info.likeCount)}</span>
                            </div>
                        )}
                        {info.commentCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary" title="Comments">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{formatCount(info.commentCount)}</span>
                            </div>
                        )}
                        {info.shareCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary" title="Shares">
                                <Share2 className="w-3.5 h-3.5" />
                                <span>{formatCount(info.shareCount)}</span>
                            </div>
                        )}
                    </div>

                    {/* Music */}
                    {info.musicTitle && (
                        <div className="flex items-center gap-1.5 text-xs text-pink-400 mt-1">
                            <Music className="w-3.5 h-3.5 animate-pulse" />
                            <span className="truncate">{info.musicTitle} {info.musicAuthor ? `- ${info.musicAuthor}` : ''}</span>
                        </div>
                    )}

                    {/* Date */}
                    {info.uploadDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted mt-auto pt-2">
                            <Calendar className="w-3 h-3" />
                            <span>{info.uploadDate}</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
