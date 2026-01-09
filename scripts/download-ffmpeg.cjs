/**
 * Download FFmpeg Binary for Bundling
 * This script downloads FFmpeg for the current platform
 * and places it in the resources folder for bundling
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG_VERSIONS = {
    win32: {
        url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
        filename: 'ffmpeg-win64.zip',
        binary: 'ffmpeg.exe',
        extractPath: 'bin/ffmpeg.exe'
    },
    darwin: {
        url: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        filename: 'ffmpeg-macos.zip',
        binary: 'ffmpeg',
        extractPath: 'ffmpeg'
    },
    linux: {
        url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
        filename: 'ffmpeg-linux.tar.xz',
        binary: 'ffmpeg',
        extractPath: 'ffmpeg'
    }
};

const RESOURCES_DIR = path.join(__dirname, '..', 'resources', 'bin');
const DOWNLOAD_DIR = path.join(__dirname, '..', '.download-cache');

// Create directories
if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        console.log(`📥 Downloading from: ${url}`);
        console.log(`📁 Saving to: ${dest}`);

        const file = fs.createWriteStream(dest);
        const client = url.startsWith('https') ? https : http;

        const request = client.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log(`🔄 Following redirect to: ${response.headers.location}`);
                file.close();
                fs.unlinkSync(dest);
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                return reject(new Error(`Failed to download: ${response.statusCode}`));
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize) {
                    const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
                    process.stdout.write(`\r📊 Progress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('\n✅ Download complete!');
                resolve();
            });
        });

        request.on('error', (err) => {
            file.close();
            fs.unlinkSync(dest);
            reject(err);
        });

        file.on('error', (err) => {
            file.close();
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function extractFFmpeg(platform) {
    const config = FFMPEG_VERSIONS[platform];
    const archivePath = path.join(DOWNLOAD_DIR, config.filename);
    const destPath = path.join(RESOURCES_DIR, config.binary);

    console.log(`📦 Extracting FFmpeg...`);

    try {
        if (platform === 'win32') {
            // Extract using PowerShell
            const extractDir = path.join(DOWNLOAD_DIR, 'extracted');
            if (!fs.existsSync(extractDir)) {
                fs.mkdirSync(extractDir, { recursive: true });
            }

            console.log('🔓 Extracting ZIP archive...');
            execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force"`, {
                stdio: 'inherit'
            });

            // Find the ffmpeg.exe in extracted folder
            const findFFmpeg = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        const result = findFFmpeg(fullPath);
                        if (result) return result;
                    } else if (file === 'ffmpeg.exe') {
                        return fullPath;
                    }
                }
                return null;
            };

            const ffmpegPath = findFFmpeg(extractDir);
            if (ffmpegPath) {
                console.log(`📋 Found FFmpeg at: ${ffmpegPath}`);
                fs.copyFileSync(ffmpegPath, destPath);
                console.log(`✅ Copied to: ${destPath}`);
            } else {
                throw new Error('FFmpeg binary not found in archive');
            }

            // Cleanup
            fs.rmSync(extractDir, { recursive: true, force: true });

        } else if (platform === 'darwin') {
            // macOS - unzip
            execSync(`unzip -o "${archivePath}" -d "${DOWNLOAD_DIR}"`, { stdio: 'inherit' });
            const extractedPath = path.join(DOWNLOAD_DIR, config.extractPath);
            fs.copyFileSync(extractedPath, destPath);
            fs.chmodSync(destPath, '755');

        } else {
            // Linux - tar
            execSync(`tar -xJf "${archivePath}" -C "${DOWNLOAD_DIR}"`, { stdio: 'inherit' });
            
            // Find ffmpeg in extracted folder
            const extractedDir = fs.readdirSync(DOWNLOAD_DIR).find(f => f.startsWith('ffmpeg-'));
            if (extractedDir) {
                const extractedPath = path.join(DOWNLOAD_DIR, extractedDir, 'ffmpeg');
                fs.copyFileSync(extractedPath, destPath);
                fs.chmodSync(destPath, '755');
            }
        }

        console.log(`✅ FFmpeg extracted successfully!`);
        console.log(`📍 Location: ${destPath}`);

        // Verify the binary works
        try {
            const version = execSync(`"${destPath}" -version`, { encoding: 'utf8' });
            const match = version.match(/ffmpeg version ([^\s]+)/);
            if (match) {
                console.log(`✅ FFmpeg version: ${match[1]}`);
            }
        } catch (e) {
            console.warn('⚠️  Could not verify FFmpeg version');
        }

    } catch (error) {
        console.error('❌ Extraction failed:', error.message);
        throw error;
    }
}

async function main() {
    const platform = process.platform;
    
    console.log('🚀 FFmpeg Bundler');
    console.log('================\n');
    console.log(`🖥️  Platform: ${platform}`);

    if (!FFMPEG_VERSIONS[platform]) {
        console.error(`❌ Unsupported platform: ${platform}`);
        process.exit(1);
    }

    const config = FFMPEG_VERSIONS[platform];
    const destBinary = path.join(RESOURCES_DIR, config.binary);

    // Check if already exists
    if (fs.existsSync(destBinary)) {
        console.log('✅ FFmpeg already exists at:', destBinary);
        try {
            const version = execSync(`"${destBinary}" -version`, { encoding: 'utf8' });
            const match = version.match(/ffmpeg version ([^\s]+)/);
            if (match) {
                console.log(`✅ Current version: ${match[1]}`);
            }
            console.log('\n💡 Delete the file to re-download');
            return;
        } catch (e) {
            console.log('⚠️  Existing binary is invalid, re-downloading...');
            fs.unlinkSync(destBinary);
        }
    }

    const archivePath = path.join(DOWNLOAD_DIR, config.filename);

    // Download if not cached
    if (!fs.existsSync(archivePath)) {
        console.log(`\n📥 Downloading FFmpeg for ${platform}...`);
        try {
            await downloadFile(config.url, archivePath);
        } catch (error) {
            console.error('❌ Download failed:', error.message);
            process.exit(1);
        }
    } else {
        console.log('✅ Using cached download');
    }

    // Extract
    try {
        await extractFFmpeg(platform);
        console.log('\n🎉 FFmpeg bundling complete!');
        console.log(`📁 Binary location: ${destBinary}`);
        console.log('✅ Ready to be bundled in the app');
    } catch (error) {
        console.error('❌ Failed to extract FFmpeg:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
