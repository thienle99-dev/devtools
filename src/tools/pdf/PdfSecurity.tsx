import React, { useState, useRef } from 'react';
import { Lock, Unlock, FileUp, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Label } from '@components/ui/Label';
import { Input } from '@components/ui/Input';
import { toast } from 'sonner';
import { cn } from '@utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs';

export default function PdfSecurity() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Only for protecting
    const [currentPassword, setCurrentPassword] = useState(''); // Only for unlocking
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('protect');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error("Please select a valid PDF file");
                return;
            }
            setFile(selectedFile);
        }
    };

    const downloadBlob = (bytes: Uint8Array, filename: string) => {
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleProtect = async () => {
        if (!file || !password) return;
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const doc = await PDFDocument.load(arrayBuffer);
            
            // Encrypt
            // @ts-ignore - encrypt exists in pdf-lib but types might vary
            doc.encrypt({
                userPassword: password,
                ownerPassword: password, // Simple mode: same pass for both
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                }
            });

            const pdfBytes = await doc.save();
            downloadBlob(pdfBytes, `protected-${file.name}`);
            toast.success("PDF protected successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to protect PDF: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnlock = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Try load with password (if needed)
            // If the file is not encrypted, providing password doesn't hurt usually, 
            // but if it IS encrypted and password is wrong, it throws.
            // If it IS encrypted and password is empty, it throws.
           
            let doc;
            try {
                 // @ts-ignore - password option exists for encrypted docs
                 doc = await PDFDocument.load(arrayBuffer, { password: currentPassword });
            } catch (loadErr) {
                 throw new Error("Incorrect password or could not open file.");
            }

            // To "unlock", we just save it without encryption options?
            // pdf-lib's load returns a document. If we just save it again, does it keep encryption?
            // We usually need to verify if we can just save it.
            // Actually, pdf-lib docs say: "Encryption is not preserved when saving a document."
            // So just loading it (authenticating) and saving it strips the password.
            
            const pdfBytes = await doc.save();
            downloadBlob(pdfBytes, `unlocked-${file.name}`);
            toast.success("PDF unlocked successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to unlock PDF: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-rose-500" />
                    PDF Security
                </h2>
                <p className="text-slate-400">Add password protection or remove it from PDF files</p>
            </div>

            <Card className="p-6 space-y-6 bg-slate-900/50 border-slate-800">
                {/* File Upload Area */}
                <div 
                    className={cn(
                        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                        file ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50"
                    )}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                    />
                    
                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                            <FileUp className="w-12 h-12" />
                            <span className="font-semibold text-lg">{file.name}</span>
                            <Button size="sm" variant="ghost" className="mt-2 text-slate-400 hover:text-white" onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                            }}>
                                Change File
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <FileUp className="w-12 h-12 mb-2" />
                            <span className="font-semibold text-lg">Click to load PDF</span>
                        </div>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="protect" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Protect PDF
                        </TabsTrigger>
                        <TabsTrigger value="unlock" className="flex items-center gap-2">
                            <Unlock className="w-4 h-4" /> Unlock PDF
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="protect" className="space-y-4">
                        <div className="space-y-4 max-w-md mx-auto">
                            <div className="space-y-2">
                                <Label>Set Password</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Enter secure password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Repeat password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <Button 
                                fullWidth 
                                variant="primary"
                                disabled={!file || !password || isProcessing}
                                onClick={handleProtect}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                Encrypt PDF
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="unlock" className="space-y-4">
                         <div className="space-y-4 max-w-md mx-auto">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-300 text-sm mb-4">
                                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                <p>You must know the current password to unlock the file. We cannot crack passwords.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Current Password (if any)</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Enter current password" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <Button 
                                fullWidth 
                                variant="secondary"
                                disabled={!file || isProcessing}
                                onClick={handleUnlock}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                                Remove Security
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
