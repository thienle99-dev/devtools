import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export function getStaticFFmpegPath(): string | null {
    try {
        const ffmpegPath = require('ffmpeg-static');
        return ffmpegPath;
    } catch (e) {
        console.warn('ffmpeg-static not available:', (e as Error).message);
        return null;
    }
}
