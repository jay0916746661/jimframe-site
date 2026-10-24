---
id: T019
title: 工作台 ⓪ 調色補救（臉太白／偏黃）＋前後對照
status: backlog
runner: local   # 本機（Antigravity 或 Claude Code 本機版），要碰 Mac 檔案
size: S
---

## 為什麼
Capture One 匯出後常被 Jim 退回「太黃」「臉太白」。修法已驗證，做成工作台的一步，之後不用每次請 Claude 手動修。

## 要做什麼
- 照 `workbench/HANDOFF_修圖.md` §2：`fix_highlights()`（Lab 亮部壓暗＋補膚色）與「偏黃」b 通道對齊參考照。
- 工作台 ① 前面加一頁「調色補救」：選參考照 → 勾「臉太白」／「偏黃」 → 先產生 3 張前後對照（左原、右修後）→ Jim 按「套用整批」才跑。
- 輸出到新資料夾 `照片_調色後/`，原檔不覆蓋；之後 ① 用這個資料夾當輸入。

## 驗收標準
- [ ] 用 10.17 任 3 張跑，數值與 HANDOFF §2 的程式碼結果逐像素相同（誤差 ≤1）
- [ ] 沒勾任何選項時輸出與輸入相同（或直接跳過）
- [ ] 原始資料夾檔案數與修改時間不變
- [ ] 700 張在 Mac 8 核 < 3 分鐘（multiprocessing）
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- 已上線相簿、`hidden.json`、其他模組

## 實作紀錄
（Codex 完成後填寫）
