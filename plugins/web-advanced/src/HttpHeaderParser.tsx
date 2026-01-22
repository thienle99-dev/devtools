import React, { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';
import { parseHttpHeaders } from './logic';

const TOOL_ID = TOOL_IDS.HTTP_HEADER_PARSER;

export const HttpHeaderParser: React.FC<BaseToolProps> = ({ tabId }) => {
  const effectiveId = tabId || TOOL_ID;
  const { data: toolData, setToolData, addToHistory } = useToolState(effectiveId);

  const [input, setInput] = useState(toolData?.input || '');
  const [parsed, setParsed] = useState<Record<string, string>>({});
  const [jsonOutput, setJsonOutput] = useState('');

  useEffect(() => {
    addToHistory(TOOL_ID);
  }, [addToHistory]);

  useEffect(() => {
    const result = parseHttpHeaders(input);
    setParsed(result);
    setJsonOutput(Object.keys(result).length > 0 ? JSON.stringify(result, null, 2) : '');
    setToolData(effectiveId, { input });
  }, [input, effectiveId, setToolData]);

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
      toolId={effectiveId}
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
