---
id: T016
title: iPAS 練習頁：讀 JSON 題庫、隨機出題、記錄弱項
status: backlog
size: S
---

## 為什麼
Jim 準備 iPAS AI 應用規劃師初級。題目會從 NotebookLM／Gemini 產出（JSON），需要一個手機上能練、會記哪個主題最弱的頁面。

## 要做什麼
- 新建 `ipas/index.html`＋`ipas/questions.json`（格式：`[{id, topic, q, options:[4], answer:0-3, why, source}]`，先放 10 題占位，標明是範例）。
- 功能：每次隨機 10 題；答完顯示對錯與解析；localStorage 記每題答過幾次、答錯幾次；「弱項」區依 topic 顯示錯誤率；「只練錯過的」按鈕。
- 匯入：頁面上有一個文字框可以貼 JSON 追加題目（存 localStorage，不改檔）。

## 驗收標準
- [ ] 貼 5 題 JSON 進去，下一輪會抽到
- [ ] 390px 無橫向捲動、無 console error
- [ ] 清除 localStorage 後頁面仍正常

## 不要動
- 其他目錄
