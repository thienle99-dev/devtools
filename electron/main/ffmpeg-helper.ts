/**
 * FFmpeg Helper - Smart FFmpeg Detection
 * Phase 1+: Handle ffmpeg-static gracefully with fallbacks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FFmpegHelper {
    private static ffmpegPath: string | null = null;
    private static checked = false;

    /**
     * Get FFmpeg path with multiple fallback strategies
     */
    static getFFmpegPath(): string | null {
        if (this.checked && this.ffmpegPath) {
            return this.ffmpegPath;
        }

        this.checked = true;

        // Strategy 1: Check bundled FFmpeg in resources folder (HIGHEST PRIORITY)
        try {
            const resourcesPaths = [
                // Production app (app.asar.unpacked)
                path.join(process.resourcesPath, 'resources', 'bin', 'ffmpeg.exe'),
                path.join(process.resourcesPath, 'resources', 'bin', 'ffmpeg'),
                // Development
                path.join(process.cwd(), 'resources', 'bin', 'ffmpeg.exe'),
                path.join(process.cwd(), 'resources', 'bin', 'ffmpeg'),
            ];

            for (const testPath of resourcesPaths) {
                if (fs.existsSync(testPath)) {
                    console.log('✅ FFmpeg found in bundled resources:', testPath);

                    // Set executable permissions on Unix-like systems
                    if (process.platform !== 'win32') {
                        try {
                            fs.chmodSync(testPath, '755');
                        } catch (e) {
                            // Ignore permission errors
                        }
                    }

                    this.ffmpegPath = testPath;
                    return testPath;
                }
            }
        } catch (e) {
            console.warn('⚠️ Bundled FFmpeg check failed:', (e as Error).message);
        }

        // Strategy 2: Try ffmpeg-static package
        try {
            const { getStaticFFmpegPath } = require('./ffmpeg');
            const ffmpegPath = getStaticFFmpegPath();

            if (ffmpegPath && fs.existsSync(ffmpegPath)) {
                console.log('✅ FFmpeg found via ffmpeg-static:', ffmpegPath);

                // Set executable permissions on Unix-like systems
                if (process.platform !== 'win32') {
                    try {
                        fs.chmodSync(ffmpegPath, '755');
                    } catch (e) {
                        // Ignore permission errors
                    }
                }

                this.ffmpegPath = ffmpegPath;
                return ffmpegPath;
            } else {
                console.warn('⚠️ ffmpeg-static path not found:', ffmpegPath);
            }
        } catch (e) {
            console.warn('⚠️ ffmpeg-static package not available:', (e as Error).message);
        }

        // Strategy 3: Try global FFmpeg
        try {
            const command = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
            const globalPath = execSync(command, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim().split('\n')[0];

            if (globalPath && fs.existsSync(globalPath)) {
                console.log('✅ FFmpeg found globally:', globalPath);
                this.ffmpegPath = globalPath;
                return globalPath;
            }
        } catch (e) {
            // Global FFmpeg not found
        }

        // Strategy 4: Check common installation paths
        const commonPaths = this.getCommonFFmpegPaths();
        for (const testPath of commonPaths) {
            if (fs.existsSync(testPath)) {
                console.log('✅ FFmpeg found at common path:', testPath);
                this.ffmpegPath = testPath;
                return testPath;
            }
        }

        // Strategy 5: Check in app directory (for portable installs)
        const appDir = process.cwd();
        const portablePaths = [
            path.join(appDir, 'bin', 'ffmpeg.exe'),
            path.join(appDir, 'bin', 'ffmpeg'),
            path.join(appDir, 'ffmpeg.exe'),
            path.join(appDir, 'ffmpeg'),
        ];

        for (const testPath of portablePaths) {
            if (fs.existsSync(testPath)) {
                console.log('✅ FFmpeg found in app directory:', testPath);
                this.ffmpegPath = testPath;
                return testPath;
            }
        }

        console.error('❌ FFmpeg not found. Install FFmpeg or run: pnpm install --force');
        console.error('💡 Quick fix:');
        console.error('   Windows: choco install ffmpeg');
        console.error('   macOS: brew install ffmpeg');
        console.error('   Linux: sudo apt install ffmpeg');

        return null;
    }

    /**
     * Get common FFmpeg installation paths by platform
     */
    private static getCommonFFmpegPaths(): string[] {
        const platform = process.platform;

        if (platform === 'win32') {
            return [
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
                'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
                path.join(os.homedir(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
            ];
        } else if (platform === 'darwin') {
            return [
                '/usr/local/bin/ffmpeg',
                '/opt/homebrew/bin/ffmpeg',
                '/usr/bin/ffmpeg',
                path.join(os.homedir(), 'bin', 'ffmpeg'),
            ];
        } else {
            // Linux
            return [
                '/usr/bin/ffmpeg',
                '/usr/local/bin/ffmpeg',
                '/snap/bin/ffmpeg',
                path.join(os.homedir(), 'bin', 'ffmpeg'),
            ];
        }
    }

    /**
     * Check if FFmpeg is available
     */
    static isFFmpegAvailable(): boolean {
        return this.getFFmpegPath() !== null;
    }

    /**
     * Get FFmpeg version
     */
    static getFFmpegVersion(): string | null {
        const ffmpegPath = this.getFFmpegPath();
        if (!ffmpegPath) return null;

        try {
            const output = execSync(`"${ffmpegPath}" -version`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });

            const match = output.match(/ffmpeg version ([^\s]+)/);
            return match ? match[1] : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Reset cache (for testing)
     */
    static resetCache(): void {
        this.ffmpegPath = null;
        this.checked = false;
    }
}
