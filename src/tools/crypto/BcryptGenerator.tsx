import React, { useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ToolPane } from '@components/layout/ToolPane';
import { CodeEditor } from '@components/ui/CodeEditor';
import { useToolState } from '@store/toolStore';

const TOOL_ID = 'bcrypt-generator';

interface BcryptGeneratorProps {
    tabId?: string;
}

export const BcryptGenerator: React.FC<BcryptGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            rounds: 10,
            compareHash: ''
        },
        meta: { isMatch: null }
    };

    // meta.isMatch: true, false, or null
    const { input, output, options, meta } = data;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleInputChange = (val: string) => {
        setToolData(effectiveId, { input: val });
        // Auto compare if we have hash and text? No, explicit action better for async bcrypt.
    };

    const handleHash = () => {
        setLoadingAction('Hash');
        // Use timeout to allow UI update before blocking sync work if using sync bcrypt, 
        // OR use async version. bcryptjs has async.
        setTimeout(async () => {
            try {
                if (!input) return;
                const salt = await bcrypt.genSalt(options.rounds);
                const hash = await bcrypt.hash(input, salt);
                setToolData(effectiveId, { output: hash });
            } catch (e) {
                setToolData(effectiveId, { output: 'Error generating hash' });
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleCompare = () => {
        setLoadingAction('Compare');
        setTimeout(async () => {
            try {
                if (!input || !options.compareHash) {
                    setToolData(effectiveId, { meta: { isMatch: null } });
                    return;
                }
                const match = await bcrypt.compare(input, options.compareHash);
                setToolData(effectiveId, { meta: { isMatch: match } });
            } catch (e) {
                setToolData(effectiveId, { meta: { isMatch: false } }); // or error state
            } finally {
                setLoadingAction(null);
            }
        }, 100);
    };

    const handleClear = () => clearToolData(effectiveId);

    return (
        <ToolPane
            title="Bcrypt Hash Generator"
            description="Generate and compare Bcrypt password hashes"
            onClear={handleClear}
        >
            <div className="max-w-3xl mx-auto space-y-8 py-6 px-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Input Password</label>
                        <div className="flex items-center space-x-2">
                            <label className="text-xs text-foreground-muted">Salt Rounds:</label>
                            <Input
                                type="number"
                                min="4" max="31"
                                value={options.rounds}
                                onChange={(e) => setToolData(effectiveId, { options: { ...options, rounds: parseInt(e.target.value) } })}
                                className="w-16 text-center py-1"
                            />
                        </div>
                    </div>
                    <CodeEditor
                        className="min-h-[60px]"
                        language="text"
                        placeholder="Enter password..."
                        value={input}
                        onChange={handleInputChange}
                    />
                    <Button
                        variant="primary"
                        onClick={handleHash}
                        loading={loadingAction === 'Hash'}
                        className="w-full"
                    >
                        Generate Hash
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Generated Hash</label>
                    <div className="flex space-x-2 items-center">
                        <div className="flex-1">
                            <Input
                                type="text"
                                readOnly
                                value={output}
                                className="font-mono text-sm bg-black/20"
                                fullWidth
                            />
                        </div>
                        <Button variant="glass" onClick={() => navigator.clipboard.writeText(output)}>Copy</Button>
                    </div>
                </div>

                <div className="pt-8 border-t border-border-glass space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground-muted">Compare Hash</h3>
                    <div className="space-y-2">
                        <Input
                            type="text"
                            value={options.compareHash}
                            onChange={(e) => setToolData(effectiveId, { options: { ...options, compareHash: e.target.value }, meta: { isMatch: null } })}
                            className={`font-mono text-sm ${meta?.isMatch === true ? 'border-emerald-500/50 bg-emerald-500/10' : meta?.isMatch === false ? 'border-red-500/50 bg-red-500/10' : ''}`}
                            placeholder="Paste hash to compare with input password..."
                            fullWidth
                        />
                        <Button
                            variant="secondary"
                            onClick={handleCompare}
                            loading={loadingAction === 'Compare'}
                            className="w-full"
                        >
                            Compare Password to Hash
                        </Button>


                        {meta?.isMatch != null && (
                            <div className={`p-3 rounded-lg text-center font-bold ${meta.isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                                {meta.isMatch ? '✓ Match' : '✗ Do not match'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
