---
id: T010
title: SQL 作品集：虛構樂器行資料庫＋10 個業務查詢＋README
status: backlog
size: M
---

## 為什麼
Jim 要轉職營運分析／業務企劃，需要一個能開給面試官看的 SQL 實戰證明。`sql/index.html` 的練習室已有一套虛構樂器行資料（在頁面 JS 裡用 sql.js 產生：brands、products、customers、sales），把它變成真的資料庫檔與一組回答業務問題的查詢。

## 要做什麼
- 新建 `portfolio/sql-shop/`。
- 寫 `build_db.py`（或 `build_db.mjs`）：從 `sql/index.html` 的資料產生邏輯重現同一套資料（直接複製產生程式碼即可，不要重新隨機），輸出 `data/brands.csv`、`products.csv`、`customers.csv`、`sales.csv` 與 `shop.sqlite`。
- `queries/01–10.sql`，每檔開頭註解寫「這個查詢回答什麼業務問題」：
  1. 各品牌逐年銷售額與年增率
  2. 前 5 商品佔總銷售額比例
  3. 一年內沒有任何銷售的商品清單
  4. 半年內沒下單的客戶（曾經有下單）
  5. 本月 vs 去年同月（任選最近有資料的月份）
  6. 商品 ABC 分級（累計銷售額 70／20／10）
  7. 各品類退貨率
  8. 各品牌毛利率（unit_price − cost）
  9. 各品牌可賣月數（假設庫存＝近 12 個月銷量的 1.5 倍，寫清楚假設）
  10. 淡旺季指數（各月銷售額 ÷ 月平均）
- `run_all.sh`：用 sqlite3 跑 10 個查詢，輸出到 `results/NN.txt`。
- `README.md`：資料說明、怎麼建、怎麼跑、每個查詢回答的業務問題與一句結論。

## 驗收標準
- [ ] `python3 build_db.py` 後 `shop.sqlite` 四張表筆數與 `sql/index.html` 練習室一致
- [ ] 10 個查詢都能跑，`results/` 有 10 個檔，沒有空結果
- [ ] `grep -ri` 整個資料夾找不到任何真實品牌名或客戶名（只允許練習室裡的虛構名）
- [ ] README 在手機上能讀，每個查詢有一句業務結論

## 不要動
- `sql/index.html` 不改
- 不加任何外部服務或付費套件
