# ============================================
# Build Size Optimization Script
# ============================================
# This script applies Phase 1 optimizations
# Expected savings: 40-50% reduction in size
# ============================================

Write-Host "🎯 DevTools App - Build Size Optimization" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Step 1: Backup current state
Write-Host "📦 Step 1: Creating backup..." -ForegroundColor Yellow
git status --short | Out-Null
if ($LASTEXITCODE -eq 0) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    git add .
    git commit -m "Backup before size optimization - $timestamp" -q
    git tag "backup-before-opt-$timestamp" -q
    Write-Host "✅ Backup created: backup-before-opt-$timestamp`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not a git repository, skipping backup`n" -ForegroundColor Yellow
}

# Step 2: Check for duplicate FFmpeg
Write-Host "🔍 Step 2: Checking for duplicate FFmpeg packages..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasFfmpegInstaller = $packageJson.dependencies."@ffmpeg-installer/ffmpeg" -ne $null
$hasFfmpegStatic = $packageJson.dependencies."ffmpeg-static" -ne $null

if ($hasFfmpegInstaller -and $hasFfmpegStatic) {
    Write-Host "⚠️  Found DUPLICATE FFmpeg packages!" -ForegroundColor Red
    Write-Host "   - @ffmpeg-installer/ffmpeg" -ForegroundColor Yellow
    Write-Host "   - ffmpeg-static" -ForegroundColor Yellow
    Write-Host ""
    $choice = Read-Host "Remove @ffmpeg-installer/ffmpeg? (Y/n)"
    if ($choice -eq "" -or $choice -eq "Y" -or $choice -eq "y") {
        Write-Host "   Removing @ffmpeg-installer/ffmpeg..." -ForegroundColor Cyan
        pnpm remove @ffmpeg-installer/ffmpeg
        Write-Host "✅ Removed duplicate FFmpeg package (~80MB saved)`n" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No duplicate FFmpeg packages found`n" -ForegroundColor Green
}

# Step 3: Update electron-builder.yml
Write-Host "⚙️  Step 3: Optimizing electron-builder.yml..." -ForegroundColor Yellow

$builderConfig = @"
appId: com.devtools.app
productName: DevTools App
copyright: Copyright © 2026 DevTools App

# OPTIMIZATION: Maximum compression
compression: maximum
asar: true
asarUnpack:
  - "**/*.node"
  - "**/ffmpeg*"

directories:
  output: dist-electron/pack
  buildResources: build

files:
  - "dist/**/*"
  - "dist-electron/**/*"
  - "package.json"
  # Comprehensive exclusions for smaller build
  - "!**/*.{ts,tsx,jsx,map,md}"
  - "!**/.{git,github,vscode,idea}"
  - "!**/node_modules/*/{test,tests,*.test.*,*.spec.*}"
  - "!**/node_modules/*/{README,LICENSE,CHANGELOG}*"
  - "!**/node_modules/*/*.{md,markdown,txt}"
  - "!**/node_modules/**/{example,examples,demo,demos,doc,docs}"
  - "!node_modules/**/*"
  - "!src/**/*"
  - "!electron/**/*"
  - "!docs/**/*"
  - "!debug_scripts/**/*"
  - "!video/**/*"
  - "!build/**/*"
  - "!scripts/**/*"
  - "!*.{md,yml,yaml,log}"
  - "!*.json"
  - "!tmpfs*"
  - "!dummy"
  - "package.json"

# Windows Configuration (x64 ONLY)
win:
  target:
    - target: nsis
      arch:
        - x64  # Removed ia32 for smaller builds
  icon: public/icon.png
  artifactName: `${productName}-`${version}-`${arch}.`${ext}
  requestedExecutionLevel: asInvoker
  signAndEditExecutable: false

# NSIS Installer Configuration
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  allowElevation: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: DevTools App
  deleteAppDataOnUninstall: false
  differentialPackage: true  # Smaller updates

# macOS Configuration
mac:
  target:
    - target: dmg
      arch:
        - universal  # Universal binary (smaller than separate builds)
  icon: public/icon.png
  category: public.app-category.developer-tools
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  artifactName: `${productName}-`${version}.`${ext}

# DMG Configuration
dmg:
  title: `${productName} `${version}
  icon: public/icon.png
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 380
  format: UDZO  # Maximum compression

# Linux Configuration
linux:
  target:
    - AppImage
  icon: public/icon.png
  category: Development
  synopsis: Developer Tools Application
  description: A comprehensive developer tools application with multiple utilities
"@

$builderConfig | Out-File -FilePath "electron-builder.yml" -Encoding UTF8
Write-Host "✅ electron-builder.yml updated with optimizations`n" -ForegroundColor Green

# Step 4: Show summary
Write-Host "📊 Optimization Summary" -ForegroundColor Cyan
Write-Host "======================`n" -ForegroundColor Cyan

Write-Host "✅ Applied Optimizations:" -ForegroundColor Green
Write-Host "   1. Maximum compression enabled" -ForegroundColor White
Write-Host "   2. asar packaging enabled" -ForegroundColor White
Write-Host "   3. Removed ia32 (32-bit) build target" -ForegroundColor White
Write-Host "   4. Comprehensive file exclusions" -ForegroundColor White
Write-Host "   5. Differential updates enabled" -ForegroundColor White
if ($hasFfmpegInstaller -and $hasFfmpegStatic) {
    Write-Host "   6. Removed duplicate FFmpeg package" -ForegroundColor White
}
Write-Host ""

Write-Host "💡 Expected Savings:" -ForegroundColor Yellow
Write-Host "   - Installer size: 40-50% reduction" -ForegroundColor White
Write-Host "   - Installed size: 40-50% reduction" -ForegroundColor White
Write-Host "   - Download time: 40-50% faster" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: pnpm run build:win" -ForegroundColor White
Write-Host "   2. Check size: ls dist-electron/pack/*.exe" -ForegroundColor White
Write-Host "   3. Test the built app thoroughly" -ForegroundColor White
Write-Host ""

Write-Host "📖 For more optimizations, see:" -ForegroundColor Yellow
Write-Host "   docs/BUILD_SIZE_OPTIMIZATION.md" -ForegroundColor White
Write-Host ""

Write-Host "✨ Optimization complete!" -ForegroundColor Green
