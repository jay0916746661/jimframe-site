---
id: T022
title: 新增 10.30 Barcade 相簿
status: review
size: S
---

## 要做什麼
- 將提供的公開 Google Drive 資料夾照片新增至攝影專頁相簿。
- 相簿名稱為「10.30 Barcade」，照片持續由 Google Drive 縮圖服務載入，不複製圖檔進 GitHub。

## 驗收標準
- [x] 首頁與相簿頁可看見 10.30 Barcade。
- [x] 相簿包含資料夾內 100 張 JPEG，依檔名 A0008575 至 A0008679 的拍攝順序排列。
- [x] 相簿圖片使用公開 Google Drive ID 載入。

## 實作紀錄
- 修改 `index.html` 的 `ALBUM_DATA`，在最前方加入 10.30 Barcade。
- 寫入 100 個 Google Drive 圖片 ID，未新增或複製大型圖檔。
- 以分支版本重新解析資料，確認共 62 本相簿、新相簿 100 張；並檢查 4 個 inline script 的 JavaScript 語法皆有效。
