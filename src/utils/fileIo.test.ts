import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileAsText, downloadFile } from './fileIo';

describe('File Utils', () => {
    describe('readFileAsText', () => {
        // Mock FileReader
        
        beforeEach(() => {
            // Basic Mock for FileReader since jsdom's might be strict or slow
            // Actually jsdom has FileReader, let's try to use it or mock if needed.
            // But File object is needed.
        });

        it('should read file content successfully', async () => {
             const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
             const content = await readFileAsText(file);
             expect(content).toBe('hello world');
        });
    });

    describe('downloadFile', () => {
        // URL.createObjectURL is not implemented in jsdom usually
        beforeEach(() => {
            global.URL.createObjectURL = vi.fn(() => 'blob:test');
            global.URL.revokeObjectURL = vi.fn();
        });

        it('should create an anchor tag and trigger click', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');
            const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
            const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
            
            // Mock anchor click
            const clickMock = vi.fn();
            createElementSpy.mockReturnValue({
                href: '',
                download: '',
                click: clickMock,
                style: {},
            } as any);

            downloadFile('content', 'test.txt');

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(appendChildSpy).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });
});
