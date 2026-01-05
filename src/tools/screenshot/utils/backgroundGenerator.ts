export type GradientType = 'linear' | 'radial' | 'conic';
export type GradientDirection = 'to-top' | 'to-bottom' | 'to-left' | 'to-right' | 'to-top-right' | 'to-top-left' | 'to-bottom-right' | 'to-bottom-left';

export interface GradientBackground {
    type: GradientType;
    colors: string[];
    direction?: GradientDirection;
    angle?: number; // For linear gradients
}

export interface ImageBackground {
    type: 'image';
    imageUrl: string;
    blur?: number;
    opacity?: number;
}

export type Background = GradientBackground | ImageBackground | { type: 'solid'; color: string };

/**
 * Predefined gradient backgrounds
 */
export const PRESET_GRADIENTS: Array<GradientBackground & { name: string }> = [
    {
        name: 'Sunset',
        type: 'linear',
        colors: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
        direction: 'to-bottom-right'
    },
    {
        name: 'Ocean',
        type: 'linear',
        colors: ['#2E3192', '#1BFFFF'],
        direction: 'to-bottom'
    },
    {
        name: 'Purple Dream',
        type: 'linear',
        colors: ['#A770EF', '#CF8BF3', '#FDB99B'],
        direction: 'to-right'
    },
    {
        name: 'Forest',
        type: 'linear',
        colors: ['#134E5E', '#71B280'],
        direction: 'to-bottom-right'
    },
    {
        name: 'Fire',
        type: 'linear',
        colors: ['#F83600', '#F9D423'],
        direction: 'to-top'
    },
    {
        name: 'Midnight',
        type: 'linear',
        colors: ['#232526', '#414345'],
        direction: 'to-bottom'
    },
    {
        name: 'Peach',
        type: 'linear',
        colors: ['#ED4264', '#FFEDBC'],
        direction: 'to-right'
    },
    {
        name: 'Sky',
        type: 'linear',
        colors: ['#0F2027', '#203A43', '#2C5364'],
        direction: 'to-bottom'
    },
    {
        name: 'Candy',
        type: 'linear',
        colors: ['#D38312', '#A83279'],
        direction: 'to-top-right'
    },
    {
        name: 'Northern Lights',
        type: 'linear',
        colors: ['#00C9FF', '#92FE9D'],
        direction: 'to-bottom-right'
    }
];

/**
 * Generate CSS gradient string
 */
export function generateGradientCSS(gradient: GradientBackground): string {
    const colorStops = gradient.colors.join(', ');

    switch (gradient.type) {
        case 'linear': {
            const direction = gradient.direction || 'to-bottom';
            return `linear-gradient(${direction}, ${colorStops})`;
        }
        case 'radial':
            return `radial-gradient(circle, ${colorStops})`;
        case 'conic':
            return `conic-gradient(${colorStops})`;
        default:
            return `linear-gradient(to-bottom, ${colorStops})`;
    }
}

/**
 * Apply gradient background to canvas
 */
export function applyGradientBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gradient: GradientBackground
): void {
    let grad: CanvasGradient;

    switch (gradient.type) {
        case 'linear': {
            const { x0, y0, x1, y1 } = getLinearGradientCoordinates(
                width,
                height,
                gradient.direction || 'to-bottom'
            );
            grad = ctx.createLinearGradient(x0, y0, x1, y1);
            break;
        }
        case 'radial':
            grad = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) / 2
            );
            break;
        case 'conic':
            grad = ctx.createConicGradient(0, width / 2, height / 2);
            break;
        default:
            grad = ctx.createLinearGradient(0, 0, 0, height);
    }

    // Add color stops
    const colorCount = gradient.colors.length;
    gradient.colors.forEach((color, index) => {
        grad.addColorStop(index / (colorCount - 1), color);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Get linear gradient coordinates based on direction
 */
function getLinearGradientCoordinates(
    width: number,
    height: number,
    direction: GradientDirection
): { x0: number; y0: number; x1: number; y1: number } {
    switch (direction) {
        case 'to-top':
            return { x0: 0, y0: height, x1: 0, y1: 0 };
        case 'to-bottom':
            return { x0: 0, y0: 0, x1: 0, y1: height };
        case 'to-left':
            return { x0: width, y0: 0, x1: 0, y1: 0 };
        case 'to-right':
            return { x0: 0, y0: 0, x1: width, y1: 0 };
        case 'to-top-right':
            return { x0: 0, y0: height, x1: width, y1: 0 };
        case 'to-top-left':
            return { x0: width, y0: height, x1: 0, y1: 0 };
        case 'to-bottom-right':
            return { x0: 0, y0: 0, x1: width, y1: height };
        case 'to-bottom-left':
            return { x0: width, y0: 0, x1: 0, y1: height };
        default:
            return { x0: 0, y0: 0, x1: 0, y1: height };
    }
}

/**
 * Apply image background with optional blur
 */
export async function applyImageBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    imageUrl: string,
    blur: number = 0,
    opacity: number = 1
): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Apply blur if needed
            if (blur > 0) {
                ctx.filter = `blur(${blur}px)`;
            }

            // Apply opacity
            ctx.globalAlpha = opacity;

            // Draw image (cover the entire canvas)
            const scale = Math.max(width / img.width, height / img.height);
            const x = (width - img.width * scale) / 2;
            const y = (height - img.height * scale) / 2;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Reset filters
            ctx.filter = 'none';
            ctx.globalAlpha = 1;

            resolve();
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

/**
 * Apply solid color background
 */
export function applySolidBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string
): void {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Add padding/margin around screenshot on background
 */
export function addPaddingToScreenshot(
    originalCanvas: HTMLCanvasElement,
    padding: number,
    background: Background
): HTMLCanvasElement {
    const newWidth = originalCanvas.width + padding * 2;
    const newHeight = originalCanvas.height + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;

    // Apply background
    if (background.type === 'solid') {
        applySolidBackground(ctx, newWidth, newHeight, background.color);
    } else if ('colors' in background) {
        applyGradientBackground(ctx, newWidth, newHeight, background);
    }

    // Draw original screenshot with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.drawImage(originalCanvas, padding, padding);

    return canvas;
}
