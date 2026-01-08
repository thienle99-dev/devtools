import React, { useEffect } from 'react';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { ulid } from 'ulid';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Input } from '@components/ui/Input';
import { Checkbox } from '@components/ui/Checkbox';
import { TextArea } from '@components/ui/TextArea';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';

const TOOL_ID = 'uuid-generator';

interface UuidGeneratorProps {
    tabId?: string;
}

export const UuidGenerator: React.FC<UuidGeneratorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

    const data = toolData || {
        options: {
            count: 1,
            type: 'v4', // v1, v4, ulid
            hyphens: true,
            uppercase: false
        },
        output: ''
    };

    const { options, output } = data;

    // We can't immediately generate in useEffect because it might cause infinite loop or double render issues if strict mode.
    // Also, if we switch tabs, we don't necessarily want to regenerate.
    // We only want to generate if output is EMPTY and it's a NEW instance?
    // Actually, persisting output is good.
    useEffect(() => {
        addToHistory(TOOL_ID);
        if (!output) {
            // Defer generation to avoid "update during render" if strictly needed, but let's try direct call or wrapped in tiny timeout if issues.
            // Actually, calling setToolData here is fine in useEffect.
            generate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addToHistory]); // Only run on mount/history add? No, we need effectiveId stability.
    // If we include effectiveId, and it changes (unlikely for same component instance), it runs again.
    // If data.output is already there, it won't regen.

    const updateOption = (key: string, value: string | number | boolean) => {
        setToolData(effectiveId, { options: { ...options, [key]: value } });
    };

    const generate = () => {
        const count = Math.min(Math.max(1, options.count || 1), 100);
        const type = options.type || 'v4';
        const ids: string[] = [];

        for (let i = 0; i < count; i++) {
            let id = '';
            if (type === 'v1') id = uuidv1();
            else if (type === 'ulid') id = ulid();
            else id = uuidv4(); // default v4

            if (!options.hyphens && type !== 'ulid') {
                id = id.replace(/-/g, '');
            }
            if (options.uppercase) {
                id = id.toUpperCase();
            }
            ids.push(id);
        }

        setToolData(effectiveId, { output: ids.join('\n') });
    };

    const handleClear = () => clearToolData(effectiveId);
    const handleCopy = () => { if (output) navigator.clipboard.writeText(output); };

    return (
        <ToolPane
            title="UUID / ULID Generator"
            description="Generate UUIDs (v1, v4) and ULIDs"
            onClear={handleClear}
            onCopy={handleCopy}
            actions={<Button variant="primary" onClick={generate}>Generate</Button>}
        >
            <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                        label="Type"
                        value={options.type}
                        onChange={(e) => updateOption('type', e.target.value)}
                        options={[
                            { label: 'UUID v4 (Random)', value: 'v4' },
                            { label: 'UUID v1 (Time-based)', value: 'v1' },
                            { label: 'ULID (Sortable)', value: 'ulid' }
                        ]}
                        fullWidth
                    />
                    
                    <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        max="100"
                        value={options.count}
                        onChange={(e) => updateOption('count', parseInt(e.target.value))}
                        fullWidth
                    />

                    <div className="flex items-end pb-2">
                        <Checkbox
                            id="hyphens"
                            label="Hyphens"
                            checked={options.hyphens}
                            disabled={options.type === 'ulid'}
                            onChange={(e) => updateOption('hyphens', e.target.checked)}
                        />
                    </div>
                    
                    <div className="flex items-end pb-2">
                        <Checkbox
                            id="uppercase"
                            label="Uppercase"
                            checked={options.uppercase}
                            onChange={(e) => updateOption('uppercase', e.target.checked)}
                        />
                    </div>
                </div>

                <div className="flex-1 relative">
                    <TextArea
                        readOnly
                        value={output}
                        className="h-full font-mono text-sm resize-none"
                        fullWidth
                    />
                </div>
            </div>
        </ToolPane>
    );
};
