import { FileImage, FileCheck, Scissors, FileUp, RotateCw, Binary, FileText, Archive, CheckCircle2, Move, FileCode, FileDigit, Code2, Eraser } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const pdfTools: ToolDefinition[] = [
    {
        id: 'images-to-pdf',
        name: 'Images to PDF',
        path: '/images-to-pdf',
        description: 'Convert multiple images to PDF, each image as one page',
        category: 'pdf',
        icon: FileImage,
        color: 'text-purple-400',
        component: Lazy.ImagesToPdfConverter,
        keywords: ['pdf', 'image', 'convert', 'merge', 'pages']
    },
    {
        id: 'pdf-merger',
        name: 'PDF Merger',
        path: '/pdf-merger',
        description: 'Merge multiple PDF files into one',
        category: 'pdf',
        icon: FileCheck,
        color: 'text-indigo-500',
        component: Lazy.PdfMerger,
        keywords: ['pdf', 'merge', 'combine', 'join']
    },
    {
        id: 'pdf-splitter',
        name: 'PDF Splitter',
        path: '/pdf-splitter',
        description: 'Split PDF into multiple files',
        category: 'pdf',
        icon: Scissors,
        color: 'text-red-400',
        component: Lazy.PdfSplitter,
        keywords: ['pdf', 'split', 'divide', 'separate']
    },
    {
        id: 'pdf-page-extractor',
        name: 'PDF Page Extractor',
        path: '/pdf-page-extractor',
        description: 'Extract specific pages from a PDF',
        category: 'pdf',
        icon: FileUp,
        color: 'text-emerald-400',
        component: Lazy.PdfPageExtractor,
        keywords: ['pdf', 'extract', 'pages', 'select']
    },
    {
        id: 'pdf-page-rotator',
        name: 'PDF Page Rotator',
        path: '/pdf-page-rotator',
        description: 'Rotate pages in a PDF',
        category: 'pdf',
        icon: RotateCw,
        color: 'text-blue-400',
        component: Lazy.PdfPageRotator,
        keywords: ['pdf', 'rotate', 'pages', 'orientation']
    },
    {
        id: 'pdf-base64',
        name: 'PDF Base64',
        path: '/pdf-base64',
        description: 'Convert PDF to Base64 or decode Base64 to PDF',
        category: 'pdf',
        icon: Binary,
        color: 'text-amber-500',
        component: Lazy.PdfBase64,
        keywords: ['pdf', 'base64', 'encode', 'decode']
    },
    {
        id: 'pdf-metadata',
        name: 'PDF Metadata',
        path: '/pdf-metadata',
        description: 'View and edit PDF metadata',
        category: 'pdf',
        icon: FileText,
        color: 'text-gray-400',
        component: Lazy.PdfMetadata,
        keywords: ['pdf', 'metadata', 'info', 'properties', 'edit']
    },
    {
        id: 'pdf-compressor',
        name: 'PDF Compressor',
        path: '/pdf-compressor',
        description: 'Compress PDF file size',
        category: 'pdf',
        icon: Archive,
        color: 'text-orange-400',
        component: Lazy.PdfCompressor,
        keywords: ['pdf', 'compress', 'reduce', 'size', 'optimize']
    },
    {
        id: 'pdf-validator',
        name: 'PDF Validator',
        path: '/pdf-validator',
        description: 'Validate PDF file structure and metadata',
        category: 'pdf',
        icon: CheckCircle2,
        color: 'text-green-500',
        component: Lazy.PdfValidator,
        keywords: ['pdf', 'validate', 'check', 'verify', 'test']
    },
    {
        id: 'pdf-page-reorder',
        name: 'PDF Page Reorder',
        path: '/pdf-page-reorder',
        description: 'Reorder pages in a PDF',
        category: 'pdf',
        icon: Move,
        color: 'text-cyan-400',
        component: Lazy.PdfPageReorder,
        keywords: ['pdf', 'reorder', 'pages', 'sort']
    },
    {
        id: 'pdf-watermarker',
        name: 'PDF Watermarker',
        path: '/pdf-watermarker',
        description: 'Add text or image watermark to PDF',
        category: 'pdf',
        icon: FileCode,
        color: 'text-blue-300',
        component: Lazy.PdfWatermarker,
        keywords: ['pdf', 'watermark', 'text', 'image', 'brand']
    },
    {
        id: 'pdf-page-numbering',
        name: 'PDF Page Numbering',
        path: '/pdf-page-numbering',
        description: 'Add page numbers to PDF',
        category: 'pdf',
        icon: FileDigit,
        color: 'text-purple-300',
        component: Lazy.PdfPageNumbering,
        keywords: ['pdf', 'page', 'number', 'numbering', 'footer', 'header']
    },
    {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        path: '/html-to-pdf',
        description: 'Convert HTML content to PDF',
        category: 'pdf',
        icon: Code2,
        color: 'text-orange-600',
        component: Lazy.HtmlToPdf,
        keywords: ['pdf', 'html', 'convert', 'web']
    },
    {
        id: 'markdown-to-pdf',
        name: 'Markdown to PDF',
        path: '/markdown-to-pdf',
        description: 'Convert Markdown content to PDF',
        category: 'pdf',
        icon: FileCode,
        color: 'text-sky-300',
        component: Lazy.MarkdownToPdf,
        keywords: ['pdf', 'markdown', 'convert', 'md']
    },
    {
        id: 'pdf-metadata-remover',
        name: 'PDF Metadata Remover',
        path: '/pdf-metadata-remover',
        description: 'Remove all metadata from PDF',
        category: 'pdf',
        icon: Eraser,
        color: 'text-red-500',
        component: Lazy.PdfMetadataRemover,
        keywords: ['pdf', 'metadata', 'remove', 'clean', 'privacy']
    },
];
