import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { WrapText, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface GeneralTabProps {
    fontSize: number;
    setFontSize: (size: number) => void;
    wordWrap: boolean;
    setWordWrap: (wrap: boolean) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ fontSize, setFontSize, wordWrap, setWordWrap }) => {
    const { resetTour, startTour } = useOnboardingStore();

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">General Settings</h2>

            <Card className="p-1">
                <div className="flex items-center justify-between p-4 border-b border-border-glass">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Font Size</p>
                        <p className="text-xs text-foreground-muted">Adjust the editor text size</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Input
                            type="number"
                            min="10"
                            max="24"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                            className="w-24 font-mono text-center"
                        />
                        <span className="text-xs font-mono text-foreground-muted">px</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <WrapText className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Word Wrap</p>
                            <p className="text-xs text-foreground-muted">Wrap long lines in the editor panes</p>
                        </div>
                    </div>
                    <Switch
                        checked={wordWrap}
                        onChange={(e) => setWordWrap(e.target.checked)}
                    />
                </div>
            </Card>

            <h2 className="text-lg font-bold text-foreground pt-4">Guidance & Onboarding</h2>
            <Card className="p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Welcome Tour</p>
                        <p className="text-xs text-foreground-muted">Restart the onboarding experience to learn about key features and shortcuts.</p>
                        <div className="pt-4 flex gap-3">
                            <Button
                                onClick={() => {
                                    startTour();
                                    toast.success('Restarting welcome tour...');
                                }}
                                className="h-9 px-4 text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                Restart Tour
                            </Button>
                            <Button
                                onClick={() => {
                                    resetTour();
                                    toast.success('Onboarding status reset');
                                }}
                                variant="ghost"
                                className="h-9 px-4 text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-white/5"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Reset Status
                            </Button>
                        </div>
                    </div>
                    <div className="w-24 h-24 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-10 h-10 text-indigo-500/40" />
                    </div>
                </div>
            </Card>
        </div>
    );
};
