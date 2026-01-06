import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
import { useXnapperStore } from '../../../store/xnapperStore';
import {
    createArrow,
    createText,
    createRectangle,
    createCircle,
    createEllipse,
    createLine,
    createBlurArea,
    clearAllAnnotations,
    deleteSelectedAnnotation
} from '../utils/annotations';
import { generateFinalImage } from '../utils/exportUtils';

export interface CanvasPreviewHandle {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    getZoom: () => number;
}

interface CanvasPreviewProps {
    onHistoryChange?: (canUndo: boolean, canRedo: boolean, count: number) => void;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(({ onHistoryChange }, ref) => {
    const {
        currentScreenshot,
        autoBalance,
        redactionAreas,
        background,
        backgroundPadding,
        activeAnnotationTool,
        setActiveAnnotationTool,
        annotationConfig,
        setCanvasData,
        isCropping,
        borderRadius,
        shadowBlur,
        shadowOpacity,
        shadowOffsetX,
        shadowOffsetY,
        inset,
    } = useXnapperStore();

    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [baseZoom, setBaseZoom] = useState(1); // Zoom level applied on top of fit-to-screen

    // Undo/Redo stacks
    const undoStackRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);

    // Drawing state
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const activeObjectRef = useRef<fabric.Object | null>(null);
    const cropRectRef = useRef<fabric.Rect | null>(null);

    const updateHistoryState = useCallback(() => {
        if (onHistoryChange) {
            const count = fabricCanvasRef.current ? fabricCanvasRef.current.getObjects().length : 0;
            onHistoryChange(undoStackRef.current.length > 1, redoStackRef.current.length > 0, count);
        }
    }, [onHistoryChange]);

    const saveState = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        const json = fabricCanvasRef.current.toObject(['id', 'isBlurArea', 'blurAmount']);
        const state = JSON.stringify(json.objects);

        if (undoStackRef.current.length > 0 &&
            undoStackRef.current[undoStackRef.current.length - 1] === state) {
            return;
        }

        undoStackRef.current.push(state);
        redoStackRef.current = [];
        setCanvasData(state);
        updateHistoryState();
    }, [setCanvasData, updateHistoryState]);

    const handleUndo = useCallback(() => {
        if (undoStackRef.current.length <= 1 || !fabricCanvasRef.current) return;

        const current = undoStackRef.current.pop()!;
        redoStackRef.current.push(current);

        const prev = undoStackRef.current[undoStackRef.current.length - 1];
        loadObjects(prev);
        updateHistoryState();
    }, [updateHistoryState]);

    const handleRedo = useCallback(() => {
        if (redoStackRef.current.length === 0 || !fabricCanvasRef.current) return;

        const next = redoStackRef.current.pop()!;
        undoStackRef.current.push(next);

        loadObjects(next);
        updateHistoryState();
    }, [updateHistoryState]);

    const handleClear = useCallback(() => {
        if (fabricCanvasRef.current) {
            clearAllAnnotations(fabricCanvasRef.current);
            saveState();
        }
    }, [saveState]);

    // Expose methods
    useImperativeHandle(ref, () => ({
        undo: handleUndo,
        redo: handleRedo,
        clear: handleClear,
        canUndo: undoStackRef.current.length > 1,
        canRedo: redoStackRef.current.length > 0,
        zoomIn: () => setBaseZoom(z => Math.min(z + 0.25, 3)),
        zoomOut: () => setBaseZoom(z => Math.max(z - 0.25, 0.25)),
        resetZoom: () => setBaseZoom(1),
        getZoom: () => baseZoom
    }));

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: true,
        });

        fabricCanvasRef.current = canvas;

        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!fabricCanvasRef.current) return;

            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (fabricCanvasRef.current.getActiveObject()) {
                    // Check if not editing text
                    const active = fabricCanvasRef.current.getActiveObject();
                    if (!(active instanceof fabric.IText && active.isEditing)) {
                        deleteSelectedAnnotation(fabricCanvasRef.current);
                        saveState();
                    }
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [saveState, handleRedo, handleUndo]);

    const updateCanvasScale = (imgWidth: number, imgHeight: number) => {
        if (!canvasContainerRef.current) return;
        const container = canvasContainerRef.current;
        // Padding for the container
        const containerWidth = container.clientWidth - 48;
        const containerHeight = container.clientHeight - 48;

        if (containerWidth <= 0 || containerHeight <= 0) return;

        // Calculate fit scale
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const fitScale = Math.min(scaleX, scaleY, 1);

        setCanvasScale(fitScale);
    };

    // Keep scale updated on resize
    useEffect(() => {
        const handleResize = () => {
            if (fabricCanvasRef.current && fabricCanvasRef.current.backgroundImage) {
                const img = fabricCanvasRef.current.backgroundImage as fabric.Image;
                if (img.width && img.height) {
                    updateCanvasScale(img.width, img.height);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clean up crop rectangle when exiting crop mode
    useEffect(() => {
        if (!isCropping && cropRectRef.current && fabricCanvasRef.current) {
            fabricCanvasRef.current.remove(cropRectRef.current);
            cropRectRef.current = null;
            fabricCanvasRef.current.requestRenderAll();
        }
    }, [isCropping]);

    // Load Base Image
    useEffect(() => {
        if (!fabricCanvasRef.current || !currentScreenshot) return;

        const loadContent = async () => {
            const baseDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
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
            });

            // Handle promise or callback based on Fabric version
            try {
                // Try promise-based first (v6+)
                const img = await fabric.FabricImage.fromURL(baseDataUrl, { crossOrigin: 'anonymous' });
                setupCanvasImage(img);
            } catch (e) {
                // Fallback
                fabric.Image.fromURL(baseDataUrl, { crossOrigin: 'anonymous' }).then((img) => {
                    setupCanvasImage(img);
                });
            }
        };

        const setupCanvasImage = (img: fabric.Image) => {
            const canvas = fabricCanvasRef.current!;
            if (!img.width || !img.height) return;

            canvas.setDimensions({ width: img.width, height: img.height });
            canvas.backgroundImage = img;
            canvas.requestRenderAll();

            updateCanvasScale(img.width, img.height);

            // Initialize history for this image if empty
            if (undoStackRef.current.length === 0) {
                const { canvasData } = useXnapperStore.getState();
                let loaded = false;

                if (canvasData) {
                    try {
                        const objects = JSON.parse(canvasData);
                        undoStackRef.current.push(canvasData);

                        fabric.util.enlivenObjects(objects, {}).then((enlivenedObjects: any[]) => {
                            enlivenedObjects.forEach((obj) => {
                                canvas.add(obj);
                            });
                            canvas.renderAll();
                        });
                        loaded = true;
                    } catch (e) {
                        // ignore
                    }
                }

                if (!loaded) {
                    const json = canvas.toObject(['id', 'isBlurArea', 'blurAmount']);
                    const state = JSON.stringify(json.objects);
                    undoStackRef.current.push(state);
                }
                updateHistoryState();
            }
        };

        loadContent();
    }, [currentScreenshot, autoBalance, redactionAreas, background, backgroundPadding]);

    const loadObjects = (jsonString: string) => {
        const objects = JSON.parse(jsonString);
        const canvas = fabricCanvasRef.current!;

        // Clear only objects, not background
        // getObjects() returns a copy or ref? In v6 it returns array.
        const currentObjects = [...canvas.getObjects()];
        currentObjects.forEach(obj => {
            // @ts-ignore
            if (obj !== canvas.backgroundImage) canvas.remove(obj);
        });

        fabric.util.enlivenObjects(objects, {}).then((enlivenedObjects: any[]) => {
            enlivenedObjects.forEach(obj => {
                canvas.add(obj);
            });
            canvas.renderAll();
            setCanvasData(jsonString);
        });
    };

    const handleMouseDown = (opt: any) => {
        // If cropping, handle crop logic
        const { isCropping } = useXnapperStore.getState();
        if (isCropping) {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const pointer = canvas.getScenePoint(opt.e);

            // Remove existing crop rectangle if any
            if (cropRectRef.current) {
                canvas.remove(cropRectRef.current);
                cropRectRef.current = null;
            }

            // Create new crop rectangle
            const cropRect = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: 'rgba(59, 130, 246, 0.1)', // Indigo with transparency
                stroke: '#3b82f6', // Indigo
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: true,
                cornerColor: '#3b82f6',
                cornerStrokeColor: '#ffffff',
                borderColor: '#3b82f6',
                cornerSize: 10,
                transparentCorners: false,
            });

            canvas.add(cropRect);
            cropRectRef.current = cropRect;
            isDrawingRef.current = true;
            startPointRef.current = { x: pointer.x, y: pointer.y };

            return;
        }

        if (!activeAnnotationTool || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(opt.e);

        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        canvas.discardActiveObject();

        const config = annotationConfig;

        switch (activeAnnotationTool) {
            case 'text':
                const text = createText(
                    { x: pointer.x, y: pointer.y },
                    'Text',
                    config
                );
                canvas.add(text);
                canvas.setActiveObject(text);
                if (text instanceof fabric.IText) {
                    text.enterEditing();
                    text.selectAll();
                }
                isDrawingRef.current = false;
                saveState();
                setActiveAnnotationTool(null);
                break;

            case 'arrow':
                const arrow = createArrow(
                    { x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y },
                    config
                );
                canvas.add(arrow);
                activeObjectRef.current = arrow;
                break;

            case 'rectangle':
                const rect = createRectangle(
                    { left: pointer.x, top: pointer.y, width: 0, height: 0 },
                    config
                );
                canvas.add(rect);
                activeObjectRef.current = rect;
                break;

            case 'circle':
                const circle = createCircle(
                    { x: pointer.x, y: pointer.y },
                    0,
                    config
                );
                canvas.add(circle);
                activeObjectRef.current = circle;
                break;

            case 'ellipse':
                const ellipse = createEllipse(
                    { left: pointer.x, top: pointer.y, rx: 0, ry: 0 },
                    config
                );
                canvas.add(ellipse);
                activeObjectRef.current = ellipse;
                break;

            case 'line':
                const line = createLine(
                    { x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y },
                    config
                );
                canvas.add(line);
                activeObjectRef.current = line;
                break;

            case 'blur':
                const blurArea = createBlurArea(
                    { left: pointer.x, top: pointer.y, width: 0, height: 0 },
                    20
                );
                canvas.add(blurArea);
                activeObjectRef.current = blurArea;
                break;
        }
    };

    const handleMouseMove = (opt: any) => {
        // Handle crop mode
        const { isCropping } = useXnapperStore.getState();
        if (isCropping && isDrawingRef.current && cropRectRef.current && startPointRef.current && fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current;
            const pointer = canvas.getScenePoint(opt.e);
            const start = startPointRef.current;

            const left = Math.min(start.x, pointer.x);
            const top = Math.min(start.y, pointer.y);
            const width = Math.abs(pointer.x - start.x);
            const height = Math.abs(pointer.y - start.y);

            cropRectRef.current.set({ left, top, width, height });
            canvas.requestRenderAll();
            return;
        }

        if (!isDrawingRef.current || !activeObjectRef.current || !startPointRef.current || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getScenePoint(opt.e);
        const start = startPointRef.current;
        const obj = activeObjectRef.current;

        switch (activeAnnotationTool) {
            case 'arrow':
                canvas.remove(obj);
                const newArrow = createArrow(
                    { x1: start.x, y1: start.y, x2: pointer.x, y2: pointer.y },
                    annotationConfig
                );
                canvas.add(newArrow);
                activeObjectRef.current = newArrow;
                break;

            case 'rectangle':
            case 'blur':
                let left = Math.min(start.x, pointer.x);
                let top = Math.min(start.y, pointer.y);
                let width = Math.abs(pointer.x - start.x);
                let height = Math.abs(pointer.y - start.y);
                obj.set({ left, top, width, height });
                break;

            case 'circle':
                const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
                (obj as fabric.Circle).set({ radius: dist / 2 });
                obj.set({
                    left: start.x - dist / 2,
                    top: start.y - dist / 2
                });
                break;

            case 'ellipse':
                const rx = Math.abs(pointer.x - start.x) / 2;
                const ry = Math.abs(pointer.y - start.y) / 2;
                (obj as fabric.Ellipse).set({ rx, ry, left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y) });
                break;

            case 'line':
                (obj as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
                break;
        }

        canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
        // Handle crop mode
        const { isCropping, setCropBounds } = useXnapperStore.getState();
        if (isCropping && isDrawingRef.current && cropRectRef.current) {
            const rect = cropRectRef.current;

            // Save crop bounds to store
            setCropBounds({
                x: rect.left || 0,
                y: rect.top || 0,
                width: rect.width || 0,
                height: rect.height || 0,
            });

            isDrawingRef.current = false;
            startPointRef.current = null;
            return;
        }

        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            activeObjectRef.current = null;
            startPointRef.current = null;
            saveState();
        }
    };

    if (!currentScreenshot) return null;

    return (
        <div ref={canvasContainerRef} className="w-full h-full flex items-center justify-center bg-[#1a1a1a] overflow-hidden p-6 relative">
            <div
                style={{
                    // Apply both fit-scale and user-zoom
                    transform: `scale(${canvasScale * baseZoom})`,
                    transformOrigin: 'center center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
});

CanvasPreview.displayName = 'CanvasPreview';
