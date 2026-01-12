import { jwtDecode } from 'jwt-decode';
import { UAParser } from 'ua-parser-js';

export const parseJwt = (token: string) => {
    try {
        const header = jwtDecode(token, { header: true });
        const payload = jwtDecode(token);
        return { header, payload, isValid: true };
    } catch (e) {
        return { error: (e as Error).message, isValid: false };
    }
};

export const parseUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        const params: Record<string, string> = {};
        parsed.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return {
            protocol: parsed.protocol,
            host: parsed.host,
            hostname: parsed.hostname,
            port: parsed.port,
            pathname: parsed.pathname,
            hash: parsed.hash,
            search: parsed.search,
            params,
            origin: parsed.origin,
            isValid: true
        };
    } catch (e) {
        return { error: (e as Error).message, isValid: false };
    }
};

export const parseUserAgent = (ua: string) => {
    const parser = new UAParser(ua);
    return parser.getResult();
};

export const parseCookies = (cookieStr: string) => {
    const cookies: Record<string, string> = {};
    if (!cookieStr) return cookies;
    
    cookieStr.split(';').forEach(cookie => {
        const [name, ...value] = cookie.split('=');
        if (name && value) {
            cookies[name.trim()] = value.join('=').trim();
        }
    });
    return cookies;
};

export const base64UrlEncode = (input: string) => {
    try {
        return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch { return ''; }
};

export const base64UrlDecode = (input: string) => {
    try {
        let str = input.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    } catch (e) { return (e as Error).message; }
};

export const parseHttpHeaders = (headers: string) => {
    const result: Record<string, string> = {};
    headers.split('\n').forEach(line => {
        const index = line.indexOf(':');
        if (index > 0) {
            const key = line.substring(0, index).trim();
            const value = line.substring(index + 1).trim();
            result[key] = value;
        }
    });
    return result;
};

export const generateMetaTags = (options: { title?: string, description?: string, keywords?: string, author?: string, viewport?: string, charset?: string }) => {
    const tags: string[] = [];
    if (options.charset) tags.push(`<meta charset="${options.charset}">`);
    if (options.viewport) tags.push(`<meta name="viewport" content="${options.viewport}">`);
    if (options.title) tags.push(`<title>${options.title}</title>`);
    if (options.description) tags.push(`<meta name="description" content="${options.description}">`);
    if (options.keywords) tags.push(`<meta name="keywords" content="${options.keywords}">`);
    if (options.author) tags.push(`<meta name="author" content="${options.author}">`);
    return tags.join('\n');
};

export const generateOpenGraph = (options: { title?: string, description?: string, url?: string, image?: string, type?: string, site_name?: string }) => {
    const tags: string[] = [];
    if (options.title) tags.push(`<meta property="og:title" content="${options.title}">`);
    if (options.description) tags.push(`<meta property="og:description" content="${options.description}">`);
    if (options.url) tags.push(`<meta property="og:url" content="${options.url}">`);
    if (options.image) tags.push(`<meta property="og:image" content="${options.image}">`);
    if (options.type) tags.push(`<meta property="og:type" content="${options.type || 'website'}">`);
    if (options.site_name) tags.push(`<meta property="og:site_name" content="${options.site_name}">`);
    return tags.join('\n');
};

export const generateRobotsTxt = (options: { userAgent?: string, allow?: string[], disallow?: string[], sitemap?: string }) => {
    const lines: string[] = [];
    lines.push(`User-agent: ${options.userAgent || '*'}`);
    (options.disallow || []).forEach(path => lines.push(`Disallow: ${path}`));
    (options.allow || []).forEach(path => lines.push(`Allow: ${path}`));
    if (options.sitemap) lines.push(`Sitemap: ${options.sitemap}`);
    return lines.join('\n');
};

export const generateSitemap = (options: { urls: { loc: string, lastmod?: string, changefreq?: string, priority?: string }[] }) => {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    
    options.urls.forEach(url => {
        lines.push('  <url>');
        lines.push(`    <loc>${url.loc}</loc>`);
        if (url.lastmod) lines.push(`    <lastmod>${url.lastmod}</lastmod>`);
        if (url.changefreq) lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
        if (url.priority) lines.push(`    <priority>${url.priority}</priority>`);
        lines.push('  </url>');
    });
    
    lines.push('</urlset>');
    return lines.join('\n');
};

export const generateJsonLd = (options: { type: string, data: Record<string, any> }) => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': options.type,
        ...options.data
    };
    return JSON.stringify(jsonLd, null, 2);
};

export const generateBasicAuth = (user: string, pass: string) => {
    try {
        const credentials = btoa(`${user}:${pass}`);
        return `Authorization: Basic ${credentials}`;
    } catch { return ''; }
};

export const generateSlug = (input: string, options: { separator?: string, lowercase?: boolean } = {}) => {
    let slug = input;
    if (options.lowercase !== false) slug = slug.toLowerCase();
    
    const sep = options.separator || '-';
    return slug
        .replace(/[^a-z0-9]/g, sep)
        .replace(new RegExp(`${sep}+`, 'g'), sep)
        .replace(new RegExp(`^${sep}|${sep}$`, 'g'), '');
};

export const generateUtmUrl = (url: string, options: { 
    source?: string, 
    medium?: string, 
    campaign?: string, 
    term?: string, 
    content?: string 
}) => {
    try {
        const parsed = new URL(url);
        if (options.source) parsed.searchParams.set('utm_source', options.source);
        if (options.medium) parsed.searchParams.set('utm_medium', options.medium);
        if (options.campaign) parsed.searchParams.set('utm_campaign', options.campaign);
        if (options.term) parsed.searchParams.set('utm_term', options.term);
        if (options.content) parsed.searchParams.set('utm_content', options.content);
        return parsed.toString();
    } catch { return url; }
};
