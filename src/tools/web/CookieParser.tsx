import React, { useState, useEffect } from 'react';
import { Cookie, Search } from 'lucide-react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

interface ParsedCookie {
    key: string;
    value: string;
    flags: string[];
}

export const CookieParser: React.FC<{ tabId: string }> = ({ tabId }) => {
    const { data, setToolData } = useToolState(tabId);
    
    const [input, setInput] = useState<string>(data.input || 'session_id=123456; user=john_doe; Path=/; Secure; HttpOnly');
    const [cookies, setCookies] = useState<ParsedCookie[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setToolData(tabId, { input });
        parseCookies(input);
    }, [input, tabId, setToolData]);

    const parseCookies = (str: string) => {
        if (!str) {
            setCookies([]);
            return;
        }

        const items = str.split(';').map(s => s.trim()).filter(Boolean);
        const parsed: ParsedCookie[] = [];
        
        items.forEach(item => {
            const parts = item.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                parsed.push({ key, value, flags: [] });
            } else {
                // It might be a flag like 'Secure' or 'HttpOnly' belonging to the previous cookie?
                // Standard cookie string is key=value; key=value.
                // Flags usually appear in Set-Cookie headers, but in 'Cookie' header (request), there are no flags, just k=v.
                // If the input is a Set-Cookie header value, it looks like: theme=dark; Path=/; Secure
                // In that case, the first pair is the cookie, others are attributes.
                
                // Let's assume input can be multiple cookies (Cookie header) OR a single Set-Cookie string.
                // If it's a Set-Cookie string, we treat flags as separate items for now or try to attach them.
                
                // Simple parser: show everything as key-value or key-only (flag)
                parsed.push({ key: item, value: '', flags: ['Flag'] });
            }
        });

        setCookies(parsed);
    };

    const filteredCookies = cookies.filter(c => 
        c.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClear = () => {
        setInput('');
    };

    return (
        <ToolPane
            title="Cookie Parser"
            description="Parse and inspect HTTP cookie strings"
            onClear={handleClear}
            helpContent={
                <>
                    <div>
                        <h4 className="font-bold text-foreground mb-2">About Cookies</h4>
                        <p>HTTP cookies are small blocks of data created by a web server while a user is browsing a website and placed on the user's computer or other device.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-2">Request Header</h4>
                        <p className="mb-2">In requests, multiple cookies are sent in a single <code>Cookie</code> header:</p>
                        <pre className="p-2 bg-black/30 rounded text-xs">name1=value1; name2=value2</pre>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-2">Response Header</h4>
                        <p className="mb-2">In responses, each cookie is sent in its own <code>Set-Cookie</code> header with attributes:</p>
                        <pre className="p-2 bg-black/30 rounded text-xs text-wrap">id=abc; Path=/; Secure; HttpOnly</pre>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-2">Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Check for <code>Secure</code> and <code>HttpOnly</code> flags for security.</li>
                            <li>Use the search box to find specific keys.</li>
                            <li>Clear the input to reset the view.</li>
                        </ul>
                    </div>
                </>
            }
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="space-y-2 shrink-0">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Cookie String
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-32 px-4 py-3 bg-[var(--color-glass-input)] border border-border-glass rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                        placeholder="Paste cookie string here..."
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    <div className="flex items-center justify-between shrink-0">
                        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-2">
                            Parsed Cookies <span className="text-indigo-400">({cookies.length})</span>
                        </label>
                        
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter cookies..."
                                className="w-full pl-8 pr-3 py-1.5 bg-[var(--color-glass-input)] border border-border-glass rounded-lg text-xs focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar bg-[var(--color-glass-input)] border border-border-glass rounded-xl">
                        {filteredCookies.length > 0 ? (
                            <div className="divide-y divide-border-glass">
                                {filteredCookies.map((cookie, idx) => (
                                    <div key={idx} className="p-3 hover:bg-white/5 transition-colors flex items-start gap-4 group">
                                        <div className="mt-1">
                                            <Cookie className="w-4 h-4 text-amber-500 opacity-70 group-hover:opacity-100" />
                                        </div>
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2">
                                            <div className="md:col-span-4 font-mono text-sm text-foreground font-medium truncate" title={cookie.key}>
                                                {cookie.key}
                                            </div>
                                            <div className="md:col-span-8 font-mono text-sm text-foreground-secondary break-all">
                                                {cookie.value}
                                                {cookie.flags.map(f => (
                                                    <span key={f} className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-foreground-muted p-8">
                                <Cookie className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm">No cookies found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
