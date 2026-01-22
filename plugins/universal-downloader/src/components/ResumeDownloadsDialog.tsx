import React, { useEffect } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Download, X, Clock, AlertCircle } from 'lucide-react';

interface ResumeDownloadsDialogProps {
    pendingCount: number;
    onResume: () => void;
    onClear: () => void;
    onClose: () => void;
}

export const ResumeDownloadsDialog: React.FC<ResumeDownloadsDialogProps> = ({
    pendingCount,
    onResume,
    onClear,
    onClose
}) => {
    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md mx-4 p-6 bg-background border-border-glass shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground-primary">
                                Resume Downloads?
                            </h3>
                            <p className="text-xs text-foreground-muted mt-0.5">
                                Previous session interrupted
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-foreground-muted hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-foreground-secondary leading-relaxed">
                                You have <strong className="text-foreground-primary">{pendingCount}</strong> pending download{pendingCount > 1 ? 's' : ''} from your previous session.
                            </p>
                            <p className="text-xs text-foreground-muted mt-2">
                                Would you like to resume {pendingCount > 1 ? 'them' : 'it'} now?
                            </p>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>Resume: Continue all pending downloads</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>Clear: Remove all pending downloads</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClear}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Clear Queue
                    </Button>
                    <Button
                        onClick={onResume}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Resume ({pendingCount})
                    </Button>
                </div>

                {/* Footer hint */}
                <p className="text-[10px] text-foreground-tertiary text-center mt-4">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Esc</kbd> to decide later
                </p>
            </Card>
        </div>
    );
};
