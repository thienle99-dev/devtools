import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Square, MousePointer2, Camera, Clock, Globe, Upload } from 'lucide-react';
import { useXnapperStore } from '../store/xnapperStore';
import type { CaptureMode, CaptureSource } from '../types';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const CaptureSection: React.FC = () => {
    const {
        captureMode,
        setCaptureMode,
        setCurrentScreenshot,
        setIsCapturing,
        setShowPreview,
        addToHistory,
        history,
        setCanvasData,
        clearRedactionAreas,
        captureDelay,
        setCaptureDelay,
    } = useXnapperStore();

    const [sources, setSources] = useState<CaptureSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isLoadingSources, setIsLoadingSources] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load available capture sources (screens and windows)
    const loadSources = async () => {
        setIsLoadingSources(true);
        try {
            if ((window as any).screenshotAPI?.getSources) {
                const availableSources = await (window as any).screenshotAPI.getSources();
                setSources(availableSources);
                if (availableSources.length > 0) {
                    setSelectedSource(availableSources[0].id);
                }
            } else {
                // Not in electron, skip loading sources
            }
        } catch (error) {
            console.error('Failed to load capture sources:', error);
            toast.error('Failed to load capture sources');
        } finally {
            setIsLoadingSources(false);
        }
    };

    useEffect(() => {
        if (captureMode === 'window') {
            loadSources();
        }
    }, [captureMode]);

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const img = new Image();
            img.onload = () => {
                const screenshotData = {
                    id: Date.now().toString(),
                    dataUrl,
                    width: img.width,
                    height: img.height,
                    timestamp: Date.now(),
                    format: file.type.split('/')[1] as any,
                };
                setCurrentScreenshot(screenshotData);
                addToHistory(screenshotData);
                setShowPreview(true);
                toast.success('Image uploaded!');
            };
            img.src = dataUrl;
        } catch (err) {
            console.error('Failed to process image:', err);
            toast.error('Failed to load image');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const captureWeb = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" } as any,
                audio: false
            });
            const video = document.createElement("video");
            video.srcObject = stream;
            // Wait for metadata to load
            await new Promise((resolve) => {
                video.onloadedmetadata = () => resolve(true);
            });
            await video.play();

            // Allow a brief moment for the video to actually render a frame
            await new Promise(r => setTimeout(r, 100));

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(video, 0, 0);

            const dataUrl = canvas.toDataURL("image/png");
            stream.getTracks().forEach(track => track.stop());

            return {
                dataUrl,
                width: canvas.width,
                height: canvas.height,
            };
        } catch (err) {
            console.error(err);
            if ((err as DOMException).name !== 'NotAllowedError') {
                toast.error('Browser capture failed');
            }
            return null;
        }
    };

    const performCapture = async () => {
        setIsCapturing(true);

        // Handle Delay
        if (captureDelay > 0) {
            for (let i = captureDelay; i > 0; i--) {
                setCountdown(i);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            setCountdown(null);
        }

        try {
            let screenshot: any = null;
            const api = (window as any).screenshotAPI;

            if (api) {
                if (captureMode === 'fullscreen') {
                    screenshot = await api.captureScreen();
                } else if (captureMode === 'window' && selectedSource) {
                    screenshot = await api.captureWindow(selectedSource);
                } else if (captureMode === 'area') {
                    screenshot = await api.captureArea();
                } else if (captureMode === 'url') {
                    // URL capture logic handled below
                }
            } else {
                // Fallback to Web API for non-URL modes
                if (captureMode !== 'url') {
                    screenshot = await captureWeb();
                }
            }

            // URL mode (can be same for Electron/Web if backend is API based, 
            // but usually Electron uses internal chromium. Here we assume API handles it or fail)
            if (captureMode === 'url') {
                if (!urlInput) {
                    toast.error('Please enter a URL');
                    setIsCapturing(false);
                    return;
                }
                let targetUrl = urlInput;
                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = 'https://' + targetUrl;
                }
                toast.loading('Capturing full page...', { duration: 2000 });
                if (api?.captureUrl) {
                    screenshot = await api.captureUrl(targetUrl);
                } else {
                    toast.error('URL capture requires Electron environment');
                }
            }

            if (screenshot) {
                const screenshotData = {
                    id: Date.now().toString(),
                    dataUrl: screenshot.dataUrl,
                    width: screenshot.width,
                    height: screenshot.height,
                    timestamp: Date.now(),
                    format: 'png' as const,
                };

                setCurrentScreenshot(screenshotData);
                addToHistory(screenshotData);
                setShowPreview(true);
                toast.success('Screenshot captured!');
            }
        } catch (error) {
            console.error('Capture failed:', error);
            toast.error('Failed to capture screenshot');
        } finally {
            setIsCapturing(false);
            setCountdown(null);
        }
    };

    const handleCapture = () => {
        if (captureMode === 'upload') {
            fileInputRef.current?.click();
            return;
        }
        // Just a wrapper to trigger async
        performCapture();
    };

    const captureModes: Array<{ mode: CaptureMode | 'upload'; icon: any; label: string; description: string }> = [
        {
            mode: 'fullscreen',
            icon: Monitor,
            label: 'Full Screen',
            description: 'Capture entire screen',
        },
        {
            mode: 'window',
            icon: Square,
            label: 'Window',
            description: 'Capture a specific window',
        },
        {
            mode: 'area',
            icon: MousePointer2,
            label: 'Area',
            description: 'Select area to capture',
        },
        {
            mode: 'url',
            icon: Globe,
            label: 'Web Page',
            description: 'Capture full scrolling page',
        },
        {
            mode: 'upload',
            icon: Upload,
            label: 'Upload',
            description: 'Import image file',
        },
    ];

    const delayOptions = [0, 3, 5, 10];

    return (
        <div 
            className={cn(
                "space-y-8 min-h-[500px] transition-colors duration-300 rounded-3xl p-4 relative",
                isDragging && "bg-indigo-500/10 border-2 border-dashed border-indigo-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl animate-in fade-in duration-200 pointer-events-none">
                    <Upload className="w-16 h-16 text-indigo-500 animate-bounce mb-4" />
                    <h3 className="text-2xl font-bold text-foreground">Drop image here</h3>
                    <p className="text-foreground-muted">to open in editor</p>
                </div>
            )}

            {/* Hero Section */}
            <div className="text-center space-y-3 py-8">
                <h2 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {captureMode === 'upload' ? 'Upload or Drop Image' : 'Capture Your Screen'}
                </h2>
                <p 
                    className="text-sm max-w-md mx-auto"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    {captureMode === 'upload' 
                        ? 'Drag and drop an image file or click below to browse' 
                        : 'Choose your capture mode and create beautiful screenshots in seconds'}
                </p>
            </div>

            {/* Capture Modes - Premium Cards */}
            <div>
                <h3 
                    className="text-sm font-bold uppercase tracking-wider mb-4"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    Capture Mode
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {captureModes.map(({ mode, icon: Icon, label, description }) => (
                        <button
                            key={mode}
                            onClick={() => setCaptureMode(mode)}
                            className={cn(
                                "group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                                "hover:scale-[1.02] hover:shadow-lg",
                                captureMode === mode
                                    ? "border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-lg shadow-indigo-500/20"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50 hover:bg-glass-panel-light"
                            )}
                        >
                            {/* Selection Indicator */}
                            {captureMode === mode && (
                                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                            
                            {/* Icon with Glow */}
                            <div className={cn(
                                "relative p-4 rounded-2xl transition-all duration-300",
                                captureMode === mode
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                                    : "bg-glass-panel group-hover:bg-indigo-500/10"
                            )}>
                                {captureMode === mode && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
                                )}
                                <Icon className={cn(
                                    "w-8 h-8 relative z-10 transition-colors duration-300",
                                    captureMode === mode ? "text-white" : "text-indigo-400 group-hover:text-indigo-500"
                                )} />
                            </div>
                            
                            {/* Label & Description */}
                            <div className="text-center space-y-1">
                                <div 
                                    className="font-bold text-base"
                                    style={{ 
                                        color: captureMode === mode 
                                            ? 'var(--color-text-primary)' 
                                            : 'var(--color-text-secondary)'
                                    }}
                                >
                                    {label}
                                </div>
                                <div 
                                    className="text-xs"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Timer Delay - Refined */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock 
                        className="w-4 h-4"
                        style={{ color: 'var(--color-text-muted)' }}
                    />
                    <h3 
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Timer Delay
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {delayOptions.map((seconds) => (
                        <button
                            key={seconds}
                            onClick={() => setCaptureDelay(seconds)}
                            className={cn(
                                "flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                                captureDelay === seconds
                                    ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "bg-glass-panel border-border-glass hover:border-indigo-500/30 hover:bg-glass-panel-light"
                            )}
                            style={{
                                color: captureDelay === seconds 
                                    ? '#818cf8' 
                                    : 'var(--color-text-secondary)'
                            }}
                        >
                            {seconds === 0 ? 'Instant' : `${seconds}s`}
                        </button>
                    ))}
                </div>
            </div>

            {captureMode === 'window' && (
                <div className="space-y-3">
                    <h3 
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <Square className="w-4 h-4 inline mr-2" />
                        Select Window
                    </h3>
                    {(window as any).screenshotAPI ? (
                        /* Electron Window Selection */
                        isLoadingSources ? (
                            <div 
                                className="text-center py-12 text-sm"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                                <p>Loading windows...</p>
                            </div>
                        ) : sources.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                {sources.map((source) => (
                                    <button
                                        key={source.id}
                                        onClick={() => setSelectedSource(source.id)}
                                        className={cn(
                                            "group relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                            selectedSource === source.id
                                                ? "border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-lg shadow-indigo-500/20"
                                                : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                                        )}
                                    >
                                        {/* Selection Indicator */}
                                        {selectedSource === source.id && (
                                            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                                        )}
                                        
                                        <img
                                            src={source.thumbnail}
                                            alt={source.name}
                                            className="w-full h-28 object-cover rounded-xl border border-border-glass"
                                        />
                                        <span 
                                            className="text-sm font-medium text-center truncate w-full"
                                            style={{ 
                                                color: selectedSource === source.id 
                                                    ? 'var(--color-text-primary)' 
                                                    : 'var(--color-text-secondary)'
                                            }}
                                        >
                                            {source.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div 
                                className="text-center py-12 text-sm"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                No windows available
                            </div>
                        )
                    ) : (
                        /* Browser Fallback */
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-2 border-indigo-500/20 text-center">
                            <p 
                                className="text-sm font-medium"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                💡 You'll select the window after clicking Capture
                            </p>
                        </div>
                    )}
                </div>
            )}

            {captureMode === 'url' && (
                <div className="space-y-3">
                    <h3 
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <Globe className="w-4 h-4 inline mr-2" />
                        Web Page URL
                    </h3>
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-5 py-4 bg-glass-panel border-2 border-border-glass rounded-2xl focus:border-indigo-500 focus:outline-none font-medium transition-all shadow-sm"
                            style={{ color: 'var(--color-text-primary)' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
                            autoFocus
                        />
                        <p 
                            className="text-xs flex items-start gap-2 px-2"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <span>💡</span>
                            <span>We'll capture the full scrolling page automatically</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Premium Capture Button */}
            <div className="flex justify-center pt-6">
                <button
                    onClick={handleCapture}
                    disabled={captureMode === 'window' && (window as any).screenshotAPI && !selectedSource}
                    className="group relative overflow-hidden"
                >
                    {/* Background Gradient with Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    
                    {/* Button Content */}
                    <div className="relative px-12 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl shadow-indigo-500/50 transition-all duration-300 group-hover:shadow-indigo-500/70 group-hover:scale-105 group-disabled:opacity-50 group-disabled:cursor-not-allowed group-disabled:scale-100">
                        <div className="flex items-center gap-3">
                            {captureMode === 'upload' ? (
                                <Upload className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                                <Camera 
                                    className={cn(
                                        "w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12",
                                        countdown !== null && "animate-pulse"
                                    )} 
                                />
                            )}
                            <span className="text-lg font-bold text-white">
                                {countdown !== null 
                                    ? `Capturing in ${countdown}s...` 
                                    : captureMode === 'upload' 
                                        ? 'Select Image' 
                                        : 'Capture Screenshot'}
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Recent History - Premium Design */}
            {history.length > 0 && (
                <div className="pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 
                            className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <Clock className="w-4 h-4" />
                            Recent Captures
                        </h3>
                        <span 
                            className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                            style={{ color: '#818cf8' }}
                        >
                            {history.length} total
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                        {history.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentScreenshot(item);
                                    setCanvasData(null);
                                    clearRedactionAreas();
                                    setShowPreview(true);
                                }}
                                className="group relative aspect-video bg-glass-panel rounded-2xl overflow-hidden border-2 border-border-glass hover:border-indigo-500 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20"
                            >
                                {item.dataUrl ? (
                                    <>
                                        <img
                                            src={item.dataUrl}
                                            alt="Recent capture"
                                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        {/* Timestamp Badge */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <span className="text-xs text-white font-bold truncate block">
                                                {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Square 
                                            className="w-8 h-8"
                                            style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}
                                        />
                                    </div>
                                )}
                                
                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
