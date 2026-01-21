import { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ArrowRightLeft, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TOOL_ID = 'base64-url';

export const Base64UrlConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const process = (val: string, currentMode: 'encode' | 'decode') => {
    setInput(val);
    if (!val) {
      setOutput('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        // Encode: String -> Base64 -> Base64URL
        const b64 = btoa(val);
        const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        setOutput(b64url);
      } else {
        // Decode: Base64URL -> Base64 -> String
        let b64 = val.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with =
        while (b64.length % 4 !== 0) {
            b64 += '=';
        }
        const str = atob(b64);
        setOutput(str);
      }
    } catch (e) {
      setOutput('Error: Invalid input');
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    process(input, newMode); // Re-process with new mode? Or Swap?
    // User expects swap usually if input/output logic swaps, but here we just re-process input if it was text.
    // If user wants to swap, they can copy output to input.
    // Let's just re-calculate based on current input and new mode.
  };

  const handleCopy = () => {
    if (output && !output.startsWith('Error')) {
      navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <ToolPane
      title="Base64 URL Converter"
      description="Encode and decode data using Base64 URL-safe alphabet (RFC 4648)"
      toolId={TOOL_ID}
      onClear={() => { setInput(''); setOutput(''); }}
    >
      <div className="h-full flex flex-col p-4 md:grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="flex flex-col gap-2 h-full">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground">
                    {mode === 'encode' ? 'Text Input' : 'Base64 URL String'}
                </label>
                <Button variant="ghost" size="sm" onClick={() => setInput('')}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            <Card className="flex-1 p-0 overflow-hidden bg-muted/50 border-input">
                <textarea
                    value={input}
                    onChange={(e) => process(e.target.value, mode)}
                    className="w-full h-full bg-transparent border-none p-4 text-sm font-mono focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground"
                    placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 URL string to decode...'}
                />
            </Card>
        </div>

        {/* Controls (Mobile only, or middle) - hidden generally, relying on state */}

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
