import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';

export interface WindowTabProps {
    windowOpacity: number;
    setWindowOpacity: (opacity: number) => void;
    alwaysOnTop: boolean;
    setAlwaysOnTop: (enabled: boolean) => void;
    rememberWindowPosition: boolean;
    setRememberWindowPosition: (enabled: boolean) => void;
    animationSpeed: 'fast' | 'normal' | 'slow';
    setAnimationSpeed: (speed: 'fast' | 'normal' | 'slow') => void;
    reduceMotion: boolean;
    setReduceMotion: (enabled: boolean) => void;
}

export const WindowTab: React.FC<WindowTabProps> = ({ windowOpacity, setWindowOpacity, alwaysOnTop, setAlwaysOnTop, rememberWindowPosition, setRememberWindowPosition, animationSpeed, setAnimationSpeed, reduceMotion, setReduceMotion }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Window & Behavior</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Window Opacity</p>
                    <p className="text-xs text-foreground-muted">Adjust window transparency (0.5 - 1.0)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="0.5"
                        max="1.0"
                        step="0.1"
                        value={windowOpacity}
                        onChange={(e) => setWindowOpacity(parseFloat(e.target.value) || 1.0)}
                        className="w-24 font-mono text-center"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Always on Top</p>
                    <p className="text-xs text-foreground-muted">Keep window above other applications</p>
                </div>
                <Switch
                    checked={alwaysOnTop}
                    onChange={(e) => setAlwaysOnTop(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Remember Window Position</p>
                    <p className="text-xs text-foreground-muted">Restore window position on startup</p>
                </div>
                <Switch
                    checked={rememberWindowPosition}
                    onChange={(e) => setRememberWindowPosition(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Animation Speed</p>
                    <p className="text-xs text-foreground-muted">Control UI animation speed</p>
                </div>
                <div className="flex bg-[var(--color-glass-input)] p-1 rounded-xl border border-border-glass">
                    {(['fast', 'normal', 'slow'] as const).map((speed) => (
                        <button
                            key={speed}
                            onClick={() => setAnimationSpeed(speed)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${animationSpeed === speed
                                ? 'bg-bg-glass-hover text-foreground shadow-lg shadow-black/5'
                                : 'text-foreground-muted hover:text-foreground hover:bg-[var(--color-glass-button-hover)]'
                                }`}
                        >
                            {speed}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Reduce Motion</p>
                    <p className="text-xs text-foreground-muted">Disable animations for accessibility</p>
                </div>
                <Switch
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                />
            </div>
        </Card>
    </div>
);
