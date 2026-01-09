import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Trash2, Film } from 'lucide-react';
import { cn } from '@utils/cn';
import type { ExtendedVideoInfo } from '../../../types/video-merger';

interface TimelineClipItemProps {
    file: ExtendedVideoInfo;
    idx: number;
    pxPerSecond: number;
    previewIndex: number;
    isSelected: boolean;
    isRazorMode: boolean;
    mouseTimelineTime: number | null;
    onToggleSelection: (idx: number, isMulti: boolean) => void;
    onSplitClip: (idx: number) => void;
    onSetTrimmingIdx: (idx: number) => void;
    onRemoveFile: (path: string) => void;
    onUpdateTrim: (idx: number, start: number, end: number) => void;
    onClipMove: (idx: number, deltaX: number, deltaY: number) => void;
    onDragEnd?: () => void;
    formatDuration: (seconds: number) => string;
    showLabels: boolean;
}

export const TimelineClipItem: React.FC<TimelineClipItemProps> = React.memo(({
    file,
    idx,
    pxPerSecond,
    previewIndex,
    isSelected,
    isRazorMode,
    mouseTimelineTime,
    showLabels,
    onToggleSelection,
    onSplitClip,
    onSetTrimmingIdx,
    onRemoveFile,
    onUpdateTrim,
    onClipMove,
    onDragEnd,
    formatDuration
}) => {
    // Memoize expensive calculations
    const clipWidth = React.useMemo(
        () => (file.endTime - file.startTime) * pxPerSecond,
        [file.endTime, file.startTime, pxPerSecond]
    );

    const [thumbError, setThumbError] = React.useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (!file.waveform || !canvasRef.current || file.duration <= 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        // Set physical size
        canvas.width = clipWidth * dpr;
        canvas.height = 40 * dpr; // h-10 is 40px

        // Scale context
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, clipWidth, 40);

        // Style
        const gradient = ctx.createLinearGradient(0, 40, 0, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        ctx.fillStyle = gradient;

        const totalPoints = file.waveform.length;
        const pointsPerSec = totalPoints / file.duration;
        const startPoint = Math.floor(file.startTime * pointsPerSec);
        const endPoint = Math.ceil(file.endTime * pointsPerSec);

        const rawData = file.waveform.slice(startPoint, endPoint);
        if (rawData.length === 0) return;

        // Downsample for performance and clarity: 1 point per 1.5 pixels
        const targetPointCount = Math.floor(clipWidth / 1.5);
        const downsampledData: number[] = [];
        const samplesPerPoint = Math.max(1, Math.floor(rawData.length / targetPointCount));

        for (let i = 0; i < rawData.length; i += samplesPerPoint) {
            let max = 0;
            for (let j = 0; j < samplesPerPoint && (i + j) < rawData.length; j++) {
                if (rawData[i + j] > max) max = rawData[i + j];
            }
            downsampledData.push(max);
        }

        // Draw using Path for better performance
        ctx.beginPath();
        const barGap = 0.5;
        const barWidth = (clipWidth / downsampledData.length) - barGap;

        for (let i = 0; i < downsampledData.length; i++) {
            const val = downsampledData[i];
            const barHeight = Math.max(2, val * 24); // Lowered height for 40px track
            const x = i * (barWidth + barGap);
            const y = 40 - barHeight; // Align to bottom

            ctx.roundRect(x, y, Math.max(0.5, barWidth), barHeight, 0.5);
        }
        ctx.fill();

    }, [file.waveform, file.startTime, file.endTime, file.duration, clipWidth]);

    const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
        // Remove stopPropagation to allow timeline playhead seeking on same click
        // e.stopPropagation();

        // Handle selection logic
        const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
        onToggleSelection(idx, isMulti);

        if (isRazorMode && mouseTimelineTime !== null) {
            onSplitClip(idx);
        }
    }, [idx, isRazorMode, mouseTimelineTime, onToggleSelection, onSplitClip]);

    const handleDragEnd = React.useCallback((_e: any, info: any) => {
        const deltaX = info.offset.x / pxPerSecond;
        const deltaY = Math.round(info.offset.y / 44); // 44px track spacing
        onClipMove(idx, deltaX, deltaY);
        onDragEnd?.();
    }, [idx, pxPerSecond, onClipMove, onDragEnd]);

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            dragTransition={{
                power: 0,
                timeConstant: 0
            }}
            whileDrag={{
                scale: 1.03,
                zIndex: 100,
                boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                cursor: "grabbing"
            }}
            onDragEnd={handleDragEnd}
            className={cn(
                "absolute h-10 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group",
                isSelected || previewIndex === idx ? "z-30 ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : "z-10"
            )}
            style={{
                left: `${file.timelineStart * pxPerSecond}px`,
                top: `${file.trackIndex * 44}px`, // 44px track spacing
                width: `${clipWidth}px`,
                x: 0,
                y: 0
            }}
            transition={{
                type: "tween",
                duration: 0.1,
                ease: "easeOut"
            }}
            onPointerDown={handlePointerDown}
        >
            {/* Clip Background with Filmstrip */}
            <div className={cn(
                "absolute inset-0 rounded-lg border-2 transition-colors overflow-hidden",
                previewIndex === idx
                    ? "bg-indigo-500/10 border-indigo-500"
                    : "bg-foreground/[0.05] border-border-glass group-hover:border-foreground/20"
            )}>
                {/* Filmstrip Thumbnails - Temporal Alignment Fix */}
                {file.filmstrip && file.filmstrip.length > 0 ? (
                    <div
                        className="absolute inset-y-0 flex opacity-100 transition-opacity z-10"
                        style={{
                            width: `${file.duration * pxPerSecond}px`,
                            left: `${-file.startTime * pxPerSecond}px`
                        }}
                    >
                        {file.filmstrip.map((thumb, i) => (
                            <div key={i} className="flex-1 h-full relative overflow-hidden border-r border-white/5 last:border-0">
                                <div
                                    className="absolute inset-0 brightness-110 contrast-105 pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${thumb})`,
                                        backgroundSize: 'contain',
                                        backgroundPosition: 'left center',
                                        backgroundRepeat: 'repeat-x'
                                    }}
                                    onDragStart={(e) => e.preventDefault()}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="text-white/20" size={32} />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                {/* Audio Waveform Overlay - Moved to bottom and made subtle */}
                {file.waveform && (
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-x-0 bottom-0 w-full h-full pointer-events-none z-5"
                        style={{ width: clipWidth, height: 40, opacity: 0.35 }}
                    />
                )}
            </div>

            {/* Left Trim Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 hover:bg-indigo-400 cursor-ew-resize z-40 group/handle transition-all hover:w-1.5"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const initialStart = file.startTime;
                    const move = (me: MouseEvent) => {
                        const delta = (me.clientX - startX) / pxPerSecond;
                        onUpdateTrim(idx, initialStart + delta, file.endTime);
                    };
                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                }}
            >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/80 rounded-r-full shadow-lg opacity-0 group-hover/handle:opacity-100 transition-opacity" />
            </div>

            {/* Clip Label and Icon */}
            {showLabels && (
                <div className="absolute top-1 left-1 flex items-center gap-1 z-30 pointer-events-none bg-background/60 backdrop-blur-md py-0.5 px-1.5 rounded-md border border-border-glass max-w-[90%] shadow-xl">
                    <div className="w-3.5 h-3.5 rounded-sm overflow-hidden flex-shrink-0 bg-foreground/10 shadow-inner">
                        {file.thumbnail && !thumbError ? (
                            <img
                                src={file.thumbnail}
                                className="w-full h-full object-cover"
                                alt=""
                                onError={() => setThumbError(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Film size={6} className="text-white/40" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black text-white truncate leading-tight tracking-tight">
                            {file.path.split(/[\\/]/).pop()}
                        </span>
                        <div className="flex items-center gap-1 -mt-0.5">
                            <span className="text-[6px] text-indigo-300 font-bold uppercase tracking-tighter">
                                {formatDuration(file.endTime - file.startTime)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Trim Handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 hover:bg-indigo-400 cursor-ew-resize z-40 group/handle transition-all hover:w-1.5"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const initialEnd = file.endTime;
                    const move = (me: MouseEvent) => {
                        const delta = (me.clientX - startX) / pxPerSecond;
                        onUpdateTrim(idx, file.startTime, initialEnd + delta);
                    };
                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/80 rounded-l-full shadow-lg opacity-0 group-hover/handle:opacity-100 transition-opacity" />
            </div>

            {/* Action Buttons */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                <button
                    onClick={(e) => { e.stopPropagation(); onSplitClip(idx); }}
                    className="p-1 px-1.5 bg-black/60 hover:bg-indigo-600 backdrop-blur-sm text-white rounded text-[8px] font-bold uppercase transition-all shadow-lg"
                    title="Split"
                >
                    <Scissors size={10} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSetTrimmingIdx(idx); }}
                    className="p-1 px-1.5 bg-black/60 hover:bg-blue-600 backdrop-blur-sm text-white rounded text-[8px] font-bold uppercase transition-all shadow-lg"
                    title="Trim"
                >
                    ✂
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.path); }}
                    className="p-1 px-1.5 bg-black/60 hover:bg-red-600 backdrop-blur-sm text-white rounded transition-all shadow-lg"
                    title="Delete"
                >
                    <Trash2 size={10} />
                </button>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
        prevProps.file === nextProps.file &&
        prevProps.idx === nextProps.idx &&
        prevProps.pxPerSecond === nextProps.pxPerSecond &&
        prevProps.previewIndex === nextProps.previewIndex &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isRazorMode === nextProps.isRazorMode &&
        prevProps.mouseTimelineTime === nextProps.mouseTimelineTime
    );
});

TimelineClipItem.displayName = 'TimelineClipItem';
