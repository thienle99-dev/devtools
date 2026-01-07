/**
 * Apply auto-balance enhancement to an image
 * This adjusts brightness, contrast, and color balance automatically
 */
export function applyAutoBalance(imageData: ImageData): ImageData {
    const data = imageData.data;
    const pixels = data.length / 4;

    // Calculate histogram
    const histogram = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
    };

    for (let i = 0; i < pixels; i++) {
        const idx = i * 4;
        histogram.r[data[idx]]++;
        histogram.g[data[idx + 1]]++;
        histogram.b[data[idx + 2]]++;
    }

    // Find min and max values for each channel
    const findMinMax = (hist: number[]) => {
        let min = 0, max = 255;
        const threshold = pixels * 0.01; // Ignore 1% outliers

        let count = 0;
        for (let i = 0; i < 256; i++) {
            count += hist[i];
            if (count > threshold) {
                min = i;
                break;
            }
        }

        count = 0;
        for (let i = 255; i >= 0; i--) {
            count += hist[i];
            if (count > threshold) {
                max = i;
                break;
            }
        }

        return { min, max };
    };

    const rRange = findMinMax(histogram.r);
    const gRange = findMinMax(histogram.g);
    const bRange = findMinMax(histogram.b);

    // Apply contrast stretching
    const enhanced = new ImageData(imageData.width, imageData.height);

    for (let i = 0; i < pixels; i++) {
        const idx = i * 4;

        // Stretch each channel
        enhanced.data[idx] = Math.min(255, Math.max(0,
            ((data[idx] - rRange.min) * 255) / (rRange.max - rRange.min)
        ));
        enhanced.data[idx + 1] = Math.min(255, Math.max(0,
            ((data[idx + 1] - gRange.min) * 255) / (gRange.max - gRange.min)
        ));
        enhanced.data[idx + 2] = Math.min(255, Math.max(0,
            ((data[idx + 2] - bRange.min) * 255) / (bRange.max - bRange.min)
        ));
        enhanced.data[idx + 3] = data[idx + 3]; // Alpha channel unchanged
    }

    return enhanced;
}

/**
 * Apply brightness adjustment to an image
 */
export function applyBrightness(imageData: ImageData, brightness: number): ImageData {
    const data = imageData.data;
    const adjusted = new ImageData(imageData.width, imageData.height);

    for (let i = 0; i < data.length; i += 4) {
        adjusted.data[i] = Math.min(255, Math.max(0, data[i] + brightness));
        adjusted.data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
        adjusted.data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
        adjusted.data[i + 3] = data[i + 3];
    }

    return adjusted;
}

/**
 * Apply contrast adjustment to an image
 */
export function applyContrast(imageData: ImageData, contrast: number): ImageData {
    const data = imageData.data;
    const adjusted = new ImageData(imageData.width, imageData.height);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        adjusted.data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        adjusted.data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        adjusted.data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
        adjusted.data[i + 3] = data[i + 3];
    }

    return adjusted;
}

/**
 * Convert image data URL to blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
}

/**
 * Convert blob to data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Resize image while maintaining aspect ratio
 */
export function resizeImage(
    imageData: ImageData,
    maxWidth: number,
    maxHeight: number
): ImageData {
    const { width, height } = imageData;
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (height * maxWidth) / width;
    }

    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (width * maxHeight) / height;
    }

    if (newWidth === width && newHeight === height) {
        return imageData;
    }

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;

    // Create temporary canvas with original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    // Draw resized
    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

    return ctx.getImageData(0, 0, newWidth, newHeight);
}
