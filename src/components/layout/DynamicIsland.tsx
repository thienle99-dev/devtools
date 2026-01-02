import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

export const DynamicIsland: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    return (
        <div className="flex justify-center pt-2 pb-6 px-4">
            <motion.div
                layout
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={cn(
                    "bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[24px] flex items-center shadow-2xl overflow-hidden cursor-default",
                    isExpanded ? "px-6 py-3" : "px-4 py-2"
                )}
                animate={{
                    width: isExpanded ? 'auto' : '180px',
                    height: isExpanded ? 'auto' : '36px',
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                }}
            >
                <div className="flex items-center space-x-3 w-full justify-center whitespace-nowrap">
                    <motion.div
                        animate={status === 'processing' ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Activity className="w-4 h-4 text-emerald-400" />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!isExpanded ? (
                            <motion.span
                                key="collapsed"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-[11px] font-semibold text-white/80 tracking-tight"
                            >
                                Antigravity Online
                            </motion.span>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center space-x-6"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Status</span>
                                    <span className="text-xs font-semibold text-emerald-400">Operational</span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Latency</span>
                                    <span className="text-xs font-semibold text-white">12ms</span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/10" />
                                <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs font-bold text-white">Pro</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
