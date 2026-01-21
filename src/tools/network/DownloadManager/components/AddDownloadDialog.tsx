import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { X, Plus, Link } from 'lucide-react';

interface AddDownloadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (urls: string[], options?: any) => void;
}

export const AddDownloadDialog: React.FC<AddDownloadDialogProps> = ({
    isOpen,
    onClose,
    onAdd,
}) => {
    const [urls, setUrls] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlList.length > 0) {
            onAdd(urlList);
            setUrls('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-glass-panel border border-border-glass rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-foreground-tertiary hover:text-foreground-primary"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Link className="w-5 h-5 text-blue-500" />
                    New Download
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary mb-2 block">
                            URLs (one per line)
                        </label>
                        <textarea
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            className="w-full h-32 bg-background-depth-1 border border-border-glass rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
                            placeholder="https://example.com/file.zip"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!urls.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Queue
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
