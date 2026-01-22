import React, { useState, useRef, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Slider } from '@components/ui/Slider';
import { 
    Upload, Download, RefreshCcw,
    Crop, Maximize2, RotateCw, Wand2, Droplet,
    Frame, Sun, Contrast, Eraser
} from 'lucide-react';
import type { Crop as CropType, PixelCrop } from 'react-image-crop';

import { toast } from 'sonner';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.IMAGE_EDITOR;

interface EditorState {
    zoom: number;
    rotate: number;
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
}

const DEFAULT_STATE: EditorState = {
    zoom: 1,
    rotate: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
};

export const ImageEditor: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData } = useToolState(effectiveId);
    const persistedMeta = (toolData?.meta as any) || {};
    const [imageSrc, setImageSrc] = useState<string | null>(persistedMeta.imageSrc ?? null);
    const [crop, setCrop] = useState<CropType>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    // Editor values
    const [state, setState] = useState<EditorState>(persistedMeta.state ?? DEFAULT_STATE);
    const [activeTab, setActiveTab] = useState<'adjust' | 'filter' | 'crop'>('adjust');
    const [ReactCropComponent, setReactCropComponent] = useState<any>(null);

    // Lazy load ReactCrop
    useEffect(() => {
        if (activeTab === 'crop' && !ReactCropComponent) {
            Promise.all([
                import('react-image-crop'),
                import('react-image-crop/dist/ReactCrop.css')
            ]).then(([module]) => {
                setReactCropComponent(() => module.default);
            }).catch(err => {
                console.error("Failed to load ReactCrop", err);
                toast.error("Failed to load crop tool");
            });
        }
    }, [activeTab, ReactCropComponent]);

    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persist state into tool meta
    useEffect(() => {
        if (imageSrc) {
            setToolData(effectiveId, { 
                meta: { 
                    ...(toolData?.meta || {}), 
                    imageSrc, 
                    state 
                } 
            });
        }
    }, [imageSrc, state, setToolData, toolData?.meta]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const result = reader.result?.toString() || null;
                setImageSrc(result);
                // Reset state for new image
                setState(DEFAULT_STATE);
            });
            reader.readAsDataURL(file);
        }
    };

    const updateState = (key: keyof EditorState, value: number) => {
        setState(prev => ({ ...prev, [key]: value }));
    };

    const getFilterString = () => {
        return `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) blur(${state.blur}px) grayscale(${state.grayscale}%) sepia(${state.sepia}%)`;
    };

    const downloadImage = async () => {
        if (!imageSrc || !imgRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imgRef.current;
        
        // Use natural dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Apply filters
        ctx.filter = getFilterString();
        
        // Handle rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((state.rotate * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // Handle crop if exists
        if (completedCrop) {
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            if (!croppedCtx) return;

            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            croppedCanvas.width = completedCrop.width * scaleX;
            croppedCanvas.height = completedCrop.height * scaleY;

            croppedCtx.drawImage(
                canvas,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                croppedCanvas.width,
                croppedCanvas.height
            );

            // Trigger download for cropped
            const url = croppedCanvas.toDataURL('image/png');
            triggerDownload(url);
        } else {
            // Trigger download for full
            const url = canvas.toDataURL('image/png');
            triggerDownload(url);
        }
        
        toast.success('Image exported successfully!');
    };

    const triggerDownload = (url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-image-${Date.now()}.png`;
        a.click();
    };

    const resetEdits = () => {
        setState(DEFAULT_STATE);
        setCrop(undefined);
        setCompletedCrop(undefined);
        toast.info('Edits reset');
    };

    const FilterSlider = ({ label, value, min, max, step = 1, onChange, icon: Icon }: any) => (
        <div className="space-y-3">
            <div className="flex justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground-muted uppercase tracking-wider">
                    <Icon size={14} className="text-primary" /> {label}
                </div>
                <span className="text-xs font-mono text-foreground-secondary">{value}</span>
            </div>
            <Slider
                label={label}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={onChange}
                className="w-full"
            />
        </div>
    );

    return (
        <ToolPane
            toolId={effectiveId}
            title="Image Editor Pro"
            description="Advanced photo manipulation with filters, crop, and adjustments"
            onClear={() => {
                setImageSrc(null);
                clearToolData(effectiveId);
            }}
        >
            <div className="h-full flex flex-col lg:flex-row gap-6">
                {/* Main Canvas Area */}
                <div className="flex-1 min-h-0 bg-black/5 rounded-3xl border border-border-glass overflow-hidden relative flex items-center justify-center p-8 group">
                    {!imageSrc ? (
                        <div className="text-center space-y-4">
                            <div 
                                className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto cursor-pointer hover:scale-110 transition-transform duration-300"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={40} />
                            </div>
                            <h3 className="text-xl font-bold">Upload an Image</h3>
                            <p className="text-foreground-secondary text-sm">JPG, PNG, WebP supported</p>
                        </div>
                    ) : (
                        <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden"
                             style={{
                                 filter: activeTab !== 'crop' ? getFilterString() : 'none',
                                 transform: `rotate(${state.rotate}deg) scale(${state.zoom})`,
                                 transition: 'transform 0.2s, filter 0.2s'
                             }}
                        >
                            {activeTab === 'crop' && ReactCropComponent ? (
                                <ReactCropComponent
                                    crop={crop}
                                    onChange={(c: CropType) => setCrop(c)}
                                    onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                                    aspect={undefined}
                                >
                                    <img 
                                        ref={imgRef}
                                        src={imageSrc} 
                                        alt="Edit" 
                                        className="max-w-full max-h-[70vh] object-contain"
                                        style={{ filter: getFilterString() }}
                                    />
                                </ReactCropComponent>
                            ) : (
                                <img 
                                    ref={imgRef}
                                    src={imageSrc} 
                                    alt="Edit" 
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            )}
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Sidebar Controls */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-black/5 rounded-xl border border-border-glass">
                        {[
                            { id: 'adjust', icon: SlidersIcon, label: 'Adjust' },
                            { id: 'filter', icon: Wand2, label: 'Filters' },
                            { id: 'crop', icon: Crop, label: 'Crop' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-glass-panel shadow-sm text-primary' 
                                    : 'text-foreground-muted hover:text-foreground'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto px-1 space-y-6 custom-scrollbar">
                        {activeTab === 'adjust' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <FilterSlider 
                                    label="Brightness" icon={Sun}
                                    value={state.brightness} min={0} max={200}
                                    onChange={(v: number) => updateState('brightness', v)} 
                                />
                                <FilterSlider 
                                    label="Contrast" icon={Contrast}
                                    value={state.contrast} min={0} max={200}
                                    onChange={(v: number) => updateState('contrast', v)} 
                                />
                                <FilterSlider 
                                    label="Saturation" icon={Droplet}
                                    value={state.saturation} min={0} max={200}
                                    onChange={(v: number) => updateState('saturation', v)} 
                                />
                                <FilterSlider 
                                    label="Zoom" icon={Maximize2}
                                    value={state.zoom} min={0.1} max={3} step={0.1}
                                    onChange={(v: number) => updateState('zoom', v)} 
                                />
                                <FilterSlider 
                                    label="Rotation" icon={RotateCw}
                                    value={state.rotate} min={0} max={360}
                                    onChange={(v: number) => updateState('rotate', v)} 
                                />
                            </div>
                        )}

                        {activeTab === 'filter' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <FilterSlider 
                                    label="Blur" icon={Eraser}
                                    value={state.blur} min={0} max={20}
                                    onChange={(v: number) => updateState('blur', v)} 
                                />
                                <FilterSlider 
                                    label="Grayscale" icon={Frame}
                                    value={state.grayscale} min={0} max={100}
                                    onChange={(v: number) => updateState('grayscale', v)} 
                                />
                                <FilterSlider 
                                    label="Sepia" icon={Frame}
                                    value={state.sepia} min={0} max={100}
                                    onChange={(v: number) => updateState('sepia', v)} 
                                />
                            </div>
                        )}
                        
                        {activeTab === 'crop' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <p className="text-xs text-foreground-secondary leading-relaxed">
                                    Drag on the image to select a crop area. The adjustments and filters will be applied to the cropped result.
                                </p>
                                <Button 
                                    variant="secondary" 
                                    className="w-full"
                                    onClick={() => setCrop(undefined)}
                                >
                                    Reset Crop
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border-glass">
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="secondary" 
                                icon={RefreshCcw}
                                onClick={resetEdits}
                            >
                                Reset
                            </Button>
                            <Button 
                                variant="primary" 
                                icon={Download}
                                onClick={downloadImage}
                                disabled={!imageSrc}
                            >
                                Export
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

// Icon helper
const SlidersIcon = ({ size, className }: any) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="4" x2="4" y1="21" y2="14" />
        <line x1="4" x2="4" y1="10" y2="3" />
        <line x1="12" x2="12" y1="21" y2="12" />
        <line x1="12" x2="12" y1="8" y2="3" />
        <line x1="20" x2="20" y1="21" y2="16" />
        <line x1="20" x2="20" y1="12" y2="3" />
        <line x1="1" x2="7" y1="14" y2="14" />
        <line x1="9" x2="15" y1="8" y2="8" />
        <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
);
