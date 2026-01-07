import { Canvas, FabricImage, filters, IText, Shadow, Point } from 'fabric';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Slider } from '../../../components/ui/Slider';
import { RotateCw, Type, X, Check, Search, Maximize, Minus, Plus, Settings2, SlidersHorizontal, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface FrameEditorProps {
    imageUrl: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const FrameEditor: React.FC<FrameEditorProps> = ({ imageUrl, onSave, onCancel }) => {
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<'adjust' | 'text' | null>('adjust');
    const [showSettings, setShowSettings] = useState(true);
    
    // Filter State
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    
    // Transform State
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Parent container dimensions
        const container = canvasRef.current.parentElement;
        const width = container?.clientWidth || 800;
        const height = container?.clientHeight || 600;

        const canvas = new Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: undefined,
            selection: true
        });

        // Zoom & Pan logic
        canvas.on('mouse:wheel', function(opt) {
            var delta = opt.e.deltaY;
            var zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
            setZoom(zoom);
        });

        // Panning with Alt + Drag or Middle Click
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        canvas.on('mouse:down', function(opt) {
            const evt = opt.e as MouseEvent;
            if (evt.altKey || evt.button === 1) {
                isDragging = true;
                canvas.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
            }
        });

        canvas.on('mouse:move', function(opt) {
            if (isDragging) {
                const e = opt.e as MouseEvent;
                const vpt = canvas.viewportTransform!;
                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        });

        canvas.on('mouse:up', function(opt) {
            canvas.setViewportTransform(canvas.viewportTransform!);
            isDragging = false;
            canvas.selection = true;
        });

        FabricImage.fromURL(imageUrl).then(img => {
            // Fit image to canvas initially but keep ratio
            const scale = Math.min(
                (width - 80) / img.width!,
                (height - 80) / img.height!
            );
            
            img.set({
                originX: 'center',
                originY: 'center',
                left: width / 2,
                top: height / 2
            });
            img.scale(scale);
            
            img.set({
                cornerColor: '#3b82f6',
                cornerStyle: 'circle',
                borderColor: '#3b82f6',
                transparentCorners: false,
                erasable: false
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });

        setFabricCanvas(canvas);
        
        // Handle window resize
        const handleResize = () => {
             if (container) {
                 canvas.setDimensions({ width: container.clientWidth, height: container.clientHeight });
                 canvas.renderAll();
             }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
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

    const resetZoom = () => {
        if (!fabricCanvas) return;
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
        
        // Recenter image logic could go here
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage);
        if (mainImg) {
            fabricCanvas.setActiveObject(mainImg);
            // Center logic if needed
        }
    };

    return (
        <div className="relative w-full h-full bg-zinc-950 overflow-hidden group">
            {/* Full Screen Canvas */}
            <div className="absolute inset-0">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Toggle Settings Button (When hidden) */}
            {!showSettings && (
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="absolute right-4 top-4 p-2 glass-button text-white rounded-lg z-10"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            )}

            {/* Floating Zoom Controls - Bottom Left */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
                 <div className="flex flex-col glass-panel rounded-lg p-1">
                     <button onClick={() => {
                        fabricCanvas?.setZoom(zoom * 1.1);
                        setZoom(zoom * 1.1);
                     }} className="p-2 hover:bg-white/10 rounded text-white transition-colors"><Plus className="w-4 h-4"/></button>
                     <button onClick={() => {
                        fabricCanvas?.setZoom(zoom / 1.1);
                        setZoom(zoom / 1.1);
                     }} className="p-2 hover:bg-white/10 rounded text-white transition-colors"><Minus className="w-4 h-4"/></button>
                     <button onClick={resetZoom} className="p-2 hover:bg-white/10 rounded text-white transition-colors"><Maximize className="w-4 h-4"/></button>
                 </div>
            </div>

            {/* Floating Sidebar Settings */}
            <div className={cn(
                "absolute right-4 top-4 bottom-4 w-[300px] flex flex-col transition-all duration-300 ease-in-out z-20",
                showSettings ? "translate-x-0 opacity-100" : "translate-x-[320px] opacity-0 pointer-events-none"
            )}>
                <div className="flex-1 flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                            Editor
                        </h3>
                         <button 
                            onClick={() => setShowSettings(false)}
                            className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                         {/* Tools Tabs */}
                        <div className="flex p-1 bg-black/20 rounded-lg">
                            <button
                                onClick={() => setActiveTool('adjust')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all",
                                    activeTool === 'adjust' ? "bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#6366F1] text-white shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                            </button>
                            <button
                                onClick={() => setActiveTool('text')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all",
                                    activeTool === 'text' ? "bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#6366F1] text-white shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Type className="w-3.5 h-3.5" /> Watermark
                            </button>
                        </div>
                        
                        {activeTool === 'adjust' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-white/80">Transform</label>
                                    <div className="grid grid-cols-2 gap-2">
                                         <Button size="xs" variant="secondary" onClick={rotateImage} icon={RotateCw} className="w-full justify-center">Rotate 90°</Button>
                                         <Button size="xs" variant="secondary" onClick={resetZoom} icon={Maximize} className="w-full justify-center">Fit View</Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-white/80">Color Correction</label>
                                    <div className="space-y-4 pt-2">
                                        <Slider
                                            label="Brightness"
                                            min={-1}
                                            max={1}
                                            step={0.05}
                                            value={brightness}
                                            onChange={setBrightness}
                                            className="text-xs"
                                        />
                                        <Slider
                                            label="Contrast"
                                            min={-1}
                                            max={1}
                                            step={0.05}
                                            value={contrast}
                                            onChange={setContrast}
                                            className="text-xs"
                                        />
                                        <Slider
                                            label="Saturation"
                                            min={-1}
                                            max={1}
                                            step={0.05}
                                            value={saturation}
                                            onChange={setSaturation}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'text' && (
                             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                                 <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-400 border border-indigo-500/30">
                                     <Type className="w-6 h-6" />
                                 </div>
                                 <p className="text-sm text-white/80 px-4">Add a text overlay or watermark to your frame.</p>
                                 <Button onClick={addText} className="w-full" variant="primary">Add Text Layer</Button>
                                 <p className="text-[10px] text-white/40">Double click text on canvas to edit content.</p>
                             </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/10 bg-white/5 space-y-2">
                        <Button variant="primary" className="w-full" onClick={handleSave} icon={Check}>Save Changes</Button>
                        <Button variant="ghost" className="w-full text-white/60 hover:text-white" onClick={onCancel} icon={X}>Cancel</Button>
                    </div>
                </div>
            </div>
            
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            
            <div className="absolute top-4 left-4 text-white/50 text-xs font-mono pointer-events-none">
                Scroll to Zoom • Alt + Drag to Pan
            </div>
        </div>
    );
};
