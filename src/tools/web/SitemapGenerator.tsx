import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

export const SitemapGenerator: React.FC<{ tabId: string }> = ({ tabId }) => {
    const { data, setToolData } = useToolState(tabId);
    
    // State
    const [urls, setUrls] = useState<string>(data.input || 'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact');
    const [baseUrl, setBaseUrl] = useState<string>('https://example.com');
    const [defaultFreq, setDefaultFreq] = useState<string>('monthly');
    const [defaultPriority, setDefaultPriority] = useState<string>('0.5');
    const [result, setResult] = useState<string>('');

    // Update store
    useEffect(() => {
        setToolData(data.id, { input: urls, options: { baseUrl, defaultFreq, defaultPriority } });
    }, [urls, baseUrl, defaultFreq, defaultPriority, data.id, setToolData]);

    const generateSitemap = () => {
        const urlList = urls.split('\n').filter(u => u.trim() !== '');
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        const today = new Date().toISOString().split('T')[0];

        urlList.forEach(url => {
            let cleanUrl = url.trim();
            if (!cleanUrl.startsWith('http')) {
                // If it's a path, append to base
                const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
                cleanUrl = base + path;
            }

            xml += '  <url>\n';
            xml += `    <loc>${cleanUrl}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${defaultFreq}</changefreq>\n`;
            xml += `    <priority>${defaultPriority}</priority>\n`;
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        setResult(xml);
        setToolData(tabId, { output: xml });
    };

    useEffect(() => {
        generateSitemap();
    }, [urls, baseUrl, defaultFreq, defaultPriority]);

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
    };

    const handleDownload = () => {
        const blob = new Blob([result], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            title="Sitemap Generator"
            description="Generate XML sitemaps for SEO"
            onCopy={handleCopy}
            onDownload={handleDownload}
        >
            <div className="space-y-6">
                {/* Configuration */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Base URL (optional for relative paths)
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Change Frequency
                            </label>
                            <select
                                value={defaultFreq}
                                onChange={(e) => setDefaultFreq(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg text-sm text-foreground focus:outline-none focus:border-indigo-500/50 [&>option]:bg-gray-900"
                            >
                                <option value="always">Always</option>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="never">Never</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Priority (0.0 - 1.0)
                            </label>
                             <select
                                value={defaultPriority}
                                onChange={(e) => setDefaultPriority(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg text-sm text-foreground focus:outline-none focus:border-indigo-500/50 [&>option]:bg-gray-900"
                            >
                                <option value="1.0">1.0 (Highest)</option>
                                <option value="0.9">0.9</option>
                                <option value="0.8">0.8</option>
                                <option value="0.7">0.7</option>
                                <option value="0.6">0.6</option>
                                <option value="0.5">0.5 (Default)</option>
                                <option value="0.4">0.4</option>
                                <option value="0.3">0.3</option>
                                <option value="0.2">0.2</option>
                                <option value="0.1">0.1 (Lowest)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* URLs Input */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                            URLs / Paths (One per line)
                        </label>
                        <button
                            onClick={() => setUrls('https://example.com/\n/about\n/products\n/contact')}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Load Example
                        </button>
                    </div>
                    <textarea
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
                        className="w-full h-40 px-4 py-3 bg-[var(--color-glass-input)] border border-border-glass rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                        placeholder="https://example.com/page1&#10;/page2&#10;/page3"
                        spellCheck={false}
                    />
                </div>

                {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Generated Sitemap XML
                    </label>
                    <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-xl overflow-hidden">
                        <pre className="w-full h-64 p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto custom-scrollbar language-xml">
                            {result}
                        </pre>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
