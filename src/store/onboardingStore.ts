import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingStore {
    hasCompletedOnboarding: boolean;
    currentStepIndex: number;
    isTourActive: boolean;
    completedSteps: string[];

    // Actions
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    completeTour: () => void;
    skipTour: () => void;
    resetTour: () => void;
    setStep: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set, get) => ({
            hasCompletedOnboarding: false,
            currentStepIndex: 0,
            isTourActive: false,
            completedSteps: [],

            startTour: () => set({ isTourActive: true, currentStepIndex: 0 }),
            
            nextStep: () => {
                const { currentStepIndex } = get();
                set({ currentStepIndex: currentStepIndex + 1 });
            },

            prevStep: () => {
                const { currentStepIndex } = get();
                if (currentStepIndex > 0) {
                    set({ currentStepIndex: currentStepIndex - 1 });
                }
            },

            completeTour: () => set({ 
                hasCompletedOnboarding: true, 
                isTourActive: false,
                currentStepIndex: 0 
            }),

            skipTour: () => set({ 
                hasCompletedOnboarding: true, 
                isTourActive: false 
            }),

            resetTour: () => set({ 
                hasCompletedOnboarding: false, 
                currentStepIndex: 0,
                isTourActive: false,
                completedSteps: []
            }),

            setStep: (index) => set({ currentStepIndex: index }),
        }),
        {
            name: 'antigravity-onboarding-storage',
        }
    )
);
