import React from 'react';
import type { ReactNode } from 'react';
import { Share2, Trash2, Copy, Download } from 'lucide-react';

interface ToolPaneProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}

export const ToolPane: React.FC<ToolPaneProps> = ({ title, description, children, actions }) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 m-2 shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-white/40 mt-0.5">{description}</p>}
                </div>

                <div className="flex items-center space-x-2">
                    {actions}
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Copy">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Download">
                            <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Clear">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="ml-2 bg-indigo-500 hover:bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
