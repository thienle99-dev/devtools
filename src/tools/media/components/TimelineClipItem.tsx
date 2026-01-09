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
    formatDuration: (seconds: number) => string;
}

export const TimelineClipItem = React.memo<TimelineClipItemProps>(({
    file,
    idx,
    pxPerSecond,
    previewIndex,
    isSelected,
    isRazorMode,
    mouseTimelineTime,
    onToggleSelection,
    onSplitClip,
    onSetTrimmingIdx,
    onRemoveFile,
    onUpdateTrim,
    onClipMove,
    formatDuration
}) => {
    // Memoize expensive calculations
    const clipWidth = React.useMemo(
        () => (file.endTime - file.startTime) * pxPerSecond,
        [file.endTime, file.startTime, pxPerSecond]
    );
    
    const thumbnailRepeatCount = React.useMemo(
        () => Math.ceil(clipWidth / 60),
        [clipWidth]
    );

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (!file.waveform || !canvasRef.current || file.duration <= 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        
        // Set physical size
        canvas.width = clipWidth * dpr;
        canvas.height = 56 * dpr; // h-14 is 56px
        
        // Scale context
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, clipWidth, 56);
        
        // Style
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        const totalPoints = file.waveform.length;
        const pointsPerSec = totalPoints / file.duration;
        const startPoint = Math.floor(file.startTime * pointsPerSec);
        const endPoint = Math.ceil(file.endTime * pointsPerSec);
        
        const visibleData = file.waveform.slice(startPoint, endPoint);
        if (visibleData.length === 0) return;
        
        // Draw using Path for better performance
        ctx.beginPath();
        const barWidth = clipWidth / visibleData.length;
        
        for (let i = 0; i < visibleData.length; i++) {
            const val = visibleData[i];
            const barHeight = val * 40; // 40px height max
            const x = i * barWidth;
            const y = (56 - barHeight) / 2;
            
            ctx.rect(x, y, Math.max(0.5, barWidth - 0.5), barHeight);
        }
        ctx.fill();
        
    }, [file.waveform, file.startTime, file.endTime, file.duration, clipWidth]);

    const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        
        // Handle selection logic
        const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
        onToggleSelection(idx, isMulti);
        
        if (isRazorMode && mouseTimelineTime !== null) {
            onSplitClip(idx);
        }
    }, [idx, isRazorMode, mouseTimelineTime, onToggleSelection, onSplitClip]);

    const handleDragEnd = React.useCallback((_e: any, info: any) => {
        const deltaX = info.offset.x / pxPerSecond;
        const deltaY = Math.round(info.offset.y / 60);
        onClipMove(idx, deltaX, deltaY);
    }, [idx, pxPerSecond, onClipMove]);

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
                "absolute h-14 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group",
                isSelected || previewIndex === idx ? "z-30 ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0f0f0f]" : "z-10"
            )}
            style={{ 
                left: `${file.timelineStart * pxPerSecond}px`,
                top: `${file.trackIndex * 60}px`,
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
                    ? "bg-gradient-to-br from-indigo-900/40 to-indigo-800/30 border-indigo-500" 
                    : "bg-gradient-to-br from-gray-800/60 to-gray-900/50 border-gray-700/50 group-hover:border-gray-600"
            )}>
                {/* Filmstrip Thumbnails - Optimized */}
                {file.filmstrip && file.filmstrip.length > 0 ? (
                    <div className="absolute inset-0 flex opacity-80 group-hover:opacity-95 transition-opacity overflow-hidden">
                        {/* Limit repeats to avoid too many DOM elements */}
                        {Array.from({ length: Math.min(thumbnailRepeatCount, 50) }).map((_, repeatIdx) => (
                            <React.Fragment key={repeatIdx}>
                                {file.filmstrip!.map((thumb, i) => (
                                    <img 
                                        key={`${repeatIdx}-${i}`}
                                        src={thumb} 
                                        className="h-full object-cover brightness-105 contrast-105" 
                                        style={{ 
                                            width: '60px',
                                            minWidth: '60px',
                                            maxWidth: '60px'
                                        }} 
                                        alt=""
                                        loading="lazy"
                                        draggable={false}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="text-white/20" size={32} />
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                
                {/* Audio Waveform Overlay */}
                {file.waveform && (
                    <canvas 
                        ref={canvasRef} 
                        className="absolute inset-0 w-full h-full pointer-events-none z-20"
                        style={{ width: clipWidth, height: 56 }}
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

            {/* Clip Info */}
            <div className="absolute inset-0 flex flex-col justify-center px-3 z-20 pointer-events-none">
                <p className="text-[10px] font-bold text-white truncate drop-shadow-lg">{file.path.split(/[\\/]/).pop()}</p>
                <p className="text-[8px] text-gray-300 font-medium mt-0.5">{formatDuration(file.endTime - file.startTime)}</p>
            </div>

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
        prevProps.isRazorMode === nextProps.isRazorMode &&
        prevProps.mouseTimelineTime === nextProps.mouseTimelineTime
    );
});

TimelineClipItem.displayName = 'TimelineClipItem';
