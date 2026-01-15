# Video Frame Tools - Feature Documentation

## Overview

**Video Frame Tools** is a comprehensive desktop utility for working with video frames. It provides two main features:
1. **Video to Frames**: Extract individual frames from video files
2. **Frames to Video**: Create videos from image sequences

---

## Features

### 1. Video to Frames

Extract frames from video files at a specified frame rate.

#### Capabilities
- **Video Support**: MP4, WebM, OGG, MOV, and other browser-supported video formats
- **Frame Rate Control**: Specify FPS (Frames Per Second) from 0.1 to 30 FPS
- **Time Range Selection**: Extract frames from specific start/end times
- **Multiple Formats**: Export frames as PNG, JPG, or WebP
- **Quality Control**: Adjustable quality for JPG compression
- **Batch Download**: Download all frames as ZIP file or individually
- **Preview**: See extracted frames with thumbnails and frame numbers
- **Video Metadata**: Display video duration and resolution

#### Workflow
1. Select a video file
2. Configure extraction settings (FPS, start/end time, format, quality)
3. Review metadata (duration, resolution)
4. Click "Extract Frames"
5. Preview extracted frames
6. Download as ZIP or individually

#### Technical Details
- Uses HTML5 `<video>` element for playback
- Canvas API for frame capture
- `canvas.toBlob()` for image conversion
- Supports both lossy (JPG) and lossless (PNG) formats

---

### 2. Frames to Video

Create videos from image sequences.

#### Capabilities
- **Image Support**: PNG, JPG, WebP image formats
- **Frame Rate**: Adjustable FPS (1-60 FPS)
- **Quality Levels**: Low, Medium, High quality settings
- **Frame Reordering**: Organize frames in any order
- **Preview**: See frames before creating video
- **Duration Calculator**: Shows estimated video duration

#### Workflow
1. Select image files (will be sorted by selection order)
2. Configure video settings (FPS, quality)
3. Review frame sequence with thumbnails
4. Click "Create Video"
5. Download resulting video file

#### Technical Details
- Uses MediaRecorder API for video encoding
- Canvas element for frame rendering
- `captureStream()` for canvas-to-video streaming
- WebM format output (VP9 codec)

---

## UI Components

### VideoFrames (Main Component)
- Tab-based interface for switching between extract/create modes
- Header with title and description
- Tabs for easy navigation

### VideoToFrames Component
- File upload area (drag-and-drop compatible)
- Video metadata display (duration, resolution)
- Extraction settings panel:
  - FPS slider (0.1-30)
  - Start/end time inputs
  - Format selector (PNG/JPG/WebP)
  - Quality slider (for JPG)
- Progress indicator during extraction
- Frame preview grid with frame numbers
- Action buttons (Extract, Download ZIP, Change Video, Reset)

### FramesToVideo Component
- File upload area for multiple images
- Frames list with thumbnails and file info
- Video settings panel:
  - FPS slider (1-60)
  - Quality selector (low/medium/high)
- Progress indicator during video creation
- Action buttons (Create Video, Reset)

---

## State Management

### VideoToFrames State
```typescript
- videoFile: File | null
- frames: FrameData[] // Contains blob, timestamp, index
- isProcessing: boolean
- progress: number (0-100)
- extractionSettings: {
    fps: number
    startTime: number
    endTime: number
    quality: number
    format: 'png' | 'jpg' | 'webp'
  }
- videoMetadata: {
    duration: number
    width: number
    height: number
  } | null
```

### FramesToVideo State
```typescript
- frames: File[]
- isProcessing: boolean
- progress: number (0-100)
- videoSettings: {
    fps: number
    codec: 'libx264' | 'libvpx'
    quality: 'low' | 'medium' | 'high'
  }
```

---

## Performance Optimization

### VideoToFrames
- Frame extraction happens asynchronously with progress tracking
- Only one frame at a time is processed to avoid memory issues
- Large videos are processed in chunks
- Canvas is properly cleaned up after use

### FramesToVideo
- Images are loaded asynchronously
- MediaRecorder handles real-time encoding
- Limited to reasonable file sizes to prevent memory overflow

---

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs
- `<video>` element
- Canvas API
- Blob API
- MediaRecorder API
- FileReader API

---

## Limitations & Edge Cases

### VideoToFrames
- **Large Videos**: May be slow with videos > 30 minutes
- **High FPS**: Extracting at 30 FPS requires significant processing time
- **Memory**: Very high resolution videos may cause memory issues
- **Format Support**: Limited to browser-supported video formats

### FramesToVideo
- **WebM Output**: Only WebM format currently supported
- **Ordering**: Frame order based on file selection order
- **File Size**: Large image sequences may take time to process
- **Codec**: VP9 codec may have compatibility issues with some players

---

