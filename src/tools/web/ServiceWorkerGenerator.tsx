import React, { useState, useEffect } from 'react';
import { Settings, Zap, Wifi, Database } from 'lucide-react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

type Strategy = 'NetworkFirst' | 'CacheFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';

export const ServiceWorkerGenerator: React.FC<{ tabId: string }> = ({ tabId }) => {
    const { data, setToolData } = useToolState(tabId);
    
    // State
    const options = data.options || {};
    const [cacheName, setCacheName] = useState<string>(options.cacheName || 'my-app-v1');
    const [strategy, setStrategy] = useState<Strategy>(options.strategy || 'StaleWhileRevalidate');
    const [precacheFiles, setPrecacheFiles] = useState<string>(options.precacheFiles || '/\n/index.html\n/styles.css\n/script.js\n/logo.png');
    const [offlinePage, setOfflinePage] = useState<string>(options.offlinePage || '/offline.html');
    const [result, setResult] = useState<string>(data.output || '');

    // Update store
    useEffect(() => {
        setToolData(tabId, { 
            output: result,
            options: { cacheName, strategy, precacheFiles, offlinePage }
        });
    }, [cacheName, strategy, precacheFiles, offlinePage, result, tabId, setToolData]);

    const generateSW = () => {
        const files = precacheFiles.split('\n').filter(f => f.trim()).map(f => `'${f.trim()}'`).join(',\n    ');
        
        let code = `const CACHE_NAME = '${cacheName}';\n`;
        code += `const OFFLINE_URL = '${offlinePage}';\n\n`;
        
        code += `const PRECACHE_URLS = [\n    ${files}\n];\n\n`;

        code += `// Install Event\n`;
        code += `self.addEventListener('install', (event) => {\n`;
        code += `    event.waitUntil(\n`;
        code += `        caches.open(CACHE_NAME)\n`;
        code += `            .then((cache) => cache.addAll(PRECACHE_URLS))\n`;
        code += `            .then(() => self.skipWaiting())\n`;
        code += `    );\n});\n\n`;

        code += `// Activate Event\n`;
        code += `self.addEventListener('activate', (event) => {\n`;
        code += `    event.waitUntil(\n`;
        code += `        caches.keys().then((cacheNames) => {\n`;
        code += `            return Promise.all(\n`;
        code += `                cacheNames.map((cache) => {\n`;
        code += `                    if (cache !== CACHE_NAME) {\n`;
        code += `                        return caches.delete(cache);\n`;
        code += `                    }\n`;
        code += `                })\n`;
        code += `            );\n`;
        code += `        })\n`;
        code += `    );\n`;
        code += `    self.clients.claim();\n});\n\n`;

        code += `// Fetch Event - ${strategy}\n`;
        code += `self.addEventListener('fetch', (event) => {\n`;
        code += `    if (event.request.mode === 'navigate') {\n`;
        code += `        event.respondWith(async () => {\n`;
        code += `            try {\n`;
        code += `                 // Always try network first for navigation instructions\n`;
        code += `                 const networkResponse = await fetch(event.request);\n`;
        code += `                 return networkResponse;\n`;
        code += `            } catch (error) {\n`;
        code += `                 // Return offline page on failure\n`;
        code += `                 const cache = await caches.open(CACHE_NAME);\n`;
        code += `                 const cachedResponse = await cache.match(OFFLINE_URL);\n`;
        code += `                 return cachedResponse;\n`;
        code += `            }\n`;
        code += `        });\n`;
        code += `        return;\n`;
        code += `    }\n\n`;

        switch (strategy) {
            case 'CacheFirst':
                code += `    event.respondWith(\n`;
                code += `        caches.match(event.request).then((response) => {\n`;
                code += `            return response || fetch(event.request);\n`;
                code += `        })\n`;
                code += `    );\n`;
                break;
            case 'NetworkFirst':
                code += `    event.respondWith(\n`;
                code += `        fetch(event.request).catch(() => {\n`;
                code += `            return caches.match(event.request);\n`;
                code += `        })\n`;
                code += `    );\n`;
                break;
            case 'StaleWhileRevalidate':
                code += `    event.respondWith(\n`;
                code += `        caches.match(event.request).then((cachedResponse) => {\n`;
                code += `            const networkFetch = fetch(event.request).then((response) => {\n`;
                code += `                // Update cache\n`;
                code += `                if (event.request.method === 'GET') {\n`;
                code += `                    const responseClone = response.clone();\n`;
                code += `                    caches.open(CACHE_NAME).then((cache) => {\n`;
                code += `                        cache.put(event.request, responseClone);\n`;
                code += `                    });\n`;
                code += `                }\n`;
                code += `                return response;\n`;
                code += `            });\n`;
                code += `            return cachedResponse || networkFetch;\n`;
                code += `        })\n`;
                code += `    );\n`;
                break;
            case 'NetworkOnly':
                code += `    event.respondWith(fetch(event.request));\n`;
                break;
            case 'CacheOnly':
                code += `    event.respondWith(caches.match(event.request));\n`;
                break;
        }

        code += `});\n`;

        setResult(code);
    };

    useEffect(() => {
        generateSW();
    }, [cacheName, strategy, precacheFiles, offlinePage]);

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
    };

    const handleDownload = () => {
        const blob = new Blob([result], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'service-worker.js';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            toolId={tabId}
            title="Service Worker Generator"
            description="Generate a service worker file for offline capabilities"
            onCopy={handleCopy}
            onDownload={handleDownload}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configuration
                        </h3>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Cache Name
                            </label>
                            <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                                <Database className="w-4 h-4 text-foreground-muted" />
                                <input
                                    type="text"
                                    value={cacheName}
                                    onChange={(e) => setCacheName(e.target.value)}
                                    className="w-full bg-transparent text-sm focus:outline-none"
                                    placeholder="v1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Caching Strategy
                            </label>
                            <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                                <Zap className="w-4 h-4 text-foreground-muted" />
                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value as Strategy)}
                                    className="w-full bg-transparent text-sm focus:outline-none [&>option]:bg-gray-900"
                                >
                                    <option value="StaleWhileRevalidate">Stale While Revalidate (Recommended)</option>
                                    <option value="NetworkFirst">Network First (Offline fallback)</option>
                                    <option value="CacheFirst">Cache First (Performance)</option>
                                    <option value="NetworkOnly">Network Only</option>
                                    <option value="CacheOnly">Cache Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Offline Page URL
                            </label>
                             <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                                <Wifi className="w-4 h-4 text-foreground-muted" />
                                <input
                                    type="text"
                                    value={offlinePage}
                                    onChange={(e) => setOfflinePage(e.target.value)}
                                    className="w-full bg-transparent text-sm focus:outline-none"
                                    placeholder="/offline.html"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Precache Files */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Precache Files
                        </h3>
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                    Files to Cache (One per line)
                                </label>
                                <button
                                    onClick={() => setPrecacheFiles('/\n/index.html\n/styles.css\n/script.js\n/logo.png')}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Load Default
                                </button>
                            </div>
                            <textarea
                                value={precacheFiles}
                                onChange={(e) => setPrecacheFiles(e.target.value)}
                                className="w-full h-[220px] px-4 py-3 bg-[var(--color-glass-input)] border border-border-glass rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                                placeholder="/index.html"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Generated service-worker.js
                    </label>
                    <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-xl overflow-hidden">
                        <pre className="w-full h-80 p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto custom-scrollbar language-javascript">
                            {result}
                        </pre>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
