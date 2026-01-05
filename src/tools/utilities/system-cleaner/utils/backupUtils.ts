import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

export interface BackupInfo {
    id: string;
    timestamp: Date;
    files: string[];
    totalSize: number;
    location: string;
    platform: string;
}

export interface BackupResult {
    success: boolean;
    backupId?: string;
    backupInfo?: BackupInfo;
    error?: string;
}

// Get backup directory
const getBackupDir = (): string => {
    const platform = process.platform;
    const home = os.homedir();
    
    if (platform === 'win32') {
        return path.join(home, 'AppData', 'Local', 'devtools-app', 'backups');
    } else {
        return path.join(home, '.devtools-app', 'backups');
    }
};

// Generate backup ID
const generateBackupId = (): string => {
    return `backup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Calculate total size of files
const calculateTotalSize = async (files: string[]): Promise<number> => {
    let totalSize = 0;
    
    for (const filePath of files) {
        try {
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                // For directories, we'll estimate based on directory size
                // In production, you might want to recursively calculate
                totalSize += stats.size || 0;
            }
        } catch (e) {
            // File might not exist, skip
        }
    }
    
    return totalSize;
};

// Create backup
export const createBackup = async (files: string[]): Promise<BackupResult> => {
    try {
        const backupDir = getBackupDir();
        await fs.mkdir(backupDir, { recursive: true });
        
        const backupId = generateBackupId();
        const backupPath = path.join(backupDir, backupId);
        await fs.mkdir(backupPath, { recursive: true });
        
        const totalSize = await calculateTotalSize(files);
        const backedUpFiles: string[] = [];
        
        // Copy files to backup directory
        for (const filePath of files) {
            try {
                const stats = await fs.stat(filePath);
                const fileName = path.basename(filePath);
                const backupFilePath = path.join(backupPath, fileName);
                
                if (stats.isFile()) {
                    await fs.copyFile(filePath, backupFilePath);
                    backedUpFiles.push(filePath);
                } else if (stats.isDirectory()) {
                    // For directories, create a zip or copy recursively
                    // Simplified: just note the directory
                    backedUpFiles.push(filePath);
                }
            } catch (e) {
                // Skip files that can't be backed up
                console.warn(`Failed to backup ${filePath}:`, e);
            }
        }
        
        // Save backup metadata
        const backupInfo: BackupInfo = {
            id: backupId,
            timestamp: new Date(),
            files: backedUpFiles,
            totalSize,
            location: backupPath,
            platform: process.platform
        };
        
        const metadataPath = path.join(backupPath, 'backup-info.json');
        await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2));
        
        return {
            success: true,
            backupId,
            backupInfo
        };
    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
};

// List backups
export const listBackups = async (): Promise<BackupInfo[]> => {
    try {
        const backupDir = getBackupDir();
        const entries = await fs.readdir(backupDir, { withFileTypes: true });
        const backups: BackupInfo[] = [];
        
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('backup-')) {
                const metadataPath = path.join(backupDir, entry.name, 'backup-info.json');
                try {
                    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                    const backupInfo = JSON.parse(metadataContent) as BackupInfo;
                    backups.push(backupInfo);
                } catch (e) {
                    // Skip invalid backups
                }
            }
        }
        
        // Sort by timestamp (newest first)
        return backups.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    } catch (error) {
        return [];
    }
};

// Get backup info
export const getBackupInfo = async (backupId: string): Promise<BackupInfo | null> => {
    try {
        const backupDir = getBackupDir();
        const metadataPath = path.join(backupDir, backupId, 'backup-info.json');
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        return JSON.parse(metadataContent) as BackupInfo;
    } catch (error) {
        return null;
    }
};

// Restore backup
export const restoreBackup = async (backupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const backupInfo = await getBackupInfo(backupId);
        if (!backupInfo) {
            return { success: false, error: 'Backup not found' };
        }
        
        const backupPath = backupInfo.location;
        
        // Restore files
        for (const filePath of backupInfo.files) {
            try {
                const fileName = path.basename(filePath);
                const backupFilePath = path.join(backupPath, fileName);
                const stats = await fs.stat(backupFilePath);
                
                if (stats.isFile()) {
                    // Ensure destination directory exists
                    const destDir = path.dirname(filePath);
                    await fs.mkdir(destDir, { recursive: true });
                    
                    // Restore file
                    await fs.copyFile(backupFilePath, filePath);
                }
            } catch (e) {
                console.warn(`Failed to restore ${filePath}:`, e);
            }
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

// Delete backup
export const deleteBackup = async (backupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const backupDir = getBackupDir();
        const backupPath = path.join(backupDir, backupId);
        await fs.rm(backupPath, { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
};

// Clean old backups (keep last N backups)
export const cleanOldBackups = async (keepCount: number = 10): Promise<number> => {
    try {
        const backups = await listBackups();
        if (backups.length <= keepCount) {
            return 0;
        }
        
        const toDelete = backups.slice(keepCount);
        let deletedCount = 0;
        
        for (const backup of toDelete) {
            const result = await deleteBackup(backup.id);
            if (result.success) {
                deletedCount++;
            }
        }
        
        return deletedCount;
    } catch (error) {
        return 0;
    }
};

