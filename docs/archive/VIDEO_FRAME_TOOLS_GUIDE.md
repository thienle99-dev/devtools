# Video Frame Tools - Quick Start Guide

## 🚀 Getting Started

The Video Frame Tools have been successfully integrated into the application. You can now access them from the main tools menu.

### How to Access
1. Open the DevTools application
2. Look for **"Video Frame Tools"** in the Utilities category
3. Click to open the tool

---

## 📺 Feature 1: Video to Frames

Extract individual frames from a video file.

### Step-by-Step Guide

1. **Open Video to Frames Tab**
   - Default tab when you open the tool

2. **Select Your Video**
   - Click the upload area or drag-and-drop a video file
   - Supported formats: MP4, WebM, OGG, MOV, and more

3. **View Video Information**
   - Duration (e.g., 2:45)
   - Resolution (e.g., 1920x1080)

4. **Configure Extraction Settings**
   - **FPS (Frames Per Second)**: Controls how many frames to extract per second
     - 1 FPS = 1 frame per second
     - 10 FPS = 10 frames per second
     - Higher FPS = more frames (slower processing)
   
   - **Start Time**: Beginning of the extraction (in seconds)
   - **End Time**: End of the extraction (in seconds)
   
   - **Format**: Choose PNG (lossless), JPG (compressed), or WebP (modern)
   
   - **Quality** (for JPG only): Slider from 0-100%

5. **Extract Frames**
   - Click "Extract Frames" button
   - Watch the progress bar
   - Processing time depends on video length and FPS

6. **Download Frames**
   - **Download ZIP**: Get all frames in a single compressed file
   - **Individual Download**: Download each frame separately
   - Click "Reset" to process another video

### Example Scenarios

**Scenario 1: Convert 30-second video to 30 images**
- Set FPS: 1
- Set End Time: 30
- Result: 30 frames (1 per second)

**Scenario 2: Extract frames from specific portion**
- Set Start Time: 10 (skip first 10 seconds)
- Set End Time: 20 (stop at 20 seconds)
- Set FPS: 5
- Result: 50 frames from 10-20 second range

**Scenario 3: Compact frame extraction**
- Set FPS: 0.5
- Set End Time: 60
- Format: JPG at 50% quality
- Result: 30 frames, smaller file size

---

## 🎬 Feature 2: Frames to Video

Create a video from a sequence of image files.

### Step-by-Step Guide

1. **Open Frames to Video Tab**
   - Click the "Frames to Video" tab

2. **Select Your Images**
   - Click the upload area or drag-and-drop image files
   - Supported formats: PNG, JPG, WebP
   - **Important**: Images will be combined in the order you select them
   - Add at least 2 images

3. **View Your Frames**
   - See all frames listed with thumbnails
   - Each frame shows file name and size
   - Can remove individual frames with the X button

4. **Configure Video Settings**
   - **Frame Rate (FPS)**: Speed of the video
     - 24 FPS = standard video speed
     - 30 FPS = standard video speed (more common)
     - 60 FPS = smooth/slow-motion feel
   
   - **Quality**: File size and quality tradeoff
     - Low: Smaller file, lower quality
     - Medium: Balanced
     - High: Larger file, higher quality

5. **Create Video**
   - Click "Create Video" button
   - Watch the progress bar during encoding
   - Processing time depends on number of frames

6. **Download Video**
   - Video is automatically downloaded as `.webm` file
   - Can open in most modern video players
   - Click "Reset" to create another video

### Example Scenarios

**Scenario 1: Create a slideshow**
- Select 10 images
- Set FPS: 1
- Result: 10-second video showing one image per second

**Scenario 2: Create smooth animation**
- Select 24 images
- Set FPS: 24
- Result: 1-second smooth animation

**Scenario 3: Create presentation video**
- Select 50 screenshot frames
- Set FPS: 4
- Result: 12.5-second presentation video

---

## ⚙️ Settings Explained

### FPS (Frames Per Second)

**In Video to Frames:**
- Higher FPS = Extract more frames
- 1 FPS = 1 frame per second of video
- 10 FPS = 10 frames per second of video
- Useful when you need very detailed frame-by-frame analysis

**In Frames to Video:**
- FPS affects how fast the video plays
- 24 FPS = Standard cinema speed
- 30 FPS = Standard video/broadcast speed
- 60 FPS = Smooth/slow-motion feel

