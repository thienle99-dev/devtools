import React from 'react';
import { ExportPanel } from '../ExportPanel';
import type { CanvasPreviewHandle } from '../../types';

interface ExportTabContentProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
}

export const ExportTabContent: React.FC<ExportTabContentProps> = ({ canvasRef }) => {
    return (
        <div className="flex-1 overflow-y-auto">
            <ExportPanel canvasRef={canvasRef} />
        </div>
    );
};
