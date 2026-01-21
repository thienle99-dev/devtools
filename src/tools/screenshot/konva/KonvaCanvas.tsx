import { useEffect, useState, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useCallback } from 'react';
import { useXnapperStore } from '../../../store/xnapperStore';
import { generateFinalImage } from '../utils/exportUtils';
import type { CanvasPreviewHandle } from '../types';
import type { ShapeData } from './types';
import { CanvasStageView } from './CanvasStageView';

interface KonvaCanvasProps {
    onHistoryChange?: (canUndo: boolean, canRedo: boolean, count: number) => void;
    onZoomChange?: (zoom: number) => void;
}

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
        annotationConfig,
        canvasData,
        setCanvasData,
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

    // Cursor Styling
    useEffect(() => {
        if (!stageRef.current) return;
        const container = stageRef.current.container();
        if (activeAnnotationTool) {
            container.style.cursor = 'crosshair';
        } else {
            container.style.cursor = 'default';
        }
    }, [activeAnnotationTool]);

    const [shapes, setShapes] = useState<ShapeData[]>([]);
    const [selectedId, selectShape] = useState<string | null>(null);
    const transformerRef = useRef<any>(null);
    const stageRef = useRef<any>(null);
    const isDrawing = useRef(false);
    const activeShapeIdRef = useRef<string | null>(null);
    const lastScreenshotIdRef = useRef<string | null>(currentScreenshot?.id ?? null);
    const [editingShape, setEditingShape] = useState<string | null>(null);

    // History
    const [history, setHistory] = useState<ShapeData[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const isHistoryPristine = history.length === 1 && (history[0]?.length ?? 0) === 0;

    const resetCanvasState = useCallback(() => {
        setShapes(prev => (prev.length === 0 ? prev : []));
        setHistory(prev => (prev.length === 1 && prev[0].length === 0 ? prev : [[]]));
        setHistoryStep(prev => (prev === 0 ? prev : 0));
        selectShape(prev => (prev === null ? prev : null));
        setEditingShape(prev => (prev === null ? prev : null));
        activeShapeIdRef.current = null;
    }, []);

    // Reset canvas when screenshot changes or annotations are cleared
    useEffect(() => {
        const currentId = currentScreenshot?.id ?? null;
        if (lastScreenshotIdRef.current !== currentId) {
            lastScreenshotIdRef.current = currentId;
            resetCanvasState();
        }
    }, [currentScreenshot?.id, resetCanvasState]);

    useEffect(() => {
        if (canvasData === null) {
            resetCanvasState();
        }
    }, [canvasData, resetCanvasState]);

    // Serialization: Load initial data
    useEffect(() => {
        if (canvasData && shapes.length === 0 && isHistoryPristine) {
            try {
                const parsed = JSON.parse(canvasData);
                if (Array.isArray(parsed)) {
                    setShapes(parsed);
                    setHistory([parsed]);
                    setHistoryStep(0);
                }
            } catch (e) {
                console.error("Failed to parse canvasData", e);
            }
        }
    }, [canvasData, isHistoryPristine, shapes.length]);

    // Serialization: Save on change (debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            const json = JSON.stringify(shapes);
            // Avoid re-saving when annotations were explicitly cleared/reset
            if (canvasData === null && json === '[]') {
                return;
            }
            if (json !== canvasData) {
                setCanvasData(json);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [shapes, canvasData, setCanvasData]);

    // Sync History to Parent
    useEffect(() => {
        onHistoryChange?.(historyStep > 0, historyStep < history.length - 1, shapes.length);
    }, [historyStep, history, shapes.length, onHistoryChange]);

    const addToHistory = (newShapes: ShapeData[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newShapes);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleTextChange = useCallback((id: string, text: string) => {
        setShapes(prev => prev.map(s => (s.id === id ? { ...s, text } : s)));
    }, []);

    const handleTextCommit = useCallback(() => {
        addToHistory(shapes);
        setEditingShape(null);
    }, [addToHistory, shapes]);

    const handleTextCancel = useCallback(() => {
        setEditingShape(null);
    }, []);

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            setShapes(history[prevStep]);
            selectShape(null);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setShapes(history[nextStep]);
            selectShape(null);
        }
    };

    // Transformer Logic
    useEffect(() => {
        if (selectedId && transformerRef.current) {
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

    // Clipboard
    const clipboardRef = useRef<any>(null);

    // Keyboard support: Delete, Copy/Paste, Z-Order
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if editing text
            if (editingShape) return;

            // Delete
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                const newShapes = shapes.filter(s => s.id !== selectedId);
                setShapes(newShapes);
                addToHistory(newShapes);
                selectShape(null);
                return;
            }

            // Copy (Ctrl+C / Cmd+C)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
                const shape = shapes.find(s => s.id === selectedId);
                if (shape) {
                    clipboardRef.current = { ...shape };
                    // Remove id so we generate new one on paste
                    delete clipboardRef.current.id;
                }
                return;
            }

            // Paste (Ctrl+V / Cmd+V)
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardRef.current) {
                const newId = crypto.randomUUID();
                const newShape = {
                    ...clipboardRef.current,
                    id: newId,
                    x: clipboardRef.current.x + 20, // Offset paste
                    y: clipboardRef.current.y + 20,
                };
                const newShapes = [...shapes, newShape];
                setShapes(newShapes);
                addToHistory(newShapes);
                selectShape(newId);
                return;
            }

            // Z-Index: Send Backward ([)
            if (e.key === '[' && selectedId) {
                const index = shapes.findIndex(s => s.id === selectedId);
                if (index > 0) {
                    const newShapes = [...shapes];
                    // Swap with previous
                    [newShapes[index - 1], newShapes[index]] = [newShapes[index], newShapes[index - 1]];
                    setShapes(newShapes);
                    addToHistory(newShapes);
                }
                return;
            }

            // Z-Index: Bring Forward (])
            if (e.key === ']' && selectedId) {
                const index = shapes.findIndex(s => s.id === selectedId);
                if (index < shapes.length - 1) {
                    const newShapes = [...shapes];
                    // Swap with next
                    [newShapes[index + 1], newShapes[index]] = [newShapes[index], newShapes[index + 1]];
                    setShapes(newShapes);
                    addToHistory(newShapes);
                }
                return;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, shapes, editingShape]);

    // Drawing Logic
    const handleMouseDown = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }

        if (!activeAnnotationTool) return;

        // Deselect when starting to draw
        selectShape(null);

        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();
        const id = `${activeAnnotationTool}-${Date.now()}`;

        // Common props
        const baseProps = {
            id,
            draggable: false, // Initially false while drawing
            stroke: annotationConfig.color || 'red',
            strokeWidth: annotationConfig.strokeWidth || 4,
            opacity: 1,
        } as Partial<ShapeData>;

        let newShape: ShapeData | null = null;

        if (activeAnnotationTool === 'rect') {
            newShape = {
                ...baseProps,
                type: 'rect',
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                fill: 'transparent',
            } as ShapeData;
        } else if (activeAnnotationTool === 'circle') {
            newShape = {
                ...baseProps,
                type: 'circle',
                x: pos.x,
                y: pos.y,
                radius: 0,
                fill: 'transparent',
            } as ShapeData;
        } else if (activeAnnotationTool === 'arrow') {
            newShape = {
                ...baseProps,
                type: 'arrow',
                points: [pos.x, pos.y, pos.x, pos.y],
                pointerLength: 10,
                pointerWidth: 10,
                fill: annotationConfig.color || 'red', // Arrow head fill
            } as ShapeData;
        } else if (activeAnnotationTool === 'line') {
            newShape = {
                ...baseProps,
                type: 'line',
                points: [pos.x, pos.y, pos.x, pos.y],
            } as ShapeData;
        } else if (activeAnnotationTool === 'text') {
            // Instant create text
            newShape = {
                id,
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: 'Double click to edit',
                fontSize: annotationConfig.fontSize || 24,
                fill: annotationConfig.color || '#ff0000',
                draggable: true,
                fontFamily: annotationConfig.fontFamily || 'Inter, sans-serif',
            } as ShapeData;
            // For text, we don't drag-to-draw
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            addToHistory(newShapes);
            // Select it immediately
            selectShape(id);
            return;
        } else if (activeAnnotationTool === 'pen') {
            newShape = {
                ...baseProps,
                type: 'pen',
                points: [pos.x, pos.y],
                tension: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                fill: undefined,
                stroke: annotationConfig.color || 'red',
                strokeWidth: annotationConfig.strokeWidth || 3,
            } as ShapeData;
        }

        if (newShape) {
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            isDrawing.current = true;
            activeShapeIdRef.current = id;
        }
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing.current || !activeShapeIdRef.current) return;

        const stage = e.target.getStage();
        const pos = stage.getRelativePointerPosition();

        setShapes(prev => prev.map(s => {
            if (s.id === activeShapeIdRef.current) {
                if (s.type === 'rect') {
                    return {
                        ...s,
                        width: pos.x - s.x,
                        height: pos.y - s.y
                    };
                } else if (s.type === 'circle') {
                    const dx = pos.x - s.x;
                    const dy = pos.y - s.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    return {
                        ...s,
                        radius
                    };
                } else if (s.type === 'arrow' || s.type === 'line') {
                    return {
                        ...s,
                        points: [s.points![0], s.points![1], pos.x, pos.y]
                    };
                } else if (s.type === 'pen') {
                    return {
                        ...s,
                        points: [...(s.points || []), pos.x, pos.y]
                    };
                }
            }
            return s;
        }));
    };

    const handleMouseUp = () => {
        if (isDrawing.current && activeShapeIdRef.current) {
            isDrawing.current = false;
            // Enable draggable after drawing
            const finalShapes = shapes.map(s => {
                if (s.id === activeShapeIdRef.current) {
                    return { ...s, draggable: true };
                }
                return s;
            });
            setShapes(finalShapes);
            addToHistory(finalShapes);
            selectShape(activeShapeIdRef.current);
            activeShapeIdRef.current = null;
        }
    };

    const handleTextDblClick = (_e: any, shapeId: string) => {
        setEditingShape(shapeId);
    };

    // Update history on transform end (drag/resize)
    const handleTransformEnd = (e: any) => {
        const node = e.target;
        const id = node.id();

        const newShapes = shapes.map(s => {
            if (s.id === id) {
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Normalize scale for shapes where stroke shouldn't scale
                if (s.type === 'rect') {
                    node.scaleX(1);
                    node.scaleY(1);
                    return {
                        ...s,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        scaleX: 1,
                        scaleY: 1
                    };
                } else if (s.type === 'circle') {
                    node.scaleX(1);
                    node.scaleY(1);
                    // Use max scale for radius to avoid ellipse if locked aspect ratio not enforcing
                    const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
                    return {
                        ...s,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        radius: Math.max(5, (s.radius || 10) * scale),
                        scaleX: 1,
                        scaleY: 1
                    };
                }

                // For Text/Arrow, keep the scale (font size/points scaling)
                return {
                    ...s,
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    scaleX: scaleX,
                    scaleY: scaleY,
                };
            }
            return s;
        });

        setShapes(newShapes);
        addToHistory(newShapes);
    };

    const handleDragEnd = (e: any) => {
        // Update shape position in state
        const id = e.target.id();
        const newShapes = shapes.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    x: e.target.x(),
                    y: e.target.y(),
                    rotation: e.target.rotation(),
                    scaleX: e.target.scaleX(),
                    scaleY: e.target.scaleY(),
                };
            }
            return s;
        });
        setShapes(newShapes);
        addToHistory(newShapes);
    };

    useImperativeHandle(ref, () => ({
        undo: handleUndo,
        redo: handleRedo,
        clear: () => {
            setShapes([]);
            addToHistory([]);
        },
        canUndo: historyStep > 0,
        canRedo: historyStep < history.length - 1,
        zoomIn: () => setBaseZoom(prev => Math.min(prev + 0.25, 3)),
        zoomOut: () => setBaseZoom(prev => Math.max(prev - 0.25, 0.25)),
        resetZoom: () => setBaseZoom(1),
        getZoom: () => baseZoom,
        // Export logic
        exportImage: () => {
            if (stageRef.current) {
                // Deselect before export to hide transformer
                selectShape(null);
                // Force sync draw
                stageRef.current.getLayer().batchDraw();

                // Export at original size
                // stage scale is (scale * baseZoom)
                // we want output to be (imageSize.width)
                // so pixelRatio should be 1 / (scale * baseZoom)
                const currentScale = scale * baseZoom;
                const pixelRatio = 1 / currentScale;

                return stageRef.current.toDataURL({ pixelRatio });
            }
            return '';
        },
        bringForward: () => {
            if (selectedId) {
                const index = shapes.findIndex(s => s.id === selectedId);
                if (index < shapes.length - 1) {
                    const newShapes = [...shapes];
                    // Swap with next
                    [newShapes[index + 1], newShapes[index]] = [newShapes[index], newShapes[index + 1]];
                    setShapes(newShapes);
                    addToHistory(newShapes);
                }
            }
        },
        sendBackward: () => {
            if (selectedId) {
                const index = shapes.findIndex(s => s.id === selectedId);
                if (index > 0) {
                    const newShapes = [...shapes];
                    // Swap with previous
                    [newShapes[index - 1], newShapes[index]] = [newShapes[index], newShapes[index - 1]];
                    setShapes(newShapes);
                    addToHistory(newShapes);
                }
            }
        }
    }));

    if (!baseDataUrl) {
        return <div className="flex items-center justify-center h-full text-foreground-muted">Preparing canvas...</div>;
    }

    return (
        <CanvasStageView
            containerRef={containerRef}
            stageRef={stageRef}
            transformerRef={transformerRef}
            baseDataUrl={baseDataUrl}
            imageSize={imageSize}
            scale={scale}
            baseZoom={baseZoom}
            shapes={shapes}
            selectedId={selectedId}
            editingShape={editingShape}
            activeAnnotationTool={activeAnnotationTool}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onSelectShape={selectShape}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            onTextDblClick={handleTextDblClick}
            onTextChange={handleTextChange}
            onTextCommit={handleTextCommit}
            onTextCancel={handleTextCancel}
        />
    );
});

KonvaCanvas.displayName = 'KonvaCanvas';
