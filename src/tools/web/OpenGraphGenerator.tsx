import { useState, useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const OpenGraphGenerator = () => {
  const [values, setValues] = useState({
    title: '',
    siteName: '',
    url: '',
    description: '',
    image: '',
    type: 'website',
    cardType: 'summary_large_image'
  });

  const [output, setOutput] = useState('');

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const lines = [
      `<!-- Open Graph / Facebook -->`,
      `<meta property="og:type" content="${values.type}">`,
      `<meta property="og:url" content="${values.url}">`,
      `<meta property="og:title" content="${values.title}">`,
      `<meta property="og:description" content="${values.description}">`,
      `<meta property="og:image" content="${values.image}">`,
      values.siteName ? `<meta property="og:site_name" content="${values.siteName}">` : '',
      
      '',
      `<!-- Twitter -->`,
      `<meta property="twitter:card" content="${values.cardType}">`,
      `<meta property="twitter:url" content="${values.url}">`,
      `<meta property="twitter:title" content="${values.title}">`,
      `<meta property="twitter:description" content="${values.description}">`,
      `<meta property="twitter:image" content="${values.image}">`,
    ].filter(line => line !== '').join('\n'); // Keep empty lines for separation
    
    setOutput(lines);
  }, [values]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const handleReset = () => {
    setValues({
      title: '',
      siteName: '',
      url: '',
      description: '',
      image: '',
      type: 'website',
      cardType: 'summary_large_image'
    });
  };

  return (
    <ToolPane
      title="Open Graph Generator"
      description="Generate Open Graph and Twitter Card meta tags not social sharing"
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Inputs */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-foreground">General Info</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Site Name</label>
              <Input
                value={values.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                placeholder="e.g. My Brand"
                className="bg-muted/50 border-input"
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Page Title</label>
              <Input
                value={values.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Amazing Content"
                className="bg-muted/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Page URL</label>
              <Input
                value={values.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com/page"
                className="bg-muted/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description shown in social previews..."
                className="w-full h-24 p-3 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
             <h3 className="font-semibold text-lg text-foreground">Media & Type</h3>
             <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Image URL</label>
              <Input
                value={values.image}
                onChange={(e) => handleChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-muted/50 border-input"
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Content Type</label>
                  <select
                    value={values.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="website">Website</option>
                    <option value="article">Article</option>
                    <option value="profile">Profile</option>
                    <option value="book">Book</option>
                    <option value="music.song">Music Song</option>
                    <option value="video.movie">Video Movie</option>
                  </select>
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Twitter Card</label>
                  <select
                    value={values.cardType}
                    onChange={(e) => handleChange('cardType', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
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
