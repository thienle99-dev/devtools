import React, { useState } from 'react';
import { Download, Link, Folder, Shield, FileText, Music, Video, Archive, FileImage, Binary, FileCode } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { cn } from '@utils/cn';

interface AddDownloadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (url: string, filename?: string) => void;
    defaultDownloadPath?: string;
}

export const AddDownloadDialog: React.FC<AddDownloadDialogProps> = ({
    isOpen,
    onClose,
    onAdd,
}) => {
    const [url, setUrl] = useState('');
    const [filename, setFilename] = useState('');
    const [advanced, setAdvanced] = useState(false);

    const getCategoryInfo = (url: string) => {
        const ext = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase();
        if (!ext) return { icon: Link, label: 'Detecting...', color: 'text-foreground-tertiary' };

        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return { icon: Music, label: 'Audio', color: 'text-pink-500' };
        if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return { icon: Video, label: 'Video', color: 'text-purple-500' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: Archive, label: 'Archive', color: 'text-orange-500' };
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return { icon: FileImage, label: 'Image', color: 'text-amber-500' };
        if (['exe', 'msi', 'dmg', 'pkg'].includes(ext)) return { icon: Binary, label: 'Program', color: 'text-emerald-500' };
        if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return { icon: FileText, label: 'Document', color: 'text-blue-500' };
        if (['html', 'js', 'css', 'json', 'ts', 'tsx'].includes(ext)) return { icon: FileCode, label: 'Code', color: 'text-indigo-500' };

        return { icon: Download, label: 'File', color: 'text-foreground-tertiary' };
    };

    const category = getCategoryInfo(url);
    const CategoryIcon = category.icon;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        onAdd(url, filename || undefined);
        setUrl('');
        setFilename('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Download"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1">
                            Download URL
                        </label>
                        <Input
                            placeholder="https://example.com/file.zip"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            icon={Link}
                            fullWidth
                            autoFocus
                            className="h-11 bg-glass-input"
                        />
                        <div className="flex items-center gap-2 mt-2 ml-1">
                            <CategoryIcon className={cn("w-3.5 h-3.5", category.color)} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary">
                                Detected Category: <span className={category.color}>{category.label}</span>
                            </span>
                        </div>
                    </div>

                    {advanced && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1">
                                    Custom Filename (Optional)
                                </label>
                                <Input
                                    placeholder="Enter custom name..."
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    icon={Folder}
                                    fullWidth
                                    className="h-11 bg-glass-input"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-border-glass pt-6">
                    <button
                        type="button"
                        onClick={() => setAdvanced(!advanced)}
                        className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                        <Shield className="w-3.5 h-3.5" />
                        {advanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                    </button>

                    <div className="flex gap-3">
                        <Button variant="ghost" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                         <Button
                            type="submit"
                            disabled={!url}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 border-t border-white/20"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Start Download
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
