import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Scissors, ZoomIn, ZoomOut, Video, Film, Layers, Sparkles, Type, Volume2 } from 'lucide-react';
import { cn } from '@utils/cn';
import { TimelineClipItem } from './TimelineClipItem';
import type { ExtendedVideoInfo } from '../../../types/video-merger';

interface CapCutTimelineProps {
    files: ExtendedVideoInfo[];
    selectedClips: number[];
    currentTime: number;
    totalDuration: number;
    isPlaying: boolean;
    isRazorMode: boolean;
    snapToGrid: boolean;
    magneticSnap: boolean;
    zoomLevel: number;
    previewIndex: number;
    mouseTimelineTime: number | null;
    snapLineCtx?: { x: number } | null;
    timelineRef: React.RefObject<HTMLDivElement>;
    onAddFiles: () => void;
    onShowShortcuts: () => void;
    onToggleSnap: () => void;
    onToggleMagnetic: () => void;
    onToggleRazor: () => void;
    onSplitAtPlayhead: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onTimelineClick: (e: React.MouseEvent) => void;
    onTimelineMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onDragEnd?: () => void;
    onToggleSelection: (idx: number, isMulti: boolean) => void;
    onClearSelection: () => void;
    onSplitClip: (idx: number) => void;
    onSetTrimmingIdx: (idx: number) => void;
    onRemoveFile: (path: string) => void;
    onUpdateTrim: (idx: number, start: number, end: number) => void;
    onClipMove: (idx: number, deltaX: number, deltaY: number) => void;
    formatDuration: (seconds: number) => string;
    showLabels: boolean;
    onToggleLabels: () => void;
}

