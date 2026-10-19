---
id: T001
title: 把相簿與活動資料搬到獨立 JSON 檔
status: review
size: M
---

## 為什麼
現在新增一本相簿或一場活動，都要改 200KB 的 `index.html`，很容易改壞版面。資料搬出去以後，Jim（或排程任務）只要改一個小 JSON 檔就能更新網站。

## 要做什麼
- 新增 `data/albums.json`：內容等於現在的 `ALBUM_DATA`。格式改成物件陣列，每筆 `{ "date": "1009", "venue": "Flow", "folder": "<原值>", "photos": ["<Drive ID>", ...] }`，順序與資料完全保留。
- 新增 `data/events.json`：內容等於現在的 `UPCOMING_EVENTS`，欄位不變。把 `index.html` 裡 `UPCOMING_EVENTS` 上方那段欄位說明註解，搬到 `data/README.md`。
- `index.html` 啟動時用 `fetch("data/albums.json")` 與 `fetch("data/events.json")` 讀資料，讀完才渲染相簿、輪播、熱門、活動區；兩個檔並行讀取。
- 讀取失敗時：相簿區顯示一行「相簿暫時載不出來，請重新整理」，其他區塊照常；活動檔讀不到就隱藏活動區。
- 刪除 `index.html` 裡原本內嵌的 `ALBUM_DATA` 與 `UPCOMING_EVENTS` 常數。

## 驗收標準
- [ ] 頁面外觀與行為和改之前一樣：相簿數量、順序、相簿頁、活動卡片（含「預計」標籤與「日期待公布」）都相同
- [ ] `index.html` 裡不再有 `ALBUM_DATA =` 或 `UPCOMING_EVENTS =`
- [ ] `data/albums.json` 的相簿數與每本照片數，和改之前的 `ALBUM_DATA` 完全一致（PR 內文寫出相簿數與照片總數）
- [ ] 把 `data/events.json` 改成空陣列 `[]` 時，活動區會隱藏且沒有錯誤
- [ ] `data/README.md` 用繁體中文說明怎麼新增一本相簿、一場活動，各附一個範例
- [ ] `node scripts/smoke.mjs` 通過（桌機與手機）

## 不要動
- 任何 CSS、版面、文案
- 調色、下載、分享、致謝提示的邏輯
- 照片 ID、日期、場地名稱

## 實作紀錄
（Codex 完成後填寫）
