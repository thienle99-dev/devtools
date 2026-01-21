import { useState, useEffect, type ChangeEvent } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Helper Input component with Label
const ManifestInput = ({ label, className, ...props }: any) => (
    <div className={`space-y-2 ${className}`}>
        {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
        <div className="relative">
            <input
                {...props}
                className={`flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`}
            />
        </div>
    </div>
);

export const ManifestGenerator = () => {
  const [data, setData] = useState({
      name: '',
      short_name: '',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'any',
      scope: '/',
      description: ''
  });
  
  const [output, setOutput] = useState('');

  const updateField = (key: string, value: string) => {
      setData(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
      const manifest = {
          name: data.name,
          short_name: data.short_name,
          start_url: data.start_url,
          display: data.display,
          background_color: data.background_color,
          theme_color: data.theme_color,
          orientation: data.orientation,
          scope: data.scope,
          description: data.description,
          icons: [
              {
                  src: "/icon-192x192.png",
                  sizes: "192x192",
                  type: "image/png"
              },
              {
                  src: "/icon-256x256.png",
                  sizes: "256x256",
                  type: "image/png"
              },
              {
                  src: "/icon-384x384.png",
                  sizes: "384x384",
                  type: "image/png"
              },
              {
                  src: "/icon-512x512.png",
                  sizes: "512x512",
                  type: "image/png"
              }
          ]
      };
      
      // Remove empty strings if desired, but manifest usually prefers presence.
      // Actually let's clean up optional description
      if (!manifest.description) delete (manifest as any).description;

      setOutput(JSON.stringify(manifest, null, 2));
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('manifest.json copied to clipboard');
  };

  const handleReset = () => {
      setData({
          name: '',
          short_name: '',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#000000',
          orientation: 'any',
          scope: '/',
          description: ''
      });
  };

  return (
    <ToolPane
      title="Manifest.json Generator"
      description="Generate a Web App Manifest for Progressive Web Apps (PWA)"
      onClear={handleReset}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Input */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <Card className="p-4 space-y-4">
                 <h3 className="font-semibold text-lg text-foreground">App Info</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ManifestInput label="App Name" value={data.name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} placeholder="My PWA" />
                    <ManifestInput label="Short Name" value={data.short_name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('short_name', e.target.value)} placeholder="MyPWA" />
                 </div>
                 <ManifestInput label="Description" value={data.description} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('description', e.target.value)} placeholder="Traceable, performant, and scaleable..." />
            </Card>

            <Card className="p-4 space-y-4">
                 <h3 className="font-semibold text-lg text-foreground">Display & Appearance</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Display Mode</label>
                        <select 
                            value={data.display}
                            onChange={(e) => updateField('display', e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            <option value="standalone">Standalone</option>
                            <option value="fullscreen">Fullscreen</option>
                            <option value="minimal-ui">Minimal UI</option>
                            <option value="browser">Browser</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Orientation</label>
                         <select 
                            value={data.orientation}
                            onChange={(e) => updateField('orientation', e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            <option value="any">Any</option>
                            <option value="natural">Natural</option>
                            <option value="landscape">Landscape</option>
                            <option value="portrait">Portrait</option>
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Theme Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={data.theme_color} onChange={(e) => updateField('theme_color', e.target.value)} className="h-10 w-10 p-0 border-0 rounded bg-transparent cursor-pointer" />
                            <ManifestInput value={data.theme_color} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('theme_color', e.target.value)} className="flex-1" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Background Color</label>
                         <div className="flex gap-2">
                            <input type="color" value={data.background_color} onChange={(e) => updateField('background_color', e.target.value)} className="h-10 w-10 p-0 border-0 rounded bg-transparent cursor-pointer" />
                            <ManifestInput value={data.background_color} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('background_color', e.target.value)} className="flex-1" />
                        </div>
                    </div>
                 </div>
            </Card>

             <Card className="p-4 space-y-4">
                 <h3 className="font-semibold text-lg text-foreground">URLs</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ManifestInput label="Start URL" value={data.start_url} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('start_url', e.target.value)} placeholder="/" />
                    <ManifestInput label="Scope" value={data.scope} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('scope', e.target.value)} placeholder="/" />
                 </div>
            </Card>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 rounded-t-lg">
             <h3 className="text-sm font-medium text-muted-foreground">Generated manifest.json</h3>
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
               <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap overflow-auto h-full language-json">
                  {output}
               </pre>
             </Card>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
