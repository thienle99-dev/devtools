import React, { useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';

const TOOL_ID = 'chmod-calculator';

interface ChmodCalculatorProps {
    tabId?: string;
}

export const ChmodCalculator: React.FC<ChmodCalculatorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    // permissions: [owner_r, owner_w, owner_x, group_r...]
    const data = toolData || {
        input: '755', // Octal string
        options: {
            // Store bits as booleans
            // Owner
            or: true, ow: true, ox: true,
            // Group
            gr: true, gw: false, gx: true,
            // Public
            pr: true, pw: false, px: true,
        },
        output: '-rwxr-xr-x' // Symbolic string
    };

    const { input, options, output } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Update logic
    const updateFromIds = (newOptions: any) => {
        // Calculate Octal
        const o = (newOptions.or ? 4 : 0) + (newOptions.ow ? 2 : 0) + (newOptions.ox ? 1 : 0);
        const g = (newOptions.gr ? 4 : 0) + (newOptions.gw ? 2 : 0) + (newOptions.gx ? 1 : 0);
        const p = (newOptions.pr ? 4 : 0) + (newOptions.pw ? 2 : 0) + (newOptions.px ? 1 : 0);
        const octal = `${o}${g}${p}`;

        // Calculate Symbolic
        const sym = [
            '-',
            newOptions.or ? 'r' : '-', newOptions.ow ? 'w' : '-', newOptions.ox ? 'x' : '-',
            newOptions.gr ? 'r' : '-', newOptions.gw ? 'w' : '-', newOptions.gx ? 'x' : '-',
            newOptions.pr ? 'r' : '-', newOptions.pw ? 'w' : '-', newOptions.px ? 'x' : '-'
        ].join('');

        setToolData(effectiveId, { input: octal, options: newOptions, output: sym });
    };

    const handleCheckboxChange = (key: string) => {
        const newOptions = { ...options, [key]: !options[key] };
        updateFromIds(newOptions);
    };

    const handleOctalChange = (val: string) => {
        // input validation 000-777
        const clean = val.replace(/[^0-7]/g, '').slice(0, 3);

        if (clean.length === 3) {
            const o = parseInt(clean[0]);
            const g = parseInt(clean[1]);
            const p = parseInt(clean[2]);

            const newOptions = {
                or: !!(o & 4), ow: !!(o & 2), ox: !!(o & 1),
                gr: !!(g & 4), gw: !!(g & 2), gx: !!(g & 1),
                pr: !!(p & 4), pw: !!(p & 2), px: !!(p & 1),
            };

            // Calculate Symbolic
            const sym = [
                '-',
                newOptions.or ? 'r' : '-', newOptions.ow ? 'w' : '-', newOptions.ox ? 'x' : '-',
                newOptions.gr ? 'r' : '-', newOptions.gw ? 'w' : '-', newOptions.gx ? 'x' : '-',
                newOptions.pr ? 'r' : '-', newOptions.pw ? 'w' : '-', newOptions.px ? 'x' : '-'
            ].join('');

            setToolData(effectiveId, { input: clean, options: newOptions, output: sym });
        } else {
            setToolData(effectiveId, { input: clean });
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        // Reset to default 755
        const defOpts = {
            or: true, ow: true, ox: true,
            gr: true, gw: false, gx: true,
            pr: true, pw: false, px: true,
        };
        setToolData(effectiveId, { input: '755', options: defOpts, output: '-rwxr-xr-x' });
    };

    const PermissionGroup = ({ label, prefix }: { label: string, prefix: string }) => (
        <div className="glass-panel p-4 flex flex-col items-center space-y-3">
            <h4 className="font-bold text-foreground-muted uppercase tracking-wider text-xs">{label}</h4>
            <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={options[prefix + 'r']}
                        onChange={() => handleCheckboxChange(prefix + 'r')}
                        className="rounded border-border-glass bg-glass-input text-emerald-400 focus:ring-emerald-400"
                    />
                    <span className="text-sm font-medium">Read (4)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={options[prefix + 'w']}
                        onChange={() => handleCheckboxChange(prefix + 'w')}
                        className="rounded border-border-glass bg-glass-input text-orange-400 focus:ring-orange-400"
                    />
                    <span className="text-sm font-medium">Write (2)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={options[prefix + 'x']}
                        onChange={() => handleCheckboxChange(prefix + 'x')}
                        className="rounded border-border-glass bg-glass-input text-blue-400 focus:ring-blue-400"
                    />
                    <span className="text-sm font-medium">Execute (1)</span>
                </label>
            </div>
        </div>
    );

    return (
        <ToolPane
            title="Chmod Calculator"
            description="Calculate Linux file permissions (Octal/Symbolic)"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">

                {/* Outputs */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-center">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Octal</label>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => handleOctalChange(e.target.value)}
                            className="glass-input text-center text-3xl font-mono tracking-widest w-full py-4 text-primary"
                            maxLength={3}
                        />
                    </div>
                    <div className="space-y-2 text-center">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Symbolic</label>
                        <input
                            type="text"
                            value={output}
                            readOnly
                            className="glass-input text-center text-3xl font-mono tracking-wider w-full py-4 text-foreground-secondary"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PermissionGroup label="Owner" prefix="o" />
                    <PermissionGroup label="Group" prefix="g" />
                    <PermissionGroup label="Public" prefix="p" />
                </div>
            </div>
        </ToolPane>
    );
};
