
/**
 * Reads a file as text.
 */
export const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

/**
 * Triggers a file download.
 */
export const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Opens content in a new tab.
 */
export const openInNewTab = (content: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: Can't revoke object URL immediately if opening in new tab sometimes, 
    // but usually browser handles it. To be safe, we might relying on GC or revoke later.
    // However, for text/blob, window.open might be blocked by popup blockers or open a download.
    // Better strategy for "view": write to a new window document.
};

export const openContentInNewTab = (content: string, title: string = 'Output') => {
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: monospace; white-space: pre-wrap; padding: 20px; background: #1a1a1a; color: #e0e0e0; }
                    </style>
                </head>
                <body>${escapeHtml(content)}</body>
            </html>
        `);
        win.document.close();
    }
};

const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
