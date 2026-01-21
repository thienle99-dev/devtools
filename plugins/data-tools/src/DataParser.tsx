import { useState } from 'react';
import { Database, Search, Phone, CreditCard, Copy, CheckCircle } from 'lucide-react';
import { isValidIBAN, electronicFormatIBAN } from 'ibantools';
import { parsePhoneNumber } from 'awesome-phonenumber';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Label } from '@components/ui/Label';
import { TextArea } from '@components/ui/TextArea';
import { toast } from 'sonner';
import { cn } from '@utils/cn';

type DataType = 'iban' | 'phone' | 'email';

interface ExtractedItem {
    original: string;
    formatted: string;
    type: DataType;
    isValid: boolean;
    metadata?: string;
}

export default function DataParser() {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<ExtractedItem[]>([]);

    const extractData = () => {
        if (!input.trim()) return;
        
        const newResults: ExtractedItem[] = [];
        
        // 1. IBAN Extraction
        // Regex to find potential IBANs (loose matching)
        // IBANs star with 2 letters, then 2 digits, then up to 30 alphanumeric
        const ibanRegex = /[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}/gi;
        const potentialIbans = input.match(ibanRegex) || [];
        
        potentialIbans.forEach(raw => {
            // Clean spaces/dashes for validation
            const clean = raw.replace(/[^A-Z0-9]/gi, '');
            if (isValidIBAN(clean)) {
                newResults.push({
                    original: raw,
                    formatted: electronicFormatIBAN(clean) || clean,
                    type: 'iban',
                    isValid: true
                });
            }
        });

        // 2. Phone Extraction
        // This is tricky without strict country codes, so we look for patterns like +[digits] or generic numbers
        // awesome-phonenumber is strict about country codes usually.
        // We'll iterate words that look like phone numbers
        const phoneRegex = /(?:\+|\d)[\d\-\(\) ]{7,}\d/g;
        const potentialPhones = input.match(phoneRegex) || [];
        
        potentialPhones.forEach(raw => {
            const pn = parsePhoneNumber(raw);
            if (pn.isValid()) {
                newResults.push({
                    original: raw,
                    formatted: pn.getNumber('e164') as string, // Standard format
                    type: 'phone',
                    isValid: true,
                    metadata: pn.getRegionCode() + ' - ' + pn.getType()
                });
            }
        });

        // 3. Email Extraction
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const potentialEmails = input.match(emailRegex) || [];
        
        potentialEmails.forEach(raw => {
            newResults.push({
                original: raw,
                formatted: raw.toLowerCase(),
                type: 'email',
                isValid: true
            });
        });

        setResults(newResults);
        if (newResults.length > 0) {
            toast.success(`Found ${newResults.length} items!`);
        } else {
            toast.error("No valid data found.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="w-8 h-8 text-cyan-400" />
                    Data Parser
                </h2>
                <p className="text-slate-400">Extract and validate IBANs, Phone Numbers, and Emails from unstructured text</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
                <Card className="p-4 flex flex-col space-y-4 bg-slate-900/50 border-slate-800">
                    <Label>Input Text</Label>
                    <TextArea 
                        className="flex-1 font-mono text-sm resize-none bg-slate-950/50"
                        placeholder="Paste text containing IBANs, phone numbers, etc. here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button onClick={extractData} variant="primary" fullWidth>
                        <Search className="w-4 h-4 mr-2" />
                        Extract Data
                    </Button>
                </Card>

                <Card className="p-4 flex flex-col space-y-4 bg-slate-900/50 border-slate-800">
                    <div className="flex items-center justify-between">
                        <Label>Extracted Results ({results.length})</Label>
                        {results.length > 0 && (
                             <Button size="sm" variant="ghost" onClick={() => setResults([])}>Clear</Button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {results.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <Database className="w-12 h-12 mb-2" />
                                <p>Results will appear here</p>
                             </div>
                        ) : (
                            results.map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between group">
                                    <div className="flex items-start gap-3 overflow-hidden">
                                        <div className={cn(
                                            "mt-1 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                            item.type === 'iban' && "bg-emerald-500/20 text-emerald-400",
                                            item.type === 'phone' && "bg-blue-500/20 text-blue-400",
                                            item.type === 'email' && "bg-orange-500/20 text-orange-400",
                                        )}>
                                            {item.type === 'iban' && <CreditCard className="w-4 h-4" />}
                                            {item.type === 'phone' && <Phone className="w-4 h-4" />}
                                            {item.type === 'email' && <CheckCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-mono text-sm font-medium truncate select-all">{item.formatted}</span>
                                            {item.metadata && <span className="text-xs text-slate-500">{item.metadata}</span>}
                                            <span className="text-xs text-slate-600 truncate max-w-[200px]">From: {item.original}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        size="xs" 
                                        variant="ghost" 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(item.formatted)}
                                    >
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
