import type { ToolDefinition } from '../types';

// All PDF tools have been moved to the pdf-tools plugin:
// - pdf-converter → pdf-tools plugin
// - pdf-security → pdf-tools plugin
// These tools will appear in the footer when the pdf-tools plugin is installed

export const pdfTools: ToolDefinition[] = [];
