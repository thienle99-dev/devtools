// Type definition for extended video info
interface ExtendedVideoInfo {
    path: string;
    duration: number;
    startTime: number;
    endTime: number;
    timelineStart: number;
    trackIndex: number;
    thumbnail?: string;
    filmstrip?: string[];
    width?: number;
    height?: number;
    codec?: string;
    bitrate?: number;
}

/**
 * Apply magnetic snap to a timeline position
 */
export const applyMagneticSnap = (
    newTime: number,
    clipIdx: number,
    files: ExtendedVideoInfo[],
    threshold: number = 0.5,
    enabled: boolean = true
): number => {
    if (!enabled) return newTime;
    
    let snappedTime = newTime;
    let minDistance = threshold;
    
    files.forEach((file, idx) => {
        if (idx === clipIdx) return;
        
        const clipEnd = file.timelineStart + (file.endTime - file.startTime);
        
        // Snap to clip start
        const distanceToStart = Math.abs(newTime - file.timelineStart);
        if (distanceToStart < minDistance) {
            snappedTime = file.timelineStart;
            minDistance = distanceToStart;
        }
        
        // Snap to clip end
        const distanceToEnd = Math.abs(newTime - clipEnd);
        if (distanceToEnd < minDistance) {
            snappedTime = clipEnd;
            minDistance = distanceToEnd;
        }
    });
    
    return snappedTime;
};

/**
 * Apply grid snap to a timeline position
 */
export const applyGridSnap = (
    time: number,
    interval: number = 1,
    enabled: boolean = true
): number => {
    if (!enabled) return time;
    return Math.round(time / interval) * interval;
};

/**
 * Ripple delete - remove clip and shift subsequent clips
 */
export const rippleDelete = (
    files: ExtendedVideoInfo[],
    deleteIdx: number
): ExtendedVideoInfo[] => {
    const deletedClip = files[deleteIdx];
    const deletedDuration = deletedClip.endTime - deletedClip.startTime;
    
    return files
        .filter((_, i) => i !== deleteIdx)
        .map(file => {
            if (file.timelineStart > deletedClip.timelineStart) {
                return {
                    ...file,
                    timelineStart: file.timelineStart - deletedDuration
                };
            }
            return file;
        });
};

/**
 * Ripple delete multiple clips
 */
export const rippleDeleteMultiple = (
    files: ExtendedVideoInfo[],
    deleteIndices: number[]
): ExtendedVideoInfo[] => {
    // Sort indices in descending order to delete from end to start
    const sortedIndices = [...deleteIndices].sort((a, b) => b - a);
    
    let result = [...files];
    sortedIndices.forEach(idx => {
        result = rippleDelete(result, idx);
    });
    
    return result;
};

/**
 * Duplicate clips
 */
export const duplicateClips = (
    files: ExtendedVideoInfo[],
    indices: number[]
): ExtendedVideoInfo[] => {
    const newFiles = [...files];
    
    indices.forEach(idx => {
        const original = files[idx];
        const duration = original.endTime - original.startTime;
        
        const duplicate: ExtendedVideoInfo = {
            ...original,
            timelineStart: original.timelineStart + duration
        };
        
        newFiles.push(duplicate);
    });
    
    return newFiles;
};

/**
 * Select range of clips
 */
export const selectRange = (
    start: number,
    end: number
): number[] => {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
};

/**
 * Check if two clips overlap
 */
export const clipsOverlap = (
    clip1: ExtendedVideoInfo,
    clip2: ExtendedVideoInfo
): boolean => {
    const clip1End = clip1.timelineStart + (clip1.endTime - clip1.startTime);
    const clip2End = clip2.timelineStart + (clip2.endTime - clip2.startTime);
    
    return !(clip1End <= clip2.timelineStart || clip2End <= clip1.timelineStart);
};

/**
 * Find nearest snap point
 */
export const findNearestSnapPoint = (
    time: number,
    files: ExtendedVideoInfo[],
    threshold: number = 0.5
): { time: number; type: 'start' | 'end' | null } => {
    let nearestTime = time;
    let nearestDistance = threshold;
    let snapType: 'start' | 'end' | null = null;
    
    files.forEach(file => {
        const clipEnd = file.timelineStart + (file.endTime - file.startTime);
        
        const distanceToStart = Math.abs(time - file.timelineStart);
        if (distanceToStart < nearestDistance) {
            nearestTime = file.timelineStart;
            nearestDistance = distanceToStart;
            snapType = 'start';
        }
        
        const distanceToEnd = Math.abs(time - clipEnd);
        if (distanceToEnd < nearestDistance) {
            nearestTime = clipEnd;
            nearestDistance = distanceToEnd;
            snapType = 'end';
        }
    });
    
    return { time: nearestTime, type: snapType };
};

/**
 * Format time for display
 */
export const formatTimeDisplay = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
