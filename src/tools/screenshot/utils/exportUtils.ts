// Phase 2: Lazy load Fabric.js (15MB saved on initial load)
import { loadFabric } from '@utils/lazyLoad';
import { applyAutoBalance } from './imageEnhancement';
import { applyRedaction, type RedactionArea } from './redaction';
import { applyGradientBackground, applyImageBackground, applySolidBackground, addPaddingToScreenshot, type Background } from './backgroundGenerator';

/**
 * Generate final processed image with all effects applied, including annotations
 */
export async function generateFinalImage(
    originalDataUrl: string,
    options: {
        autoBalance?: boolean;
        redactionAreas?: RedactionArea[];
        background?: Background | null;
        backgroundPadding?: number;
        annotations?: string; // JSON string of Fabric.js objects
        outputConfig?: OutputConfig;
        // Xnapper-style controls
        borderRadius?: number;
        shadowBlur?: number;
        shadowOpacity?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        inset?: number;
        showWindowControls?: boolean;
        watermark?: { text: string; opacity: number; position: string; fontSize?: number };
        aspectRatio?: string;
    }
): Promise<string> {
    // 1. Generate the base image (Auto-balance + Redactions + Background/Padding) using Native Canvas API
    // We do this first because it's efficient for pixel manipulation
    const baseImagePromise = new Promise<string>((resolve) => {
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

            // Apply background/padding/ratio if any are set
            const hasBackground = !!options.background;
            const hasPadding = (options.backgroundPadding || 0) > 0;
            const hasRatio = options.aspectRatio && options.aspectRatio !== 'auto';

            if (hasBackground || hasPadding || hasRatio) {
                // Ensure we have a background object if we need to pad/ratio
                const background = options.background || { type: 'solid', color: 'transparent' };
                const padding = options.backgroundPadding || 0;

                const finalCanvas = addPaddingToScreenshot(canvas, padding, background, options.aspectRatio);

                // Handle image background separately if it's an image
                if (background.type === 'image') {
                    const bgCanvas = document.createElement('canvas');
                    bgCanvas.width = finalCanvas.width;
                    bgCanvas.height = finalCanvas.height;
                    const bgCtx = bgCanvas.getContext('2d')!;

                    await applyImageBackground(
                        bgCtx,
                        bgCanvas.width,
                        bgCanvas.height,
                        background.imageUrl,
                        background.blur,
                        background.opacity
                    );

                    // Draw original screenshot (centered)
                    bgCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    bgCtx.shadowBlur = 20;
                    bgCtx.shadowOffsetX = 0;
                    bgCtx.shadowOffsetY = 10;

                    const x = (bgCanvas.width - canvas.width) / 2;
                    const y = (bgCanvas.height - canvas.height) / 2;
                    bgCtx.drawImage(canvas, x, y);

                    resolve(bgCanvas.toDataURL('image/png'));
                } else {
                    resolve(finalCanvas.toDataURL('image/png'));
                }
            } else {
                resolve(canvas.toDataURL('image/png'));
            }
        };
        img.src = originalDataUrl;
    });

    const baseDataUrl = await baseImagePromise;

    // 2. Apply border radius, shadow, and inset FIRST (before annotations)
    let styledBaseUrl = baseDataUrl;
    const needsStyling = options.borderRadius || options.shadowBlur || options.inset || 
                         options.showWindowControls || (options.watermark?.text && options.watermark.text.trim());
    
    console.log('🎨 Checking if styling needed:', {
        borderRadius: options.borderRadius,
        shadowBlur: options.shadowBlur,
        inset: options.inset,
        showWindowControls: options.showWindowControls,
        watermarkText: options.watermark?.text,
        needsStyling
    });
    
    if (needsStyling) {
        styledBaseUrl = await applyBorderRadiusAndShadow(baseDataUrl, {
            borderRadius: options.borderRadius,
            shadowBlur: options.shadowBlur,
            shadowOpacity: options.shadowOpacity,
            shadowOffsetX: options.shadowOffsetX,
            shadowOffsetY: options.shadowOffsetY,
            inset: options.inset,
            showWindowControls: options.showWindowControls,
            watermark: options.watermark,
        });
    }

    // 3. If no annotations, return styled base image
    if (!options.annotations || options.annotations === '[]') {
        if (options.outputConfig) {
            return applyOutputConfig(styledBaseUrl, options.outputConfig, options.background);
        }
        return styledBaseUrl;
    }

    // 4. Apply annotations using Fabric.js (lazy loaded)
    // We create a temporary Fabric canvas, load the base image, overlay annotations, and export
    const annotationPromise = new Promise<string>(async (resolve) => {
        try {
            // Lazy load Fabric.js
            const fabric = await loadFabric();

            // Create a virtual canvas element
            const canvasEl = document.createElement('canvas');
            const fabricCanvas = new fabric.StaticCanvas(canvasEl);

            // Load styled base image (with border radius, shadow already applied)
            fabric.Image.fromURL(styledBaseUrl, { crossOrigin: 'anonymous' }).then((bgImg) => {
                const width = bgImg.width!;
                const height = bgImg.height!;

                fabricCanvas.setDimensions({ width, height });
                fabricCanvas.backgroundImage = bgImg;

                // Load annotations
                const objects = JSON.parse(options.annotations!);

                fabric.util.enlivenObjects(objects, {}).then((enlivenedObjects: any[]) => {
                    enlivenedObjects.forEach((obj) => {
                        fabricCanvas.add(obj);
                    });

                    fabricCanvas.renderAll();
                    const finalDataUrl = fabricCanvas.toDataURL({
                        format: 'png',
                        multiplier: 1
                    });

                    // Cleanup
                    fabricCanvas.dispose();
                    resolve(finalDataUrl);
                }).catch(err => {
                    console.error('Error enlivening objects:', err);
                    resolve(styledBaseUrl); // Fallback to styled base
                });
            }).catch(err => {
                console.error('Error loading base image into fabric:', err);
                resolve(styledBaseUrl);
            });
        } catch (e) {
            console.error('Error in annotation export:', e);
            resolve(styledBaseUrl);
        }
    });

    const finalDataUrl = await annotationPromise;

    // 5. Apply output dimensions / presets if specified
    if (options.outputConfig) {
        return applyOutputConfig(finalDataUrl, options.outputConfig, options.background);
    }

    return finalDataUrl;
}

