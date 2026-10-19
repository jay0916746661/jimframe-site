---
id: T007
title: 工作台 ③ 影片（切段、4K 單支、25 秒特效版、網站版、付費完整版）
status: backlog
size: M
---

## 為什麼
影片流程最耗 Claude 額度（一場 175 次工具＋2 小時），而且參數已經固定。

## 要做什麼
- 照 `workbench/SPEC.md` §5 ③ 全部步驟；參數照 `reference/mac/cut17.py、split17.py、piece17.py、fx17.sh、web17.py` 與 `reference/cloud/render25.py`。
- 切點確認頁（每個切點前後縮圖，可微調）。
- `index.html` 的 `VEV` 改成通用規則（`NN-` 前綴 → `10NN`），並保持 1015／1016／1017 現有 key 結果不變。
- 付費完整版：輸入編號輸出 4K 全長＋開場特效＋雙 Logo＋1080 手機版。

## 驗收標準
- [ ] 用 10.17 的 `1017 bachatacrush.m4v` 與 9 個原始片段跑出 9 支，切點與 `reference/mac/cut17.py` 結果相差 < 0.2 秒
- [ ] 25 秒特效版結構與現有 `videos/1017/bc-17-*.mp4` 相同（開場快切、慢動作推近、白閃、CRUSH 軌、Jim Logo）
- [ ] 平行渲染用唯一暫存檔名，跑兩次不會互相覆蓋
- [ ] `VEV("18-201")==="1018"`，現有 key 結果不變；`node scripts/smoke.mjs` 通過
- [ ] 付費完整版長度＝原片長度（±0.1 秒），音軌完整

## 不要動
- 已上線的 10.15–10.17 影片檔

## 實作紀錄
（Codex 完成後填寫）
