---
id: T015
title: 衝刺板搬進 repo（sprint/）並改成讀 JSON
status: backlog
size: S
---

## 為什麼
Jim 的「轉職衝刺板」目前是一個單檔 HTML（Claude 發布的 artifact）。搬進 repo 之後 Codex 也能維護，任務、每日表、試題可以改 JSON 不改程式。

## 要做什麼
- Jim 會把 `sprint.html` 放到 `sprint/index.html`（或 Claude 推上來）。
- 把檔內的 `TASKS`、`DAYS`、`QUIZ`、`ROLES`、`GAPS` 五個陣列抽成 `sprint/data.json`，頁面用 fetch 讀取；本機直接開檔（file://）讀不到時要顯示提示。
- 任務編號對齊任務板：T004→T011、T005→T012、T006→T010、T007→T013（頁面裡的 Codex 任務）。
- 保留 localStorage 勾選狀態，key 不變。

## 驗收標準
- [ ] 改 `data.json` 加一題試題，重新整理就看得到
- [ ] 390px 無橫向捲動、無 console error
- [ ] 原本勾過的項目搬過去後還在（key 相同）

## 不要動
- 其他目錄
