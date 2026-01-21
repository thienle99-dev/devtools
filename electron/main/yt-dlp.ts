import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let YTDlpWrap: any;
try {
    const ytDlpModule = require('yt-dlp-wrap');
    YTDlpWrap = ytDlpModule.default || ytDlpModule;
} catch (e) {
    console.warn('yt-dlp-wrap dependency not found:', e);
}

export { YTDlpWrap };
