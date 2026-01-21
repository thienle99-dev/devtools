

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


