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
