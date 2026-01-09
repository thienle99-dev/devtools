import { useState } from 'react';
import type { ExtendedVideoInfo } from '../../../types/video-merger';

export const useTimelineHistory = (initialState: ExtendedVideoInfo[] = []) => {
    // Initial history contains at least one empty state (or valid state)
    // If we want to allow undoing to empty state, initial state is empty array.
    const [history, setHistory] = useState<ExtendedVideoInfo[][]>([initialState]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const addToHistory = (newFiles: ExtendedVideoInfo[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newFiles);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        }
        return null;
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        }
        return null;
    };
    
    return {
        history,
        historyIndex,
        addToHistory,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
};
