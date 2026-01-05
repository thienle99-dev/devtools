import { applyAutoBalance } from './imageEnhancement';
import { applyRedaction, type RedactionArea } from './redaction';
import { applyGradientBackground, applyImageBackground, applySolidBackground, addPaddingToScreenshot, type Background } from './backgroundGenerator';

/**
 * Generate final processed image with all effects applied
 */
export async function generateFinalImage(
    originalDataUrl: string,
    options: {
        autoBalance?: boolean;
        redactionAreas?: RedactionArea[];
        background?: Background | null;
        backgroundPadding?: number;
    }
): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const img = new Image();
        img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Apply auto-balance
            if (options.autoBalance) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const enhanced = applyAutoBalance(imageData);
                ctx.putImageData(enhanced, 0, 0);
            }

            // Apply redactions
            if (options.redactionAreas) {
                for (const area of options.redactionAreas) {
                    applyRedaction(ctx, area);
                }
            }

            // Apply background if set
            if (options.background && options.backgroundPadding && options.backgroundPadding > 0) {
                const finalCanvas = addPaddingToScreenshot(canvas, options.backgroundPadding, options.background);

                // Handle image background separately
                if (options.background.type === 'image') {
                    const bgCanvas = document.createElement('canvas');
                    bgCanvas.width = finalCanvas.width;
                    bgCanvas.height = finalCanvas.height;
                    const bgCtx = bgCanvas.getContext('2d')!;

                    await applyImageBackground(
                        bgCtx,
                        bgCanvas.width,
                        bgCanvas.height,
                        options.background.imageUrl,
                        options.background.blur,
                        options.background.opacity
                    );

                    // Draw screenshot on top
                    bgCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    bgCtx.shadowBlur = 20;
                    bgCtx.shadowOffsetX = 0;
                    bgCtx.shadowOffsetY = 10;
                    bgCtx.drawImage(canvas, options.backgroundPadding, options.backgroundPadding);

                    resolve(bgCanvas.toDataURL('image/png'));
                } else {
                    resolve(finalCanvas.toDataURL('image/png'));
                }
            } else if (options.background && (!options.backgroundPadding || options.backgroundPadding === 0)) {
                // Background without padding
                const bgCanvas = document.createElement('canvas');
                bgCanvas.width = canvas.width;
                bgCanvas.height = canvas.height;
                const bgCtx = bgCanvas.getContext('2d')!;

                if (options.background.type === 'solid') {
                    applySolidBackground(bgCtx, bgCanvas.width, bgCanvas.height, options.background.color);
                } else if ('colors' in options.background) {
                    applyGradientBackground(bgCtx, bgCanvas.width, bgCanvas.height, options.background);
                } else if (options.background.type === 'image') {
                    await applyImageBackground(
                        bgCtx,
                        bgCanvas.width,
                        bgCanvas.height,
                        options.background.imageUrl,
                        options.background.blur,
                        options.background.opacity
                    );
                }

                bgCtx.drawImage(canvas, 0, 0);
                resolve(bgCanvas.toDataURL('image/png'));
            } else {
                resolve(canvas.toDataURL('image/png'));
            }
        };
        img.src = originalDataUrl;
    });
}
