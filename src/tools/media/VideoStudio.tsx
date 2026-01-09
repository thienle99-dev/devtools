import React, { useState } from 'react';
import { VideoToFrames } from './components/VideoToFrames';
import { FramesToVideo } from './components/FramesToVideo';
import { GifCreator } from './components/GifCreator';
import { ScreenRecorder } from './components/ScreenRecorder';
import { VideoMerger } from './VideoMerger';
import { AudioManager } from './components/AudioManager';
import { cn } from '@utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Video, 
    Image as ImagesIcon, 
    Aperture, 
    MonitorDot, 
    Combine,
    Sparkles,
    Settings,
    Layers,
    Scissors,
    Download,
    Music
} from 'lucide-react';

type TabType = 'extract' | 'create' | 'merge' | 'gif' | 'record' | 'audio';

export const VideoStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('merge');

    const MENU_ITEMS = [
        { id: 'merge', icon: Combine, label: 'Merger', description: 'Combine multiple videos' },
        { id: 'audio', icon: Music, label: 'Audio', description: 'Add and mix music' },
        { id: 'extract', icon: Video, label: 'To Frames', description: 'Extract video frames' },
        { id: 'create', icon: ImagesIcon, label: 'To Video', description: 'Create video from images' },
        { id: 'gif', icon: Aperture, label: 'GIF Maker', description: 'Create animated GIFs' },
        { id: 'record', icon: MonitorDot, label: 'Recorder', description: 'Capture screen activity' },
    ];

    return (
        <div className="h-full flex bg-background text-foreground overflow-hidden font-sans">
            {/* Left Sidebar - Slim Icon Bar */}
            <div className="w-[72px] flex flex-col items-center py-4 bg-glass-background/50 border-r border-border-glass z-30 backdrop-blur-xl">
                <div className="mb-8 p-2 rounded-2xl bg-indigo-600/20 text-indigo-500">
                    <Sparkles className="w-6 h-6" />
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            title={item.label}
                            className={cn(
                                "group relative p-3 rounded-2xl transition-all duration-300",
                                activeTab === item.id 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                                    : "text-foreground-secondary hover:text-foreground hover:bg-foreground/[0.05]"
                            )}
                        >
                            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {activeTab === item.id && (
                                <motion.div 
                                    layoutId="activeIndicator"
                                    className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-auto space-y-4">
                    <button className="p-3 text-foreground-secondary hover:text-foreground transition-colors">
                        <Settings size={24} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-border-glass shadow-lg" />
                </div>
            </div>

            {/* Main Workbench Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header - Workspace Title */}
                <div className="h-16 flex items-center justify-between px-6 bg-glass-background/40 backdrop-blur-md border-b border-border-glass">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground-secondary">
                            Video Studio <span className="text-foreground">Pro</span>
                        </h2>
                        <div className="h-4 w-[1px] bg-border-glass" />
                        <div className="flex items-center gap-2 text-xs font-bold bg-foreground/[0.05] px-3 py-1.5 rounded-full text-indigo-400 border border-indigo-500/20">
                            {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.1] text-xs font-bold transition-all border border-border-glass">
                            <Layers size={14} />
                            <span>Workflow</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-black shadow-lg shadow-indigo-600/20 transition-all">
                            <Download size={14} />
                            <span>Export Project</span>
                        </button>
                    </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 flex overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 p-6 overflow-hidden flex flex-col"
                        >
                            <div className="flex-1 bg-glass-background border border-border-glass rounded-3xl shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                                    {activeTab === 'merge' && <VideoMerger />}
                        {activeTab === 'extract' && <VideoToFrames />}
                        {activeTab === 'create' && <FramesToVideo />}
                        {activeTab === 'gif' && <GifCreator />}
                        {activeTab === 'record' && <ScreenRecorder />}
                        {activeTab === 'audio' && <AudioManager />}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* CapCut-style Bottom Context Bar (Optional but looks cool) */}
                <div className="h-8 bg-indigo-600 flex items-center px-6 justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 uppercase tracking-widest">
                            <Scissors size={10} />
                            Editting Context: {MENU_ITEMS.find(m => m.id === activeTab)?.label}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-80 uppercase tracking-widest">
                        <span>CPU: 12%</span>
                        <span>GPU: 4%</span>
                        <span>RAM: 2.4 GB</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoStudio;
