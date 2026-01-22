import React, { useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { FileUp, Trash2, FileCode, ImageIcon, Code } from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '@utils/format';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.DATA_URI_GENERATOR;

export const DataUriGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData } = useToolState(effectiveId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        input: '',
        options: {
            fileName: '',
            fileSize: 0,
            mimeType: ''
        }
    };

    const { input: uri, options } = data;
    const { fileName, fileSize, mimeType } = options;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setToolData(effectiveId, {
                input: result,
                options: {
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type
                }
            });
            toast.success('Generated Data URI!');
        };
        reader.onerror = () => {
            toast.error('Failed to read file');
        };
        reader.readAsDataURL(file);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };



    const generateHtmlTag = () => {
        if (mimeType.startsWith('image/')) {
            return `<img src="${uri}" alt="${fileName}" />`;
        } else if (mimeType.startsWith('audio/')) {
            return `<audio controls src="${uri}"></audio>`;
        } else if (mimeType.startsWith('video/')) {
            return `<video controls src="${uri}"></video>`;
        } else {
            return `<a href="${uri}" download="${fileName}">Download ${fileName}</a>`;
        }
    };

    const generateCssValue = () => {
        return `url("${uri}")`;
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Data URI Generator"
            description="Convert any file into a base64 encoded string for direct use in HTML/CSS"
            onClear={() => clearToolData(effectiveId)}
        >
            <div className="flex flex-col h-full space-y-6">
                {!uri ? (
                    <div
                        className="flex-1 border-2 border-dashed border-border-glass rounded-3xl flex flex-col items-center justify-center p-12 hover:bg-foreground/[0.02] transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileUp size={32} />
                        </div>
                        <h3 className="mt-6 text-xl font-bold">Upload file to encode</h3>
                        <p className="mt-2 text-foreground-muted text-sm">Images, icons, fonts, or any document</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        {/* File Info */}
                        <div className="glass-panel p-6 rounded-3xl border border-border-glass flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-foreground/[0.02] flex items-center justify-center overflow-hidden border border-border-glass">
                                {mimeType.startsWith('image/') ? (
                                    <img src={uri} className="max-w-full max-h-full object-contain p-2" alt="preview" />
                                ) : (
                                    <FileCode size={32} className="text-primary" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold truncate">{fileName}</p>
                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">{mimeType}</span>
                                </div>
                                <p className="text-xs text-foreground-muted uppercase tracking-widest font-bold">{formatBytes(fileSize)}</p>
                            </div>
                            <button
                                onClick={() => clearToolData(effectiveId)}
                                className="p-3 hover:bg-red-500/10 text-foreground-muted hover:text-red-500 rounded-2xl transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Code Blocks */}
                        <div className="space-y-6">
                            {/* Data URI */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                        <Code size={12} className="text-primary" /> Full Data URI
                                    </div>
                                    <button onClick={() => handleCopy(uri)} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                                        COPY ALL
                                    </button>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl relative group bg-black/10">
                                    <pre className="text-xs font-mono break-all max-h-32 overflow-y-auto custom-scrollbar text-foreground-secondary leading-relaxed">
                                        {uri}
                                    </pre>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* HTML Tag */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                            <ImageIcon size={12} className="text-secondary" /> HTML Tag
                                        </div>
                                        <button onClick={() => handleCopy(generateHtmlTag())} className="text-[10px] font-black text-secondary hover:underline uppercase tracking-widest">
                                            COPY
                                        </button>
                                    </div>
                                    <div className="glass-panel p-4 rounded-2xl bg-black/10">
                                        <code className="text-xs font-mono break-all text-secondary/80">
                                            {generateHtmlTag()}
                                        </code>
                                    </div>
                                </div>

                                {/* CSS Value */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                            <FileCode size={12} className="text-amber-500" /> CSS Background
                                        </div>
                                        <button onClick={() => handleCopy(generateCssValue())} className="text-[10px] font-black text-amber-500 hover:underline uppercase tracking-widest">
                                            COPY
                                        </button>
                                    </div>
                                    <div className="glass-panel p-4 rounded-2xl bg-black/10">
                                        <code className="text-xs font-mono break-all text-amber-500/80">
                                            background-image: {generateCssValue()};
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
