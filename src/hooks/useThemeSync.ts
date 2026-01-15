import { useEffect } from 'react';
import { useSettingsStore } from '@store/settingsStore';

export function useThemeSync() {
    const { theme, layoutMode, accentColor, glassIntensity, blurEnabled } = useSettingsStore();

    // Sync layout and visual styles
    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-layout', layoutMode);
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--glass-intensity', glassIntensity.toString());
        root.classList.toggle('blur-disabled', !blurEnabled);
    }, [layoutMode, accentColor, glassIntensity, blurEnabled]);

    // Sync theme (light/dark/system)
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(mediaQuery.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
}
