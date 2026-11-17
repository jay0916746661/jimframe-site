---
id: T025
title: ig_insights 加抓粉絲所在地與年齡
status: backlog
size: S
---

## 為什麼
Jim 要開始找台北的店家與藝文空間談合作。店家在意的是「你的讀者在不在我附近」，
而不是總粉絲數。目前 `tools/meta-poster/ig_insights.py` 只抓每則貼文的成效，
沒有抓帳號層級的受眾輪廓，所以「台北佔比」這個最關鍵的談判數字拿不到。

## 要做什麼
- 在 `tools/meta-poster/ig_insights.py` 加一段帳號層級的受眾查詢，對每個有綁
  `instagram_business_account` 的帳號呼叫：
  `GET /{ig-user-id}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=city`
  另外各跑一次 `breakdown=country` 與 `breakdown=age`。
- 寫出 `social/insights/ig_audience_<YYYYMMDD>.csv`，欄位：
  `username,breakdown,value,count`（例如 `coffeestory101,city,Taipei City,142`）。
- IG 規定追蹤數不足 100 的帳號不回傳受眾資料。遇到這種帳號不要讓整支程式失敗，
  在該帳號寫一列 `username,note,追蹤數不足100,0` 然後繼續跑下一個。
- 既有的每則貼文成效流程、輸出檔名與欄位都不要改，這是新增一個獨立輸出。
- 權限不足（缺 `instagram_manage_insights`）時比照現有作法：印出說明、略過、不中斷。
- 在 `tools/meta-poster/README.md` 補一段說明新輸出檔與欄位。

## 驗收標準
- [ ] 跑 `python tools/meta-poster/ig_insights.py` 會多產生一支 `ig_audience_<日期>.csv`
- [ ] 追蹤數不足 100 的帳號（如 socialdance101、untold.trip0）不會讓程式中斷
- [ ] 原本的 `ig_insights_<日期>.csv` 內容與欄位沒有變動
- [ ] 任一指標不支援或權限不足時，程式印出原因並繼續，結束碼為 0
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- `tools/meta-poster/ig_publish.py`、`fb_publish.py`、兩支佇列 csv
- `social/insights/` 底下已經存在的檔案
- 不要新增任何 secret

## 實作紀錄
（Codex 完成後填寫）
