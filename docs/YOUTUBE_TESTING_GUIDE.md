# 🧪 YouTube Downloader - Testing Guide

## 📋 Pre-Testing Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Verify Installation
Check that ytdl-core is installed:
```bash
pnpm list ytdl-core
```

Should show: `ytdl-core@4.11.5`

### 3. Start Development Server
```bash
pnpm dev
```

---

## ✅ Basic Functionality Tests

### Test 1: UI Loading
**Steps**:
1. Open DevTools App
2. Navigate to Utilities → YouTube Downloader
3. Verify UI loads correctly

**Expected**:
- ✅ Header displays "YouTube Video Downloader"
- ✅ URL input field visible
- ✅ Format selector shows options
- ✅ Quality selector shows options
- ✅ Download button enabled

---

### Test 2: URL Validation
**Steps**:
1. Leave URL empty and click Download
2. Enter invalid URL: "not-a-url"
3. Enter non-YouTube URL: "https://google.com"

**Expected**:
- ✅ Error: "Please enter a YouTube URL"
- ✅ Error: "Invalid YouTube URL"
- ✅ Error: "Invalid YouTube URL"

---

### Test 3: Valid URL Detection
**Test URLs**:
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ
✅ https://youtube.com/watch?v=dQw4w9WgXcQ
✅ https://m.youtube.com/watch?v=dQw4w9WgXcQ
```

**Expected**:
- ✅ All URLs accepted
- ✅ No validation errors

---

### Test 4: Short Video Download (< 1 min)
**Test Video**: Rick Astley - Never Gonna Give You Up (Short clip)
**URL**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

**Steps**:
1. Paste URL
2. Select "Video + Audio (MP4)"
3. Select "720p"
4. Click "Download Video"

**Expected**:
- ✅ Status: "Preparing download..."
- ✅ Progress bar appears
- ✅ Progress updates (0% → 100%)
- ✅ Status: "Download completed successfully!"
- ✅ File saved to Downloads folder
- ✅ Filename: `Never Gonna Give You Up.mp4`

**Verify**:
- Check Downloads folder
- File size > 0 bytes
- Video plays correctly

---

### Test 5: Audio-Only Download
**Test Video**: Any music video
**URL**: `https://www.youtube.com/watch?v=...`

**Steps**:
1. Paste URL
2. Select "Audio Only (MP3)"
3. Click "Download Video"

**Expected**:
- ✅ Progress bar shows download
- ✅ File saved as `.mp3`
- ✅ Audio plays correctly
- ✅ No video stream

---

### Test 6: Quality Selection
**Test Different Qualities**:
- 360p (SD)
- 720p (HD)
- 1080p (Full HD)

**Steps**:
1. Download same video in different qualities
2. Compare file sizes

**Expected**:
- ✅ 360p < 720p < 1080p (file size)
- ✅ All downloads successful
- ✅ Quality reflects selection

---

### Test 7: Progress Tracking
**Test Video**: Longer video (5-10 min)

**Observe**:
- ✅ Progress bar updates smoothly
- ✅ Percentage increases (0% → 100%)
- ✅ No stuck at 0%
- ✅ No jumps or freezes

---

### Test 8: Cancel Download
**Steps**:
1. Start downloading long video
2. Click Cancel (if implemented)
3. Or close app mid-download

**Expected**:
- ✅ Download stops
- ✅ Partial file cleaned up
- ✅ No corrupted files left

---

## 🔧 Advanced Tests

### Test 9: Long Video (> 10 min)
**Test Video**: Tutorial or documentary
**Duration**: 10-30 minutes

**Expected**:
- ✅ Download completes successfully
- ✅ No timeout errors
- ✅ Progress tracking works
- ✅ File size appropriate

---

### Test 10: High Quality (1080p/4K)
**Test Video**: 4K video if available

**Expected**:
- ✅ Downloads successfully
- ✅ Large file size (100MB+)
- ✅ Progress tracking accurate
- ✅ No memory issues

---

### Test 11: Special Characters in Title
**Test Videos with titles containing**:
- Quotes: `"Amazing" Video`
- Slashes: `How to / Tutorial`
- Colons: `Title: Subtitle`
- Emoji: `🎵 Music Video`

**Expected**:
- ✅ Filename sanitized
- ✅ Invalid characters removed
- ✅ File saves successfully

---

### Test 12: Duplicate Filename
**Steps**:
1. Download video
2. Download same video again

**Expected**:
- ✅ Second file saved (may overwrite)
- ✅ No error
- ✅ Or filename appended with (1)

---

## ❌ Error Handling Tests

### Test 13: Invalid Video ID
**URL**: `https://www.youtube.com/watch?v=invalid123`

