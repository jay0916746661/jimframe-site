---
id: T029
title: IG 試用 Reels：先只發給非粉絲，看成效再決定要不要轉正式
status: review
size: S
---

## 為什麼
Meta 在 2025-12-03 把試用 Reels 開進 Content Publishing API（changelog 寫
「Applies to all versions」，且明確支援 Instagram API with Facebook Login），
我們走的 `graph.facebook.com/v21.0` ＋ Facebook Login 不用升版本就能用。

試用 Reel 只發給非粉絲。對這些頻道來說代價幾乎是零：粉絲 1,610、週觀看十萬，
觸及本來幾乎全部來自非粉絲，所以「不給粉絲看」損失的是零頭，換到的是
免費測開頭的 A/B 能力。對一個五萬粉的帳號這個功能很貴，對我們很便宜。

## 要做什麼
1. `tools/meta-poster/meta.py`
   - `post()` 是表單編碼（`data=data`），沒辦法帶巢狀物件。
     送出前把 dict／list 型別的值 `json.dumps()` 成字串。
2. `tools/meta-poster/ig_publish.py`
   - `ig_queue.csv` 新增 `trial` 欄。填 `MANUAL` 或 `SS_PERFORMANCE` 就發成試用 Reel，
     留空＝照舊的正式 Reel。只對 `type=reel` 有效（API 要求 `media_type=REELS`）。
   - 帶 `trial_params={"graduation_strategy": ...}`。
   - **帶 trial_params 時不能再帶 `share_to_feed="true"`**：試用 Reel 不推主頁，
     現在那個參數是寫死的，要改成條件帶入。

`graduation_strategy` 兩個值：`MANUAL`（自己在 App 裡決定要不要轉正式）、
`SS_PERFORMANCE`（表現好就自動轉）。預設 MANUAL。

## 驗收標準
- [ ] `trial` 留空時，送出的參數與改版前完全一樣（含 `share_to_feed="true"`）
- [ ] `trial=MANUAL` 時帶 `trial_params`，且不帶 `share_to_feed`
- [ ] `trial` 填不認得的值時退回 MANUAL，不要讓 API 報錯
- [ ] `meta.post()` 收到 dict 參數會序列化成 JSON 字串
- [ ] 輪播（`type=carousel`）完全不受影響
- [ ] `ig_queue.csv` 既有欄位與資料不變，只新增 trial 欄

## 待驗（上線後才知道）
- 官方文件沒寫試用 Reel 的 insights 能不能從 API 拿到。
  `ig_insights.py` 是整個衡量迴路的基礎，如果拿不到數據，試用 Reel 就得手動在
  App 裡看，自動化的意義少一半。**第一支試用 Reel 發出後要去 insights 確認。**

## 順序
必須排在 T027 之後。T027 沒修好之前，新參數若被 API 拒，那一列會變成失敗，
而 Threads 那邊一列失敗就擋住整個帳號。兩張卡都動到 `FIELDS`，同一個 PR 一起上。

## 不要動
- 既有列的 `status`、`publish_at`、`caption`、`media` 內容
- `photos/`、`videos/`
- 不要新增任何 secret

## 來源
- https://developers.facebook.com/docs/instagram-platform/content-publishing/
- https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media
- https://developers.facebook.com/docs/instagram-platform/changelog

## 實作紀錄
2026-11-26 Claude 直接實作（Jim 說「你做」），未派給 Codex。
