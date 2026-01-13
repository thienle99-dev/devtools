# Plugin Migration Phase 2 & 3: Medium & Low Priority Tools

## Overview

This document serves as a verification log and test plan for the migration of Medium and Low Priority tools to the Plugin Marketplace.

## 1. Migrated Tools (Removed from Core)

### Phase 2: Medium Priority

- **Advanced Image Tools**: `ImageConverter`, `ImageMetadata`, `ImageToAscii`, `DataUriGenerator`.
- **System Utilities**: `ApplicationManager`, `ClipboardManager`, `DeviceInfo`, `StatsMonitor`, `SystemCleaner`.

### Phase 3: Low Priority

- **Advanced Web Tools**: `MetaTagsGenerator`, `OpenGraphGenerator`, `RobotsTxtGenerator`, `HtmlWysiwyg`, `CspGenerator`, `StructuredDataGenerator`, `ManifestGenerator`, `SitemapGenerator`, `ServiceWorkerGenerator`, `CanonicalUrlGenerator`.
- **Network Tools**: `Ipv4SubnetCalculator`, `Ipv4Converter`, `MacGenerator`, `MacLookup`, `DownloadManager`.
- **Pipeline Tools**: `PipelineDesigner`, `LogAnalyzer`.
- **Security Tools**: `SecretsScanner`, `DataMasking`, `CertificateTools`, `PasswordPolicyTester`, `CsrGenerator`.
- **Data Converters**: `CsvExcelConverter`.
- **Advanced Crypto**: `BcryptGenerator`, `SymmetricEncryptor`, `RsaGenerator`.

## 2. Retained Core Tools

The following tools remain in the core application as they are lightweight and essential:

- **Web**: `UrlParser`, `BasicAuthGenerator`, `MimeTypesList`, `SlugGenerator`, `UserAgentParser`, `JwtParser`, `HttpStatusCode`, `KeycodeInfo`, `OtpGenerator`, `SafelinkDecoder`, `Base64UrlConverter`, `HttpHeaderParser`, `CookieParser`, `SetCookieGenerator`, `ContentTypeParser`.
- **Crypto**: `HashGenerator`, `UuidGenerator`, `TokenGenerator`, `HmacGenerator`, `BearerTokenGenerator`.
- **Dev**: `RegexTester`, `CrontabGenerator`, `ChmodCalculator`, `DockerConverter`, `MockDataGenerator`, `CodeSnippetGenerator`.
- **Text**: All text tools.
- **Math**: All math tools.
- **Media**: `VoiceRecorder`, `Camera`.

## 3. Verification Steps

### 3.1 Plugin Registry

- Verify `resources/plugin-registry.json` contains entries for:
  - `image-tools`
  - `system-utilities`
  - `advanced-web-tools`
  - `network-tools`
  - `pipeline-tools`
  - `security-tools`
  - `data-converters`

### 3.2 Marketplace

1. Launch the application (`npm run dev`).
2. Navigate to "Plugins" -> "Marketplace".
3. Verify all the above plugins are listed.
4. Verify the "Install" button is active for them (simulated).

### 3.3 Core Tool Cleanup

1. Verify that the migrated tools NO LONGER appear in the Sidebar or Dashboard search.
2. Verify that Core tools (e.g., "URL Parser", "Hash Generator", "UUID Generator") are STILL accessible and functional.

### 3.4 Codebase Cleanliness

- Verify `node_modules` does not contain unused heavy dependencies (future step: run `npm prune`).
- Verify `src/tools/registry/lazy-tools.ts` has migrated tools commented out.

## 4. Troubleshooting

If you encounter "Module not found" errors on build:

- Run `npm run type-check` (if configured) or `npx tsc --noEmit`.
- Ensure `src/tools/registry/lazy-tools.ts` does not export any component that has been deleted.
- Ensure `src/tools/registry/data/*.ts` files do not reference any deleted component from `lazy-tools`.

## 5. Next Steps

- Implement actual plugin loading logic (downloading zip, extracting, loading JS).
- Clean up `package.json` dependencies (remove `ffmpeg-static`, `pdf-lib`, `zxcvbn`, etc. if strictly plugin-only now).