export const CapCutTimeline: React.FC<CapCutTimelineProps> = ({
    files,
    selectedClips,
    currentTime,
    totalDuration,
    isRazorMode,
    snapToGrid,
    magneticSnap,
    zoomLevel,
    previewIndex,
    mouseTimelineTime,
    snapLineCtx,
    timelineRef,
    onAddFiles,
    onShowShortcuts,
    onToggleSnap,
    onToggleMagnetic,
    onToggleRazor,
    onSplitAtPlayhead,
    onZoomIn,
    onZoomOut,
    onTimelineClick,
    onTimelineMouseMove,
    onMouseLeave,
    onDragEnd,
    onToggleSelection,
    onClearSelection,
    onSplitClip,
    onSetTrimmingIdx,
    onRemoveFile,
    onUpdateTrim,
    onClipMove,
    formatDuration,
    showLabels,
    onToggleLabels
}) => {

    return (
        <div className="h-80 bg-foreground/[0.01] border-t border-border-glass flex flex-col relative">
            {/* Timeline Toolbar */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-border-glass bg-foreground/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-secondary uppercase tracking-wider">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <span>Timeline</span>
                    </div>
                    <div className="h-4 w-[1px] bg-border-glass" />
                    <button
                        onClick={onAddFiles}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <Plus size={12} strokeWidth={3} />
                        Add Media
                    </button>
                    <div className="h-4 w-[1px] bg-border-glass" />
                    <button
                        onClick={onShowShortcuts}
                        className="p-1.5 rounded-md text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05] transition-all"
                        title="Shortcuts (?)"
                    >
                        <span className="text-xs font-bold">?</span>
                    </button>
                    <div className="h-4 w-[1px] bg-border-glass" />
                    <button
                        onClick={onToggleSnap}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            snapToGrid
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05]"
                        )}
                        title="Snap to Grid (G)"
                    >
                        <span className="text-xs">⊞</span>
                    </button>
                    <button
                        onClick={onToggleMagnetic}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            magneticSnap
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : "text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05]"
                        )}
                        title="Magnetic Snap"
                    >
                        <span className="text-xs">U</span>
                    </button>
                    <button
                        onClick={onToggleRazor}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            isRazorMode
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : "text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05]"
                        )}
                        title="Razor (R)"
                    >
                        <Scissors size={12} />
                    </button>
                    <button
                        onClick={onSplitAtPlayhead}
                        disabled={files.length === 0}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Split (S)"
                    >
                        <Scissors size={12} />
                    </button>
                    <div className="h-4 w-[1px] bg-border-glass" />
                    <button
                        onClick={onToggleLabels}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            showLabels
                                ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                                : "text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05]"
                        )}
                        title="Toggle Labels (T)"
                    >
                        <Type size={12} />
                    </button>
                    <div className="h-4 w-[1px] bg-border-glass" />
                    <div className="flex items-center gap-2 px-2 py-1 bg-foreground/[0.02] rounded-md border border-border-glass">
                        <button onClick={onZoomOut} className="p-0.5 hover:bg-foreground/[0.05] rounded text-foreground-secondary hover:text-foreground transition-all"><ZoomOut size={12} /></button>
                        <div className="w-20 h-1 bg-foreground/[0.1] rounded-full overflow-hidden">
                            <motion.div className="h-full bg-indigo-500" animate={{ width: `${((zoomLevel - 0.2) / (5 - 0.2)) * 100}%` }} />
                        </div>
                        <button onClick={onZoomIn} className="p-0.5 hover:bg-foreground/[0.05] rounded text-foreground-secondary hover:text-foreground transition-all"><ZoomIn size={12} /></button>
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 flex overflow-hidden bg-foreground/[0.01]">
                {/* Track Sidebar */}
                <div className="w-16 border-r border-border-glass flex flex-col bg-foreground/[0.01] shrink-0">
                    {/* Track Header */}
                    <div className="h-8 border-b border-border-glass flex items-center justify-center">
                        <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">Tracks</span>
                    </div>
                    {/* Track Labels */}
                    <div className="flex-1 pt-2 space-y-1 px-2">
                        {[
                            { Icon: Video, label: 'Main', color: 'text-blue-400' },
                            { Icon: Film, label: 'PIP', color: 'text-purple-400' },
                            { Icon: Layers, label: 'Overlay', color: 'text-pink-400' },
                            { Icon: Sparkles, label: 'Effect', color: 'text-yellow-400' },
                            { Icon: Type, label: 'Text', color: 'text-green-400' },
                            { Icon: Volume2, label: 'Audio', color: 'text-orange-400' }
                        ].map((track, i) => (
                            <div key={i} className="h-10 rounded-lg bg-foreground/[0.03] border border-border-glass flex flex-col items-center justify-center hover:border-indigo-500/30 transition-colors group cursor-pointer">
                                <track.Icon className={cn("mb-0.5 group-hover:scale-110 transition-transform", track.color)} size={14} strokeWidth={2.5} />
                                <div className="text-[6px] font-bold text-foreground-muted group-hover:text-foreground-secondary transition-colors uppercase tracking-wide">{track.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Canvas */}
                <div
                    ref={timelineRef}
                    className={cn(
                        "flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative",
                        isRazorMode ? "cursor-crosshair" : "cursor-default"
                    )}
                    onClick={(e) => {
                        onClearSelection();
                        onTimelineClick(e);
                    }}
                    onMouseMove={onTimelineMouseMove}
                    onMouseLeave={onMouseLeave}
                >
                    {/* Time Ruler - Optimized Rendering */}
                    <div className="h-8 bg-foreground/[0.04] border-b border-border-glass sticky top-0 z-20 flex min-w-max">
                        {Array.from({ length: Math.ceil(totalDuration / 5) + 5 }).map((_, i) => {
                            const time = i * 5;
                            const pxPerSec = 40 * zoomLevel;
                            return (
                                <div
                                    key={i}
                                    className="border-l border-border-glass h-full shrink-0 relative group hover:bg-foreground/[0.02] transition-colors"
                                    style={{ width: `${5 * pxPerSec}px` }}
                                >
                                    <span className="absolute left-1 top-1 text-[8px] font-mono font-bold text-foreground-muted group-hover:text-foreground-secondary transition-colors">
                                        {time}s
                                    </span>
                                    {/* Minor ticks (every 1s) */}
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <div
                                            key={j}
                                            className="absolute bottom-0 border-l border-border-glass h-1.5"
                                            style={{ left: `${(j + 1) * pxPerSec}px` }}
                                        />
                                    ))}
                                    <div className="absolute left-0 bottom-0 border-l border-foreground-muted h-3" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Playhead */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none shadow-lg shadow-red-500/50"
                        style={{ left: `${currentTime * (40 * zoomLevel)}px` }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm shadow-lg shadow-red-500/50" />
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[2px] h-full bg-red-500/50" />
                    </motion.div>

                    {/* Razor Guide */}
                    {mouseTimelineTime !== null && (
                        <div
                            className="absolute top-0 bottom-0 w-[1px] bg-indigo-400/40 z-40 pointer-events-none"
                            style={{ left: `${mouseTimelineTime * (40 * zoomLevel)}px` }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50" />
                            <div className="absolute top-2 left-0 w-[1px] h-full border-l border-dashed border-indigo-400/40" />
                        </div>
                    )}

                    {/* Snap Guide */}
                    {snapLineCtx && (
                        <div
                            className="absolute top-0 bottom-0 w-[1px] bg-yellow-400 z-50 pointer-events-none shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                            style={{ left: `${snapLineCtx.x * (40 * zoomLevel)}px` }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rotate-45 transform" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rotate-45 transform" />
                        </div>
                    )}

                    {/* Tracks Container */}
                    <div className="relative min-w-max pt-2" style={{ height: 'calc(100% - 32px)' }}>
                        {/* Track Grid */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute left-0 right-0 h-10 border-b border-border-glass hover:bg-foreground/[0.01] transition-colors"
                                style={{ top: `${i * 44}px` }}
                            />
                        ))}

                        {/* Video Clips */}
                        {files.map((file, idx) => (
                            <TimelineClipItem
                                key={`${file.path}-${idx}`}
                                file={file}
                                idx={idx}
                                pxPerSecond={40 * zoomLevel}
                                previewIndex={previewIndex}
                                isSelected={selectedClips.includes(idx)}
                                isRazorMode={isRazorMode}
                                mouseTimelineTime={mouseTimelineTime}
                                onToggleSelection={onToggleSelection}
                                onSplitClip={onSplitClip}
                                onSetTrimmingIdx={onSetTrimmingIdx}
                                onRemoveFile={onRemoveFile}
                                onUpdateTrim={onUpdateTrim}
                                onClipMove={onClipMove}
                                onDragEnd={onDragEnd}
                                formatDuration={formatDuration}
                                showLabels={showLabels}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
