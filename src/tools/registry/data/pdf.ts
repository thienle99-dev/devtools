import { FileText, ShieldCheck } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const pdfTools: ToolDefinition[] = [
    {
        id: 'pdf-converter',
        name: 'PDF Converter',
        description: 'Convert PDF files to Images or extract Text',
        icon: FileText,
        path: '/pdf/converter',
        category: 'pdf',
        component: Lazy.PdfConverter,
        keywords: ['pdf', 'convert', 'image', 'text', 'extract'],
        color: 'text-rose-500'
    },
    {
        id: 'pdf-security',
        name: 'PDF Security',
        description: 'Encrypt or Remove Password from PDFs',
        icon: ShieldCheck,
        path: '/pdf/security',
        category: 'pdf',
        component: Lazy.PdfSecurity,
        keywords: ['pdf', 'password', 'encrypt', 'decrypt', 'protect', 'lock', 'unlock'],
        color: 'text-amber-500'
    }
];
