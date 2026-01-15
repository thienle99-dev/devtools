# Universal Media Downloader Implementation Plan

## 1. Overview

Create a unified "Universal Media Downloader" tool that supports downloading videos and audio from extensive platforms supported by `yt-dlp` (Instagram, Facebook, Twitter/X, Reddit, Twitch, etc.), providing a single, streamlined interface for all media needs.

## 2. Architecture

### Backend (`electron/main/`)

- **`universal-downloader.ts`**: A generic wrapper around `yt-dlp`.
  - `getVideoInfo(url)`: Generic metadata fetching.
  - `downloadMedia(options)`: Generic download execution.
  - Support for platform-specific arguments (cookies, user-agent) via a config system.

### Frontend (`src/tools/media/`)

- **`UniversalDownloader.tsx`**: The main container.
- **`components/`**:
  - `PlatformDetector.tsx`: Visual feedback on detected platform.
  - `UniversalVideoInfo.tsx`: Generic data display (Thumbnail, Title, Duration, Platform Icon).
  - `UniversalFormatSelector.tsx`: Simplified Audio/Video toggle and Quality selection.
- **`utils/`**:
  - `platform-detector.ts`: Regex patterns to identify supported platforms.
  - `platform-icons.tsx`: Map platforms to Lucide icons.

## 3. Implementation Steps

### Phase 1: Backend Service

1.  Create `electron/main/universal-downloader.ts`.
    - Implement `UniversalDownloader` class.
    - Reuse `yt-dlp` binary management.
    - Implement generic `getVideoInfo` parsing (mapping various `yt-dlp` JSON outputs to a standard interface).
2.  Register IPC handlers in `electron/main/main.ts`:
    - `universal:get-info`
    - `universal:download`
    - `universal:cancel`
    - `universal:get-history`
3.  Expose API in `electron/preload/preload.ts`: `window.universalAPI`.

### Phase 2: React Components

1.  Create `utils/platform-detector.ts` to identify URL types.
2.  Create `UniversalDownloader.tsx` with a clean, "paste-any-link" interface.
3.  Implement `UniversalVideoInfo.tsx` to handle variable metadata (some platforms might lack duration or specific authors).
4.  Implement `UniversalFormatSelector.tsx`.
5.  Reuse `DownloadProgress` component.

### Phase 3: Integration

1.  Register tool in `src/tools/registry.tsx`.
2.  Add routes and icons.

### Phase 4: Platform Specifics (Iterative)

- **Instagram**: Handle Reels vs Posts vs Stories.
- **Facebook**: Handle Watch vs generic video validation.
- **Twitter/X**: Handle highest quality selection.

## 4. Technical Details

### Standardized `MediaInfo` Interface

```typescript
interface UniversalMediaInfo {
  id: string;
  url: string;
  title: string;
  platform:
    | "youtube"
    | "tiktok"
    | "instagram"
    | "facebook"
    | "twitter"
    | "twitch"
    | "reddit"
    | "other";
  thumbnailUrl: string;
  author?: string;
  duration?: number;
  uploadDate?: string;
  isLive?: boolean;
  formats: {
    id: string;
    ext: string;
    quality: string;
    hasAudio: boolean;
    hasVideo: boolean;
  }[];
}
```

### Supported Platforms (Initial Focus)

- Instagram
- Facebook
- Twitter (X)
- Reddit
- Twitch
- Pinterest
- LinkedIn

## 5. Next Steps

1.  Scaffold backend service.
2.  Define shared types.
3.  Implement IPC.
