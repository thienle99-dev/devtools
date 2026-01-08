import { Canvas, FabricImage, filters, IText, Shadow, Point, Rect } from 'fabric';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Slider } from '../../../components/ui/Slider';
import { RotateCw, Type, X, Check, Maximize, Minus, Plus, Settings2, SlidersHorizontal, ChevronRight, Crop as CropIcon, FlipHorizontal, FlipVertical, Droplet } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface FrameEditorProps {
    imageUrl: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

export const FrameEditor: React.FC<FrameEditorProps> = ({ imageUrl, onSave, onCancel }) => {
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<'adjust' | 'filters' | 'text' | 'crop'>('adjust');
    const [showSettings, setShowSettings] = useState(true);
    
    // Filter State
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [blur, setBlur] = useState(0);
    const [grayscale, setGrayscale] = useState(false);
    const [sepia, setSepia] = useState(false);
    
    // Transform State
    const [zoom, setZoom] = useState(1);
    
    // Crop State
    const [isCropping, setIsCropping] = useState(false);
    const cropRectRef = useRef<Rect | null>(null);

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
            backgroundColor: '#18181b', // Zinc-950
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

        canvas.on('mouse:up', function() {
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
             if (container && canvas) {
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
        if (blur > 0) {
            mainImg.filters.push(new filters.Blur({ blur }));
        }
        if (grayscale) {
            mainImg.filters.push(new filters.Grayscale());
        }
        if (sepia) {
            mainImg.filters.push(new filters.Sepia());
        }

        mainImg.applyFilters();
        fabricCanvas.requestRenderAll();
    };

    useEffect(() => {
        applyFilters();
    }, [brightness, contrast, saturation, blur, grayscale, sepia]);

    const rotateImage = () => {
        if (!fabricCanvas) return;
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        if (!mainImg) return;

        const currentAngle = mainImg.angle || 0;
        const newAngle = (currentAngle + 90) % 360;
        mainImg.rotate(newAngle);
        fabricCanvas.requestRenderAll();
    };

    const flipImage = (axis: 'X' | 'Y') => {
        if (!fabricCanvas) return;
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        if (!mainImg) return;
        
        if (axis === 'X') {
            mainImg.set('flipX', !mainImg.flipX);
        } else {
            mainImg.set('flipY', !mainImg.flipY);
        }
        fabricCanvas.requestRenderAll();
    };

    const addText = () => {
        if (!fabricCanvas) return;
        const text = new IText('Watermark', {
            left: fabricCanvas.width! / 2,
            top: fabricCanvas.height! / 2,
            originX: 'center',
            originY: 'center',
            fontFamily: 'arial',
            fill: '#ffffff',
            fontSize: 40,
            shadow: new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 2, offsetX: 2, offsetY: 2 })
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    // Crop Logic
    const startCrop = () => {
        if (!fabricCanvas || isCropping) return;
        
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        if (!mainImg) return;

        setIsCropping(true);
        setActiveTool('crop');

        // Initial crop rect covering 80% of image
        const cropRect = new Rect({
            left: mainImg.left,
            top: mainImg.top,
            originX: 'center',
            originY: 'center',
            width: mainImg.getScaledWidth() * 0.8,
            height: mainImg.getScaledHeight() * 0.8,
            fill: 'rgba(0,0,0,0.3)',
            stroke: '#fff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            cornerColor: '#fff',
            cornerStyle: 'circle',
            transparentCorners: false,
            excludeFromExport: true 
        });

        fabricCanvas.add(cropRect);
        fabricCanvas.setActiveObject(cropRect);
        cropRectRef.current = cropRect;
        fabricCanvas.requestRenderAll();
    };

    const applyCrop = async () => {
        if (!fabricCanvas || !cropRectRef.current) return;
        
        const cropRect = cropRectRef.current;
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        
        if (!mainImg) {
            cancelCrop();
            return;
        }

        // Calculate crop relative to canvas/viewport
        const { left, top, width, height, scaleX, scaleY } = cropRect;
        const cropL = left! - (width! * scaleX!) / 2;
        const cropT = top! - (height! * scaleY!) / 2;
        const cropW = width! * scaleX!;
        const cropH = height! * scaleY!;

        // Temporarily hide crop rect
        cropRect.visible = false;
        
        // Export cropped area
        const croppedDataURL = fabricCanvas.toDataURL({
            left: cropL,
            top: cropT,
            width: cropW,
            height: cropH,
            format: 'png',
            multiplier: 1 // Could potentially increase quality here
        });

        // Load back as new image
        const newImg = await FabricImage.fromURL(croppedDataURL);
        
        // Replace old image
        fabricCanvas.remove(mainImg);
        fabricCanvas.remove(cropRect);
        
        newImg.set({
            left: fabricCanvas.width! / 2,
            top: fabricCanvas.height! / 2,
            originX: 'center',
            originY: 'center'
        });
        
        // Fit to canvas if needed, or keep 1:1 scale if roughly fitting
        const scale = Math.min(
            (fabricCanvas.width! - 80) / newImg.width!,
            (fabricCanvas.height! - 80) / newImg.height!
        );
        newImg.scale(scale);

        newImg.set({
            cornerColor: '#3b82f6',
            cornerStyle: 'circle',
            borderColor: '#3b82f6',
            transparentCorners: false,
            erasable: false
        });

        fabricCanvas.add(newImg);
        fabricCanvas.setActiveObject(newImg);
        
        setIsCropping(false);
        cropRectRef.current = null;
        setActiveTool('adjust');
        
        // Reset filters as they are burnt in now (simplified for basic crop)
        // Ideally we preserve them, but recreating from DataURL burns them in.
        // If we want to keep them editable, we'd need to re-apply logic.
        // For "Basic" editing, burning in on crop is acceptable standard behavior.
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setBlur(0);
        setGrayscale(false);
        setSepia(false);

        fabricCanvas.requestRenderAll();
    };

    const cancelCrop = () => {
        if (!fabricCanvas || !cropRectRef.current) return;
        fabricCanvas.remove(cropRectRef.current);
        cropRectRef.current = null;
        setIsCropping(false);
        setActiveTool('adjust');
        fabricCanvas.requestRenderAll();
    };

    const handleSave = () => {
        if (!fabricCanvas) return;
        
        if (isCropping) {
            cancelCrop(); // Or auto-apply? Let's cancel to be safe/avoid UI confusion
        }

        // const mainImg =   fabricCanvas.getObjects().find(obj => obj instanceof FabricImage) as FabricImage;
        const multiplier = 2; // High quality export

        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier 
        });

        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => onSave(blob));
    };

    const resetZoom = () => {
        if (!fabricCanvas) return;
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
        
        const mainImg = fabricCanvas.getObjects().find(obj => obj instanceof FabricImage);
        if (mainImg) {
            fabricCanvas.setActiveObject(mainImg);
            // Center main img
            mainImg.set({
                left: fabricCanvas.width! / 2,
                top: fabricCanvas.height! / 2
            });
            mainImg.setCoords();
            fabricCanvas.requestRenderAll();
        }
    };

    return (
        <div className="relative w-full h-full bg-zinc-950 overflow-hidden group flex">
            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-zinc-900/50">
                 {/* Toggle Settings Button (When hidden) */}
                {!showSettings && (
                     <button 
                        onClick={() => setShowSettings(true)}
                        className="absolute right-4 top-4 p-2 glass-button text-white rounded-lg z-10 hover:bg-white/10 transition-colors"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                )}

                 <div className="absolute inset-0 flex items-center justify-center p-8">
                     <canvas ref={canvasRef} className="w-full h-full shadow-2xl rounded-lg" />
                 </div>

                 {/* Canvas Overlay Controls */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
                     <div className="flex flex-col bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
                         <button onClick={() => {
                            fabricCanvas?.setZoom(zoom * 1.1);
                            setZoom(zoom * 1.1);
                         }} className="p-2 hover:bg-white/10 rounded text-white transition-colors" title="Zoom In"><Plus className="w-4 h-4"/></button>
                         <button onClick={() => {
                            fabricCanvas?.setZoom(zoom / 1.1);
                            setZoom(zoom / 1.1);
                         }} className="p-2 hover:bg-white/10 rounded text-white transition-colors" title="Zoom Out"><Minus className="w-4 h-4"/></button>
                         <button onClick={resetZoom} className="p-2 hover:bg-white/10 rounded text-white transition-colors" title="Fit to Screen"><Maximize className="w-4 h-4"/></button>
                     </div>
                </div>
            </div>

            {/* Right Sidebar - Tools */}
            <div className={`w-[320px] bg-[#18181b] border-l border-white/10 flex flex-col z-20 transition-all duration-300 ${showSettings ? 'translate-x-0' : 'translate-x-full hidden'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                        Editor
                    </h3>
                     <button 
                        onClick={() => setShowSettings(false)}
                        className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                     {/* Tools Nav */}
                    <div className="grid grid-cols-4 gap-1 p-2 border-b border-white/10 bg-white/5">
                        <button
                            onClick={() => setActiveTool('adjust')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium rounded-lg transition-all",
                                activeTool === 'adjust' ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Settings2 className="w-4 h-4" /> Adjust
                        </button>
                        <button
                            onClick={() => setActiveTool('filters')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium rounded-lg transition-all",
                                activeTool === 'filters' ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Droplet className="w-4 h-4" /> Filters
                        </button>
                        <button
                            onClick={() => {
                                if (!isCropping) startCrop();
                                else cancelCrop();
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium rounded-lg transition-all",
                                activeTool === 'crop' ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <CropIcon className="w-4 h-4" /> Crop
                        </button>
                        <button
                            onClick={() => setActiveTool('text')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium rounded-lg transition-all",
                                activeTool === 'text' ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Type className="w-4 h-4" /> Text
                        </button>
                    </div>
                    
                    <div className="p-5 space-y-8">
                        {activeTool === 'adjust' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Transform</label>
                                    <div className="grid grid-cols-2 gap-2">
                                         <Button size="sm" variant="secondary" onClick={rotateImage} icon={RotateCw} className="w-full justify-center">Rotate 90°</Button>
                                         <div className="grid grid-cols-2 gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => flipImage('X')} title="Flip Horizontal" className="w-full justify-center px-0"><FlipHorizontal className="w-4 h-4"/></Button>
                                            <Button size="sm" variant="secondary" onClick={() => flipImage('Y')} title="Flip Vertical" className="w-full justify-center px-0"><FlipVertical className="w-4 h-4"/></Button>
                                         </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Basic Correction</label>
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
                        )}

                        {activeTool === 'filters' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Effects</label>
                                    <Slider
                                        label="Blur"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={blur}
                                        onChange={setBlur}
                                        className="text-xs"
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button 
                                            onClick={() => setGrayscale(!grayscale)}
                                            className={cn(
                                                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                                grayscale 
                                                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                                                    : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-800" />
                                            <span className="text-xs font-medium">Grayscale</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setSepia(!sepia)}
                                            className={cn(
                                                "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                                sepia 
                                                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300" 
                                                    : "bg-black/20 border-white/10 text-white/50 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#704214] to-[#C2B280]" />
                                            <span className="text-xs font-medium">Sepia</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'crop' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                                 <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-400 border border-indigo-500/30">
                                     <CropIcon className="w-6 h-6" />
                                 </div>
                                 <p className="text-sm text-white/80 px-2 font-medium">Crop Mode Active</p>
                                 <p className="text-xs text-white/50 px-2 leading-relaxed">
                                     Adjust the selection box on the canvas to crop your image. 
                                 </p>
                                 
                                 <div className="flex flex-col gap-2 pt-4">
                                     <Button onClick={applyCrop} className="w-full" variant="primary" icon={Check}>Apply Crop</Button>
                                     <Button onClick={cancelCrop} className="w-full" variant="ghost" icon={X}>Cancel</Button>
                                 </div>
                             </div>
                        )}

                        {activeTool === 'text' && (
                             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                                 <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-400 border border-indigo-500/30">
                                     <Type className="w-6 h-6" />
                                 </div>
                                 <p className="text-sm text-white/80 px-4">Add a text overlay or watermark to your frame.</p>
                                 <Button onClick={addText} className="w-full" variant="primary">Add Text Layer</Button>
                                 <p className="text-[10px] text-white/40">Double click text on canvas to edit content.</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-white/5 space-y-2">
                    <Button variant="primary" className="w-full" onClick={handleSave} icon={Check}>Save Changes</Button>
                    <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" onClick={onCancel} icon={X}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};
