# 相簿與活動資料

資料以 JSON 陣列儲存，請使用雙引號，最後一筆後面不要加逗號。透過 HTTP 開啟網站以載入資料。

## 新增相簿

在 albums.json 加入一筆，date 為四碼月日、venue 為場地名稱、folder 為 Google Drive 資料夾 ID、photos 為照片檔案 ID 陣列。保留既有資料與順序，新相簿放在最前面。以下 ID 請換成實際值：

```json
{
  "date": "1016",
  "venue": "Flow",
  "folder": "資料夾ID",
  "photos": [
    "照片ID"
  ]
}
```

## 新增活動

在 events.json 加入一筆，例如：

```json
{
  "date": "2026-10-16",
  "start": "21:00",
  "end": "01:00",
  "title": "Flow 週五舞會",
  "organizer": {
    "name": "Flow"
  },
  "venue": "Flow",
  "series": "Flow",
  "tentative": true
}
```

新增活動：在 events.json 加一筆。活動結束後會自動隱藏；沒有活動時整區不顯示。
  date: "2026-10-16"   start: "21:00"   end: "01:00"（可省略，預設 4 小時；跨午夜會自動算到隔天）
  title: 活動名稱      organizer: { name: "主辦名稱", instagram: "IG帳號（不含 @）" }
  venue: 場地名稱      series: 對應相簿的場地（Flow / Barcade / La Salsa / Odoro / Zouk）
                       → 自動用「這個場地上一場的照片」當封面，並出現「上次照片」按鈕
  cover: 指定封面照片的 Drive 檔案 ID（可省略）   color: 標籤顏色（可省略）   note: 一行補充（可省略）
  tentative: true  → 顯示「預計」（依往常行程推估、還沒確認）
  沒有 date → 顯示「日期待公布」，排在最後；沒有 start → 顯示「時間以主辦公告為準」
  activity: 當晚的現場企劃（一行）

活動陣列為 [] 時隱藏整區；日期尚未確定時省略 date。
