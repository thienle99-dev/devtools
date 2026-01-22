import React from 'react';
import { faker } from '@faker-js/faker';
import { useToolState } from '@store/toolStore';
import { ToolPane } from '@components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Trash2, Plus, RefreshCw, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { VirtualizedOutput } from '@components/ui/VirtualizedOutput';
import { useTask } from '@/hooks/useTask';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.MOCK_DATA_GENERATOR;

const FIELD_TYPES = [
    { value: 'id', label: 'UUID' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'avatar', label: 'Avatar URL' },
    { value: 'date', label: 'Date (Past)' },
    { value: 'company', label: 'Company Name' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'country', label: 'Country' },
    { value: 'lorem', label: 'Lorem Ipsum (Sentence)' },
    { value: 'number', label: 'Random Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'userName', label: 'Username' },
    { value: 'website', label: 'Website URL' },
    { value: 'jobTitle', label: 'Job Title' },
    { value: 'price', label: 'Price' },
];

interface FieldConfig {
    id: string;
    name: string;
    type: string;
}

export const MockDataGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data, setToolData } = useToolState(effectiveId);
    const { runTask } = useTask(effectiveId);

    const initialFields: FieldConfig[] = [
        { id: '1', name: 'id', type: 'id' },
        { id: '2', name: 'name', type: 'firstName' },
        { id: '3', name: 'email', type: 'email' }
    ];

    const fields = (data?.options?.fields as FieldConfig[]) || initialFields;
    const count = (data?.options?.count as number) || 10;
    const output = data?.output || '';

    const updateFields = (newFields: FieldConfig[]) => {
        setToolData(effectiveId, { options: { ...data?.options, fields: newFields } });
    };

    const updateCount = (newCount: number) => {
        setToolData(effectiveId, { options: { ...data?.options, count: newCount } });
    };

    const addField = () => {
        const newField: FieldConfig = {
            id: Math.random().toString(36).substring(7),
            name: 'newField',
            type: 'firstName'
        };
        updateFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        updateFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<FieldConfig>) => {
        updateFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const generateData = async () => {
        await runTask('Generating Mock Data', async (updateProgress) => {
            const result = [];

            // Chunk generation to not block UI heavily and allow progress update
            const chunkSize = 100;
            const chunks = Math.ceil(count / chunkSize);

            for (let i = 0; i < chunks; i++) {
                const chunkData = [];
                const start = i * chunkSize;
                const end = Math.min((i + 1) * chunkSize, count);

                for (let j = start; j < end; j++) {
                    const obj: Record<string, any> = {};
                    fields.forEach(field => {
                        switch (field.type) {
                            case 'id': obj[field.name] = faker.string.uuid(); break;
                            case 'firstName': obj[field.name] = faker.person.firstName(); break;
                            case 'lastName': obj[field.name] = faker.person.lastName(); break;
                            case 'email': obj[field.name] = faker.internet.email(); break;
                            case 'phone': obj[field.name] = faker.phone.number(); break;
                            case 'avatar': obj[field.name] = faker.image.avatar(); break;
                            case 'date': obj[field.name] = faker.date.past().toISOString(); break;
                            case 'company': obj[field.name] = faker.company.name(); break;
                            case 'address': obj[field.name] = faker.location.streetAddress(); break;
                            case 'city': obj[field.name] = faker.location.city(); break;
                            case 'country': obj[field.name] = faker.location.country(); break;
                            case 'lorem': obj[field.name] = faker.lorem.sentence(); break;
                            case 'number': obj[field.name] = faker.number.int({ min: 1, max: 1000 }); break;
                            case 'boolean': obj[field.name] = faker.datatype.boolean(); break;
                            case 'userName': obj[field.name] = faker.internet.username(); break;
                            case 'website': obj[field.name] = faker.internet.url(); break;
                            case 'jobTitle': obj[field.name] = faker.person.jobTitle(); break;
                            case 'price': obj[field.name] = faker.commerce.price(); break;
                            default: obj[field.name] = '';
                        }
                    });
                    chunkData.push(obj);
                }
                result.push(...chunkData);

                // Yield to event loop to keep UI responsive and update progress
                if (i % 5 === 0) {
                    updateProgress((i / chunks) * 100);
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            const jsonOutput = JSON.stringify(result, null, 2);
            setToolData(effectiveId, { output: jsonOutput });
            return jsonOutput;
        }, { warningThresholdMs: 5000 });
    };

    const copyToClipboard = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        toast.success('Copied to clipboard');
    };

    const downloadFile = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mock_data_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolPane
            toolId={effectiveId}
            title="Mock Data Generator"
            description="Generate realistic random data sets for testing."
            onClear={() => { }}
        >
            <div className="flex flex-col h-full gap-4 md:flex-row">
                {/* Configuration Panel */}
                <div className="md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="glass-panel p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-foreground/80">Schema</h3>
                            <div className="text-xs text-muted-foreground">{fields.length} fields</div>
                        </div>

                        <div className="space-y-3">
                            {fields.map(field => (
                                <div key={field.id} className="flex gap-2 items-start bg-background/30 p-2 rounded-lg border border-border/50">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={field.name}
                                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                                            placeholder="Field Name"
                                            className="h-8 text-xs font-mono"
                                        />
                                        <Select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, { type: e.target.value })}
                                            options={FIELD_TYPES}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeField(field.id)}
                                        className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="secondary"
                            onClick={addField}
                            className="w-full text-xs"
                            icon={Plus}
                        >
                            Add Field
                        </Button>
                    </div>

                    <div className="glass-panel p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground/80">Rows to Generate</label>
                            <Input
                                type="number"
                                value={count}
                                onChange={(e) => updateCount(parseInt(e.target.value) || 1)}
                                min={1}
                                max={10000}
                                className="font-mono"
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={generateData}
                            className="w-full"
                            icon={RefreshCw}
                        >
                            Generate Data
                        </Button>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
                        <div className="text-xs font-mono text-muted-foreground">
                            {output ? `${(JSON.parse(output) as any[]).length} records` : '0 records'}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyToClipboard}
                                disabled={!output}
                                icon={Copy}
                            >
                                Copy
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={downloadFile}
                                disabled={!output}
                                icon={Download}
                            >
                                Download
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-black/5 dark:bg-black/20 p-4">
                        <VirtualizedOutput content={output} />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
