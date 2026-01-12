import React, { useState, useEffect } from 'react';
import { Monitor, Square, MousePointer2, Camera, Clock, Globe } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { CaptureMode, CaptureSource } from '../types';
import { cn } from '../../../utils/cn';
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
        // Just a wrapper to trigger async
        performCapture();
    };

    const captureModes: Array<{ mode: CaptureMode; icon: any; label: string; description: string }> = [
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
    ];

    const delayOptions = [0, 3, 5, 10];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Capture Mode</h3>
                <div className="grid grid-cols-3 gap-3">
                    {captureModes.map(({ mode, icon: Icon, label, description }) => (
                        <button
                            key={mode}
                            onClick={() => setCaptureMode(mode)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                captureMode === mode
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                            )}
                        >
                            <Icon className={cn(
                                "w-8 h-8",
                                captureMode === mode ? "text-indigo-400" : "text-foreground-muted"
                            )} />
                            <div className="text-center">
                                <div className={cn(
                                    "font-medium text-sm",
                                    captureMode === mode ? "text-foreground" : "text-foreground-secondary"
                                )}>
                                    {label}
                                </div>
                                <div className="text-xs text-foreground-muted mt-1">
                                    {description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Delay Settings */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    <h3 className="text-sm font-semibold text-foreground-secondary">Timer Delay</h3>
                </div>
                <div className="flex items-center gap-2">
                    {delayOptions.map((seconds) => (
                        <button
                            key={seconds}
                            onClick={() => setCaptureDelay(seconds)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                captureDelay === seconds
                                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                                    : "bg-glass-panel text-foreground-muted border-border-glass hover:bg-white/5"
                            )}
                        >
                            {seconds === 0 ? 'No Delay' : `${seconds}s`}
                        </button>
                    ))}
                </div>
            </div>

            {captureMode === 'window' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Select Window</h3>
                    {(window as any).screenshotAPI ? (
                        /* Electron Window Selection */
                        isLoadingSources ? (
                            <div className="text-center py-8 text-foreground-muted">
                                Loading windows...
                            </div>
                        ) : sources.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                                {sources.map((source) => (
                                    <button
                                        key={source.id}
                                        onClick={() => setSelectedSource(source.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                                            selectedSource === source.id
                                                ? "border-indigo-500 bg-indigo-500/10"
                                                : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                                        )}
                                    >
                                        <img
                                            src={source.thumbnail}
                                            alt={source.name}
                                            className="w-full h-24 object-cover rounded"
                                        />
                                        <span className="text-xs text-center truncate w-full">
                                            {source.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-foreground-muted">
                                No windows available
                            </div>
                        )
                    ) : (
                        /* Browser Fallback Message */
                        <div className="p-4 rounded-lg bg-glass-panel border border-border-glass text-center text-sm text-foreground-muted">
                            In browser mode, you will select the window after clicking Capture.
                        </div>
                    )}
                </div>
            )}

            {captureMode === 'url' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Enter Web Page URL</h3>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="example.com"
                            className="w-full px-4 py-3 bg-background/50 border border-border-glass rounded-xl focus:border-indigo-500 focus:outline-none text-foreground placeholder-foreground-muted transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
                            autoFocus
                        />
                        <p className="text-xs text-foreground-muted">
                            We will load the page in the background, scroll to the bottom, and capture the entire content.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-center pt-4">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCapture}
                    disabled={captureMode === 'window' && (window as any).screenshotAPI && !selectedSource}
                    className="min-w-[200px]"
                >
                    <Camera className={cn("w-5 h-5 mr-2", countdown !== null && "animate-pulse")} />
                    {countdown !== null ? `Capturing in ${countdown}s...` : 'Capture Screenshot'}
                </Button>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
                <div className="pt-8 border-t border-border-glass mt-8">
                    <h3 className="text-sm font-semibold mb-4 text-foreground-secondary flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Captures
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {history.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentScreenshot(item);
                                    setCanvasData(null);
                                    clearRedactionAreas();
                                    setShowPreview(true);
                                }}
                                className="group relative aspect-video bg-glass-panel rounded-lg overflow-hidden border border-border-glass hover:border-indigo-500 transition-all"
                            >
                                {item.dataUrl ? (
                                    <img
                                        src={item.dataUrl}
                                        alt="Recent"
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black/20">
                                        <Square className="w-6 h-6 opacity-30" />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-medium truncate w-full text-left">
                                        {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
