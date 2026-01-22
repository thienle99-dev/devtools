import React, { useEffect, useMemo } from 'react';
import { Cookie, Settings, Calendar, Globe,  Shield,  Lock } from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

import type { BaseToolProps } from '@tools/registry/types';
import { TOOL_IDS } from '@tools/registry/tool-ids';

type SameSite = 'Lax' | 'Strict' | 'None';
type Priority = 'Low' | 'Medium' | 'High';

const TOOL_ID = TOOL_IDS.SET_COOKIE_GENERATOR;

export const SetCookieGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        options: {
            name: 'session_id',
            value: '123456',
            domain: 'example.com',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'Lax' as SameSite,
            priority: 'Medium' as Priority,
            useMaxAge: false,
            maxAge: 3600
        }
    };

    const { options } = data;
    const { name, value, domain, path, secure, httpOnly, sameSite, priority, maxAge, useMaxAge } = options;

    const result = useMemo(() => {
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

        return cookie;
    }, [name, value, domain, path, secure, httpOnly, sameSite, priority, maxAge, useMaxAge]);

    useEffect(() => {
        if (result) {
            addToHistory(effectiveId);
        }
    }, [result, addToHistory, effectiveId]);

    const updateOptions = (updates: any) => {
        setToolData(effectiveId, {
            ...data,
            options: { ...options, ...updates }
        });
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
        }
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            toolId={effectiveId}
            title="Set-Cookie Generator"
            description="Generate headers for setting HTTP cookies"
            onCopy={handleCopy}
            onClear={handleClear}
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
                                    onChange={(e) => updateOptions({ name: e.target.value })}
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
                                    onChange={(e) => updateOptions({ value: e.target.value })}
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
                                    onChange={(e) => updateOptions({ domain: e.target.value })}
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
                                onChange={(e) => updateOptions({ path: e.target.value })}
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
                                    onChange={(e) => updateOptions({ useMaxAge: e.target.checked })} 
                                    className="rounded bg-[var(--color-glass-input)] border-border-glass"
                                />
                                <div className={`flex-1 flex items-center gap-2 bg-[var(--color-glass-input)] border border-border-glass rounded-lg px-3 py-2 ${!useMaxAge ? 'opacity-50' : ''}`}>
                                    <Calendar className="w-4 h-4 text-foreground-muted" />
                                    <input
                                        type="number"
                                        value={maxAge}
                                        onChange={(e) => updateOptions({ maxAge: parseInt(e.target.value) || 0 })}
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
                                    onChange={(e) => updateOptions({ secure: e.target.checked })}
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
                                    onChange={(e) => updateOptions({ httpOnly: e.target.checked })}
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
                                {(['Lax', 'Strict', 'None'] as SameSite[]).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => updateOptions({ sameSite: opt })}
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
                                {(['Low', 'Medium', 'High'] as Priority[]).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => updateOptions({ priority: opt })}
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
