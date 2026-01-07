export type RedactionType = 'blur' | 'pixelate' | 'solid';

export interface RedactionArea {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: RedactionType;
    color?: string; // For solid overlay
}

/**
 * Apply blur effect to a specific area of the canvas
 */
export function applyBlurRedaction(
    ctx: CanvasRenderingContext2D,
    area: RedactionArea,
    blurAmount: number = 20
): void {
    const imageData = ctx.getImageData(area.x, area.y, area.width, area.height);
    const blurred = gaussianBlur(imageData, blurAmount);
    ctx.putImageData(blurred, area.x, area.y);
}

/**
 * Apply pixelation effect to a specific area
 */
export function applyPixelateRedaction(
    ctx: CanvasRenderingContext2D,
    area: RedactionArea,
    pixelSize: number = 10
): void {
    const imageData = ctx.getImageData(area.x, area.y, area.width, area.height);
    const pixelated = pixelate(imageData, pixelSize);
    ctx.putImageData(pixelated, area.x, area.y);
}

/**
 * Apply solid color overlay to a specific area
 */
export function applySolidRedaction(
    ctx: CanvasRenderingContext2D,
    area: RedactionArea,
    color: string = '#000000'
): void {
    ctx.fillStyle = color;
    ctx.fillRect(area.x, area.y, area.width, area.height);
}

/**
 * Apply redaction based on type
 */
export function applyRedaction(
    ctx: CanvasRenderingContext2D,
    area: RedactionArea
): void {
    switch (area.type) {
        case 'blur':
            applyBlurRedaction(ctx, area);
            break;
        case 'pixelate':
            applyPixelateRedaction(ctx, area);
            break;
        case 'solid':
            applySolidRedaction(ctx, area, area.color || '#000000');
            break;
    }
}

/**
 * Simple Gaussian blur implementation
 */
function gaussianBlur(imageData: ImageData, radius: number): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);

    // Simple box blur approximation of Gaussian blur
    const kernel = createBlurKernel(radius);
    const kernelSize = kernel.length;
    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let weightSum = 0;

            for (let ky = 0; ky < kernelSize; ky++) {
                for (let kx = 0; kx < kernelSize; kx++) {
                    const px = Math.min(width - 1, Math.max(0, x + kx - half));
                    const py = Math.min(height - 1, Math.max(0, y + ky - half));
                    const idx = (py * width + px) * 4;
                    const weight = kernel[ky][kx];

                    r += data[idx] * weight;
                    g += data[idx + 1] * weight;
                    b += data[idx + 2] * weight;
                    a += data[idx + 3] * weight;
                    weightSum += weight;
                }
            }

            const outIdx = (y * width + x) * 4;
            output.data[outIdx] = r / weightSum;
            output.data[outIdx + 1] = g / weightSum;
            output.data[outIdx + 2] = b / weightSum;
            output.data[outIdx + 3] = a / weightSum;
        }
    }

    return output;
}

/**
 * Create a blur kernel
 */
function createBlurKernel(radius: number): number[][] {
    const size = Math.max(3, Math.floor(radius / 2) * 2 + 1);
    const kernel: number[][] = [];
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const value = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquare);
            kernel[y][x] = value;
            sum += value;
        }
    }

    // Normalize
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            kernel[y][x] /= sum;
        }
    }

    return kernel;
}

/**
 * Pixelate image data
 */
function pixelate(imageData: ImageData, pixelSize: number): ImageData {
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);

    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            // Calculate average color for this block
            let r = 0, g = 0, b = 0, a = 0, count = 0;

            for (let py = y; py < Math.min(y + pixelSize, height); py++) {
                for (let px = x; px < Math.min(x + pixelSize, width); px++) {
                    const idx = (py * width + px) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    a += data[idx + 3];
                    count++;
                }
            }

            r /= count;
            g /= count;
            b /= count;
            a /= count;

            // Apply average color to entire block
            for (let py = y; py < Math.min(y + pixelSize, height); py++) {
                for (let px = x; px < Math.min(x + pixelSize, width); px++) {
                    const idx = (py * width + px) * 4;
                    output.data[idx] = r;
                    output.data[idx + 1] = g;
                    output.data[idx + 2] = b;
                    output.data[idx + 3] = a;
                }
            }
        }
    }

    return output;
}
