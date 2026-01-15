import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionItem } from './PermissionItem';

export interface PermissionsTabProps {
    permissions: any;
    isLoading: boolean;
    checkAllPermissions: () => void;
    checkPermission: (key: string) => void;
    testPermission: (key: string) => Promise<void> | void;
    openSystemPreferences: (pane?: string) => void;
    platform: string;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({ permissions, isLoading, checkAllPermissions, checkPermission, testPermission, openSystemPreferences, platform }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Permissions</h2>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    checkAllPermissions();
                    toast.success('Refreshing permissions...');
                }}
                disabled={isLoading}
                className="text-xs"
            >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>

        <Card className="p-1">
            {/* macOS Permissions */}
            {platform === 'darwin' && (
                <>
                    <PermissionItem
                        name="Accessibility"
                        description="Required for global keyboard shortcuts (Cmd+Shift+D, Cmd+Shift+C)"
                        permissionKey="accessibility"
                        permission={permissions.accessibility}
                        onCheck={() => checkPermission('accessibility')}
                        onTest={() => {
                            testPermission('accessibility');
                            toast.info('Testing accessibility permission...');
                        }}
                        onRequest={() => {
                            openSystemPreferences('accessibility');
                            toast.info('Opening System Preferences...');
                        }}
                    />
                    <PermissionItem
                        name="Full Disk Access"
                        description="Required for System Cleaner to scan and delete files"
                        permissionKey="fullDiskAccess"
                        permission={permissions.fullDiskAccess}
                        onCheck={() => checkPermission('fullDiskAccess')}
                        onTest={() => {
                            testPermission('fullDiskAccess');
                            toast.info('Testing full disk access...');
                        }}
                        onRequest={() => {
                            openSystemPreferences('full-disk-access');
                            toast.info('Opening System Preferences...');
                        }}
                    />
                    <PermissionItem
                        name="Screen Recording"
                        description="Required for Screenshot tool to capture screen"
                        permissionKey="screenRecording"
                        permission={permissions.screenRecording}
                        onCheck={() => checkPermission('screenRecording')}
                        onTest={() => {
                            testPermission('screenRecording');
                            toast.info('Testing screen recording permission...');
                        }}
                        onRequest={() => {
                            openSystemPreferences('screen-recording');
                            toast.info('Opening System Preferences...');
                        }}
                    />
                </>
            )}

            {/* Windows Permissions */}
            {platform === 'win32' && (
                <>
                    <PermissionItem
                        name="File System Access"
                        description="Required for System Cleaner to read and write files"
                        permissionKey="fileAccess"
                        permission={permissions.fileAccess}
                        onCheck={() => checkPermission('fileAccess')}
                        onTest={async () => {
                            await testPermission('fileAccess');
                            toast.info('Testing file access...');
                        }}
                        onRequest={() => {
                            openSystemPreferences();
                            toast.info('Opening Windows Settings...');
                        }}
                    />
                    <PermissionItem
                        name="Registry Access"
                        description="Required for System Cleaner to read registry entries"
                        permissionKey="registryAccess"
                        permission={permissions.registryAccess}
                        onCheck={() => checkPermission('registryAccess')}
                        onTest={() => {
                            testPermission('registryAccess');
                            toast.info('Testing registry access...');
                        }}
                        onRequest={() => {
                            openSystemPreferences();
                            toast.info('Opening Windows Settings...');
                        }}
                    />
                </>
            )}

            {/* Common Permissions */}
            <PermissionItem
                name="Clipboard Access"
                description="Required for Clipboard Manager to read and write clipboard content"
                permissionKey="clipboard"
                permission={permissions.clipboard}
                onCheck={() => checkPermission('clipboard')}
                onTest={async () => {
                    await testPermission('clipboard');
                    toast.info('Testing clipboard access...');
                }}
                onRequest={() => {
                    openSystemPreferences();
                    toast.info('Opening system settings...');
                }}
            />
            <PermissionItem
                name="Launch at Login"
                description="Required to automatically start app when you log in"
                permissionKey="launchAtLogin"
                permission={permissions.launchAtLogin}
                onCheck={() => checkPermission('launchAtLogin')}
                onTest={() => {
                    testPermission('launchAtLogin');
                    toast.info('Checking launch at login permission...');
                }}
                onRequest={() => {
                    openSystemPreferences();
                    toast.info('Opening system settings...');
                }}
            />
            <PermissionItem
                name="Process Management"
                description="Required for Application Manager to view and kill running processes"
                permissionKey="processManagement"
                permission={permissions.processManagement || { status: 'unknown', message: 'Not checked yet' }}
                onCheck={() => checkPermission('processManagement')}
                onTest={() => {
                    testPermission('processManagement');
                    toast.info('Testing process management permission...');
                }}
                onRequest={() => {
                    openSystemPreferences();
                    toast.info('Opening system settings...');
                }}
            />
            {platform === 'darwin' && (
                <PermissionItem
                    name="Application Uninstall"
                    description="Required for Application Manager to uninstall applications (may require admin password)"
                    permissionKey="appUninstall"
                    permission={permissions.appUninstall || { status: 'unknown', message: 'Not checked yet' }}
                    onCheck={() => checkPermission('appUninstall')}
                    onTest={() => {
                        testPermission('appUninstall');
                        toast.info('Testing app uninstall permission...');
                    }}
                    onRequest={() => {
                        openSystemPreferences();
                        toast.info('Opening system settings...');
                    }}
                />
            )}
        </Card>
    </div>
);
