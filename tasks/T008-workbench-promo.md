---
id: T008
title: 工作台 ④ 宣傳素材（輪播 4＋限動 3×中英＋三語文案）
status: backlog
runner: local   # 本機（Antigravity 或 Claude Code 本機版），要碰 Mac 檔案
size: S
---

## 為什麼
每場活動上線都要一套 IG 素材，版型固定，只換照片、數字和色票。

## 要做什麼
- 照 `workbench/SPEC.md` §5 ④，把 `reference/cloud/promo_1017.py` 改成範本：活動、照片、色票（Neon／Dressy／PJ）可選。
- 自動帶入張數、影片數、全部 Crush 場次總數；輸出到工作資料夾 `宣傳/` 並打包 zip。

## 驗收標準
- [ ] 用 10.17 跑出的 7 張圖版面與 `reference/cloud/promo_1017.py` 結果一致（附截圖）
- [ ] 文字不超出畫面、不互相重疊（中英兩版都檢查，限動底部「點連結 ↓」區域留空）
- [ ] 文案數字與網站資料一致

## 不要動
- 其他模組

## 實作紀錄
（Codex 完成後填寫）
