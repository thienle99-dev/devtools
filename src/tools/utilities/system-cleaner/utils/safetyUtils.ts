import os from 'node:os';
import path from 'node:path';

export interface SafetyRule {
    path: string;
    type: 'file' | 'folder' | 'pattern';
    action: 'protect' | 'warn' | 'allow';
    reason: string;
    platform?: 'windows' | 'macos' | 'linux' | 'all';
}

export interface SafetyCheckResult {
    safe: boolean;
    warnings: SafetyWarning[];
    blocked: string[];
}

export interface SafetyWarning {
    path: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

// Platform-specific protected paths
const getPlatformProtectedPaths = (platform: string): SafetyRule[] => {
    const home = os.homedir();
    const rules: SafetyRule[] = [];

    if (platform === 'win32') {
        const windir = process.env.WINDIR || 'C:\\Windows';
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
        
        rules.push(
            // System directories
            { path: windir, type: 'folder', action: 'protect', reason: 'Windows system directory', platform: 'windows' },
            { path: programFiles, type: 'folder', action: 'protect', reason: 'Program Files directory', platform: 'windows' },
            { path: programFilesX86, type: 'folder', action: 'protect', reason: 'Program Files (x86) directory', platform: 'windows' },
            { path: 'C:\\ProgramData', type: 'folder', action: 'protect', reason: 'ProgramData directory', platform: 'windows' },
            { path: 'C:\\System Volume Information', type: 'folder', action: 'protect', reason: 'System Volume Information', platform: 'windows' },
            
            // User documents
            { path: path.join(home, 'Documents'), type: 'folder', action: 'warn', reason: 'User Documents folder', platform: 'windows' },
            { path: path.join(home, 'Desktop'), type: 'folder', action: 'warn', reason: 'User Desktop folder', platform: 'windows' },
            { path: path.join(home, 'Pictures'), type: 'folder', action: 'warn', reason: 'User Pictures folder', platform: 'windows' },
            { path: path.join(home, 'Videos'), type: 'folder', action: 'warn', reason: 'User Videos folder', platform: 'windows' },
            { path: path.join(home, 'Music'), type: 'folder', action: 'warn', reason: 'User Music folder', platform: 'windows' },
            
            // Critical system files
            { path: path.join(windir, 'System32'), type: 'folder', action: 'protect', reason: 'System32 directory', platform: 'windows' },
            { path: path.join(windir, 'SysWOW64'), type: 'folder', action: 'protect', reason: 'SysWOW64 directory', platform: 'windows' },
            { path: path.join(windir, 'boot'), type: 'folder', action: 'protect', reason: 'Boot directory', platform: 'windows' },
        );
    } else if (platform === 'darwin') {
        rules.push(
            // System directories
            { path: '/System', type: 'folder', action: 'protect', reason: 'macOS System directory', platform: 'macos' },
            { path: '/Library', type: 'folder', action: 'protect', reason: 'System Library directory', platform: 'macos' },
            { path: '/Applications', type: 'folder', action: 'warn', reason: 'Applications directory', platform: 'macos' },
            { path: '/usr', type: 'folder', action: 'protect', reason: 'Unix system resources', platform: 'macos' },
            { path: '/bin', type: 'folder', action: 'protect', reason: 'System binaries', platform: 'macos' },
            { path: '/sbin', type: 'folder', action: 'protect', reason: 'System binaries', platform: 'macos' },
            { path: '/etc', type: 'folder', action: 'protect', reason: 'System configuration', platform: 'macos' },
            { path: '/var', type: 'folder', action: 'warn', reason: 'Variable data directory', platform: 'macos' },
            
            // User documents
            { path: path.join(home, 'Documents'), type: 'folder', action: 'warn', reason: 'User Documents folder', platform: 'macos' },
            { path: path.join(home, 'Desktop'), type: 'folder', action: 'warn', reason: 'User Desktop folder', platform: 'macos' },
            { path: path.join(home, 'Pictures'), type: 'folder', action: 'warn', reason: 'User Pictures folder', platform: 'macos' },
            { path: path.join(home, 'Movies'), type: 'folder', action: 'warn', reason: 'User Movies folder', platform: 'macos' },
            { path: path.join(home, 'Music'), type: 'folder', action: 'warn', reason: 'User Music folder', platform: 'macos' },
            
            // User Library (with caution)
            { path: path.join(home, 'Library', 'Application Support'), type: 'folder', action: 'warn', reason: 'Application Support data', platform: 'macos' },
            { path: path.join(home, 'Library', 'Preferences'), type: 'folder', action: 'warn', reason: 'Application preferences', platform: 'macos' },
        );
    }

    return rules;
};

// Pattern-based rules
const getPatternRules = (): SafetyRule[] => {
    return [
        // Common system file patterns
        { path: '**/.DS_Store', type: 'pattern', action: 'allow', reason: 'macOS metadata file', platform: 'macos' },
        { path: '**/Thumbs.db', type: 'pattern', action: 'allow', reason: 'Windows thumbnail cache', platform: 'windows' },
        { path: '**/desktop.ini', type: 'pattern', action: 'warn', reason: 'Windows folder settings', platform: 'windows' },
        
        // Important file extensions
        { path: '**/*.dll', type: 'pattern', action: 'warn', reason: 'Dynamic Link Library', platform: 'windows' },
        { path: '**/*.sys', type: 'pattern', action: 'protect', reason: 'System file', platform: 'windows' },
        { path: '**/*.exe', type: 'pattern', action: 'warn', reason: 'Executable file', platform: 'windows' },
        { path: '**/*.app', type: 'pattern', action: 'warn', reason: 'macOS application bundle', platform: 'macos' },
    ];
};

// Check if a file path matches a pattern
const matchesPattern = (filePath: string, pattern: string): boolean => {
    // Simple glob pattern matching
    const regex = new RegExp(
        '^' + pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
        + '$'
    );
    return regex.test(filePath);
};

// Check file safety
export const checkFileSafety = (filePath: string, platform: string): SafetyCheckResult => {
    const warnings: SafetyWarning[] = [];
    const blocked: string[] = [];
    
    const platformRules = getPlatformProtectedPaths(platform);
    const patternRules = getPatternRules();
    const allRules = [...platformRules, ...patternRules].filter(
        rule => !rule.platform || rule.platform === platform || rule.platform === 'all'
    );
    
    for (const rule of allRules) {
        let matches = false;
        
        if (rule.type === 'file' || rule.type === 'folder') {
            const normalizedRulePath = path.normalize(rule.path);
            const normalizedFilePath = path.normalize(filePath);
            
            if (normalizedFilePath === normalizedRulePath || normalizedFilePath.startsWith(normalizedRulePath + path.sep)) {
                matches = true;
            }
        } else if (rule.type === 'pattern') {
            matches = matchesPattern(filePath, rule.path);
        }
        
        if (matches) {
            if (rule.action === 'protect') {
                blocked.push(filePath);
                return {
                    safe: false,
                    warnings: [],
                    blocked: [filePath]
                };
            } else if (rule.action === 'warn') {
                warnings.push({
                    path: filePath,
                    reason: rule.reason,
                    severity: 'high'
                });
            }
        }
    }
    
    return {
        safe: blocked.length === 0,
        warnings,
        blocked
    };
};

// Check multiple files
export const checkFilesSafety = (filePaths: string[], platform: string): SafetyCheckResult => {
    const allWarnings: SafetyWarning[] = [];
    const allBlocked: string[] = [];
    
    for (const filePath of filePaths) {
        const result = checkFileSafety(filePath, platform);
        if (!result.safe) {
            allBlocked.push(...result.blocked);
        }
        allWarnings.push(...result.warnings);
    }
    
    return {
        safe: allBlocked.length === 0,
        warnings: allWarnings,
        blocked: allBlocked
    };
};

