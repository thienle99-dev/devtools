// Space Lens Export and Snapshot Utilities

import type { SpaceLensNode } from '../types';

export interface SpaceLensSnapshot {
    id: string;
    timestamp: Date;
    path: string;
    root: SpaceLensNode;
    totalSize: number;
}

/**
 * Export space lens tree to JSON
 */
export function exportSpaceLensToJSON(node: SpaceLensNode): string {
    return JSON.stringify(node, null, 2);
}

/**
 * Export space lens tree to CSV
 */
export function exportSpaceLensToCSV(node: SpaceLensNode): string {
    const rows: string[] = ['Path,Name,Size,Type'];
    
    const traverse = (n: SpaceLensNode, parentPath = '') => {
        const fullPath = parentPath ? `${parentPath}/${n.name}` : n.name;
        rows.push(`"${fullPath}","${n.name}",${n.size},"${n.type}"`);
        
        if (n.children) {
            n.children.forEach(child => traverse(child, fullPath));
        }
    };
    
    traverse(node);
    return rows.join('\n');
}

/**
 * Create a snapshot of current space lens state
 */
export function createSnapshot(node: SpaceLensNode, path: string): SpaceLensSnapshot {
    return {
        id: `snapshot-${Date.now()}`,
        timestamp: new Date(),
        path,
        root: JSON.parse(JSON.stringify(node)), // Deep clone
        totalSize: node.size
    };
}

/**
 * Compare two snapshots
 */
export function compareSnapshots(
    snapshot1: SpaceLensSnapshot,
    snapshot2: SpaceLensSnapshot
): {
    added: SpaceLensNode[];
    removed: SpaceLensNode[];
    changed: Array<{ node: SpaceLensNode; oldSize: number; newSize: number }>;
} {
    const added: SpaceLensNode[] = [];
    const removed: SpaceLensNode[] = [];
    const changed: Array<{ node: SpaceLensNode; oldSize: number; newSize: number }> = [];

    const buildPathMap = (node: SpaceLensNode, map: Map<string, SpaceLensNode>, parentPath = '') => {
        const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        map.set(fullPath, node);
        
        if (node.children) {
            node.children.forEach(child => buildPathMap(child, map, fullPath));
        }
    };

    const map1 = new Map<string, SpaceLensNode>();
    const map2 = new Map<string, SpaceLensNode>();
    
    buildPathMap(snapshot1.root, map1);
    buildPathMap(snapshot2.root, map2);

    // Find added and changed
    for (const [path, node2] of map2.entries()) {
        const node1 = map1.get(path);
        if (!node1) {
            added.push(node2);
        } else if (node1.size !== node2.size) {
            changed.push({ node: node2, oldSize: node1.size, newSize: node2.size });
        }
    }

    // Find removed
    for (const [path, node1] of map1.entries()) {
        if (!map2.has(path)) {
            removed.push(node1);
        }
    }

    return { added, removed, changed };
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