export type SocialPreset = 'twitter' | 'instagram-square' | 'instagram-portrait' | 'instagram-story';

export interface OutputConfig {
    width?: number;
    height?: number;
    preset?: SocialPreset;
    scale?: number;
}

export const SOCIAL_PRESETS: Record<SocialPreset, { ratio: number; label: string }> = {
    'twitter': { ratio: 16 / 9, label: 'Twitter (16:9)' },
    'instagram-square': { ratio: 1 / 1, label: 'Instagram (1:1)' },
    'instagram-portrait': { ratio: 4 / 5, label: 'Instagram (4:5)' },
    'instagram-story': { ratio: 9 / 16, label: 'Story (9:16)' },
};

export async function applyOutputConfig(
    dataUrl: string,
    config: OutputConfig,
    background: Background | null | undefined
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let targetWidth = img.width;
            let targetHeight = img.height;
            let isContainer = false; // If true, we pad/contain. If false, we scale/stretch (custom dims).

            // Handle Scaling
            if (config.scale && config.scale !== 1) {
                targetWidth = Math.round(targetWidth * config.scale);
                targetHeight = Math.round(targetHeight * config.scale);
            }

            // Handle Custom Dimensions (Resize/Stretch or Fit?)
            // Usually valid export is "Scale to Width" keeping aspect ratio.
            if (config.width && !config.height) {
                const ratio = img.width / img.height;
                targetWidth = config.width;
                targetHeight = Math.round(targetWidth / ratio);
            } else if (config.height && !config.width) {
                const ratio = img.width / img.height;
                targetHeight = config.height;
                targetWidth = Math.round(targetHeight * ratio);
            } else if (config.width && config.height) {
                // Skew? Or Crop? Or Fit?
                // Let's assume user wants to force specific size, usually via scaling.
                targetWidth = config.width;
                targetHeight = config.height;
            }

            // Handle Presets (Container Padding)
            if (config.preset) {
                isContainer = true;
                const preset = SOCIAL_PRESETS[config.preset];
                if (preset) {
                    const currentRatio = targetWidth / targetHeight;
                    // If image is wider than target ratio, fit width (add vertical padding)
                    // If image is taller, fit height (add horizontal padding)
                    // BUT Social Presets usually mean "Minimum Size" or "Fixed Aspect Ratio".
                    // We calculate the bounding box that contains the image at the given ratio.
                    // Usually we expand the canvas to meet the ratio.
                    if (currentRatio > preset.ratio) {
                        // Image is wider. Height needs to increase.
                        // New Height = Width / TargetRatio
                        targetHeight = Math.round(targetWidth / preset.ratio);
                    } else {
                        // Image is taller. Width needs to increase.
                        // New Width = Height * TargetRatio
                        targetWidth = Math.round(targetHeight * preset.ratio);
                    }
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d')!;

            if (isContainer) {
                // Apply background to the container
                if (background) {
                    if (background.type === 'solid') {
                        applySolidBackground(ctx, targetWidth, targetHeight, background.color);
                    } else if ('colors' in background) {
                        applyGradientBackground(ctx, targetWidth, targetHeight, background);
                    } else if (background.type === 'image') {
                        // For image background, we might need async loading, but applyImageBackground is async.
                        // Since we are synchronous in 'onload', we must handle async.
                        // We'll skip complex async backgroud re-application here for MVP and just use white or simple fill if complex?
                        // Or better, convert applyOutputConfig to async properly (it is promise-wrapped).
                    }
                } else {
                    // Default generic background if none set? Transparent.
                }

                // If background is image, we face async issue inside sync onload...
                // Ideally, we move this logic out.
                // But let's check applyImageBackground... it returns Promise.

                const drawContent = () => {
                    // Draw image centered
                    // Note: img.width is source size.
                    // Scaled logic above was determining 'target'.
                    // If we resize (custom dims), we draw scaled.
                    // If we contain (preset), we draw original centered.

                    // Actually, if we scaled (config.scale), we should draw scaled.
                    // If isContainer, we draw centered.

                    // Complex case: Preset + Scale?
                    // Let's assume Preset implies "Fit Original into Aspect Ratio container".
                    // So we draw original centered.

                    const drawX = (targetWidth - img.width) / 2;
                    const drawY = (targetHeight - img.height) / 2;
                    ctx.drawImage(img, drawX, drawY);

                    resolve(canvas.toDataURL('image/png'));
                };

                if (background && background.type === 'image') {
                    applyImageBackground(ctx, targetWidth, targetHeight, background.imageUrl, background.blur, background.opacity)
                        .then(drawContent)
                        .catch(e => {
                            console.error(e);
                            drawContent();
                        });
                } else {
                    drawContent();
                }

            } else {
                // Direct resize (Stretch/Scale)
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/png'));
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

/**
 * Apply border radius and shadow to screenshot (Xnapper-style)
 */
export async function applyBorderRadiusAndShadow(
    dataUrl: string,
    options: {
        borderRadius?: number;
        shadowBlur?: number;
        shadowOpacity?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        inset?: number;
        showWindowControls?: boolean;
        watermark?: { text: string; opacity: number; position: string; fontSize?: number };
    }
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const {
                borderRadius = 0,
                shadowBlur = 0,
                shadowOpacity = 0,
                shadowOffsetX = 0,
                shadowOffsetY = 0,
                inset = 0,
                showWindowControls = false,
                watermark,
            } = options;

            // Calculate canvas size (add space for shadow)
            const shadowSpread = Math.max(
                Math.abs(shadowOffsetX) + shadowBlur,
                Math.abs(shadowOffsetY) + shadowBlur
            );
            const canvasWidth = img.width + shadowSpread * 2;
            const canvasHeight = img.height + shadowSpread * 2;

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d')!;

            // Calculate position (centered with shadow offset)
            const x = shadowSpread + shadowOffsetX;
            const y = shadowSpread + shadowOffsetY;

            // Apply shadow
            if (shadowBlur > 0 && shadowOpacity > 0) {
                ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowOffsetX = 0; // We already positioned the image
                ctx.shadowOffsetY = 0;
            }

            // Draw with rounded corners
            if (borderRadius > 0) {
                ctx.save();
                ctx.beginPath();

                // Create rounded rectangle path (with inset)
                const rectX = x + inset;
                const rectY = y + inset;
                const rectWidth = img.width - inset * 2;
                const rectHeight = img.height - inset * 2;

                ctx.moveTo(rectX + borderRadius, rectY);
                ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
                ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius);
                ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
                ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight);
                ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius);
                ctx.lineTo(rectX, rectY + borderRadius);
                ctx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
                ctx.closePath();

                ctx.clip();

                // Draw image within clipped area
                if (inset > 0) {
                    // Draw inset portion of image
                    ctx.drawImage(
                        img,
                        inset, inset, img.width - inset * 2, img.height - inset * 2,
                        rectX, rectY, rectWidth, rectHeight
                    );
                } else {
                    ctx.drawImage(img, x, y);
                }

                ctx.restore();
            } else {
                // No border radius, just draw normally
                if (inset > 0) {
                    const rectX = x + inset;
                    const rectY = y + inset;
                    const rectWidth = img.width - inset * 2;
                    const rectHeight = img.height - inset * 2;

                    ctx.drawImage(
                        img,
                        inset, inset, img.width - inset * 2, img.height - inset * 2,
                        rectX, rectY, rectWidth, rectHeight
                    );
                } else {
                    ctx.drawImage(img, x, y);
                }
            }

            // Draw Window Controls (Traffic Lights)
            if (showWindowControls) {
                const rectX = x + inset;
                const rectY = y + inset;
                const cx = rectX + 20;
                const cy = rectY + 20;
                const gap = 20;
                const size = 12;

                // Red
                ctx.beginPath();
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                ctx.fillStyle = '#FF5F56';
                ctx.fill();

                // Yellow
                ctx.beginPath();
                ctx.arc(cx + gap, cy, size / 2, 0, Math.PI * 2);
                ctx.fillStyle = '#FFBD2E';
                ctx.fill();

                // Green
                ctx.beginPath();
                ctx.arc(cx + gap * 2, cy, size / 2, 0, Math.PI * 2);
                ctx.fillStyle = '#27C93F';
                ctx.fill();
            }

            // Draw Watermark
            if (watermark && watermark.text) {
                const fontSize = watermark.fontSize || 16;
                console.log('💧 Drawing watermark:', {
                    text: watermark.text,
                    opacity: watermark.opacity,
                    position: watermark.position,
                    fontSize
                });
                
                ctx.save();
                ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                const opacity = watermark.opacity || 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;

                const metrics = ctx.measureText(watermark.text);
                const padding = 20;
                // Coordinates relative to the drawn image (x, y) + dimensions
                // If inset is used, the visual image is smaller.
                // We typically want watermark inside the "Window" (which includes inset padding?)
                // Xnapper "Window" is the rounded rect.
                // So we use x + inset, y + inset as origin, and img.width - inset*2 as size?
                // Actually img.width is the source. The rect width is img.width - inset*2.

                const rectX = x + inset;
                const rectY = y + inset;
                const rectW = img.width - inset * 2;
                const rectH = img.height - inset * 2;

                let wx = rectX + padding;
                let wy = rectY + rectH - padding;

                if (watermark.position === 'bottom-right') {
                    wx = rectX + rectW - metrics.width - padding;
                    wy = rectY + rectH - padding;
                } else if (watermark.position === 'bottom-left') {
                    wx = rectX + padding;
                    wy = rectY + rectH - padding;
                } else if (watermark.position === 'top-right') {
                    wx = rectX + rectW - metrics.width - padding;
                    wy = rectY + padding + 14;
                } else if (watermark.position === 'top-left') {
                    wx = rectX + padding;
                    wy = rectY + padding + 14;
                } else if (watermark.position === 'center') {
                    wx = rectX + (rectW / 2) - (metrics.width / 2);
                    wy = rectY + (rectH / 2);
                }

                ctx.fillText(watermark.text, wx, wy);
                ctx.restore();
            }

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}
