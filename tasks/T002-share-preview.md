---
id: T002
title: 分享到 LINE / IG / FB 時顯示預覽卡
status: backlog
size: S
---

## 為什麼
舞者把網站連結貼到 LINE 或 IG 限動時，現在沒有標題圖和說明，看起來像一般網址，點擊率低。

## 要做什麼
- 在 `<head>` 加上 Open Graph 與 Twitter Card 標籤：`og:title`「Jim Lin Photography｜台北舞會攝影」、`og:description`（一句繁體中文，40 字內，說明可以找自己的舞會照片並下載）、`og:type` website、`og:url`（GitHub Pages 網址）、`og:image`。
- `og:image` 用 repo 內的靜態圖檔 `assets/og.jpg`（1200×630）。用一張現有相簿照片加上「Jim Lin Photography」字樣做成；若無法在環境內產生圖片，先放一張 1200×630 的純色版（深色底＋白字），並在 PR 註明待換。
- 加上 `<meta name="description">`，內容同 `og:description`。

## 驗收標準
- [ ] `<head>` 內有 og:title、og:description、og:type、og:url、og:image、twitter:card（summary_large_image）
- [ ] `assets/og.jpg` 存在、1200×630、小於 300KB
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- `<head>` 以外的任何內容

## 實作紀錄
（Codex 完成後填寫）
