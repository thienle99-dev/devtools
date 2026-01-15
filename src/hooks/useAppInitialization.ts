import { useEffect } from 'react';
import { useResponsive } from '@hooks/useResponsive';
import { useSettingsStore } from '@store/settingsStore';
import { useOnboardingStore } from '@store/onboardingStore';
import { preloadHeavyModules } from '@utils/lazyLoad';

export function useAppInitialization() {
    const responsive = useResponsive();
    const { hasCompletedOnboarding, startTour } = useOnboardingStore();

    // Auto-collapse sidebar on mobile/tablet
    useEffect(() => {
        if (responsive.isMobile) {
            useSettingsStore.getState().setSidebarOpen(false);
        }
    }, [responsive.isMobile]);

    // Onboarding tour
    useEffect(() => {
        if (!hasCompletedOnboarding) {
            startTour();
        }
    }, [hasCompletedOnboarding, startTour]);

    // Preload heavy modules on idle for better UX
    useEffect(() => {
        preloadHeavyModules();
    }, []);
}
