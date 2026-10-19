---
id: T011
title: 作品集首頁：三張案例卡＋其他工具
status: backlog
size: S
---

## 為什麼
履歷上只放一個連結，點進去 10 秒內要看懂 Jim 做過什麼。現有頁面散在各處，需要一個入口。

## 要做什麼
- 新建 `portfolio/index.html`（靜態、只用 cdnjs、繁體中文、390px 無橫向捲動、深淺色皆可讀）。
- 內容從 `portfolio/content.json` 讀（先建一份占位內容，欄位：headline、cases[ {title, problem, approach, result, url} ]×3、others[ {title, url} ]×6）。
- 版面：一句定位 → 3 張案例卡（問題／做法／結果數字／「打開」按鈕）→ 「其他工具」一列小連結 → 底部聯絡方式占位。
- 不放任何真實公司、品牌、客戶名；數字一律指數化（例如「可賣月數從 9.2 降到 6.1」可以，金額不行）。

## 驗收標準
- [ ] 改 `content.json` 不用動 HTML 就能換內容
- [ ] 390px 與 1280px 截圖各一張放 PR
- [ ] `node scripts/smoke.mjs` 通過（如果 smoke 不涵蓋此頁，加一條檢查頁面能載入且無 console error）

## 不要動
- 其他目錄
