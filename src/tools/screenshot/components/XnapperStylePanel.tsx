import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/Tabs';
import type { CanvasPreviewHandle } from '../types';
import { HeaderControls } from './style-panel/HeaderControls';
import { AnnotateTabContent } from './style-panel/AnnotateTabContent';
import { DesignTabContent } from './style-panel/DesignTabContent';
import { ExportTabContent } from './style-panel/ExportTabContent';

interface XnapperStylePanelProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
    historyState?: {
        canUndo: boolean;
        canRedo: boolean;
        count: number;
    };
    zoom?: number;
}

export const XnapperStylePanel: React.FC<XnapperStylePanelProps> = ({
    canvasRef,
    historyState = { canUndo: false, canRedo: false, count: 0 },
    zoom = 1,
}) => {
    const [activeTab, setActiveTab] = useState<'annotate' | 'design' | 'export'>('annotate');

    return (
        <div className="w-[400px] bg-glass-panel border-l border-border-glass h-full flex flex-col overflow-hidden shadow-2xl">
            <HeaderControls canvasRef={canvasRef} zoom={zoom} />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex-1 flex flex-col h-full min-h-0">
                <div className="px-5 pb-3 pt-3">
                    <TabsList className="w-full grid grid-cols-3 p-1 bg-background/50 rounded-xl border border-border-glass">
                        <TabsTrigger value="annotate" className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30">
                            Annotate
                        </TabsTrigger>
                        <TabsTrigger value="design" className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30">
                            Design
                        </TabsTrigger>
                        <TabsTrigger value="export" className="rounded-lg font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30">
                            Export
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="annotate" className="flex-1 outline-none">
                    <AnnotateTabContent canvasRef={canvasRef} historyState={historyState} />
                </TabsContent>

                <TabsContent value="design" className="flex-1 outline-none">
                    <DesignTabContent />
                </TabsContent>

                <TabsContent value="export" className="flex-1 outline-none">
                    <ExportTabContent canvasRef={canvasRef} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
