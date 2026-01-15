# Audio Extractor Implementation Plan

## Overview

Extract and process audio from video files with various quality options and audio processing features.

## Features (from FEATURE_SUGGESTIONS.md)

- ✅ Extract audio track from video
- ✅ Format selection (MP3, AAC, FLAC, WAV, OGG, M4A)
- ✅ Quality/bitrate options (64k - 320k)
- ✅ Trim audio (start/end time)
- ✅ Normalize volume
- ✅ Fade in/out effects
- ✅ Batch extraction (multiple files)
- ✅ Real-time preview

## Architecture

### Backend (`electron/main/audio-extractor.ts`)

- `AudioExtractor` class
- `extractAudio(options)` - Main extraction logic
- `getAudioInfo(filePath)` - Get audio metadata from video
- `processAudio(options)` - Apply effects (normalize, fade, trim)
- `batchExtract(files, options)` - Process multiple files
- Uses FFmpeg for all processing

### Frontend (`src/tools/media/AudioExtractor.tsx`)

- File selection (drag & drop, file picker)
- Audio format selector (MP3, AAC, FLAC, WAV, OGG, M4A)
- Quality/bitrate slider
- Trim controls (start/end time with preview)
- Audio effects toggles (normalize, fade in/out)
- Batch processing queue
- Progress tracking

### Types (`src/types/audio-extractor.ts`)

```typescript
interface AudioExtractionOptions {
  inputPath: string;
  outputPath?: string;
  format: "mp3" | "aac" | "flac" | "wav" | "ogg" | "m4a";
  bitrate?: string; // '64k', '128k', '192k', '256k', '320k'
  sampleRate?: number; // 44100, 48000
  channels?: 1 | 2; // mono or stereo
  trim?: {
    start?: number; // seconds
    end?: number; // seconds
  };
  normalize?: boolean;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

interface AudioInfo {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  size: number;
}

interface AudioExtractionProgress {
  id: string;
  filename: string;
  percent: number;
  state: "processing" | "complete" | "error";
  outputPath?: string;
}
```

## Implementation Steps

### Phase 1: Backend Service

1. Create `electron/main/audio-extractor.ts`
2. Implement FFmpeg commands for:
   - Audio extraction
   - Format conversion
   - Bitrate/quality control
   - Trimming
   - Volume normalization
   - Fade effects
3. Add progress tracking via FFmpeg output parsing

### Phase 2: IPC Integration

1. Register handlers in `electron/main/main.ts`:
   - `audio:extract`
   - `audio:get-info`
   - `audio:batch-extract`
   - `audio:cancel`
2. Expose API in `electron/preload/preload.ts`
3. Update `src/vite-env.d.ts`

### Phase 3: Frontend UI

1. Create main component `AudioExtractor.tsx`
2. Build sub-components:
   - `AudioFileSelector.tsx` - Drag & drop + file picker
   - `AudioFormatOptions.tsx` - Format, bitrate, quality
   - `AudioTrimmer.tsx` - Timeline with trim handles
   - `AudioEffects.tsx` - Normalize, fade controls
   - `AudioBatchQueue.tsx` - Multiple file processing
3. Integrate progress tracking

### Phase 4: Tool Registration

1. Add to `src/tools/registry.tsx`
2. Add icon and metadata

## FFmpeg Commands Reference

### Basic Extraction

```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame -b:a 192k output.mp3
```

### With Trim

```bash
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:02:30 -vn -acodec libmp3lame output.mp3
```

### With Normalize

```bash
ffmpeg -i input.mp4 -vn -af loudnorm -acodec libmp3lame output.mp3
```

### With Fade

```bash
ffmpeg -i input.mp4 -vn -af "afade=t=in:d=3,afade=t=out:st=57:d=3" output.mp3
```

### Combined Effects

```bash
ffmpeg -i input.mp4 -ss 10 -to 150 -vn -af "loudnorm,afade=t=in:d=2,afade=t=out:st=138:d=2" -acodec libmp3lame -b:a 192k output.mp3
```

## Time Estimate

- Backend: 2-3 hours
- Frontend: 3-4 hours
- Testing & Polish: 1-2 hours
- **Total: ~1 day**
