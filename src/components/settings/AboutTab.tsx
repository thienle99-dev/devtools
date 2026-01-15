import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw, Github, FileText } from 'lucide-react';
import { toast } from 'sonner';

export interface AboutTabProps {
    platform: string;
}

export const AboutTab: React.FC<AboutTabProps> = ({ platform }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">About</h2>

        <Card className="p-1">
            <div className="p-4 border-b border-border-glass">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Version</p>
                        <p className="text-xs text-foreground-muted">Current application version</p>
                    </div>
                    <div className="px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <p className="text-sm font-mono font-bold text-indigo-400">0.1.0-alpha</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                        toast.info('Checking for updates...');
                        // TODO: Implement update check
                    }}
                >
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    Check for Updates
                </Button>
            </div>
            <div className="p-4 border-b border-border-glass">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Platform</p>
                    <p className="text-sm text-foreground-muted capitalize font-mono">{platform}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Build</p>
                    <p className="text-sm text-foreground-muted font-mono">Development</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">License</p>
                    <p className="text-sm text-foreground-muted">MIT</p>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Github className="w-4 h-4 text-foreground-muted" />
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        View on GitHub
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-foreground-muted" />
                    <button
                        onClick={() => {
                            toast.info('Release notes coming soon...');
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Release Notes
                    </button>
                </div>
            </div>
        </Card>
    </div>
);
