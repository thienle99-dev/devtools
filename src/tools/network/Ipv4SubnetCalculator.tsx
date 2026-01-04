import React, { useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolStore } from '../../store/toolStore';
// @ts-ignore - ip-subnet-calculator may not have types
import Calculator from 'ip-subnet-calculator';

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

export const Ipv4SubnetCalculator: React.FC = () => {
    const { tools, setToolData, clearToolData, addToHistory } = useToolStore();

    // Default options
    const data = tools[TOOL_ID] || {
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

        setToolData(TOOL_ID, { input: cleanIp, options: { mask: cleanMask } });

        if (!cleanIp) return;

        try {
            // Calculator.calculate(ip, mask)
            const res = Calculator.calculate(cleanIp, cleanMask);
            if (res && (Array.isArray(res) ? res.length > 0 : res)) {
                const info = Array.isArray(res) ? res[0] : res;
                setToolData(TOOL_ID, { meta: { result: info } });
            } else {
                setToolData(TOOL_ID, { meta: { result: null } });
            }
        } catch (e) {
            setToolData(TOOL_ID, { meta: { result: null } });
        }
    };

    const handleClear = () => {
        clearToolData(TOOL_ID);
        handleCalculate('', '24');
    };

    const InfoRow = ({ label, value }: { label: string, value: string | number }) => (
        <div className="flex justify-between items-center py-2 border-b border-border-glass last:border-0">
            <span className="text-sm font-bold text-foreground-muted uppercase tracking-wider">{label}</span>
            <span className="font-mono text-primary select-all">{value}</span>
        </div>
    );

    return (
        <ToolPane
            title="IPv4 Subnet Calculator"
            description="Calculate network range, broadcast, and host counts"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">IP Address</label>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => handleCalculate(e.target.value, options.mask)}
                            className="glass-input w-full"
                            placeholder="192.168.1.1"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">CIDR / Mask</label>
                        <input
                            type="text"
                            value={options.mask}
                            onChange={(e) => handleCalculate(input, e.target.value)}
                            className="glass-input w-full"
                            placeholder="24"
                        />
                    </div>
                </div>

                {result && (
                    <div className="glass-panel p-6 rounded-xl space-y-1">
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
                        <div className="mt-4 pt-4 border-t border-border-glass">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs text-foreground-muted">Binary IP</span>
                                <span className="font-mono text-xs text-foreground-secondary">{parseInt(result.ipLow).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.')}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs text-foreground-muted">Binary Mask</span>
                                <span className="font-mono text-xs text-foreground-secondary">{parseInt(result.prefixMask).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
