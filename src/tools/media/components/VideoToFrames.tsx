import React, { useState, useRef } from 'react';
import { 
    Upload, Download, Play, RotateCcw, Video, Settings, Film, Grid, GalleryHorizontal, 
    ChevronLeft, ChevronRight, Clock, Scan, List, Pencil, X } from 'lucide-react';
import { FrameEditor } from './FrameEditor';
import JSZip from 'jszip';
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
    const [viewMode, setViewMode] = useState<'grid' | 'slide'>('grid');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [extractionSettings, setExtractionSettings] = useState({
        mode: 'fps' as 'fps' | 'scene' | 'timestamps',
        fps: 1,
        sceneThreshold: 15, // 0-100% difference
        timestamps: '', // "00:05, 01:20"
        startTime: 0,
        endTime: 0,
        quality: 0.8,
        format: 'png' as 'png' | 'jpg' | 'webp',
        detectDuplicates: false
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

    const calculateFrameDiff = (ctx1: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D, width: number, height: number): number => {
        const data1 = ctx1.getImageData(0, 0, width, height).data;
        const data2 = ctx2.getImageData(0, 0, width, height).data;
        let diff = 0;
        let pixels = 0;

        for (let i = 0; i < data1.length; i += 4) {
            // Compare RGB only
            const r = Math.abs(data1[i] - data2[i]);
            const g = Math.abs(data1[i + 1] - data2[i + 1]);
            const b = Math.abs(data1[i + 2] - data2[i + 2]);
            
            diff += (r + g + b) / 3;
            pixels++;
        }

        // Return percentage difference (0-100)
        return (diff / pixels / 255) * 100;
    };

    const parseTimestamps = (input: string): number[] => {
        return input.split(/[,;\n]/).map(t => {
            t = t.trim();
            if (!t) return -1;
            // Support "MM:SS" or "HH:MM:SS" or seconds
            const parts = t.split(':').map(p => parseFloat(p));
            if (parts.some(isNaN)) return -1;
            
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return parts[0];
        }).filter(t => t >= 0).sort((a, b) => a - b);
    };

    const extractFrames = async () => {
        if (!videoFile || !videoMetadata) return;

        logger.info('Starting frame extraction:', extractionSettings);
        setIsProcessing(true);
        setProcessingStatus(`Loading video: ${videoFile.name}...`);

        const fileUrl = URL.createObjectURL(videoFile);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.src = fileUrl;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Small canvas for diffing
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = 64; 
        diffCanvas.height = 64;
        const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });
        
        // Check prev frame for scene detection
        const prevCanvas = document.createElement('canvas');
        prevCanvas.width = 64;
        prevCanvas.height = 64;
        const prevCtx = prevCanvas.getContext('2d', { willReadFrequently: true });

        if (!ctx || !diffCtx || !prevCtx) return;

        canvas.width = videoMetadata.width;
        canvas.height = videoMetadata.height;

        const extractedFrames: FrameData[] = [];
        let frameIndex = 0;

        // Determine seek points
        let seekTime = extractionSettings.startTime;
        const endTime = extractionSettings.endTime;
        
        // Strategy setup
        let nextSeek = (current: number) => current + (1 / extractionSettings.fps);
        let shouldCapture = async (): Promise<boolean> => true;

        if (extractionSettings.mode === 'timestamps') {
            const timestamps = parseTimestamps(extractionSettings.timestamps);
            let tsIndex = 0;
            seekTime = timestamps[0] || -1;
            if (seekTime === -1) {
                setIsProcessing(false);
                setProcessingStatus('No valid timestamps found');
                return;
            }
            nextSeek = () => {
                tsIndex++;
                if (tsIndex < timestamps.length) return timestamps[tsIndex];
                return endTime + 1; // Finish
            };
        } else if (extractionSettings.mode === 'scene') {
            // For scene detection, we scan at a faster rate (e.g., 2fps or custom) but only capture on change
            // Or we use the FPS slider as the "Scan Rate"
            seekTime = extractionSettings.startTime;
            let hasCapturedFirst = false;
            
            shouldCapture = async () => {
                diffCtx.drawImage(video, 0, 0, 64, 64);
                
                if (!hasCapturedFirst) {
                    prevCtx.drawImage(diffCanvas, 0, 0);
                    hasCapturedFirst = true;
                    return true;
                }

                const diff = calculateFrameDiff(diffCtx, prevCtx, 64, 64);
                if (diff >= extractionSettings.sceneThreshold) {
                    prevCtx.drawImage(diffCanvas, 0, 0); // Update prev
                    return true;
                }
                return false;
            };
        } else {
            // FPS Mode (Interval)
            seekTime = extractionSettings.startTime;
            let hasCapturedFirst = false;

            if (extractionSettings.detectDuplicates) {
                 shouldCapture = async () => {
                    diffCtx.drawImage(video, 0, 0, 64, 64);
                    
                    if (!hasCapturedFirst) {
                        prevCtx.drawImage(diffCanvas, 0, 0);
                        hasCapturedFirst = true;
                        return true;
                    }

                    const diff = calculateFrameDiff(diffCtx, prevCtx, 64, 64);
                    // 2% threshold for duplicates
                    if (diff > 2) { 
                        prevCtx.drawImage(diffCanvas, 0, 0);
                        return true;
                    }
                    return false;
                 };
            }
        }

        return new Promise<void>((resolve, reject) => {
            const onSeeked = async () => {
                if (seekTime <= endTime) {
                    try {
                        const captureFrame = await shouldCapture();
                        
                        if (captureFrame) {
                            ctx.drawImage(video, 0, 0);
                            
                            // To Blob
                            await new Promise<void>(res => {
                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        extractedFrames.push({
                                            blob,
                                            timestamp: seekTime,
                                            index: frameIndex++
                                        });
                                        // Update UI less frequently to avoid lag
                                        if (frameIndex % 5 === 0) {
                                            setProcessingStatus(`Extracted ${frameIndex} frames...`);
                                        }
                                    }
                                    res();
                                }, `image/${extractionSettings.format}`, extractionSettings.quality);
                            });
                        }

                        // Report progress
                        const range = endTime - extractionSettings.startTime;
                        const progress = range > 0 ? ((seekTime - extractionSettings.startTime) / range) * 100 : 0;
                        setProgress(Math.min(100, Math.floor(progress)));

                        // Next
                        seekTime = nextSeek(seekTime);
                        if (seekTime <= endTime) {
                            video.currentTime = seekTime;
                        } else {
                            finish();
                        }
                    } catch (err) {
                        logger.error('Error processing frame:', err);
                        finish();
                    }
                } else {
                    finish();
                }
            };

            const finish = () => {
                video.removeEventListener('seeked', onSeeked);
                setFrames(extractedFrames);
                setIsProcessing(false);
                setProcessingStatus(`Complete! ${extractedFrames.length} frames extracted.`);
                URL.revokeObjectURL(fileUrl);
                resolve();
            };

            video.onerror = (e) => {
                logger.error('Video error:', e);
                setIsProcessing(false);
                URL.revokeObjectURL(fileUrl);
                reject(new Error('Video loading failed'));
            };

            video.addEventListener('seeked', onSeeked);

            // Trigger load and start
            video.onloadeddata = () => {
                setProcessingStatus(`Video loaded. Starting extraction (${extractionSettings.mode})...`);
                video.currentTime = seekTime;
            };
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

    const handleEditFrame = (index: number) => {
        setEditingFrameIndex(index);
    };

    const handleSaveFrame = (blob: Blob) => {
        if (editingFrameIndex === null) return;
        
        const newFrames = [...frames];
        const frame = newFrames[editingFrameIndex];
        
        // Create new object for the updated frame
        newFrames[editingFrameIndex] = {
            ...frame,
            blob: blob
        };
        
        setFrames(newFrames);
        setEditingFrameIndex(null);
    };

    const handleCancelEdit = () => {
        setEditingFrameIndex(null);
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

    if (editingFrameIndex !== null && frames[editingFrameIndex]) {
         return (
             <div className="h-full flex flex-col p-1">
                 <div className="flex items-center justify-between mb-2 px-2">
                     <h2 className="font-semibold text-foreground flex items-center gap-2">
                         <Pencil className="w-4 h-4" /> Editing Frame #{frames[editingFrameIndex].index}
                     </h2>
                 </div>
                 <div className="flex-1 overflow-hidden rounded-lg border border-border-glass shadow-xl">
                     <FrameEditor 
                         imageUrl={URL.createObjectURL(frames[editingFrameIndex].blob)}
                         onSave={handleSaveFrame}
                         onCancel={handleCancelEdit}
                     />
                 </div>
             </div>
         )
    }

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
                                        {/* Extraction Mode Tabs */}
                                        <div className="grid grid-cols-3 bg-glass-background/30 p-1 rounded-lg">
                                            {[
                                                { id: 'fps', label: 'Interval', icon: Clock },
                                                { id: 'scene', label: 'Scene', icon: Scan },
                                                { id: 'timestamps', label: 'Manual', icon: List }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => setExtractionSettings(prev => ({ ...prev, mode: mode.id as any }))}
                                                    className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${extractionSettings.mode === mode.id
                                                        ? 'bg-indigo-500/20 text-indigo-400 shadow-sm'
                                                        : 'text-foreground-secondary hover:text-foreground hover:bg-white/5'
                                                    }`}
                                                >
                                                    <mode.icon className="w-3.5 h-3.5" />
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>

                                        {extractionSettings.mode === 'fps' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <Slider
                                                    label="Frame Rate (FPS)"
                                                    value={extractionSettings.fps}
                                                    min={0.1}
                                                    max={30}
                                                    step={0.1}
                                                    onChange={(val) => setExtractionSettings(prev => ({ ...prev, fps: val }))}
                                                    unit=" FPS"
                                                />
                                                
                                                <div className="flex items-center justify-between bg-glass-background/30 p-3 rounded-lg border border-border-glass">
                                                    <div className="space-y-0.5">
                                                        <label className="text-xs font-medium text-foreground">Smart Sampling</label>
                                                        <p className="text-[10px] text-foreground-secondary">Skip duplicate frames</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={extractionSettings.detectDuplicates}
                                                        onChange={(e) => setExtractionSettings(prev => ({ ...prev, detectDuplicates: e.target.checked }))}
                                                        className="w-4 h-4 rounded border-border-glass bg-glass-panel text-indigo-500 focus:ring-indigo-500/50"
                                                    />
                                                </div>

                                                <div className="p-3 bg-glass-background/30 rounded-lg text-center">
                                                    <p className="text-xs text-foreground-secondary">Estimated Output</p>
                                                    <p className="text-lg font-bold text-indigo-400">
                                                        ~{Math.floor((extractionSettings.endTime - extractionSettings.startTime) * extractionSettings.fps)} frames
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {extractionSettings.mode === 'scene' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="bg-glass-background/50 p-3 rounded-lg border border-indigo-500/20">
                                                    <p className="text-xs text-foreground-secondary mb-2">How it works</p>
                                                    <p className="text-sm text-foreground">
                                                        Analyzes video for significant visual changes to capture shots automatically.
                                                    </p>
                                                </div>
                                                <Slider
                                                    label="Sensitivity Threshold"
                                                    value={extractionSettings.sceneThreshold}
                                                    min={1}
                                                    max={50}
                                                    step={1}
                                                    onChange={(val) => setExtractionSettings(prev => ({ ...prev, sceneThreshold: val }))}
                                                    unit="%"
                                                />
                                                <Slider
                                                    label="Scan Rate (FPS)"
                                                    value={extractionSettings.fps}
                                                    min={1}
                                                    max={10}
                                                    step={1}
                                                    onChange={(val) => setExtractionSettings(prev => ({ ...prev, fps: val }))}
                                                    unit=" Hz"
                                                />
                                                <p className="text-xs text-foreground-secondary">Higher scan rate = more accurate but slower.</p>
                                            </div>
                                        )}

                                        {extractionSettings.mode === 'timestamps' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-foreground-secondary flex justify-between">
                                                        <span>Timestamps (comma/newline separated)</span>
                                                        <span className="text-xs text-indigo-400 cursor-pointer hover:underline" onClick={() => setExtractionSettings(prev => ({ ...prev, timestamps: "00:05, 01:23, 10:00" }))}>Load Example</span>
                                                    </label>
                                                    <textarea
                                                        value={extractionSettings.timestamps}
                                                        onChange={(e) => setExtractionSettings(prev => ({ ...prev, timestamps: e.target.value }))}
                                                        placeholder="e.g. 05:22, 12:30 or 120.5"
                                                        className="w-full bg-input-bg border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="border-t border-border-glass pt-4"></div>

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
                                            <div className="flex gap-2 items-center">
                                                <div className="flex bg-glass-panel border border-border-glass rounded-lg p-1 mr-2">
                                                    <button
                                                        onClick={() => setViewMode('grid')}
                                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-foreground-secondary hover:text-foreground hover:bg-white/5'}`}
                                                        title="Grid View"
                                                    >
                                                        <Grid className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('slide')}
                                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'slide' ? 'bg-indigo-500/20 text-indigo-400' : 'text-foreground-secondary hover:text-foreground hover:bg-white/5'}`}
                                                        title="Slide View"
                                                    >
                                                        <GalleryHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <Button size="sm" variant="secondary" icon={Download} onClick={downloadAsZip}>
                                                    Download ZIP
                                                </Button>
                                            </div>
                                        </div>

                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                                {frames.map((frame, idx) => (
                                                    <div
                                                        key={frame.index}
                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-border-glass bg-black/50 hover:border-indigo-500/50 transition-all shadow-sm cursor-pointer"
                                                        onClick={() => {
                                                            setCurrentSlideIndex(idx);
                                                            setViewMode('slide');
                                                        }}
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(frame.blob)}
                                                            alt={`Frame ${frame.index}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-white font-mono">
                                                                    #{frame.index}
                                                                </span>
                                                                <span className="text-[10px] text-white/70 font-mono">
                                                                    {frame.timestamp.toFixed(2)}s
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditFrame(idx);
                                                                }}
                                                                className="p-1.5 bg-indigo-500/80 rounded hover:bg-indigo-500 text-white transition-colors"
                                                                title="Edit Frame"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                <div className="relative h-[400px] bg-black/40 rounded-xl border border-border-glass flex items-center justify-center p-4 group overflow-hidden">
                                                    {frames[currentSlideIndex] && (
                                                        <>
                                                            <img
                                                                src={URL.createObjectURL(frames[currentSlideIndex].blob)}
                                                                alt={`Frame ${frames[currentSlideIndex].index}`}
                                                                className="max-w-full max-h-full object-contain shadow-2xl"
                                                            />
                                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white/90">
                                                                {frames[currentSlideIndex].timestamp.toFixed(3)}s
                                                            </div>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                                        disabled={currentSlideIndex === 0}
                                                        className="absolute left-4 p-3 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-indigo-500 hover:border-indigo-400 disabled:opacity-30 disabled:hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 cursor-pointer"
                                                    >
                                                        <ChevronLeft className="w-6 h-6" />
                                                    </button>

                                                    <button
                                                        onClick={() => setCurrentSlideIndex(prev => Math.min(frames.length - 1, prev + 1))}
                                                        disabled={currentSlideIndex === frames.length - 1}
                                                        className="absolute right-4 p-3 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-indigo-500 hover:border-indigo-400 disabled:opacity-30 disabled:hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 translate-x-[10px] group-hover:translate-x-0"
                                                    >
                                                        <ChevronRight className="w-6 h-6" />
                                                    </button>

                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/80 font-mono">
                                                            Frame {frames[currentSlideIndex]?.index} ({currentSlideIndex + 1}/{frames.length})
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            variant="primary" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditFrame(currentSlideIndex);
                                                            }}
                                                            icon={Pencil}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="bg-glass-panel/50 border border-border-glass rounded-xl p-4">
                                                    <Slider
                                                        value={currentSlideIndex}
                                                        min={0}
                                                        max={Math.max(0, frames.length - 1)}
                                                        step={1}
                                                        onChange={(val) => setCurrentSlideIndex(val)}
                                                        label="Timeline Navigation"
                                                        // Using the timestamp as the unit might be confusing on a slider, stick to index or just empty
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between mt-1 text-xs text-foreground-secondary font-mono">
                                                        <span>00:00</span>
                                                        <span>{(frames[frames.length - 1]?.timestamp || 0).toFixed(2)}s</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
