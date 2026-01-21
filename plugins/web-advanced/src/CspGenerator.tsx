import { useState, useEffect, type ChangeEvent } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Checkbox } from '@components/ui/Checkbox';
import { Copy, RefreshCw, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
const TOOL_ID = 'csp-generator';

type Directive = 'default-src' | 'script-src' | 'style-src' | 'img-src' | 'connect-src' | 'font-src' | 'object-src' | 'media-src' | 'frame-src' | 'base-uri' | 'form-action';

const DIRECTIVES: { key: Directive; label: string }[] = [
  { key: 'default-src', label: 'Default Src' },
  { key: 'script-src', label: 'Script Src' },
  { key: 'style-src', label: 'Style Src' },
  { key: 'img-src', label: 'Image Src' },
  { key: 'connect-src', label: 'Connect Src' },
  { key: 'font-src', label: 'Font Src' },
  { key: 'object-src', label: 'Object Src' },
  { key: 'media-src', label: 'Media Src' },
  { key: 'frame-src', label: 'Frame Src' },
  { key: 'base-uri', label: 'Base URI' },
  { key: 'form-action', label: 'Form Action' },
];

interface CspRule {
  enabled: boolean;
  none: boolean;
  self: boolean;
  unsafeInline: boolean;
  unsafeEval: boolean;
  data: boolean; // data:
  blob: boolean; // blob:
  https: boolean; // https:
  custom: string[];
}

const initialRule: CspRule = {
    enabled: false,
    none: false,
    self: false,
    unsafeInline: false,
    unsafeEval: false,
    data: false,
    blob: false,
    https: false,
    custom: []
};

export const CspGenerator = () => {
  const [rules, setRules] = useState<Record<Directive, CspRule>>(() => {
      const initial: any = {};
      DIRECTIVES.forEach(d => initial[d.key] = { ...initialRule, enabled: d.key === 'default-src' ? true : false, self: d.key === 'default-src' ? true : false });
      return initial;
  });
  
  const [output, setOutput] = useState('');

  const updateRule = (directive: Directive, changes: Partial<CspRule>) => {
    setRules(prev => ({
        ...prev,
        [directive]: { ...prev[directive], ...changes }
    }));
  };

  const addCustom = (directive: Directive, value: string) => {
      if (!value) return;
      const current = rules[directive].custom;
      if (!current.includes(value)) {
          updateRule(directive, { custom: [...current, value] });
      }
  };

  const removeCustom = (directive: Directive, index: number) => {
      const current = [...rules[directive].custom];
      current.splice(index, 1);
      updateRule(directive, { custom: current });
  };

  useEffect(() => {
    const parts: string[] = [];
    
    DIRECTIVES.forEach(({ key }) => {
        const rule = rules[key];
        if (rule.enabled) {
            const values: string[] = [];
            if (rule.none) {
                values.push("'none'");
            } else {
                if (rule.self) values.push("'self'");
                if (rule.unsafeInline) values.push("'unsafe-inline'");
                if (rule.unsafeEval) values.push("'unsafe-eval'");
                if (rule.data) values.push("data:");
                if (rule.blob) values.push("blob:");
                if (rule.https) values.push("https:");
                rule.custom.forEach(c => values.push(c));
            }
            
            if (values.length > 0) {
                parts.push(`${key} ${values.join(' ')}`);
            }
        }
    });

    setOutput(parts.join('; '));
  }, [rules]);

  const handleCopy = () => {
      if (!output) return;
      navigator.clipboard.writeText(output);
      toast.success('CSP copied to clipboard');
  };

  const handleReset = () => {
    const initial: any = {};
    DIRECTIVES.forEach(d => initial[d.key] = { ...initialRule, enabled: d.key === 'default-src' ? true : false, self: d.key === 'default-src' ? true : false });
    setRules(initial);
  };

  return (
    <ToolPane
      title="CSP Generator"
      description="Generate Content Security Policy (CSP) headers"
      onClear={handleReset}
      toolId={TOOL_ID}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {DIRECTIVES.map(({ key, label }) => {
                const rule = rules[key];
                return (
                    <Card key={key} className={`p-4 space-y-3 transition-opacity ${rule.enabled ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={rule.enabled} 
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { enabled: e.target.checked })}
                                    label={label}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <code className="text-xs bg-muted px-1 py-0.5 rounded text-muted-foreground ml-2">{key}</code>
                            </div>
                        </div>

                        {rule.enabled && (
                            <div className="pl-8 space-y-3 animate-in fade-in slide-in-from-top-2 border-l-2 border-muted ml-2">
                                <div className="flex flex-wrap gap-4">
                                     <Checkbox 
                                        label="None"
                                        checked={rule.none} 
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { none: e.target.checked })} 
                                    />
                                    {!rule.none && (
                                        <>
                                            <Checkbox 
                                                label="'self'"
                                                checked={rule.self} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { self: e.target.checked })} 
                                            />
                                            <Checkbox 
                                                label="'unsafe-inline'"
                                                checked={rule.unsafeInline} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { unsafeInline: e.target.checked })} 
                                            />
                                            <Checkbox 
                                                label="'unsafe-eval'"
                                                checked={rule.unsafeEval} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { unsafeEval: e.target.checked })} 
                                            />
                                            <Checkbox 
                                                label="data:"
                                                checked={rule.data} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { data: e.target.checked })} 
                                            />
                                            <Checkbox 
                                                label="blob:"
                                                checked={rule.blob} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { blob: e.target.checked })} 
                                            />
                                            <Checkbox 
                                                label="https:"
                                                checked={rule.https} 
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateRule(key, { https: e.target.checked })} 
                                            />
                                        </>
                                    )}
                                </div>
                                
                                {!rule.none && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2 flex-wrap">
                                            {rule.custom.map((domain, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm border border-border">
                                                    <span>{domain}</span>
                                                    <button onClick={() => removeCustom(key, idx)} className="text-muted-foreground hover:text-destructive">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Add domain (e.g. google.com)" 
                                                className="bg-muted/50 border-input h-8 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addCustom(key, e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                            <Button size="sm" variant="ghost" className="h-8" onClick={(e: any) => {
                                                 const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                 if (input && input.value) {
                                                     addCustom(key, input.value);
                                                     input.value = '';
                                                 }
                                            }}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 rounded-t-lg">
             <h3 className="text-sm font-medium text-muted-foreground">Generated Policy</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex-1 p-0 overflow-hidden">
             <Card className="h-full p-0 overflow-hidden bg-background border-border rounded-b-lg rounded-t-none">
               <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto h-full language-text break-all">
                  {output || <span className="text-muted-foreground italic">Policy will appear here...</span>}
               </pre>
             </Card>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
              Tip: Start with a strict <code>default-src</code> and unlock resources as needed.
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
