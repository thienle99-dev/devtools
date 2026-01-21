
import { useEffect, useState, useRef, useImperativeHandle, forwardRef, useLayoutEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useXnapperStore } from '../../../store/xnapperStore';
import { generateFinalImage } from '../utils/exportUtils';
import type { CanvasPreviewHandle } from '../components/CanvasPreview';

interface KonvaCanvasProps {
    onHistoryChange?: (canUndo: boolean, canRedo: boolean, count: number) => void;
    onZoomChange?: (zoom: number) => void;
}

// Helper component to load image
const URLImage = ({ src, width, height }: { src: string; width: number; height: number }) => {
    const [image] = useImage(src, 'anonymous');
    return <KonvaImage image={image} width={width} height={height} />;
};

export const KonvaCanvas = forwardRef<CanvasPreviewHandle, KonvaCanvasProps>(({ onHistoryChange, onZoomChange }, ref) => {
    // Suppress unused warning
    void onHistoryChange;
    const {
        currentScreenshot,
        autoBalance,
        redactionAreas,
        background,
        backgroundPadding,
        borderRadius,
        shadowBlur,
        shadowOpacity,
        shadowOffsetX,
        shadowOffsetY,
        inset,
        showWindowControls,
        watermark,
        aspectRatio,
        activeAnnotationTool,
    } = useXnapperStore();

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [baseDataUrl, setBaseDataUrl] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [baseZoom, setBaseZoom] = useState(1);
    
    // Load the processed background image
    useEffect(() => {
        if (!currentScreenshot) return;
        
        const load = async () => {
            try {
                const url = await generateFinalImage(currentScreenshot.dataUrl, {
                    autoBalance,
                    redactionAreas,
                    background,
                    backgroundPadding,
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                    showWindowControls,
                    watermark,
                    aspectRatio,
                });
                
                // Get dimensions
                const img = new Image();
                img.onload = () => {
                    setImageSize({ width: img.width, height: img.height });
                    setBaseDataUrl(url);
                };
                img.src = url;
            } catch (error) {
                console.error("Failed to generate base image for Konva", error);
            }
        };
        load();
    }, [currentScreenshot, autoBalance, redactionAreas, background, backgroundPadding, borderRadius, shadowBlur, shadowOpacity, shadowOffsetX, shadowOffsetY, inset, showWindowControls, watermark, aspectRatio]);

    // Update container size
    useLayoutEffect(() => {
        if (!containerRef.current) return;
        
        const updateSize = () => {
             if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
             }
        };
        
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        
        return () => observer.disconnect();
    }, []);

    // Calculate Fit Scale
    useEffect(() => {
        if (containerSize.width === 0 || containerSize.height === 0 || imageSize.width === 0) return;
        
        const padding = 40; // Space around
        const availableW = containerSize.width - padding;
        const availableH = containerSize.height - padding;
        
        const scaleX = availableW / imageSize.width;
        const scaleY = availableH / imageSize.height;
        // Fit to screen
        const fitScale = Math.min(scaleX, scaleY);
        
        setScale(fitScale);
    }, [containerSize, imageSize]);

    // Sync zoom changes to parent
    useEffect(() => {
        onZoomChange?.(baseZoom);
    }, [baseZoom, onZoomChange]);

    const [shapes, setShapes] = useState<any[]>([
        {
            id: 'rect1',
            type: 'rect',
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fill: 'red',
            draggable: true,
        },
    ]);
    const [selectedId, selectShape] = useState<string | null>(null);
    const transformerRef = useRef<any>(null);
    const isDrawing = useRef(false);
    const activeShapeIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (selectedId && transformerRef.current) {
            // Find the node by id. Requires setting id on the node.
            const stage = transformerRef.current.getStage();
            const node = stage.findOne('#' + selectedId);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedId]);

    const handleMouseDown = (e: any) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }

        if (!activeAnnotationTool) return;

        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();
        
        if (activeAnnotationTool === 'rectangle') {
            const id = `rect-${Date.now()}`;
            const newShape = {
                 id,
                 type: 'rect',
                 x: pos.x,
                 y: pos.y,
                 width: 0, 
                 height: 0,
                 stroke: 'red',
                 strokeWidth: 4,
                 draggable: false
            };
            setShapes([...shapes, newShape]);
            isDrawing.current = true;
            activeShapeIdRef.current = id;
            selectShape(null); // Deselect others while drawing
        }
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current || !activeShapeIdRef.current) return;
        
        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();
        
        setShapes(prev => prev.map(s => {
            if (s.id === activeShapeIdRef.current) {
                return {
                    ...s,
                    width: pos.x - s.x,
                    height: pos.y - s.y
                };
            }
            return s;
        }));
    };

    const handleMouseUp = () => {
        if (isDrawing.current && activeShapeIdRef.current) {
            isDrawing.current = false;
            // Enable draggable after drawing
            setShapes(prev => prev.map(s => {
                if (s.id === activeShapeIdRef.current) {
                    return { ...s, draggable: true };
                }
                return s;
            }));
            selectShape(activeShapeIdRef.current);
            activeShapeIdRef.current = null;
        }
    };

    useImperativeHandle(ref, () => ({
        undo: () => {},
        redo: () => {},
        clear: () => setShapes([]),
        canUndo: false,
        canRedo: false,
        zoomIn: () => setBaseZoom(prev => Math.min(prev + 0.25, 3)),
        zoomOut: () => setBaseZoom(prev => Math.max(prev - 0.25, 0.25)),
        resetZoom: () => setBaseZoom(1),
        getZoom: () => baseZoom
    }));

    if (!baseDataUrl) return <div className="flex items-center justify-center h-full text-foreground-muted">Preparing canvas...</div>;

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
        >
            <Stage 
                width={imageSize.width * scale * baseZoom} 
                height={imageSize.height * scale * baseZoom}
                scaleX={scale * baseZoom}
                scaleY={scale * baseZoom}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                style={{
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
            >
                <Layer>
                     <URLImage 
                        src={baseDataUrl} 
                        width={imageSize.width} 
                        height={imageSize.height} 
                     />
                </Layer>
                <Layer>
                    {shapes.map((shape) => {
                        if (shape.type === 'rect') {
                            return (
                                <Rect
                                    key={shape.id}
                                    {...shape}
                                    onClick={() => selectShape(shape.id)}
                                    onTap={() => selectShape(shape.id)}
                                />
                            );
                        }
                        // Mock circle for now, or import Circle
                        return null;
                    })}
                    <Transformer ref={transformerRef} />
                </Layer>
            </Stage>
        </div>
    );
});

KonvaCanvas.displayName = 'KonvaCanvas';
