# Build Configuration

This directory contains build-related files for electron-builder.

## Files

- `entitlements.mac.plist` - macOS entitlements for code signing and notarization
- `installer.nsh` - Custom NSIS installer script for Windows
- `dmg-background.png` - DMG background image (optional, create if needed)

## Code Signing & Notarization (macOS)

To enable code signing and notarization for macOS builds, set the following environment variables:

```bash
export APPLE_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_TEAM_ID="TEAM_ID"
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
```

Or create a `.env` file in the project root:

```
APPLE_IDENTITY=Developer ID Application: Your Name (TEAM_ID)
APPLE_TEAM_ID=TEAM_ID
APPLE_ID=your-apple-id@example.com
APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password
```

## Build Commands

- `npm run build:win` - Build for Windows
- `npm run build:mac` - Build for macOS
- `npm run build:linux` - Build for Linux
- `npm run build:all` - Build for all platforms
- `npm run pack` - Package without creating installer (for testing)

## Notes

- Code signing is optional for development builds
- Notarization is required for macOS distribution outside the App Store
- Windows builds don't require code signing for basic distribution
- Linux builds are unsigned by default