### Quality Settings

**PNG Format:**
- Lossless (no quality loss)
- Larger file size
- Best for pristine images

**JPG Format:**
- Lossy (some detail loss)
- Smaller file size
- Quality slider from 0-100%
- Lower quality = smaller file

**WebP Format:**
- Modern format
- Balanced quality and size
- Good compromise

---

## 💡 Pro Tips

### For Video to Frames
1. **Large Video Files**: Extract at lower FPS to reduce number of frames
2. **ZIP Download**: Easier for transferring many frames
3. **Time Range**: Extract specific scenes instead of full video
4. **Format Choice**: Use PNG for editing, JPG for sharing

### For Frames to Video
1. **Frame Order**: Arrange frames in file explorer before upload
2. **Frame Rate**: 24 FPS works for most uses
3. **Quality**: Lower quality for faster sharing, High for archiving
4. **Thumbnails**: Preview helps verify frame sequence

---

## 🔍 Troubleshooting

### Video Won't Load
- Ensure video format is supported by your browser
- Try converting to MP4 with FFmpeg or another tool
- Check file isn't corrupted

### Frames Won't Extract
- Video might be too long - try extracting smaller sections
- Try lower FPS to reduce memory usage
- Check browser console for specific error messages

### Video Creation Fails
- Reduce number of images
- Try lower quality setting
- Check if images are very high resolution

### Download Issues
- Allow browser to download multiple files
- Check download folder permissions
- Try individual file download instead of ZIP

---

## 📊 Performance Guide

### Video to Frames Speed Estimates
- **1 minute video at 1 FPS**: ~2 seconds
- **1 minute video at 10 FPS**: ~5 seconds
- **5 minute video at 1 FPS**: ~5 seconds
- **Larger videos**: Proportionally longer

### Frames to Video Speed Estimates
- **24 frames at 24 FPS**: ~3 seconds
- **100 frames at 30 FPS**: ~5 seconds
- **500 frames at 30 FPS**: ~15 seconds

*Times may vary based on computer performance*

---

## 📁 File Formats

### Supported Input Formats
**Video Formats:**
- MP4 (.mp4)
- WebM (.webm)
- Ogg (.ogv)
- QuickTime (.mov)
- Others supported by your browser

**Image Formats:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)

### Output Formats
**Frames Export:**
- PNG (lossless, ~100-500 KB per image)
- JPG (lossy, ~10-100 KB per image)
- WebP (modern, ~20-150 KB per image)

**Video Creation:**
- WebM (.webm) - ~1-10 MB depending on settings

---

## ✨ Common Use Cases

1. **Screen Recording to GIF**
   - Record screen to video
   - Extract at 10 FPS
   - Download frames
   - Use online tool to create GIF

2. **Time-Lapse Creation**
   - Take photos at intervals
   - Create video at 30 FPS
   - Results in smooth time-lapse

3. **Frame Analysis**
   - Extract video frames
   - Review/analyze each frame
   - Edit individual frames in image editor

4. **Presentation Creation**
   - Create slides as images
   - Combine into video presentation
   - Share as single file

5. **Animation Creation**
   - Draw animation frames
   - Create video at 24+ FPS
   - Share animation

---

## 🔐 Privacy & Security

- **All processing happens locally** on your computer
- **No data uploaded** to any servers
- **No tracking** or analytics
- **Your files remain private**
- Completely safe to use with sensitive content

---

## ❓ FAQ

**Q: Can I edit frames after extraction?**
A: Yes! Use any image editor on the extracted frames, then combine them back into video.

**Q: What's the maximum video size?**
A: Depends on browser memory. Most videos up to 2GB should work.

**Q: Can I change the order of frames?**
A: For video creation, reorder files in file explorer before uploading.

**Q: Why is WebM format used?**
A: WebM is a modern, efficient format. MP4 support coming in future updates.

**Q: Can I use this on mobile?**
A: Currently optimized for desktop. Mobile support coming soon.

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Try with a different video or image
3. Clear browser cache and try again
4. Check browser console (F12) for error messages
5. Ensure browser is up to date

---

## 📝 Notes

- Processing large files takes time - be patient with the progress bar
- Close other applications to free up memory for large files
- Modern browsers work best (Chrome, Firefox, Edge, Safari 14+)
- Internet connection not required - everything works offline

---

**Enjoy using Video Frame Tools! 🎉**
