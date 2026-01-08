import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';
// @ts-ignore - ip-subnet-calculator may not have types
import { calculateSubnetMask } from 'ip-subnet-calculator';

// Type definitions for ip-subnet-calculator as it might be missing types
interface SubnetResult {
    ipLow: string;
    ipLowStr: string;
    ipHigh: string;
    ipHighStr: string;
    prefixMask: string;
    prefixMaskStr: string;
    prefixSize: number;
    invertedMask: string;
    invertedMaskStr: string;
    subnetMask: string;
    subnetMaskStr: string;
}

const TOOL_ID = 'ipv4-subnet-calculator';

interface Ipv4SubnetCalculatorProps {
    tabId?: string;
}

export const Ipv4SubnetCalculator: React.FC<Ipv4SubnetCalculatorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // Default options
    const data = toolData || {
        input: '', // IP Address
        options: {
            mask: '24', // CIDR or Mask
        },
        output: '',
        meta: {
            result: null
        }
    };

    // safe destructure
    const { input, options, meta } = data;
    const result = meta?.result as SubnetResult | null;

    useEffect(() => {
        addToHistory(TOOL_ID);
        if (!input) {
            handleCalculate('192.168.1.1', '24');
        }
    }, [addToHistory]);

    const handleCalculate = (ip: string, mask: string) => {
        // Normalize input
        const cleanIp = ip.trim();
        const cleanMask = mask.trim().replace('/', '');

        setToolData(effectiveId, { input: cleanIp, options: { mask: cleanMask } });

        if (!cleanIp) return;

        try {
            // calculateSubnetMask(ip, prefixSize)
            const prefixSize = parseInt(cleanMask) || 24;
            const res = calculateSubnetMask(cleanIp, prefixSize);
            if (res) {
                setToolData(effectiveId, { meta: { result: res } });
            } else {
                setToolData(effectiveId, { meta: { result: null } });
            }
        } catch (e) {
            setToolData(effectiveId, { meta: { result: null } });
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        handleCalculate('', '24');
    };

    const InfoRow = ({ label, value }: { label: string, value: string | number }) => (
        <div className="flex justify-between items-center py-3 border-b border-border-glass last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{label}</span>
            <span className="font-mono text-sm text-primary select-all">{value}</span>
        </div>
    );

    return (
        <ToolPane
            title="IPv4 Subnet Calculator"
            description="Calculate network range, broadcast, and host counts"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Input
                            label="IP Address"
                            type="text"
                            value={input}
                            onChange={(e) => handleCalculate(e.target.value, options.mask)}
                            placeholder="192.168.1.1"
                            fullWidth
                        />
                    </div>
                    <div>
                        <Input
                            label="CIDR / Mask"
                            type="text"
                            value={options.mask}
                            onChange={(e) => handleCalculate(input, e.target.value)}
                            placeholder="24"
                            fullWidth
                        />
                    </div>
                </div>

                {result && (
                    <div className="glass-panel p-6 rounded-2xl space-y-1">
                        <InfoRow label="Network Address" value={result.ipLowStr} />
                        <InfoRow label="Broadcast Address" value={result.ipHighStr} />
                        <InfoRow label="Subnet Mask" value={result.prefixMaskStr} />
                        <InfoRow label="Wildcard Mask" value={result.invertedMaskStr} />
                        <InfoRow label="CIDR Notation" value={`/${result.prefixSize}`} />
                        <InfoRow
                            label="Host Count"
                            value={(Math.pow(2, 32 - result.prefixSize) - 2).toLocaleString()}
                        />
                        <InfoRow
                            label="IP Range"
                            value={`${result.ipLowStr} - ${result.ipHighStr}`}
                        />
                        <div className="mt-6 pt-4 border-t border-border-glass space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-widest">Binary IP</span>
                                <span className="font-mono text-xs text-foreground-secondary tracking-tight">{parseInt(result.ipLow).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.')}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-widest">Binary Mask</span>
                                <span className="font-mono text-xs text-foreground-secondary tracking-tight">{parseInt(result.prefixMask).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
