import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

export const DynamicIsland: React.FC = React.memo(() => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Hardcoded status for now since logic isn't connected
    const status = 'idle' as 'idle' | 'processing' | 'success';

    return (
        <div className="flex justify-center pt-2 pb-6 px-4">
            <motion.div
                layout
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={cn(
                    "bg-[#0a0a0a] border border-white/5 rounded-[24px] flex items-center shadow-2xl overflow-hidden cursor-default transform-gpu pointer-events-auto backface-hidden will-change-transform",
                    isExpanded ? "w-auto h-auto px-6 py-3" : "w-[180px] h-[36px] px-4 py-2"
                )}
                transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6
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
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}
                                style={{ transform: 'translateZ(0)' }}
                                className="text-[11px] font-semibold text-white/80 tracking-tight antialiased backface-hidden"
                            >
                                DevTools Online
                            </motion.span>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.2 } }}
                                exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
                                style={{ transform: 'translateZ(0)' }}
                                className="flex items-center space-x-6 antialiased backface-hidden"
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
});

DynamicIsland.displayName = 'DynamicIsland';
