import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    deleteSelectedAnnotation,
    getAnnotationCount,
    DEFAULT_ANNOTATION_CONFIG
} from '../utils/annotations';
import { generateFinalImage } from '../utils/exportUtils';
import { applyGradientBackground, applyImageBackground, applySolidBackground, addPaddingToScreenshot } from '../utils/backgroundGenerator';
import { toast } from 'sonner';

export const CanvasPreview: React.FC = () => {
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
        addToHistory,
        history
    } = useXnapperStore();

    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [canvasScale, setCanvasScale] = useState(1);

    // Undo/Redo stacks
    const undoStackRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Drawing state
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const activeObjectRef = useRef<fabric.Object | null>(null);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: true,
        });

        fabricCanvasRef.current = canvas;

        // Setup event listeners
        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        // Key listener for delete
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (fabricCanvasRef.current?.getActiveObject()) {
                    deleteSelectedAnnotation(fabricCanvasRef.current);
                    saveState();
                }
            }
            // Undo/Redo shortcuts
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
    }, []);

    // Load Base Image (Screenshot + Redactions + AutoBalance)
    useEffect(() => {
        if (!fabricCanvasRef.current || !currentScreenshot) return;

        const loadContent = async () => {
            // Generate the base image with redactions and auto-balance applied
            // Note: We do NOT apply background here yet if we want it to be separate,
            // but for simplicity in Phase 3, we can bake it all in or handle it.
            // Better: Render the "Clean" screenshot + Redactions -> Set as Background Image
            // Then Annotations on top.
            // Background Generator (Gradients/Padding) usually goes BEHIND everything.
            // If we use `generateFinalImage` it flattens everything.

            // Strategy: 
            // 1. Prepare image with AutoBalance and Redactions.
            // 2. Set as Fabric BackgroundImage.
            // 3. Resize Fabric Canvas to match.
            // 4. (Extension) If Background/Padding is enabled, we might need a container approach
            //    or modify canvas dimensions. For Phase 3, let's focus on Annotating the *Screenshot*.
            //    The Background/Padding usually wraps the final result.
            //    Visualizing Background+Padding inside Fabric is tricky if drawing space is infinite.

            // Current approach for consistency: 
            // We'll load the image *without* padding/background into the canvas for annotation.
            // The PreviewSection wrapper will handle the padding/background visualization 
            // by placing the Fabric canvas *inside* the padded area? 
            // Or simpler: We bake background logic INTO this canvas?
            // "Backgrounds" in Phase 2 wrap the image.

            // Generate the base image with all effects applied so we can annotate over everything
            const baseDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                autoBalance,
                redactionAreas,
                background,
                backgroundPadding
            });

            // Load into Fabric
            fabric.Image.fromURL(baseDataUrl, { crossOrigin: 'anonymous' }).then((img) => {
                const canvas = fabricCanvasRef.current!;

                canvas.setWidth(img.width!);
                canvas.setHeight(img.height!);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

                // Update container scale
                updateCanvasScale(img.width!, img.height!);
            });
        };

        loadContent();
    }, [currentScreenshot, autoBalance, redactionAreas]);

    // Handle Canvas Scale for Responsiveness
    const updateCanvasScale = (imgWidth: number, imgHeight: number) => {
        if (!canvasContainerRef.current) return;
        const container = canvasContainerRef.current;
        const containerWidth = container.clientWidth - 48; // Padding
        const containerHeight = container.clientHeight - 48;

        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up > 1

        setCanvasScale(scale);
    };

    // Save State for Undo/Redo
    const saveState = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        // Serialize only objects (annotations), not the background
        const json = fabricCanvasRef.current.toJSON(['id', 'isBlurArea', 'blurAmount']);
        // We only care about objects, background is handled by state
        const state = JSON.stringify(json.objects);

        // Don't push duplicates
        if (undoStackRef.current.length > 0 &&
            undoStackRef.current[undoStackRef.current.length - 1] === state) {
            return;
        }

        undoStackRef.current.push(state);
        redoStackRef.current = []; // Clear redo

        setCanUndo(undoStackRef.current.length > 1); // Need initial state + 1
        setCanRedo(false);
        setCanvasData(state); // Sync to store
    }, [setCanvasData]);

    const handleUndo = () => {
        if (undoStackRef.current.length <= 1 || !fabricCanvasRef.current) return;

        const current = undoStackRef.current.pop()!;
        redoStackRef.current.push(current);

        const prev = undoStackRef.current[undoStackRef.current.length - 1];
        loadObjects(prev);

        setCanUndo(undoStackRef.current.length > 1);
        setCanRedo(true);
    };

    const handleRedo = () => {
        if (redoStackRef.current.length === 0 || !fabricCanvasRef.current) return;

        const next = redoStackRef.current.pop()!;
        undoStackRef.current.push(next);

        loadObjects(next);

        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
    };

    const loadObjects = (jsonString: string) => {
        const objects = JSON.parse(jsonString);
        const canvas = fabricCanvasRef.current!;

        // Remove all existing objects
        canvas.getObjects().forEach(obj => {
            if (obj !== canvas.backgroundImage) canvas.remove(obj);
        });

        // Load new objects
        fabric.util.enlivenObjects(objects, {}).then((enlivenedObjects: fabric.Object[]) => {
            enlivenedObjects.forEach(obj => {
                canvas.add(obj);
            });
            canvas.renderAll();
            setCanvasData(jsonString);
        });
    };

    // Drawing Handlers
    const handleMouseDown = (opt: any) => {
        if (!activeAnnotationTool || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(opt.e);
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        // Deselect any active object when starting to draw
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
                text.enterEditing();
                text.selectAll();
                isDrawingRef.current = false; // Text is instant, not drag-drawn
                saveState();
                setActiveAnnotationTool(null); // Switch back to select tool
                break;

            case 'arrow':
                // For arrow, we create a temporary line first, then finalize on up
                // Or simplified: create the group and update it.
                // NOTE: Group update is complex. Let's just create line first or implement simple drag behavior.
                // Using createArrow right away
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
                // Radius 0 initially
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
        if (!isDrawingRef.current || !activeObjectRef.current || !startPointRef.current || !fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(opt.e);
        const start = startPointRef.current;
        const obj = activeObjectRef.current;

        switch (activeAnnotationTool) {
            case 'arrow':
                // Re-create arrow or update path? Group is hard to update.
                // Easiest is to remove and recreate for preview (standard Fabric approach for complex shapes)
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
                // Calculate radius based on distance
                const dist = Math.sqrt(Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2));
                (obj as fabric.Circle).set({ radius: dist / 2 });
                // Re-center
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
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            activeObjectRef.current = null;
            startPointRef.current = null;

            // Switch back to selection mode? Or keep drawing?
            // Usually keeping tool active is better for repeated actions, 
            // but selection is safer to avoid accidental draws.
            // Let's keep it active for now for multi-draw, except text.
            // But if user clicks without dragging (width=0), we should probably cleanup or treat as select.

            saveState();
        }
    };

    // Clear all
    const handleClear = () => {
        if (fabricCanvasRef.current) {
            clearAllAnnotations(fabricCanvasRef.current);
            saveState();
        }
    };

    if (!currentScreenshot) return null;

    return (
        <div ref={canvasContainerRef} className="w-full h-full flex items-center justify-center bg-[#1a1a1a] overflow-hidden p-6">
            <div
                style={{
                    transform: `scale(${canvasScale})`,
                    transformOrigin: 'center center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};
