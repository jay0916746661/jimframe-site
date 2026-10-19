---
id: T012
title: n8n 流程範本：Google 表單 → 試算表 → LINE 通知
status: review
size: S
---

## 為什麼
AI 應用職缺最常問的實作是流程自動化。一份能匯入就跑的 n8n 範本，截圖就是作品。

## 要做什麼
- 新建 `automation/n8n-form-to-line/workflow.json`：Webhook（接 Google 表單 Apps Script 轉送）→ Google Sheets append → IF 金額 > 門檻 → HTTP Request 呼叫 LINE Messaging API push。
- `apps-script.gs`：表單送出時 POST 到 webhook 的最小程式。
- `README.md`：每個節點要填什麼憑證（不要放真的）、怎麼匯入、怎麼測試、免費方案限制。

## 驗收標準
- [ ] `workflow.json` 能在 n8n 1.x 匯入不報錯（寫明測試的版本）
- [ ] README 沒有任何真實 token 或 ID，全用 `<YOUR_...>` 占位
- [ ] 附一張流程圖截圖或 mermaid

## 不要動
- 其他目錄

## 實作紀錄
- 新增 `workflow.json`，串接 Webhook、Google Sheets append、金額 IF 與 LINE push HTTP Request。
- 新增表單綁定版 `apps-script.gs`，在提交時整理欄位並 POST JSON 到 n8n。
- 新增繁體中文 README，包含憑證、匯入、測試、免費方案限制與 Mermaid 流程圖。
- 使用 n8n `1.123.85` 執行 CLI 匯入，結果為 `Successfully imported 1 workflow.`。
