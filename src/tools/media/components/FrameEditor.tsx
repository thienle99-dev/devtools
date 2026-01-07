import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, filters, IText, Shadow } from 'fabric';
import { Button } from '../../../components/ui/Button';
import { Slider } from '../../../components/ui/Slider';
import { RotateCw, Type, X, Check } from 'lucide-react';

interface FrameEditorProps {
    imageUrl: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const FrameEditor: React.FC<FrameEditorProps> = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<'adjust' | 'text' | null>('adjust');
    
    // Filter State
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    
    // Transform State
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: 800,
            height: 450,
            backgroundColor: '#1a1a1a'
        });

        FabricImage.fromURL(imageUrl).then(img => {
            // Fit image to canvas
            const scale = Math.min(
                (canvas.width! - 40) / img.width!,
                (canvas.height! - 40) / img.height!
            );
            
            // Fabric 6+ recommended way? img.set({ left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center' })
            img.set({
                originX: 'center',
                originY: 'center',
                left: canvas.width / 2,
                top: canvas.height / 2
            });
            img.set({
                cornerColor: '#6366f1',
                cornerStyle: 'circle',
                borderColor: '#6366f1',
                transparentCorners: false,
                erasable: false
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });

        setFabricCanvas(canvas);

        return () => {
            canvas.dispose();
        };
    }, [imageUrl]);

    const applyFilters = () => {
        if (!fabricCanvas) return;
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        if (!mainImg) return;

        mainImg.filters = [];

        if (brightness !== 0) {
            mainImg.filters.push(new filters.Brightness({ brightness }));
        }
        if (contrast !== 0) {
            mainImg.filters.push(new filters.Contrast({ contrast }));
        }
        if (saturation !== 0) {
            mainImg.filters.push(new filters.Saturation({ saturation }));
        }

        mainImg.applyFilters();
        fabricCanvas.requestRenderAll();
    };

    useEffect(() => {
        applyFilters();
    }, [brightness, contrast, saturation]);

    const rotateImage = () => {
        if (!fabricCanvas) return;
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        if (!mainImg) return;

        const currentAngle = mainImg.angle || 0;
        mainImg.rotate((currentAngle + 90) % 360);
        setRotation((currentAngle + 90) % 360);
        fabricCanvas.requestRenderAll();
    };

    const addText = () => {
        if (!fabricCanvas) return;
        const text = new IText('Watermark', {
            left: 50,
            top: 50,
            fontFamily: 'arial',
            fill: '#ffffff',
            fontSize: 40,
            shadow: new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 2, offsetX: 2, offsetY: 2 })
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    const handleSave = () => {
        if (!fabricCanvas) return;
        
        // Get the main image to determine output size (ignoring the canvas container size)
        // Or honestly, just exporting the canvas as is usually expected, but we might want original resolution.
        // For simplicity, we save what is seen on the canvas (multiplier to restore quality if we scaled down).
        
        // Better strategy: Use the main image's original dimensions? 
        // For now, let's just export the canvas content at high quality.
        
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        let multiplier = 1;
        
        if (mainImg) {
            // Try to match original image scale approximately if it was scaled down
             // This is tricky without storing original dims separately. 
             // Let's just do a reasonable valid multiplier (e.g. 2x) or 1x (screen res).
             multiplier = 2; 
        }

        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier 
        });

        // Convert DataURL to Blob
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => onSave(blob));
    };

    return (
        <div className="flex flex-col h-full bg-glass-panel border-l border-border-glass">
            <div className="flex-1 p-4 flex items-center justify-center bg-black/40 overflow-hidden relative">
                <canvas ref={canvasRef} />
            </div>

            <div className="bg-glass-background/90 p-4 border-t border-border-glass space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                    <Button
                        variant={activeTool === 'adjust' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveTool('adjust')}
                        icon={Slider}
                    >
                        Adjust
                    </Button>
                    <Button
                        variant={activeTool === 'text' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveTool('text')}
                        icon={Type}
                    >
                        Text/Watermark
                    </Button>
                </div>

                {activeTool === 'adjust' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-2">
                             <Button size="sm" variant="secondary" onClick={rotateImage} icon={RotateCw}>Rotate</Button>
                         </div>
                        <Slider
                            label="Brightness"
                            min={-1}
                            max={1}
                            step={0.05}
                            value={brightness}
                            onChange={setBrightness}
                        />
                        <Slider
                            label="Contrast"
                            min={-1}
                            max={1}
                            step={0.05}
                            value={contrast}
                            onChange={setContrast}
                        />
                        <Slider
                            label="Saturation"
                            min={-1}
                            max={1}
                            step={0.05}
                            value={saturation}
                            onChange={setSaturation}
                        />
                    </div>
                )}

                {activeTool === 'text' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 text-center">
                         <Button onClick={addText} className="w-full">Add Text Watermark</Button>
                         <p className="text-xs text-foreground-secondary">Double click text on canvas to edit</p>
                     </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-border-glass/50">
                    <Button variant="ghost" className="flex-1" onClick={onCancel} icon={X}>Cancel</Button>
                    <Button variant="primary" className="flex-1" onClick={handleSave} icon={Check}>Save Frame</Button>
                </div>
            </div>
        </div>
    );
};
