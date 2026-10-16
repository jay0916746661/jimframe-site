# GitHub Pages 限動工作室

入口：`/jimframe-site/studio/`，首頁導覽與相簿上方也有入口。

- 原生 HTML/CSS/ES modules，沒有新增套件管理、框架或部署建置步驟。
- `render.mjs` 由原站 `site-source/app/studio/render.ts` 移植；保留自動挑圖、七種風格、三張限動、輪播與 Reels。靜態版另加入語言、字寬限制、清理未選圖片及較低的載入並行數。
- `vendor/mp4-muxer.mjs`：既有依賴 mp4-muxer 5.2.2 的本地 ESM，MIT 授權附於同目錄；不從外部 CDN 載入程式。
- `zip.mjs`：原站 `site-source/app/zip.ts` 的原生 JavaScript 版本。
- `i18n.mjs`：繁中、英文、韓文介面；使用首頁共用的 `jf_lang` 設定。產生圖片上的文字與文案也會切換。切換語言會清除舊輸出，需重新產生。
- 照片透過原站已開放唯讀 CORS 的 `/api/face-preview` 載入；不讀寫人臉索引、不新增追蹤，也不需要任何前端秘密。
- `albums.json` 是本次從首頁 `ALBUM_DATA` 複製並排除主站 `hiddenPhotoIds`、`lowExposurePhotoIds` 的靜態清單。新增相簿時需同步更新此清單；不會即時抓取整個 Drive 資料夾。清單內的照片數可能少於完整 Drive 相簿。
- Reels 預設不勾選，避免只要限動的使用者等待影片編碼；可選擇一起輸出。影片失敗會保留已完成的限動和貼文。
- 分享使用 Web Share 檔案分享；使用者必須自行選擇 Instagram 並確認發布。不支援檔案分享的裝置改下載 ZIP。取消分享不顯示錯誤。

驗證：JavaScript 語法、三語翻譯鍵、七種風格和三語共 57 張 JPEG 的實際 Canvas 排版輸出與尺寸、文案連結、ZIP UTF-8 解壓、首頁相簿資料不變。Canvas 測試使用宿主環境的原生 Canvas 相容層，並不等同瀏覽器驗證。瀏覽器手機版排版、WebCodecs／MediaRecorder 與 IG 真機分享尚未驗證。