**Expected**:
- ✅ Error: "Failed to get video info"
- ✅ No crash
- ✅ User can try again

---

### Test 14: Deleted Video
**URL**: Video that was deleted

**Expected**:
- ✅ Error message displayed
- ✅ Graceful failure
- ✅ No partial download

---

### Test 15: Private Video
**URL**: Private video link

**Expected**:
- ✅ Error: "Video unavailable"
- ✅ Clear error message

---

### Test 16: Age-Restricted Video
**URL**: Age-restricted content

**Expected**:
- ⚠️ May fail (not supported yet)
- ✅ Error message displayed
- ✅ No crash

---

### Test 17: Geo-Blocked Video
**URL**: Video blocked in your region

**Expected**:
- ⚠️ May fail with ytdl-core
- ✅ Error message displayed
- 💡 Consider yt-dlp for better support

---

### Test 18: No Internet Connection
**Steps**:
1. Disconnect internet
2. Try to download

**Expected**:
- ✅ Error: "Network error" or similar
- ✅ No crash
- ✅ Can retry when reconnected

---

### Test 19: Insufficient Disk Space
**Steps**:
1. Try downloading large video with low disk space

**Expected**:
- ✅ Error: "Insufficient space" or download fails
- ✅ Partial file cleaned up
- ✅ Clear error message

---

## 🎯 Performance Tests

### Test 20: Multiple Downloads (Sequential)
**Steps**:
1. Download video 1
2. Wait for completion
3. Download video 2
4. Repeat

**Expected**:
- ✅ Each download completes
- ✅ No interference
- ✅ No memory leaks

---

### Test 21: Download Speed
**Measure**:
- Time to download 100MB video
- Compare with browser download

**Expected**:
- ✅ Similar speed to browser
- ✅ No artificial throttling
- ✅ Utilizes available bandwidth

---

### Test 22: Memory Usage
**Monitor**:
- Memory during download
- Memory after download

**Expected**:
- ✅ Reasonable memory usage
- ✅ Memory released after download
- ✅ No memory leaks

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- OS: Windows/macOS/Linux
- Node Version: 
- Electron Version:
- ytdl-core Version: 4.11.5

### Basic Tests
- [ ] Test 1: UI Loading
- [ ] Test 2: URL Validation
- [ ] Test 3: Valid URL Detection
- [ ] Test 4: Short Video Download
- [ ] Test 5: Audio-Only Download
- [ ] Test 6: Quality Selection
- [ ] Test 7: Progress Tracking
- [ ] Test 8: Cancel Download

### Advanced Tests
- [ ] Test 9: Long Video
- [ ] Test 10: High Quality
- [ ] Test 11: Special Characters
- [ ] Test 12: Duplicate Filename

### Error Handling
- [ ] Test 13: Invalid Video ID
- [ ] Test 14: Deleted Video
- [ ] Test 15: Private Video
- [ ] Test 16: Age-Restricted
- [ ] Test 17: Geo-Blocked
- [ ] Test 18: No Internet
- [ ] Test 19: Insufficient Space

### Performance
- [ ] Test 20: Multiple Downloads
- [ ] Test 21: Download Speed
- [ ] Test 22: Memory Usage

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Additional observations]
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'ytdl-core'"
**Solution**:
```bash
pnpm install
```

### Issue: Download stuck at 0%
**Solution**:
- Wait 10-15 seconds
- Check console for errors
- Try different video
- Update ytdl-core

### Issue: "Video unavailable"
**Causes**:
- Video deleted
- Private video
- Age-restricted
- Geo-blocked

**Solution**:
- Try different video
- Check video in browser
- Consider yt-dlp for better support

### Issue: Progress not updating
**Solution**:
- Check IPC communication
- Verify progress callback
- Check console for errors

---

## 📝 Reporting Bugs

When reporting issues, include:
1. **Video URL** (if not private)
2. **Error message**
3. **Console logs**
4. **Steps to reproduce**
5. **Expected vs Actual behavior**
6. **Environment** (OS, versions)

---

## ✅ Test Completion Checklist

Before marking Phase 2 complete:
- [ ] All basic tests pass
- [ ] At least 3 advanced tests pass
- [ ] Error handling works
- [ ] No crashes or freezes
- [ ] Performance acceptable
- [ ] Documentation updated

---

## 🎉 Success Criteria

**Phase 2 is successful if**:
- ✅ Can download short videos
- ✅ Can download audio only
- ✅ Progress tracking works
- ✅ Error handling graceful
- ✅ Files save correctly
- ✅ No major bugs

---

**Last Updated**: January 7, 2026  
**Status**: Ready for Testing  
**Next**: Run tests and report results

