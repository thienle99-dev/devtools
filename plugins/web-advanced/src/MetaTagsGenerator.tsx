import React, { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useToolState } from '@store/toolStore';

import { TOOL_IDS } from '@tools/registry/tool-ids';
import type { BaseToolProps } from '@tools/registry/types';

const TOOL_ID = TOOL_IDS.META_TAGS_GENERATOR;

export const MetaTagsGenerator: React.FC<BaseToolProps> = ({ tabId }) => {
  const effectiveId = tabId || TOOL_ID;
  const { data: toolData, setToolData, addToHistory } = useToolState(effectiveId);

  useEffect(() => {
    addToHistory(TOOL_ID);
  }, [addToHistory]);

  const [values, setValues] = useState(toolData?.options || {
    title: '',
    description: '',
    keywords: '',
    author: '',
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'UTF-8',
    robots: 'index, follow'
  });

  const [output, setOutput] = useState('');

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const lines = [
      `<!-- Primary Meta Tags -->`,
      `<title>${values.title}</title>`,
      `<meta name="title" content="${values.title}">`,
      `<meta name="description" content="${values.description}">`,
      `<meta name="keywords" content="${values.keywords}">`,
      `<meta name="robots" content="${values.robots}">`,
      `<meta name="viewport" content="${values.viewport}">`,
      `<meta charset="${values.charset}">`,
      values.author ? `<meta name="author" content="${values.author}">` : '',
    ].filter(Boolean).join('\n');
    
    setOutput(lines);
    setToolData(effectiveId, { options: values, output: lines });
  }, [values, effectiveId, setToolData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const handleReset = () => {
    setValues({
      title: '',
      description: '',
      keywords: '',
      author: '',
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8',
      robots: 'index, follow'
    });
  };

  return (
    <ToolPane
      title="Meta Tags Generator"
      description="Generate standard SEO meta tags for your website"
      toolId={effectiveId}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Inputs */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Basic Information</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Page Title</label>
              <Input
                value={values.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. My Awesome Website"
                className="bg-muted/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of your page content..."
                className="w-full h-24 p-3 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Keywords (comma separated)</label>
              <Input
                value={values.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                placeholder="e.g. react, tools, generator"
                className="bg-muted/50 border-input"
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Author</label>
              <Input
                value={values.author}
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="e.g. John Doe"
                className="bg-muted/50 border-input"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
             <h3 className="font-semibold text-lg text-foreground">Advanced</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Viewport</label>
                  <Input
                    value={values.viewport}
                    onChange={(e) => handleChange('viewport', e.target.value)}
                    className="bg-muted/50 border-input"
                  />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Charset</label>
                  <select
                    value={values.charset}
                    onChange={(e) => handleChange('charset', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="UTF-8">UTF-8</option>
                    <option value="ISO-8859-1">ISO-8859-1</option>
                  </select>
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Robots</label>
                  <select
                    value={values.robots}
                    onChange={(e) => handleChange('robots', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="index, follow">Index, Follow</option>
                    <option value="index, nofollow">Index, No Follow</option>
                    <option value="noindex, follow">No Index, Follow</option>
                    <option value="noindex, nofollow">No Index, No Follow</option>
                  </select>
                </div>
             </div>
          </Card>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 rounded-t-lg">
             <h3 className="text-sm font-medium text-muted-foreground">Generated HTML</h3>
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
               <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto h-full language-html">
                  {output}
               </pre>
             </Card>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
