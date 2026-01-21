import { useEffect, useState, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import {
    Canvas,
    FabricImage,
    Rect,
    IText,
    Circle,
    Ellipse,
    Line,
    Object as FabricObject,
    util
} from 'fabric';
import { useXnapperStore } from '../store/xnapperStore';
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
    exportImage?: () => string;
    bringForward?: () => void;
    sendBackward?: () => void;
}

interface CanvasPreviewProps {
    onHistoryChange?: (canUndo: boolean, canRedo: boolean, count: number) => void;
    onZoomChange?: (zoom: number) => void;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(({ onHistoryChange, onZoomChange }, ref) => {
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
        showWindowControls,
        watermark,
        aspectRatio,
    } = useXnapperStore();

    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [baseZoom, setBaseZoom] = useState(1); // Zoom level applied on top of fit-to-screen

    // Sync zoom changes
    useEffect(() => {
        onZoomChange?.(baseZoom);
    }, [baseZoom, onZoomChange]);

    // Undo/Redo stacks
    const undoStackRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);

    // Drawing state
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const activeObjectRef = useRef<FabricObject | null>(null);
    const cropRectRef = useRef<Rect | null>(null);
    const penPathRef = useRef<number[]>([]); // For pen/free draw tool

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

        const canvas = new Canvas(canvasRef.current, {
            selection: !activeAnnotationTool, // Allow selection only when no tool is active
            preserveObjectStacking: true,
            renderOnAddRemove: true,
            moveCursor: 'move',
            defaultCursor: activeAnnotationTool ? 'crosshair' : 'default',
        });

        fabricCanvasRef.current = canvas;

        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        // Pan state - use refs to persist across renders
        const panStateRef = useRef({ isPanning: false, lastPanPoint: { x: 0, y: 0 } });

        // Track spacebar state for panning
        const spacePressedRef = useRef(false);
        
