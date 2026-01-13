import { Image as ImageIcon, FileImage } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { generateQrCode } from '../../image/logic';

export const imageTools: ToolDefinition[] = [
    {
        id: 'qrcode-gen',
        name: 'QR Code Generator',
        path: '/qrcode',
        description: 'Generate and scan QR codes',
        category: 'image',
        icon: ImageIcon,
        color: 'text-indigo-400',
        component: Lazy.QrCodeGenerator,
        keywords: ['qr', 'code', 'generator', 'scan', 'wifi'],
        inputTypes: ['text'],
        outputTypes: ['image'],
        process: (input, options) => generateQrCode(input, options)
    },

    {
        id: 'svg-placeholder-generator',
        name: 'SVG Placeholder',
        path: '/svg-placeholder',
        description: 'Generate SVG placeholder images with custom dimensions and text',
        category: 'image',
        icon: FileImage,
        color: 'text-purple-400',
        component: Lazy.SvgPlaceholderGenerator,
        keywords: ['svg', 'placeholder', 'image', 'generator', 'mockup'],
    },

];
