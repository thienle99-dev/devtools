import React from 'react';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Download, Upload, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export interface DataTabProps {
    autoBackup: boolean;
    setAutoBackup: (enabled: boolean) => void;
    backupRetentionDays: number;
    setBackupRetentionDays: (days: number) => void;
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
    resetToDefaults: () => void;
    clearHistory: () => void;
}

export const DataTab: React.FC<DataTabProps> = ({ autoBackup, setAutoBackup, backupRetentionDays, setBackupRetentionDays, exportSettings, importSettings, resetToDefaults, clearHistory }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Data Management</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Auto Backup</p>
                    <p className="text-xs text-foreground-muted">Automatically backup settings</p>
                </div>
                <Switch
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Backup Retention</p>
                    <p className="text-xs text-foreground-muted">Days to keep backups</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="1"
                        max="365"
                        value={backupRetentionDays}
                        onChange={(e) => setBackupRetentionDays(parseInt(e.target.value) || 30)}
                        className="w-24 font-mono text-center"
                    />
                    <span className="text-xs font-mono text-foreground-muted">days</span>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Download className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Export Settings</p>
                        <p className="text-xs text-foreground-muted">Download settings as JSON file</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const json = exportSettings();
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Settings exported successfully');
                    }}
                >
                    <Download className="w-3 h-3 mr-1.5" />
                    Export
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Upload className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Import Settings</p>
                        <p className="text-xs text-foreground-muted">Load settings from JSON file</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const json = event.target?.result as string;
                                    if (importSettings(json)) {
                                        toast.success('Settings imported successfully');
                                    } else {
                                        toast.error('Failed to import settings. Invalid file format.');
                                    }
                                };
                                reader.readAsText(file);
                            }
                        };
                        input.click();
                    }}
                >
                    <Upload className="w-3 h-3 mr-1.5" />
                    Import
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass bg-rose-500/5">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-rose-400">Clear All History</p>
                        <p className="text-[11px] text-rose-400/60">Remove all tool usage history and stored inputs</p>
                    </div>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                            clearHistory();
                            toast.success('History cleared');
                        }
                    }}
                >
                    Clear Now
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 overflow-hidden border-rose-500/10">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-rose-400">Reset to Defaults</p>
                        <p className="text-[11px] text-rose-400/60">Restore all settings to default values</p>
                    </div>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                            resetToDefaults();
                            toast.success('Settings reset to defaults');
                        }
                    }}
                >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Reset
                </Button>
            </div>
        </Card>
    </div>
);
