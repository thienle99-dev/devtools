import { describe, it, expect, beforeEach } from 'vitest';
import { useXnapperStore } from './xnapperStore';

describe('Xnapper Store', () => {
    beforeEach(() => {
        // Reset store state before each test
        // Since it's a singleton, we can't easily "re-create" it without refactoring
        // but we can manually reset key state or use a specialized helper.
        // For now, manual reset.
        const state = useXnapperStore.getState();
        state.clearHistory();
        state.setCurrentScreenshot(null);
        state.setCaptureMode('area');
        state.setBackground(null);
        state.setBackgroundPadding(40);
        state.setBorderRadius(12);
    });

    it('should have initial state', () => {
        const state = useXnapperStore.getState();
        expect(state.captureMode).toBe('area');
        expect(state.history).toEqual([]);
        expect(state.currentScreenshot).toBeNull();
    });

    it('should update capture mode', () => {
        useXnapperStore.getState().setCaptureMode('fullscreen');
        expect(useXnapperStore.getState().captureMode).toBe('fullscreen');
    });

    it('should add to history', () => {
        const screenshot = {
            id: '1',
            dataUrl: 'data:image/png;base64,abc',
            width: 100,
            height: 100,
            timestamp: Date.now(),
            format: 'png' as const
        };

        useXnapperStore.getState().addToHistory(screenshot);
        expect(useXnapperStore.getState().history).toHaveLength(1);
        expect(useXnapperStore.getState().history[0].id).toBe('1');
    });

    it('should limit history size', () => {
        const state = useXnapperStore.getState();
        for (let i = 0; i < 60; i++) {
            state.addToHistory({
                id: i.toString(),
                dataUrl: '...',
                width: 10,
                height: 10,
                timestamp: Date.now(),
                format: 'png'
            });
        }
        // Store limits to 50
        expect(useXnapperStore.getState().history).toHaveLength(50);
        expect(useXnapperStore.getState().history[0].id).toBe('59');
    });

    it('should update style settings', () => {
        const state = useXnapperStore.getState();
        state.setBorderRadius(20);
        state.setShadowBlur(50);
        state.setBackgroundPadding(60);

        expect(useXnapperStore.getState().borderRadius).toBe(20);
        expect(useXnapperStore.getState().shadowBlur).toBe(50);
        expect(useXnapperStore.getState().backgroundPadding).toBe(60);
    });

    it('should update watermark', () => {
        useXnapperStore.getState().setWatermark({ text: 'My DevTools', opacity: 0.5 });
        const watermark = useXnapperStore.getState().watermark;
        expect(watermark.text).toBe('My DevTools');
        expect(watermark.opacity).toBe(0.5);
    });
});
