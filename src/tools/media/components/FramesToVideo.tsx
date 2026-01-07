import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw, Settings, X, Film } from 'lucide-react';
import { Slider } from '../../../components/ui/Slider';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { logger } from '../../../utils/logger';

export const FramesToVideo: React.FC = () => {
    const [frames, setFrames] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [videoSettings, setVideoSettings] = useState({
        fps: 24,
        codec: 'libx264' as 'libx264' | 'libvpx',
        quality: 'high' as 'low' | 'medium' | 'high'
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

    const createVideo = async () => {
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
            const mediaStream = canvas.captureStream(videoSettings.fps);
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

            // Draw frames to canvas at specified rate
            const frameInterval = 1000 / videoSettings.fps;
            const startTime = Date.now();

            const drawFrame = () => {
                const elapsed = Date.now() - startTime;
                const targetFrameIndex = Math.floor(elapsed / frameInterval);

                if (targetFrameIndex < images.length) {
                    ctx.drawImage(images[Math.min(targetFrameIndex, images.length - 1)], 0, 0);
                    const renderProgress = Math.floor(50 + (targetFrameIndex / images.length) * 50);
                    setProgress(renderProgress);
                    setProcessingStatus(`Rendering frame ${Math.min(targetFrameIndex + 1, images.length)}/${images.length}...`);
                    requestAnimationFrame(drawFrame);
                } else {
                    setProcessingStatus('Finalizing video file...');
                    mediaRecorder.stop();
                }
            };

            drawFrame();
        } catch (error) {
            console.error('Video creation failed:', error);
            logger.error('Video creation error:', error);
            alert('Failed to create video. Check console for details.');
            setIsProcessing(false);
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
            <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
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
