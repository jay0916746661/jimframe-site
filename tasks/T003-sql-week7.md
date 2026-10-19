---
id: T003
title: SQL 練習室加「第 7 週：面試延伸」5 題
status: review
size: S
---

## 為什麼
`sql/index.html` 是 Jim 自學 SQL 的練習頁（sql.js 在瀏覽器執行、自動對答案）。前六週已涵蓋基本查詢、分組、JOIN、視窗函數；面試常再問 CASE WHEN、日期差、多層 CTE、自我 JOIN。補一週讓它涵蓋完整。

## 要做什麼
- 在 `sql/index.html` 的 `WEEKS` 陣列最後新增一週 `第 7 週：面試延伸`，5 題，每題格式 `[標題, 題目說明, 參考答案 SQL]`，與現有題目一致。
- 5 題主題固定為：
  1. CASE WHEN 分級：把每筆 sales 依 `qty*unit_price` 分成 `小單(<5000)`、`中單(5000–29999)`、`大單(>=30000)`，依級距算筆數。欄位 `tier`、`n`，依 n 由大到小。
  2. 日期差：每位客戶最後一次購買距 `2026-09-30` 幾天（`julianday`），只列超過 90 天的。欄位 `customer_id`、`days_since`，由大到小。
  3. 多層 CTE：先算每品牌每月營收，再算每品牌「最好的一個月」的營收與年月。欄位 `brand_id`、`ym`、`revenue`。
  4. 自我 JOIN：找出同一客戶在同一天買過兩筆以上的日期。欄位 `customer_id`、`sale_date`、`n`，n 由大到小。
  5. 百分位：2026 年每位客戶營收，加一欄 `NTILE(4)` 的分位（1 為最高）。欄位 `customer_id`、`revenue`、`quartile`，依 revenue 由大到小。
- 題目說明用繁體中文，附提示（像現有題目那樣寫「提示：…」）。
- 參考答案必須能在現有的虛構資料上跑出至少 1 列結果（題 2 若資料跑出 0 列，把天數門檻改到會有結果的值，並在實作紀錄寫明）。

## 驗收標準
- [ ] 側欄出現「第 7 週：面試延伸」，共 35 題，頂端進度顯示 `x / 35`
- [ ] 5 題的參考答案按「看參考答案」後貼進去執行，全部顯示「對了」
- [ ] 現有 30 題的標題、說明、答案一字未改
- [ ] 手機寬度（390px）沒有水平捲動
- [ ] `node --check` 抽出的 script 無語法錯誤；若有 Playwright，`node scripts/smoke.mjs http://localhost:8000/sql/` 無 JS 錯誤

## 不要動
- 資料產生的程式（`BR`、`PR`、`CU`、`SA`、`ST`、`DEAD`、`CHURN`）
- 現有 CSS 與版面
- 對答案的邏輯（`run`、`norm`、`normUnordered`）

## 實作紀錄
（Codex 完成後填寫）
