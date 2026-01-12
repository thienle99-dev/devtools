import React, { useState } from 'react';
import { Download, Link, Folder, Shield } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

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

                <div className="flex items-center justify-between border-t border-white/5 pt-6">
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
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
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