## Future Enhancements

### Phase 2 Features
- [ ] FFmpeg.wasm integration for better codec support (MP4, H.265)
- [ ] Batch processing for multiple videos
- [ ] Custom frame selection (skip frames, extract every Nth frame)
- [ ] Video trimming/cutting functionality
- [ ] Frame rate conversion
- [ ] Video format conversion (MP4, MKV, etc.)
- [ ] GIF creation from frames
- [ ] Video compression options
- [ ] Thumbnail generation
- [ ] Timeline preview for video-to-frames

### Phase 3 Features
- [ ] Effects and filters
- [ ] Watermarking
- [ ] Metadata editing
- [ ] Concurrent frame extraction
- [ ] Background processing
- [ ] Drag-and-drop reordering
- [ ] Frame timing adjustment
- [ ] Color grading options

---

## Architecture

### Component Hierarchy
```
VideoFrames (Main)
├── Tabs UI
├── VideoToFrames
│   ├── Upload Section
│   ├── Video Metadata
│   ├── Extraction Settings
│   ├── Progress Indicator
│   ├── Frame Preview Grid
│   └── Action Buttons
└── FramesToVideo
    ├── Upload Section
    ├── Frames List
    ├── Video Settings
    ├── Progress Indicator
    └── Action Buttons
```

### Data Flow
```
User Action → State Update → Component Re-render → Canvas/Video Processing → Blob Generation → Download
```

---

## Technical Stack

### Dependencies
- React 18+
- TypeScript
- Lucide React (icons)
- Canvas API (built-in)
- MediaRecorder API (built-in)

### Optional Future Dependencies
- FFmpeg.wasm (for advanced codec support)
- JSZip (for ZIP file creation)

---

## Security Considerations

- **On-device Processing**: All processing happens locally in the browser
- **No Server Upload**: No data is sent to external servers
- **User Control**: Users have full control over file selection and processing
- **Memory Management**: Large files are processed in chunks to prevent memory leaks

---

## Testing Strategy

### Unit Tests
- Frame extraction logic
- Video creation logic
- State management
- Settings validation

### Integration Tests
- File upload and processing flow
- Frame extraction with various video formats
- Video creation with multiple images
- Settings persistence

### E2E Tests
- Complete extract workflow (video → frames → download)
- Complete create workflow (images → video → download)
- Error handling and edge cases
- Performance with large files

---

## Performance Targets

| Operation | Target Time | Status |
|-----------|------------|--------|
| Video metadata loading | <500ms | ✓ |
| Frame extraction (30 FPS) | <2s per second of video | ⏳ |
| Video creation (24 FPS) | <5s for 100 frames | ⏳ |
| Download ZIP | <1s | ✓ |
| Frame preview rendering | <200ms | ✓ |

---

## Known Issues

### Current
1. **WebM Only**: Frames to Video only supports WebM output
2. **Large Files**: May struggle with videos > 2GB
3. **Mobile**: Not optimized for mobile devices
4. **Codec Support**: Limited by browser video codec support

### Workarounds
- Use FFmpeg to convert video formats before processing
- Split large videos into smaller chunks
- Use desktop version for best experience
- Test codec support in target browser first

---

## User Guide

### Extracting Frames from Video
1. Open "Video Frame Tools"
2. Click "Video to Frames" tab
3. Click upload area and select video file
4. Adjust extraction settings:
   - FPS: Higher FPS = more frames
   - Time range: Extract specific portion
   - Format: Choose PNG/JPG/WebP
   - Quality: For JPG compression
5. Click "Extract Frames"
6. Wait for processing (see progress bar)
7. Download ZIP or individual frames

### Creating Video from Images
1. Open "Video Frame Tools"
2. Click "Frames to Video" tab
3. Click upload area and select image files
4. Images will be processed in order
5. Adjust video settings:
   - FPS: Higher = faster video
   - Quality: Affects file size/quality
6. Click "Create Video"
7. Wait for processing
8. Download WebM video file

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Video not loading | Ensure format is supported by browser |
| Frames won't extract | Check browser console for errors, try smaller video |
| Video creation fails | Reduce number of images or image resolution |
| Large file download | Check browser download folder, allow time for ZIP creation |
| Memory issues | Use fewer frames or lower resolution images |

---

## Roadmap

### Q1 2026
- ✓ MVP: Video to Frames, Frames to Video
- Frame preview grid
- ZIP download functionality
- Settings UI

### Q2 2026
- FFmpeg.wasm integration
- MP4 and H.265 support
- GIF creation
- Advanced frame selection (every Nth frame)

### Q3 2026
- Batch processing
- Effects and filters
- Video trimming
- Watermarking

### Q4 2026
- Performance optimization
- Desktop app optimization
- Advanced features
- Community feedback integration

---
