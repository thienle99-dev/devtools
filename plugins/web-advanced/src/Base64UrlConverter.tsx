import { useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ArrowRightLeft, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { BaseToolProps } from '@tools/registry/types';
import { TOOL_IDS } from '@tools/registry/tool-ids';
import { useToolState } from '@store/toolStore';
import { base64UrlEncode, base64UrlDecode } from './logic';

const TOOL_ID = TOOL_IDS.BASE64_URL;

export const Base64UrlConverter: React.FC<BaseToolProps> = ({ tabId }) => {
  const effectiveId = tabId || TOOL_ID;
  const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);

  const data = toolData || {
    input: '',
    output: '',
    options: { mode: 'encode' }
  };

  const { input, output, options } = data;
  const mode = options.mode;

  useEffect(() => {
    if (input) {
      addToHistory(effectiveId);
    }
  }, [input, addToHistory, effectiveId]);

  const process = (val: string, currentMode: 'encode' | 'decode') => {
    let result = '';
    if (val) {
      if (currentMode === 'encode') {
        result = base64UrlEncode(val);
      } else {
        result = base64UrlDecode(val);
      }
    }

    setToolData(effectiveId, {
      input: val,
      output: result,
      options: { mode: currentMode }
    });
  };

  const toggleMode = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    process(input, newMode);
  };

  const handleCopy = () => {
    if (output && !output.startsWith('Error')) {
      navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard');
    }
  };

  const handleClear = () => clearToolData(effectiveId);

  return (
    <ToolPane
      title="Base64 URL Converter"
      description="Encode and decode data using Base64 URL-safe alphabet (RFC 4648)"
      toolId={effectiveId}
      onClear={handleClear}
    >
      <div className="h-full flex flex-col p-4 md:grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">
              {mode === 'encode' ? 'Text Input' : 'Base64 URL String'}
            </label>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Card className="flex-1 p-0 overflow-hidden bg-muted/50 border-input">
            <textarea
              value={input}
              onChange={(e) => process(e.target.value, mode as 'encode' | 'decode')}
              className="w-full h-full bg-transparent border-none p-4 text-sm font-mono focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground"
              placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 URL string to decode...'}
            />
          </Card>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2 h-full relative">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">
              {mode === 'encode' ? 'Base64 URL Output' : 'Decoded Text'}
            </label>
            <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output || output.startsWith('Error')}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Card className="flex-1 p-0 overflow-hidden bg-muted/50 border-input relative group">
            <textarea
              readOnly
              value={output}
              className="w-full h-full bg-transparent border-none p-4 text-sm font-mono focus:ring-0 resize-none text-primary placeholder:text-muted-foreground"
              placeholder="Result..."
            />
            {/* Swap Button Absolute Center (Desktop) or top (Mobile) */}
            <div className="absolute top-1/2 -left-3 transform -translate-y-1/2 -translate-x-full md:block hidden z-10">
              <Button
                size="sm"
                className="rounded-full w-8 h-8 p-0 bg-secondary border border-border hover:bg-secondary/80 shadow-xl"
                onClick={toggleMode}
                title={`Switch to ${mode === 'encode' ? 'Decode' : 'Encode'}`}
              >
                <ArrowRightLeft className="w-4 h-4 text-secondary-foreground" />
              </Button>
            </div>
          </Card>

          <div className="md:hidden flex justify-center py-2">
            <Button onClick={toggleMode} variant="outline" className="w-full">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
            </Button>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
