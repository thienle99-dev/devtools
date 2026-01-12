import ExifReader from 'exifreader';

export const getImageMetadata = async (file: File | Blob) => {
    try {
        let data: any = file;
        if (!(file instanceof File) && file instanceof Blob) {
            data = await file.arrayBuffer();
        }
        const tags = await ExifReader.load(data);
        
        // Helper to format values
        const formatValue = (tag: any) => {
            if (!tag) return 'N/A';
            return tag.description || tag.value || String(tag);
        };

        const result: Record<string, any> = {};
        Object.entries(tags).forEach(([key, value]) => {
            if (!['base64', 'Thumbnail'].includes(key)) {
                result[key] = formatValue(value);
            }
        });

        return result;
    } catch (e) {
        return { error: (e as Error).message };
    }
};

import QRCode from 'qrcode';

export const generateQrCode = async (text: string, options?: any) => {
    try {
        const url = await QRCode.toDataURL(text, {
            width: options?.size || 300,
            margin: options?.margin || 2,
            color: {
                dark: options?.colorDark || '#000000',
                light: options?.colorLight || '#ffffff',
            },
            errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
        });
        return url;
    } catch (e) {
        throw e;
    }
};

export const imageToAscii = async (file: File | Blob | string, options: { 
    width?: number, 
    charSet?: 'standard' | 'detailed' | 'blocks' | 'simple', 
    invert?: boolean, 
    contrast?: number 
} = {}) => {
    const CHAR_SETS = {
        standard: '@%#*+=-:. ',
        detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
        blocks: '█▓▒░ ',
        simple: '#. '
    };

    const img = new Image();
    const src = typeof file === 'string' ? file : URL.createObjectURL(file);
    
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const width = options.width || 100;
    const charAspectRatio = 0.5;
    const height = Math.max(1, Math.round((img.height / img.width) * width * charAspectRatio));

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const charSet = CHAR_SETS[options.charSet || 'standard'];
    const contrast = options.contrast || 1;

    let result = '';
    for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];
            const a = pixels[offset + 3];

            let brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
            if (a < 128) brightness = 255;

            if (contrast !== 1) {
                brightness = ((brightness / 255 - 0.5) * contrast + 0.5) * 255;
                brightness = Math.max(0, Math.min(255, brightness));
            }

            if (options.invert) brightness = 255 - brightness;

            const charIndex = Math.floor((brightness / 255) * (charSet.length - 1));
            row += charSet[charIndex];
        }
        result += row + '\n';
    }

    if (src.startsWith('blob:')) URL.revokeObjectURL(src);
    return result;
};
