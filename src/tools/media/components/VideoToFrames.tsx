import React, { useState, useRef } from 'react';
import { Upload, Download, Play, RotateCcw, Video, Settings, Film } from 'lucide-react';
import { Slider } from '../../../components/ui/Slider';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { logger } from '../../../utils/logger';

interface FrameData {
    blob: Blob;
    timestamp: number;
    index: number;
}

export const VideoToFrames: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [frames, setFrames] = useState<FrameData[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [extractionSettings, setExtractionSettings] = useState({
        fps: 1,
        startTime: 0,
        endTime: 0,
        quality: 0.8,
        format: 'png' as 'png' | 'jpg' | 'webp'
    });
    const [videoMetadata, setVideoMetadata] = useState<{
        duration: number;
        width: number;
        height: number;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoFile(file);
        setFrames([]);
        setProgress(0);

        logger.info('Video selected:', { name: file.name, size: file.size, type: file.type });

        // Get video metadata
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.src = url;

        video.onloadedmetadata = () => {
            const metadata = {
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight
            };
            logger.debug('Video metadata loaded:', metadata);

            setVideoMetadata(metadata);
            setExtractionSettings(prev => ({
                ...prev,
                endTime: Math.floor(video.duration)
            }));
        };
    };

    const extractFrames = async () => {
        if (!videoFile || !videoMetadata) return;

        logger.info('Starting frame extraction:', extractionSettings);
        setIsProcessing(true);
        setProcessingStatus('Initializing video...');

        const fileUrl = URL.createObjectURL(videoFile);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.src = fileUrl;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoMetadata.width;
        canvas.height = videoMetadata.height;

        const extractedFrames: FrameData[] = [];
        const frameInterval = 1 / extractionSettings.fps;
        let currentTime = extractionSettings.startTime;
        let frameIndex = 0;

        const totalFrames = Math.floor((extractionSettings.endTime - extractionSettings.startTime) * extractionSettings.fps);

        return new Promise<void>((resolve, reject) => {
            // Function to handle seeking and extraction
            const onSeeked = () => {
                if (currentTime <= extractionSettings.endTime) {
                    ctx.drawImage(video, 0, 0);

                    // Convert to blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                extractedFrames.push({
                                    blob,
                                    timestamp: currentTime,
                                    index: frameIndex
                                });
                            }

                            frameIndex++;
                            currentTime += frameInterval;
                            const currentProgress = Math.min(100, Math.floor((frameIndex / totalFrames) * 100));
                            setProgress(currentProgress);
                            setProcessingStatus(`Extracted ${frameIndex} / ${totalFrames} frames`);

                            // Log unexpected progress jumps or periodically
                            if (frameIndex % 5 === 0) {
                                logger.debug(`Extraction progress: ${currentProgress}% (Frame ${frameIndex}/${totalFrames})`);
                            }

                            if (currentTime <= extractionSettings.endTime) {
                                video.currentTime = currentTime;
                            } else {
                                video.removeEventListener('seeked', onSeeked);
                                setFrames(extractedFrames);
                                setIsProcessing(false);
                                logger.info(`Extraction complete. Extracted ${extractedFrames.length} frames.`);
                                URL.revokeObjectURL(fileUrl);
                                resolve();
                            }
                        },
                        `image/${extractionSettings.format}`,
                        extractionSettings.quality
                    );
                }
            };

            // Error handling
            video.onerror = (e) => {
                logger.error('Video error during extraction:', e);
                setIsProcessing(false);
                setProcessingStatus('Error initializing video');
                URL.revokeObjectURL(fileUrl);
                reject(new Error('Video loading failed'));
            };

            // Start processing once video data is loaded
            video.onloadeddata = () => {
                video.addEventListener('seeked', onSeeked);
                // Set initial time to trigger the first seeked event
                video.currentTime = currentTime;
            };

            // Allow some time for loading, then check readyState if event didn't fire (fallback)
            // But onloadeddata should generally work.
        });
    };

    const downloadFrames = async () => {
        if (frames.length === 0) return;

        // Create zip file in memory
        try {
            // Note: In production, you'd use a library like jszip
            // For now, we'll download frames individually
            for (const frame of frames) {
                const url = URL.createObjectURL(frame.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `frame-${frame.index.toString().padStart(6, '0')}.${extractionSettings.format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const downloadAsZip = async () => {
        if (frames.length === 0) return;

        try {
            // Dynamic import of jszip
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            frames.forEach((frame) => {
                zip.file(`frame-${frame.index.toString().padStart(6, '0')}.${extractionSettings.format}`, frame.blob);
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `frames-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('ZIP download failed:', error);
            downloadFrames();
        }
    };

    const reset = () => {
        setVideoFile(null);
        setFrames([]);
        setProgress(0);
        setVideoMetadata(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto p-1">
            <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
                {/* File Upload */}
                {!videoFile ? (
                    <Card
                        className="border-2 border-dashed border-border-glass p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-glass-panel/50 transition-all group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                        />
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Upload Video</h3>
                        <p className="text-foreground-secondary max-w-sm mx-auto">
                            Drag and drop or click to select a video file (MP4, WebM, MOV)
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Settings & Info */}
                            <div className="space-y-6">
                                {/* Video Info Card */}
                                <Card className="p-5 space-y-4">
                                    <div className="flex items-center gap-3 border-b border-border-glass pb-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <Film className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">Video Details</h3>
                                            <p className="text-xs text-foreground-secondary truncate max-w-[200px]" title={videoFile.name}>
                                                {videoFile.name}
                                            </p>
                                        </div>
                                    </div>

                                    {videoMetadata && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-glass-background/50 p-3 rounded-lg">
                                                <p className="text-xs text-foreground-secondary mb-1">Duration</p>
                                                <p className="font-mono text-foreground">
                                                    {Math.floor(videoMetadata.duration / 60)}:{(videoMetadata.duration % 60).toFixed(0).padStart(2, '0')}
                                                </p>
                                            </div>
                                            <div className="bg-glass-background/50 p-3 rounded-lg">
                                                <p className="text-xs text-foreground-secondary mb-1">Resolution</p>
                                                <p className="font-mono text-foreground">
                                                    {videoMetadata.width}x{videoMetadata.height}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={reset}
                                        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        icon={RotateCcw}
                                    >
                                        Change Video
                                    </Button>
                                </Card>

                                {/* Settings Card */}
                                <Card className="p-5 space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border-glass pb-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-foreground">Extraction Settings</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <Slider
                                            label="Frame Rate (FPS)"
                                            value={extractionSettings.fps}
                                            min={0.1}
                                            max={30}
                                            step={0.1}
                                            onChange={(val) => setExtractionSettings(prev => ({ ...prev, fps: val }))}
                                            unit=" FPS"
                                        />

                                        <div className="p-3 bg-glass-background/30 rounded-lg text-center">
                                            <p className="text-xs text-foreground-secondary">Estimated Output</p>
                                            <p className="text-lg font-bold text-indigo-400">
                                                ~{Math.floor((extractionSettings.endTime - extractionSettings.startTime) * extractionSettings.fps)} frames
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-foreground-secondary">Start Time</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={videoMetadata?.duration}
                                                    value={extractionSettings.startTime}
                                                    onChange={(e) => setExtractionSettings(prev => ({
                                                        ...prev,
                                                        startTime: Math.max(0, parseFloat(e.target.value) || 0)
                                                    }))}
                                                    className="w-full bg-input-bg border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-foreground-secondary">End Time</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={videoMetadata?.duration}
                                                    value={extractionSettings.endTime}
                                                    onChange={(e) => setExtractionSettings(prev => ({
                                                        ...prev,
                                                        endTime: Math.min(videoMetadata?.duration || 0, parseFloat(e.target.value) || 0)
                                                    }))}
                                                    className="w-full bg-input-bg border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-foreground-secondary">Format</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['png', 'jpg', 'webp'].map(fmt => (
                                                    <button
                                                        key={fmt}
                                                        onClick={() => setExtractionSettings(prev => ({
                                                            ...prev,
                                                            format: fmt as 'png' | 'jpg' | 'webp'
                                                        }))}
                                                        className={`py-2 rounded-lg text-xs font-medium transition-all ${extractionSettings.format === fmt
                                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                                            : 'bg-glass-panel border border-border-glass text-foreground hover:bg-glass-panel/80'
                                                            }`}
                                                        disabled={isProcessing}
                                                    >
                                                        {fmt.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {extractionSettings.format === 'jpg' && (
                                            <Slider
                                                label="Quality"
                                                value={extractionSettings.quality}
                                                min={0.1}
                                                max={1}
                                                step={0.1}
                                                onChange={(val) => setExtractionSettings(prev => ({ ...prev, quality: val }))}
                                                className="pt-2"
                                            />
                                        )}

                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={extractFrames}
                                            disabled={isProcessing}
                                            icon={Play}
                                            loading={isProcessing}
                                        >
                                            {isProcessing ? 'Extracting...' : 'Start Extraction'}
                                        </Button>
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column: Preview */}
                            <div className="lg:col-span-2 space-y-6">
                                {isProcessing && (
                                    <Card className="p-6 text-center space-y-4 bg-glass-panel/80 backdrop-blur-md border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-indigo-400 animate-pulse">Extracting frames...</span>
                                                <span className="text-foreground">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-input-bg rounded-full h-2.5 overflow-hidden border border-border-glass/50">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-foreground-secondary mt-2">
                                                <span>Processing...</span>
                                                <span className="font-mono">{processingStatus}</span>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {frames.length > 0 && (
                                    <div className="space-y-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Extracted Frames ({frames.length})
                                            </h3>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" icon={Download} onClick={downloadAsZip}>
                                                    Download ZIP
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                            {frames.map((frame) => (
                                                <div key={frame.index} className="group relative aspect-video rounded-lg overflow-hidden border border-border-glass bg-black/50 hover:border-indigo-500/50 transition-all shadow-sm">
                                                    <img
                                                        src={URL.createObjectURL(frame.blob)}
                                                        alt={`Frame ${frame.index}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                                                        <span className="text-[10px] text-white font-mono">
                                                            #{frame.index}
                                                        </span>
                                                        <span className="text-[10px] text-white/70 font-mono">
                                                            {frame.timestamp.toFixed(2)}s
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!isProcessing && frames.length === 0 && (
                                    <div className="h-full flex items-center justify-center p-12 text-foreground-secondary border-2 border-dashed border-border-glass/50 rounded-3xl">
                                        <div className="text-center">
                                            <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Ready to extract frames</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
