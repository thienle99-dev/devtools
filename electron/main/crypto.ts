import { ipcMain } from 'electron';
import bcrypt from 'bcryptjs';

export function setupCryptoHandlers() {
    ipcMain.handle('bcrypt:hash', async (_, text: string, rounds: number) => {
        const salt = await bcrypt.genSalt(rounds);
        return bcrypt.hash(text, salt);
    });

    ipcMain.handle('bcrypt:compare', async (_, text: string, hash: string) => {
        return bcrypt.compare(text, hash);
    });
}
