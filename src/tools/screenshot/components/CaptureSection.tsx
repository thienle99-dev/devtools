import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { CaptureSource } from '../types';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { CaptureModeSelector } from './capture/CaptureModeSelector';
import { TimerDelayPicker } from './capture/TimerDelayPicker';
import { WindowSourceSelector } from './capture/WindowSourceSelector';
import { UrlCaptureInput } from './capture/UrlCaptureInput';
import { RecentHistoryGrid } from './capture/RecentHistoryGrid';

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
                setCanvasData(null);
                clearRedactionAreas();
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
                setCanvasData(null);
                clearRedactionAreas();
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

    const delayOptions = [0, 3, 5, 10];
    const hasElectronAPI = Boolean((window as any).screenshotAPI);

    const handleHistorySelect = (item: Parameters<typeof setCurrentScreenshot>[0]) => {
        setCurrentScreenshot(item);
        setCanvasData(null);
        clearRedactionAreas();
        setShowPreview(true);
    };

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
            <CaptureModeSelector mode={captureMode} onChange={setCaptureMode} />

            <TimerDelayPicker value={captureDelay} options={delayOptions} onChange={setCaptureDelay} />

            {captureMode === 'window' && (
                <WindowSourceSelector
                    sources={sources}
                    selectedSource={selectedSource}
                    isLoading={isLoadingSources}
                    onSelect={(id) => setSelectedSource(id)}
                    hasElectronAPI={hasElectronAPI}
                />
            )}

            {captureMode === 'url' && (
                <UrlCaptureInput value={urlInput} onChange={setUrlInput} onSubmit={handleCapture} />
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

            <RecentHistoryGrid history={history} onSelect={handleHistorySelect} />
        </div>
    );
};
