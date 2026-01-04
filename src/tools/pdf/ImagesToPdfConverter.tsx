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
            pageSize: 'a4' as 'a4' | 'letter',
            margin: 0
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

    const convertToPdf = async () => {
        if (!images || images.length === 0) {
            setToolData(TOOL_ID, { output: 'Please add at least one image.' });
            return;
        }

        setLoadingAction('Converting');
        
        try {
            const pdf = new jsPDF({
                orientation: options.orientation,
                unit: 'mm',
                format: options.pageSize
            });

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
                    imgElement.onload = () => {
                        try {
                            // Calculate dimensions to fit page while maintaining aspect ratio
                            let imgWidth = imgElement.width;
                            let imgHeight = imgElement.height;
                            const aspectRatio = imgWidth / imgHeight;

                            let finalWidth = contentWidth;
                            let finalHeight = contentWidth / aspectRatio;

                            if (finalHeight > contentHeight) {
                                finalHeight = contentHeight;
                                finalWidth = contentHeight * aspectRatio;
                            }

                            const x = margin + (contentWidth - finalWidth) / 2;
                            const y = margin + (contentHeight - finalHeight) / 2;

                            pdf.addImage(imgElement, 'JPEG', x, y, finalWidth, finalHeight);
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
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
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

