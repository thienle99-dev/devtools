import React from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import { MacOSWindowControls } from './MacOSWindowControls';
import { WindowsWindowControls } from './WindowsWindowControls';

/**
 * Platform-aware window controls component
 * Renders macOS-style or Windows/Linux-style controls based on the platform
 */
export const WindowControls: React.FC = () => {
    const { isMac } = usePlatform();

    // Render platform-specific controls
    return isMac ? <MacOSWindowControls /> : <WindowsWindowControls />;
};
