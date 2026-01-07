import React, { useState, useRef } from 'react';
import { 
    Upload, Download, Play, RotateCcw, Video, Settings, Film, Grid, GalleryHorizontal, 
    ChevronLeft, ChevronRight, Clock, Scan, List, Pencil, X,  CheckSquare, FolderOutput, ChartBar, Activity, Zap, Scissors, MonitorPlay, Smartphone, Trash2, Filter, MoreHorizontal, FileVideo } from 'lucide-react';
import { FrameEditor } from './FrameEditor';
import { TimelineEditor } from './TimelineEditor';
import JSZip from 'jszip';
import { Slider } from '../../../components/ui/Slider';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { logger } from '../../../utils/logger';
import { analyzeImage, type FrameAnalysisResult } from '../utils/imageAnalysis';

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
        detectDuplicates: false,
        targetWidth: 0, // 0 means original
        targetHeight: 0
    });
    const [videoMetadata, setVideoMetadata] = useState<{
        duration: number;
        width: number;
        height: number;
    } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Export & Organization State
    const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        namingPattern: '{video}_{index}_{timestamp}',
        includeMetadata: true,
        zipFilename: 'frames_export'
    });
    const [showSelectionMenu, setShowSelectionMenu] = useState(false);

    // Analytics State
    const [analyticsData, setAnalyticsData] = useState<Map<number, FrameAnalysisResult>>(new Map());
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Drag & Drop State
    const [draggedFrameIndex, setDraggedFrameIndex] = useState<number | null>(null);

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

    const applyPreset = (preset: 'high' | 'web' | 'draft' | 'detailed') => {
        switch (preset) {
            case 'high': // PNG, Lossless, Normal FPS
                setExtractionSettings(prev => ({ ...prev, format: 'png', fps: 1, quality: 1, detectDuplicates: false }));
                break;
            case 'web': // WebP, Good compression
                setExtractionSettings(prev => ({ ...prev, format: 'webp', fps: 1, quality: 0.8, detectDuplicates: true }));
                break;
            case 'draft': // JPG, Low quality, Low FPS
                setExtractionSettings(prev => ({ ...prev, format: 'jpg', fps: 0.5, quality: 0.6, detectDuplicates: false }));
                break;
            case 'detailed': // PNG, High FPS
                setExtractionSettings(prev => ({ ...prev, format: 'png', fps: 5, quality: 1, detectDuplicates: false }));
                break;
        }
    };

    const applyPlatformPreset = (preset: 'instagram_story' | 'instagram_post' | 'tiktok' | 'youtube_1080p' | 'twitter') => {
        const presets = {
            instagram_story: { fps: 30, targetWidth: 1080, targetHeight: 1920, format: 'jpg' as const },
            instagram_post: { fps: 30, targetWidth: 1080, targetHeight: 1080, format: 'jpg' as const },
            tiktok: { fps: 30, targetWidth: 1080, targetHeight: 1920, format: 'jpg' as const },
            youtube_1080p: { fps: 60, targetWidth: 1920, targetHeight: 1080, format: 'jpg' as const },
            twitter: { fps: 30, targetWidth: 1280, targetHeight: 720, format: 'jpg' as const },
        };
        const p = presets[preset];
        setExtractionSettings(prev => ({
            ...prev,
            fps: p.fps,
            targetWidth: p.targetWidth,
            targetHeight: p.targetHeight,
            format: p.format
        }));
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

        // Determine output size
        const targetWidth = extractionSettings.targetWidth || videoMetadata.width;
        const targetHeight = extractionSettings.targetHeight || videoMetadata.height;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

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
            const finish = () => {
                video.removeEventListener('seeked', onSeeked);
                setFrames(extractedFrames);
                setIsProcessing(false);
                setProcessingStatus(`Complete! ${extractedFrames.length} frames extracted.`);
                URL.revokeObjectURL(fileUrl);
                resolve();
            };

            const onSeeked = async () => {
                if (seekTime <= endTime) {
                    try {
                        const captureFrame = await shouldCapture();
                        
                        if (captureFrame) {
                            // Draw resized/contain logic
                            // For simplicity, we stretch or fit. 
                            // Ideally we center crop or letterbox. Let's do a simple "cover" draw
                            const srcRatio = video.videoWidth / video.videoHeight;
                            const dstRatio = targetWidth / targetHeight;
                            
                            let drawWidth = targetWidth;
                            let drawHeight = targetHeight;
                            let offsetX = 0;
                            let offsetY = 0;

                            if (srcRatio > dstRatio) {
                                // Source is wider than dest: Crop sides
                                drawHeight = targetHeight;
                                drawWidth = drawHeight * srcRatio;
                                offsetX = (targetWidth - drawWidth) / 2;
                            } else {
                                // Source is taller than dest: Crop top/bottom
                                drawWidth = targetWidth;
                                drawHeight = drawWidth / srcRatio;
                                offsetY = (targetHeight - drawHeight) / 2;
                            }

                            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
                            
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



    const toggleFrameSelection = (index: number) => {
        const newSelected = new Set(selectedFrames);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedFrames(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedFrames.size === frames.length) {
            setSelectedFrames(new Set());
        } else {
            setSelectedFrames(new Set(frames.map(f => f.index)));
        }
    };

    const selectEveryNth = (n: number) => {
        const newSelected = new Set<number>();
        frames.forEach((f, i) => {
            if ((i + 1) % n === 0) newSelected.add(f.index);
        });
        setSelectedFrames(newSelected);
        setShowSelectionMenu(false);
    };

    const invertSelection = () => {
        const newSelected = new Set<number>();
        frames.forEach(f => {
            if (!selectedFrames.has(f.index)) newSelected.add(f.index);
        });
        setSelectedFrames(newSelected);
        setShowSelectionMenu(false);
    };

    const deleteSelected = () => {
        const newFrames = frames.filter(f => !selectedFrames.has(f.index));
        setFrames(newFrames);
        setSelectedFrames(new Set());
        // Clean up analytics for deleted frames to save memory
        const newAnalytics = new Map(analyticsData);
        selectedFrames.forEach(idx => newAnalytics.delete(idx));
        setAnalyticsData(newAnalytics);
    };



    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedFrameIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedFrameIndex === null || draggedFrameIndex === dropIndex) return;

        const newFrames = [...frames];
        const [movedFrame] = newFrames.splice(draggedFrameIndex, 1);
        newFrames.splice(dropIndex, 0, movedFrame);
        
        setFrames(newFrames);
        setDraggedFrameIndex(null);
    };

    const exportAsVideo = async () => {
        if (frames.length === 0) return;
        setIsProcessing(true);
        setProcessingStatus('Generating video...');

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set output size
            const width = extractionSettings.targetWidth || videoMetadata?.width || 1920;
            const height = extractionSettings.targetHeight || videoMetadata?.height || 1080;
            canvas.width = width;
            canvas.height = height;

            // Determine MIME type
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
                ? 'video/webm;codecs=vp9' 
                : 'video/webm';

            const stream = canvas.captureStream(extractionSettings.fps || 30);
            const recorder = new MediaRecorder(stream, { 
                mimeType, 
                videoBitsPerSecond: 8000000 // 8 Mbps
            });
            
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `video_export_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setIsProcessing(false);
                setProcessingStatus('');
            };

            recorder.start();

            // Draw frames
            if (ctx) {
                // Calculate duration per frame to match target FPS
                const targetFps = extractionSettings.fps || 1;
                const frameDurationMs = 1000 / targetFps;

                for (const frame of frames) {
                    const img = await createImageBitmap(frame.blob);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, width, height);
                    
                    // Center fit logic logic
                    const scale = Math.min(width / img.width, height / img.height);
                    const x = (width / 2) - (img.width / 2) * scale;
                    const y = (height / 2) - (img.height / 2) * scale;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    img.close();

                    await new Promise(r => setTimeout(r, frameDurationMs));
                }
            }
            
            recorder.stop();
        } catch (error) {
            console.error('Video export failed:', error);
            logger.error('Video export failed', error);
            setIsProcessing(false);
            setProcessingStatus('Export failed');
        }
    };

    const formatFilename = (pattern: string, frame: FrameData, videoName: string, ext: string) => {
        let name = pattern;
        const vName = videoName.split('.')[0] || 'video';
        
        name = name.replace(/{video}/g, vName);
        name = name.replace(/{index}/g, frame.index.toString().padStart(4, '0'));
        name = name.replace(/{timestamp}/g, frame.timestamp.toFixed(2).replace('.', '_'));
        
        // Sanitize
        return `${name.replace(/[^a-z0-9_\-]/gi, '_')}.${ext}`;
    };

    const handleExport = async () => {
        if (frames.length === 0) return;

        const framesToExport = selectedFrames.size > 0 
            ? frames.filter(f => selectedFrames.has(f.index))
            : frames;

        try {
            const zip = new JSZip();
            const format = extractionSettings.format;
            const videoName = videoFile?.name || 'video';

            // frames
            framesToExport.forEach((frame) => {
                const filename = formatFilename(exportConfig.namingPattern, frame, videoName, format);
                zip.file(filename, frame.blob);
            });

            // metadata
            if (exportConfig.includeMetadata) {
                const metadata = {
                    source_video: videoName,
                    export_date: new Date().toISOString(),
                    total_frames: framesToExport.length,
                    format: format,
                    frames: framesToExport.map(f => ({
                        index: f.index,
                        timestamp: f.timestamp,
                        filename: formatFilename(exportConfig.namingPattern, f, videoName, format),
                        size_bytes: f.blob.size
                    }))
                };
                zip.file('metadata.json', JSON.stringify(metadata, null, 2));
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportConfig.zipFilename}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setShowExportOptions(false);
        } catch (error) {
            console.error('Export failed:', error);
            logger.error('Export failed', error);
        }
    };
    
    // Kept generic download for backward compat or quick actions if needed
    // const downloadAsZip = () => setShowExportOptions(true);

    const runAnalytics = async () => {
        setIsAnalyzing(true);
        setShowAnalytics(true);
        const results = new Map<number, FrameAnalysisResult>();
        
        // Analyze in chunks to not block UI
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const data = await analyzeImage(frame.blob);
            results.set(frame.index, data);
            
            // Update UI every 10 frames
            if (i % 10 === 0) {
                 setAnalyticsData(new Map(results));
            }
            // Small break
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
        }
        setAnalyticsData(results);
        setIsAnalyzing(false);
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
            <div className="space-y-6 mx-auto w-full pb-10">
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

                                    {/* Quality Presets */}
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {[
                                            { id: 'high', label: 'High' },
                                            { id: 'web', label: 'Web' },
                                            { id: 'draft', label: 'Draft' },
                                            { id: 'detailed', label: 'Detailed' }
                                        ].map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => applyPreset(preset.id as any)}
                                                className="px-2 py-1.5 rounded-md text-xs font-medium bg-glass-panel border border-border-glass text-foreground-secondary hover:text-indigo-400 hover:border-indigo-500/50 transition-all"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
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

                                    {/* Timeline Editor */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-foreground-secondary flex items-center gap-2">
                                                <Scissors className="w-3.5 h-3.5" />
                                                Video Range
                                            </label>
                                        </div>
                                        
                                        <TimelineEditor 
                                            videoFile={videoFile}
                                            duration={videoMetadata?.duration || 0}
                                            startTime={extractionSettings.startTime}
                                            endTime={extractionSettings.endTime}
                                            onRangeChange={(start, end) => setExtractionSettings(prev => ({ ...prev, startTime: start, endTime: end }))}
                                        />
                                    </div>

                                        <div className="space-y-4 pt-4 border-t border-border-glass">
                                            <label className="text-xs font-medium text-foreground-secondary flex items-center justify-between">
                                                <span>Output Resolution</span>
                                                <button 
                                                    onClick={() => setExtractionSettings(prev => ({...prev, targetWidth: 0, targetHeight: 0}))} 
                                                    className="text-[10px] text-indigo-400 hover:underline"
                                                >
                                                    Reset to Original
                                                </button>
                                            </label>
                                            
                                            {/* Platform Presets */}
                                            <div className="grid grid-cols-5 gap-1">
                                                <button onClick={() => applyPlatformPreset('instagram_story')} title="IG Story" className="p-2 bg-glass-background/40 hover:bg-glass-panel rounded border border-white/5 flex items-center justify-center">
                                                    <Smartphone className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => applyPlatformPreset('instagram_post')} title="IG Post" className="p-2 bg-glass-background/40 hover:bg-glass-panel rounded border border-white/5 flex items-center justify-center text-[10px] font-bold">1:1</button>
                                                <button onClick={() => applyPlatformPreset('youtube_1080p')} title="YouTube HD" className="p-2 bg-glass-background/40 hover:bg-glass-panel rounded border border-white/5 flex items-center justify-center">
                                                    <MonitorPlay className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => applyPlatformPreset('tiktok')} title="TikTok" className="p-2 bg-glass-background/40 hover:bg-glass-panel rounded border border-white/5 flex items-center justify-center text-[10px] font-bold">9:16</button>
                                                <button onClick={() => applyPlatformPreset('twitter')} title="Twitter" className="p-2 bg-glass-background/40 hover:bg-glass-panel rounded border border-white/5 flex items-center justify-center text-[10px] font-bold">16:9</button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                 <div className="relative">
                                                     <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-xs text-foreground-secondary">W</div>
                                                     <Input 
                                                         type="number" 
                                                         placeholder="Width" 
                                                         value={extractionSettings.targetWidth || ''}
                                                         onChange={(e) => setExtractionSettings(prev => ({...prev, targetWidth: parseInt(e.target.value) || 0}))}
                                                         className="pl-6 h-8 text-xs bg-glass-background/30" 
                                                     />
                                                 </div>
                                                 <div className="relative">
                                                     <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-xs text-foreground-secondary">H</div>
                                                     <Input 
                                                         type="number" 
                                                         placeholder="Height" 
                                                         value={extractionSettings.targetHeight || ''}
                                                         onChange={(e) => setExtractionSettings(prev => ({...prev, targetHeight: parseInt(e.target.value) || 0}))}
                                                         className="pl-6 h-8 text-xs bg-glass-background/30" 
                                                     />
                                                 </div>
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
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Extracted Frames ({frames.length})
                                            </h3>
                                            
                                            {/* Pagination Info */}
                                            {viewMode === 'grid' && frames.length > ITEMS_PER_PAGE && (
                                                <span className="text-xs text-foreground-secondary ml-2">
                                                    Page {currentPage} of {Math.ceil(frames.length / ITEMS_PER_PAGE)}
                                                </span>
                                            )}

                                            <div className="flex gap-2 items-center">
                                                {/* Selection Controls */}
                                                <div className="flex bg-glass-panel border border-border-glass rounded-lg p-1 mr-2 items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setIsSelectionMode(!isSelectionMode);
                                                            if (isSelectionMode) setSelectedFrames(new Set());
                                                        }}
                                                        className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 ${isSelectionMode ? 'bg-indigo-500/20 text-indigo-400' : 'text-foreground-secondary hover:text-foreground hover:bg-white/5'}`}
                                                        title="Toggle Selection Mode"
                                                    >
                                                        <CheckSquare className="w-4 h-4" />
                                                        {isSelectionMode && <span className="text-xs font-medium pr-1">Done</span>}
                                                    </button>
                                                    
                                                    {isSelectionMode && (
                                                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 ml-2">
                                                            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                                                            <button 
                                                                onClick={toggleSelectAll}
                                                                className="text-xs px-2 py-1 text-foreground-secondary hover:text-foreground rounded hover:bg-white/5"
                                                            >
                                                                {selectedFrames.size === frames.length ? 'None' : 'All'}
                                                            </button>
                                                            
                                                            <div className="relative group">
                                                                <button 
                                                                    onClick={() => setShowSelectionMenu(!showSelectionMenu)}
                                                                    className="flex items-center gap-1 text-xs px-2 py-1 text-foreground-secondary hover:text-foreground rounded hover:bg-white/5"
                                                                >
                                                                    <Filter className="w-3 h-3" />
                                                                    Select...
                                                                </button>
                                                                
                                                                {showSelectionMenu && (
                                                                    <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setShowSelectionMenu(false)} />
                                                                    <div className="absolute top-full left-0 mt-2 w-40 bg-[#18181b] border border-white/10 rounded-lg shadow-xl z-50 py-1 flex flex-col overflow-hidden">
                                                                        <button onClick={() => selectEveryNth(2)} className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">Every 2nd Frame</button>
                                                                        <button onClick={() => selectEveryNth(5)} className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">Every 5th Frame</button>
                                                                        <button onClick={() => selectEveryNth(10)} className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">Every 10th Frame</button>
                                                                        <div className="h-[1px] bg-white/10 my-1"/>
                                                                        <button onClick={invertSelection} className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">Invert Selection</button>
                                                                    </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {selectedFrames.size > 0 && (
                                                                <>
                                                                    <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                                                                    <span className="text-xs text-indigo-400 font-mono px-1">
                                                                        {selectedFrames.size}
                                                                    </span>
                                                                    <button 
                                                                        onClick={deleteSelected}
                                                                        className="flex items-center gap-1 text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded ml-1 transition-colors"
                                                                        title="Delete selected frames from workspace"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

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
                                                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                                                <Button size="sm" variant="secondary" icon={FileVideo} onClick={exportAsVideo} disabled={isAnalyzing || isProcessing} title="Export as Video (WebM)">
                                                    Video
                                                </Button>
                                                <Button size="sm" variant="primary" icon={FolderOutput} onClick={() => setShowExportOptions(true)}>
                                                    Export...
                                                </Button>
                                                <Button size="sm" variant="secondary" icon={ChartBar} onClick={runAnalytics} disabled={isAnalyzing}>
                                                    Analytics
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Frame Grid */}
                                        {viewMode === 'grid' ? (
                                            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-1 mt-4">
                                            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
                                                {frames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((frame, idx) => {
                                                    const realIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                                                    const isSelected = selectedFrames.has(frame.index);
                                                    const analysis = analyticsData.get(frame.index);
                                                    const isDragging = draggedFrameIndex === realIdx;

                                                    return (
                                                        <div 
                                                            key={frame.index} 
                                                            className={`relative group rounded-xl overflow-hidden border transition-all duration-200 ${
                                                                isSelected 
                                                                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/10' 
                                                                    : 'border-border-glass bg-glass-panel hover:border-indigo-500/50'
                                                            } ${isDragging ? 'opacity-50 scale-95 border-dashed border-indigo-400' : ''}`}
                                                            draggable={!isSelectionMode}
                                                            onDragStart={(e) => handleDragStart(e, realIdx)}
                                                            onDragOver={(e) => handleDragOver(e, realIdx)}
                                                            onDrop={(e) => handleDrop(e, realIdx)}
                                                        >
                                                            {/* Selection Overlay */}
                                                            <div 
                                                                className={`absolute inset-0 z-10 transition-colors cursor-pointer ${
                                                                    isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/5'
                                                                }`}
                                                                onClick={(e) => {
                                                                    if (e.target === e.currentTarget) {
                                                                        if (isSelectionMode) {
                                                                            toggleFrameSelection(frame.index);
                                                                        } else {
                                                                            handleEditFrame(realIdx);
                                                                        }
                                                                    }
                                                                }}
                                                            />

                                                            {/* Image */}
                                                            <img 
                                                                src={URL.createObjectURL(frame.blob)} 
                                                                className="w-full aspect-video object-cover" 
                                                                loading="lazy"
                                                            />
                                                            
                                                            {/* Info Tag */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <div className="flex justify-between items-end">
                                                                    <div>
                                                                        <p className="text-[10px] font-mono text-white/80">#{frame.index.toString().padStart(3, '0')}</p>
                                                                        <p className="text-[10px] text-white/60">{new Date(frame.timestamp * 1000).toISOString().substr(14, 5)}</p>
                                                                    </div>
                                                                    {analysis && (
                                                                        <div className={`text-[10px] px-1 rounded ${analysis.blurScore < 50 ? 'bg-red-500/50 text-white' : 'bg-green-500/50 text-white'}`}>
                                                                            {Math.round(analysis.blurScore)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Selection Checkbox (Visual) */}
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-md p-0.5 shadow-lg animate-in zoom-in duration-200">
                                                                    <CheckSquare className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Pagination */}
                                            {frames.length > ITEMS_PER_PAGE && (
                                                <div className="flex items-center justify-center gap-4 mt-6 py-4">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-50 transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm text-foreground-secondary font-mono">
                                                        {currentPage} / {Math.ceil(frames.length / ITEMS_PER_PAGE)}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(frames.length / ITEMS_PER_PAGE), p + 1))}
                                                        disabled={currentPage === Math.ceil(frames.length / ITEMS_PER_PAGE)}
                                                        className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-50 transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
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

                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center transition-opacity">
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
            {/* Analytics Modal */}
            {showAnalytics && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-400" />
                                Video Analytics Report
                            </h3>
                            <button onClick={() => setShowAnalytics(false)} className="text-white/50 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {isAnalyzing && (
                                <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                                    <Zap className="w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-medium">Analyzing frames... ({analyticsData.size} / {frames.length})</span>
                                </div>
                            )}

                            {!isAnalyzing && analyticsData.size > 0 && (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs text-white/50 mb-1">Total Frames Analyzed</p>
                                            <p className="text-2xl font-bold text-white">{analyticsData.size}</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs text-white/50 mb-1">Average Brightness</p>
                                            <p className="text-2xl font-bold text-white">
                                                {Math.round(Array.from(analyticsData.values()).reduce((acc, curr) => acc + curr.brightness, 0) / analyticsData.size)}
                                                 <span className="text-sm font-normal text-white/40 ml-1">/ 255</span>
                                            </p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs text-white/50 mb-1">Sharpest Frame</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                #{Array.from(analyticsData.entries()).sort((a,b) => b[1].blurScore - a[1].blurScore)[0]?.[0]}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Blur/Quality Graph Visualization */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-white/80">Quality & Blur Analysis</h4>
                                        <div className="h-40 flex items-end gap-[1px] bg-black/40 rounded-lg p-2 border border-white/5 overflow-hidden">
                                            {frames.map((frame) => {
                                                const data = analyticsData.get(frame.index);
                                                if (!data) return null;
                                                // Normalize blur score for viz (usually 0-500 depending on image, clamping for display)
                                                const height = Math.min(100, Math.max(5, (data.blurScore / 1000) * 100)); 
                                                 return (
                                                    <div 
                                                        key={frame.index} 
                                                        className="flex-1 bg-indigo-500/50 hover:bg-indigo-400 transition-colors min-w-[2px] relative group"
                                                        style={{ height: `${height}%` }}
                                                    >
                                                         <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                                             Frame #{frame.index} - Score: {Math.round(data.blurScore)}
                                                         </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-white/40 text-center">Frames (Left to Right)</p>
                                    </div>
                                    
                                    {/* Anomalies / Suggestions */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-white/80">Suggestions</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                             {Array.from(analyticsData.entries())
                                                 .filter(([_, data]) => data.blurScore < 50) // Arbitrary threshold for "Blurry"
                                                 .length > 0 ? (
                                                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
                                                         <div className="text-xs text-red-200">
                                                             <span className="font-bold">Blurry Frames Detected:</span> {Array.from(analyticsData.entries()).filter(([_, data]) => data.blurScore < 50).length} frames appear to be blurry or low contrast.
                                                         </div>
                                                         <Button size="xs" variant="ghost" className="text-red-400 hover:bg-red-500/20" onClick={() => {
                                                             const blurryIndices = new Set(Array.from(analyticsData.entries()).filter(([_, data]) => data.blurScore < 50).map(x => x[0]));
                                                             setSelectedFrames(blurryIndices);
                                                             setIsSelectionMode(true);
                                                             setShowAnalytics(false);
                                                         }}>Select Blurry Frames</Button>
                                                     </div>
                                                 ) : (
                                                     <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-200">
                                                         No significantly blurry frames detected.
                                                     </div>
                                                 )
                                             }
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal Overlay */}
            {showExportOptions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <FolderOutput className="w-4 h-4 text-indigo-400" />
                                Export Configuration
                            </h3>
                            <button onClick={() => setShowExportOptions(false)} className="text-white/50 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-white/80">Naming Pattern</label>
                                <div className="space-y-1.5">
                                    <Input 
                                        value={exportConfig.namingPattern}
                                        onChange={(e) => setExportConfig(prev => ({ ...prev, namingPattern: e.target.value }))}
                                        placeholder="{video}_{index}"
                                        className="bg-black/20"
                                    />
                                    <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
                                        <span className="cursor-pointer hover:text-indigo-400" onClick={() => setExportConfig(prev => ({...prev, namingPattern: prev.namingPattern + '{index}'}))}>{'{index}'}</span>
                                        <span className="cursor-pointer hover:text-indigo-400" onClick={() => setExportConfig(prev => ({...prev, namingPattern: prev.namingPattern + '{timestamp}'}))}>{'{timestamp}'}</span>
                                        <span className="cursor-pointer hover:text-indigo-400" onClick={() => setExportConfig(prev => ({...prev, namingPattern: prev.namingPattern + '{video}'}))}>{'{video}'}</span>
                                    </div>
                                    <p className="text-[10px] text-white/50 italic">
                                        Example: {formatFilename(exportConfig.namingPattern, { index: 1, timestamp: 12.5, blob: new Blob() } as any, videoFile?.name || 'video', extractionSettings.format)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-white/80">Options</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            checked={exportConfig.includeMetadata}
                                            onChange={(e) => setExportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                                            id="meta-check"
                                        />
                                        <label htmlFor="meta-check" className="text-xs text-white/70">Include metadata.json</label>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white/50 rounded-sm"></div>
                                        </div>
                                        <span className="text-xs text-white/70">Export selected only ({selectedFrames.size > 0 ? selectedFrames.size : frames.length} frames)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-white/80">Output Filename</label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={exportConfig.zipFilename}
                                        onChange={(e) => setExportConfig(prev => ({ ...prev, zipFilename: e.target.value }))}
                                        className="bg-black/20 flex-1"
                                    />
                                    <span className="text-xs text-white/50 font-mono">.zip</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowExportOptions(false)}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={handleExport} icon={Download}>Download ZIP</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
