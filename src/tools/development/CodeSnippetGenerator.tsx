import React from 'react';
import { useToolState } from '../../store/toolStore';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { CodeEditor } from '@components/ui/CodeEditor';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSnippet, type RequestData } from './snippet-logic';

const TOOL_ID = 'code-snippet-generator';

const METHODS = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' },
];

const LANGUAGES = [
    { value: 'curl', label: 'cURL' },
    { value: 'javascript-fetch', label: 'JavaScript (Fetch)' },
    { value: 'python-requests', label: 'Python (Requests)' },
    { value: 'node-axios', label: 'Node.js (Axios)' },
];

export const CodeSnippetGenerator: React.FC = () => {
    const { data, setToolData } = useToolState(TOOL_ID);

    const initialData: RequestData = {
        method: 'GET',
        url: 'https://api.example.com/v1/users',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{\n  "key": "value"\n}'
    };

    const request = ((data as any)?.request as RequestData) || initialData;
    const language = ((data as any)?.language as string) || 'curl';

    const updateRequest = (updates: Partial<RequestData>) => {
        setToolData(TOOL_ID, { request: { ...request, ...updates } } as any);
    };

    const addHeader = () => {
        updateRequest({ headers: [...request.headers, { key: '', value: '' }] });
    };

    const updateHeader = (index: number, key: string, value: string) => {
        const newHeaders = [...request.headers];
        newHeaders[index] = { key, value };
        updateRequest({ headers: newHeaders });
    };

    const removeHeader = (index: number) => {
        updateRequest({ headers: request.headers.filter((_, i) => i !== index) });
    };

    const snippet = generateSnippet(request, language);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(snippet);
        toast.success('Copied to clipboard');
    };
    
    // Map internal language ID to CodeEditor's supported languages (or 'text' if not supported)
    const getEditorLanguage = (lang: string): 'javascript' | 'json' | 'text' => {
        if (lang.includes('javascript') || lang.includes('node')) return 'javascript';
        // Python and bash are not strictly supported by the current CodeEditor props, defaulting to text or available ones
        // If CodeEditor supports specific strings, we'd use them. Based on package.json, we have CSS, HTML, JS, JSON, SQL, XML, YAML.
        // We do strictly enforce the type in props, so we must return one of the allowed literals.
        return 'text';
    };

    return (
        <ToolPane
            title="Code Snippet Generator"
            description="Generate HTTP request code snippets for various languages."
            onClear={() => {}}
        >
            <div className="flex flex-col h-full gap-4 md:flex-row">
                {/* Configuration Panel */}
                <div className="md:w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="glass-panel p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground/80">Request Details</h3>
                        <div className="flex gap-2">
                            <div className="w-28">
                                <Select
                                    value={request.method}
                                    onChange={(e) => updateRequest({ method: e.target.value })}
                                    options={METHODS}
                                />
                            </div>
                            <Input
                                value={request.url}
                                onChange={(e) => updateRequest({ url: e.target.value })}
                                placeholder="https://api.example.com/..."
                                className="flex-1 font-mono text-sm"
                            />
                        </div>

                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-foreground/80">Headers</label>
                                <Button variant="ghost" size="sm" onClick={addHeader} className="h-6 w-6 p-0">
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {request.headers.map((h, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            value={h.key}
                                            onChange={(e) => updateHeader(i, e.target.value, h.value)}
                                            placeholder="Key"
                                            className="flex-1 h-8 text-xs font-mono"
                                        />
                                        <Input
                                            value={h.value}
                                            onChange={(e) => updateHeader(i, h.key, e.target.value)}
                                            placeholder="Value"
                                            className="flex-1 h-8 text-xs font-mono"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeHeader(i)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                            <div className="space-y-2 flex-1 flex flex-col">
                                <label className="text-xs font-medium text-foreground/80">Body (JSON)</label>
                                <div className="h-48 border border-border/50 rounded-lg overflow-hidden">
                                    <CodeEditor
                                        value={request.body}
                                        onChange={(val) => updateRequest({ body: val })}
                                        language="json"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Output Panel */}
                <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
                        <div className="w-48">
                            <Select
                                value={language}
                                onChange={(e) => setToolData(TOOL_ID, { language: e.target.value } as any)}
                                options={LANGUAGES}
                                variant="outline"
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyToClipboard} 
                            icon={Copy}
                        >
                            Copy Code
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor
                            value={snippet}
                            language={getEditorLanguage(language)}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
