import React, { useMemo } from 'react';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';
import { FileCode, Search, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'mime-types';

const MIME_TYPES = [
    { extension: '.html', type: 'text/html', description: 'HTML document' },
    { extension: '.css', type: 'text/css', description: 'Cascading Style Sheets' },
    { extension: '.js', type: 'text/javascript', description: 'JavaScript' },
    { extension: '.json', type: 'application/json', description: 'JSON format' },
    { extension: '.xml', type: 'application/xml', description: 'XML format' },
    { extension: '.txt', type: 'text/plain', description: 'Plain text' },
    { extension: '.png', type: 'image/png', description: 'Portable Network Graphics' },
    { extension: '.jpg', type: 'image/jpeg', description: 'JPEG image' },
    { extension: '.jpeg', type: 'image/jpeg', description: 'JPEG image' },
    { extension: '.gif', type: 'image/gif', description: 'Graphics Interchange Format' },
    { extension: '.svg', type: 'image/svg+xml', description: 'Scalable Vector Graphics' },
    { extension: '.webp', type: 'image/webp', description: 'WebP image' },
    { extension: '.ico', type: 'image/x-icon', description: 'Icon format' },
    { extension: '.pdf', type: 'application/pdf', description: 'Adobe Portable Document Format' },
    { extension: '.zip', type: 'application/zip', description: 'ZIP archive' },
    { extension: '.mp3', type: 'audio/mpeg', description: 'MP3 audio' },
    { extension: '.mp4', type: 'video/mp4', description: 'MP4 video' },
    { extension: '.wav', type: 'audio/wav', description: 'Waveform Audio Format' },
    { extension: '.ogg', type: 'video/ogg', description: 'OGG video' },
    { extension: '.webm', type: 'video/webm', description: 'WebM video' },
    { extension: '.php', type: 'application/x-httpd-php', description: 'PHP script' },
    { extension: '.py', type: 'text/x-python', description: 'Python script' },
    { extension: '.java', type: 'text/x-java-source', description: 'Java source' },
    { extension: '.c', type: 'text/x-c', description: 'C source' },
    { extension: '.cpp', type: 'text/x-c++', description: 'C++ source' },
    { extension: '.cs', type: 'text/plain', description: 'C# source' },
    { extension: '.go', type: 'text/x-go', description: 'Go source' },
    { extension: '.rb', type: 'text/x-ruby', description: 'Ruby script' },
    { extension: '.sh', type: 'application/x-sh', description: 'Shell script' },
    { extension: '.sql', type: 'application/sql', description: 'SQL query' },
    { extension: '.yaml', type: 'text/yaml', description: 'YAML format' },
    { extension: '.yml', type: 'text/yaml', description: 'YAML format' },
    { extension: '.csv', type: 'text/csv', description: 'Comma-Separated Values' },
    { extension: '.md', type: 'text/markdown', description: 'Markdown document' },
    { extension: '.woff', type: 'font/woff', description: 'Web Open Font Format' },
    { extension: '.woff2', type: 'font/woff2', description: 'Web Open Font Format 2.0' },
    { extension: '.ttf', type: 'font/ttf', description: 'TrueType Font' },
    { extension: '.otf', type: 'font/otf', description: 'OpenType Font' },
    { extension: '.eot', type: 'application/vnd.ms-fontobject', description: 'Embedded OpenType font' },
    { extension: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word document' },
    { extension: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Microsoft Excel spreadsheet' },
    { extension: '.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'Microsoft PowerPoint presentation' },
    { extension: '.epub', type: 'application/epub+zip', description: 'EPUB ebook' },
    { extension: '.tar', type: 'application/x-tar', description: 'Tape Archive' },
    { extension: '.gz', type: 'application/gzip', description: 'Gzip compressed archive' },
    { extension: '.7z', type: 'application/x-7z-compressed', description: '7-Zip compressed archive' },
];

export const MimeTypesList: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);
    const searchQuery = data?.input || '';

    const filteredMimeTypes = useMemo(() => {
        if (!searchQuery) return MIME_TYPES;
        const q = searchQuery.toLowerCase();
        return MIME_TYPES.filter(m =>
            m.extension.toLowerCase().includes(q) ||
            m.type.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied: ${text}`);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-panel p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-foreground/70">MIME Types Lookup</h3>
                    </div>
                    <div className="w-full md:w-96">
                        <Input
                            placeholder="Search by extension, type or description..."
                            value={searchQuery}
                            onChange={(e) => setToolData(TOOL_ID, { input: e.target.value })}
                            icon={Search}
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border-glass bg-foreground/5 dark:bg-black/20">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-foreground/5 text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
                                    <th className="px-6 py-4">Extension</th>
                                    <th className="px-6 py-4">Content Type (MIME)</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-glass">
                                {filteredMimeTypes.length > 0 ? (
                                    filteredMimeTypes.map((m, i) => (
                                        <tr key={i} className="hover:bg-foreground/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <code className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-mono">
                                                    {m.extension}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono text-foreground/80">{m.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-foreground/50">{m.description}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleCopy(m.type)}
                                                    className="p-2 rounded-lg bg-foreground/5 border border-border-glass text-foreground/40 hover:text-foreground hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Copy MIME Type"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-foreground/20 italic">
                                            No MIME types found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-foreground/60 block">Usage in Web Development</span>
                        <p className="text-[10px] text-foreground/30 leading-relaxed">
                            MIME types (Multipurpose Internet Mail Extensions) are used by browsers and servers to identify the type of content being transmitted.
                            Always ensure your server sends the correct <code>Content-Type</code> header for optimal security and display.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
