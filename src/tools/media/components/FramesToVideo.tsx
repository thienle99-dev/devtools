import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, Settings, X, Film } from 'lucide-react';
import { Slider } from '../../../components/ui/Slider';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { logger } from '../../../utils/logger';
import { toast } from 'sonner';

export const FramesToVideo: React.FC = () => {
    const [frames, setFrames] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [videoSettings, setVideoSettings] = useState({
        fps: 24,
        format: 'webm' as 'webm' | 'mp4' | 'gif',
        quality: 'high' as 'low' | 'medium' | 'high',
        transition: 'none' as 'none' | 'crossfade',
        transitionDuration: 0.5
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const imageFiles = files.filter(f =>
            ['image/png', 'image/jpeg', 'image/webp'].includes(f.type)
        );

        if (imageFiles.length > 0) {
            logger.info(`Added ${imageFiles.length} frames.`);
            setFrames(prev => [...prev, ...imageFiles]);
        } else {
            logger.warn('No valid image files selected.');
        }
    };

    const removeFrame = (index: number) => {
        setFrames(prev => prev.filter((_, i) => i !== index));
    };

    const createVideoBrowser = async () => {
        if (frames.length < 2) {
            alert('Please add at least 2 frames');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setProcessingStatus('Starting video creation...');

        try {
            // Load images into canvas
            const images: HTMLImageElement[] = [];

            for (let i = 0; i < frames.length; i++) {
                const img = new Image();
                img.src = URL.createObjectURL(frames[i]);

                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        images.push(img);
                        const loadProgress = Math.floor((i / frames.length) * 50);
                        setProgress(loadProgress);
                        setProcessingStatus(`Loading frame ${i + 1}/${frames.length}...`);
                        resolve();
                    };
                });
            }

            // Create canvas with first image dimensions
            const canvas = document.createElement('canvas');
            canvas.width = images[0].width;
            canvas.height = images[0].height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                logger.error('Failed to get canvas context');
                throw new Error('Could not get canvas context');
            }

            logger.info('Starting video creation', { frames: frames.length, settings: videoSettings });

            // Create video using MediaRecorder API
            // If transitions are on, we need a high render FPS (e.g. 30 or 60) regardless of input FPS
            const renderFps = videoSettings.transition === 'none' ? videoSettings.fps : Math.max(30, videoSettings.fps);
            const mediaStream = canvas.captureStream(renderFps);
            const audioContext = new AudioContext();
            const audioDestination = audioContext.createMediaStreamDestination();

            // Combine audio and video streams
            const combinedStream = new MediaStream([
                ...mediaStream.getTracks(),
                ...audioDestination.stream.getTracks()
            ]);

            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            logger.debug('MediaRecorder initialized', { mimeType: mediaRecorder.mimeType });
            setProcessingStatus('Rendering video...');

            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const videoBlob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(videoBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `video-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setIsProcessing(false);
                setProgress(0);
                setProcessingStatus('');
                logger.info('Video creation complete and downloaded.');
            };

            mediaRecorder.start();

            // Start Recording
            mediaRecorder.start();

            // Render Loop

            // Duration per image in ms
            const imageDuration = 1000 / videoSettings.fps;
            const transDuration = videoSettings.transitionDuration * 1000;

            const startTime = Date.now();

            const drawFrame = () => {
                const now = Date.now();
                const elapsed = now - startTime;

                // Calculate which image index we are at
                // Logic: index = floor(elapsed / imageDuration)
                const currentIndex = Math.floor(elapsed / imageDuration);

                if (currentIndex >= images.length) {
                    setProcessingStatus('Finalizing video file...');
                    mediaRecorder.stop();
                    return;
                }

                // Calculate local time within the current image slot
                const localTime = elapsed % imageDuration;

                // Clear
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw Current Image
                const currentImg = images[currentIndex];

                // Scaling logic (fit containment)
                const drawImageFit = (img: HTMLImageElement, alpha: number = 1.0) => {
                    ctx.globalAlpha = alpha;
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                    const x = (canvas.width / 2) - (img.width / 2) * scale;
                    const y = (canvas.height / 2) - (img.height / 2) * scale;
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    ctx.globalAlpha = 1.0;
                };

                // Transition Logic
                // If we are near the end of the slide, and have a next slide, blend
                if (videoSettings.transition === 'crossfade' &&
                    currentIndex < images.length - 1 &&
                    localTime > (imageDuration - transDuration)) {

                    // We are in transition zone
                    const transProgress = (localTime - (imageDuration - transDuration)) / transDuration;

                    // Draw Current (fading out? or just staying behind?)
                    // Cross dissolve usually: A fades out, B fades in. Or A stays 1, B fades 0->1 on top.
                    // Let's do B fades in on top of A.
                    drawImageFit(currentImg, 1.0);

                    const nextImg = images[currentIndex + 1];
                    drawImageFit(nextImg, transProgress);

                } else {
                    // Normal display
                    drawImageFit(currentImg, 1.0);
                }

                // Update Progress
                const progress = Math.min(100, Math.floor((currentIndex / images.length) * 100));
                setProgress(progress);
                setProcessingStatus(`Rendering frame ${currentIndex + 1}/${images.length}...`);

                // Wait for next frame time
                // We use requestAnimationFrame but enable "throttle" to match renderFps roughly if needed, 
                // but usually rAF is 60fps. Capturing at 30fps from a 60fps canvas is fine.
                // However, logic relies on `elapsed`, so it's frame-rate independent.
                requestAnimationFrame(drawFrame);
            };

            drawFrame();
        } catch (error) {
            console.error('Video creation failed:', error);
            logger.error('Video creation error:', error);
            alert('Failed to create video. Check console for details.');
            setIsProcessing(false);
        }
    };

    const createVideoBackend = async () => {
        setIsProcessing(true);
        setProgress(0);
        setProcessingStatus('Initializing backend process...');

        const imagePaths = frames.map(f => (f as any).path).filter((p: any) => typeof p === 'string' && p.length > 0);

        if (imagePaths.length < frames.length) {
            toast.error('Some images are missing file paths. Saved images are required for this format.');
            setIsProcessing(false);
            return;
        }

        let cleanup: (() => void) | undefined;

        try {
            cleanup = (window as any).videoMergerAPI?.onProgress((p: any) => {
                if (p.state === 'processing') {
                    setProgress(Math.round(p.percent));
                    setProcessingStatus(`Rendering: ${Math.round(p.percent)}%`);
                }
            });

            const resultPath = await (window as any).videoMergerAPI?.createFromImages({
                imagePaths,
                fps: videoSettings.fps,
                format: videoSettings.format,
                quality: videoSettings.quality,
                transition: videoSettings.transition,
                transitionDuration: videoSettings.transitionDuration
            });

            setProcessingStatus('Complete!');
            setProgress(100);

            toast.success(`Video exported: ${videoSettings.format.toUpperCase()}`, {
                action: {
                    label: 'Open',
                    onClick: () => (window as any).videoMergerAPI?.openFile(resultPath)
                }
            });

            (window as any).videoMergerAPI?.showInFolder(resultPath);

        } catch (e: any) {
            console.error(e);
            toast.error(`Export failed: ${e.message}`);
        } finally {
            if (cleanup) cleanup();
            setIsProcessing(false);
        }
    };

    const createVideo = async () => {
        if (frames.length < 2) {
            toast.error('Please add at least 2 frames');
            return;
        }

        if (videoSettings.format === 'mp4' || videoSettings.format === 'gif') {
            await createVideoBackend();
        } else {
            await createVideoBrowser();
        }
    };

    const reset = () => {
        setFrames([]);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto p-1">
            <div className="space-y-6 mx-auto w-full pb-10">
                {/* File Upload */}
                <Card
                    className="border-2 border-dashed border-border-glass p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-glass-panel/50 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFilesSelect}
                        className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {frames.length > 0 ? 'Add More Frames' : 'Upload Images'}
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                        PNG, JPG, WebP - will be combined in order
                    </p>
                </Card>

                {frames.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Settings Column */}
                        <div className="space-y-6">
                            <Card className="p-5 space-y-6">
                                <div className="flex items-center gap-3 border-b border-border-glass pb-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Video Settings</h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-foreground-secondary">Output Format</label>
                                        <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                                            {['webm', 'mp4', 'gif'].map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setVideoSettings(prev => ({ ...prev, format: fmt as any }))}
                                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all uppercase ${videoSettings.format === fmt
                                                        ? 'bg-indigo-500/20 text-indigo-400'
                                                        : 'text-foreground-secondary hover:text-foreground'
                                                        }`}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Slider
                                        label="Frame Rate"
                                        value={videoSettings.fps}
                                        min={1}
                                        max={60}
                                        step={1}
                                        onChange={(val) => setVideoSettings(prev => ({ ...prev, fps: val }))}
                                        unit=" FPS"
                                    />

                                    <div className="p-3 bg-glass-background/30 rounded-lg text-center">
                                        <p className="text-xs text-foreground-secondary">Estimated Duration</p>
                                        <p className="text-lg font-bold text-indigo-400">
                                            ~{(frames.length / videoSettings.fps).toFixed(1)}s
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-border-glass">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-foreground-secondary">Transition Effect</label>
                                            <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                                                <button
                                                    onClick={() => setVideoSettings(prev => ({ ...prev, transition: 'none' }))}
                                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${videoSettings.transition === 'none'
                                                        ? 'bg-indigo-500/20 text-indigo-400'
                                                        : 'text-foreground-secondary hover:text-foreground'
                                                        }`}
                                                >
                                                    None
                                                </button>
                                                <button
                                                    onClick={() => setVideoSettings(prev => ({ ...prev, transition: 'crossfade' }))}
                                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${videoSettings.transition === 'crossfade'
                                                        ? 'bg-indigo-500/20 text-indigo-400'
                                                        : 'text-foreground-secondary hover:text-foreground'
                                                        }`}
                                                >
                                                    Crossfade
                                                </button>
                                            </div>
                                        </div>

                                        {videoSettings.transition === 'crossfade' && (
                                            <Slider
                                                label="Transition Duration"
                                                value={videoSettings.transitionDuration}
                                                min={0.1}
                                                max={Math.max(0.1, (1 / videoSettings.fps) - 0.1)}
                                                // Max duration must be less than total Image Duration (1/FPS)
                                                // Wait, if 1/FPS is small (e.g. 0.1s), transition can't be 0.5s.
                                                // We should probably clamp or warn. 
                                                step={0.1}
                                                onChange={(val) => setVideoSettings(prev => ({ ...prev, transitionDuration: val }))}
                                                unit="s"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-foreground-secondary">Quality</label>
                                        <div className="flex gap-2">
                                            {['low', 'medium', 'high'].map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => setVideoSettings(prev => ({
                                                        ...prev,
                                                        quality: q as 'low' | 'medium' | 'high'
                                                    }))}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${videoSettings.quality === q
                                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                                        : 'bg-glass-panel border border-border-glass text-foreground hover:bg-glass-panel/80'
                                                        }`}
                                                    disabled={isProcessing}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={createVideo}
                                            disabled={isProcessing || frames.length < 2}
                                            icon={Download}
                                            loading={isProcessing}
                                        >
                                            {isProcessing ? 'Creating Video...' : 'Create Video'}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            className="w-full text-foreground-secondary hover:text-foreground"
                                            onClick={reset}
                                            disabled={isProcessing}
                                            icon={RotateCcw}
                                        >
                                            Reset All
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {isProcessing && (
                                <Card className="p-4 text-center space-y-3">
                                    <div className="w-full bg-input-bg rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                                        <span className="font-mono">{processingStatus}</span>
                                        <span>{progress}%</span>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Frames List Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Input Frames ({frames.length})
                                </h3>
                            </div>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {frames.map((frame, index) => (
                                    <div
                                        key={`${frame.name}-${index}`}
                                        className="flex items-center gap-4 p-3 bg-glass-panel border border-border-glass rounded-xl hover:border-indigo-500/30 transition-all group"
                                    >
                                        <span className="text-xs font-mono text-foreground-secondary w-6 text-center">
                                            {index + 1}
                                        </span>
                                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                                            <img
                                                src={URL.createObjectURL(frame)}
                                                alt={`Frame ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {frame.name}
                                            </p>
                                            <p className="text-xs text-foreground-secondary">
                                                {(frame.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFrame(index)}
                                            className="p-2 text-foreground-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove frame"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {frames.length === 0 && (
                    <div className="text-center py-12 text-foreground-secondary">
                        <Film className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium opacity-50">No frames selected</p>
                        <p className="text-sm opacity-30">Upload images to start creating a video</p>
                    </div>
                )}
            </div>
        </div>
    );
};
