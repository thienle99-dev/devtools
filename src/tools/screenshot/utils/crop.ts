/**
 * Crop image to specified bounds
 */
export function cropImage(
    imageDataUrl: string,
    bounds: { x: number; y: number; width: number; height: number }
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = bounds.width;
            canvas.height = bounds.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Draw cropped portion
            ctx.drawImage(
                img,
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height,
                0,
                0,
                bounds.width,
                bounds.height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageDataUrl;
    });
}

/**
 * Get crop bounds from selection
 */
export interface CropBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Validate crop bounds
 */
export function validateCropBounds(
    bounds: CropBounds,
    imageWidth: number,
    imageHeight: number
): boolean {
    return (
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.width > 0 &&
        bounds.height > 0 &&
        bounds.x + bounds.width <= imageWidth &&
        bounds.y + bounds.height <= imageHeight
    );
}

/**
 * Calculate aspect ratio constrained bounds
 */
export function constrainToAspectRatio(
    bounds: CropBounds,
    aspectRatio: number | null
): CropBounds {
    if (!aspectRatio) return bounds;

    const currentRatio = bounds.width / bounds.height;

    if (currentRatio > aspectRatio) {
        // Width is too large
        const newWidth = bounds.height * aspectRatio;
        return {
            ...bounds,
            width: newWidth,
        };
    } else {
        // Height is too large
        const newHeight = bounds.width / aspectRatio;
        return {
            ...bounds,
            height: newHeight,
        };
    }
}

/**
 * Common aspect ratios
 */
export const ASPECT_RATIOS = {
    FREE: null,
    SQUARE: 1,
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '3:2': 3 / 2,
    '21:9': 21 / 9,
};
