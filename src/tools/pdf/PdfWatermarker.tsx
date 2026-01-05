import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument, rgb, PDFPage } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, Image as ImageIcon } from 'lucide-react';

const TOOL_ID = 'pdf-watermarker';

interface PdfWatermarkerProps {
    tabId?: string;
}

export const PdfWatermarker: React.FC<PdfWatermarkerProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            watermarkType: 'text' as 'text' | 'image',
            watermarkText: 'WATERMARK',
            watermarkImage: null as File | null,
            opacity: 0.5,
            fontSize: 48,
            color: '#000000',
            position: 'center' as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
            rotation: 45,
            pages: 'all' as string,
            watermarkedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const watermarkType = (options.watermarkType || 'text') as 'text' | 'image';
    const watermarkText = (options.watermarkText || 'WATERMARK') as string;
    const watermarkImage = options.watermarkImage as File | null;
    const opacity = (options.opacity || 0.5) as number;
    const fontSize = (options.fontSize || 48) as number;
    const color = (options.color || '#000000') as string;
    const position = (options.position || 'center') as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    const rotation = (options.rotation || 45) as number;
    const pages = (options.pages || 'all') as string;
    const watermarkedBlob = options.watermarkedBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setToolData(effectiveId, {
            options: {
                ...options,
                pdfFile: file,
                watermarkedBlob: undefined
            }
        });
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setToolData(effectiveId, {
            options: {
                ...options,
                watermarkImage: file,
                watermarkedBlob: undefined
            }
        });
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16) / 255,
                  g: parseInt(result[2], 16) / 255,
                  b: parseInt(result[3], 16) / 255
              }
            : { r: 0, g: 0, b: 0 };
    };

    const getPosition = (page: PDFPage) => {
        const { width, height } = page.getSize();
        const margin = 20;

        switch (position) {
            case 'top-left':
                return { x: margin, y: height - margin };
            case 'top-right':
                return { x: width - margin, y: height - margin };
            case 'bottom-left':
                return { x: margin, y: margin };
            case 'bottom-right':
                return { x: width - margin, y: margin };
            default: // center
                return { x: width / 2, y: height / 2 };
        }
    };

    const addWatermark = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        if (watermarkType === 'image' && !watermarkImage) {
            setToolData(effectiveId, { output: 'Please upload a watermark image.' });
            return;
        }

        setLoadingAction('Adding Watermark');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Parse which pages to watermark
            let pagesToWatermark: number[] = [];
            if (pages === 'all') {
                pagesToWatermark = Array.from({ length: totalPages }, (_, i) => i);
            } else {
                const parts = pages.split(',').map(p => p.trim());
                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                            for (let i = start; i <= end; i++) {
                                if (!pagesToWatermark.includes(i - 1)) {
                                    pagesToWatermark.push(i - 1);
                                }
                            }
                        }
                    } else {
                        const pageNum = parseInt(part.trim());
                        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                            if (!pagesToWatermark.includes(pageNum - 1)) {
                                pagesToWatermark.push(pageNum - 1);
                            }
                        }
                    }
                }
            }

            if (pagesToWatermark.length === 0) {
                pagesToWatermark = Array.from({ length: totalPages }, (_, i) => i);
            }

            let watermarkImageBytes: Uint8Array | null = null;
            if (watermarkType === 'image' && watermarkImage) {
                const imageArrayBuffer = await watermarkImage.arrayBuffer();
                watermarkImageBytes = new Uint8Array(imageArrayBuffer);
            }

            for (const pageIndex of pagesToWatermark) {
                const page = pdfDoc.getPage(pageIndex);
                const { width, height } = page.getSize();
                const pos = getPosition(page);

                if (watermarkType === 'text') {
                    const rgbColor = hexToRgb(color);
                    page.drawText(watermarkText, {
                        x: pos.x,
                        y: pos.y,
                        size: fontSize,
                        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                        opacity: opacity,
                        rotate: degrees(rotation)
                    });
                } else if (watermarkType === 'image' && watermarkImageBytes) {
                    let image;
                    if (watermarkImage?.type === 'image/png') {
                        image = await pdfDoc.embedPng(watermarkImageBytes);
                    } else {
                        image = await pdfDoc.embedJpg(watermarkImageBytes);
                    }

                    const imageDims = image.scale(0.3); // Scale image to 30% of original size
                    page.drawImage(image, {
                        x: pos.x - imageDims.width / 2,
                        y: pos.y - imageDims.height / 2,
                        width: imageDims.width,
                        height: imageDims.height,
                        opacity: opacity,
                        rotate: degrees(rotation)
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    watermarkedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error adding watermark: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadWatermarked = () => {
        if (!watermarkedBlob) return;

        const url = URL.createObjectURL(watermarkedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'watermarked'}-watermarked.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, {
            options: {
                ...options,
                [key]: value,
                watermarkedBlob: undefined
            }
        });
    };

    return (
        <ToolPane
            title="PDF Watermarker"
            description="Add text or image watermark to PDF"
            onClear={handleClear}
            onDownload={watermarkedBlob ? downloadWatermarked : undefined}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Upload PDF Area */}
                <div
                    className="border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:bg-bg-glass-hover transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                    />
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload PDF file</p>
                        {pdfFile && (
                            <p className="text-xs text-foreground-secondary mt-1">
                                {pdfFile.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Watermark Options */}
                {pdfFile && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Watermark Type</label>
                            <select
                                value={watermarkType}
                                onChange={(e) => updateOption('watermarkType', e.target.value)}
                                className="glass-input w-full text-sm"
                            >
                                <option value="text">Text Watermark</option>
                                <option value="image">Image Watermark</option>
                            </select>
                        </div>

                        {watermarkType === 'text' ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Watermark Text</label>
                                    <input
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => updateOption('watermarkText', e.target.value)}
                                        className="glass-input w-full text-sm"
                                        placeholder="WATERMARK"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Font Size</label>
                                        <input
                                            type="number"
                                            min="12"
                                            max="200"
                                            value={fontSize}
                                            onChange={(e) => updateOption('fontSize', parseInt(e.target.value) || 48)}
                                            className="glass-input w-full text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Color</label>
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => updateOption('color', e.target.value)}
                                            className="glass-input w-full h-10"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div
                                className="border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:bg-bg-glass-hover transition-colors cursor-pointer"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-sm">Click to upload watermark image</p>
                                    {watermarkImage && (
                                        <p className="text-xs text-foreground-secondary mt-1">
                                            {watermarkImage.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Position</label>
                                <select
                                    value={position}
                                    onChange={(e) => updateOption('position', e.target.value)}
                                    className="glass-input w-full text-sm"
                                >
                                    <option value="center">Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Rotation (degrees)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="360"
                                    value={rotation}
                                    onChange={(e) => updateOption('rotation', parseInt(e.target.value) || 45)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Opacity ({Math.round(opacity * 100)}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={opacity}
                                    onChange={(e) => updateOption('opacity', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Pages (e.g., "1-3,5" or "all")</label>
                                <input
                                    type="text"
                                    value={pages}
                                    onChange={(e) => updateOption('pages', e.target.value)}
                                    placeholder="all"
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (watermarkType === 'text' || watermarkImage) && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={addWatermark}
                            loading={loadingAction === 'Adding Watermark'}
                            className="uppercase tracking-widest"
                        >
                            Add Watermark
                        </Button>
                        {watermarkedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadWatermarked}
                                className="uppercase tracking-widest"
                            >
                                Download Watermarked PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to add watermark
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

