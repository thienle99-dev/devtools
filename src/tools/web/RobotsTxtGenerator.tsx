import { useState, useEffect } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Copy, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export const RobotsTxtGenerator = () => {
  const [rules, setRules] = useState<Rule[]>([
    { userAgent: '*', allow: [], disallow: [] }
  ]);
  const [siemap, setSitemap] = useState('');
  const [output, setOutput] = useState('');

  const updateOutput = () => {
    let txt = '';
    rules.forEach((rule, index) => {
      txt += `User-agent: ${rule.userAgent}\n`;
      rule.allow.forEach(path => {
        txt += `Allow: ${path}\n`;
      });
      rule.disallow.forEach(path => {
        txt += `Disallow: ${path}\n`;
      });
      if (index < rules.length - 1) txt += '\n';
    });

    if (siemap) {
      if (txt) txt += '\n';
      txt += `Sitemap: ${siemap}`;
    }

    setOutput(txt);
  };

  useEffect(() => {
    updateOutput();
  }, [rules, siemap]);

  const addRule = () => {
    setRules([...rules, { userAgent: '*', allow: [], disallow: [] }]);
  };

  const removeRule = (index: number) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    // @ts-ignore
    newRules[index][field] = value;
    setRules(newRules);
  };

  const addPath = (index: number, type: 'allow' | 'disallow') => {
    const newRules = [...rules];
    newRules[index][type].push('/');
    setRules(newRules);
  };

  const updatePath = (ruleIndex: number, type: 'allow' | 'disallow', pathIndex: number, value: string) => {
    const newRules = [...rules];
    newRules[ruleIndex][type][pathIndex] = value;
    setRules(newRules);
  };

  const removePath = (ruleIndex: number, type: 'allow' | 'disallow', pathIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex][type].splice(pathIndex, 1);
    setRules(newRules);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const handleReset = () => {
    setRules([{ userAgent: '*', allow: [], disallow: [] }]);
    setSitemap('');
  };

  return (
    <ToolPane
      title="Robots.txt Generator"
      description="Generate robots.txt file for search engine crawlers"
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Configuration */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <Card className="p-4 space-y-4">
             <h3 className="font-semibold text-lg text-white">Sitemap</h3>
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Sitemap URL</label>
              <Input
                value={siemap}
                onChange={(e) => setSitemap(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                className="bg-gray-800/50 border-gray-700"
              />
            </div>
          </Card>

          {rules.map((rule, ruleIndex) => (
            <Card key={ruleIndex} className="p-4 space-y-4 relative group">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2">
                 <h3 className="font-semibold text-lg text-white">Rule Config</h3>
                 {rules.length > 1 && (
                     <Button variant="ghost" size="sm" onClick={() => removeRule(ruleIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                         <Trash2 className="w-4 h-4" />
                     </Button>
                 )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">User Agent</label>
                <div className="flex gap-2">
                    <Input
                        value={rule.userAgent}
                        onChange={(e) => updateRule(ruleIndex, 'userAgent', e.target.value)}
                        placeholder="*"
                        className="bg-gray-800/50 border-gray-700"
                    />
                    <select 
                        className="bg-gray-800/50 border border-gray-700 rounded-lg px-2 text-sm text-gray-300"
                        onChange={(e) => updateRule(ruleIndex, 'userAgent', e.target.value)}
                        value={rule.userAgent}
                    >
                         <option value="*">All (*)</option>
                         <option value="Googlebot">Googlebot</option>
                         <option value="Bingbot">Bingbot</option>
                         <option value="Slurp">Slurp (Yahoo)</option>
                         <option value="DuckDuckBot">DuckDuckBot</option>
                         <option value="Baiduspider">Baiduspider</option>
                         <option value="YandexBot">YandexBot</option>
                    </select>
                </div>
              </div>

              {/* Allow Paths */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-green-400">Allow Paths</label>
                    <Button variant="ghost" size="sm" onClick={() => addPath(ruleIndex, 'allow')} className="h-6 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                </div>
                {rule.allow.map((path, pathIndex) => (
                    <div key={`allow-${pathIndex}`} className="flex gap-2">
                        <Input
                            value={path}
                            onChange={(e) => updatePath(ruleIndex, 'allow', pathIndex, e.target.value)}
                            className="bg-gray-800/50 border-gray-700 h-8 text-sm"
                        />
                         <Button variant="ghost" size="sm" onClick={() => removePath(ruleIndex, 'allow', pathIndex)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-400">
                             <Trash2 className="w-3 h-3" />
                         </Button>
                    </div>
                ))}
              </div>

              {/* Disallow Paths */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-red-400">Disallow Paths</label>
                    <Button variant="ghost" size="sm" onClick={() => addPath(ruleIndex, 'disallow')} className="h-6 px-2 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                </div>
                {rule.disallow.map((path, pathIndex) => (
                    <div key={`disallow-${pathIndex}`} className="flex gap-2">
                        <Input
                            value={path}
                            onChange={(e) => updatePath(ruleIndex, 'disallow', pathIndex, e.target.value)}
                            className="bg-gray-800/50 border-gray-700 h-8 text-sm"
                        />
                         <Button variant="ghost" size="sm" onClick={() => removePath(ruleIndex, 'disallow', pathIndex)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-400">
                             <Trash2 className="w-3 h-3" />
                         </Button>
                    </div>
                ))}
              </div>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addRule} className="w-full border-dashed border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Another User Agent Rule
          </Button>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/20 rounded-t-lg">
            <h3 className="text-sm font-medium text-gray-400">Generated robots.txt</h3>
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
             <Card className="h-full p-0 overflow-hidden bg-gray-950 border-gray-800 rounded-b-lg rounded-t-none">
               <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap overflow-auto h-full language-text">
                  {output}
               </pre>
             </Card>
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
