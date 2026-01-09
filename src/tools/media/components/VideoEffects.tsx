import React, { useState, useEffect } from 'react';
import { 
    Sparkles, 
    Upload, 
    Play,
    Pause,
    Download, 
    RotateCcw, 
    RotateCw, 
    FlipHorizontal, 
    FlipVertical, 
    Zap, 
    Sliders, 
    Palette, 
    Wind, 
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowLeftRight,
    Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import type { VideoEffectOptions, VideoEffectProgress } from '../../../types/video-effects';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];

export const VideoEffects: React.FC = () => {
    const [inputPath, setInputPath] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoEffectProgress | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'>('mp4');

    // Effect Options
    const [speed, setSpeed] = useState(1);
    const [reverse, setReverse] = useState(false);
    const [flip, setFlip] = useState<'horizontal' | 'vertical' | 'both' | 'none'>('none');
    const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
    
    // Color Grading
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(1);
    const [saturation, setSaturation] = useState(1);
    const [gamma, setGamma] = useState(1);
    
    // Filters
    const [blur, setBlur] = useState(0);
    const [sharpen, setSharpen] = useState(false);
    const [grayscale, setGrayscale] = useState(false);
    const [sepia, setSepia] = useState(false);
    const [vintage, setVintage] = useState(false);
    const [glitch, setGlitch] = useState(false);
    const [noise, setNoise] = useState(0);
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    }, [speed]);

    useEffect(() => {
        const cleanup = (window as any).videoEffectsAPI?.onProgress((p: VideoEffectProgress) => {
            setProgress(p);
            if (p.state === 'complete') {
                setIsProcessing(false);
                setOutputPath(p.outputPath || null);
            } else if (p.state === 'error') {
                setIsProcessing(false);
            }
        });

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const handleSelectFile = async () => {
        try {
            const path = await (window as any).videoEffectsAPI?.chooseInputFile();
            if (path) {
                setInputPath(path);
            }
        } catch (error) {
            console.error('Failed to select file:', error);
        }
    };

    const handleApply = async () => {
        if (!inputPath) return;
        setIsProcessing(true);
        setOutputPath(null);
        setProgress({ id: 'processing', percent: 0, state: 'analyzing' });

        try {
            const options: VideoEffectOptions = {
                inputPath,
                format: selectedFormat,
                speed,
                reverse,
                flip,
                rotate,
                brightness,
                contrast,
                saturation,
                gamma,
                blur,
                sharpen,
                grayscale,
                sepia,
                vintage,
                glitch,
                noise,
                quality
            };
            await (window as any).videoEffectsAPI?.apply(options);
        } catch (error) {
            console.error('Failed to apply effects:', error);
            setIsProcessing(false);
            setProgress(prev => prev ? { ...prev, state: 'error', error: 'Failed to apply effects' } : null);
        }
    };

    const resetOptions = () => {
        setSpeed(1);
        setReverse(false);
        setFlip('none');
        setRotate(0);
        setBrightness(0);
        setContrast(1);
        setSaturation(1);
        setGamma(1);
        setBlur(0);
        setSharpen(false);
        setGrayscale(false);
        setSepia(false);
        setVintage(false);
        setGlitch(false);
        setNoise(0);
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-sans relative">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 bg-foreground/[0.02] border-b border-border-glass z-20">
                <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-indigo-500" />
                    <h2 className="text-xs font-black uppercase tracking-widest">Video Effects Studio</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={resetOptions}
                        className="text-[10px] font-bold text-foreground-secondary hover:text-foreground transition-colors"
                    >
                        Reset All
                    </button>
                    <select
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as any)}
                        disabled={isProcessing}
                        className="bg-foreground/[0.05] border border-border-glass rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
                    >
                        {FORMATS.map(f => (
                            <option key={f} value={f} className="bg-background">{f.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Settings */}
                <div className="w-80 border-r border-border-glass bg-foreground/[0.01] overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Speed & Direction */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-amber-500" /> Motion & Direction
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-foreground-secondary">Playback Speed</span>
                                    <span className="text-indigo-400 font-mono">{speed}x</span>
                                </div>
                                <input 
                                    type="range" min={0.1} max={4} step={0.1}
                                    value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                                    className="w-full h-1.5 bg-foreground/[0.05] rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex gap-2">
                                    {[0.5, 1, 1.5, 2].map(s => (
                                        <button 
                                            key={s} onClick={() => setSpeed(s)}
                                            className={cn(
                                                "flex-1 py-1 rounded-md text-[9px] font-black border transition-all",
                                                speed === s ? "bg-indigo-600 border-indigo-500 text-white" : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:border-indigo-500/50"
                                            )}
                                        >
                                            {s}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-foreground/[0.03] rounded-xl border border-border-glass">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <ArrowLeftRight size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black">Reverse Playback</p>
                                        <p className="text-[8px] text-foreground-secondary">Play clip backwards</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setReverse(!reverse)}
                                    className={cn(
                                        "w-10 h-5 rounded-full relative transition-colors duration-300",
                                        reverse ? "bg-indigo-600" : "bg-foreground/[0.1]"
                                    )}
                                >
                                    <motion.div 
                                        animate={{ x: reverse ? 22 : 4 }}
                                        className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Transform */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary mb-4 flex items-center gap-2">
                            <Maximize size={12} className="text-blue-500" /> Transform
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-foreground-secondary uppercase">Rotate</p>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setRotate(((rotate - 90 + 360) % 360) as any)}
                                        className="flex-1 py-2 bg-foreground/[0.03] border border-border-glass rounded-lg flex items-center justify-center hover:bg-foreground/[0.05] transition-all"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setRotate(((rotate + 90) % 360) as any)}
                                        className="flex-1 py-2 bg-foreground/[0.03] border border-border-glass rounded-lg flex items-center justify-center hover:bg-foreground/[0.05] transition-all"
                                    >
                                        <RotateCw size={14} />
                                    </button>
                                </div>
                                <div className="text-center text-[10px] font-mono text-indigo-400 bg-indigo-500/5 py-1 rounded">{rotate}°</div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-foreground-secondary uppercase">Mirror/Flip</p>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setFlip(flip === 'horizontal' ? 'none' : 'horizontal')}
                                        className={cn(
                                            "flex-1 py-2 border rounded-lg flex items-center justify-center transition-all",
                                            flip === 'horizontal' ? "bg-indigo-600 text-white border-indigo-500" : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:bg-foreground/[0.05]"
                                        )}
                                    >
                                        <FlipHorizontal size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setFlip(flip === 'vertical' ? 'none' : 'vertical')}
                                        className={cn(
                                            "flex-1 py-2 border rounded-lg flex items-center justify-center transition-all",
                                            flip === 'vertical' ? "bg-indigo-600 text-white border-indigo-500" : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:bg-foreground/[0.05]"
                                        )}
                                    >
                                        <FlipVertical size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Enhancements */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary mb-4 flex items-center gap-2">
                            <Sliders size={12} className="text-emerald-500" /> Color Grading
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Brightness', val: brightness, set: setBrightness, min: -0.5, max: 0.5, step: 0.05 },
                                { label: 'Contrast', val: contrast, set: setContrast, min: 0, max: 2, step: 0.1 },
                                { label: 'Saturation', val: saturation, set: setSaturation, min: 0, max: 3, step: 0.1 },
                                { label: 'Gamma', val: gamma, set: setGamma, min: 0.1, max: 3, step: 0.1 }
                            ].map(grade => (
                                <div key={grade.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-foreground-secondary">{grade.label}</span>
                                        <span className="text-indigo-400 font-mono">{grade.val}</span>
                                    </div>
                                    <input 
                                        type="range" min={grade.min} max={grade.max} step={grade.step}
                                        value={grade.val} onChange={(e) => grade.set(Number(e.target.value))}
                                        className="w-full h-1 bg-foreground/[0.05] rounded-full appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Creative Filters */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary mb-4 flex items-center gap-2">
                            <Palette size={12} className="text-purple-500" /> Creative Filters
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Grayscale', active: grayscale, set: setGrayscale },
                                { label: 'Sepia', active: sepia, set: setSepia },
                                { label: 'Sharpen', active: sharpen, set: setSharpen },
                                { label: 'Vintage', active: vintage, set: setVintage },
                                { label: 'Glitch', active: glitch, set: setGlitch }
                            ].map(filter => (
                                <button 
                                    key={filter.label}
                                    onClick={() => filter.set(!filter.active)}
                                    className={cn(
                                        "py-2 rounded-lg text-[10px] font-black border transition-all",
                                        filter.active ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:bg-foreground/[0.05]"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Blur & Noise */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary mb-4 flex items-center gap-2">
                            <Wind size={12} className="text-rose-500" /> Advanced
                        </h3>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-foreground-secondary">Blur Strength</span>
                                    <span className="text-indigo-400 font-mono">{blur}px</span>
                                </div>
                                <input 
                                    type="range" min={0} max={20} step={1}
                                    value={blur} onChange={(e) => setBlur(Number(e.target.value))}
                                    className="w-full h-1 bg-foreground/[0.05] rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-foreground-secondary">Film Grain / Noise</span>
                                    <span className="text-indigo-400 font-mono">{noise}%</span>
                                </div>
                                <input 
                                    type="range" min={0} max={100} step={5}
                                    value={noise} onChange={(e) => setNoise(Number(e.target.value))}
                                    className="w-full h-1 bg-foreground/[0.05] rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Panel: Preview & Actions */}
                <div className="flex-1 bg-background-tertiary/20 flex flex-col p-8 overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-glass rounded-3xl relative overflow-hidden group">
                        {!inputPath ? (
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                                    <Upload className="text-indigo-500" size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black tracking-tight">Drop your video here</h3>
                                    <p className="text-xs text-foreground-secondary max-w-[240px] mx-auto">Select a video to start applying cinematic effects and manipulations.</p>
                                </div>
                                <button 
                                    onClick={handleSelectFile}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                >
                                    Choose Video File
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-full p-8 flex flex-col gap-6">
                                <div className="flex-1 bg-black rounded-3xl shadow-2xl overflow-hidden border border-border-glass relative flex items-center justify-center">
                                    <video 
                                        ref={videoRef}
                                        src={inputPath ? `local-media:///${inputPath.replace(/\\/g, '/')}` : undefined}
                                        className="w-full h-full object-contain transition-all duration-300 will-change-transform"
                                        style={{
                                            filter: `
                                                brightness(${1 + brightness}) 
                                                contrast(${contrast * 100}%) 
                                                saturate(${saturation * 100}%) 
                                                blur(${blur}px) 
                                                ${grayscale ? 'grayscale(100%)' : ''} 
                                                ${sepia ? 'sepia(100%)' : ''}
                                                ${vintage ? 'sepia(50%) hue-rotate(-30deg) saturate(1.2) contrast(1.1)' : ''}
                                            `,
                                            transform: `
                                                rotate(${rotate}deg) 
                                                scaleX(${flip === 'horizontal' || flip === 'both' ? -1 : 1}) 
                                                scaleY(${flip === 'vertical' || flip === 'both' ? -1 : 1})
                                            `
                                        }}
                                        autoPlay
                                        loop
                                        preload="auto"
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onError={(e) => {
                                            console.error('Video Error:', e);
                                            // You might want to set an error state here
                                        }}
                                    />

                                    {/* Noise/Grain Overlay */}
                                    {noise > 0 && (
                                        <div 
                                            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
                                            style={{ 
                                                backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')`,
                                                filter: `contrast(${1 + noise/100}) brightness(${1 + noise/100})`
                                            }}
                                        />
                                    )}

                                    {/* Glitch Overlay */}
                                    {glitch && (
                                        <div className="absolute inset-0 pointer-events-none bg-indigo-500/10 animate-pulse mix-blend-color-dodge" />
                                    )}

                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-all bg-black/20",
                                        isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                                    )}>
                                        <button 
                                            onClick={() => {
                                                if (videoRef.current?.paused) videoRef.current.play();
                                                else videoRef.current?.pause();
                                            }}
                                            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                                        >
                                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                        </button>
                                    </div>

                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {grayscale && <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-[8px] font-black text-white uppercase">Grayscale</span>}
                                        {reverse && <span className="px-2 py-1 bg-amber-500/20 backdrop-blur-md rounded text-[8px] font-black text-amber-500 uppercase">Reverse</span>}
                                        {speed !== 1 && <span className="px-2 py-1 bg-indigo-500/20 backdrop-blur-md rounded text-[8px] font-black text-indigo-400 uppercase">{speed}x Speed</span>}
                                    </div>
                                    <button 
                                        onClick={() => setInputPath(null)}
                                        className="absolute top-4 right-4 p-2 bg-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-glass-background rounded-3xl border border-border-glass shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black truncate max-w-[300px]">{inputPath.split(/[\\/]/).pop()}</p>
                                            <p className="text-[10px] text-foreground-secondary font-bold uppercase tracking-widest">Ready to export</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-foreground/[0.05] p-1 rounded-xl border border-border-glass">
                                            {(['low', 'medium', 'high'] as const).map(q => (
                                                <button 
                                                    key={q} onClick={() => setQuality(q)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                                        quality === q ? "bg-white text-black shadow-md" : "text-foreground-secondary hover:text-foreground"
                                                    )}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={handleApply}
                                            disabled={isProcessing}
                                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                                        >
                                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                            {isProcessing ? 'Processing...' : 'Apply & Export'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Modal */}
            <AnimatePresence>
                {progress && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-glass-background/90 backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl relative">
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-400">
                                    {progress.state === 'complete' ? <CheckCircle2 size={32} /> : progress.state === 'error' ? <AlertCircle size={32} /> : <Loader2 size={32} className="animate-spin" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">
                                        {progress.state === 'processing' ? 'Applying Effects' : progress.state === 'complete' ? 'Export Success' : progress.state === 'error' ? 'Export Failed' : 'Initializing'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">{Math.round(progress.percent)}% Complete</p>
                                </div>
                                {(progress.state === 'processing' || progress.state === 'analyzing') && (
                                    <div className="w-full bg-foreground/[0.05] h-1.5 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" animate={{ width: `${progress.percent}%` }} />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 pt-4">
                                    {progress.state === 'complete' && outputPath && (
                                        <button onClick={() => (window as any).videoEffectsAPI?.openFile(outputPath)} className="w-full bg-foreground text-background py-4 rounded-xl text-xs font-black">PLAY RESULT</button>
                                    )}
                                    <button onClick={() => setProgress(null)} className="w-full bg-foreground/[0.05] py-4 rounded-xl text-xs font-black">DISMISS</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoEffects;