        // Track spacebar keydown/keyup
        const handleSpaceDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                spacePressedRef.current = true;
            }
        };
        
        const handleSpaceUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                spacePressedRef.current = false;
                if (panStateRef.current.isPanning) {
                    panStateRef.current.isPanning = false;
                    canvas.selection = true;
                    canvas.defaultCursor = 'default';
                }
            }
        };
        
        window.addEventListener('keydown', handleSpaceDown);
        window.addEventListener('keyup', handleSpaceUp);

        // Enhanced mouse handlers with pan support
        const enhancedMouseDown = (opt: any) => {
            if (!fabricCanvasRef.current) return;
            
            // Allow panning only with spacebar + drag or middle mouse button
            const shouldPan = spacePressedRef.current || opt.e.button === 1;
            
            if (shouldPan && !activeAnnotationTool) {
                panStateRef.current.isPanning = true;
                const pointer = fabricCanvasRef.current.getPointer(opt.e);
                panStateRef.current.lastPanPoint = { x: pointer.x, y: pointer.y };
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
                opt.e.preventDefault();
                return;
            }
            
            // If tool is active, use normal handler for drawing
            if (activeAnnotationTool) {
                handleMouseDown(opt);
                return;
            }
            
            // Otherwise, allow normal fabric.js selection/drag (for moving objects)
            handleMouseDown(opt);
        };

        const enhancedMouseMove = (opt: any) => {
            if (!fabricCanvasRef.current) return;
            
            if (panStateRef.current.isPanning) {
                const pointer = fabricCanvasRef.current.getPointer(opt.e);
                const deltaX = pointer.x - panStateRef.current.lastPanPoint.x;
                const deltaY = pointer.y - panStateRef.current.lastPanPoint.y;
                
                const vpt = fabricCanvasRef.current.viewportTransform;
                if (vpt) {
                    vpt[4] += deltaX;
                    vpt[5] += deltaY;
                    fabricCanvasRef.current.setViewportTransform(vpt);
                    fabricCanvasRef.current.requestRenderAll();
                }
                
                panStateRef.current.lastPanPoint = { x: pointer.x, y: pointer.y };
                opt.e.preventDefault();
                return;
            }
            
            handleMouseMove(opt);
        };

        const enhancedMouseUp = () => {
            if (panStateRef.current.isPanning) {
                panStateRef.current.isPanning = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                return;
            }
            
            handleMouseUp();
        };

        canvas.on('mouse:down', enhancedMouseDown);
        canvas.on('mouse:move', enhancedMouseMove);
        canvas.on('mouse:up', enhancedMouseUp);

        // Handle wheel zoom (Ctrl/Cmd + wheel)
        const handleWheel = (opt: any) => {
            if (!fabricCanvasRef.current) return;
            
            const e = opt.e;
            // Only zoom if Ctrl/Cmd is pressed
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                
                const delta = e.deltaY;
                if (delta < 0) {
                    setBaseZoom(z => Math.min(z + 0.1, 3));
                } else {
                    setBaseZoom(z => Math.max(z - 0.1, 0.25));
                }
            }
        };

        canvas.on('mouse:wheel', handleWheel);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!fabricCanvasRef.current) return;

            // Handle zoom with Ctrl/Cmd + +/-/=
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                setBaseZoom(z => Math.min(z + 0.25, 3));
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                setBaseZoom(z => Math.max(z - 0.25, 0.25));
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                setBaseZoom(1);
                return;
            }

            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (fabricCanvasRef.current.getActiveObject()) {
                    // Check if not editing text
                    const active = fabricCanvasRef.current.getActiveObject();
                    if (!(active instanceof IText && active.isEditing)) {
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

        // Update canvas selection and cursor based on active tool
        const updateCanvasMode = () => {
            if (!fabricCanvasRef.current) return;
            const canvas = fabricCanvasRef.current;
            
            canvas.selection = !activeAnnotationTool;
            canvas.defaultCursor = activeAnnotationTool ? 'crosshair' : 'default';
            
            // Enable/disable drawing mode for pen tool
            if (activeAnnotationTool === 'pen') {
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush.color = annotationConfig.color;
                canvas.freeDrawingBrush.width = annotationConfig.strokeWidth;
            } else {
                canvas.isDrawingMode = false;
            }
        };

        updateCanvasMode();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleSpaceDown);
            window.removeEventListener('keyup', handleSpaceUp);
            canvas.off('mouse:wheel', handleWheel);
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, [saveState, handleRedo, handleUndo, activeAnnotationTool]);

    const updateCanvasScale = useCallback((imgWidth: number, imgHeight: number) => {
        if (!canvasContainerRef.current) return;
        const container = canvasContainerRef.current;
        
        // Get actual container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        console.log('🎨 Canvas Scale Update:', {
            imgWidth,
            imgHeight,
            containerWidth,
            containerHeight,
            containerRect: container.getBoundingClientRect()
        });

        if (containerWidth <= 0 || containerHeight <= 0) {
            console.warn('❌ Invalid container dimensions');
            return;
        }

        // Use 90% of available space for padding/margins
        const availableWidth = containerWidth * 0.90;
        const availableHeight = containerHeight * 0.90;

        // Calculate fit scale - maximize canvas size
        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const fitScale = Math.min(scaleX, scaleY);

        console.log('✅ New scale:', {
            scaleX,
            scaleY,
            fitScale,
            resultSize: {
                width: Math.round(imgWidth * fitScale),
                height: Math.round(imgHeight * fitScale)
            }
        });

        // Always update scale for immediate feedback
        setCanvasScale(fitScale);
    }, []);

    // Keep scale updated on resize using ResizeObserver
    useEffect(() => {
        if (!canvasContainerRef.current) return;

        const updateScale = () => {
            if (fabricCanvasRef.current && fabricCanvasRef.current.backgroundImage) {
                const img = fabricCanvasRef.current.backgroundImage as FabricImage;
                if (img.width && img.height && canvasContainerRef.current) {
                    const width = canvasContainerRef.current.clientWidth;
                    const height = canvasContainerRef.current.clientHeight;
                    // Only update if dimensions are meaningful
                    if (width > 20 && height > 20) {
                        updateCanvasScale(img.width, img.height);
                    }
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            // Debounce with requestAnimationFrame for smooth updates
            requestAnimationFrame(updateScale);
        });

        // Multiple initial checks to ensure proper scaling after layout
        requestAnimationFrame(updateScale);
        const t1 = setTimeout(updateScale, 50);
        const t2 = setTimeout(updateScale, 200);
        const t3 = setTimeout(updateScale, 500);
        const t4 = setTimeout(updateScale, 1000); // Extra delay for panel animations

        resizeObserver.observe(canvasContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [updateCanvasScale]);

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
                showWindowControls,
                watermark,
                aspectRatio,
            });

            // Handle promise or callback based on Fabric version
            try {
                const img = await FabricImage.fromURL(baseDataUrl, { 
                    crossOrigin: 'anonymous'
                });
                
                console.log('📸 Image loaded:', {
                    width: img.width,
                    height: img.height,
                    scaleX: img.scaleX,
                    scaleY: img.scaleY
                });
                
                setupCanvasImage(img);
            } catch (e) {
                console.error('❌ Error loading image into fabric:', e);
            }
        };

        const setupCanvasImage = (img: FabricImage) => {
            const canvas = fabricCanvasRef.current!;
            if (!img.width || !img.height) {
                console.error('❌ Image has no dimensions');
                return;
            }

            // Get actual image element dimensions
            const actualWidth = img.width;
            const actualHeight = img.height;

            console.log('🖼️ Setting up canvas image:', {
                imgWidth: actualWidth,
                imgHeight: actualHeight,
                imgElement: img.getElement(),
                imgScaleX: img.scaleX,
                imgScaleY: img.scaleY
            });

            // Set canvas to EXACT image dimensions (no background, no padding in dimensions)
            canvas.setDimensions({ 
                width: actualWidth, 
                height: actualHeight 
            });
            
            // Reset any transforms on the image and position at origin
            img.set({
                left: 0,
                top: 0,
                originX: 'left',
                originY: 'top',
                scaleX: 1,
                scaleY: 1,
                angle: 0
            });
            
            // Set as background image
            canvas.backgroundImage = img;
            canvas.renderAll();

            console.log('✅ Canvas setup complete:', {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasElementWidth: canvasRef.current?.width,
                canvasElementHeight: canvasRef.current?.height,
                bgImageWidth: canvas.backgroundImage?.width,
                bgImageHeight: canvas.backgroundImage?.height
            });

            // Update scale immediately and after delays to handle animations
            updateCanvasScale(actualWidth, actualHeight);
            requestAnimationFrame(() => updateCanvasScale(actualWidth, actualHeight));
            setTimeout(() => updateCanvasScale(actualWidth, actualHeight), 100);
            setTimeout(() => updateCanvasScale(actualWidth, actualHeight), 300);
            setTimeout(() => updateCanvasScale(actualWidth, actualHeight), 700);

            // Initialize history for this image if empty
            if (undoStackRef.current.length === 0) {
                const { canvasData } = useXnapperStore.getState();
                let loaded = false;

                if (canvasData) {
                    try {
                        const objects = JSON.parse(canvasData);
                        undoStackRef.current.push(canvasData);

                        util.enlivenObjects(objects).then((enlivenedObjects: any[]) => {
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
    }, [currentScreenshot, autoBalance, redactionAreas, background, backgroundPadding, borderRadius, shadowBlur, shadowOpacity, shadowOffsetX, shadowOffsetY, inset, showWindowControls, watermark, aspectRatio]);

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

        util.enlivenObjects(objects).then((enlivenedObjects: any[]) => {
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
            const cropRect = new Rect({
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

        // Skip normal handler for pen tool (uses isDrawingMode instead)
        if (activeAnnotationTool === 'pen') {
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
                if (text instanceof IText) {
                    text.enterEditing();
                    // selectAll is not in IText in v6, use selectionStart/End
                    text.set({
                        selectionStart: 0,
                        selectionEnd: text.text.length
                    });
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
                (obj as Circle).set({ radius: dist / 2 });
                obj.set({
                    left: start.x - dist / 2,
                    top: start.y - dist / 2
                });
                break;

            case 'ellipse':
                const rx = Math.abs(pointer.x - start.x) / 2;
                const ry = Math.abs(pointer.y - start.y) / 2;
                (obj as Ellipse).set({ rx, ry, left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y) });
                break;

            case 'line':
                (obj as Line).set({ x2: pointer.x, y2: pointer.y });
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
        <div 
            ref={canvasContainerRef} 
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    // Use standard transform scaling
                    transform: `scale(${canvasScale * baseZoom})`,
                    transformOrigin: 'center center',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                    // Ensure proper rendering
                    display: 'block',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    position: 'relative',
                    // Prevent any distortion
                    lineHeight: 0
                }}
            >
                <canvas 
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        imageRendering: '-webkit-optimize-contrast',
                        // Ensure no extra space
                        verticalAlign: 'top',
                        // Critical: prevent CSS from scaling canvas
                        maxWidth: 'none',
                        maxHeight: 'none',
                        width: 'auto',
                        height: 'auto'
                    }}
                />
            </div>
        </div>
    );
});

CanvasPreview.displayName = 'CanvasPreview';
