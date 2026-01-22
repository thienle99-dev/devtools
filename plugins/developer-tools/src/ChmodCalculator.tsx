import React, { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Input } from '@components/ui/Input';
import { Checkbox } from '@components/ui/Checkbox';

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
        <div className="glass-panel p-6 flex flex-col items-center space-y-4">
            <h4 className="font-bold text-foreground-muted uppercase tracking-[0.2em] text-xs">{label}</h4>
            <div className="space-y-4 w-full">
                <Checkbox
                    label="Read (4)"
                    checked={options[prefix + 'r']}
                    onChange={() => handleCheckboxChange(prefix + 'r')}
                    className="w-full"
                />
                <Checkbox
                    label="Write (2)"
                    checked={options[prefix + 'w']}
                    onChange={() => handleCheckboxChange(prefix + 'w')}
                    className="w-full"
                />
                <Checkbox
                    label="Execute (1)"
                    checked={options[prefix + 'x']}
                    onChange={() => handleCheckboxChange(prefix + 'x')}
                    className="w-full"
                />
            </div>
        </div>
    );

    return (
        <ToolPane
            toolId={effectiveId}
            title="Chmod Calculator"
            description="Calculate Linux file permissions (Octal/Symbolic)"
            onClear={handleClear}
        >
            <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">

                {/* Outputs */}
                <div className="grid grid-cols-2 gap-8">
                    <Input
                        label="Octal"
                        value={input}
                        onChange={(e) => handleOctalChange(e.target.value)}
                        className="text-center text-3xl font-mono tracking-widest py-8 h-auto text-primary"
                        maxLength={3}
                        fullWidth
                    />
                    <Input
                        label="Symbolic"
                        value={output}
                        readOnly
                        className="text-center text-3xl font-mono tracking-wider py-8 h-auto text-foreground-secondary"
                        fullWidth
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PermissionGroup label="Owner" prefix="o" />
                    <PermissionGroup label="Group" prefix="g" />
                    <PermissionGroup label="Public" prefix="p" />
                </div>
            </div>
        </ToolPane>
    );
};
