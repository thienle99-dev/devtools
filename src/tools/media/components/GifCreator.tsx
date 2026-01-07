import React, { useState, useRef } from 'react';
import { Upload, Settings, Image as ImageIcon, Video, RefreshCw } from 'lucide-react';
import { Slider } from '../../../components/ui/Slider';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { logger } from '../../../utils/logger';
// @ts-ignore
import gifshot from 'gifshot';

// Very basic GIF Encoder Interface (since we might need to add a library)
// For now we will structure the UI and logic.

export const GifCreator: React.FC = () => {
    const [mode, setMode] = useState<'video' | 'images'>('video');
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [frames, setFrames] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    
    const [settings, setSettings] = useState({
        fps: 10,
        width: 480,
        quality: 10, // 1-30 (lower is better for some libs, higher for others, but let's assume 1-10 scale)
        loop: 0, // 0 = infinite
        delay: 100 // ms
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (mode === 'video') {
            const file = e.target.files?.[0];
            if (file) {
                setSourceFile(file);
            }
        } else {
            const newFrames = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
            setFrames((prev: File[]) => [...prev, ...newFrames]);
        }
    };

    const reset = () => {
        setSourceFile(null);
        setFrames([]);
        setProgress(0);
        setProcessingStatus('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const generateGif = async () => {
        if (mode === 'video' && !sourceFile) return;
        if (mode === 'images' && frames.length === 0) return;

        setIsProcessing(true);
        setProcessingStatus('Initializing GIF encoder...');
        setProgress(10);
        
        try {
            let gifHeight = Math.floor(settings.width * (9/16));

            if (mode === 'video' && videoRef.current) {
                const video = videoRef.current;
                if (video.videoWidth && video.videoHeight) {
                    gifHeight = Math.floor(settings.width * (video.videoHeight / video.videoWidth));
                }
            }

            const videoUrl = mode === 'video' ? URL.createObjectURL(sourceFile!) : null;

            const options = {
                gifWidth: settings.width,
                gifHeight: gifHeight, 
                interval: 1 / settings.fps,
                numFrames: mode === 'video' ? 30 : frames.length, 
                video: videoUrl,
                images: mode === 'images' ? await Promise.all(frames.map((f: File) => {
                    return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(f);
                    });
                })) : [],
                sampleInterval: settings.quality,
                loop: settings.loop === 0 ? 0 : settings.loop,
                progressCallback: (captureProgress: number) => {
                    setProgress(Math.floor(10 + (captureProgress * 80)));
                    setProcessingStatus(`Processing: ${Math.floor(captureProgress * 100)}%`);
                }
            };

            gifshot.createGIF(options, (obj: any) => {
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                
                if (!obj.error) {
                    const image = obj.image;
                    const animatedImage = document.createElement('img');
                    animatedImage.src = image;
                    
                    // Trigger download
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `generated_${Date.now()}.gif`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setProcessingStatus('Done!');
                    setProgress(100);
                    
                    setTimeout(() => {
                        setIsProcessing(false);
                        setProcessingStatus('');
                        setProgress(0);
                    }, 2000);
                } else {
                    logger.error('gifshot error:', obj.error);
                    setProcessingStatus('Error: ' + obj.error);
                    setTimeout(() => setIsProcessing(false), 3000);
                }
            });
            
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            setProcessingStatus('Failed');
        }
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto p-1">
            <div className="space-y-6 mx-auto w-full pb-10">
                {/* Source Selection */}
                <div className="flex justify-center mb-6">
                    <div className="bg-glass-panel border border-border-glass p-1 rounded-lg flex">
                        <button
                            onClick={() => { setMode('video'); reset(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                                mode === 'video' ? 'bg-indigo-500/20 text-indigo-400' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                        >
                            <Video className="w-4 h-4" /> Video to GIF
                        </button>
                        <button
                            onClick={() => { setMode('images'); reset(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                                mode === 'images' ? 'bg-indigo-500/20 text-indigo-400' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                        >
                            <ImageIcon className="w-4 h-4" /> Images to GIF
                        </button>
                    </div>
                </div>

                {/* File Upload Area */}
                <Card
                    className="border-2 border-dashed border-border-glass p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-glass-panel/50 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple={mode === 'images'}
                        accept={mode === 'video' ? "video/*" : "image/*"}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {mode === 'video' 
                            ? (sourceFile ? 'Change Video' : 'Upload Video')
                            : (frames.length > 0 ? 'Add More Frames' : 'Upload Images')
                        }
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                        {mode === 'video' ? 'MP4, WebM, MOV' : 'PNG, JPG, WebP sequence'}
                    </p>
                </Card>

                {/* Main Editor UI */}
                {(sourceFile || frames.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Settings */}
                        <div className="space-y-6">
                            <Card className="p-5 space-y-6">
                                <div className="flex items-center gap-3 border-b border-border-glass pb-3">
                                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">GIF Settings</h3>
                                </div>

                                <div className="space-y-5">
                                    <Slider
                                        label="Frame Rate (FPS)"
                                        value={settings.fps}
                                        min={1}
                                        max={30}
                                        step={1}
                                        onChange={(v: number) => setSettings((s: any) => ({ ...s, fps: v }))}
                                        unit=" FPS"
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-foreground-secondary">
                                            Width (px)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={settings.width}
                                            onChange={(e) => setSettings((s: any) => ({ ...s, width: Number(e.target.value) }))}
                                            className="w-full bg-input-bg border border-border-glass rounded-md px-3 py-2 text-sm text-foreground focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-foreground-secondary">Loop Count</label>
                                            <span className="text-xs text-foreground-secondary">{settings.loop === 0 ? 'Infinite' : settings.loop}</span>
                                        </div>
                                        <Slider
                                            label=""
                                            value={settings.loop}
                                            min={0}
                                            max={10}
                                            step={1}
                                            onChange={(v: number) => setSettings((s: any) => ({ ...s, loop: v }))}
                                        />
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={generateGif}
                                        disabled={isProcessing}
                                        icon={RefreshCw}
                                        loading={isProcessing}
                                    >
                                        Generate GIF
                                    </Button>
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
                                    <p className="text-xs text-foreground-secondary font-mono">{processingStatus}</p>
                                </Card>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <Card className="p-1 h-full min-h-[400px] flex items-center justify-center bg-black/20 overflow-hidden">
                                {mode === 'video' && sourceFile && (
                                    <video 
                                        src={URL.createObjectURL(sourceFile)} 
                                        controls 
                                        className="max-w-full max-h-[500px] rounded-lg"
                                        ref={videoRef}
                                    />
                                )}
                                {mode === 'images' && frames.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 w-full p-4 overflow-y-auto max-h-[500px]">
                                        {frames.map((f: File, i: number) => (
                                            <div key={i} className="aspect-square rounded-md overflow-hidden bg-black/40 relative group">
                                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
                                                    #{i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
