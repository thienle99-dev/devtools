import React, { useState, useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
// import zxcvbn from 'zxcvbn'; // Lazy loaded

const TOOL_ID = 'password-policy';

export const PasswordPolicyTester: React.FC = () => {
    const { clearToolData } = useToolState(TOOL_ID);
    const [password, setPassword] = useState('');
    const [zxcvbn, setZxcvbn] = useState<any>(null);

    useEffect(() => {
        import('zxcvbn').then(m => setZxcvbn((m as any).default || m));
    }, []);

    const [policy, setPolicy] = useState({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
    });

    const results = (() => {
        if (!password) return null;
        let analysis = { score: 0, feedback: { warning: '', suggestions: [] } };
        
        if (zxcvbn) {
             analysis = zxcvbn(password);
        }

        return {
            length: password.length >= policy.minLength,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password),
            score: analysis.score,
            warning: analysis.feedback.warning,
            suggestions: analysis.feedback.suggestions
        };
    })();

    const handleClear = () => {
        setPassword('');
        clearToolData(TOOL_ID);
    };

    return (
        <ToolPane
            title="Password Policy Tester"
            description="Verify passwords against security policies and complexity rules"
            onClear={handleClear}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Password to Test</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input w-full text-lg font-mono tracking-widest"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <div className="glass-panel p-4 space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted border-b border-white/5 pb-2">Policy Configuration</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span>Min Length</span>
                                    <input 
                                        type="number" 
                                        value={policy.minLength} 
                                        onChange={e => setPolicy({...policy, minLength: parseInt(e.target.value)})}
                                        className="w-12 bg-black/20 border border-white/5 rounded px-1 text-center"
                                    />
                                </div>
                                {[
                                    { id: 'requireUppercase', label: 'Require Uppercase' },
                                    { id: 'requireLowercase', label: 'Require Lowercase' },
                                    { id: 'requireNumbers', label: 'Require Numbers' },
                                    { id: 'requireSymbols', label: 'Require Symbols' },
                                ].map(item => (
                                    <label key={item.id} className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-xs group-hover:text-foreground transition-colors">{item.label}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={(policy as any)[item.id]} 
                                            onChange={e => setPolicy({...policy, [item.id]: e.target.checked})}
                                            className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {results ? (
                            <div className="glass-panel p-4 h-full space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted border-b border-white/5 pb-2">Test Results</h3>
                                
                                <div className="space-y-2">
                                    <ResultItem label={`Length (min ${policy.minLength})`} pass={results.length} />
                                    {policy.requireUppercase && <ResultItem label="Has Uppercase" pass={results.upper} />}
                                    {policy.requireLowercase && <ResultItem label="Has Lowercase" pass={results.lower} />}
                                    {policy.requireNumbers && <ResultItem label="Has Number" pass={results.number} />}
                                    {policy.requireSymbols && <ResultItem label="Has Symbol" pass={results.symbol} />}
                                </div>

                                <div className="pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase font-bold text-foreground-muted">Overall Security</span>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            results.score >= 3 ? "text-emerald-400" : results.score >= 2 ? "text-amber-400" : "text-rose-400"
                                        )}>
                                            {results.score === 4 ? 'Excellent' : results.score === 3 ? 'Good' : results.score === 2 ? 'Fair' : 'Weak'}
                                        </span>
                                    </div>
                                    <div className="flex space-x-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                                        {[0, 1, 2, 3].map(i => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "flex-1 transition-all",
                                                    i < results.score ? (results.score >= 3 ? "bg-emerald-500" : results.score >= 2 ? "bg-amber-500" : "bg-rose-500") : "bg-transparent"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                </div>

                                {results.warning && (
                                    <div className="flex gap-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] animate-pulse">
                                        <ShieldAlert size={14} className="shrink-0" />
                                        <span>{results.warning}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-foreground-muted/40 p-10 text-center">
                                <Shield className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm">Enter a password to begin compliance check</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};

const ResultItem = ({ label, pass }: { label: string, pass: boolean }) => (
    <div className="flex items-center justify-between group">
        <span className="text-xs text-foreground-secondary group-hover:text-foreground transition-colors">{label}</span>
        {pass ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
            <XCircle className="w-4 h-4 text-rose-500" />
        )}
    </div>
);

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
