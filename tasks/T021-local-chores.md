---
id: T021
title: 本機雜活包：清 Mac 磁碟、快修台進 repo、研究報告待查欄補查
status: open
runner: local   # Antigravity（Gemini Flash 即可）
size: M
---

## 為什麼
三件都是「要在 Jim 的 Mac 上動手、不需要判斷」的雜活，適合 Antigravity 的免費 Flash 模型，不用 Codex 或 Claude 額度。

## 要做什麼
### A. 清 Mac 磁碟（10.18 影片流程卡住的原因）
- 列出 `~/Downloads`、`~/Desktop`、`~/Movies` 底下大於 500MB 的檔案與資料夾，依大小排序，輸出成 `~/Desktop/磁碟盤點.md`（路徑、大小、最後修改日）。
- 比對外接碟 T7 的 `Bachata Crush 2026/1015`、`1016`、`1017`、`1018`：Mac 上已經在 T7 有同名同大小的檔案，列成「可刪清單」。**只列，不刪**。
- 回報：Mac 可用空間、可刪清單總大小。

### B. 快修台搬進 repo
- 把 Jim 桌面的 `jimframe-quick/`（quick.py、config.json、segments.txt、三個 .bat、README.md）複製到 repo `tools/quick/`，.bat 另加對應的 .command（Mac 用）。
- 用 Mac 上任一張 RAW 或 JPEG 實跑一次 `python3 quick.py photos <資料夾>`，確認輸出；記錄缺哪些套件與安裝指令進 README。
- 開 PR，分支 `codex/T021`（本機也用同一命名）。

### C. 研究報告待查欄補查（純瀏覽器點擊）
- 打開雲端「AI 共同大腦／研究_台北代理商名單與業務企劃實況」，對 20 家公司逐家用瀏覽器開 104 公司頁 →「全部職缺」，記下「業務企劃／營運企劃／通路企劃／營運分析」類職缺的職稱、月薪、連結；沒有就寫「目前無」。
- 把結果寫成 `研究_代理商職缺補查_YYYY-MM-DD.md` 放回同一個雲端資料夾。不要編、不要猜。

## 驗收標準
- [ ] 磁碟盤點.md 存在，可刪清單每筆都有 T7 對應路徑
- [ ] tools/quick/ 在 PR 裡，README 有實跑紀錄
- [ ] 補查檔 20 家都有結果或「目前無」，每筆職缺附連結

## 不要動
- 不刪任何檔案、不改 photos/ videos/、不碰公司資料
