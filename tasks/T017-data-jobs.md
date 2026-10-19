---
id: T017
title: 三個資料抓取搬離 Claude 排程：潛水誌、爬山封閉、Podcast 榜
status: backlog
size: M
---

## 為什麼
這三個抓取目前由 Claude 的排程跑（每天約 15 次工具呼叫），其實不需要大模型。搬成純腳本，由 Codex 雲端 VM 的 cron（VM 保留時）或 GitHub Actions 跑，Claude 額度省下來做判斷類的事。

## 要做什麼
- 新建 `data-jobs/`：`dive_news.py`（台灣潛水誌每日消息：海況、禁潛、船班、潛店公告）、`trail_closures.py`（雙北步道封閉／整修：林業署、台北市大地處、新北觀旅局）、`podcast_chart.py`（台灣 Apple Podcasts／Spotify 前 50）。
- 每支輸出固定格式 JSON 到 `data/<name>.json`：`{updated, source:[{name,url}], items:[...], status:"ok"|"failed", error}`。抓不到就 `failed`＋原因，不要編內容。**不呼叫任何 LLM。**
- `data-jobs/run.sh`：依序跑三支，任一失敗不中斷其他；有變動才 commit＋push。
- `.github/workflows/data-jobs.yml`：潛水誌每天 07:00、爬山 07:10（台北時間）、Podcast 每週一 08:00；可手動觸發。
- 現有讀這些資料的頁面（潛水誌、爬山地圖、Podcast 追蹤器）改讀 `data/*.json`；欄位對不上就寫轉換，不改頁面版面。

## 驗收標準
- [ ] 本機手動跑 `run.sh` 兩次，第二次沒變動就不 commit
- [ ] 把一個來源網址故意改錯，該支 `failed`，另外兩支照常
- [ ] Actions 手動觸發一次成功，`data/` 有三個 JSON
- [ ] 三個頁面打開顯示正常、無 console error

## 不要動
- 頁面版面、其他目錄
