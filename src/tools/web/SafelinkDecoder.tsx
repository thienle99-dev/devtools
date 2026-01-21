import { useState } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { ArrowRight, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const SafelinkDecoder = () => {
    const [input, setInput] = useState('');
    const [decoded, setDecoded] = useState<{ url: string; params: Record<string, string> } | null>(null);

    const handleDecode = (val: string) => {
        setInput(val);
        if (!val) {
            setDecoded(null);
            return;
        }

        try {
            const urlObj = new URL(val);
            // Outlook Safelinks usually look like: https://.../v2/url?u=TARGET_URL&d=...
            const targetUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('u');
            
            if (targetUrl) {
                const params: Record<string, string> = {};
                urlObj.searchParams.forEach((value, key) => {
                    if (key !== 'url' && key !== 'u') {
                        params[key] = value;
                    }
                });

                setDecoded({
                    url: targetUrl,
                    params
                });
            } else {
                setDecoded(null);
            }
        } catch (e) {
            setDecoded(null);
        }
    };

    const handleCopy = () => {
        if (decoded) {
            navigator.clipboard.writeText(decoded.url);
            toast.success('Decoded URL copied to clipboard');
        }
    };

    const renderParamDescription = (key: string, value: string) => {
        let description = '';
        switch (key) {
            case 'd': description = 'Data payload (Base64)'; break;
            case 'm': description = 'Message ID'; break;
            case 's': description = 'Signature'; break;
            case 'k': description = 'Key version'; break;
            case 'a': description = 'Audience'; break;
            case 'p': description = 'Payload'; break;
        }
        return (
            <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div className="flex flex-col">
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">{key}</span>
                    {description && <span className="text-xs text-muted-foreground">{description}</span>}
                </div>
                <span className="font-mono text-foreground text-sm break-all max-w-[70%] text-right">{value}</span>
            </div>
        );
    };

    return (
        <ToolPane
            title="Outlook Safelink Decoder"
            description="Decode Microsoft Outlook Safe Links to reveal the original URL"
            onClear={() => { setInput(''); setDecoded(null); }}
        >
            <div className="max-w-4xl mx-auto space-y-6 pt-6 px-4">
                <Card className="p-4 space-y-4">
                    <label className="text-sm font-medium text-muted-foreground">Safe Link URL</label>
                    <Input
                        value={input}
                        onChange={(e) => handleDecode(e.target.value)}
                        placeholder="https://nam01.safelinks.protection.outlook.com/?url=..."
                        className="font-mono text-sm"
                        autoFocus
                        fullWidth
                    />
                </Card>

                {decoded && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-center text-blue-500">
                            <ArrowRight className="w-8 h-8 rotate-90 md:rotate-0" />
                        </div>

                        <Card className="p-6 space-y-4 border-blue-500/30 bg-blue-500/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-100 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Original URL
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy URL">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(decoded.url, '_blank')} title="Open in new tab">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-muted rounded-lg border border-border break-all font-mono text-lg text-green-600 dark:text-green-400">
                                {decoded.url}
                            </div>
                        </Card>

                        {Object.keys(decoded.params).length > 0 && (
                            <Card className="p-4 space-y-2 relative overflow-hidden">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Tracking Parameters</h4>
                                <div className="space-y-1">
                                    {Object.entries(decoded.params).map(([key, value]) => renderParamDescription(key, value))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
                
                {!decoded && input && (
                    <div className="text-center text-destructive p-4 animate-in fade-in">
                        Unable to decode URL. Ensure it is a valid Outlook Safe Link.
                    </div>
                )}
            </div>
        </ToolPane>
    );
};
