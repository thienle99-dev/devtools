# Test Coverage Plan

This document lists the critical files and modules that require unit testing to ensure stability during refactoring.

## Priority 1: Core Logic & Utilities

These modules contain pure functions and shared logic used throughout the application.

- [x] **Crypto Logic**: `src/tools/crypto/logic.test.ts`
  - `src/tools/crypto/logic.ts` (Hash, HMAC, Encryption, Token/ID generation)
- [x] **File I/O**: `src/utils/fileIo.test.ts`
  - `src/utils/fileIo.ts` (File reading, downloading)
- [x] **Validation Utils**
  - `src/utils/validation/` (Email, URL, JSON validation)
- [x] **Formatting Utils**
  - `src/utils/format/` (Date, Number, String formatting)
- [x] **Security Utils**
  - `src/tools/security/logic.ts` (CSR, Password policy)

## Priority 2: Backend Logic (Electron)

Critical backend services that manage system resources and extensions.

- [x] **Plugin Manager**: `electron/main/plugin-manager.test.ts`
  - Installation, Uninstallation, Registry fetching, Integrity checks.
  - _Note: Requires mocking `electron`, `electron-store`, `axios`, `adm-zip`, and `fs/promises`._
- [ ] **Download Manager**: `electron/main/download-manager.ts`
  - Queue management, Progress tracking.
- [ ] **Video Processing**: `electron/main/video-merger.ts`
  - FFmpeg command generation (logic only).

## Priority 3: Global State (MST/Zustand)

Complex state management logic.

- [x] **Xnapper Store**: `src/store/xnapperStore.test.ts`
  - Capture history, Editing state (Crop, Annotations).
- [x] **Workflow Store**: `src/store/workflowStore.test.ts`
  - Pipeline execution logic, Step management.
- [ ] **Settings Store**: `src/store/settingsStore.ts`
  - User preferences persistence.

## Priority 4: Complex Tool Logic

Tools with heavy isolated business logic.

- [ ] **Image Processing**: `src/tools/image/utils/`
  - filters, resizing logic.
- [ ] **Diff Logic**: `src/tools/text/diff-logic.ts` (if extracted)
  - Text comparison algorithms.

## Testing Strategy

1.  **Unit Tests**: Use `vitest` for pure logic (utils, independent classes).
2.  **Mocking**: Use `vi.mock()` for external dependencies (Electron APIs, File System, Network).
3.  **Environment**: Use `jsdom` for frontend logic, `node` environment for backend logic (can be configured per test file).
