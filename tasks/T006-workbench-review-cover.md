---
id: T006
title: 工作台 ② 挑照片（眼睛候選、隱藏）＋九宮格封面
status: backlog
size: M
---

## 為什麼
眼睛有問題的照片要人工挑，但先排序能省很多時間；封面每場都要做一次。

## 要做什麼
- 照 `workbench/SPEC.md` §5 ②：格狀檢視（虛擬捲動）、眼睛候選分數（`reference/cloud/eyes2.py`）、點選隱藏與復原、失焦候選勾選移動。
- 封面：勾 9 張產生 `photos/<MMDD>/cover.jpg`，版型照 §5 ② 數值，寫進 `ALBUM_COVERS`（含 `?v=` 版本號）。

## 驗收標準
- [ ] 700 張縮圖捲動不卡（Safari、Chrome）
- [ ] 眼睛候選只標示與排序，不會自動隱藏任何照片
- [ ] 隱藏／復原只改 `ALBUM_DATA`，檔案不刪
- [ ] 用 10.17 的 9 張（A0007487 A0007257 A0007594 A0007651 A0007341 A0007229 A0007623 A0007631 A0007720）做出的封面與 `photos/1017/cover.jpg` 版型一致（附對照圖在 PR）
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- 網站上的 `?admin` 快速刪除功能與 `hidden.json`

## 實作紀錄
（Codex 完成後填寫）
