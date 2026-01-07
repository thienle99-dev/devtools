import React, { useState } from 'react';
import { VideoToFrames } from './components/VideoToFrames';
import { FramesToVideo } from './components/FramesToVideo';
import { GifCreator } from './components/GifCreator';
import { ScreenRecorder } from './components/ScreenRecorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Video, Image as ImagesIcon, Film, Aperture, MonitorDot } from 'lucide-react';

export const VideoFrames: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'extract' | 'create' | 'gif' | 'record'>('extract');

    return (
        <div className="h-full flex flex-col bg-background/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-glass bg-glass-background/30 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                        <Film className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Video Frame Studio
                        </h1>
                        <p className="text-xs text-foreground-secondary">
                            Professional tools for video frame extraction and sequence creation
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
                <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'extract' | 'create' | 'gif' | 'record')} className="h-full flex flex-col gap-4">
                    <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
                        <TabsTrigger value="extract" className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            To Frames
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2">
                            <ImagesIcon className="w-4 h-4" />
                            To Video
                        </TabsTrigger>
                        <TabsTrigger value="gif" className="flex items-center gap-2">
                            <Aperture className="w-4 h-4" />
                            GIF Maker
                        </TabsTrigger>
                        <TabsTrigger value="record" className="flex items-center gap-2">
                            <MonitorDot className="w-4 h-4" />
                            Recorder
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden relative">
                        <TabsContent value="extract" className="h-full m-0 absolute inset-0">
                            <VideoToFrames />
                        </TabsContent>
                        <TabsContent value="create" className="h-full m-0 absolute inset-0">
                            <FramesToVideo />
                        </TabsContent>
                        <TabsContent value="gif" className="h-full m-0 absolute inset-0">
                            <GifCreator />
                        </TabsContent>
                        <TabsContent value="record" className="h-full m-0 absolute inset-0">
                            <ScreenRecorder />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default VideoFrames;
