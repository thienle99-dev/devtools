export interface FrameAnalysisResult {
    brightness: number; // 0-255
    blurScore: number; // Higher is sharper
    dominantColor: { r: number; g: number; b: number };
    contrast: number;
}

export const analyzeImage = async (blob: Blob): Promise<FrameAnalysisResult> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Resize for performance
            const width = 100;
            const scale = width / img.width;
            const height = Math.floor(img.height * scale);
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                 resolve({ brightness: 0, blurScore: 0, dominantColor: { r: 0, g: 0, b: 0 }, contrast: 0 });
                 return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            let rTotal = 0, gTotal = 0, bTotal = 0;
            let totalBrightness = 0;
            let minBrightness = 255;
            let maxBrightness = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                rTotal += r;
                gTotal += g;
                bTotal += b;

                // Perceieved brightness
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;

                if (brightness < minBrightness) minBrightness = brightness;
                if (brightness > maxBrightness) maxBrightness = brightness;
            }

            const pixelCount = data.length / 4;
            
            // Contrast (Michelson-ish but simple range for now)
            const contrast = (maxBrightness - minBrightness);

            // Lapalcian Variance for Blur
            // Standard generic kernel: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]]
            const grayData = new Float32Array(pixelCount);
            for(let i=0; i<pixelCount; i++) {
                grayData[i] = 0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2];
            }

            let laplacianMean = 0;
            const laplacianValues = new Float32Array(pixelCount);

            // Simple convolution (ignoring borders for speed)
            let lCount = 0;
            for(let y=1; y<height-1; y++) {
                for(let x=1; x<width-1; x++) {
                    const idx = y * width + x;
                    
                    const val = 
                        grayData[idx] * 4 -
                        grayData[idx - 1] -
                        grayData[idx + 1] -
                        grayData[idx - width] -
                        grayData[idx + width];
                    
                    laplacianValues[lCount++] = val;
                    laplacianMean += val;
                }
            }
             laplacianMean /= lCount;

             let variance = 0;
             for(let i=0; i<lCount; i++) {
                 variance += (laplacianValues[i] - laplacianMean) ** 2;
             }
             const blurScore = variance / lCount; // Variance of Laplacian

            resolve({
                brightness: totalBrightness / pixelCount,
                dominantColor: {
                    r: Math.round(rTotal / pixelCount),
                    g: Math.round(gTotal / pixelCount),
                    b: Math.round(bTotal / pixelCount)
                },
                blurScore,
                contrast
            });
        };
    });
};
