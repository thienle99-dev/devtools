import { useCallback } from 'react';
import { useSystemCleanerStore } from '../store/systemCleanerStore';

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
        
        try {
            // 1. Get Platform Info
            setScanProgress(5, 'Detecting platform...');
            const platform = await (window as any).cleanerAPI.getPlatform();
            setPlatformInfo(platform);
            
            // 2. Scan Junk Files
            setScanProgress(20, 'Scanning for junk files...');
            const junkResults = await (window as any).cleanerAPI.scanJunk();
            setScanProgress(50, 'Analyzing system caches...');
            
            // 3. Simulated steps for malware and RAM (for now)
            setScanProgress(70, 'Running malware check...');
            await new Promise(r => setTimeout(r, 1000));
            
            setScanProgress(85, 'Checking memory status...');
            await (window as any).cleanerAPI.freeRam();
            
            setScanProgress(95, 'Finalizing results...');
            await new Promise(r => setTimeout(r, 500));

            // Compile final result
            const finalResults = {
                junkFiles: junkResults,
                malware: {
                    threats: [],
                    suspiciousApps: [],
                    scanType: 'quick' as const,
                    scanDuration: 1200
                },
                ramStatus: {
                    used: 0,
                    total: 16 * 1024 * 1024 * 1024,
                    percentage: 45
                },
                updates: [],
                clutter: null,
                totalSpaceSavings: junkResults.totalSize,
                estimatedTime: 5
            };
            
            setResults(finalResults);
        } catch (error) {
            console.error('Smart Scan failed:', error);
            stopScan();
        }
    }, [startScanStore, setScanProgress, setResults, stopScan, setPlatformInfo]);

    return { runSmartScan };
};
