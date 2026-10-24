---
id: T009
title: 新相簿照片改放 Google Drive（工作台上傳＋網站顯示）
status: backlog
runner: local   # 本機（Antigravity 或 Claude Code 本機版），要碰 Mac 檔案
size: M
---

## 為什麼
GitHub Pages 只剩約 140MB，10.18 之後的照片放不下。照片改放雲端，下載仍在網站完成、不跳出雲端頁面。

## 要做什麼
- 照 `workbench/SPEC.md` §10：工作台把網站版照片放進 Drive 同步資料夾、用 xattr 取檔案 ID、只把縮圖放 repo。
- 網站 `index.html`：雲端 id 的大圖改用 lh3 網址、縮圖用 `DRIVE_THUMB` 對照表；下載維持現有隱藏 iframe／iOS 直接下載的寫法。

## 驗收標準
- [ ] 一場 20 張的測試相簿：repo 只增加縮圖（每張 < 80KB），大圖從 lh3 顯示
- [ ] 下載不開新分頁、不顯示 Google Drive 頁面（Chrome 桌機、iPhone Safari 各測一次，PR 附說明）
- [ ] 人臉搜尋與顏色分類對雲端相簿仍可用
- [ ] 沒有使用 Google API、沒有存任何 token
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- 已在 repo 的 10.15–10.17 照片

## 實作紀錄
（Codex 完成後填寫）
