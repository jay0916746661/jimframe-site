---
id: T005
title: 工作台骨架＋① 照片上線
status: open
runner: local   # 本機（Antigravity 或 Claude Code 本機版），要碰 Mac 檔案
size: M
---

## 為什麼
每場活動照片上線都要叫 Claude 跑 100+ 次工具。做成 Jim 在 Mac 上點兩下就能跑的本機工具，0 token。

## 要做什麼
- 照 `workbench/SPEC.md` §2–§4、§5 ①、§6 建好：`install.command`、`start.command`、`config.example.json`、`app/server.py`（http.server＋背景工作佇列＋進度 API）、`app/web/`（首頁＋照片上線頁）。
- 實作 `jobs/photos.py`（失焦篩選、雙 Logo、網站版與縮圖）、`jobs/colors.py`、`jobs/faces.py`（多核）、`jobs/site.py`（改 index.html 常數＋上線流程與安全檢查）。
- 參數照 `workbench/reference/cloud/addlogos.py`、`vcol17.py`、`pyidx.py`、`conv.py`。

## 驗收標準
- [ ] 乾淨的 Mac 跑 `install.command` 後，`start.command` 會開 http://localhost:8787 首頁，四張卡片都在
- [ ] 選一個含 20 張 JPG 的測試資料夾，填日期 1099、主題「測試」，能產出雙 Logo、網站版、縮圖、顏色、`face/index-1099.json`
- [ ] `site.py` 改完 `index.html` 後抽出的 script 都能通過 `node --check`，`node scripts/smoke.mjs` 通過
- [ ] 上線前若 `git status` 有刪除或 repo > 950MB 會中止並顯示中文訊息
- [ ] 中途關掉再開，會從斷點續跑；沒有任何檔案被刪除
- [ ] 沒有呼叫任何外部 API（PR 說明怎麼驗證的）

## 不要動
- 根目錄 `index.html` 的版面與功能（只能經由 `site.py` 改資料常數；測試完把 1099 測試資料還原，不要 commit）
- `site-source/`、`dance/`、`studio/`

## 實作紀錄
（Codex 完成後填寫）
