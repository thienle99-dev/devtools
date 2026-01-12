import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Zap, 
    Search, 
    Cpu, 
    Shield, 
    LayoutGrid, 
    Command,
    Sparkles
} from 'lucide-react';
import { useOnboardingStore } from '@store/onboardingStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface Step {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    image?: string;
}

const steps: Step[] = [
    {
        title: "Welcome to DevTools",
        description: "Your all-in-one developer productivity suite. Secure, fast, and local-first. Let's take a quick tour of what you can do.",
        icon: Sparkles,
        color: "text-indigo-400"
    },
    {
        title: "The Ultimate Command Palette",
        description: "Press Cmd/Ctrl + K to search anything. Open tools, run actions, or change settings instantly from anywhere in the app.",
        icon: Command,
        color: "text-blue-400"
    },
    {
        title: "Secure & Private",
        description: "All your data stays local. We don't track your inputs or store your secrets on any server. Privacy is at our core.",
        icon: Shield,
        color: "text-emerald-400"
    },
    {
        title: "Tool Piping & Presets",
        description: "Chain tools together, save your most used configurations as presets, and replay your history with one click.",
        icon: Zap,
        color: "text-amber-400"
    },
    {
        title: "System Insights",
        description: "Monitor your CPU, RAM, and system health in real-time with our built-in stats monitor and cleaner tools.",
        icon: Cpu,
        color: "text-rose-400"
    }
];

export const WelcomeTour: React.FC = () => {
    const { 
        isTourActive, 
        currentStepIndex, 
        nextStep, 
        prevStep, 
        completeTour, 
        skipTour 
    } = useOnboardingStore();

    if (!isTourActive) return null;

    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md overflow-hidden">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-panel overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                style={{ borderRadius: '32px' }}
            >
                {/* Close/Skip button */}
                <button 
                    onClick={skipTour}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 flex gap-1 px-4 pt-4">
                    {steps.map((_, i) => (
                        <div 
                            key={i}
                            className={cn(
                                "flex-1 h-full rounded-full transition-all duration-500",
                                i <= currentStepIndex ? "bg-indigo-500" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-10 pt-16 flex flex-col items-center text-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentStepIndex}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="flex flex-col items-center"
                        >
                            <div className={cn(
                                "w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 shadow-inner",
                                currentStep.color
                            )}>
                                <currentStep.icon size={40} strokeWidth={1.5} />
                            </div>

                            <h2 className="text-3xl font-black tracking-tight text-foreground mb-4">
                                {currentStep.title}
                            </h2>
                            <p className="text-foreground-muted leading-relaxed max-w-sm">
                                {currentStep.description}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isFirstStep && (
                            <button 
                                onClick={prevStep}
                                className="h-10 px-4 rounded-xl hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all flex items-center gap-2 text-sm font-semibold"
                            >
                                <ChevronLeft size={16} />
                                Back
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {isLastStep ? (
                            <Button 
                                onClick={completeTour}
                                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 font-bold"
                            >
                                Get Started
                            </Button>
                        ) : (
                            <Button 
                                onClick={nextStep}
                                className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 font-bold flex items-center gap-2"
                            >
                                Continue
                                <ChevronRight size={18} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Background glow effects */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            </motion.div>
        </div>
    );
};
