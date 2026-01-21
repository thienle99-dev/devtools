declare module 'pdfjs-dist/build/pdf.mjs' {
    import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
    export * from 'pdfjs-dist/types/src/display/api';
    export const GlobalWorkerOptions: {
        workerSrc: string;
    };
    export function getDocument(params: any): { promise: Promise<PDFDocumentProxy> };
}

declare module 'pdfjs-dist/build/pdf.worker.mjs?url' {
    const workerSrc: string;
    export default workerSrc;
}
