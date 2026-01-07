import React, { useState } from 'react';
import { Download, Youtube, Video, Music, Film, Loader2, CheckCircle2, AlertCircle, Info, FileVideo } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

interface DownloadOptions {
    url: string;
    format: 'video' | 'audio' | 'best';
    quality: '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | 'best';
}

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
    progress?: number;
    filename?: string;
}

export const YoutubeDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio' | 'best'>('video');
    const [quality, setQuality] = useState<string>('720p');
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });

    const isValidYoutubeUrl = (url: string): boolean => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const handleDownload = async () => {
        if (!url.trim()) {
            setDownloadStatus({ status: 'error', message: 'Please enter a YouTube URL' });
            return;
        }

        if (!isValidYoutubeUrl(url)) {
            setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
            return;
        }

        setDownloadStatus({ status: 'downloading', message: 'Preparing download...', progress: 0 });

        try {
            // Check if YouTube API is available
            if (!(window as any).youtubeAPI) {
                throw new Error('YouTube API not available');
            }

            // Set up progress listener
            const unsubscribe = (window as any).youtubeAPI.onProgress((progress: any) => {
                setDownloadStatus({
                    status: 'downloading',
                    message: `Downloading... ${progress.percent}%`,
                    progress: progress.percent
                });
            });

            // Start download
            const result = await (window as any).youtubeAPI.download({
                url,
                format,
                quality: format === 'audio' ? undefined : quality,
            });

            unsubscribe();

            if (result.success) {
                setDownloadStatus({
                    status: 'success',
                    message: 'Download completed successfully!',
                    filename: result.filepath
                });
            } else {
                throw new Error(result.error || 'Download failed');
            }
        } catch (error) {
            setDownloadStatus({
                status: 'error',
                message: error instanceof Error ? error.message : 'Download failed'
            });
        }
    };

    const handleClear = () => {
        setUrl('');
        setDownloadStatus({ status: 'idle' });
    };

    return (
        <div className="h-full flex flex-col bg-background/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-glass bg-glass-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400">
                        <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                            YouTube Video Downloader
                        </h1>
                        <p className="text-xs text-foreground-secondary">
                            Download videos and audio from YouTube in various formats and qualities
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Info Card */}
                    <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-foreground-secondary">
                                <p className="font-medium text-blue-400 mb-1">Supported URLs:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>youtube.com/watch?v=VIDEO_ID</li>
                                    <li>youtu.be/VIDEO_ID</li>
                                    <li>youtube.com/shorts/VIDEO_ID</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* URL Input */}
                    <Card className="p-6">
                        <label className="block text-sm font-medium text-foreground-primary mb-2">
                            YouTube URL
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="flex-1"
                            />
                            <Button
                                onClick={handleClear}
                                variant="outline"
                                disabled={!url || downloadStatus.status === 'downloading'}
                            >
                                Clear
                            </Button>
                        </div>
                    </Card>

                    {/* Download Options */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-foreground-primary mb-4">Download Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Format Selection */}
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-medium text-foreground-primary mb-2">
                                    Format
                                </label>
                                <Select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'video' | 'audio' | 'best')}
                                    disabled={downloadStatus.status === 'downloading'}
                                    options={[
                                        { value: 'video', label: 'Video + Audio (MP4)' },
                                        { value: 'audio', label: 'Audio Only (MP3)' },
                                        { value: 'best', label: 'Best Quality Available' }
                                    ]}
                                />
                            </div>

                            {/* Quality Selection */}
                            {format !== 'audio' && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground-primary mb-2">
                                        Video Quality
                                    </label>
                                    <Select
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value)}
                                        disabled={downloadStatus.status === 'downloading'}
                                        options={[
                                            { value: 'best', label: 'Best Available' },
                                            { value: '1080p', label: '1080p (Full HD)' },
                                            { value: '720p', label: '720p (HD)' },
                                            { value: '480p', label: '480p (SD)' },
                                            { value: '360p', label: '360p' },
                                            { value: '240p', label: '240p' },
                                            { value: '144p', label: '144p' }
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Download Button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={handleDownload}
                            disabled={!url || downloadStatus.status === 'downloading'}
                            className="min-w-[200px]"
                            size="lg"
                        >
                            {downloadStatus.status === 'downloading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Video
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Status Display */}
                    {downloadStatus.status !== 'idle' && (
                        <Card className={`p-6 ${
                            downloadStatus.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                            downloadStatus.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                            'bg-blue-500/5 border-blue-500/20'
                        }`}>
                            <div className="flex items-start gap-3">
                                {downloadStatus.status === 'downloading' && (
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                                )}
                                {downloadStatus.status === 'success' && (
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                )}
                                {downloadStatus.status === 'error' && (
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${
                                        downloadStatus.status === 'success' ? 'text-green-400' :
                                        downloadStatus.status === 'error' ? 'text-red-400' :
                                        'text-blue-400'
                                    }`}>
                                        {downloadStatus.message}
                                    </p>
                                    {downloadStatus.status === 'downloading' && downloadStatus.progress !== undefined && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm text-foreground-secondary mb-1">
                                                <span>Progress</span>
                                                <span>{downloadStatus.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                                    style={{ width: `${downloadStatus.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {downloadStatus.status === 'success' && downloadStatus.filename && (
                                        <p className="text-sm text-foreground-secondary mt-1">
                                            File: {downloadStatus.filename}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Features Info */}
                    <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                        <h3 className="text-lg font-semibold text-foreground-primary mb-4 flex items-center gap-2">
                            <FileVideo className="w-5 h-5 text-purple-400" />
                            Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground-secondary">
                            <div className="flex items-start gap-2">
                                <Video className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Multiple Formats</p>
                                    <p>Video (MP4) and Audio (MP3) downloads</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Film className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Quality Selection</p>
                                    <p>Choose from 144p to 1080p quality</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Download className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Fast Downloads</p>
                                    <p>Optimized download with progress tracking</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Music className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Audio Extract</p>
                                    <p>Extract audio as MP3 from any video</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default YoutubeDownloader;

