import React, { useEffect, useMemo } from 'react';
import { Link as LinkIcon, Settings } from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.CANONICAL_URL_GENERATOR;

export const CanonicalUrlGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        input: 'https://www.example.com/Product?id=123&ref=abc',
        output: '',
        options: {
            forceHttps: true,
            removeQueryParams: false,
            removeHash: true,
            trailingSlash: 'remove',
            lowercase: true
        }
    };

    const { input: url, options } = data;
    const { forceHttps, removeQueryParams, removeHash, trailingSlash, lowercase } = options;

    const result = useMemo(() => {
        try {
            if (!url) return '';

            let canonical = url.trim();
            if (!canonical.startsWith('http')) {
                canonical = 'https://' + canonical;
            }

            const urlObj = new URL(canonical);

            if (forceHttps) {
                urlObj.protocol = 'https:';
            }

            urlObj.hostname = urlObj.hostname.toLowerCase();

            if (removeHash) {
                urlObj.hash = '';
            }

            if (removeQueryParams) {
                urlObj.search = '';
            }

            if (lowercase) {
                urlObj.pathname = urlObj.pathname.toLowerCase();
            }

            if (urlObj.pathname !== '/' || urlObj.search || urlObj.hash) {
                if (trailingSlash === 'remove' && urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
                    urlObj.pathname = urlObj.pathname.slice(0, -1);
                } else if (trailingSlash === 'force' && !urlObj.pathname.endsWith('/')) {
                    urlObj.pathname += '/';
                }
            }

            return urlObj.toString();
        } catch (e) {
            return 'Invalid URL';
        }
    }, [url, forceHttps, removeQueryParams, removeHash, trailingSlash, lowercase]);

    useEffect(() => {
        if (url && result && result !== 'Invalid URL') {
            addToHistory(effectiveId);
        }
    }, [url, result, addToHistory, effectiveId]);

    const updateData = (newUrl: string, newOptions: any) => {
        setToolData(effectiveId, {
            input: newUrl,
            options: { ...options, ...newOptions }
        });
    };

    const handleCopy = () => {
        if (result && result !== 'Invalid URL') {
            navigator.clipboard.writeText(result);
        }
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="Canonical URL Generator"
            description="Normalize and generate canonical URLs for SEO"
            onCopy={handleCopy}
            onClear={handleClear}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Input URL
                    </label>
                    <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                        <LinkIcon className="w-4 h-4 text-foreground-muted" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => updateData(e.target.value, {})}
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
                                onChange={(e) => updateData(url, { forceHttps: e.target.checked })}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Force HTTPS</div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={removeQueryParams}
                                onChange={(e) => updateData(url, { removeQueryParams: e.target.checked })}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Remove Query Parameters</div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={removeHash}
                                onChange={(e) => updateData(url, { removeHash: e.target.checked })}
                                className="rounded bg-transparent border-gray-500"
                            />
                            <div className="text-sm font-medium">Remove Hash Fragment</div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={lowercase}
                                onChange={(e) => updateData(url, { lowercase: e.target.checked })}
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
                                    onClick={() => updateData(url, { trailingSlash: opt })}
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
                            {result && result !== 'Invalid URL' ? `<link rel="canonical" href="${result}" />` : ''}
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
