/**
 * Lazy Load Utilities for Heavy Dependencies
 * Phase 2 Optimization - Load heavy libraries only when needed
 */

// Tesseract.js lazy loader (~30MB)
let tesseractModule: typeof import('tesseract.js') | null = null;

export const loadTesseract = async () => {
  if (!tesseractModule) {
    console.log('👁️ Loading Tesseract.js (OCR)...');
    tesseractModule = await import('tesseract.js');
    console.log('✅ Tesseract.js loaded');
  }
  return tesseractModule;
};

export const getTesseract = () => {
  if (!tesseractModule) {
    throw new Error('Tesseract.js not loaded. Call loadTesseract() first.');
  }
  return tesseractModule;
};

// CodeMirror language lazy loaders
export const loadCodeMirrorLanguage = async (lang: string) => {
  console.log(`📝 Loading CodeMirror language: ${lang}...`);

  switch (lang) {
    case 'javascript':
    case 'js':
    case 'jsx':
      return await import('@codemirror/lang-javascript');

    case 'typescript':
    case 'ts':
    case 'tsx':
      return await import('@codemirror/lang-javascript');

    case 'json':
      return await import('@codemirror/lang-json');

    case 'html':
      return await import('@codemirror/lang-html');

    case 'css':
      return await import('@codemirror/lang-css');

    case 'xml':
      return await import('@codemirror/lang-xml');

    case 'yaml':
    case 'yml':
      return await import('@codemirror/lang-yaml');

    case 'sql':
      return await import('@codemirror/lang-sql');

    default:
      console.warn(`Unknown language: ${lang}, using plain text`);
      return null;
  }
};

// Generic lazy loader with caching
const moduleCache = new Map<string, any>();

export const lazyLoad = async <T>(
  moduleName: string,
  loader: () => Promise<T>
): Promise<T> => {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName);
  }

  console.log(`📦 Loading ${moduleName}...`);
  const module = await loader();
  moduleCache.set(moduleName, module);
  console.log(`✅ ${moduleName} loaded`);

  return module;
};

// Preload heavy modules on idle
export const preloadHeavyModules = () => {
  // Fabric.js removed (using Konva)
};

// Check if a module is loaded
export const isModuleLoaded = (moduleName: 'tesseract'): boolean => {
  switch (moduleName) {
    case 'tesseract':
      return tesseractModule !== null;
    default:
      return false;
  }
};
