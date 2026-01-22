import { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'http-headers';

export const HttpHeaderParser = () => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<Record<string, string>>({});
  const [jsonOutput, setJsonOutput] = useState('');

  useEffect(() => {
    if (!input.trim()) {
      setParsed({});
      setJsonOutput('');
      return;
    }

    const lines = input.split(/\r?\n/);
    const result: Record<string, string> = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        if (key) {
          result[key] = value;
        }
      } else if (trimmed.startsWith('GET') || trimmed.startsWith('POST') || trimmed.startsWith('PUT') || trimmed.startsWith('DELETE') || trimmed.startsWith('PATCH')) {
         // Ignore request line
      } else {
        // Handle malformed or continued lines? 
        // For simplicity, maybe just treat as key if no colon? No, likely garbage or continuation.
        // Let's ignore for now.
      }
    });

    setParsed(result);
    setJsonOutput(JSON.stringify(result, null, 2));
  }, [input]);

  const handleCopyJson = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    toast.success('JSON copied to clipboard');
  };

  return (
    <ToolPane
      title="HTTP Headers Parser"
      description="Parse raw HTTP headers into JSON and Key-Value pairs"
      onClear={() => setInput('')}
      toolId={TOOL_ID}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Input */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-0 overflow-hidden bg-muted/50 border-input flex flex-col relative">
             <div className="p-2 border-b border-input flex justify-between items-center bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Raw Headers</span>
                <Button variant="ghost" size="sm" onClick={() => setInput('')} title="Clear">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Content-Type: application/json\nAuthorization: Bearer token...\nUser-Agent: Mozilla/5.0...`}
              className="flex-1 w-full bg-transparent border-none p-4 text-sm font-mono focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground"
            />
          </Card>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 p-0 overflow-hidden bg-background border-border flex flex-col">
                 <div className="p-2 border-b border-border flex justify-between items-center bg-muted/20">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parsed JSON</span>
                    <Button variant="ghost" size="sm" onClick={handleCopyJson} disabled={!jsonOutput}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <pre className="flex-1 p-4 text-sm font-mono text-foreground overflow-auto">
                    {jsonOutput || <span className="text-muted-foreground italic">Result will appear here...</span>}
                </pre>
            </Card>

            {Object.keys(parsed).length > 0 && (
                 <Card className="h-1/2 overflow-auto bg-background border-border p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 font-medium">Header</th>
                                <th className="px-4 py-2 font-medium">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Object.entries(parsed).map(([key, value]) => (
                                <tr key={key} className="hover:bg-muted/10 group">
                                    <td className="px-4 py-2 font-mono text-primary font-medium whitespace-nowrap">{key}</td>
                                    <td className="px-4 py-2 font-mono text-foreground break-all">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </Card>
            )}
        </div>
      </div>
    </ToolPane>
  );
};
