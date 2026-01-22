import { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Copy, Trash2, Clock, Plus, Key } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import { toast } from 'sonner';
const TOOL_ID = 'otp';

interface OtpAccount {
  id: string;
  name: string;
  secret: string;
  issuer?: string;
  digits?: number;
  period?: number;
  algorithm?: string;
}

export const OtpGenerator = () => {
  const [accounts, setAccounts] = useState<OtpAccount[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Form state
  const [newAccount, setNewAccount] = useState<Partial<OtpAccount>>({
    name: '',
    secret: '',
    issuer: '',
    digits: 6,
    period: 30,
    algorithm: 'SHA1'
  });

  const generateCodes = () => {
    const newCodes: Record<string, string> = {};
    accounts.forEach(account => {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: account.issuer || 'DevTools',
          label: account.name,
          algorithm: account.algorithm || 'SHA1',
          digits: account.digits || 6,
          period: account.period || 30,
          secret: OTPAuth.Secret.fromBase32(account.secret.replace(/\s/g, ''))
        });
        newCodes[account.id] = totp.generate();
      } catch (e) {
        newCodes[account.id] = 'Error';
      }
    });
    setCodes(newCodes);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const epoch = Math.floor(Date.now() / 1000);
      const period = 30; // Assuming 30s period for progress bar
      const p = epoch % period;
      setProgress(((period - p) / period) * 100);
      setTimeLeft(period - p);
      
      // Regenerate close to expiry or just every second? 
      // OTPAuth handles it, but we need to update state.
      // Easiest is to generate every second or when needed.
      generateCodes();
    }, 1000);

    return () => clearInterval(timer);
  }, [accounts]);

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.secret) {
      toast.error('Name and Secret are required');
      return;
    }

    // Basic Base32 validation
    if (!/^[A-Z2-7]+=*$/i.test(newAccount.secret.replace(/\s/g, ''))) {
        toast.error('Invalid Base32 secret');
        return;
    }

    const account: OtpAccount = {
      id: crypto.randomUUID(),
      name: newAccount.name,
      secret: newAccount.secret,
      issuer: newAccount.issuer,
      digits: newAccount.digits,
      period: newAccount.period,
      algorithm: newAccount.algorithm
    };

    setAccounts([...accounts, account]);
    setNewAccount({
      name: '',
      secret: '',
      issuer: '',
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    });
    toast.success('Account added');
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    const newCodes = { ...codes };
    delete newCodes[id];
    setCodes(newCodes);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  return (
    <ToolPane
      title="OTP Code Generator"
      description="Generate TOTP codes for two-factor authentication"
      toolId={TOOL_ID}
    >
      <div className="h-full flex flex-col md:flex-row gap-6 p-4">
        {/* Add Account Form */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-foreground flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" />
                Add Account
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Account Name *</label>
              <Input
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="e.g. Google: user@example.com"
                className="bg-muted/50 border-input"
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Secret Key (Base32) *</label>
              <Input
                value={newAccount.secret}
                onChange={(e) => setNewAccount({ ...newAccount, secret: e.target.value })}
                placeholder="JBSWY3DPEHPK3PXP"
                className="bg-muted/50 border-input font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Issuer (Optional)</label>
                    <Input
                        value={newAccount.issuer}
                        onChange={(e) => setNewAccount({ ...newAccount, issuer: e.target.value })}
                        placeholder="Service Name"
                        className="bg-muted/50 border-input"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Digits</label>
                    <select
                        value={newAccount.digits}
                        onChange={(e) => setNewAccount({ ...newAccount, digits: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-muted/50 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                        <option value={6}>6</option>
                        <option value={8}>8</option>
                    </select>
                </div>
            </div>

            <Button onClick={handleAddAccount} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Add to List
            </Button>
          </Card>
        </div>

        {/* Codes List */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 rounded-t-lg">
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Active Codes ({timeLeft}s)</h3>
             </div>
             <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                />
             </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-background border-border rounded-b-lg rounded-t-none border-x border-b">
             {accounts.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                     <Key className="w-12 h-12 opacity-20" />
                     <p className="italic">No accounts added yet</p>
                 </div>
             ) : (
                 <div className="grid gap-4">
                     {accounts.map(account => (
                         <Card key={account.id} className="p-4 flex justify-between items-center group hover:bg-muted/50 transition-colors">
                             <div className="flex flex-col">
                                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{account.issuer || 'Account'}</span>
                                 <span className="text-sm font-medium text-foreground">{account.name}</span>
                                 <div className="mt-1 font-mono text-2xl font-bold text-primary tracking-widest">
                                     {codes[account.id] ? codes[account.id].replace(/(.{3})/g, '$1 ').trim() : '---'}
                                 </div>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="ghost" size="sm" onClick={() => copyCode(codes[account.id])} className="hover:text-primary">
                                     <Copy className="w-4 h-4" />
                                 </Button>
                                 <Button variant="ghost" size="sm" onClick={() => handleRemoveAccount(account.id)} className="hover:text-destructive text-muted-foreground">
                                     <Trash2 className="w-4 h-4" />
                                 </Button>
                             </div>
                         </Card>
                     ))}
                 </div>
             )}
          </div>
        </div>
      </div>
    </ToolPane>
  );
};
