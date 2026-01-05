import React, { useState, useEffect } from 'react';
import { Monitor, Square, MousePointer2, Camera } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { CaptureMode, CaptureSource } from '../types';
import { cn } from '../../../utils/cn';
import { toast } from 'sonner';

export const CaptureSection: React.FC = () => {
    const {
        captureMode,
        setCaptureMode,
        setCurrentScreenshot,
        setIsCapturing,
        setShowPreview,
        addToHistory,
    } = useXnapperStore();

    const [sources, setSources] = useState<CaptureSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isLoadingSources, setIsLoadingSources] = useState(false);

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

    const handleCapture = async () => {
        setIsCapturing(true);

        try {
            let screenshot: any = null;

            if (captureMode === 'fullscreen') {
                screenshot = await (window as any).screenshotAPI?.captureScreen();
            } else if (captureMode === 'window' && selectedSource) {
                screenshot = await (window as any).screenshotAPI?.captureWindow(selectedSource);
            } else if (captureMode === 'area') {
                screenshot = await (window as any).screenshotAPI?.captureArea();
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
        }
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
    ];

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

            {captureMode === 'window' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Select Window</h3>
                    {isLoadingSources ? (
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
                    )}
                </div>
            )}

            <div className="flex justify-center pt-4">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCapture}
                    disabled={captureMode === 'window' && !selectedSource}
                    className="min-w-[200px]"
                >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Screenshot
                </Button>
            </div>
        </div>
    );
};
