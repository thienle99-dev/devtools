import React, { useState } from 'react';
import { Shield, Scan, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useXnapperStore } from '../store/xnapperStore';
import { analyzeSensitiveInfo } from '../utils/ocrDetection';
import type { RedactionType } from '../utils/redaction';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

export const RedactionPanel: React.FC = () => {
    const {
        currentScreenshot,
        redactionAreas,
        addRedactionArea,
        removeRedactionArea,
        clearRedactionAreas,
        isAnalyzing,
        setIsAnalyzing,
    } = useXnapperStore();

    const [selectedType, setSelectedType] = useState<RedactionType>('blur');
    const [sensitiveInfo, setSensitiveInfo] = useState<any[]>([]);
    const [showSensitive, setShowSensitive] = useState(true);

    const handleAnalyze = async () => {
        if (!currentScreenshot) return;

        setIsAnalyzing(true);
        toast.info('Analyzing screenshot for sensitive information...');

        try {
            const result = await analyzeSensitiveInfo(currentScreenshot.dataUrl);
            setSensitiveInfo(result.sensitivePositions);

            if (result.sensitivePositions.length > 0) {
                toast.success(`Found ${result.sensitivePositions.length} sensitive items`);
            } else {
                toast.info('No sensitive information detected');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze screenshot');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAutoRedact = () => {
        if (sensitiveInfo.length === 0) {
            toast.warning('No sensitive information to redact');
            return;
        }

        sensitiveInfo.forEach((info) => {
            addRedactionArea({
                id: `auto-${Date.now()}-${Math.random()}`,
                x: info.bbox.x0,
                y: info.bbox.y0,
                width: info.bbox.x1 - info.bbox.x0,
                height: info.bbox.y1 - info.bbox.y0,
                type: selectedType,
            });
        });

        toast.success(`Added ${sensitiveInfo.length} redaction areas`);
        setSensitiveInfo([]);
    };

    const redactionTypes: Array<{ type: RedactionType; icon: any; label: string; description: string }> = [
        {
            type: 'blur',
            icon: Eye,
            label: 'Blur',
            description: 'Smooth blur effect',
        },
        {
            type: 'pixelate',
            icon: Sparkles,
            label: 'Pixelate',
            description: 'Mosaic effect',
        },
        {
            type: 'solid',
            icon: EyeOff,
            label: 'Solid',
            description: 'Complete hiding',
        },
    ];

    if (!currentScreenshot) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-foreground-muted">
                <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Capture a screenshot to add redactions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* OCR Analysis */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Scan className="w-5 h-5" />
                    Auto-Detect Sensitive Info
                </h3>
                <Button
                    variant="primary"
                    size="md"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Scan for Sensitive Data'}
                </Button>

                {sensitiveInfo.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Found {sensitiveInfo.length} items
                            </span>
                            <button
                                onClick={() => setShowSensitive(!showSensitive)}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                {showSensitive ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showSensitive && (
                            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                {sensitiveInfo.map((info, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs p-2 bg-glass-panel rounded border border-border-glass"
                                    >
                                        <div className="font-medium text-amber-400">{info.label}</div>
                                        <div className="text-foreground-muted truncate">{info.text}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAutoRedact}
                            className="w-full mt-2"
                        >
                            Auto-Redact All
                        </Button>
                    </div>
                )}
            </div>

            {/* Redaction Type Selection */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Redaction Type</h3>
                <div className="grid grid-cols-3 gap-2">
                    {redactionTypes.map(({ type, icon: Icon, label, description }) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                selectedType === type
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5",
                                selectedType === type ? "text-indigo-400" : "text-foreground-muted"
                            )} />
                            <div className="text-center">
                                <div className={cn(
                                    "font-medium text-xs",
                                    selectedType === type ? "text-foreground" : "text-foreground-secondary"
                                )}>
                                    {label}
                                </div>
                                <div className="text-[10px] text-foreground-muted mt-0.5">
                                    {description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Manual Redaction Instructions */}
            <div className="p-4 bg-glass-panel rounded-lg border border-border-glass">
                <h4 className="text-sm font-medium mb-2">Manual Redaction</h4>
                <p className="text-xs text-foreground-muted">
                    Click and drag on the preview to manually select areas to redact.
                    The selected redaction type will be applied.
                </p>
            </div>

            {/* Active Redactions */}
            {redactionAreas.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">
                            Active Redactions ({redactionAreas.length})
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRedactionAreas}
                            className="text-rose-400 hover:text-rose-300"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear All
                        </Button>
                    </div>

                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                        {redactionAreas.map((area, idx) => (
                            <div
                                key={area.id}
                                className="flex items-center justify-between p-2 bg-glass-panel rounded border border-border-glass"
                            >
                                <div className="flex-1">
                                    <div className="text-xs font-medium capitalize">
                                        {area.type} #{idx + 1}
                                    </div>
                                    <div className="text-[10px] text-foreground-muted">
                                        {Math.round(area.width)} × {Math.round(area.height)}px
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeRedactionArea(area.id)}
                                    className="p-1 hover:bg-rose-500/20 rounded transition-colors"
                                >
                                    <Trash2 className="w-3 h-3 text-rose-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
