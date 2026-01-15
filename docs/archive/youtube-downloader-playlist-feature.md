# Playlist Support - Feature Documentation

## ✅ **Overview**

Playlist Support allows users to download multiple videos from a YouTube playlist directly within the application. It features automated URL detection, a dedicated playlist view with video selection, batch processing, and comprehensive progress tracking.

### **Features Implemented:**

1.  **Smart URL Detection**:
    - Automatically detects playlist URLs (e.g., `youtube.com/playlist?list=...` or `watch?v=...&list=...`).
    - Switches the UI from single video mode to playlist mode automatically.

2.  **Playlist Information Fetching**:
    - **Backend**: Uses `yt-dlp --flat-playlist` to quickly fetch metadata for all videos in a playlist without downloading them.
    - **Data**: Retrieves playlist title, total video count, and individual video details (title, duration, thumbnail).

3.  **Interactive Playlist UI (`PlaylistView`)**:
    - **Header**: Displays playlist title and total video count.
    - **Selection Controls**: "Select All" and "Deselect All" buttons for quick bulk actions.
    - **Video List**: Scrollable list of videos with thumbnails, titles, and durations.
    - **Checkboxes**: Individual selection toggle for each video.
    - **Summary**: Real-time update of selected video count and total duration.

4.  **Batch Download Manager**:
    - **Sequential Processing**: Downloads selected videos one by one to avoid rate limiting and ensure stability.
    - **Progress Tracking**:
      - **Overall**: Shows "Downloading X/Y videos".
      - **Individual**: Displays progress bar, speed, and ETA for the currently downloading video.
    - **Cancellation**: Allows cancelling the entire batch process at any time.
    - **Error Handling**: Skips failed videos and continues with the rest of the queue, reporting a summary at the end.

5.  **State Management**:
    - `isPlaylist`: Toggles UI mode.
    - `playlistInfo`: Stores fetched playlist metadata.
    - `selectedVideos`: Tracks user selection (`Set<string>`).
    - `downloadStatus`: Manages overall batch status and messages.

---

## 🔧 **Technical Implementation**

### **1. Backend: `getPlaylistInfo`**

Located in `electron/main/youtube-downloader.ts`:

```typescript
async getPlaylistInfo(url: string) {
    // 1. Validates URL
    // 2. Runs yt-dlp with --flat-playlist --skip-download
    // 3. Parses entries and returns structured data
    return {
        playlistId: string,
        title: string,
        videoCount: number,
        videos: Array<VideoEntry>
    };
}
```

### **2. Frontend: `YoutubeDownloader.tsx` Integration**

- **URL Detection**:

  ```typescript
  const isPlaylistUrl = (url: string) => /[?&]list=([a-zA-Z0-9_-]+)/.test(url);
  ```

- **Batch Loop**:
  ```typescript
  for (let i = 0; i < selected.length; i++) {
    if (isCancelledRef.current) break;
    // ... fetch video info and download ...
    // ... handle success/fail counts ...
  }
  ```

### **3. UI Component: `PlaylistView.tsx`**

A standalone React component designed for reusability and clean separation of concerns. It handles the presentation logic for the playlist data and emits events (`onToggleVideo`, `onSelectAll`, etc.) to the parent container.

---

## 🎨 **User Flow**

1.  **Paste URL**: User pastes a YouTube playlist link.
2.  **Auto-Load**: App detects the list parameter, fetches info, and displays the `PlaylistView`.
3.  **Select Videos**: User selects specific videos or clicks "Select All".
4.  **Start Download**: User clicks "Download Selected Videos".
5.  **Monitor Progress**: User watches the batch progress (e.g., "Downloading 1/5: Video Title").
6.  **Completion**: App notifies "Batch Download Complete" with a success/fail summary.

---

## 📝 **Future Improvements**

- **Parallel Downloads**: Allow downloading 2-3 videos simultaneously (requires careful rate limit management).
- **Resume Capability**: Save batch state to resume interrupted playlist downloads.
- **Selective Quality**: Allow choosing quality for the entire batch (currently follows global selection or defaults).
- **Folder Organization**: Option to create a subfolder with the playlist name.
