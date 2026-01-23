# Tong hop cong cu tai media da nen tang

> Luu y phap ly: chi tai noi dung ma ban co quyen su dung, va ton trong robot.txt/ToS cua tung nen tang.

## Bang so sanh nhanh

| Tool | Ngon ngu & License | Dinh dang/Protocol | Diem noi bat |
| --- | --- | --- | --- |
| **yt-dlp** ([repo](https://github.com/yt-dlp/yt-dlp)) | Python, Unlicense/MIT | >1700 site extractor, HLS/DASH, MPD, m3u8 | Fork hien dai cua youtube-dl, cap nhat lien tuc, ho tro cookie, proxy, post-processing FFmpeg manh |
| **youtube-dl** ([repo](https://github.com/ytdl-org/youtube-dl)) | Python, Unlicense | >1000 site extractor | Chuan goc, on dinh, cau truc extractor de ke thua neu can custom fork |
| **gallery-dl** ([repo](https://github.com/mikf/gallery-dl)) | Python, GNU GPLv2 | Web gallery, CDN hinh/clip (Pixiv, Danbooru, DeviantArt, Reddit, Twitter, v.v.) | Huong toi anh/album, cau hinh YAML linh hoat, co JSON output thuan tien cho web worker |
| **streamlink** ([repo](https://github.com/streamlink/streamlink)) | Python, BSD 2-Clause | HLS, DASH, HTTP progressive, RTMP | Tap trung live-stream, co API Python de hop nhat vao backend web |
| **annie** ([repo](https://github.com/iawia002/annie)) | Go, MIT | Sitestream pho bien (YouTube, Bilibili, TikTok...), HLS | Binary Go nhe, de nhung vao backend Go/Electron ma khong can Python runtime |
| **you-get** ([repo](https://github.com/soimort/you-get)) | Python, MIT | Video/audio chung (YouTube, Bilibili, Vimeo, SoundCloud) | CLI don gian, output metadata sach (JSON) tien phat trien extension |
| **spotDL** ([repo](https://github.com/spotDL/spotify-downloader)) | Python, MIT | Spotify metadata + nguon am thanh YouTube | Danh rieng cho audio, co thu vien Python de dieu khien tien trinh tai va tagging |
| **aria2** ([repo](https://github.com/aria2/aria2)) | C++, GPLv2 | HTTP/HTTPS, FTP/S, SFTP, BitTorrent, Metalink | Khong extractor, nhung tuyet voi de lam engine tai nhieu thread (ket hop voi yt-dlp qua `--external-downloader`) |
| **FFmpeg** ([repo](https://github.com/FFmpeg/FFmpeg)) | C, LGPL/GPL | HLS/DASH ingest, merge video/audio, transcode | Khong tai manifest, nhung can thiet de hop nhat/convert stream, co the goi truc tiep tu backend |

## Goi y tich hop vao ung dung web

1. **Wrapper dich vu nen (Service Layer)**  
   - Tao service chay doc lap (Node/Go/Python) goi CLI tuong ung, expose REST/WebSocket cho frontend.  
   - Vi du Node: spawn `yt-dlp --dump-json <url>` de lay metadata -> gui ve UI truoc khi tai thuc te.

2. **Quan ly tien trinh & log**  
   - Cac tool deu co output STDOUT/STDERR dang text; nen chuyen thanh stream event (`progress`, `warning`, `done`) de UI hien thi.  
   - Voi yt-dlp dung `--print after_move:filepath --progress-template` de tao log dang parse duoc.

3. **Tuy bien pipeline hau xu ly**  
   - Ket hop voi FFmpeg cho merge, trim, chuyen dinh dang.  
   - Su dung `aria2c` lam external downloader neu can toc do cao/can resume segment lon.

4. **Nhung vao Electron/desktop**  
   - Dung ban binary (yt-dlp, annie, aria2, ffmpeg deu co ban standalone) va dat trong thu muc resources, goi qua preload script.  
   - Voi Python-based tools, can nhac dong goi cung Python embeddable de tranh yeu cau nguoi dung cai Python.

5. **Bao tri extractor**  
   - `yt-dlp` co cadence update cao -> nen tich hop auto-update (tai binary moi tu GitHub Release).  
   - Neu can support site hiem, tao custom extractor trong fork yt-dlp hoac gallery-dl va giu script rieng.

## Chon tool theo nhu cau

- **Download moi nen tang video/audio:** uu tien `yt-dlp`; fallback `youtube-dl` neu muon nen tang on dinh lau nam.  
- **Download album anh/gif:** `gallery-dl`.  
- **Live stream -> file hoac piping vao player:** `streamlink`.  
- **Backend Go/Electron thuan binary:** `annie` (Go) hoac `yt-dlp.exe` + `aria2c.exe`.  
- **Audio/Playlist Spotify:** `spotDL` + `yt-dlp` audio backend.  
- **Tang toc tai, resume, song song:** `aria2`, `wget`, hoac `curl` ket hop pre-signed URLs.  
- **Hau xu ly, chuyen dinh dang:** `FFmpeg`.

## Cac tham so huu dung (yt-dlp lam vi du)

```bash
yt-dlp \
  --dump-json --print-traffic \
  --progress-template \"%(progress.downloaded_bytes)d/%(progress.total_bytes)d\" \
  --concurrent-fragments 4 \
  --merge-output-format mp4 \
  --embed-metadata --embed-thumbnail \
  <URL>
```

- `--dump-json`: lay metadata cho UI truoc khi tai.  
- `--progress-template`: format output de parse.  
- `--concurrent-fragments`: tai song song, giam thoi gian.  
- `--embed-*`: giam buoc hau xu ly.

## Checklist khi "clone" sang ung dung web

- [ ] Chon tool chinh + fallback.  
- [ ] Quyet dinh cach phan quyen (user nhap cookie? OAuth?).  
- [ ] Thiet ke queue/download manager (toi thieu trang thai: pending -> downloading -> processing -> done/failed).  
- [ ] Luu log + metadata JSON cho phep resume/hien thi lich su.  
- [ ] Them sandbox de tranh command injection (whitelist flag).  
- [ ] Tu dong cap nhat binary, kiem tra checksum release.

Tai lieu nay du de ban chon tool phu hop va chuan bi adapter trong web app/Electron. Neu can them chi tiet trien khai tung tool, hay cho minh biet.
