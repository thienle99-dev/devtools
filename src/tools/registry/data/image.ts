import { Image as ImageIcon, FileImage, Info, Code, Type } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { getImageMetadata, generateQrCode, compressImage, imageToAscii } from '../../image/logic';

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
        id: 'image-converter',
        name: 'Image Converter',
        path: '/image-converter',
        description: 'Batch convert, resize and compress images (PNG, JPG, WebP, AVIF)',
        category: 'image',
        icon: FileImage,
        color: 'text-emerald-400',
        component: Lazy.ImageConverter,
        keywords: ['image', 'convert', 'compress', 'resize', 'batch', 'webp', 'avif'],
        inputTypes: ['image', 'file'],
        outputTypes: ['image', 'file'],
        process: (input, options) => compressImage(input, options)
    },
    {
        id: 'image-metadata',
        name: 'Image Metadata',
        path: '/image-metadata',
        description: 'View and strip EXIF, GPS and other metadata from images',
        category: 'image',
        icon: Info,
        color: 'text-blue-400',
        component: Lazy.ImageMetadata,
        keywords: ['image', 'metadata', 'exif', 'gps', 'privacy', 'strip'],
        inputTypes: ['image', 'file'],
        outputTypes: ['json'],
        process: (input) => getImageMetadata(input)
    },
    {
        id: 'data-uri',
        name: 'Data URI Generator',
        path: '/data-uri',
        description: 'Convert images or files into base64 Data URIs',
        category: 'image',
        icon: Code,
        color: 'text-amber-400',
        component: Lazy.DataUriGenerator,
        keywords: ['base64', 'image', 'data-uri', 'css', 'html', 'encode'],
        inputTypes: ['image', 'file'],
        outputTypes: ['text'],
        process: async (input) => {
            if (input instanceof Blob) {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(input);
                });
            }
            return input;
        }
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
    {
        id: 'image-to-ascii',
        name: 'Image to ASCII',
        path: '/image-to-ascii',
        description: 'Convert images to stylized text art with color support',
        category: 'image',
        icon: Type,
        color: 'text-orange-400',
        component: Lazy.ImageToAscii,
        keywords: ['ascii', 'image', 'text', 'art', 'convert'],
        inputTypes: ['image', 'file'],
        outputTypes: ['text'],
        process: (input, options) => imageToAscii(input, options)
    },
];
