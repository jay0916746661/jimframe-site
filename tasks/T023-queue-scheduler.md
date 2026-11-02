---
id: T023
title: 社群發文排程器（收件匣 → IG／Threads 佇列）＋發後清理＋狀態報告
status: backlog
size: M
---

## 為什麼
Jim 有 11 個社群帳號，發文已經全部改走 API（GitHub Actions 讀佇列自動發）。現在每次出好片，都要有人手動把輪播／Reel 寫進兩個 CSV、算時段、避開撞時間，很花 Claude 額度。
要把「排程」變成一支程式：各頻道把成品丟進收件匣，跑一次就自動排進佇列、補到 14 天庫存、清掉發完的舊素材、寫一份狀態報告。之後 Codex 每次接手排程只要跑它。

先讀：`tools/threads-poster/poster.py`、`tools/meta-poster/ig_publish.py`、`tools/stock/stock.py`、`tools/stock/channels.csv`、`social/media/README.md`。

## 要做什麼

### 1. 收件匣格式（新資料夾 `social/inbox/`）
每集一個資料夾：`social/inbox/<帳號>/<集數id>/`
- `reel.mp4`（可選）
- `carousel_01.jpg` … `carousel_20.jpg`（可選，照檔名排序）
- `post.json`：
  ```json
  {"id": "coffee-ep49", "title": "標題", "caption": "IG 長文案",
   "threads_text": "Threads 文（500 字內）", "topic_tag": "咖啡",
   "order": 49, "not_before": "2026-11-10"}
  ```
  `order` 決定先後；`not_before` 可選（有時效的題目最早哪天發）。

### 2. 時段設定 `tools/scheduler/slots.csv`
欄位：`account,media_dir,days,slot1_carousel,slot1_reel,slot2_carousel,slot2_reel`
- `days`：`daily` 或 `mon,wed,fri` 這種
- 一天排幾集＝有填幾組 slot；輪播和 Reel 可同時（填一樣的時間）
- 初始值（照現況與研究：Reels 午間、輪播晚上）：

| account | media_dir | days | slot1 輪播／Reel | slot2 輪播／Reel |
|---|---|---|---|---|
| jazz101tw | jazz101 | daily | 15:00／17:00 | 18:00／20:00 |
| art101.tw | art101 | daily | 12:00／20:00 | — |
| coffeestory101 | coffeestory101 | daily | 12:00／12:00 | 20:00／20:00 |
| untold.trip0 | untold | daily | 17:00／18:00 | 20:00／21:00 |
| socialdance101 | socialdance101 | daily | 12:00／20:00 | — |
| reading.after | reading | mon,wed,fri | 12:00／20:00 | — |
| love.manual.tw | love | mon,wed,fri | 12:00／20:00 | — |
| theguitarstory101 | guitar | mon,wed,fri | 12:00／20:00 | — |
| tech101_ai | tech101 | mon,wed,fri | 12:00／20:00 | — |
| astro_labtw | astro | daily | 12:00／20:00 | — |

### 3. `tools/scheduler/schedule.py`
- 預設 `--dry-run`（只印出會排什麼）；`--apply` 才真的改檔。
- 對每個帳號：找佇列裡該帳號最後一個「待發」時段之後（且不早於明天）的下一個空 slot，依 `order` 把收件匣的集數排進去，遵守 `not_before`。
- 每集寫入：
  - `tools/meta-poster/ig_queue.csv`：輪播一列（type=carousel，media 用相對路徑空白隔開）、Reel 一列（type=reel），status=待發。
  - `tools/threads-poster/queue.csv`：輪播一列（image_url 用 GitHub Pages 網址 `https://jay0916746661.github.io/jimframe-site/<路徑>`，多張用 `|`，最多 20 張）、Reel 一列（image_url 直接放 mp4 的 Pages 網址，**不要用 igvideo:today**，一天兩集時才不會抓錯），Threads 時間＝IG 時間＋30 分鐘。
  - id 規則：`<集數id>-c`、`<集數id>-r`、`<集數id>-t`、`<集數id>-tv`；已存在的 id 不重複寫。
- 把素材從 inbox 搬到 `social/media/<media_dir>/`，檔名加集數 id 前綴避免撞名；搬完刪掉 inbox 那一集。
- 影片超過 25MB 時照 `social/media/README.md` 的 ffmpeg 指令重壓一次（`-crf 22`）；**不要把小於 25MB 的影片再壓**。
- 同一個時間點跨帳號超過 4 則 IG 時，往後挪 5 分鐘（IG 程式每次最多發 4 則）。
- 寫 CSV 一律 `csv.QUOTE_ALL`、UTF-8，欄位順序跟原檔一樣。

### 4. `tools/scheduler/cleanup.py`
- 預設 `--dry-run`；`--apply` 才刪。
- 刪除 `social/media/` 裡**只被「已發」列引用、且發出超過 7 天**的檔案。
- 被「待發」「失敗」「逾時」任何一列引用的檔案絕對不刪；沒被任何列引用的檔案只列出、不刪。
- 印出刪了幾個檔、釋出多少 MB，以及 `social/media` 目前總大小（GitHub Pages 整站上限 1GB）。

### 5. 狀態報告 `social/status/latest.md`
`schedule.py --apply` 或 `cleanup.py --apply` 跑完後覆寫：
- 執行時間（台北）、這次排了哪些（帳號、集數、時間）、清了哪些
- 接著附上 `tools/stock/stock.py` 的庫存表
- 收件匣還剩什麼沒排、有哪些 `失敗`／`逾時` 列

### 6. README
`tools/scheduler/README.md`：給下一個接手的 AI 看的使用說明（收件匣格式、slots.csv、三個指令怎麼跑）。

## 驗收標準
- [ ] 用一個假的 inbox 集數（2 張圖＋1 支小 mp4）跑 `--dry-run`，印出正確的時段與 IG／Threads 列，不改任何檔
- [ ] `--apply` 後兩個佇列各多出正確的列，舊列一字不變（用 diff 確認只有新增）
- [ ] 一天兩集的帳號（coffeestory101、untold.trip0、jazz101tw）不會排出同一 slot 兩集
- [ ] `cleanup.py --dry-run` 不會列出任何被待發列引用的檔
- [ ] `python tools/stock/stock.py` 仍可正常跑
- [ ] 測試用的假集數與假素材在 PR 裡清乾淨

## 不要動
- `tools/threads-poster/poster.py`、`tools/meta-poster/ig_publish.py`、`.github/workflows/` 都不要改
- 不碰任何 token、GitHub Secrets；程式裡不能出現 token
- 已發／待發的既有佇列列不要改內容
- `photos/`、`videos/` 不要動
- 不要合併 PR、不要 force push

## 實作紀錄
（Codex 完成後填寫）
