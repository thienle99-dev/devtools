import React, { useRef, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { formatTime } from '../../../utils/format';

interface TimelineEditorProps {
    videoFile: File | null;
    duration: number;
    startTime: number;
    endTime: number;
    onRangeChange: (start: number, end: number) => void;
    className?: string;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
    videoFile,
    duration,
    startTime,
    endTime,
    onRangeChange,
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
    
    // Generate thumbnails
    useEffect(() => {
        if (!videoFile || duration <= 0) return;
        
        const generateThumbs = async () => {
            const count = 10;
            const thumbs: string[] = [];
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;
            video.playsInline = true;
            
            await new Promise((r) => { video.onloadedmetadata = r; });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Thumbnail size
            canvas.width = 160; 
            canvas.height = 90;

            for (let i = 0; i < count; i++) {
                const time = (duration * i) / count;
                video.currentTime = time;
                await new Promise(r => { video.onseeked = r; });
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
            }
            setThumbnails(thumbs);
            // Cleanup
            video.src = '';
            video.remove();
        };

        generateThumbs();
    }, [videoFile, duration]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const time = percentage * duration;
        
        if (isDragging === 'start') {
            const newStart = Math.min(time, endTime - 0.1); // Min 0.1s gap
            onRangeChange(Math.max(0, newStart), endTime);
        } else {
            const newEnd = Math.max(time, startTime + 0.1);
            onRangeChange(startTime, Math.min(duration, newEnd));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging]);

    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex justify-between text-xs text-foreground-secondary font-mono mb-1">
                <span>{formatTime(startTime, { showMs: true })}</span>
                <span>{formatTime(endTime, { showMs: true })}</span>
            </div>

            <div 
                ref={containerRef}
                className="relative h-20 bg-black/40 border border-border-glass rounded-lg overflow-hidden select-none cursor-pointer group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsDragging(null)}
            >
                {/* Thumbnails Background */}
                <div className="absolute inset-0 flex opacity-50 pointer-events-none">
                    {thumbnails.map((src, i) => (
                        <div key={i} className="flex-1 h-full overflow-hidden border-r border-white/5 last:border-0 relative">
                             <img src={src} className="w-full h-full object-cover blur-[1px]" alt="thumb" />
                        </div>
                    ))}
                </div>

                {/* Ruler Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-between px-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="h-full w-[1px] bg-white last:hidden relative top-1/2 -translate-y-1/2 flex flex-col justify-between py-1">
                             <div className="h-2 w-full bg-white"></div>
                             {i % 5 === 0 && <div className="h-full w-[1px] bg-white absolute top-0"></div>}
                        </div>
                    ))}
                </div>

                {/* Selected Region (Window) */}
                <div 
                    className="absolute top-0 bottom-0 border-y-2 border-indigo-500 bg-indigo-500/10 z-10"
                    style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
                >
                    {/* Left Handle */}
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-4 bg-indigo-500 hover:bg-indigo-400 -translate-x-1/2 cursor-ew-resize flex items-center justify-center z-20 transition-colors shadow-lg"
                        onMouseDown={(e) => { e.preventDefault(); setIsDragging('start'); }}
                    >
                        <GripVertical className="w-3 h-3 text-white" />
                    </div>

                    {/* Right Handle */}
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-4 bg-indigo-500 hover:bg-indigo-400 translate-x-1/2 cursor-ew-resize flex items-center justify-center z-20 transition-colors shadow-lg"
                        onMouseDown={(e) => { e.preventDefault(); setIsDragging('end'); }}
                    >
                        <GripVertical className="w-3 h-3 text-white" />
                    </div>
                </div>

                {/* Darkened Outer Regions */}
                <div 
                    className="absolute top-0 bottom-0 left-0 bg-black/60 z-0 pointer-events-none backdrop-grayscale"
                    style={{ width: `${startPercent}%` }}
                />
                <div 
                    className="absolute top-0 bottom-0 right-0 bg-black/60 z-0 pointer-events-none backdrop-grayscale"
                    style={{ width: `${100 - endPercent}%` }}
                />
            </div>

            <div className="flex justify-between items-center">
                 <div className="flex gap-2 text-[10px] text-white/40">
                     <span>Duration: {duration.toFixed(2)}s</span>
                     <span>Selected: {(endTime - startTime).toFixed(2)}s</span>
                 </div>
                 <div className="flex gap-2">
                    {/* Additional specific visual controls could go here */}
                 </div>
            </div>
        </div>
    );
};

