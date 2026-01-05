import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { useSettingsStore } from '../store/settingsStore';
import { cn } from '../../../../utils/cn';

interface WelcomeScreenProps {
    onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { platformInfo } = useSystemCleanerStore();
    const { updateSetting } = useSettingsStore();

    const steps = [
        {
            title: 'Welcome to System Cleaner',
            description: 'Your all-in-one system maintenance and optimization suite',
            icon: Shield,
            content: (
                <div className="space-y-4 text-center">
                    <p className="text-foreground-muted">
                        System Cleaner helps you keep your {platformInfo?.platform === 'windows' ? 'Windows' : platformInfo?.platform === 'macos' ? 'macOS' : ''} system running smoothly.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <Card className="p-4 bg-white/5 border-border-glass">
                            <div className="text-2xl font-bold text-indigo-400 mb-2">Clean</div>
                            <div className="text-xs text-foreground-muted">Remove junk files</div>
                        </Card>
                        <Card className="p-4 bg-white/5 border-border-glass">
                            <div className="text-2xl font-bold text-emerald-400 mb-2">Optimize</div>
                            <div className="text-xs text-foreground-muted">Boost performance</div>
                        </Card>
                        <Card className="p-4 bg-white/5 border-border-glass">
                            <div className="text-2xl font-bold text-amber-400 mb-2">Protect</div>
                            <div className="text-xs text-foreground-muted">Secure your privacy</div>
                        </Card>
                    </div>
                </div>
            ),
        },
        {
            title: 'Platform Detection',
            description: `Detected: ${platformInfo?.platform === 'windows' ? 'Windows' : platformInfo?.platform === 'macos' ? 'macOS' : 'Unknown'}`,
            icon: CheckCircle2,
            content: (
                <div className="space-y-4">
                    <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl">
                                <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-lg mb-1">Platform Detected</div>
                                <div className="text-sm text-foreground-muted">
                                    {platformInfo?.platform === 'windows' && 'Windows'}
                                    {platformInfo?.platform === 'macos' && 'macOS'}
                                    {platformInfo?.platform === 'linux' && 'Linux'}
                                    {!platformInfo && 'Unknown'}
                                </div>
                                {platformInfo && (
                                    <div className="text-xs text-foreground-muted/70 mt-2">
                                        Version: {platformInfo.version} • Architecture: {platformInfo.architecture}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                    <div className="space-y-2 text-sm text-foreground-muted">
                        <p>✓ Platform-specific optimizations enabled</p>
                        <p>✓ Safety rules loaded for your system</p>
                        <p>✓ All features optimized for your platform</p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Quick Setup',
            description: 'Configure your preferences',
            icon: Zap,
            content: (
                <div className="space-y-4">
                    <Card className="p-4 bg-white/5 border-border-glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium mb-1">Auto Backup</div>
                                <div className="text-xs text-foreground-muted">Create backups before cleanup</div>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked={true}
                                onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                                className="w-5 h-5 rounded border-border-glass"
                            />
                        </div>
                    </Card>
                    <Card className="p-4 bg-white/5 border-border-glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium mb-1">Safety Checks</div>
                                <div className="text-xs text-foreground-muted">Protect important files</div>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked={true}
                                onChange={(e) => updateSetting('safetyCheckEnabled', e.target.checked)}
                                className="w-5 h-5 rounded border-border-glass"
                            />
                        </div>
                    </Card>
                    <Card className="p-4 bg-white/5 border-border-glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium mb-1">Notifications</div>
                                <div className="text-xs text-foreground-muted">Get notified about important events</div>
                            </div>
                            <input
                                type="checkbox"
                                defaultChecked={true}
                                onChange={(e) => updateSetting('showNotifications', e.target.checked)}
                                className="w-5 h-5 rounded border-border-glass"
                            />
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            title: "You're All Set!",
            description: 'Ready to start cleaning and optimizing your system',
            icon: Sparkles,
            content: (
                <div className="space-y-6 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="relative mx-auto w-32 h-32"
                    >
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative p-8 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                            <Sparkles className="w-16 h-16 text-indigo-400" />
                        </div>
                    </motion.div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Ready to Get Started?</h3>
                        <p className="text-foreground-muted">
                            Run your first Smart Scan to analyze your system and find optimization opportunities.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    const currentStepData = steps[currentStep];
    const Icon = currentStepData.icon;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            updateSetting('hasCompletedOnboarding', true);
            onComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSkip = () => {
        updateSetting('hasCompletedOnboarding', true);
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-br from-white/10 dark:from-white/10 to-white/5 dark:to-white/5 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                            <p className="text-sm text-foreground-muted">{currentStepData.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-foreground-muted" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8"
                    >
                        {currentStepData.content}
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between pt-6 border-t border-border-glass">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-2 rounded-full transition-all",
                                    i === currentStep ? "w-8 bg-indigo-500" : "w-2 bg-white/20"
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                Back
                            </Button>
                        )}
                        <Button variant="primary" onClick={handleNext}>
                            {isLastStep ? 'Get Started' : 'Next'}
                            {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

