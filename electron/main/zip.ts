import { ipcMain } from 'electron';
import AdmZip from 'adm-zip';

export function extractZip(zipPath: string, targetPath: string) {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetPath, true);
}

export function createZip(sourcePath: string, targetPath: string) {
    const zip = new AdmZip();
    zip.addLocalFolder(sourcePath);
    zip.writeZip(targetPath);
}

export function createZipWithFiles(targetPath: string, files: { path: string; content: string | Buffer }[]) {
    const zip = new AdmZip();
    files.forEach(file => {
        zip.addFile(file.path, typeof file.content === 'string' ? Buffer.from(file.content) : file.content);
    });
    zip.writeZip(targetPath);
}

export function setupZipHandlers() {
    ipcMain.handle('zip:extract', async (_, zipPath: string, targetPath: string) => {
        try {
            extractZip(zipPath, targetPath);
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    ipcMain.handle('zip:create', async (_, sourcePath: string, targetPath: string) => {
        try {
            createZip(sourcePath, targetPath);
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });
}
