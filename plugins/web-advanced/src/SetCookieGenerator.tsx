import React, { useState, useEffect } from 'react';
import { Cookie, Settings, Calendar, Globe,  Shield,  Lock } from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

type SameSite = 'Lax' | 'Strict' | 'None';
type Priority = 'Low' | 'Medium' | 'High';

export const SetCookieGenerator: React.FC<{ tabId: string }> = ({ tabId }) => {
    const { data, setToolData } = useToolState(tabId);
    
    // State
    const options = data.options || {};
    const [name, setName] = useState<string>(options.name || 'session_id');
    const [value, setValue] = useState<string>(options.value || '123456');
    const [domain, setDomain] = useState<string>(options.domain || 'example.com');
    const [path, setPath] = useState<string>(options.path || '/');
    const [secure, setSecure] = useState<boolean>(options.secure ?? true);
    const [httpOnly, setHttpOnly] = useState<boolean>(options.httpOnly ?? true);
    const [sameSite, setSameSite] = useState<SameSite>(options.sameSite || 'Lax');
    const [priority, setPriority] = useState<Priority>(options.priority || 'Medium');
    const [useMaxAge, setUseMaxAge] = useState<boolean>(options.useMaxAge ?? false);
    const [maxAge, setMaxAge] = useState<number>(options.maxAge || 3600);
    const [result, setResult] = useState<string>('');

    // Update store
    useEffect(() => {
        setToolData(tabId, { 
            output: result,
            options: { name, value, domain, path, secure, httpOnly, sameSite, priority, maxAge, useMaxAge }
        });
    }, [name, value, domain, path, secure, httpOnly, sameSite, priority, maxAge, useMaxAge, result, tabId, setToolData]);

    const generateCookie = () => {
        let cookie = `${name}=${value}`;

        if (domain) cookie += `; Domain=${domain}`;
        if (path) cookie += `; Path=${path}`;
        
        if (useMaxAge) {
             cookie += `; Max-Age=${maxAge}`;
        }

        if (secure) cookie += `; Secure`;
        if (httpOnly) cookie += `; HttpOnly`;
        if (sameSite) cookie += `; SameSite=${sameSite}`;
        if (priority) cookie += `; Priority=${priority}`;

        setResult(cookie);
    };

    useEffect(() => {
        generateCookie();
    }, [name, value, domain, path, secure, httpOnly, sameSite, priority, maxAge, useMaxAge]);

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
    };

    return (
        <ToolPane
            toolId={tabId}
            title="Set-Cookie Generator"
            description="Generate headers for setting HTTP cookies"
            onCopy={handleCopy}
        >
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                            <Cookie className="w-4 h-4" />
                            Cookie Details
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
                                    placeholder="session_id"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                    Value
                                </label>
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
                                    placeholder="value"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Domain
                            </label>
                            <div className="flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2">
                                <Globe className="w-4 h-4 text-foreground-muted" />
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full bg-transparent text-sm focus:outline-none"
                                    placeholder="example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Path
                            </label>
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="w-full bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50"
                                placeholder="/"
                            />
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Attributes
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Max-Age (seconds)
                            </label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={useMaxAge} 
                                    onChange={(e) => setUseMaxAge(e.target.checked)} 
                                    className="rounded bg-[var(--color-glass-input)] border-border-glass"
                                />
                                <div className={`flex-1 flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2 ${!useMaxAge ? 'opacity-50' : ''}`}>
                                    <Calendar className="w-4 h-4 text-foreground-muted" />
                                    <input
                                        type="number"
                                        value={maxAge}
                                        onChange={(e) => setMaxAge(parseInt(e.target.value) || 0)}
                                        disabled={!useMaxAge}
                                        className="w-full bg-transparent text-sm focus:outline-none"
                                        placeholder="3600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={secure}
                                    onChange={(e) => setSecure(e.target.checked)}
                                    className="rounded bg-transparent border-gray-500"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                                        Secure
                                    </div>
                                    <div className="text-xs text-foreground-muted">Only send over HTTPS</div>
                                </div>
                            </label>

                             <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-input)] border border-border-glass cursor-pointer hover:bg-white/5 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={httpOnly}
                                    onChange={(e) => setHttpOnly(e.target.checked)}
                                    className="rounded bg-transparent border-gray-500"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        HttpOnly
                                    </div>
                                    <div className="text-xs text-foreground-muted">Prevent JavaScript access</div>
                                </div>
                            </label>
                        </div>

                         <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                SameSite
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Lax', 'Strict', 'None'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setSameSite(opt as SameSite)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                            sameSite === opt
                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                                : 'bg-[var(--color-glass-input)] border-border-glass text-foreground-muted hover:border-gray-600'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                Priority
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Low', 'Medium', 'High'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setPriority(opt as Priority)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                            priority === opt
                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                                : 'bg-[var(--color-glass-input)] border-border-glass text-foreground-muted hover:border-gray-600'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Set-Cookie Header Value
                    </label>
                    <div className="bg-[var(--color-glass-input)] border border-border-glass rounded-xl overflow-hidden p-4">
                        <code className="text-sm font-mono text-foreground break-all">
                            {result}
                        </code>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
