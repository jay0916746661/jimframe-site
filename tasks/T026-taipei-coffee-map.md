---
id: T026
title: 台北咖啡地圖頁（coffee101/map/）
status: backlog
size: M
---

## 為什麼
咖啡101 從 11/22 到 2/05 排了二十多則台北咖啡的內容（蜂大、南美、波麗路、明星、
溫羅汀、富錦街、興波、Fika Fika、湛盧⋯）。這些貼文發完就往下沉，讀者看完想去
也沒地方可以存。做成一張可以一直回來看的地圖，才是線上轉線下的那座橋，也是之後
跟店家談合作時最有力的東西：「我有一張台北咖啡地圖，你在上面。」

## 要做什麼
- 新增 `coffee101/map/index.html`，單一靜態頁，照 AGENTS.md 的硬規則
  （單頁、只用 cdnjs、繁體中文、390px 不橫捲、不放金鑰）。
- 資料放 `coffee101/map/places.json`，一家店一筆，欄位：
  `name, area, address, year, status, summary, post_url, lat, lng`
  - `area`：西門町／大稻埕／溫羅汀／富錦街／其他
  - `status`：`營業中`／`已歇業`／`待確認`
  - `summary`：一到兩句，從既有貼文的文案節錄，不要新寫沒查證的內容
  - 先建檔的店家從 `tools/meta-poster/ig_queue.csv` 裡 coffeestory101 帳號、
    2026-11-22 之後、內文提到具體店名的貼文取得。沒有把握的欄位留空字串，不要猜。
- 頁面要有：
  - 一張地圖（leaflet，從 cdnjs 載，釘選版本），每家店一個標記
  - 下方同步一份清單，可依 area 篩選；手機上地圖在上、清單在下
  - 已歇業的店用不同顏色標記並標示，不要移除（歷史本身是內容）
  - 每一筆可連到對應的 IG 貼文（`post_url` 有值時才顯示連結）
- 座標不要用外部 API 即時查，寫死在 places.json 裡。查不到的先留空，該筆只進清單
  不進地圖。
- 從 `coffee101/` 首頁加一個進入點。

## 驗收標準
- [ ] `coffee101/map/` 在本機 `python3 -m http.server 8000` 下可開，地圖與清單都有內容
- [ ] 390px 寬不橫捲
- [ ] 已歇業的店有明顯區隔且仍列出
- [ ] `places.json` 裡沒有任何沒有來源的描述；不確定的欄位是空字串不是編造值
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- `tools/meta-poster/`、`tools/threads-poster/` 兩個佇列檔
- `photos/`、`videos/` 既有檔案
- 其他頻道的目錄

## 實作紀錄
（Codex 完成後填寫）
