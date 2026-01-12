import { jsPDF } from 'jspdf';

export interface ImagesToPdfOptions {
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter';
    margin?: number;
    quality?: number;
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW';
}

export const convertImagesToPdf = async (images: (File | Blob | string)[], options: ImagesToPdfOptions = {}) => {
    const {
        orientation = 'portrait',
        pageSize = 'a4',
        margin = 0,
        quality = 1.0,
        compression = 'FAST'
    } = options;

    const pdf = new jsPDF({
        orientation: orientation as any,
        unit: 'mm',
        format: pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    for (let i = 0; i < images.length; i++) {
        if (i > 0) {
            pdf.addPage();
        }

        const imgData = images[i];
        const imgElement = new Image();
        
        const src = typeof imgData === 'string' ? imgData : URL.createObjectURL(imgData);

        await new Promise<void>((resolve, reject) => {
            imgElement.onload = () => {
                try {
                    let imgWidth = imgElement.width;
                    let imgHeight = imgElement.height;
                    const aspectRatio = imgWidth / imgHeight;

                    let finalWidth = contentWidth;
                    let finalHeight = contentWidth / aspectRatio;

                    if (finalHeight > contentHeight) {
                        finalHeight = contentHeight;
                        finalWidth = contentHeight * aspectRatio;
                    }

                    const x = margin + (contentWidth - finalWidth) / 2;
                    const y = margin + (contentHeight - finalHeight) / 2;

                    let compressionData: string | HTMLImageElement = imgElement;
                    if (quality < 1.0) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = imgElement.width;
                        tempCanvas.height = imgElement.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                            tempCtx.drawImage(imgElement, 0, 0);
                            compressionData = tempCanvas.toDataURL('image/jpeg', quality);
                        }
                    }

                    pdf.addImage(
                        compressionData, 
                        'JPEG', 
                        x, 
                        y, 
                        finalWidth, 
                        finalHeight, 
                        undefined, 
                        compression as any
                    );
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            imgElement.onerror = () => {
                reject(new Error(`Failed to load image at index ${i}`));
            };

            imgElement.src = src;
        });
        
        if (typeof imgData !== 'string' && src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
        }
    }

    return pdf.output('blob');
};
