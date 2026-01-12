import React, { useState, useEffect } from 'react';
import { Link, Settings } from 'lucide-react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

export const CanonicalUrlGenerator: React.FC<{ tabId: string }> = ({ tabId }) => {
    const { data, setToolData } = useToolState(tabId);
    
    const [url, setUrl] = useState<string>(data.input || 'https://www.example.com/Product?id=123&ref=abc');
    const [forceHttps, setForceHttps] = useState<boolean>(true);
    const [removeQueryParams, setRemoveQueryParams] = useState<boolean>(false);
    const [removeHash, setRemoveHash] = useState<boolean>(true);
    const [trailingSlash, setTrailingSlash] = useState<'keep' | 'remove' | 'force'>('remove');
    const [lowercase, setLowercase] = useState<boolean>(true);
    const [result, setResult] = useState<string>('');

    useEffect(() => {
        setToolData(tabId, { input: url, output: result });
        generateCanonical();
    }, [url, forceHttps, removeQueryParams, removeHash, trailingSlash, lowercase, tabId, setToolData]);

    const generateCanonical = () => {
        try {
            if (!url) {
                setResult('');
                return;
            }

            let canonical = url.trim();
            
            // Basic validation to ensure it parses
            if (!canonical.startsWith('http')) {
                canonical = 'https://' + canonical;
            }

            const urlObj = new URL(canonical);

            // Force HTTPS
            if (forceHttps) {
                urlObj.protocol = 'https:';
            }

            // Lowercase host
            urlObj.hostname = urlObj.hostname.toLowerCase();

            // Remove hash
            if (removeHash) {
                urlObj.hash = '';
            }

            // Remove Query Params
            if (removeQueryParams) {
                urlObj.search = '';
            }

            // Lowercase path
            if (lowercase) {
                urlObj.pathname = urlObj.pathname.toLowerCase();
            }

            // Trailing Slash
            
            // Check if it's just root, URL() usually adds slash for root
            // If path is not root/empty, apply trailing slash logic
            if (urlObj.pathname !== '/' || urlObj.search || urlObj.hash) {
                // If we have search or hash, removing trailing slash from path might range into complex regex usage on full string
                // Better to manipulate pathname directly
                if (trailingSlash === 'remove' && urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
                    urlObj.pathname = urlObj.pathname.slice(0, -1);
                } else if (trailingSlash === 'force' && !urlObj.pathname.endsWith('/')) {
                    // Don't add slash if it looks like a file extension? Optional logic, but let's stick to simple "force"
                    urlObj.pathname += '/';
                }
            }

            setResult(urlObj.toString());

        } catch (e) {
             setResult('Invalid URL');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
    };

    return (
        <ToolPane
            title="Canonical URL Generator"
            description="Normalize and generate canonical URLs for SEO"
            onCopy={handleCopy}
            onClear={() => setUrl('')}
        >
             <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Input URL
                    </label>
                     <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                         <Link className="w-4 h-4 text-foreground-muted" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-transparent text-sm focus:outline-none"
                            placeholder="https://example.com/page"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Normalization Rules
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={forceHttps}
                                onChange={(e) => setForceHttps(e.target.checked)}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Force HTTPS</div>
                        </label>

                         <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={removeQueryParams}
                                onChange={(e) => setRemoveQueryParams(e.target.checked)}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Remove Query Parameters</div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={removeHash}
                                onChange={(e) => setRemoveHash(e.target.checked)}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Remove Hash Fragment</div>
                        </label>

                         <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={lowercase}
                                onChange={(e) => setLowercase(e.target.checked)}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Lowercase Path</div>
                        </label>
                    </div>

                     <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                            Trailing Slash
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['keep', 'remove', 'force'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setTrailingSlash(opt)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                        trailingSlash === opt
                                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                            : 'bg-[var(--color-glass-input)] border-border-glass text-foreground-muted hover:border-gray-600'
                                    }`}
                                >
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                 {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Canonical Link Tag
                    </label>
                    <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-xl overflow-hidden p-4">
                        <code className="text-sm font-mono text-foreground break-all text-amber-300">
                           {result ? `<link rel="canonical" href="${result}" />` : ''}
                        </code>
                    </div>
                    
                    <div className="pt-2">
                        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                            Clean URL
                        </label>
                        <div className="mt-1 flex items-center justify-between p-2 rounded bg-black/20 border border-white/10">
                            <code className="text-xs font-mono text-foreground-secondary break-all">
                                {result}
                            </code>
                         </div>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
