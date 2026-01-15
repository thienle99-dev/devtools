import { describe, it, expect } from 'vitest';
import { isValidYoutubeUrl, extractVideoId, extractPlaylistId, cleanYoutubeUrl } from './validation/url';
import { sanitizeFilename, getFileExtension, isValidFilename } from './validation/file';

describe('Validation Utils', () => {
    describe('URL Validation', () => {
        it('should validate YouTube URLs', () => {
            expect(isValidYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
            expect(isValidYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
            expect(isValidYoutubeUrl('https://example.com')).toBe(false);
        });

        it('should extract video ID from YouTube URL', () => {
            expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
            expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('should extract playlist ID', () => {
            expect(extractPlaylistId('https://www.youtube.com/playlist?list=PL12345')).toBe('PL12345');
        });

        it('should clean YouTube URL', () => {
             const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=1';
             // Should strip list and index for single video
             expect(cleanYoutubeUrl(url)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });
    });

    describe('File Validation', () => {
        it('should sanitize filenames', () => {
             expect(sanitizeFilename('test/file|name?.txt')).toBe('testfilename.txt');
             expect(sanitizeFilename('  test  file  ')).toBe('test file');
        });

        it('should get file extension', () => {
            expect(getFileExtension('test.txt')).toBe('txt');
            expect(getFileExtension('archive.tar.gz')).toBe('gz');
            expect(getFileExtension('file')).toBe('');
        });

        it('should validate filename safely', () => {
            expect(isValidFilename('valid-file.txt')).toBe(true);
            expect(isValidFilename('invalid/file.txt')).toBe(false);
        });
    });
});
