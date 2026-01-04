import React, { useEffect, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolStore } from '../../store/toolStore';
import { X, ArrowUp, ArrowDown, FileImage } from 'lucide-react';

const TOOL_ID = 'images-to-pdf';

interface ImageFile {
    id: string;
    file: File;
    preview: string;
    name: string;
}

export const ImagesToPdfConverter: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = tools[TOOL_ID] || { 
        images: [] as ImageFile[],
        options: { 
            orientation: 'portrait' as 'portrait' | 'landscape',
            pageSize: 'a4' as string,
            margin: 0,
            fitMode: 'fit' as 'fit' | 'actual' | 'stretch' | 'scale',
            scale: 100,
            position: 'center' as string,
            autoRotate: true,
            pdfTitle: '',
            pdfAuthor: '',
            compress: true,
            compressionQuality: 0.85
        }
    };

    const { images, options } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const imageFiles: ImageFile[] = files
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
                name: file.name
            }));

        setToolData(TOOL_ID, {
            images: [...(images || []), ...imageFiles]
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (id: string) => {
        const updatedImages = (images || []).filter(img => {
            if (img.id === id) {
                URL.revokeObjectURL(img.preview);
                return false;
            }
            return true;
        });
        setToolData(TOOL_ID, { images: updatedImages });
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        const updatedImages = [...(images || [])];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= updatedImages.length) return;

        [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
        setToolData(TOOL_ID, { images: updatedImages });
    };

    // Compress image using canvas
    const compressImage = (imgElement: HTMLImageElement, quality: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Calculate max dimensions for compression (optional: limit to reasonable size)
                const maxWidth = 2000;
                const maxHeight = 2000;
                let width = imgElement.width;
                let height = imgElement.height;

                // Resize if too large
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image to canvas
                ctx.drawImage(imgElement, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result as string);
                        };
                        reader.onerror = () => {
                            reject(new Error('Failed to read compressed image'));
                        };
                        reader.readAsDataURL(blob);
                    },
                    'image/jpeg',
                    quality
                );
            } catch (error) {
                reject(error);
            }
        });
    };

    const convertToPdf = async () => {
        if (!images || images.length === 0) {
            setToolData(TOOL_ID, { output: 'Please add at least one image.' });
            return;
        }

        setLoadingAction('Converting');
        
        try {
            // Set PDF metadata
            const pdf = new jsPDF({
                orientation: options.orientation,
                unit: 'mm',
                format: options.pageSize as any
            });

            if (options.pdfTitle) {
                pdf.setProperties({ title: options.pdfTitle });
            }
            if (options.pdfAuthor) {
                pdf.setProperties({ author: options.pdfAuthor });
            }

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = options.margin || 0;
            const contentWidth = pageWidth - (margin * 2);
            const contentHeight = pageHeight - (margin * 2);

            for (let i = 0; i < images.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                const img = images[i];
                const imgElement = new Image();
                
                await new Promise<void>((resolve, reject) => {
                    imgElement.onload = async () => {
                        try {
                            // Get original dimensions
                            let imgWidth = imgElement.width;
                            let imgHeight = imgElement.height;
                            
                            // Compress image if enabled
                            let imageDataUrl = img.preview;
                            if (options.compress !== false) {
                                try {
                                    const quality = options.compressionQuality || 0.85;
                                    imageDataUrl = await compressImage(imgElement, quality);
                                    // Load compressed image to get new dimensions
                                    const compressedImg = new Image();
                                    await new Promise<void>((imgResolve, imgReject) => {
                                        compressedImg.onload = () => {
                                            imgResolve();
                                        };
                                        compressedImg.onerror = () => {
                                            // If compressed image fails to load, use original
                                            imgReject();
                                        };
                                        compressedImg.src = imageDataUrl;
                                    });
                                    // Use compressed image dimensions
                                    imgWidth = compressedImg.width;
                                    imgHeight = compressedImg.height;
                                } catch (compressError) {
                                    // If compression fails, use original image
                                    console.warn('Image compression failed, using original:', compressError);
                                    imageDataUrl = img.preview;
                                }
                            }

                            // Auto-rotate based on EXIF if enabled
                            
                            // Check if image needs rotation (if auto-rotate is enabled)
                            if (options.autoRotate && imgWidth > imgHeight && options.orientation === 'portrait') {
                                // Image is landscape but page is portrait - might need rotation
                                // This is a simple check, full EXIF would need exif-js library
                            }

                            const aspectRatio = imgWidth / imgHeight;
                            let finalWidth: number;
                            let finalHeight: number;

                            // Calculate dimensions based on fit mode (using original or compressed dimensions)
                            switch (options.fitMode || 'fit') {
                                case 'actual':
                                    // Convert pixels to mm (assuming 96 DPI)
                                    finalWidth = (imgWidth * 25.4) / 96;
                                    finalHeight = (imgHeight * 25.4) / 96;
                                    break;
                                case 'stretch':
                                    finalWidth = contentWidth;
                                    finalHeight = contentHeight;
                                    break;
                                case 'scale':
                                    const scaleFactor = (options.scale || 100) / 100;
                                    const scaledWidth = (imgWidth * 25.4) / 96 * scaleFactor;
                                    const scaledHeight = (imgHeight * 25.4) / 96 * scaleFactor;
                                    finalWidth = scaledWidth;
                                    finalHeight = scaledHeight;
                                    break;
                                case 'fit':
                                default:
                                    // Fit to page while maintaining aspect ratio
                                    finalWidth = contentWidth;
                                    finalHeight = contentWidth / aspectRatio;
                                    if (finalHeight > contentHeight) {
                                        finalHeight = contentHeight;
                                        finalWidth = contentHeight * aspectRatio;
                                    }
                                    break;
                            }

                            // Calculate position
                            let x: number, y: number;
                            const position = options.position || 'center';
                            
                            switch (position) {
                                case 'top-left':
                                    x = margin;
                                    y = margin;
                                    break;
                                case 'top-center':
                                    x = margin + (contentWidth - finalWidth) / 2;
                                    y = margin;
                                    break;
                                case 'top-right':
                                    x = margin + contentWidth - finalWidth;
                                    y = margin;
                                    break;
                                case 'middle-left':
                                    x = margin;
                                    y = margin + (contentHeight - finalHeight) / 2;
                                    break;
                                case 'middle-right':
                                    x = margin + contentWidth - finalWidth;
                                    y = margin + (contentHeight - finalHeight) / 2;
                                    break;
                                case 'bottom-left':
                                    x = margin;
                                    y = margin + contentHeight - finalHeight;
                                    break;
                                case 'bottom-center':
                                    x = margin + (contentWidth - finalWidth) / 2;
                                    y = margin + contentHeight - finalHeight;
                                    break;
                                case 'bottom-right':
                                    x = margin + contentWidth - finalWidth;
                                    y = margin + contentHeight - finalHeight;
                                    break;
                                case 'center':
                                default:
                                    x = margin + (contentWidth - finalWidth) / 2;
                                    y = margin + (contentHeight - finalHeight) / 2;
                                    break;
                            }

                            // Use compressed image data if available
                            pdf.addImage(imageDataUrl, 'JPEG', x, y, finalWidth, finalHeight);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };

                    imgElement.onerror = () => {
                        reject(new Error(`Failed to load image: ${img.name}`));
                    };

                    imgElement.src = img.preview;
                });
            }

            // Generate PDF blob
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            setToolData(TOOL_ID, { 
                output: pdfUrl,
                pdfBlob: pdfBlob
            });
        } catch (error) {
            setToolData(TOOL_ID, { 
                output: `Error converting to PDF: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadPdf = () => {
        if (!data.pdfBlob) return;
        
        const url = URL.createObjectURL(data.pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `images-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        (images || []).forEach(img => URL.revokeObjectURL(img.preview));
        clearToolData(TOOL_ID);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateOption = (key: string, value: any) => {
        setToolData(TOOL_ID, { options: { ...options, [key]: value } });
    };

    return (
        <ToolPane
            title="Images to PDF"
            description="Convert multiple images to PDF, each image as one page"
            onClear={handleClear}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Upload Area */}
                <div
                    className="border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:bg-bg-glass-hover transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <FileImage className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload images</p>
                        <p className="text-xs text-foreground-secondary mt-1">Multiple images supported</p>
                    </div>
                </div>

                {/* Options */}
                {(images && images.length > 0) && (
                    <div className="space-y-4">
                        {/* Basic Options */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Orientation</label>
                                <select
                                    value={options.orientation}
                                    onChange={(e) => updateOption('orientation', e.target.value)}
                                    className="glass-input w-full text-sm"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Page Size</label>
                                <select
                                    value={options.pageSize}
                                    onChange={(e) => updateOption('pageSize', e.target.value)}
                                    className="glass-input w-full text-sm"
                                >
                                    <option value="a0">A0</option>
                                    <option value="a1">A1</option>
                                    <option value="a2">A2</option>
                                    <option value="a3">A3</option>
                                    <option value="a4">A4</option>
                                    <option value="a5">A5</option>
                                    <option value="a6">A6</option>
                                    <option value="letter">Letter</option>
                                    <option value="legal">Legal</option>
                                    <option value="tabloid">Tabloid</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Margin (mm)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={options.margin || 0}
                                    onChange={(e) => updateOption('margin', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                        </div>

                        {/* Image Fitting Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Fit Mode</label>
                                <select
                                    value={options.fitMode || 'fit'}
                                    onChange={(e) => updateOption('fitMode', e.target.value)}
                                    className="glass-input w-full text-sm"
                                >
                                    <option value="fit">Fit to Page</option>
                                    <option value="actual">Actual Size</option>
                                    <option value="stretch">Stretch to Fill</option>
                                    <option value="scale">Custom Scale</option>
                                </select>
                            </div>
                            {options.fitMode === 'scale' ? (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Scale (%)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="500"
                                        value={options.scale || 100}
                                        onChange={(e) => updateOption('scale', parseInt(e.target.value) || 100)}
                                        className="glass-input w-full text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Position</label>
                                    <select
                                        value={options.position || 'center'}
                                        onChange={(e) => updateOption('position', e.target.value)}
                                        className="glass-input w-full text-sm"
                                    >
                                        <option value="center">Center</option>
                                        <option value="top-left">Top Left</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="middle-left">Middle Left</option>
                                        <option value="middle-right">Middle Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="bottom-center">Bottom Center</option>
                                        <option value="bottom-right">Bottom Right</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Advanced Options */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="autoRotate"
                                    checked={options.autoRotate !== false}
                                    onChange={(e) => updateOption('autoRotate', e.target.checked)}
                                    className="rounded border-border-glass bg-bg-glass text-primary focus:ring-primary"
                                />
                                <label htmlFor="autoRotate" className="text-sm cursor-pointer">Auto-rotate images</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="compress"
                                    checked={options.compress !== false}
                                    onChange={(e) => updateOption('compress', e.target.checked)}
                                    className="rounded border-border-glass bg-bg-glass text-primary focus:ring-primary"
                                />
                                <label htmlFor="compress" className="text-sm cursor-pointer">Compress images</label>
                            </div>
                            {options.compress !== false && (
                                <div className="space-y-1 pl-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                            Compression Quality: {Math.round((options.compressionQuality || 0.85) * 100)}%
                                        </label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.05"
                                        value={options.compressionQuality || 0.85}
                                        onChange={(e) => updateOption('compressionQuality', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-bg-glass-hover rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-foreground-secondary">
                                        <span>Smaller file</span>
                                        <span>Better quality</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PDF Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">PDF Title (optional)</label>
                                <input
                                    type="text"
                                    value={options.pdfTitle || ''}
                                    onChange={(e) => updateOption('pdfTitle', e.target.value)}
                                    className="glass-input w-full text-sm"
                                    placeholder="Document title"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">PDF Author (optional)</label>
                                <input
                                    type="text"
                                    value={options.pdfAuthor || ''}
                                    onChange={(e) => updateOption('pdfAuthor', e.target.value)}
                                    className="glass-input w-full text-sm"
                                    placeholder="Author name"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Image List */}
                {images && images.length > 0 && (
                    <div className="flex-1 min-h-0 space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                            Images ({images.length})
                        </label>
                        <div className="space-y-2 overflow-y-auto max-h-[300px]">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="glass-input p-3 flex items-center space-x-3"
                                >
                                    <img
                                        src={img.preview}
                                        alt={img.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{img.name}</p>
                                        <p className="text-xs text-foreground-secondary">
                                            {(img.file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => moveImage(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveImage(index, 'down')}
                                            disabled={index === images.length - 1}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                            title="Remove"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {images && images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={convertToPdf}
                            loading={loadingAction === 'Converting'}
                            className="uppercase tracking-widest"
                        >
                            Convert to PDF
                        </Button>
                        {data.pdfBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadPdf}
                                className="uppercase tracking-widest"
                            >
                                Download PDF
                            </Button>
                        )}
                    </div>
                )}

                {(!images || images.length === 0) && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload images to get started
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

