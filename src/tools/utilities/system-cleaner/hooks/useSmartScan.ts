import { useCallback } from 'react';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { createProgressTracker, updateProgress, formatETA } from '../utils/progressUtils';
import { retryWithBackoff, isRetryableError } from '../utils/errorRecovery';
import type { SmartScanResult, PlatformInfo, PerformanceData } from '../types';

export const useSmartScan = () => {
    const { 
        startScan: startScanStore, 
        setScanProgress, 
        setResults, 
        stopScan,
        setPlatformInfo
    } = useSystemCleanerStore();

    const runSmartScan = useCallback(async () => {
        startScanStore();
        const tracker = createProgressTracker(5); // 5 steps
        
        try {
            // 1. Get Platform Info
            setScanProgress(5, 'Detecting platform...');
            const platform = await retryWithBackoff(
                async () => {
                    const result = await (window as any).cleanerAPI.getPlatform();
                    return result as PlatformInfo;
                },
                { maxRetries: 3, shouldRetry: isRetryableError }
            );
            setPlatformInfo(platform);
            updateProgress(tracker, 1);
            setScanProgress(20, `Platform detected: ${platform.platform}`);
            
            // 2. Scan Junk Files
            setScanProgress(25, 'Scanning for junk files...');
            const junkResults = await retryWithBackoff(
                async () => {
                    const result = await (window as any).cleanerAPI.scanJunk();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to scan junk files');
                    }
                    return result.result;
                },
                { maxRetries: 2, shouldRetry: isRetryableError }
            );
            updateProgress(tracker, 2);
            setScanProgress(50, `Found ${junkResults.items.length} junk files`);
            
            // 3. Get Performance Data (Real RAM status)
            setScanProgress(55, 'Checking memory status...');
            const perfData = await retryWithBackoff(
                async () => {
                    const result = await (window as any).cleanerAPI.getPerformanceData();
                    return result as PerformanceData;
                },
                { maxRetries: 2, shouldRetry: isRetryableError }
            );
            updateProgress(tracker, 3);
            const ramStatus = {
                used: perfData.memory.used,
                total: perfData.memory.total,
                percentage: perfData.memory.percent
            };
            setScanProgress(70, `Memory usage: ${ramStatus.percentage.toFixed(1)}%`);
            
            // 4. Scan Privacy Data (Real scan)
            setScanProgress(75, 'Scanning privacy data...');
            try {
                const privacyResult = await (window as any).cleanerAPI.scanPrivacy();
                if (privacyResult.success && privacyResult.results) {
                    updateProgress(tracker, 4);
                    setScanProgress(85, `Found ${privacyResult.results.totalItems} privacy items`);
                }
            } catch (e) {
                // Privacy scan is optional, continue if it fails
                console.warn('Privacy scan failed:', e);
            }
            
            // 5. Finalize
            updateProgress(tracker, 5);
            setScanProgress(95, 'Finalizing results...');
            
            const estimatedETA = formatETA(tracker.estimatedTimeRemaining);
            setScanProgress(95, `Estimated time remaining: ${estimatedETA}`);

            // Compile final result
            const finalResults: SmartScanResult = {
                junkFiles: junkResults,
                malware: {
                    threats: [],
                    suspiciousApps: [],
                    scanType: 'quick',
                    scanDuration: Math.round((Date.now() - tracker.startTime) / 1000)
                },
                ramStatus,
                updates: [],
                clutter: null,
                totalSpaceSavings: junkResults.totalSize,
                estimatedTime: Math.round(tracker.estimatedTimeRemaining)
            };
            
            setResults(finalResults);
        } catch (error) {
            console.error('Smart Scan failed:', error);
            stopScan();
        }
    }, [startScanStore, setScanProgress, setResults, stopScan, setPlatformInfo]);

    return { runSmartScan };
};
