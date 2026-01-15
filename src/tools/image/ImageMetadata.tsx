import React, { useState, useCallback } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { FileUp, Info, Shield, ShieldCheck, Trash2, Search } from 'lucide-react';
import ExifReader from 'exifreader';
import { Button } from '@components/ui/Button';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { cn } from '@utils/cn';

const TOOL_ID = 'image-metadata';

interface MetadataGroup {
    title: string;
    items: { label: string; value: string; description?: string }[];
}

export const ImageMetadata: React.FC<{ tabId?: string }> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [image, setImage] = useState<{ file: File; url: string } | null>(null);
    const [metadata, setMetadata] = useState<MetadataGroup[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        addToHistory(effectiveId);
    }, [effectiveId, addToHistory]);

    const processFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        try {
            const url = URL.createObjectURL(file);
            setImage({ file, url });

            const arrayBuffer = await file.arrayBuffer();
            const tags = await ExifReader.load(arrayBuffer);

            const groups: MetadataGroup[] = [];

            // Helper to format values
            const formatValue = (tag: any) => {
                if (!tag) return 'N/A';
                return tag.description || tag.value || String(tag);
            };

            // Basic Image Info
            const basicInfo: MetadataGroup = {
                title: 'Basic Information',
                items: [
                    { label: 'Filename', value: file.name },
                    { label: 'File Size', value: (file.size / 1024).toFixed(2) + ' KB' },
                    { label: 'File Type', value: file.type },
                ]
            };

            if (tags['Image Width']) basicInfo.items.push({ label: 'Width', value: formatValue(tags['Image Width']) + ' px' });
            if (tags['Image Height']) basicInfo.items.push({ label: 'Height', value: formatValue(tags['Image Height']) + ' px' });
            groups.push(basicInfo);

            // Camera/Exif Info
            const exifTags = [
                { id: 'Make', label: 'Camera Make' },
                { id: 'Model', label: 'Camera Model' },
                { id: 'ExposureTime', label: 'Exposure Time' },
                { id: 'FNumber', label: 'F-Number' },
                { id: 'ISOSpeedRatings', label: 'ISO' },
                { id: 'DateTimeOriginal', label: 'Date Taken' },
                { id: 'FocalLength', label: 'Focal Length' },
                { id: 'LensModel', label: 'Lens' },
                { id: 'Software', label: 'Software' },
            ];

            const cameraInfo: MetadataGroup = {
                title: 'Camera & Lens',
                items: exifTags
                    .filter(t => tags[t.id])
                    .map(t => ({ label: t.label, value: formatValue(tags[t.id]) }))
            };
            if (cameraInfo.items.length > 0) groups.push(cameraInfo);

            // GPS Info
            if (tags.GPSLatitude || tags.GPSLongitude) {
                const gpsInfo: MetadataGroup = {
                    title: 'Location (GPS)',
                    items: [
                        { label: 'Latitude', value: formatValue(tags.GPSLatitude) },
                        { label: 'Longitude', value: formatValue(tags.GPSLongitude) },
                    ]
                };
                if (tags.GPSAltitude) gpsInfo.items.push({ label: 'Altitude', value: formatValue(tags.GPSAltitude) });
                groups.push(gpsInfo);
            }

            // Other Tags (Advanced)
            const otherItems = Object.entries(tags)
                .filter(([key]) => !['base64', 'Thumbnail'].includes(key) && !groups.some(g => g.items.some(i => i.label === key)))
                .map(([key, value]) => ({ label: key, value: formatValue(value) }));

            if (otherItems.length > 0) {
                groups.push({
                    title: 'Advanced Metadata',
                    items: otherItems
                });
            }

            setMetadata(groups);
            setToolData(effectiveId, { meta: { groups, hasMetadata: groups.length > 0 } });
        } catch (error) {
            console.error('Error reading metadata:', error);
            toast.error('Failed to read image metadata');
        } finally {
            setIsProcessing(false);
        }
    }, [setToolData]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    }, [processFile]);

    const removeMetadata = async () => {
        if (!image) return;
        setIsProcessing(true);
        try {
            // Simple way to strip metadata: draw to canvas and export
            const img = new Image();
            img.src = image.url;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `stripped_${image.file.name}`;
                    link.click();
                    toast.success('Metadata removed and image downloaded');
                }
            }, image.file.type);
        } catch (error) {
            console.error('Error stripping metadata:', error);
            toast.error('Failed to strip metadata');
        } finally {
            setIsProcessing(false);
        }
    };

    const onClear = () => {
        setImage(null);
        setMetadata([]);
        clearToolData(effectiveId);
    };

    const filteredMetadata = metadata.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    return (
        <ToolPane
            title="Image Metadata"
            description="View EXIF, GPS, and other embedded metadata or strip it for privacy"
            onClear={onClear}
        >
            {!image ? (
                <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-glass rounded-3xl bg-glass-background/20 transition-all hover:bg-glass-background/30 group"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                        <FileUp className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Drop image here</h3>
                    <p className="text-sm text-foreground-secondary mb-8">Supports JPG, PNG, WebP, HEIC, etc.</p>
                    <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    />
                    <Button onClick={() => document.getElementById('image-upload')?.click()} size="lg" className="rounded-2xl">
                        Select File
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-6 h-full overflow-hidden">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl border border-border-glass overflow-hidden shadow-lg bg-black/20">
                                <img src={image.url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm truncate max-w-[200px]">{image.file.name}</h4>
                                <p className="text-[10px] text-foreground-secondary italic">{(image.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={removeMetadata}
                                disabled={isProcessing}
                                className="border-red-500/30 hover:bg-red-500/10 text-red-400 gap-2 font-black text-[10px] uppercase tracking-widest"
                            >
                                <Shield className="w-3 h-3" />
                                Strip & Download
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClear} className="rounded-xl text-foreground-secondary hover:text-red-400">
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-border-glass">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-tighter">Tags Found</p>
                                <p className="text-lg font-black">{metadata.reduce((acc, g) => acc + g.items.length, 0)}</p>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-border-glass">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                metadata.some(g => g.title.includes('Location'))
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                            )}>
                                {metadata.some(g => g.title.includes('Location')) ? <Search size={20} /> : <ShieldCheck size={20} />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-tighter">Privacy Risk</p>
                                <p className="text-lg font-black">
                                    {metadata.some(g => g.title.includes('Location')) ? 'Location Data Detected' : 'No Sensitive Data'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search metadata tags or values..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-12 pr-4 bg-foreground/[0.03] border border-border-glass rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm transition-all"
                        />
                    </div>

                    {/* Metadata Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {filteredMetadata.length > 0 ? filteredMetadata.map((group, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-secondary">{group.title}</h5>
                                    <div className="h-[1px] flex-1 bg-border-glass" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {group.items.map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-glass-background/50 border border-border-glass hover:bg-glass-background transition-colors group">
                                            <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-tight">{item.label}</span>
                                            <span className="text-xs font-mono text-primary break-all leading-relaxed">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-12 text-foreground-secondary opacity-50">
                                <Search size={48} className="mb-4" />
                                <p>No matching metadata tags found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ToolPane>
    );
};
