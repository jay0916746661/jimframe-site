---
id: T018
title: 讀完之後 Reels 渲染腳本化（render_all.sh）
status: backlog
size: M
---

## 為什麼
Reels 目前由 Claude 逐格渲染（Playwright＋Canvas＋ffmpeg，每支約 900 格、吃 Claude 週額度 3%）。渲染不需要判斷，應該是腳本。

## 要做什麼
- Jim 會提供 `reelgen.mjs`、`reelgen.html`、字型與一個範例腳本 JSON，放進 `reels/`。
- 寫 `reels/render_all.sh`：掃 `reels/scripts/*.json`，沒有對應 mp4 的才渲染到 `reels/out/`，完成後 commit＋push mp4（單檔 > 50MB 改放 Release 或 Drive，README 寫清楚）。
- 寫 `reels/README.md`：環境需求（Node、Playwright Chromium、ffmpeg）、一支 900 格的耗時實測、怎麼加新腳本。
- 若 VM 階段 0 證實保留：加 cron 每天 03:00 跑；否則每次任務內跑完推回。

## 驗收標準
- [ ] 用範例 JSON 渲染一支，mp4 能播、長度與腳本一致、中文字正常（不是方塊）
- [ ] 重跑 `render_all.sh` 不會重複渲染已有的
- [ ] README 有實測耗時

## 不要動
- `reelgen.mjs` 的輸出規格（1080×1920）
