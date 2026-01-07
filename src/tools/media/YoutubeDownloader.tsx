import React, { useState, useEffect, useRef } from 'react';
import { Download, Youtube, Video, Music, Film, Loader2, CheckCircle2, AlertCircle, Info, FileVideo, FolderOpen, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { VideoInfo } from './components/VideoInfo';
import { FormatsList } from './components/FormatsList';
import { ToastContainer, useToast } from '../../components/ui/Toast';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
    progress?: number;
    filename?: string;
}

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

interface VideoInfoData {
    videoId: string;
    title: string;
    author: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    uploadDate?: string;
    formats: VideoFormat[];
    availableQualities: string[];
    hasVideo: boolean;
    hasAudio: boolean;
}

export const YoutubeDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio' | 'best'>('video');
    const [quality, setQuality] = useState<string>('720p');
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });
    const [videoInfo, setVideoInfo] = useState<VideoInfoData | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const { toasts, removeToast, success, error, info } = useToast();

    const isValidYoutubeUrl = (url: string): boolean => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const handleDownload = async (isRetry = false) => {
        if (!url.trim()) {
            error('Invalid URL', 'Please enter a YouTube URL');
            setDownloadStatus({ status: 'error', message: 'Please enter a YouTube URL' });
            return;
        }

        if (!isValidYoutubeUrl(url)) {
            error('Invalid URL', 'Please enter a valid YouTube URL');
            setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
            return;
        }

        if (isRetry) {
            info('Retrying download', `Attempt ${retryCount + 1} of 3`);
        } else {
            info('Starting download', videoInfo?.title || 'Video');
            setRetryCount(0);
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
                success('Download Complete!', videoInfo?.title || 'Video downloaded successfully');
                setRetryCount(0);
            } else {
                throw new Error(result.error || 'Download failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Download failed';
            setDownloadStatus({
                status: 'error',
                message: errorMessage
            });
            
            // Auto-retry logic (max 3 attempts)
            if (!isRetry && retryCount < 2) {
                setRetryCount(retryCount + 1);
                error('Download Failed', `Will retry in 3 seconds... (Attempt ${retryCount + 1}/3)`);
                setTimeout(() => handleDownload(true), 3000);
            } else {
                error('Download Failed', errorMessage);
                if (retryCount >= 2) {
                    error('Max Retries Reached', 'Please try again later or check your internet connection');
                }
            }
        }
    };

    const handleFetchInfo = async () => {
        if (!url.trim()) {
            return;
        }

        if (!isValidYoutubeUrl(url)) {
            setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
            return;
        }

        setFetchingInfo(true);
        setVideoInfo(null);
        setDownloadStatus({ status: 'idle' });

        try {
            // Check if YouTube API is available
            if (!(window as any).youtubeAPI) {
                throw new Error('YouTube API not available');
            }

            const info = await (window as any).youtubeAPI.getInfo(url);
            setVideoInfo(info);
            
            // Auto-select best available quality
            if (info.availableQualities && info.availableQualities.length > 0) {
                setQuality(info.availableQualities[0]); // Select highest quality
            }
            
            success('Video Info Loaded', info.title);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video info';
            setDownloadStatus({
                status: 'error',
                message: errorMessage
            });
            error('Failed to Load Video', errorMessage);
        } finally {
            setFetchingInfo(false);
        }
    };

    const handleOpenFile = async () => {
        if (downloadStatus.filename) {
            try {
                await (window as any).youtubeAPI.openFile(downloadStatus.filename);
                info('Opening File', 'Launching with default application...');
            } catch (err) {
                error('Failed to Open', 'Could not open the file');
            }
        }
    };

    const handleShowInFolder = async () => {
        if (downloadStatus.filename) {
            try {
                await (window as any).youtubeAPI.showInFolder(downloadStatus.filename);
                info('Showing File', 'Opening in file manager...');
            } catch (err) {
                error('Failed to Show', 'Could not open folder');
            }
        }
    };

    const handleRetry = () => {
        setRetryCount(0);
        handleDownload(false);
    };

    const handleClear = () => {
        setUrl('');
        setVideoInfo(null);
        setDownloadStatus({ status: 'idle' });
        setQuality('720p');
        setFormat('video');
    };

    // Auto-fetch video info when URL changes
    useEffect(() => {
        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Check if URL is valid
        if (url.trim() && isValidYoutubeUrl(url)) {
            // Debounce: wait 1 second after user stops typing
            debounceTimer.current = setTimeout(() => {
                handleFetchInfo();
            }, 1000);
        } else {
            // Clear video info if URL is invalid
            setVideoInfo(null);
        }

        // Cleanup
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [url]);

    // Estimate file size and download time
    const estimateFileSize = (): string => {
        if (!videoInfo) return 'Unknown';
        const lengthMB = videoInfo.lengthSeconds / 60;
        let sizeEstimate = 0;
        
        if (format === 'audio') {
            sizeEstimate = lengthMB * 1.5; // ~1.5MB per minute for audio
        } else {
            const qualityMultiplier = {
                '144p': 2, '240p': 4, '360p': 8, '480p': 15,
                '720p': 25, '1080p': 50, '1440p': 100, '2160p': 200, 'best': 50
            };
            sizeEstimate = lengthMB * (qualityMultiplier[quality as keyof typeof qualityMultiplier] || 25);
        }
        
        if (sizeEstimate < 1024) {
            return `~${sizeEstimate.toFixed(0)} MB`;
        }
        return `~${(sizeEstimate / 1024).toFixed(1)} GB`;
    };

    const estimateDownloadTime = (): string => {
        if (!videoInfo) return 'Unknown';
        const lengthMB = videoInfo.lengthSeconds / 60;
        let sizeMB = 0;
        
        if (format === 'audio') {
            sizeMB = lengthMB * 1.5;
        } else {
            const qualityMultiplier = {
                '144p': 2, '240p': 4, '360p': 8, '480p': 15,
                '720p': 25, '1080p': 50, '1440p': 100, '2160p': 200, 'best': 50
            };
            sizeMB = lengthMB * (qualityMultiplier[quality as keyof typeof qualityMultiplier] || 25);
        }
        
        // Assume 5 Mbps download speed
        const speedMBps = 5 / 8; // Convert Mbps to MBps
        const seconds = sizeMB / speedMBps;
        
        if (seconds < 60) return `~${Math.ceil(seconds)}s`;
        return `~${Math.ceil(seconds / 60)}m`;
    };

    return (
        <div className="h-full flex flex-col bg-background/50">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            
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
                        <label className="block text-sm font-medium text-foreground-primary mb-2 flex items-center gap-2">
                            YouTube URL
                            {fetchingInfo && (
                                <span className="flex items-center gap-1.5 text-xs text-blue-400">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Fetching info...
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=... (auto-fetch on paste)"
                                className="flex-1"
                                disabled={downloadStatus.status === 'downloading'}
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

                    {/* Video Info Preview */}
                    {videoInfo && (
                        <>
                            <VideoInfo {...videoInfo} />
                            
                            {/* Download Estimates */}
                            <Card className="p-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-foreground-secondary mb-1">Estimated Size</p>
                                        <p className="text-lg font-bold text-indigo-400">{estimateFileSize()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-foreground-secondary mb-1">Estimated Time</p>
                                        <p className="text-lg font-bold text-purple-400">{estimateDownloadTime()}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Available Formats */}
                            <FormatsList formats={videoInfo.formats} />
                        </>
                    )}

                    {/* Download Options */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-foreground-primary mb-4">Download Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Format Selection */}
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-medium text-foreground-primary mb-2">
                                    Format
                                    {videoInfo && (
                                        <span className="text-xs text-foreground-secondary ml-2">
                                            ({videoInfo.hasVideo ? 'Video ✓' : ''} {videoInfo.hasAudio ? 'Audio ✓' : ''})
                                        </span>
                                    )}
                                </label>
                                <Select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'video' | 'audio' | 'best')}
                                    disabled={downloadStatus.status === 'downloading' || !videoInfo}
                                    options={
                                        videoInfo ? [
                                            ...(videoInfo.hasVideo && videoInfo.hasAudio ? [{ value: 'video' as const, label: 'Video + Audio (MP4)' }] : []),
                                            ...(videoInfo.hasAudio ? [{ value: 'audio' as const, label: 'Audio Only (MP3)' }] : []),
                                            { value: 'best' as const, label: 'Best Quality Available' }
                                        ] : [
                                            { value: 'video' as const, label: 'Video + Audio (MP4)' },
                                            { value: 'audio' as const, label: 'Audio Only (MP3)' },
                                            { value: 'best' as const, label: 'Best Quality Available' }
                                        ]
                                    }
                                />
                            </div>

                            {/* Quality Selection */}
                            {format !== 'audio' && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground-primary mb-2">
                                        Video Quality
                                        {videoInfo && (
                                            <span className="text-xs text-foreground-secondary ml-2">
                                                (Available from video)
                                            </span>
                                        )}
                                    </label>
                                    <Select
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value)}
                                        disabled={downloadStatus.status === 'downloading' || !videoInfo}
                                        options={
                                            videoInfo && videoInfo.availableQualities ? [
                                                { value: 'best', label: 'Best Available' },
                                                ...videoInfo.availableQualities.map(q => {
                                                    const labels: Record<string, string> = {
                                                        '2160p': '2160p (4K)',
                                                        '1440p': '1440p (2K)',
                                                        '1080p': '1080p (Full HD)',
                                                        '720p': '720p (HD)',
                                                        '480p': '480p (SD)',
                                                        '360p': '360p',
                                                        '240p': '240p',
                                                        '144p': '144p',
                                                    };
                                                    return { value: q, label: labels[q] || q };
                                                })
                                            ] : [
                                                { value: 'best', label: 'Best Available' },
                                                { value: '1080p', label: '1080p (Full HD)' },
                                                { value: '720p', label: '720p (HD)' },
                                                { value: '480p', label: '480p (SD)' },
                                                { value: '360p', label: '360p' },
                                            ]
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Download Button */}
                    <div className="flex justify-center gap-3">
                        <Button
                            onClick={() => handleDownload(false)}
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
                        
                        {downloadStatus.status === 'error' && (
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                size="lg"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        )}
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
                                        <>
                                            <p className="text-sm text-foreground-secondary mt-2">
                                                File: {downloadStatus.filename.split(/[/\\]/).pop()}
                                            </p>
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    onClick={handleOpenFile}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Open File
                                                </Button>
                                                <Button
                                                    onClick={handleShowInFolder}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                                                    Show in Folder
                                                </Button>
                                            </div>
                                        </>
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

