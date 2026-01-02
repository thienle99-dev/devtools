import React from 'react';

export const ToolPlaceholder: React.FC<{ name: string }> = ({ name }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Input</label>
                    <div className="h-64 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm text-white/80 focus-within:border-white/20 transition-all">
                        <textarea
                            className="w-full h-full bg-transparent border-none outline-none resize-none"
                            placeholder="Paste your content here..."
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Output</label>
                    <div className="h-64 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-sm text-emerald-400 focus-within:border-emerald-500/20 transition-all">
                        <pre className="w-full h-full overflow-auto custom-scrollbar">
                            {`// Output for ${name} will appear here`}
                        </pre>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {['Format', 'Minify', 'Validate', 'Reset'].map((action) => (
                    <button
                        key={action}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    >
                        {action}
                    </button>
                ))}
            </div>
        </div>
    );
};
