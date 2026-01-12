import CryptoJS from 'crypto-js';
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import Papa from 'papaparse';
import { format, isValid, parseISO, fromUnixTime } from 'date-fns';

export const base64Encode = (input: string) => {
    if (!input) return '';
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
};

export const base64Decode = (input: string) => {
    if (!input) return '';
    const decoded = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
    if (!decoded && input.trim().length > 0) {
        throw new Error('Could not decode to UTF-8 string. Input might be invalid Base64 or binary data.');
    }
    return decoded;
};

export const jsonToYaml = (input: string) => {
    const parsed = JSON.parse(input);
    return yaml.dump(parsed);
};

export const yamlToJson = (input: string) => {
    const parsed = yaml.load(input);
    return JSON.stringify(parsed, null, 2);
};

export const jsonToXml = (input: string) => {
    const parsed = JSON.parse(input);
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: "  " });
    return builder.build(parsed);
};

export const xmlToJson = (input: string) => {
    const parser = new XMLParser({ ignoreAttributes: false });
    return JSON.stringify(parser.parse(input), null, 2);
};

export const jsonToCsv = (input: string) => {
    const parsed = JSON.parse(input);
    return Papa.unparse(parsed, { quotes: true, header: true });
};

export const csvToJson = (input: string) => {
    const res = Papa.parse(input, { header: true, dynamicTyping: true, skipEmptyLines: true });
    if (res.errors.length > 0) throw new Error(res.errors[0].message);
    return JSON.stringify(res.data, null, 2);
};

export const convertCase = (input: string, type: string) => {
    if (!input) return '';
    const splitWords = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/);
    
    switch (type) {
        case 'upper': return input.toUpperCase();
        case 'lower': return input.toLowerCase();
        case 'title': return input.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        case 'camel':
            return splitWords(input).map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        case 'snake':
            return splitWords(input).map(w => w.toLowerCase()).join('_');
        case 'kebab':
            return splitWords(input).map(w => w.toLowerCase()).join('-');
        default: return input;
    }
};

export const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();

export const hexToRgb = (hex: string) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};

export const convertColor = (input: string, toFormat: 'hex' | 'rgb' | 'hsl') => {
    // Basic detection
    let rgb = { r: 0, g: 0, b: 0 };
    
    if (input.startsWith('#')) {
        const p = hexToRgb(input);
        if (p) rgb = p;
    } else if (input.startsWith('rgb')) {
        const parts = input.match(/\d+/g);
        if (parts && parts.length >= 3) {
            rgb = { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
        }
    } else {
        // Assume hex might be without #
        const p = hexToRgb(input.startsWith('#') ? input : '#' + input);
        if (p) rgb = p;
    }

    if (toFormat === 'hex') return rgbToHex(rgb.r, rgb.g, rgb.b);
    if (toFormat === 'rgb') return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (toFormat === 'hsl') {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    return input;
};

export const convertDate = (input: string, outputFormat: string = 'iso') => {
    if (!input?.trim()) return '';

    let date: Date | null = null;

    // 1. Try Unix Timestamp (seconds or milliseconds)
    if (/^\d{10,}$/.test(input)) {
        // Assume ms if > 12 digits, else seconds
        const num = parseInt(input, 10);
        if (input.length > 11) {
            date = new Date(num);
        } else {
            date = fromUnixTime(num);
        }
    }
    // 2. Try ISO string text
    else {
        const parsed = parseISO(input);
        if (isValid(parsed)) date = parsed;
        // 3. Try standard Date parse
        else {
            const d = new Date(input);
            if (isValid(d)) date = d;
        }
    }

    if (date && isValid(date)) {
        if (outputFormat === 'iso') return date.toISOString();
        if (outputFormat === 'utc') return date.toUTCString();
        if (outputFormat === 'local') return date.toString();
        if (outputFormat === 'unix') return Math.floor(date.getTime() / 1000).toString();
        if (outputFormat === 'unix_ms') return date.getTime().toString();
        if (outputFormat === 'readable') return format(date, 'PPP pp');
        if (outputFormat === 'date-only') return format(date, 'yyyy-MM-dd');
        return date.toISOString();
    }
    return 'Invalid Date';
};
