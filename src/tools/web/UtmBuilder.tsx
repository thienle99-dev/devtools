import { useState, useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Copy, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export const UtmBuilder = () => {
  const [values, setValues] = useState({
    baseUrl: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  });

  const [output, setOutput] = useState('');

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    try {
      if (!values.baseUrl) {
        setOutput('');
        return;
      }

      const url = new URL(values.baseUrl);
      
      if (values.source) url.searchParams.set('utm_source', values.source);
      if (values.medium) url.searchParams.set('utm_medium', values.medium);
      if (values.campaign) url.searchParams.set('utm_campaign', values.campaign);
      if (values.term) url.searchParams.set('utm_term', values.term);
      if (values.content) url.searchParams.set('utm_content', values.content);

      setOutput(url.toString());
    } catch (e) {
      // Invalid URL, just return base or nothing
       if (values.baseUrl && !values.baseUrl.startsWith('http')) {
           // Try to fix basic missing protocol
           try {
               const url = new URL('https://' + values.baseUrl);
               if (values.source) url.searchParams.set('utm_source', values.source);
               if (values.medium) url.searchParams.set('utm_medium', values.medium);
               if (values.campaign) url.searchParams.set('utm_campaign', values.campaign);
               if (values.term) url.searchParams.set('utm_term', values.term);
               if (values.content) url.searchParams.set('utm_content', values.content);
               setOutput(url.toString());
               return;
           } catch (ignored) {}
       }
       setOutput(''); 
    }
  }, [values]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success('Generated URL copied to clipboard');
  };

  const handleReset = () => {
    setValues({
      baseUrl: '',
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: ''
    });
  };

  return (
    <ToolPane
      title="UTM Builder"
      description="Generate URLs with UTM parameters for campaign tracking"
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Inputs */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-white">Website URL</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Website URL *</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  value={values.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="pl-9 bg-gray-800/50 border-gray-700"
                />
              </div>
              <p className="text-xs text-gray-500">The full website URL (e.g. https://www.example.com)</p>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
             <h3 className="font-semibold text-lg text-white">Campaign Parameters</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Campaign Source *</label>
                  <Input
                    value={values.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    placeholder="google, newsletter"
                    className="bg-gray-800/50 border-gray-700"
                  />
                  <p className="text-xs text-gray-500">utm_source: The referrer (e.g. google, newsletter)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Campaign Medium *</label>
                  <Input
                    value={values.medium}
                    onChange={(e) => handleChange('medium', e.target.value)}
                    placeholder="cpc, banner, email"
                    className="bg-gray-800/50 border-gray-700"
                  />
                  <p className="text-xs text-gray-500">utm_medium: Marketing medium (e.g. cpc, banner, email)</p>
                </div>
             </div>
             
             <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Campaign Name *</label>
                  <Input
                    value={values.campaign}
                    onChange={(e) => handleChange('campaign', e.target.value)}
                    placeholder="spring_sale"
                    className="bg-gray-800/50 border-gray-700"
                  />
                  <p className="text-xs text-gray-500">utm_campaign: Product, promo code, or slogan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Campaign Term</label>
                  <Input
                    value={values.term}
                    onChange={(e) => handleChange('term', e.target.value)}
                    placeholder="running+shoes"
                    className="bg-gray-800/50 border-gray-700"
                  />
                   <p className="text-xs text-gray-500">utm_term: Identify the paid keywords</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Campaign Content</label>
                  <Input
                    value={values.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="logolink"
                    className="bg-gray-800/50 border-gray-700"
                  />
                  <p className="text-xs text-gray-500">utm_content: Use to differentiate ads</p>
                </div>
            </div>
          </Card>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/20 rounded-t-lg">
             <h3 className="text-sm font-medium text-gray-400">Generated URL</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={handleCopy} disabled={!output}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-950 border-gray-800 rounded-b-lg rounded-t-none border-x border-b">
             <Card className="w-full p-6 bg-transparent border-none break-all text-center shadow-none">
               {output ? (
                   <span className="text-lg font-mono text-blue-400 select-all">{output}</span>
               ) : (
                   <span className="text-gray-500 italic">Enter website URL and parameters to generate a link</span>
               )}
             </Card>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
