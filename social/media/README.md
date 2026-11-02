# social/media：發文佇列用的素材

IG／Threads 的 API 會從 GitHub Pages 網址抓這裡的檔案。**不是 MBS 了，不需要壓到 10MB 以下。**

## 影片壓縮標準（2026-11-02 起）

```
ffmpeg -i 原檔.mp4 -c:v libx264 -preset slow -crf 20 -maxrate 5M -bufsize 10M \
  -profile:v high -pix_fmt yuv420p -vf scale=1080:1920 -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart 輸出.mp4
```

- 一定要從**原始渲染檔或高畫質母帶**壓，不要拿已經壓過的 9MB 版再壓（畫質救不回來）。
- 目標：每支 **25MB 以內**（動畫類通常 8–20MB）。超過就把 `-crf 20` 改 `22` 再壓一次。
- 舊標準（-b:v 2200k、壓到 9.5MB 以下）是 MBS 瀏覽器上傳的限制，**停用**。

## 容量注意

GitHub Pages 整站上限 1GB。已發出的素材之後會自動清掉（原檔留在雲端），不要放母帶、不要放沒排程的檔案。
