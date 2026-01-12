/**
 * Common File Types
 */

export interface FileData {
    name: string;
    path: string;
    size: number;
    type: string;
    lastModified: number;
}

export interface FolderData {
    name: string;
    path: string;
    files: FileData[];
    subfolders: FolderData[];
}

export interface FileSelectionOptions {
    multiple?: boolean;
    directory?: boolean;
    filters?: {
        name: string;
        extensions: string[];
    }[];
}

export type FileSystemPermission = 'read' | 'write' | 'none';
