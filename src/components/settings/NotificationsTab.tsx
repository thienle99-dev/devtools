import React from 'react';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';

export interface NotificationsTabProps {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    notificationSound: boolean;
    setNotificationSound: (enabled: boolean) => void;
    toastDuration: number;
    setToastDuration: (duration: number) => void;
    notifyOnScanComplete: boolean;
    setNotifyOnScanComplete: (enabled: boolean) => void;
    notifyOnCleanupComplete: boolean;
    setNotifyOnCleanupComplete: (enabled: boolean) => void;
    notifyOnErrors: boolean;
    setNotifyOnErrors: (enabled: boolean) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ notificationsEnabled, setNotificationsEnabled, notificationSound, setNotificationSound, toastDuration, setToastDuration, notifyOnScanComplete, setNotifyOnScanComplete, notifyOnCleanupComplete, setNotifyOnCleanupComplete, notifyOnErrors, setNotifyOnErrors }) => (
    <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Notifications & Alerts</h2>

        <Card className="p-1">
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Enable Notifications</p>
                    <p className="text-xs text-foreground-muted">Show system notifications and toasts</p>
                </div>
                <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notification Sound</p>
                    <p className="text-xs text-foreground-muted">Play sound when notifications appear</p>
                </div>
                <Switch
                    checked={notificationSound}
                    onChange={(e) => setNotificationSound(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Toast Duration</p>
                    <p className="text-xs text-foreground-muted">How long toasts stay visible (ms)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Input
                        type="number"
                        min="1000"
                        max="10000"
                        step="500"
                        value={toastDuration}
                        onChange={(e) => setToastDuration(parseInt(e.target.value) || 3000)}
                        className="w-24 font-mono text-center"
                        disabled={!notificationsEnabled}
                    />
                    <span className="text-xs font-mono text-foreground-muted">ms</span>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Scan Complete</p>
                    <p className="text-xs text-foreground-muted">Show notification when scan finishes</p>
                </div>
                <Switch
                    checked={notifyOnScanComplete}
                    onChange={(e) => setNotifyOnScanComplete(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Cleanup Complete</p>
                    <p className="text-xs text-foreground-muted">Show notification when cleanup finishes</p>
                </div>
                <Switch
                    checked={notifyOnCleanupComplete}
                    onChange={(e) => setNotifyOnCleanupComplete(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notify on Errors</p>
                    <p className="text-xs text-foreground-muted">Show notification when errors occur</p>
                </div>
                <Switch
                    checked={notifyOnErrors}
                    onChange={(e) => setNotifyOnErrors(e.target.checked)}
                    disabled={!notificationsEnabled}
                />
            </div>
        </Card>
    </div>
);
