import React, { useState } from 'react';
import { FileVideo, Music, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface VideoFormat {
    itag: number;
    quality: string;
    qualityLabel?: string;
    hasVideo: boolean;
    hasAudio: boolean;
    container: string;
    codecs?: string;
    bitrate?: number;
    audioBitrate?: number;
}

interface FormatsListProps {
    formats: VideoFormat[];
}

export const FormatsList: React.FC<FormatsListProps> = ({ formats }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Group formats by type
    const videoFormats = formats.filter(f => f.hasVideo && f.hasAudio);
    const videoOnlyFormats = formats.filter(f => f.hasVideo && !f.hasAudio);
    const audioOnlyFormats = formats.filter(f => !f.hasVideo && f.hasAudio);

    const formatBitrate = (bitrate?: number) => {
        if (!bitrate) return 'N/A';
        if (bitrate > 1000000) return `${(bitrate / 1000000).toFixed(1)} Mbps`;
        return `${(bitrate / 1000).toFixed(0)} kbps`;
    };

    return (
        <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
            <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-foreground-primary">
                        Available Formats
                    </h3>
                    <span className="text-xs text-foreground-secondary">
                        ({formats.length} formats)
                    </span>
                </div>
                {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-foreground-secondary" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-foreground-secondary" />
                )}
            </div>

            {showDetails && (
                <div className="mt-4 space-y-3">
                    {/* Video + Audio Formats */}
                    {videoFormats.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileVideo className="w-3.5 h-3.5 text-green-400" />
                                <h4 className="text-xs font-semibold text-green-400">
                                    Video + Audio ({videoFormats.length})
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {videoFormats.slice(0, 5).map((format) => (
                                    <div 
                                        key={format.itag}
                                        className="flex items-center justify-between p-2 rounded bg-glass-panel border border-border-glass text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground-primary">
                                                {format.qualityLabel || format.quality}
                                            </span>
                                            <span className="text-foreground-secondary">
                                                {format.container}
                                            </span>
                                        </div>
                                        <span className="text-foreground-secondary">
                                            {formatBitrate(format.bitrate)}
                                        </span>
                                    </div>
                                ))}
                                {videoFormats.length > 5 && (
                                    <p className="text-xs text-foreground-secondary text-center">
                                        +{videoFormats.length - 5} more formats
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Video Only Formats */}
                    {videoOnlyFormats.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileVideo className="w-3.5 h-3.5 text-blue-400" />
                                <h4 className="text-xs font-semibold text-blue-400">
                                    Video Only ({videoOnlyFormats.length})
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {videoOnlyFormats.slice(0, 3).map((format) => (
                                    <div 
                                        key={format.itag}
                                        className="flex items-center justify-between p-2 rounded bg-glass-panel border border-border-glass text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground-primary">
                                                {format.qualityLabel || format.quality}
                                            </span>
                                            <span className="text-foreground-secondary">
                                                {format.container}
                                            </span>
                                        </div>
                                        <span className="text-foreground-secondary">
                                            {formatBitrate(format.bitrate)}
                                        </span>
                                    </div>
                                ))}
                                {videoOnlyFormats.length > 3 && (
                                    <p className="text-xs text-foreground-secondary text-center">
                                        +{videoOnlyFormats.length - 3} more formats
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Audio Only Formats */}
                    {audioOnlyFormats.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="w-3.5 h-3.5 text-purple-400" />
                                <h4 className="text-xs font-semibold text-purple-400">
                                    Audio Only ({audioOnlyFormats.length})
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {audioOnlyFormats.slice(0, 3).map((format) => (
                                    <div 
                                        key={format.itag}
                                        className="flex items-center justify-between p-2 rounded bg-glass-panel border border-border-glass text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground-primary">
                                                {format.audioBitrate ? `${format.audioBitrate}kbps` : 'Audio'}
                                            </span>
                                            <span className="text-foreground-secondary">
                                                {format.container}
                                            </span>
                                        </div>
                                        <span className="text-foreground-secondary">
                                            {formatBitrate(format.bitrate)}
                                        </span>
                                    </div>
                                ))}
                                {audioOnlyFormats.length > 3 && (
                                    <p className="text-xs text-foreground-secondary text-center">
                                        +{audioOnlyFormats.length - 3} more formats
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-foreground-secondary italic text-center mt-3">
                        The downloader will automatically select the best format for your chosen quality
                    </p>
                </div>
            )}
        </Card>
    );
};

