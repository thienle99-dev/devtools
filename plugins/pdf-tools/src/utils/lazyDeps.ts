import type JSZip from 'jszip';

type PdfJsModule = typeof import('pdfjs-dist/build/pdf.mjs');

let pdfjsPromise: Promise<PdfJsModule> | null = null;
let jszipPromise: Promise<JSZipConstructor> | null = null;

type JSZipConstructor = typeof JSZip;

export async function loadPdfJs(): Promise<PdfJsModule> {
    if (!pdfjsPromise) {
        pdfjsPromise = Promise.all([
            import('pdfjs-dist/build/pdf.mjs'),
            import('pdfjs-dist/build/pdf.worker.mjs?url'),
        ]).then(([pdfjs, worker]) => {
            if (typeof window !== 'undefined') {
                const workerSrc = (worker as any).default || worker;
                pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
            }
            return pdfjs;
        });
    }
    return pdfjsPromise;
}

export async function loadJsZip(): Promise<JSZipConstructor> {
    if (!jszipPromise) {
        jszipPromise = import('jszip').then(mod => (mod.default || mod) as JSZipConstructor);
    }
    return jszipPromise;
}
