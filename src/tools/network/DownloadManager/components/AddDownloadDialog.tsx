import React, { useState } from 'react';
import { Download, Link, Folder, Shield, FileText, Music, Video, Archive, FileImage, Binary, FileCode, Key, Lock, Fingerprint } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { cn } from '@utils/cn';

interface AddDownloadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (urls: string[], options?: { 
        filename?: string, 
        checksum?: { algorithm: 'md5' | 'sha1' | 'sha256', value: string },
        credentials?: { username?: string, password?: string }
    }) => void;
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
    const [batchMode, setBatchMode] = useState(false);
    
    // Checksum
    const [checksumValue, setChecksumValue] = useState('');
    const [checksumAlgo, setChecksumAlgo] = useState<'md5' | 'sha1' | 'sha256'>('sha256');
    
    // Credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

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
        
        const urls = batchMode 
            ? url.split(/[\n, ]+/).filter(u => u.trim().startsWith('http')) 
            : [url.trim()];

        if (urls.length === 0) return;

        onAdd(urls, {
            filename: batchMode ? undefined : (filename || undefined),
            checksum: advanced && checksumValue ? { algorithm: checksumAlgo, value: checksumValue } : undefined,
            credentials: advanced && (username || password) ? { username, password } : undefined
        });

        setUrl('');
        setFilename('');
        setChecksumValue('');
        setUsername('');
        setPassword('');
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
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                                {batchMode ? 'Download URLs (Batch)' : 'Download URL'}
                            </label>
                            <button
                                type="button"
                                onClick={() => setBatchMode(!batchMode)}
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md transition-all",
                                    batchMode ? "bg-blue-500/20 text-blue-400" : "bg-foreground-primary/5 text-foreground-tertiary hover:bg-foreground-primary/10"
                                )}
                            >
                                {batchMode ? 'Disable Batch' : 'Enable Batch'}
                            </button>
                        </div>
                        {batchMode ? (
                            <textarea
                                placeholder="Paste multiple links here (one per line)..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full h-32 bg-glass-input border border-border-glass rounded-xl p-3 text-xs font-bold text-foreground-primary focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-foreground-tertiary/40 resize-none"
                            />
                        ) : (
                            <Input
                                placeholder="https://example.com/file.zip"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                icon={Link}
                                fullWidth
                                autoFocus
                                className="h-11 bg-glass-input"
                            />
                        )}
                        {!batchMode && (
                            <div className="flex items-center gap-2 mt-2 ml-1">
                                <CategoryIcon className={cn("w-3.5 h-3.5", category.color)} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary">
                                    Detected Category: <span className={category.color}>{category.label}</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {advanced && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {!batchMode && (
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
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Fingerprint className="w-3 h-3" />
                                        Integrity Check (Checksum)
                                    </label>
                                    <div className="flex gap-2">
                                        <select 
                                            value={checksumAlgo}
                                            onChange={(e) => setChecksumAlgo(e.target.value as any)}
                                            className="bg-glass-input border border-border-glass rounded-xl px-2 text-[10px] font-black text-foreground-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="md5">MD5</option>
                                            <option value="sha1">SHA1</option>
                                            <option value="sha256">SHA256</option>
                                        </select>
                                        <Input
                                            placeholder="Paste hash value..."
                                            value={checksumValue}
                                            onChange={(e) => setChecksumValue(e.target.value)}
                                            fullWidth
                                            className="h-11 bg-glass-input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider ml-1 flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Basic Authentication
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="User"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            icon={Key}
                                            className="h-11 bg-glass-input flex-1"
                                        />
                                        <Input
                                            type="password"
                                            placeholder="Pass"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 bg-glass-input flex-1"
                                        />
                                    </div>
                                </div>
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
